"""
Incident and Evidence Pydantic Response Schemas.
"""
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    world_id: str
    incident_number: int
    title: str
    incident_type: str
    status: str
    severity: str
    confidence: float
    geometry: Dict[str, Any]
    affected_radius_meters: float
    started_at: datetime
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    evidence_count: int
    affected_entity_count: int
    epistemic_status: str
    summary: str
    resolved_entity_id: Optional[str] = None
    entity_match_confidence: Optional[float] = 0.0
    corroboration_score: Optional[float] = 0.0
    epistemic_breakdown: Optional[Dict[str, Any]] = None
    fusion_rationale: Optional[str] = None
    merged_into_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_id: Optional[str] = None
    evidence_type: str
    source: str
    object_uri: str
    thumbnail_uri: Optional[str] = None
    geometry: Dict[str, Any]
    accuracy_meters: float
    captured_at: datetime
    received_at: datetime
    analysis: Optional[Dict[str, Any]] = None
    confidence: float
    privacy_state: str
    created_at: datetime
