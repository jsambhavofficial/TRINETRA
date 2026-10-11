"""
NEXUS Phase 5 — Flagship Scenario & Repeatable Drill Router.
Endpoints:
- POST /api/v1/scenarios/r17/reset
- POST /api/v1/scenarios/r17/run-full
"""
from fastapi import APIRouter, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.scenario_service import scenario_service

router = APIRouter(prefix="", tags=["Flagship Operational Scenarios"])


@router.post("/scenarios/r17/reset")
async def reset_r17_scenario(
    world_id: str = Form(default="world-nexus-city-01"),
    db: AsyncSession = Depends(get_db)
):
    """Resets the flagship R17 flooding scenario to initial active state with 38cm flood depth."""
    return await scenario_service.reset_scenario(world_id=world_id, db=db)


@router.post("/scenarios/r17/run-full")
async def run_full_r17_flagship_scenario(
    world_id: str = Form(default="world-nexus-city-01"),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes the complete 10-step flagship demonstration:
    Ingestion -> Multimodal AI -> Fusion -> Impact -> Simulation -> Plan -> Authorize -> Act -> Verify -> Resolve.
    """
    return await scenario_service.execute_full_flagship_flow(world_id=world_id, db=db)


@router.post("/scenarios/r17/step/{step_index}")
async def execute_r17_scenario_step(
    step_index: int,
    world_id: str = "world-nexus-city-01",
    db: AsyncSession = Depends(get_db)
):
    """Executes a specific step (1 to 10) in the deterministic R17 demo timeline."""
    return await scenario_service.execute_step(step_index=step_index, world_id=world_id, db=db)

