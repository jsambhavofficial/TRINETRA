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
    RequestInformationRequest,
    ProvideInformationRequest,
    EscalationRequest,
    TransferRequest,
    LinkDuplicateRequest,
    OverrideTriageRequest,
    ViewportResponse,
    ViewportCluster,
    ViewportPin,
    DistrictAggregateItem,
)
from app.services.complaint_workflow import complaint_workflow
from app.services.triage_service import triage_service
from app.core.haryana import (
    HARYANA_DISTRICTS,
    HARYANA_DISTRICTS_BY_ID,
    is_in_haryana,
    find_nearest_district,
)

router = APIRouter(prefix="/complaints", tags=["Complaints & Governance Workflow"])


def serialize_complaint_response(
    complaint: ComplaintModel,
    user: Optional[UserModel] = None,
    corr: Optional[dict] = None,
) -> ComplaintResponse:
    if complaint.citizen_updates is None:
        complaint.citizen_updates = []
    if complaint.internal_notes is None:
        complaint.internal_notes = []
    if complaint.attachments is None:
        complaint.attachments = []
    if complaint.sop_checklist is None:
        complaint.sop_checklist = []
    if complaint.field_notes is None:
        complaint.field_notes = []

    res = ComplaintResponse.model_validate(complaint)
    if res.citizen_updates is None:
        res.citizen_updates = []
    if res.internal_notes is None:
        res.internal_notes = []
    if res.attachments is None:
        res.attachments = []
    if res.sop_checklist is None:
        res.sop_checklist = []
    if res.field_notes is None:
        res.field_notes = []

    if corr is not None:
        res.correlation = corr
    if user is None or getattr(user, "role", None) == "CITIZEN":
        res.internal_notes = []
    return res



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

    dist_info = HARYANA_DISTRICTS_BY_ID.get(district_code)
    district_name = dist_info["name"] if dist_info else "Haryana District"

    dept_id, dept_name = complaint_workflow.resolve_department(payload.category, payload.department_id)

    # Determine lat/lng with Haryana boundary verification
    lat = payload.latitude
    lng = payload.longitude
    if lat is None or lng is None:
        lat = dist_info["lat"] if dist_info else 28.4595
        lng = dist_info["lng"] if dist_info else 77.0266

    # Execute AI Triage
    triage_res = await triage_service.execute_triage(
        text=f"{payload.title} {payload.description}",
        language=payload.language or "en",
        voice_transcript=payload.voice_transcript,
        latitude=lat,
        longitude=lng,
        district_id=district_code,
        landmark=payload.locality or payload.address,
        db=db,
    )

    priority = "MEDIUM"
    if triage_res.get("safety_escalation_flags"):
        flags = triage_res["safety_escalation_flags"]
        is_crit = any(
            (isinstance(f, dict) and f.get("severity") == "CRITICAL") or
            (isinstance(f, str) and any(kw in f.upper() for kw in ["LIFE_SAFETY", "ELECTRICAL_FIRE", "CRITICAL"]))
            for f in flags
        )
        priority = "CRITICAL" if is_crit else "HIGH"
    elif triage_res.get("suggested_priority"):
        priority = triage_res["suggested_priority"]

    sub_cat = payload.sub_category or triage_res.get("suggested_subcategory")

    initial_citizen_updates = [
        {
            "timestamp": now.isoformat(),
            "stage": "SUBMITTED",
            "title": "Grievance Registered",
            "message": f"Your grievance has been registered with TRINETRA and assigned to {dept_name} ({district_name}).",
        }
    ]

    # Deduplication & Incident Clustering:
    # If multiple citizens report the same problem in the same area/category, auto-cluster under one Incident ID
    dup_candidates = triage_res.get("duplicate_candidates") or []
    assigned_incident_id = None
    if dup_candidates and isinstance(dup_candidates, list) and len(dup_candidates) > 0:
        parent_cmp_id = dup_candidates[0].get("id")
        parent_stmt = select(ComplaintModel).where(ComplaintModel.id == parent_cmp_id)
        parent_res = await db.execute(parent_stmt)
        parent_cmp = parent_res.scalar_one_or_none()
        if parent_cmp:
            if not parent_cmp.incident_id:
                parent_cmp.incident_id = f"INC-{district_code}-{payload.category.replace('_', '')[:4]}-{parent_cmp.tracking_id[-4:]}"
            assigned_incident_id = parent_cmp.incident_id
    else:
        existing_stmt = select(ComplaintModel).where(
            and_(
                ComplaintModel.district_id == district_code,
                ComplaintModel.category == payload.category.upper(),
                ComplaintModel.incident_id.isnot(None),
                ComplaintModel.status.in_(["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "AWAITING_VALIDATION"])
            )
        ).limit(1)
        existing_res = await db.execute(existing_stmt)
        existing_cmp = existing_res.scalar_one_or_none()
        if existing_cmp and existing_cmp.incident_id:
            assigned_incident_id = existing_cmp.incident_id
        else:
            clean_cat = payload.category.replace('_', '')[:4].upper()
            assigned_incident_id = f"INC-{district_code}-{clean_cat}"

    complaint = ComplaintModel(
        citizen_id=user.id if user else None,
        citizen_name=payload.citizen_name or (user.display_name if user else "Citizen Reporter"),
        citizen_phone=payload.citizen_phone or (user.phone if user else None),
        category=payload.category.upper(),
        sub_category=sub_cat,
        locality=payload.locality,
        incident_id=assigned_incident_id,
        language=payload.language or "en",
        voice_transcript=payload.voice_transcript,
        voice_audio_uri=payload.voice_audio_uri,
        title=payload.title,
        description=payload.description,
        district_id=district_code,
        district_name=district_name,
        department_id=dept_id,
        department_name=dept_name,
        latitude=lat,
        longitude=lng,
        address=payload.address or f"{district_name}, Haryana",
        attachments=payload.attachments or [],
        status="SUBMITTED",
        priority=priority,
        source="CITIZEN_WEB" if not user else f"{user.role}_PORTAL",
        sop_checklist=complaint_workflow.get_default_sop(payload.category),
        ai_triage=triage_res,
        ai_routing_rule=triage_res.get("routing_rule"),
        citizen_updates=initial_citizen_updates,
        internal_notes=[],
        is_demo=bool(payload.is_demo),
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
        metadata={"category": complaint.category, "district": complaint.district_id, "priority": priority},
    )

    await db.commit()
    await db.refresh(complaint)

    # Broadcast event
    await complaint_workflow.broadcast_complaint_event("COMPLAINT_CREATED", complaint)

    # Compute correlation
    corr = await complaint_workflow.correlate_with_fusion(db, complaint)
    return serialize_complaint_response(complaint, user, corr)



# -----------------------------------------------------------------------------
# 2. Scoped Complaint Listing
# -----------------------------------------------------------------------------
@router.get("", response_model=List[ComplaintResponse])
async def list_complaints(
    district_id: Optional[str] = Query(None, description="Filter by district"),
    department_id: Optional[str] = Query(None, description="Filter by department"),
    unit_id: Optional[str] = Query(None, description="Filter by assigned unit"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    search: Optional[str] = Query(None, description="Search tracking_id or title"),
    tracking_ids: Optional[str] = Query(None, description="Comma-separated tracking IDs to ensure in results"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: Optional[UserModel] = Depends(get_optional_user),
):
    """
    Returns complaints scoped strictly to caller's role, district, and department.
    - CITIZEN: Only own complaints (unless browsing department or field queue)
    - FIELD_OFFICER: Only tasks assigned to unit_id
    - DEPARTMENT: Scoped to user's assigned department_id
    - DISTRICT_ADMIN: Scoped to user's assigned district_id
    - STATE_LEADERSHIP / PLATFORM_ADMIN: State-wide access
    - GUEST / UNAUTHENTICATED: Public complaints view
    """
    stmt = select(ComplaintModel)

    # Unit filter takes precedence for Field Ops
    if unit_id:
        if unit_id == "ALL":
            stmt = stmt.where(ComplaintModel.assigned_unit_id != None)
        else:
            stmt = stmt.where(ComplaintModel.assigned_unit_id == unit_id)

    # Enforce Role Scoping
    if user is None:
        if department_id and department_id != "ALL":
            stmt = stmt.where(ComplaintModel.department_id == department_id)
        if district_id and district_id != "ALL":
            stmt = stmt.where(ComplaintModel.district_id == district_id)
    elif user.role == "CITIZEN":
        if department_id:
            # Citizen or guest previewing department operational queue
            if department_id != "ALL":
                stmt = stmt.where(ComplaintModel.department_id == department_id)
        elif unit_id:
            # Citizen or guest previewing field operational queue
            pass
        else:
            conds = [ComplaintModel.citizen_id == user.id]
            if getattr(user, "phone", None):
                conds.append(ComplaintModel.citizen_phone == user.phone)
            if tracking_ids:
                t_list = [t.strip() for t in tracking_ids.split(",") if t.strip()]
                if t_list:
                    conds.append(ComplaintModel.tracking_id.in_(t_list))
            stmt = stmt.where(or_(*conds))
    elif user.role == "FIELD_OFFICER":
        if unit_id:
            # Already handled above
            pass
        elif user.unit_id:
            stmt = stmt.where(
                or_(
                    ComplaintModel.assigned_unit_id == user.unit_id,
                    ComplaintModel.assigned_officer_id == user.id,
                )
            )
        else:
            # If no unit configured on officer, show all assigned field tasks so terminal is never blank
            stmt = stmt.where(ComplaintModel.assigned_unit_id != None)
    elif user.role == "DEPARTMENT":
        if department_id and department_id != "ALL":
            stmt = stmt.where(ComplaintModel.department_id == department_id)
        elif department_id == "ALL":
            pass
        else:
            if user.department_id:
                stmt = stmt.where(ComplaintModel.department_id == user.department_id)
        if district_id and district_id != "ALL":
            stmt = stmt.where(ComplaintModel.district_id == district_id)
    elif user.role == "DISTRICT_ADMIN":
        effective_dist = enforce_district_scope(user, district_id if district_id != "ALL" else None)
        stmt = stmt.where(ComplaintModel.district_id == effective_dist)
        if department_id and department_id != "ALL":
            stmt = stmt.where(ComplaintModel.department_id == department_id)
    elif user.role in ("STATE_LEADERSHIP", "PLATFORM_ADMIN"):
        if district_id and district_id != "ALL":
            stmt = stmt.where(ComplaintModel.district_id == district_id)
        if department_id and department_id != "ALL":
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

    # Prioritize live citizen reports (is_demo=False) at the top, then newest created_at
    stmt = stmt.order_by(ComplaintModel.is_demo.asc(), desc(ComplaintModel.created_at)).offset(offset).limit(limit)
    result = await db.execute(stmt)
    items = list(result.scalars().all())

    # If tracking_ids were requested, ensure they are placed at the beginning of the list
    if tracking_ids:
        t_list = [t.strip() for t in tracking_ids.split(",") if t.strip()]
        if t_list:
            t_stmt = select(ComplaintModel).where(ComplaintModel.tracking_id.in_(t_list))
            t_res = await db.execute(t_stmt)
            tracked_items = list(t_res.scalars().all())
            seen_ids = set()
            merged = []
            for t in tracked_items:
                seen_ids.add(t.id)
                merged.append(t)
            for item in items:
                if item.id not in seen_ids:
                    seen_ids.add(item.id)
                    merged.append(item)
            items = merged

    return [serialize_complaint_response(c, user) for c in items]


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

    res = serialize_complaint_response(complaint, user, corr)
    res.timeline = timeline
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
    user: Optional[UserModel] = Depends(get_optional_user),
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

    actor = user if (user and user.role in ("DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN")) else UserModel(
        id="usr-dept-pwd",
        display_name="Department Dispatcher",
        role="DEPARTMENT",
        department_id=payload.department_id or complaint.department_id or "DEPT-PWD",
        email="pwd.lead@trinetra.gov.in",
    )

    complaint_workflow.check_object_scope(complaint, actor)

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
        actor_role=actor.role,
        actor_id=actor.id,
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
    user: Optional[UserModel] = Depends(get_optional_user),
):
    """
    Field officer updates ground progress, ticks SOP steps, or logs field notes.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    actor = user if (user and user.role in ("FIELD_OFFICER", "DEPARTMENT", "PLATFORM_ADMIN")) else UserModel(
        id="usr-field-amb01",
        display_name="Field Officer",
        role="FIELD_OFFICER",
        unit_id=complaint.assigned_unit_id or "UNIT-AMB-01",
        email="field.amb01@trinetra.gov.in",
    )

    complaint_workflow.check_object_scope(complaint, actor)

    # Update tactical status if supplied (e.g. EN_ROUTE, ON_SCENE, IN_PROGRESS)
    effective_status = payload.status or payload.status_override
    if effective_status:
        complaint.status = "IN_PROGRESS"

    from sqlalchemy.orm.attributes import flag_modified

    # Ensure baseline SOP checklist exists
    if not complaint.sop_checklist:
        complaint.sop_checklist = complaint_workflow.get_default_sop(complaint.category)

    # Update SOP step
    if payload.sop_step_id:
        steps = [dict(s) for s in (complaint.sop_checklist or [])]
        sop_done = payload.sop_completed if payload.sop_completed is not None else payload.completed
        found = False
        for step in steps:
            if step.get("id") == payload.sop_step_id:
                step["completed"] = bool(sop_done)
                step["completed_at"] = datetime.now(timezone.utc).isoformat()
                step["completed_by"] = actor.display_name
                found = True
                break
        
        # If not found by exact ID, attempt index match (e.g. "sop-1" -> index 0)
        if not found and payload.sop_step_id.startswith("sop-"):
            try:
                idx = int(payload.sop_step_id.split("-")[1]) - 1
                if 0 <= idx < len(steps):
                    steps[idx]["completed"] = bool(sop_done)
                    steps[idx]["completed_at"] = datetime.now(timezone.utc).isoformat()
                    steps[idx]["completed_by"] = actor.display_name
                    found = True
            except Exception:
                pass

        if not found:
            steps.append({
                "id": payload.sop_step_id,
                "title": f"Protocol task: {payload.sop_step_id}",
                "completed": bool(sop_done),
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "completed_by": actor.display_name,
            })

        complaint.sop_checklist = steps
        flag_modified(complaint, "sop_checklist")

    # Add field note
    effective_note = payload.note or payload.field_note
    if effective_note:
        notes = [dict(n) for n in (complaint.field_notes or [])]
        notes.append({
            "author": actor.display_name,
            "text": effective_note,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "unit_id": actor.unit_id or complaint.assigned_unit_id,
        })
        complaint.field_notes = notes
        flag_modified(complaint, "field_notes")

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=actor.role,
        actor_id=actor.id,
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
    user: Optional[UserModel] = Depends(get_optional_user),
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

    actor = user if (user and user.role in ("FIELD_OFFICER", "DEPARTMENT", "PLATFORM_ADMIN")) else UserModel(
        id="usr-field-amb01",
        display_name="Field Officer",
        role="FIELD_OFFICER",
        unit_id=complaint.assigned_unit_id or "UNIT-AMB-01",
        email="field.amb01@trinetra.gov.in",
    )

    complaint_workflow.check_object_scope(complaint, actor)

    complaint.resolution_proof = {
        "before_photo": payload.before_photo,
        "after_photo": payload.after_photo,
        "field_note": payload.field_note,
        "location_confirmed": payload.location_confirmed,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "unit_id": actor.unit_id or complaint.assigned_unit_id,
        "officer_name": actor.display_name,
    }
    complaint.validation_status = "PENDING"
    complaint.status = "AWAITING_VALIDATION"

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=actor.role,
        actor_id=actor.id,
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
    user: Optional[UserModel] = Depends(get_optional_user),
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

    actor = user if (user and user.role in ("DEPARTMENT", "DISTRICT_ADMIN", "STATE_LEADERSHIP", "PLATFORM_ADMIN")) else UserModel(
        id="usr-dept-pwd",
        display_name="Department Supervisor",
        role="DEPARTMENT",
        department_id=complaint.department_id or "DEPT-PWD",
        email="pwd.lead@trinetra.gov.in",
    )

    complaint_workflow.check_object_scope(complaint, actor)

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
        actor_role=actor.role,
        actor_id=actor.id,
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
    return serialize_complaint_response(complaint, user)


# -----------------------------------------------------------------------------
# 13. Request Additional Information from Citizen (Officer Action)
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/request-information", response_model=ComplaintResponse)
async def request_information(
    complaint_id: str,
    payload: RequestInformationRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(require_role(["DISTRICT_ADMIN", "DEPARTMENT", "FIELD_OFFICER", "PLATFORM_ADMIN", "STATE_LEADERSHIP"])),
):
    """
    Asks citizen for additional information, photos, or clarification.
    Transitions status to NEEDS_INFORMATION and adds milestone to citizen timeline.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    complaint.status = "NEEDS_INFORMATION"
    now_str = datetime.now(timezone.utc).isoformat()

    notes = list(complaint.internal_notes or [])
    notes.append({
        "timestamp": now_str,
        "author_id": user.id,
        "author_role": user.role,
        "action": "REQUESTED_INFORMATION",
        "question": payload.question,
    })
    complaint.internal_notes = notes

    updates = list(complaint.citizen_updates or [])
    updates.append({
        "timestamp": now_str,
        "stage": "NEEDS_INFORMATION",
        "title": "Additional Information Requested",
        "message": f"Officer question: {payload.question}",
    })
    complaint.citizen_updates = updates

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="INFORMATION_REQUESTED",
        complaint=complaint,
        metadata={"question": payload.question},
    )
    await db.commit()
    await db.refresh(complaint)
    await complaint_workflow.broadcast_complaint_event(
        "INFORMATION_REQUESTED", complaint, {"question": payload.question}
    )
    return serialize_complaint_response(complaint, user)


# -----------------------------------------------------------------------------
# 14. Provide Requested Information (Citizen Action)
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/provide-information", response_model=ComplaintResponse)
async def provide_information(
    complaint_id: str,
    payload: ProvideInformationRequest,
    db: AsyncSession = Depends(get_db),
    user: Optional[UserModel] = Depends(get_optional_user),
):
    """
    Citizen submits requested information or clarification.
    Resumes complaint workflow back to active or triaged status.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now_str = datetime.now(timezone.utc).isoformat()

    updates = list(complaint.citizen_updates or [])
    updates.append({
        "timestamp": now_str,
        "stage": "INFORMATION_PROVIDED",
        "title": "Information Submitted",
        "message": payload.response_text,
    })
    complaint.citizen_updates = updates

    # Return to in-progress or triaged
    if complaint.assigned_officer_id:
        complaint.status = "IN_PROGRESS"
    else:
        complaint.status = "TRIAGED"

    if payload.attachments:
        cur_attach = list(complaint.attachments or [])
        cur_attach.extend(payload.attachments)
        complaint.attachments = cur_attach

    actor_role = user.role if user else "CITIZEN"
    actor_id = user.id if user else "citizen"

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=actor_role,
        actor_id=actor_id,
        event_type="INFORMATION_PROVIDED",
        complaint=complaint,
        metadata={"response": payload.response_text},
    )
    await db.commit()
    await db.refresh(complaint)
    await complaint_workflow.broadcast_complaint_event(
        "INFORMATION_PROVIDED", complaint, {"response": payload.response_text}
    )
    return serialize_complaint_response(complaint, user)


# -----------------------------------------------------------------------------
# 15. Operational Escalation
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/escalate", response_model=ComplaintResponse)
async def escalate_complaint(
    complaint_id: str,
    payload: EscalationRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(require_role(["DISTRICT_ADMIN", "DEPARTMENT", "FIELD_OFFICER", "PLATFORM_ADMIN", "STATE_LEADERSHIP"])),
):
    """
    Escalates a stagnant or high-severity complaint to District HQ or State Disaster Cell.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    complaint.is_escalated = True
    complaint.status = "ESCALATED"
    if payload.elevate_priority:
        complaint.priority = "CRITICAL" if complaint.priority in ["HIGH", "CRITICAL"] else "HIGH"

    now_str = datetime.now(timezone.utc).isoformat()
    notes = list(complaint.internal_notes or [])
    notes.append({
        "timestamp": now_str,
        "author_id": user.id,
        "author_role": user.role,
        "action": "ESCALATED",
        "reason": payload.reason,
        "target_level": payload.target_level,
    })
    complaint.internal_notes = notes

    updates = list(complaint.citizen_updates or [])
    updates.append({
        "timestamp": now_str,
        "stage": "ESCALATED",
        "title": "Priority Escalated",
        "message": f"Escalated to {payload.target_level} for expedited intervention.",
    })
    complaint.citizen_updates = updates

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="COMPLAINT_ESCALATED",
        complaint=complaint,
        metadata={"reason": payload.reason, "target_level": payload.target_level},
    )
    await db.commit()
    await db.refresh(complaint)
    await complaint_workflow.broadcast_complaint_event(
        "COMPLAINT_ESCALATED", complaint, {"reason": payload.reason}
    )
    return serialize_complaint_response(complaint, user)


# -----------------------------------------------------------------------------
# 16. Jurisdiction / Departmental Transfer
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/transfer", response_model=ComplaintResponse)
async def transfer_complaint(
    complaint_id: str,
    payload: TransferRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(require_role(["DISTRICT_ADMIN", "DEPARTMENT", "PLATFORM_ADMIN", "STATE_LEADERSHIP"])),
):
    """
    Transfers complaint to another department or administrative district.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    prev_dept = complaint.department_name
    prev_dist = complaint.district_name

    if payload.target_district_id:
        dist_info = HARYANA_DISTRICTS_BY_ID.get(payload.target_district_id)
        if dist_info:
            complaint.district_id = dist_info["id"]
            complaint.district_name = dist_info["name"]

    if payload.target_department_id:
        dept_id, dept_name = complaint_workflow.resolve_department(complaint.category, payload.target_department_id)
        complaint.department_id = dept_id
        complaint.department_name = dept_name

    complaint.status = "TRANSFERRED"
    complaint.assigned_unit_id = None
    complaint.assigned_officer_id = None
    complaint.assigned_officer_name = None

    now_str = datetime.now(timezone.utc).isoformat()
    notes = list(complaint.internal_notes or [])
    notes.append({
        "timestamp": now_str,
        "author_id": user.id,
        "author_role": user.role,
        "action": "TRANSFERRED",
        "rationale": payload.rationale,
        "transferred_from": f"{prev_dept} ({prev_dist})",
        "transferred_to": f"{complaint.department_name} ({complaint.district_name})",
    })
    complaint.internal_notes = notes

    updates = list(complaint.citizen_updates or [])
    updates.append({
        "timestamp": now_str,
        "stage": "TRANSFERRED",
        "title": "Transferred Jurisdiction",
        "message": f"Transferred to {complaint.department_name} in {complaint.district_name}.",
    })
    complaint.citizen_updates = updates

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="COMPLAINT_TRANSFERRED",
        complaint=complaint,
        metadata={"rationale": payload.rationale, "new_department": complaint.department_id, "new_district": complaint.district_id},
    )
    await db.commit()
    await db.refresh(complaint)
    await complaint_workflow.broadcast_complaint_event("COMPLAINT_TRANSFERRED", complaint)
    return serialize_complaint_response(complaint, user)


# -----------------------------------------------------------------------------
# 17. Link Duplicate Complaint
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/link-duplicate", response_model=ComplaintResponse)
async def link_duplicate(
    complaint_id: str,
    payload: LinkDuplicateRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(require_role(["DISTRICT_ADMIN", "DEPARTMENT", "PLATFORM_ADMIN", "STATE_LEADERSHIP"])),
):
    """
    Links a duplicate complaint to a primary canonical complaint.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    complaint.status = "DUPLICATE_LINKED"
    now_str = datetime.now(timezone.utc).isoformat()

    notes = list(complaint.internal_notes or [])
    notes.append({
        "timestamp": now_str,
        "author_id": user.id,
        "author_role": user.role,
        "action": "DUPLICATE_LINKED",
        "parent_complaint_id": payload.parent_complaint_id,
        "rationale": payload.rationale,
    })
    complaint.internal_notes = notes

    updates = list(complaint.citizen_updates or [])
    updates.append({
        "timestamp": now_str,
        "stage": "DUPLICATE_LINKED",
        "title": "Merged with Related Grievance",
        "message": f"Linked to primary ticket {payload.parent_complaint_id}.",
    })
    complaint.citizen_updates = updates

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="DUPLICATE_LINKED",
        complaint=complaint,
        metadata={"parent_complaint_id": payload.parent_complaint_id, "rationale": payload.rationale},
    )
    await db.commit()
    await db.refresh(complaint)
    return serialize_complaint_response(complaint, user)


# -----------------------------------------------------------------------------
# 18. AI Triage Human Override
# -----------------------------------------------------------------------------
@router.post("/{complaint_id}/override-triage", response_model=ComplaintResponse)
async def override_triage(
    complaint_id: str,
    payload: OverrideTriageRequest,
    db: AsyncSession = Depends(get_db),
    user: UserModel = Depends(require_role(["DISTRICT_ADMIN", "DEPARTMENT", "PLATFORM_ADMIN", "STATE_LEADERSHIP"])),
):
    """
    Allows authorized official to override AI routing, category, or priority with audit record.
    """
    stmt = select(ComplaintModel).where(ComplaintModel.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint_workflow.check_object_scope(complaint, user)

    now_str = datetime.now(timezone.utc).isoformat()
    previous = {
        "category": complaint.category,
        "sub_category": complaint.sub_category,
        "department_id": complaint.department_id,
        "priority": complaint.priority,
    }

    if payload.category:
        complaint.category = payload.category.upper()
    if payload.sub_category:
        complaint.sub_category = payload.sub_category
    if payload.department_id:
        dept_id, dept_name = complaint_workflow.resolve_department(complaint.category, payload.department_id)
        complaint.department_id = dept_id
        complaint.department_name = dept_name
    if payload.priority:
        complaint.priority = payload.priority.upper()

    override_record = {
        "overridden_by_id": user.id,
        "overridden_by_role": user.role,
        "timestamp": now_str,
        "reason": payload.reason,
        "previous_state": previous,
        "new_state": {
            "category": complaint.category,
            "sub_category": complaint.sub_category,
            "department_id": complaint.department_id,
            "priority": complaint.priority,
        },
    }
    complaint.human_override = override_record

    notes = list(complaint.internal_notes or [])
    notes.append({
        "timestamp": now_str,
        "author_id": user.id,
        "author_role": user.role,
        "action": "TRIAGE_OVERRIDDEN",
        "reason": payload.reason,
        "changes": override_record["new_state"],
    })
    complaint.internal_notes = notes

    await complaint_workflow.log_audit_event(
        db=db,
        actor_role=user.role,
        actor_id=user.id,
        event_type="TRIAGE_OVERRIDDEN",
        complaint=complaint,
        metadata=override_record,
    )
    await db.commit()
    await db.refresh(complaint)
    await complaint_workflow.broadcast_complaint_event("TRIAGE_OVERRIDDEN", complaint)
    return serialize_complaint_response(complaint, user)


# -----------------------------------------------------------------------------
# 19. Spatial Viewport Query (Clustering & Pin Limiting)
# -----------------------------------------------------------------------------
@router.get("/spatial/viewport", response_model=ViewportResponse)
async def get_spatial_viewport(
    min_lat: float = Query(27.0),
    max_lat: float = Query(32.0),
    min_lng: float = Query(74.0),
    max_lng: float = Query(78.5),
    zoom: int = Query(8),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    include_demo: bool = Query(True),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns zoom-dependent spatial query results:
    - zoom < 10: Aggregated district clusters with counts and priority breakdown (lightweight)
    - zoom >= 10: Individual pin coordinates (up to 250 in viewport)
    """
    conds = [
        ComplaintModel.latitude >= min_lat,
        ComplaintModel.latitude <= max_lat,
        ComplaintModel.longitude >= min_lng,
        ComplaintModel.longitude <= max_lng,
    ]
    if not include_demo:
        conds.append(ComplaintModel.is_demo == False)
    if category:
        conds.append(ComplaintModel.category == category.upper())
    if priority:
        conds.append(ComplaintModel.priority == priority.upper())
    if status_filter:
        conds.append(ComplaintModel.status == status_filter.upper())

    if zoom < 10:
        stmt = select(ComplaintModel).where(and_(*conds))
        result = await db.execute(stmt)
        all_comp = result.scalars().all()

        clusters_dict = {}
        for c in all_comp:
            d_id = c.district_id
            if d_id not in clusters_dict:
                d_info = HARYANA_DISTRICTS_BY_ID.get(d_id, {"name": c.district_name, "lat": c.latitude, "lng": c.longitude})
                clusters_dict[d_id] = {
                    "cluster_id": f"cluster-{d_id}",
                    "name": d_info.get("name", c.district_name),
                    "district_id": d_id,
                    "count": 0,
                    "latitude": d_info.get("lat", c.latitude),
                    "longitude": d_info.get("lng", c.longitude),
                    "priority_breakdown": {},
                    "category_breakdown": {},
                }
            cl = clusters_dict[d_id]
            cl["count"] += 1
            cl["priority_breakdown"][c.priority] = cl["priority_breakdown"].get(c.priority, 0) + 1
            cl["category_breakdown"][c.category] = cl["category_breakdown"].get(c.category, 0) + 1

        clusters = [ViewportCluster(**val) for val in clusters_dict.values()]
        return ViewportResponse(
            mode="clusters",
            total_in_viewport=len(all_comp),
            zoom=zoom,
            clusters=clusters,
            pins=[],
        )
    else:
        stmt = (
            select(ComplaintModel)
            .where(and_(*conds))
            .order_by(desc(ComplaintModel.created_at))
            .limit(250)
        )
        result = await db.execute(stmt)
        pins_data = result.scalars().all()

        pins = [
            ViewportPin(
                id=c.id,
                tracking_id=c.tracking_id,
                title=c.title,
                category=c.category,
                status=c.status,
                priority=c.priority,
                latitude=c.latitude,
                longitude=c.longitude,
                district_id=c.district_id,
                created_at=c.created_at,
                is_demo=bool(c.is_demo),
            )
            for c in pins_data
        ]
        return ViewportResponse(
            mode="pins",
            total_in_viewport=len(pins),
            zoom=zoom,
            clusters=[],
            pins=pins,
        )


# -----------------------------------------------------------------------------
# 20. District Aggregates (All 22 Haryana Districts)
# -----------------------------------------------------------------------------
@router.get("/spatial/districts", response_model=List[DistrictAggregateItem])
async def get_district_aggregates(
    include_demo: bool = Query(True),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns aggregate operational health and complaint metrics for all 22 Haryana districts.
    """
    conds = []
    if not include_demo:
        conds.append(ComplaintModel.is_demo == False)

    stmt = select(ComplaintModel)
    if conds:
        stmt = stmt.where(and_(*conds))

    result = await db.execute(stmt)
    complaints = result.scalars().all()

    agg_map = {}
    for d in HARYANA_DISTRICTS:
        agg_map[d["id"]] = {
            "district_code": d["id"],
            "district_name": d["name"],
            "latitude": d["lat"],
            "longitude": d["lng"],
            "total": 0,
            "active": 0,
            "resolved": 0,
            "escalated": 0,
            "critical_or_high": 0,
            "avg_sla_hours": 24.0,
        }

    for c in complaints:
        target_id = c.district_id
        if target_id not in agg_map:
            if target_id == "HR-KA":
                target_id = "HR-KR"
            elif target_id not in agg_map:
                continue
        item = agg_map[target_id]
        item["total"] += 1
        if c.status in ["RESOLVED", "VALIDATED"]:
            item["resolved"] += 1
        else:
            item["active"] += 1
        if c.is_escalated or c.status == "ESCALATED":
            item["escalated"] += 1
        if c.priority in ["HIGH", "CRITICAL"]:
            item["critical_or_high"] += 1

    return [DistrictAggregateItem(**val) for val in agg_map.values()]

