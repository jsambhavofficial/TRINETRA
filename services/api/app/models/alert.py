"""
TRINETRA Phase 3 — Governance Alert SQLAlchemy Model.
Stores auditable governance alerts, SLA breaches, workload surges, and operational escalations.
"""
from datetime import datetime
import uuid
from sqlalchemy import Boolean, DateTime, Float, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, utc_now


class AlertModel(Base):
    __tablename__ = "governance_alerts"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=lambda: f"alt-{uuid.uuid4().hex[:12]}"
    )
    rule_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[str] = mapped_column(String(32), default="MEDIUM", nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="TRIGGERED", nullable=False, index=True)

    # Scoping
    district_id: Mapped[str] = mapped_column(String(32), nullable=True, index=True)
    department_id: Mapped[str] = mapped_column(String(64), nullable=True, index=True)

    # Entity Association
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    # Explanatory trigger rationale & SLA
    trigger_reason: Mapped[str] = mapped_column(String(1000), nullable=False)
    sla_configured_hours: Mapped[float] = mapped_column(Float, nullable=True)
    elapsed_hours: Mapped[float] = mapped_column(Float, nullable=True)

    # Lifecycle & Ownership
    assigned_to: Mapped[str] = mapped_column(String(64), nullable=True)
    acknowledged_by: Mapped[str] = mapped_column(String(64), nullable=True)
    acknowledged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[str] = mapped_column(String(64), nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_notes: Mapped[str] = mapped_column(String(1000), nullable=True)

    # Metadata & Provenance
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False
    )
