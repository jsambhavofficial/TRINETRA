"""
TRINETRA Phase 3 — Governance Alert & Escalation Service.
Manages configurable SLA thresholds, rule evaluations, alert lifecycle, and audit logs.
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.alert import AlertModel
from app.models.audit import AuditEventModel
from app.models.complaint import ComplaintModel
from app.models.organization import UserModel
from app.services.event_hub import event_hub


# Configurable SLA Rules (hours) with Demonstration Defaults
DEFAULT_SLA_CONFIG = {
    "UNACKNOWLEDGED_CRITICAL_HOURS": 4.0,
    "UNACKNOWLEDGED_NORMAL_HOURS": 24.0,
    "RESOLUTION_CRITICAL_HOURS": 24.0,
    "RESOLUTION_HIGH_HOURS": 48.0,
    "RESOLUTION_NORMAL_HOURS": 72.0,
    "UNASSIGNED_HIGH_HOURS": 2.0,
    "STALLED_VALIDATION_HOURS": 24.0,
}


class GovernanceAlertService:
    def __init__(self):
        self.config = dict(DEFAULT_SLA_CONFIG)

    def get_config(self) -> Dict[str, float]:
        return dict(self.config)

    def update_config(self, updates: Dict[str, float]) -> Dict[str, float]:
        for k, v in updates.items():
            if k in self.config and isinstance(v, (int, float)) and v > 0:
                self.config[k] = float(v)
        return dict(self.config)

    async def scan_and_generate_alerts(self, db: AsyncSession) -> List[AlertModel]:
        """
        Scans current complaints and triggers alerts for SLA breaches or anomalies.
        Idempotent: prevents duplicate open alerts for the same condition and entity.
        """
        now = datetime.now(timezone.utc)
        created_alerts = []

        # Fetch active complaints
        c_res = await db.execute(
            select(ComplaintModel).where(ComplaintModel.status.notin_(["RESOLVED", "REJECTED"]))
        )
        active_complaints = c_res.scalars().all()

        for c in active_complaints:
            c_created = c.created_at if c.created_at.tzinfo else c.created_at.replace(tzinfo=timezone.utc)
            elapsed_h = max(0.0, (now - c_created).total_seconds() / 3600.0)

            # Rule 1: UNACKNOWLEDGED_SLA
            if c.status == "SUBMITTED":
                limit_h = (
                    self.config["UNACKNOWLEDGED_CRITICAL_HOURS"]
                    if c.priority == "CRITICAL"
                    else self.config["UNACKNOWLEDGED_NORMAL_HOURS"]
                )
                if elapsed_h > limit_h:
                    alt = await self._create_alert_if_not_exists(
                        db=db,
                        rule_id="UNACKNOWLEDGED_SLA",
                        title=f"{c.priority} Complaint pending acknowledgment > {limit_h}h",
                        severity="CRITICAL" if c.priority == "CRITICAL" else "HIGH",
                        district_id=c.district_id,
                        department_id=c.department_id,
                        entity_type="COMPLAINT",
                        entity_id=c.id,
                        trigger_reason=f"Complaint '{c.title}' has remained in SUBMITTED state for {round(elapsed_h, 1)}h (configured SLA: {limit_h}h).",
                        sla_configured_hours=limit_h,
                        elapsed_hours=round(elapsed_h, 1),
                        metadata={"tracking_id": c.tracking_id, "priority": c.priority},
                    )
                    if alt:
                        created_alerts.append(alt)

            # Rule 2: UNASSIGNED_HIGH_PRIORITY
            if c.status in ("ACKNOWLEDGED", "UNDER_REVIEW", "VERIFIED") and not c.assigned_unit_id:
                if c.priority in ("CRITICAL", "HIGH") and elapsed_h > self.config["UNASSIGNED_HIGH_HOURS"]:
                    alt = await self._create_alert_if_not_exists(
                        db=db,
                        rule_id="UNASSIGNED_HIGH_PRIORITY",
                        title=f"{c.priority} Priority Complaint unassigned to field unit",
                        severity="HIGH",
                        district_id=c.district_id,
                        department_id=c.department_id,
                        entity_type="COMPLAINT",
                        entity_id=c.id,
                        trigger_reason=f"No field response team assigned after {round(elapsed_h, 1)}h for {c.priority} severity complaint.",
                        sla_configured_hours=self.config["UNASSIGNED_HIGH_HOURS"],
                        elapsed_hours=round(elapsed_h, 1),
                        metadata={"tracking_id": c.tracking_id, "department": c.department_id},
                    )
                    if alt:
                        created_alerts.append(alt)

            # Rule 3: RESOLUTION_OVERDUE
            if c.status in ("IN_PROGRESS", "ASSIGNED"):
                limit_h = (
                    self.config["RESOLUTION_CRITICAL_HOURS"]
                    if c.priority == "CRITICAL"
                    else (self.config["RESOLUTION_HIGH_HOURS"] if c.priority == "HIGH" else self.config["RESOLUTION_NORMAL_HOURS"])
                )
                if elapsed_h > limit_h:
                    alt = await self._create_alert_if_not_exists(
                        db=db,
                        rule_id="RESOLUTION_OVERDUE",
                        title=f"Resolution overdue on {c.tracking_id} ({c.priority})",
                        severity="HIGH" if c.priority != "CRITICAL" else "CRITICAL",
                        district_id=c.district_id,
                        department_id=c.department_id,
                        entity_type="COMPLAINT",
                        entity_id=c.id,
                        trigger_reason=f"Active remediation has taken {round(elapsed_h, 1)}h, exceeding maximum SLA threshold of {limit_h}h.",
                        sla_configured_hours=limit_h,
                        elapsed_hours=round(elapsed_h, 1),
                        metadata={"tracking_id": c.tracking_id, "assigned_unit": c.assigned_unit_id},
                    )
                    if alt:
                        created_alerts.append(alt)

            # Rule 4: STALLED_VALIDATION
            if c.status == "AWAITING_VALIDATION":
                if elapsed_h > self.config["STALLED_VALIDATION_HOURS"]:
                    alt = await self._create_alert_if_not_exists(
                        db=db,
                        rule_id="STALLED_VALIDATION",
                        title=f"Resolution proof review stalled on {c.tracking_id}",
                        severity="MEDIUM",
                        district_id=c.district_id,
                        department_id=c.department_id,
                        entity_type="COMPLAINT",
                        entity_id=c.id,
                        trigger_reason=f"Field officer submitted completion proof, but departmental verification is pending for > {self.config['STALLED_VALIDATION_HOURS']}h.",
                        sla_configured_hours=self.config["STALLED_VALIDATION_HOURS"],
                        elapsed_hours=round(elapsed_h, 1),
                        metadata={"tracking_id": c.tracking_id},
                    )
                    if alt:
                        created_alerts.append(alt)

        if created_alerts:
            await db.commit()

        return created_alerts

    async def _create_alert_if_not_exists(
        self,
        db: AsyncSession,
        rule_id: str,
        title: str,
        severity: str,
        district_id: Optional[str],
        department_id: Optional[str],
        entity_type: str,
        entity_id: str,
        trigger_reason: str,
        sla_configured_hours: float,
        elapsed_hours: float,
        metadata: Dict[str, Any],
    ) -> Optional[AlertModel]:
        # Check if active alert already exists
        q = select(AlertModel).where(
            and_(
                AlertModel.rule_id == rule_id,
                AlertModel.entity_id == entity_id,
                AlertModel.status.in_(["TRIGGERED", "ACKNOWLEDGED"])
            )
        )
        existing = (await db.execute(q)).scalars().first()
        if existing:
            return None

        alert_id = f"alt-{uuid.uuid4().hex[:12]}"
        alt = AlertModel(
            id=alert_id,
            rule_id=rule_id,
            title=title,
            severity=severity,
            status="TRIGGERED",
            district_id=district_id,
            department_id=department_id,
            entity_type=entity_type,
            entity_id=entity_id,
            trigger_reason=trigger_reason,
            sla_configured_hours=sla_configured_hours,
            elapsed_hours=elapsed_hours,
            metadata_json=metadata,
            is_synthetic=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(alt)

        # Audit Event
        db.add(
            AuditEventModel(
                actor_type="ALERT_ENGINE",
                actor_id="system-sla-watcher",
                event_type="GOVERNANCE_ALERT_TRIGGERED",
                entity_type="ALERT",
                entity_id=alert_id,
                metadata_json={
                    "rule_id": rule_id,
                    "target_entity": entity_id,
                    "severity": severity,
                    "trigger_reason": trigger_reason,
                },
                created_at=datetime.now(timezone.utc),
            )
        )

        return alt

    async def list_alerts(
        self,
        db: AsyncSession,
        user: UserModel,
        status: Optional[str] = None,
        severity: Optional[str] = None,
    ) -> List[AlertModel]:
        stmt = select(AlertModel).order_by(AlertModel.created_at.desc())

        # Scoping
        if user.role == "DISTRICT_ADMIN":
            stmt = stmt.where(AlertModel.district_id == (user.district_id or "HR-GU"))
        elif user.role == "DEPARTMENT":
            stmt = stmt.where(AlertModel.department_id == (user.department_id or "DEPT-PWD"))
        elif user.role == "CITIZEN":
            return []  # Alerts are governance/operational

        if status:
            stmt = stmt.where(AlertModel.status == status.upper())
        if severity:
            stmt = stmt.where(AlertModel.severity == severity.upper())

        res = await db.execute(stmt)
        return res.scalars().all()

    async def acknowledge_alert(
        self,
        db: AsyncSession,
        alert_id: str,
        user: UserModel,
    ) -> AlertModel:
        alt = await db.get(AlertModel, alert_id)
        if not alt:
            raise ValueError(f"Alert {alert_id} not found")

        alt.status = "ACKNOWLEDGED"
        alt.acknowledged_by = user.id
        alt.acknowledged_at = datetime.now(timezone.utc)

        db.add(
            AuditEventModel(
                actor_type="USER",
                actor_id=user.id,
                event_type="ALERT_ACKNOWLEDGED",
                entity_type="ALERT",
                entity_id=alt.id,
                metadata_json={"actor_role": user.role, "rule_id": alt.rule_id},
                created_at=datetime.now(timezone.utc),
            )
        )
        await db.commit()
        await db.refresh(alt)
        return alt

    async def resolve_alert(
        self,
        db: AsyncSession,
        alert_id: str,
        user: UserModel,
        notes: str,
    ) -> AlertModel:
        alt = await db.get(AlertModel, alert_id)
        if not alt:
            raise ValueError(f"Alert {alert_id} not found")

        alt.status = "RESOLVED"
        alt.resolved_by = user.id
        alt.resolved_at = datetime.now(timezone.utc)
        alt.resolution_notes = notes

        db.add(
            AuditEventModel(
                actor_type="USER",
                actor_id=user.id,
                event_type="ALERT_RESOLVED",
                entity_type="ALERT",
                entity_id=alt.id,
                metadata_json={"actor_role": user.role, "rule_id": alt.rule_id, "resolution_notes": notes},
                created_at=datetime.now(timezone.utc),
            )
        )
        await db.commit()
        await db.refresh(alt)
        return alt


alert_service = GovernanceAlertService()
