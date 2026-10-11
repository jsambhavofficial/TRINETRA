"""
NEXUS Phase 5 — What-If Simulation Scenario Models.
Tracks simulated parameters, travel time deltas, and alternative routing predictions.
"""
from typing import Optional
from sqlalchemy import Boolean, Float, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import TimeStampedModel


class SimulationScenarioModel(TimeStampedModel):
    __tablename__ = "simulation_scenarios"

    world_id: Mapped[str] = mapped_column(String(64), default="world-nexus-city-01", nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    scenario_type: Mapped[str] = mapped_column(String(64), nullable=False)  # ROAD_CLOSURE, BRIDGE_COLLAPSE, SEVERITY_SPIKE
    parameters: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    results: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
