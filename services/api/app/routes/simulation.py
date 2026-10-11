"""
NEXUS Phase 5 — What-If Spatial & Operational Simulation Router.
Endpoints:
- POST /api/v1/simulation/simulate
- GET /api/v1/simulation/presets
"""
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.simulation_service import simulation_service

router = APIRouter(prefix="", tags=["What-If Simulation"])


class SimulationRequest(BaseModel):
    scenario_type: str = "ROAD_CLOSURE"
    target_entity_id: Optional[str] = "ent-road-r17"
    incident_id: Optional[str] = "inc-nxc-001"
    parameters: Optional[Dict[str, Any]] = None


@router.post("/simulation/simulate")
async def run_simulation(
    req: SimulationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes a temporary What-If operational simulation.
    Guaranteed non-mutating: does not alter live world state.
    """
    result = await simulation_service.run_scenario(
        scenario_type=req.scenario_type,
        target_entity_id=req.target_entity_id,
        incident_id=req.incident_id,
        parameters=req.parameters,
        db=db
    )
    return result


@router.get("/simulation/presets")
async def get_simulation_presets():
    """Returns catalog of pre-configured operational simulation scenarios."""
    return [
        {
            "id": "R17_COMPLETE_CLOSURE",
            "name": "Road R17 Corridor Complete Closure",
            "description": "Simulates complete closure of R17 between Bridge B01 and Memorial Way. Evaluates Corridor R14 bypass ETA.",
            "target_entity": "ent-road-r17",
            "parameters": {"water_depth_cm": 38, "traffic_restricted": True}
        },
        {
            "id": "SEVERITY_SPIKE",
            "name": "Flood Zone Escalation (500m Radius)",
            "description": "Simulates water level rising to 65cm with doubling hazard perimeter, risking auxiliary substation.",
            "target_entity": "inc-nxc-001",
            "parameters": {"water_depth_cm": 65, "radius_m": 500}
        },
        {
            "id": "BRIDGE_B02_RESTRICTION",
            "name": "Bridge B02 Structural Load Restriction",
            "description": "Simulates restricting Bridge B02 to light vehicles under 5 tons; heavy pump units diverted.",
            "target_entity": "ent-bridge-b02",
            "parameters": {"max_load_tons": 5.0}
        }
    ]
