"""
NEXUS Phase 4 Fusion and Incident Intelligence SQLAlchemy Models.
"""
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimeStampedModel


class EvidenceFeatureModel(TimeStampedModel):
    """Normalized multi-modal features extracted from an evidence item for spatial, temporal, semantic and visual fusion."""
    __tablename__ = "evidence_features"

    evidence_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    h3_cell: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    event_types: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    entity_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    keywords: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    embedding: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    temporal_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    temporal_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, default=0.8, nullable=False)
    source_reliability: Mapped[float] = mapped_column(Float, default=0.75, nullable=False)
    observed_facts: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    inferences: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    unknowns: Mapped[list] = mapped_column(JSON, default=list, nullable=False)


class IncidentEvidenceModel(TimeStampedModel):
    """Explicit semantic edge connecting an evidence item to a consolidated operational incident."""
    __tablename__ = "incident_evidence"

    incident_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    evidence_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(32), default="CORROBORATES", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.85, nullable=False)
    compatibility_scores: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)


class IncidentRelationshipModel(TimeStampedModel):
    """Incident-to-incident graph edge (e.g. RELATED_TO, DUPLICATE_OF, CAUSES, CONTRADICTS)."""
    __tablename__ = "incident_relationships"

    source_incident_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    target_incident_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(32), default="RELATED_TO", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.8, nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


class FusionDecisionModel(TimeStampedModel):
    """Auditable log of every AI and manual fusion decision with explainable sub-score vector."""
    __tablename__ = "fusion_decisions"

    incident_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    candidate_incident_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    evidence_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    scores: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    decision: Mapped[str] = mapped_column(String(32), default="FUSED", nullable=False, index=True)
    conflict_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    rationale: Mapped[str] = mapped_column(Text, default="", nullable=False)
    engine_version: Mapped[str] = mapped_column(String(32), default="fusion-v1.0", nullable=False)
    model_version: Mapped[str] = mapped_column(String(64), default="nexus-fusion-agent-v1", nullable=False)
    actor: Mapped[str] = mapped_column(String(64), default="AI_FUSION_ENGINE", nullable=False)


class EvidenceTimelineEventModel(TimeStampedModel):
    """Immutable sequence of operational evidence arrival and fusion lifecycle events."""
    __tablename__ = "evidence_timeline_events"

    incident_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    evidence_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
