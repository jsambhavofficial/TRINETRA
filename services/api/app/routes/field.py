"""
AEGIS — Field Operations & Closed Operational Loop Router.
Endpoints for:
- Community Corroboration & Nearby Reports (Citizen Portal)
- Citizen Confirmation & Reopen Loop
- Field Officer Assignment, Dispatch, SOP & Proof of Work
- Authority Validation & Confirmation
- Deterministic 20-Step Judge Mode Scenario
"""
from typing import Optional
from fastapi import APIRouter, Depends, Form, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.field_service import field_service

router = APIRouter(prefix="", tags=["Field Operations & Verification Loop"])


class CorroborateRequest(BaseModel):
    citizen_token: str
    latitude: Optional[float] = 26.9180
    longitude: Optional[float] = 75.7920
    comment: Optional[str] = None
    evidence_uri: Optional[str] = None


class CitizenFeedbackRequest(BaseModel):
    citizen_token: str
    is_resolved: bool
    reopen_reason: Optional[str] = None
    reopen_evidence_uri: Optional[str] = None


class DispatchUnitRequest(BaseModel):
    unit_id: str = "UNIT-04"
    actor: Optional[str] = "Field Officer"


class StatusUpdateRequest(BaseModel):
    status: str
    actor: Optional[str] = "Field Officer"


class SOPUpdateRequest(BaseModel):
    step_id: str
    completed: bool
    actor: Optional[str] = "Field Officer"


class SubmitProofRequest(BaseModel):
    before_photo: str
    after_photo: str
    field_note: str
    location_confirmed: bool = True
    actor: Optional[str] = "Grid Response Team 04"


class ValidateRequest(BaseModel):
    decision: str  # VALIDATE or REQUEST_REWORK
    rework_reason: Optional[str] = None
    actor: Optional[str] = "Commander Vikram Malhotra"


# -------------------------------------------------------------
# 1. CITIZEN & COMMUNITY CORROBORATION
# -------------------------------------------------------------
@router.get("/citizen/nearby-reports")
async def get_nearby_reports(
    lat: float = Query(default=26.9180),
    lng: float = Query(default=75.7920),
    radius_m: float = Query(default=1000.0),
    db: AsyncSession = Depends(get_db)
):
    """Returns nearby community reports and aggregated community signal."""
    return await field_service.list_nearby_reports(lat, lng, radius_m, db)


@router.post("/citizen/reports/{report_id}/corroborate")
async def corroborate_report(
    report_id: str,
    req: CorroborateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Corroborates an existing report. Prevents duplicate submissions by the same citizen."""
    return await field_service.corroborate_report(
        report_id=report_id,
        citizen_token=req.citizen_token,
        lat=req.latitude,
        lng=req.longitude,
        comment=req.comment,
        evidence_uri=req.evidence_uri,
        db=db
    )


@router.post("/citizen/incidents/{incident_id}/feedback")
async def submit_citizen_resolution_feedback(
    incident_id: str,
    req: CitizenFeedbackRequest,
    db: AsyncSession = Depends(get_db)
):
    """Citizen confirms whether the problem is resolved, or requests a reopen with feedback."""
    return await field_service.submit_citizen_feedback(
        incident_id=incident_id,
        citizen_token=req.citizen_token,
        is_resolved=req.is_resolved,
        reopen_reason=req.reopen_reason,
        reopen_evidence_uri=req.reopen_evidence_uri,
        db=db
    )


# -------------------------------------------------------------
# 2. FIELD OFFICER OPERATIONS (/field)
# -------------------------------------------------------------
@router.get("/field/assignments")
async def get_field_assignments(db: AsyncSession = Depends(get_db)):
    """Returns operational assignments and active unit overview for Field Officer."""
    return await field_service.list_assignments(db)


@router.get("/field/assignments/{assignment_id}")
async def get_assignment_detail(
    assignment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Returns detailed assignment metadata, evidence previews, SOP checklist, and notes."""
    return await field_service.get_assignment_detail(assignment_id, db)


@router.post("/field/assignments/{assignment_id}/dispatch")
async def dispatch_unit(
    assignment_id: str,
    req: DispatchUnitRequest,
    db: AsyncSession = Depends(get_db)
):
    """Dispatches a response unit to the operational assignment."""
    return await field_service.dispatch_unit(
        assignment_id=assignment_id,
        unit_id=req.unit_id,
        actor=req.actor or "Field Officer",
        db=db
    )


@router.post("/field/assignments/{assignment_id}/status")
async def update_assignment_status(
    assignment_id: str,
    req: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Updates assignment status along the controlled state machine."""
    return await field_service.update_status(
        assignment_id=assignment_id,
        new_status=req.status,
        actor=req.actor or "Field Officer",
        db=db
    )


@router.patch("/field/assignments/{assignment_id}/sop")
async def update_sop_step(
    assignment_id: str,
    req: SOPUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Updates completion state of an SOP checklist item."""
    return await field_service.update_sop_step(
        assignment_id=assignment_id,
        step_id=req.step_id,
        completed=req.completed,
        actor=req.actor or "Field Officer",
        db=db
    )


@router.post("/field/assignments/{assignment_id}/proof")
async def submit_field_proof(
    assignment_id: str,
    req: SubmitProofRequest,
    db: AsyncSession = Depends(get_db)
):
    """Submits on-site photographic proof and notes. Requires mandatory SOP completion."""
    return await field_service.submit_proof(
        assignment_id=assignment_id,
        before_photo_uri=req.before_photo,
        after_photo_uri=req.after_photo,
        field_note=req.field_note,
        location_confirmed=req.location_confirmed,
        actor=req.actor or "Grid Response Team 04",
        db=db
    )


# -------------------------------------------------------------
# 3. AUTHORITY VALIDATION & RESOLUTION
# -------------------------------------------------------------
@router.post("/field/assignments/{assignment_id}/validate")
async def validate_field_completion(
    assignment_id: str,
    req: ValidateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authority validates proof or requests rework."""
    return await field_service.validate_completion(
        assignment_id=assignment_id,
        decision=req.decision,
        rework_reason=req.rework_reason,
        actor=req.actor or "Commander Vikram Malhotra",
        db=db
    )


@router.post("/field/assignments/{assignment_id}/confirm")
async def confirm_resolution(
    assignment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Authority confirms final resolution."""
    return await field_service.confirm_resolution(
        assignment_id=assignment_id,
        actor="Commander Vikram Malhotra",
        db=db
    )


# -------------------------------------------------------------
# 4. DETERMINISTIC 20-STEP DEMO CONTROLLER (JUDGE MODE)
# -------------------------------------------------------------
@router.post("/field/demo/reset")
async def reset_demo_scenario(db: AsyncSession = Depends(get_db)):
    """Resets the deterministic blackout demo back to Event 01."""
    return await field_service.reset_demo(db)


@router.post("/field/demo/step/{step_number}")
async def execute_demo_step(
    step_number: int,
    db: AsyncSession = Depends(get_db)
):
    """Executes a specific step (1 to 20) in the deterministic scenario."""
    return await field_service.execute_demo_step(step_number, db)
