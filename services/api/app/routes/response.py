"""
NEXUS Phase 5 — AI Response Planner, Authorization & Safe Action Execution Router.
Endpoints:
- GET /api/v1/incidents/{incident_id}/response-plan
- POST /api/v1/actions/{action_id}/approve
- POST /api/v1/actions/{action_id}/execute
- POST /api/v1/incidents/{incident_id}/verify
- GET /api/v1/actions
"""
from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.permissions import require_permission
from app.db.session import get_db
from app.models.response import ActionExecutionModel
from app.services.response_service import response_service

router = APIRouter(prefix="", tags=["Response Planning & Authorization"])


class ActionApprovalRequest(BaseModel):
    actor: str = "Commander Vikram Malhotra"
    notes: Optional[str] = "Approved via Operational Command Center"


@router.get("/incidents/{incident_id}/response-plan")
async def get_response_plan(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("plans:generate"))
):
    """Generates or retrieves the AI operational response plan for an incident."""
    result = await response_service.get_or_generate_plan(incident_id, db)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    return result


@router.post("/actions/{action_id}/approve")
async def approve_action(
    action_id: str,
    req: Optional[ActionApprovalRequest] = None,
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("actions:approve"))
):
    """Commander approves an operational response action."""
    actor = req.actor if req else "Commander Vikram Malhotra"
    notes = req.notes if req else None
    return await response_service.approve_action(action_id, actor=actor, notes=notes, db=db)


@router.post("/actions/{action_id}/execute")
async def execute_action(
    action_id: str,
    actor: str = Form(default="Commander Vikram Malhotra"),
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("actions:execute"))
):
    """Executes an approved response action safely within demo operational boundaries."""
    result = await response_service.execute_action(action_id, actor=actor, db=db)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    return result


@router.post("/incidents/{incident_id}/verify")
async def verify_incident_closed_loop(
    incident_id: str,
    actor: str = Form(default="Commander Vikram Malhotra"),
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("actions:execute"))
):
    """
    Executes the closed-loop verification:
    Compares real-time drone telemetry against initial conditions, marks incident RESOLVED,
    and updates world state.
    """
    result = await response_service.verify_closed_loop(incident_id, actor=actor, db=db)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    return result


@router.get("/actions")
async def list_actions(
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("incidents:read"))
):
    """Lists all active and recorded response actions."""
    res = await db.execute(select(ActionExecutionModel).order_by(ActionExecutionModel.created_at.desc()))
    actions = res.scalars().all()
    return [
        {
            "id": a.id,
            "plan_id": a.plan_id,
            "incident_id": a.incident_id,
            "action_type": a.action_type,
            "title": a.title,
            "description": a.description,
            "target_entity_id": a.target_entity_id,
            "target_asset_id": a.target_asset_id,
            "status": a.status,
            "actor": a.actor,
            "approved_at": a.approved_at.isoformat() if a.approved_at else None,
            "executed_at": a.executed_at.isoformat() if a.executed_at else None,
            "verified_at": a.verified_at.isoformat() if a.verified_at else None,
        }
        for a in actions
    ]
