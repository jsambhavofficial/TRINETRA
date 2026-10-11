"""
AEGIS — Field Operations, Community Corroboration & Verification Loop Models.
Enables closed operational loops connecting:
Citizen observations -> Corroboration -> Department Assignment -> Field Officer -> Dispatch -> SOP -> Proof -> Validation -> Citizen Confirmation.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimeStampedModel


class ReportCorroborationModel(TimeStampedModel):
    __tablename__ = "report_corroborations"

    report_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    incident_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    citizen_token: Mapped[str] = mapped_column(String(128), nullable=False, index=True)  # Anonymized device hash
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    evidence_uri: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    __table_args__ = (
        UniqueConstraint("report_id", "citizen_token", name="uq_report_citizen_corroboration"),
    )


class FieldAssignmentModel(TimeStampedModel):
    __tablename__ = "field_assignments"

    incident_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    incident_number: Mapped[Optional[int]] = mapped_column(nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    location_name: Mapped[str] = mapped_column(String(256), default="Sector 17", nullable=False)
    latitude: Mapped[float] = mapped_column(Float, default=26.9180, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, default=75.7920, nullable=False)
    department: Mapped[str] = mapped_column(String(64), default="Electricity", nullable=False)
    priority: Mapped[str] = mapped_column(String(32), default="HIGH", nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    status: Mapped[str] = mapped_column(
        String(32), default="NEW", nullable=False, index=True
    )  # NEW, ACCEPTED, DISPATCHED, EN_ROUTE, ON_SITE, WORKING, PROOF_PENDING, VALIDATION_PENDING, COMPLETED, REWORK_REQUIRED

    # Assigned Response Unit
    assigned_unit_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    assigned_unit_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    unit_status: Mapped[str] = mapped_column(
        String(32), default="AVAILABLE", nullable=False
    )  # AVAILABLE, DISPATCHED, EN_ROUTE, ON_SITE, WORKING, COMPLETED

    # SOP Checklist & Category
    sop_category: Mapped[str] = mapped_column(String(64), default="POWER_GRID", nullable=False)
    sop_checklist: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)

    # Observations & Notes
    field_notes: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)

    # Proof of Work
    proof_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Authority Validation
    validation_status: Mapped[str] = mapped_column(String(32), default="PENDING", nullable=False)  # PENDING, VALIDATED, REJECTED, REWORK_REQUIRED
    validation_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Operational Timeline Log
    audit_trail: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)


class CitizenFeedbackModel(TimeStampedModel):
    __tablename__ = "citizen_feedback"

    incident_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    citizen_token: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reopen_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reopen_evidence_uri: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    __table_args__ = (
        UniqueConstraint("incident_id", "citizen_token", name="uq_incident_citizen_feedback"),
    )
