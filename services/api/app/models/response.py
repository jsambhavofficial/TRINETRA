"""
NEXUS Phase 5 — AI Response Planner, Action Authorization & Execution Models.
Tracks operational plans, action workflows, authorization gates, and verification loops.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import TimeStampedModel


class ResponsePlanModel(TimeStampedModel):
    __tablename__ = "response_plans"

    incident_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("incidents.id"),
        nullable=False,
        index=True
    )
    objective: Mapped[str] = mapped_column(String(256), nullable=False)
    priority: Mapped[str] = mapped_column(String(32), default="HIGH", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="PROPOSED", nullable=False)  # PROPOSED, APPROVED, EXECUTING, COMPLETED
    actions_list: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)
    policy_evaluation: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_by: Mapped[str] = mapped_column(String(64), default="SYSTEM_AI", nullable=False)


class ActionExecutionModel(TimeStampedModel):
    __tablename__ = "action_executions"

    plan_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    incident_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("incidents.id"),
        nullable=True,
        index=True
    )
    action_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str] = mapped_column(String(1024), default="", nullable=False)
    target_entity_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    target_asset_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, EXECUTING, COMPLETED, REJECTED
    actor: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    approval_notes: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    executed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    execution_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    verification_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
