"""
TRINETRA Canonical Complaint & Unified Governance Workflow Model.
Represents a single persistent citizen grievance and closed-loop operational record
shared across Citizen, District Admin, Department, Field Officer, and State Leadership.
"""
from datetime import datetime, timezone
import secrets
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import TimeStampedModel, utc_now


def generate_tracking_id() -> str:
    """Generates an unpredictable, human-readable reference ID: TRN-2026-XXXXXX."""
    random_part = secrets.token_hex(3).upper()
    return f"TRN-2026-{random_part}"


class ComplaintModel(TimeStampedModel):
    __tablename__ = "complaints"

    # Reference & Identification
    tracking_id: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        default=generate_tracking_id,
        nullable=False,
    )

    # Reporter Details
    citizen_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    citizen_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    citizen_phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    # Classification & Content
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Scoped Jurisdiction (Haryana Administrative Geography)
    district_id: Mapped[str] = mapped_column(String(32), default="HR-GU", nullable=False, index=True)
    district_name: Mapped[str] = mapped_column(String(64), default="Gurugram", nullable=False)
    department_id: Mapped[str] = mapped_column(String(32), default="DEPT-PWD", nullable=False, index=True)
    department_name: Mapped[str] = mapped_column(String(64), default="Public Works Department", nullable=False)

    # Spatial Coordinates
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Evidence Attachments: [{uri, filename, mime, size_bytes}]
    attachments: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # Lifecycle State & Priority
    # States: SUBMITTED, ACKNOWLEDGED, UNDER_REVIEW, VERIFIED, ASSIGNED, IN_PROGRESS, AWAITING_VALIDATION, RESOLVED, REOPENED, REJECTED
    status: Mapped[str] = mapped_column(String(32), default="SUBMITTED", nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(32), default="MEDIUM", nullable=False)
    source: Mapped[str] = mapped_column(String(32), default="CITIZEN_WEB", nullable=False)

    # Incident Correlation Link (to Phase 4 Fusion / Incidents)
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    # Tactical Field Operations
    assigned_unit_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    assigned_officer_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    assigned_officer_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    assigned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # SOP Checklist: [{id, title, completed, completed_at, completed_by}]
    sop_checklist: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # Field Observations: [{author, text, created_at, unit_id}]
    field_notes: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # Proof of Work & Supervisor Validation
    # proof_data: {before_photo, after_photo, field_note, location_confirmed, submitted_at, unit_id}
    resolution_proof: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    validation_status: Mapped[str] = mapped_column(String(32), default="PENDING", nullable=False)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Citizen Feedback & Reopen Loop
    feedback_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    feedback_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reopen_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reopen_evidence_uri: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Escalations & SLA Management
    is_escalated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    escalation_level: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    escalation_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sla_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Multi-lingual & Voice Intake Support
    language: Mapped[str] = mapped_column(String(16), default="en", nullable=False)
    voice_transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    voice_audio_uri: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Granular Administrative Geography & Taxonomy
    sub_category: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    locality: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)

    # Explainable AI Triage & Routing Decision Metadata
    ai_triage: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ai_routing_rule: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    human_override: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Information Segregation (Internal Officer Notes vs Public Citizen Updates)
    internal_notes: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    citizen_updates: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # Synthetic Demonstration Flag
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
