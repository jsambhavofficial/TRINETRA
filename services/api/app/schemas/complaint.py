"""
Pydantic Schemas for TRINETRA Complaint Lifecycle & Shared Governance Workflow.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ComplaintCreate(BaseModel):
    category: str = Field(..., description="Category (URBAN_FLOODING, POWER_OUTAGE, ROAD_BLOCKAGE, etc.)")
    title: str = Field(..., max_length=256)
    description: str
    district_id: Optional[str] = Field("HR-GU", description="Haryana District Code (e.g. HR-GU, HR-FA)")
    department_id: Optional[str] = Field(None, description="Target Line Department (optional, auto-routed if omitted)")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    citizen_name: Optional[str] = None
    citizen_phone: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: str
    tracking_id: str
    citizen_id: Optional[str] = None
    citizen_name: Optional[str] = None
    citizen_phone: Optional[str] = None
    category: str
    title: str
    description: str
    district_id: str
    district_name: str
    department_id: str
    department_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    attachments: List[Dict[str, Any]] = Field(default_factory=list)
    status: str
    priority: str
    source: str
    incident_id: Optional[str] = None
    assigned_unit_id: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    assigned_at: Optional[datetime] = None
    sop_checklist: List[Dict[str, Any]] = Field(default_factory=list)
    field_notes: List[Dict[str, Any]] = Field(default_factory=list)
    resolution_proof: Optional[Dict[str, Any]] = None
    validation_status: str
    rejection_reason: Optional[str] = None
    feedback_rating: Optional[int] = None
    feedback_comments: Optional[str] = None
    reopen_reason: Optional[str] = None
    reopen_evidence_uri: Optional[str] = None
    is_escalated: bool = False
    sla_deadline: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    timeline: Optional[List[Dict[str, Any]]] = None
    correlation: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class MilestoneItem(BaseModel):
    stage: str
    label: str
    completed: bool
    timestamp: Optional[str] = None
    actor_label: Optional[str] = None


class PublicTrackingResponse(BaseModel):
    tracking_id: str
    category: str
    title: str
    district_name: str
    department_name: str
    status: str
    stage_label: str
    created_at: datetime
    last_updated: datetime
    estimated_resolution: str
    milestones: List[MilestoneItem]
    is_resolved: bool
    feedback_submitted: bool


class TransitionRequest(BaseModel):
    target_status: str = Field(..., description="Target status in state machine")
    reason: Optional[str] = None
    notes: Optional[str] = None


class AssignmentRequest(BaseModel):
    assigned_unit_id: str = Field(..., description="Field unit ID, e.g. UNIT-AMB-01")
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    department_id: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None


class FieldProgressRequest(BaseModel):
    status: Optional[str] = Field(None, description="EN_ROUTE, ON_SCENE, or IN_PROGRESS")
    sop_step_id: Optional[str] = None
    sop_completed: Optional[bool] = None
    note: Optional[str] = None


class ProofSubmissionRequest(BaseModel):
    before_photo: Optional[str] = None
    after_photo: str = Field(..., description="Verified geotagged completion proof URL")
    field_note: str = Field(..., description="Detailed operational notes from field unit")
    location_confirmed: bool = True


class ValidationRequest(BaseModel):
    decision: str = Field(..., description="APPROVE or REJECT_REWORK")
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None


class CitizenFeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Citizen satisfaction rating from 1 to 5")
    comments: Optional[str] = None


class ReopenRequest(BaseModel):
    reopen_reason: str = Field(..., min_length=5, description="Detailed explanation why issue persists")
    reopen_evidence_uri: Optional[str] = None


class IncidentCorrelateRequest(BaseModel):
    incident_id: Optional[str] = None
    action: str = Field("LINK_EXISTING", description="LINK_EXISTING or CREATE_CANDIDATE")
    rationale: Optional[str] = None
