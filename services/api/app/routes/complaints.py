"""
TRINETRA Canonical Complaints & Governance Workflow REST Router.
Provides shared end-to-end endpoints connecting Citizen, District Admin,
Department Head, Field Officer, and State Leadership.
"""
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import (
    get_current_user,
    get_optional_user,
    require_role,
    enforce_district_scope,
    enforce_department_scope,
    enforce_field_unit_scope,
)
from app.db.session import get_db
from app.models.audit import AuditEventModel
from app.models.complaint import ComplaintModel, generate_tracking_id
from app.models.organization import UserModel
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    PublicTrackingResponse,
    MilestoneItem,
    TransitionRequest,
    AssignmentRequest,
    FieldProgressRequest,
    ProofSubmissionRequest,
    ValidationRequest,
    CitizenFeedbackRequest,
    ReopenRequest,
    IncidentCorrelateRequest,
)
from app.services.complaint_workflow import complaint_workflow

router = APIRouter(prefix="/complaints", tags=["Complaints & Governance Workflow"])


# -----------------------------------------------------------------------------
# 1. Citizen / Public Complaint Creation
# -----------------------------------------------------------------------------
@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
    user: Optional[UserModel] = Depends(get_optional_user),
):
    """
    Submits a new citizen grievance or operational complaint.
    Generates an unpredictable tracking ID (TRN-2026-XXXXXX).
    Assigns initial jurisdiction and initial SOP template.
    """
    now = datetime.now(timezone.utc)
    district_code = payload.district_id or (user.district_id if user and user.district_id else "HR-GU")

    # Map all 22 Haryana district codes to names
    district_names = {
        "HR-GU": "Gurugram",
        "HR-FA": "Faridabad",
        "HR-RO": "Rohtak",
        "HR-AM": "Ambala",
        "HR-PK": "Panchkula",
        "HR-HI": "Hisar",
        "HR-KR": "Karnal",
        "HR-KA": "Karnal",
        "HR-SO": "Sonipat",
        "HR-PP": "Panipat",
        "HR-RE": "Rewari",
        "HR-SI": "Sirsa",
        "HR-YN": "Yamunanagar",
        "HR-JH": "Jind",
        "HR-KT": "Kaithal",
        "HR-KU": "Kurukshetra",
        "HR-NU": "Nuh",
        "HR-PW": "Palwal",
        "HR-JJ": "Jhajjar",
        "HR-MA": "Mahendragarh",
        "HR-BW": "Bhiwani",
        "HR-CD": "Charkhi Dadri",
        "HR-FT": "Fatehabad",
    }
    district_name = district_names.get(district_code, "Haryana District")

    dept_id, dept_name = complaint_workflow.resolve_department(payload.category, payload.department_id)

    complaint = ComplaintModel(
        citizen_id=user.id if user else None,
        citizen_name=payload.citizen_name or (user.display_name if user else "Citizen Reporter"),
        citizen_phone=payload.citizen_phone or (user.phone if user else None),
        category=payload.category.upper(),
        title=payload.title,
        description=payload.description,
        district_id=district_code,
        district_name=district_name,
        department_id=dept_id,
        department_name=dept_name,
        latitude=payload.latitude or 28.4595,
        longitude=payload.longitude or 77.0266,
        address=payload.address or f"{district_name}, Haryana",
        attachments=payload.attachments or [],
        status="SUBMITTED",
        priority="MEDIUM",
        source="CITIZEN_WEB" if not user else f"{user.role}_PORTAL",
        sop_checklist=complaint_workflow.get_default_sop(payload.category),
        created_at=now,
    )

    db.add(complaint)
    await db.flush()

    # Log initial audit trail
    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role if user else "CITIZEN",
        actor_id=user.id if user else "anonymous-citizen",
        event_type="COMPLAINT_SUBMITTED",
        complaint=complaint,
        metadata={"category": complaint.category, "district": complaint.district_id},
    )

    await db.commit()
    await db.refresh(complaint)

    # Broadcast event
    await complaint_workflow.broadcast_complaint_event("COMPLAINT_CREATED", complaint)

    # Compute correlation
    corr = await complaint_workflow.correlate_with_fusion(db, complaint)
    res = ComplaintResponse.model_validate(complaint)
    res.correlation = corr
    return res


# -----------------------------------------------------------------------------
# 2. Scoped Complaint Listing
# -----------------------------------------------------------------------------
@router.get("", response_model=List[ComplaintResponse])
async def list_complaints(
    district_id: Optional[str] = Query(None, description="Filter by district"),
    department_id: Optional[str] = Query(None, description="Filter by department"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    search: Optional[str] = Query(None, description="Search tracking_id or title"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: Optional[UserModel] = Depends(get_optional_user),
):
    """
    Returns complaints scoped strictly to caller's role, district, and department.
    - CITIZEN: Only own complaints
    - FIELD_OFFICER: Only tasks assigned to unit_id
    - DEPARTMENT: Scoped to user's assigned department_id
    - DISTRICT_ADMIN: Scoped to user's assigned district_id
    - STATE_LEADERSHIP / PLATFORM_ADMIN: State-wide access
    - GUEST / UNAUTHENTICATED: Public complaints view
    """
    stmt = select(ComplaintModel)

    # Enforce Role Scoping
    if user is None:
        pass  # Unauthenticated public overview
    elif user.role == "CITIZEN":
        stmt = stmt.where(ComplaintModel.citizen_id == user.id)
    elif user.role == "FIELD_OFFICER":
        if user.unit_id:
            stmt = stmt.where(
                or_(
                    ComplaintModel.assigned_unit_id == user.unit_id,
                    ComplaintModel.assigned_officer_id == user.id,
                )
            )
        else:
            stmt = stmt.where(ComplaintModel.assigned_officer_id == user.id)
    elif user.role == "DEPARTMENT":
        effective_dept = enforce_department_scope(user, department_id)
        stmt = stmt.where(ComplaintModel.department_id == effective_dept)
        if district_id:
            stmt = stmt.where(ComplaintModel.district_id == district_id)
    elif user.role == "DISTRICT_ADMIN":
        effective_dist = enforce_district_scope(user, district_id)
        stmt = stmt.where(ComplaintModel.district_id == effective_dist)
        if department_id:
            stmt = stmt.where(ComplaintModel.department_id == department_id)
    elif user.role in ("STATE_LEADERSHIP", "PLATFORM_ADMIN"):
        if district_id:
            stmt = stmt.where(ComplaintModel.district_id == district_id)
        if department_id:
            stmt = stmt.where(ComplaintModel.department_id == department_id)

    # Common Filters
    if status_filter:
        stmt = stmt.where(ComplaintModel.status == status_filter.upper())
    if category:
        stmt = stmt.where(ComplaintModel.category == category.upper())
    if priority:
        stmt = stmt.where(ComplaintModel.priority == priority.upper())
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                ComplaintModel.tracking_id.ilike(search_pattern),
                ComplaintModel.title.ilike(search_pattern),
            )
        )

    stmt = stmt.order_by(desc(ComplaintModel.created_at)).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


# -----------------------------------------------------------------------------
# 3. Public-Safe Complaint Tracking by Reference ID
# -----------------------------------------------------------------------------
@router.get("/track/{tracking_id}", response_model=PublicTrackingResponse)
async def track_complaint_public(
    tracking_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Public tracking endpoint.
    Strictly redacts internal officer identities, internal notes, and tactical details.
    Displays meaningful citizen-facing milestone progression.
    """
    clean_id = tracking_id.strip().upper()
    stmt = select(ComplaintModel).where(
        or_(
            ComplaintModel.tracking_id == clean_id,
            ComplaintModel.id == tracking_id,
        )
    )
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No grievance found with reference number '{clean_id}'",
        )

    # Calculate human-friendly stages
    stages_order = [
        ("SUBMITTED", "Grievance Registered", "Received at State Portal"),
        ("ACKNOWLEDGED", "Authority Acknowledged", "District Control Logged"),
        ("ASSIGNED", "Field Unit Dispatched", "Assigned to Line Department"),
        ("IN_PROGRESS", "Resolution in Progress", "Technical Team Executing"),
        ("AWAITING_VALIDATION", "Work Completed — Inspection Pending", "Submitted for Verification"),
        ("RESOLVED", "Resolution Verified & Closed", "Official Signoff Completed"),
    ]

    status_index_map = {
        "SUBMITTED": 0,
        "ACKNOWLEDGED": 1,
        "UNDER_REVIEW": 1,
        "VERIFIED": 1,
        "ASSIGNED": 2,
        "IN_PROGRESS": 3,
        "AWAITING_VALIDATION": 4,
        "RESOLVED": 5,
        "REOPENED": 3,
        "REJECTED": 5,
    }

    current_idx = status_index_map.get(complaint.status, 0)
    milestones = []
    for idx, (stg, label, sub) in enumerate(stages_order):
        is_done = idx <= current_idx and complaint.status != "REJECTED"
        ts = complaint.created_at.strftime("%d %b %Y, %I:%M %p") if idx == 0 else (
            complaint.resolved_at.strftime("%d %b %Y, %I:%M %p") if (idx == 5 and complaint.resolved_at) else None
        )
        milestones.append(
            MilestoneItem(
                stage=stg,
                label=label,
                completed=is_done,
                timestamp=ts,
                actor_label=complaint.department_name if idx >= 2 else "Haryana Citizen Services",
            )
        )

    stage_labels = {
        "SUBMITTED": "Grievance Registered — Under Verification",
        "ACKNOWLEDGED": "Acknowledged by District Administration",
        "UNDER_REVIEW": "Under Department Review",
        "VERIFIED": "Situation Verified on Ground",
        "ASSIGNED": f"Assigned to {complaint.department_name}",
        "IN_PROGRESS": "Field Operations Actively in Progress",
        "AWAITING_VALIDATION": "Field Mitigation Complete — Awaiting Supervisor Signoff",
        "RESOLVED": "Safely Resolved & Verified",
        "REOPENED": "Grievance Reopened — Active Supervisory Review",
        "REJECTED": f"Case Closed: {complaint.rejection_reason or 'Non-actionable'}",
    }

    est_res = (
        "Resolved"
        if complaint.status == "RESOLVED"
        else ("Standard SLA: 4 to 12 Hours" if complaint.status in ("ASSIGNED", "IN_PROGRESS") else "Unavailable (Under Initial Assessment)")
    )

    return PublicTrackingResponse(
        tracking_id=complaint.tracking_id,
        category=complaint.category,
        title=complaint.title,
        district_name=complaint.district_name,
        department_name=complaint.department_name,
        status=complaint.status,
        stage_label=stage_labels.get(complaint.status, complaint.status),
        created_at=complaint.created_at,
        last_updated=complaint.updated_at,
        estimated_resolution=est_res,
        milestones=milestones,
        is_resolved=complaint.status == "RESOLVED",
        feedback_submitted=complaint.feedback_rating is not None,
    )


# -----------------------------------------------------------------------------
# 4. Detail View with Full Audit Trail (Authenticated)
# -----------------------------------------------------------------------------
@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint_detail(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    Returns full complaint record, SOP steps, field proof, and audit timeline.
    Enforces object-level scoping.
    """
    stmt = select(ComplaintModel).where(
        or_(ComplaintModel.id == complaint_id, ComplaintModel.tracking_id == complaint_id.upper())
    )
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint '{complaint_id}' not found")

    complaint_workflow.check_object_scope(complaint, user)

    # Fetch audit events
    audit_stmt = (
        select(AuditEventModel)
        .where(
            and_(
                AuditEventModel.entity_type == "COMPLAINT",
                AuditEventModel.entity_id == complaint.id,
            )
        )
        .order_by(AuditEventModel.created_at.asc())
    )
    audit_res = await db.execute(audit_stmt)
    audit_events = audit_res.scalars().all()

    timeline = [
        {
            "id": ev.id,
            "eventType": ev.event_type,
            "actorType": ev.actor_type,
            "actorId": ev.actor_id,
            "timestamp": ev.created_at.isoformat(),
            "details": ev.metadata_json,
        }
        for ev in audit_events
    ]

    corr = await complaint_workflow.correlate_with_fusion(db, complaint)

    res = ComplaintResponse.model_validate(complaint)
    res.timeline = timeline
    res.correlation = corr
    return res


# -----------------------------------------------------------------------------
# 5. Explicit Status Transition
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/transition", response_model=ComplaintResponse)
async def transition_complaint_status(
    complaint_id: str,
    payload: TransitionRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    Performs an explicit status transition validated against role and source state.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)
    complaint_workflow.validate_transition(complaint, payload.target_status, user)

    prev_status = complaint.status
    complaint.status = payload.target_status.upper()

    if complaint.status == "RESOLVED":
        complaint.resolved_at = datetime.now(timezone.utc)
    if complaint.status == "REJECTED" and payload.reason:
        complaint.rejection_reason = payload.reason

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="STATUS_TRANSITION",
        complaint=complaint,
        metadata={
            "from_status": prev_status,
            "to_status": complaint.status,
            "reason": payload.reason,
            "notes": payload.notes,
        },
    )

    await db.commit()
    await db.refresh(complaint)

    await complaint_workflow.broadcast_complaint_event(
        "STATUS_UPDATED",
        complaint,
        {"fromStatus": prev_status, "toStatus": complaint.status},
    )

    return complaint


# -----------------------------------------------------------------------------
# 6. Case Assignment (Department or District Admin)
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/assign", response_model=ComplaintResponse)
async def assign_complaint(
    complaint_id: str,
    payload: AssignmentRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(require_role(["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"])),
):
    """
    Assigns a field unit and officer to a complaint.
    Automatically initializes the SOP checklist and transitions status to ASSIGNED.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    complaint.assigned_unit_id = payload.assigned_unit_id
    complaint.assigned_officer_id = payload.assigned_officer_id
    complaint.assigned_officer_name = payload.assigned_officer_name or f"Officer ({payload.assigned_unit_id})"
    complaint.assigned_at = datetime.now(timezone.utc)

    if payload.department_id:
        dept_id, dept_name = complaint_workflow.resolve_department(complaint.category, payload.department_id)
        complaint.department_id = dept_id
        complaint.department_name = dept_name

    if payload.priority:
        complaint.priority = payload.priority.upper()

    # Ensure SOP checklist is populated
    if not complaint.sop_checklist:
        complaint.sop_checklist = complaint_workflow.get_default_sop(complaint.category)

    # Valid transition to ASSIGNED
    complaint.status = "ASSIGNED"

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="OFFICER_ASSIGNED",
        complaint=complaint,
        metadata={
            "unit_id": payload.assigned_unit_id,
            "officer_name": complaint.assigned_officer_name,
            "notes": payload.notes,
        },
    )

    await db.commit()
    await db.refresh(complaint)

    await complaint_workflow.broadcast_complaint_event("OFFICER_ASSIGNED", complaint)
    return complaint


# -----------------------------------------------------------------------------
# 7. Field Officer Progress & SOP Updates
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/field-progress", response_model=ComplaintResponse)
async def update_field_progress(
    complaint_id: str,
    payload: FieldProgressRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(require_role(["FIELD_OFFICER", "DEPARTMENT", "PLATFORM_ADMIN"])),
):
    """
    Field officer updates ground progress, ticks SOP steps, or logs field notes.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    # Update tactical status if supplied (e.g. EN_ROUTE, ON_SCENE, IN_PROGRESS)
    if payload.status:
        complaint.status = "IN_PROGRESS"

    from sqlalchemy.orm.attributes import flag_modified

    # Update SOP step
    if payload.sop_step_id:
        steps = [dict(s) for s in (complaint.sop_checklist or [])]
        for step in steps:
            if step.get("id") == payload.sop_step_id:
                step["completed"] = bool(payload.sop_completed)
                step["completed_at"] = datetime.now(timezone.utc).isoformat()
                step["completed_by"] = user.display_name
        complaint.sop_checklist = steps
        flag_modified(complaint, "sop_checklist")

    # Add field note
    if payload.note:
        notes = [dict(n) for n in (complaint.field_notes or [])]
        notes.append({
            "author": user.display_name,
            "text": payload.note,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "unit_id": user.unit_id or complaint.assigned_unit_id,
        })
        complaint.field_notes = notes
        flag_modified(complaint, "field_notes")


    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="FIELD_PROGRESS_UPDATED",
        complaint=complaint,
        metadata={"sop_step": payload.sop_step_id, "note": payload.note},
    )

    await db.commit()
    await db.refresh(complaint)

    await complaint_workflow.broadcast_complaint_event("PROGRESS_UPDATED", complaint)
    return complaint


# -----------------------------------------------------------------------------
# 8. Field Officer Proof Submission (Transitions to AWAITING_VALIDATION)
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/submit-proof", response_model=ComplaintResponse)
async def submit_resolution_proof(
    complaint_id: str,
    payload: ProofSubmissionRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(require_role(["FIELD_OFFICER", "DEPARTMENT", "PLATFORM_ADMIN"])),
):
    """
    Field officer submits completion proof.
    Transitions status to AWAITING_VALIDATION.
    DOES NOT mark as RESOLVED directly — supervisor validation required.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    complaint.resolution_proof = {
        "before_photo": payload.before_photo,
        "after_photo": payload.after_photo,
        "field_note": payload.field_note,
        "location_confirmed": payload.location_confirmed,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "unit_id": user.unit_id or complaint.assigned_unit_id,
        "officer_name": user.display_name,
    }
    complaint.validation_status = "PENDING"
    complaint.status = "AWAITING_VALIDATION"

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="PROOF_SUBMITTED",
        complaint=complaint,
        metadata={"proof_note": payload.field_note, "after_photo": payload.after_photo},
    )

    await db.commit()
    await db.refresh(complaint)

    await complaint_workflow.broadcast_complaint_event("PROOF_SUBMITTED", complaint)
    return complaint


# -----------------------------------------------------------------------------
# 9. Supervisor Validation (Department / District Admin)
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/validate-resolution", response_model=ComplaintResponse)
async def validate_resolution(
    complaint_id: str,
    payload: ValidationRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(require_role(["DEPARTMENT", "DISTRICT_ADMIN", "STATE_LEADERSHIP", "PLATFORM_ADMIN"])),
):
    """
    Authorized supervisor reviews completion proof:
    - APPROVE: Marks RESOLVED, records resolution timestamp.
    - REJECT_REWORK: Demands rework with mandatory rejection_reason; reverts status to IN_PROGRESS.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    decision = payload.decision.upper()
    now = datetime.now(timezone.utc)

    if decision == "APPROVE":
        complaint.validation_status = "VALIDATED"
        complaint.status = "RESOLVED"
        complaint.resolved_at = now
        complaint.rejection_reason = None
        event_name = "RESOLUTION_APPROVED"
    elif decision in ("REJECT_REWORK", "REJECT"):
        if not payload.rejection_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A detailed rejection_reason is mandatory when rejecting proof or requesting rework.",
            )
        complaint.validation_status = "REWORK_REQUESTED"
        complaint.status = "IN_PROGRESS"
        complaint.rejection_reason = payload.rejection_reason
        event_name = "REWORK_REQUESTED"
    else:
        raise HTTPException(status_code=400, detail="Decision must be APPROVE or REJECT_REWORK")

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type=event_name,
        complaint=complaint,
        metadata={"decision": decision, "rejection_reason": payload.rejection_reason, "notes": payload.notes},
    )

    await db.commit()
    await db.refresh(complaint)

    await complaint_workflow.broadcast_complaint_event(
        "COMPLAINT_RESOLVED" if decision == "APPROVE" else "REWORK_REQUIRED",
        complaint,
        {"decision": decision, "reason": payload.rejection_reason},
    )
    return complaint


# -----------------------------------------------------------------------------
# 10. Citizen Feedback on Resolved Complaint
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/feedback", response_model=ComplaintResponse)
async def submit_citizen_feedback(
    complaint_id: str,
    payload: CitizenFeedbackRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    Citizen submits satisfaction rating (1-5) and feedback on a resolved grievance.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    if complaint.status != "RESOLVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Feedback can only be provided on RESOLVED grievances (current status: {complaint.status})",
        )

    complaint.feedback_rating = payload.rating
    complaint.feedback_comments = payload.comments

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="CITIZEN_FEEDBACK_RECEIVED",
        complaint=complaint,
        metadata={"rating": payload.rating, "comments": payload.comments},
    )

    await db.commit()
    await db.refresh(complaint)
    return complaint


# -----------------------------------------------------------------------------
# 11. Reopen Workflow (Citizen or Leadership)
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/reopen", response_model=ComplaintResponse)
async def reopen_complaint(
    complaint_id: str,
    payload: ReopenRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(get_current_user),
):
    """
    Reopens a resolved complaint if the citizen reports the issue persists.
    Triggers supervisory review and changes status to REOPENED.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    if complaint.status != "RESOLVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only RESOLVED complaints can be reopened (current status: {complaint.status})",
        )

    complaint.status = "REOPENED"
    complaint.reopen_reason = payload.reopen_reason
    complaint.reopen_evidence_uri = payload.reopen_evidence_uri

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="COMPLAINT_REOPENED",
        complaint=complaint,
        metadata={"reopen_reason": payload.reopen_reason, "evidence_uri": payload.reopen_evidence_uri},
    )

    await db.commit()
    await db.refresh(complaint)

    await complaint_workflow.broadcast_complaint_event(
        "COMPLAINT_REOPENED",
        complaint,
        {"reopenReason": payload.reopen_reason},
    )
    return complaint


# -----------------------------------------------------------------------------
# 12. Incident Correlation Link
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/correlate-incident", response_model=ComplaintResponse)
async def correlate_incident(
    complaint_id: str,
    payload: IncidentCorrelateRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(require_role(["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"])),
):
    """
    Links a complaint to an incident or creates a new incident candidate.
    Preserves exact complaint provenance while connecting to operational GIS twin.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    target_inc_id = payload.incident_id or f"inc-correlate-{complaint.district_id.lower()}-01"
    complaint.incident_id = target_inc_id

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="INCIDENT_CORRELATED",
        complaint=complaint,
        metadata={"target_incident_id": target_inc_id, "rationale": payload.rationale},
    )

    await db.commit()
    await db.refresh(complaint)
    return complaint
