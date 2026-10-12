"""
TRINETRA Phase 3 — Governance Intelligence Engine Service.
Derives verifiable, auditable governance insights from authorized database records.
Enforces strict zero-hallucination, explicit provenance, and role-based jurisdictional scoping.
"""
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.complaint import ComplaintModel
from app.models.incident import IncidentModel
from app.models.audit import AuditEventModel
from app.models.alert import AlertModel
from app.models.organization import UserModel
from app.services.fusion_engine import haversine_distance_m


class GovernanceIntelligenceService:
    @staticmethod
    def _calculate_age_hours(created_at: datetime) -> float:
        now = datetime.now(timezone.utc)
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        return max(0.0, (now - created_at).total_seconds() / 3600.0)

    async def get_governance_overview(
        self,
        db: AsyncSession,
        user: UserModel,
        time_window_days: int = 30
    ) -> Dict[str, Any]:
        """
        Computes role-scoped governance intelligence:
        - Workload & status distributions
        - Ageing analysis (<24h, 24-48h, 48-72h, >72h)
        - Repeated issue clusters
        - Anomaly indicators with explicit trigger logic
        - Data freshness and completeness metadata
        """
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(days=time_window_days)

        # 1. Base Query with Scope Enforcement
        stmt = select(ComplaintModel).where(ComplaintModel.created_at >= cutoff)
        if user.role == "DISTRICT_ADMIN":
            stmt = stmt.where(ComplaintModel.district_id == (user.district_id or "HR-GU"))
        elif user.role == "DEPARTMENT":
            stmt = stmt.where(ComplaintModel.department_id == (user.department_id or "DEPT-PWD"))
        elif user.role == "CITIZEN":
            stmt = stmt.where(ComplaintModel.citizen_id == user.id)

        result = await db.execute(stmt)
        complaints: List[ComplaintModel] = result.scalars().all()

        total_count = len(complaints)
        by_status: Dict[str, int] = {}
        by_priority: Dict[str, int] = {}
        by_category: Dict[str, int] = {}
        by_district: Dict[str, int] = {}
        by_department: Dict[str, int] = {}

        # Ageing Buckets for Active/Pending cases
        ageing_buckets = {
            "under_24h": 0,
            "24_to_48h": 0,
            "48_to_72h": 0,
            "over_72h": 0,
        }
        active_ids_by_ageing = {
            "under_24h": [],
            "24_to_48h": [],
            "48_to_72h": [],
            "over_72h": [],
        }

        reopened_count = 0
        resolved_count = 0
        insufficient_proof_count = 0
        resolution_durations_hours = []

        for c in complaints:
            by_status[c.status] = by_status.get(c.status, 0) + 1
            by_priority[c.priority] = by_priority.get(c.priority, 0) + 1
            by_category[c.category] = by_category.get(c.category, 0) + 1
            by_district[c.district_id] = by_district.get(c.district_id, 0) + 1
            by_department[c.department_id] = by_department.get(c.department_id, 0) + 1

            age_h = self._calculate_age_hours(c.created_at)

            if c.status not in ("RESOLVED", "REJECTED"):
                if age_h < 24:
                    ageing_buckets["under_24h"] += 1
                    active_ids_by_ageing["under_24h"].append(c.id)
                elif age_h < 48:
                    ageing_buckets["24_to_48h"] += 1
                    active_ids_by_ageing["24_to_48h"].append(c.id)
                elif age_h < 72:
                    ageing_buckets["48_to_72h"] += 1
                    active_ids_by_ageing["48_to_72h"].append(c.id)
                else:
                    ageing_buckets["over_72h"] += 1
                    active_ids_by_ageing["over_72h"].append(c.id)

            if c.status == "REOPENED":
                reopened_count += 1

            if c.status == "RESOLVED":
                resolved_count += 1
                if c.resolved_at:
                    c_res = c.resolved_at if c.resolved_at.tzinfo else c.resolved_at.replace(tzinfo=timezone.utc)
                    c_cr = c.created_at if c.created_at.tzinfo else c.created_at.replace(tzinfo=timezone.utc)
                    dur = max(0.0, (c_res - c_cr).total_seconds() / 3600.0)
                    resolution_durations_hours.append(dur)
                # Check proof adequacy
                if not c.resolution_proof:
                    insufficient_proof_count += 1

        # Calculate Average Resolution Turnaround
        avg_resolution_hours = (
            round(sum(resolution_durations_hours) / len(resolution_durations_hours), 1)
            if resolution_durations_hours else None
        )

        # 2. Repeated Issue Clusters (by Category & Proximity < 2.0km)
        repeated_clusters = self._cluster_repeated_issues(complaints)

        # 3. Evidence-Backed Anomaly Indicators
        anomalies = []
        if ageing_buckets["over_72h"] > 0:
            anomalies.append({
                "type": "CHRONIC_BACKLOG_DELAY",
                "severity": "HIGH",
                "title": f"{ageing_buckets['over_72h']} cases pending over 72 hours",
                "evidence": f"Calculated from {ageing_buckets['over_72h']} unfinalized complaints exceeding standard 3-day turnaround.",
                "affected_record_ids": active_ids_by_ageing["over_72h"],
                "trigger_metric": "ageing.over_72h > 0"
            })

        reopen_rate = (reopened_count / resolved_count * 100) if resolved_count > 0 else 0.0
        if reopen_rate > 15.0 or reopened_count > 0:
            anomalies.append({
                "type": "HIGH_RESOLUTION_CONTESTATION",
                "severity": "MEDIUM",
                "title": f"Citizen dispute/reopen rate at {round(reopen_rate, 1)}%",
                "evidence": f"{reopened_count} complaints reopened by citizens after supervisor resolution marking.",
                "affected_record_ids": [c.id for c in complaints if c.status == "REOPENED"],
                "trigger_metric": "reopened_count > 0"
            })

        if insufficient_proof_count > 0:
            anomalies.append({
                "type": "UNVERIFIED_RESOLUTION_CLOSURE",
                "severity": "HIGH",
                "title": f"{insufficient_proof_count} resolutions lack completion photo/SOP proof",
                "evidence": "Complaints were marked RESOLVED without attaching cryptographic verification media or field checklist.",
                "affected_record_ids": [c.id for c in complaints if c.status == "RESOLVED" and not c.resolution_proof],
                "trigger_metric": "resolution_proof is empty"
            })

        # 4. Data Sufficiency Disclaimer
        has_sufficient_data = total_count >= 5
        data_notice = (
            "Sufficient sample size for operational analytics."
            if has_sufficient_data
            else "Sample size below baseline threshold (N < 5). Trend extrapolation is suppressed to prevent statistical skew."
        )

        return {
            "time_window_days": time_window_days,
            "data_freshness_iso": now.isoformat(),
            "sample_size": total_count,
            "has_sufficient_data": has_sufficient_data,
            "data_notice": data_notice,
            "caller_scope": {
                "role": user.role,
                "district_id": user.district_id,
                "department_id": user.department_id,
            },
            "metrics": {
                "total_complaints": total_count,
                "active_complaints": total_count - resolved_count,
                "resolved_complaints": resolved_count,
                "reopened_complaints": reopened_count,
                "avg_resolution_hours": avg_resolution_hours,
                "by_status": by_status,
                "by_priority": by_priority,
                "by_category": by_category,
                "by_district": by_district,
                "by_department": by_department,
            },
            "ageing": {
                "buckets": ageing_buckets,
                "affected_ids": active_ids_by_ageing
            },
            "repeated_clusters": repeated_clusters,
            "anomalies": anomalies,
        }

    def _cluster_repeated_issues(self, complaints: List[ComplaintModel]) -> List[Dict[str, Any]]:
        """
        Groups complaints within 2.0km of each other sharing the same category.
        Avoids manufacturing clusters when complaints are singletons.
        """
        clusters: List[Dict[str, Any]] = []
        visited = set()

        for i, c1 in enumerate(complaints):
            if c1.id in visited:
                continue
            if c1.latitude is None or c1.longitude is None:
                continue

            group = [c1]
            for j, c2 in enumerate(complaints):
                if i != j and c2.id not in visited:
                    if c2.latitude is not None and c2.longitude is not None:
                        if c1.category == c2.category:
                            dist = haversine_distance_m(c1.latitude, c1.longitude, c2.latitude, c2.longitude)
                            if dist <= 2000.0:  # 2 km
                                group.append(c2)

            if len(group) >= 2:
                for item in group:
                    visited.add(item.id)

                avg_lat = sum(g.latitude for g in group) / len(group)
                avg_lng = sum(g.longitude for g in group) / len(group)

                clusters.append({
                    "cluster_id": f"clst-{group[0].category.lower()}-{len(clusters) + 1}",
                    "category": group[0].category,
                    "district_id": group[0].district_id,
                    "district_name": group[0].district_name,
                    "report_count": len(group),
                    "coordinates": {"latitude": round(avg_lat, 5), "longitude": round(avg_lng, 5)},
                    "sample_title": group[0].title,
                    "member_record_ids": [g.id for g in group],
                    "member_tracking_ids": [g.tracking_id for g in group],
                    "explanation": f"{len(group)} related {group[0].category} reports detected within 2.0 km radius."
                })

        return clusters

    async def get_drilldown_records(
        self,
        db: AsyncSession,
        user: UserModel,
        record_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Fetches full records for a drill-down list, strictly validating caller authorization.
        """
        if not record_ids:
            return []

        stmt = select(ComplaintModel).where(ComplaintModel.id.in_(record_ids))
        if user.role == "DISTRICT_ADMIN":
            stmt = stmt.where(ComplaintModel.district_id == (user.district_id or "HR-GU"))
        elif user.role == "DEPARTMENT":
            stmt = stmt.where(ComplaintModel.department_id == (user.department_id or "DEPT-PWD"))
        elif user.role == "CITIZEN":
            stmt = stmt.where(ComplaintModel.citizen_id == user.id)

        res = await db.execute(stmt)
        records = res.scalars().all()

        return [
            {
                "id": r.id,
                "tracking_id": r.tracking_id,
                "title": r.title,
                "category": r.category,
                "district_id": r.district_id,
                "district_name": r.district_name,
                "department_id": r.department_id,
                "department_name": r.department_name,
                "status": r.status,
                "priority": r.priority,
                "address": r.address,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "created_at": r.created_at.isoformat(),
                "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
                "has_proof": bool(r.resolution_proof),
            }
            for r in records
        ]


intelligence_service = GovernanceIntelligenceService()
