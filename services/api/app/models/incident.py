"""
Incident and Evidence SQLAlchemy Models.
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimeStampedModel


class IncidentModel(TimeStampedModel):
    __tablename__ = "incidents"

    world_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("worlds.id"),
        nullable=False,
        index=True
    )
    incident_number: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    incident_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="CANDIDATE", nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(32), default="MEDIUM", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    geometry: Mapped[dict] = mapped_column(JSON, nullable=False)
    affected_radius_meters: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    evidence_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    affected_entity_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    epistemic_status: Mapped[str] = mapped_column(String(32), default="OBSERVED", nullable=False)
    summary: Mapped[str] = mapped_column(String(1024), default="", nullable=False)
    resolved_entity_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    entity_match_confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    corroboration_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    epistemic_breakdown: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    fusion_rationale: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    merged_into_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    world: Mapped["WorldModel"] = relationship("WorldModel", back_populates="incidents")  # type: ignore
    evidence_items: Mapped[List["EvidenceModel"]] = relationship(
        "EvidenceModel",
        back_populates="incident",
        cascade="all, delete-orphan"
    )


class EvidenceModel(TimeStampedModel):
    __tablename__ = "evidence"

    incident_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("incidents.id"),
        nullable=True,
        index=True
    )
    evidence_type: Mapped[str] = mapped_column(String(32), nullable=False)
    source: Mapped[str] = mapped_column(String(128), nullable=False)
    object_uri: Mapped[str] = mapped_column(String(512), nullable=False)
    thumbnail_uri: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    geometry: Mapped[dict] = mapped_column(JSON, nullable=False)
    accuracy_meters: Mapped[float] = mapped_column(Float, default=10.0, nullable=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    analysis: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    privacy_state: Mapped[str] = mapped_column(String(32), default="PUBLIC", nullable=False)

    incident: Mapped[Optional["IncidentModel"]] = relationship(
        "IncidentModel",
        back_populates="evidence_items"
    )
