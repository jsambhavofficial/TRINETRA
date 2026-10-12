"""
TRINETRA Phase 3 — Governance Intelligence, Explainable AI & Alerts Router.
Provides endpoints for:
- Role-scoped governance intelligence & ageing metrics
- Traceable drill-down to authorized source records
- Anomaly indicators and repeated issue clusters
- Configurable SLA alert rules & lifecycle actions
- Provider-independent AI assistance (classification, summarization, escalation memos)
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, get_optional_user, require_role
from app.db.session import get_db
from app.models.organization import UserModel
from app.services.intelligence_service import intelligence_service
from app.services.alert_service import alert_service
from app.services.ai_provider import ai_provider

router = APIRouter(prefix="/intelligence", tags=["TRINETRA Governance Intelligence"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class DrilldownRequest(BaseModel):
    record_ids: List[str]


class AlertResolveRequest(BaseModel):
    notes: str = Field(min_length=3, max_length=1000)


class SLAConfigUpdateRequest(BaseModel):
    thresholds: Dict[str, float]


class AIClassifyRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=5, max_length=2000)
    district_id: Optional[str] = None


class AIEscalationRequest(BaseModel):
    complaint_id: str
    reason: str = Field(min_length=5, max_length=500)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/overview")
async def get_intelligence_overview(
    time_window_days: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Computes role-scoped governance intelligence overview, ageing buckets,
    repeated clusters, and evidence-backed anomaly signals from authorized DB records.
    """
    return await intelligence_service.get_governance_overview(
        db=db,
        user=current_user,
        time_window_days=time_window_days,
    )


@router.post("/drilldown")
async def get_drilldown_records(
    req: DrilldownRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Returns full record metadata for a list of record IDs.
    Enforces that the caller has jurisdictional permission to view each record.
    """
    return await intelligence_service.get_drilldown_records(
        db=db,
        user=current_user,
        record_ids=req.record_ids,
    )


@router.get("/alerts")
async def list_governance_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Returns auditable governance alerts scoped to the caller's jurisdiction.
    """
    alerts = await alert_service.list_alerts(
        db=db,
        user=current_user,
        status=status_filter,
        severity=severity_filter,
    )
    return [
        {
            "id": a.id,
            "rule_id": a.rule_id,
            "title": a.title,
            "severity": a.severity,
            "status": a.status,
            "district_id": a.district_id,
            "department_id": a.department_id,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "trigger_reason": a.trigger_reason,
            "sla_configured_hours": a.sla_configured_hours,
            "elapsed_hours": a.elapsed_hours,
            "acknowledged_by": a.acknowledged_by,
            "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
            "resolved_by": a.resolved_by,
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            "resolution_notes": a.resolution_notes,
            "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]


@router.post("/alerts/scan")
async def scan_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(["PLATFORM_ADMIN", "STATE_LEADERSHIP", "DISTRICT_ADMIN", "DEPARTMENT"])),
):
    """
    Triggers an on-demand scan of active complaints against configured SLA rules.
    Emits alerts for newly detected SLA breaches.
    """
    created = await alert_service.scan_and_generate_alerts(db)
    return {
        "status": "COMPLETED",
        "new_alerts_created": len(created),
        "created_alert_ids": [a.id for a in created],
    }


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(["PLATFORM_ADMIN", "STATE_LEADERSHIP", "DISTRICT_ADMIN", "DEPARTMENT"])),
):
    """
    Marks an alert as acknowledged by the current officer.
    """
    try:
        updated = await alert_service.acknowledge_alert(db, alert_id, current_user)
        return {
            "status": "SUCCESS",
            "alert_id": updated.id,
            "alert_status": updated.status,
            "acknowledged_by": updated.acknowledged_by,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    req: AlertResolveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(["PLATFORM_ADMIN", "STATE_LEADERSHIP", "DISTRICT_ADMIN", "DEPARTMENT"])),
):
    """
    Marks an alert as resolved with recorded remediation notes.
    """
    try:
        updated = await alert_service.resolve_alert(db, alert_id, current_user, req.notes)
        return {
            "status": "SUCCESS",
            "alert_id": updated.id,
            "alert_status": updated.status,
            "resolved_by": updated.resolved_by,
            "resolution_notes": updated.resolution_notes,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/alerts/config")
async def get_sla_config(
    current_user: UserModel = Depends(get_current_user),
):
    """Returns current configurable SLA rule thresholds."""
    return alert_service.get_config()


@router.put("/alerts/config")
async def update_sla_config(
    req: SLAConfigUpdateRequest,
    current_user: UserModel = Depends(require_role(["PLATFORM_ADMIN", "STATE_LEADERSHIP"])),
):
    """Updates configurable SLA rule thresholds without modifying source code."""
    updated = alert_service.update_config(req.thresholds)
    return {"status": "UPDATED", "config": updated}


# ---------------------------------------------------------------------------
# AI Assistance Endpoints
# ---------------------------------------------------------------------------
@router.post("/ai/classify")
async def ai_suggest_classification(
    req: AIClassifyRequest,
    current_user: Optional[UserModel] = Depends(get_optional_user),
):
    """
    Provides deterministic / model-abstracted suggestion for category and departmental routing.
    Grounded in input text and controlled Haryana taxonomy.
    """
    class_res = await ai_provider.suggest_classification(req.title, req.description)
    routing_res = await ai_provider.suggest_routing(req.title, req.description, req.district_id)

    return {
        "classification": class_res,
        "routing": routing_res,
        "disclaimer": "AI suggestion provided as decision support for human review. Does not alter record state.",
    }


@router.post("/ai/draft-escalation")
async def ai_draft_escalation_memo(
    req: AIEscalationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(["PLATFORM_ADMIN", "STATE_LEADERSHIP", "DISTRICT_ADMIN", "DEPARTMENT"])),
):
    """
    Drafts an administrative escalation memorandum grounded strictly in the target complaint record.
    Requires human supervisor approval before transmission.
    """
    from app.models.complaint import ComplaintModel
    c = await db.get(ComplaintModel, req.complaint_id)
    if not c:
        raise HTTPException(status_code=404, detail=f"Complaint {req.complaint_id} not found")

    draft_res = await ai_provider.generate_escalation_draft(
        record={
            "id": c.id,
            "tracking_id": c.tracking_id,
            "title": c.title,
            "priority": c.priority,
            "district_name": c.district_name,
            "department_name": c.department_name,
        },
        reason=req.reason,
    )
    return draft_res
