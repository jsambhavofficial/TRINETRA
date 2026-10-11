"""
NEXUS Phase 5 — Impact Intelligence & Dependency Graph Router.
Endpoints:
- GET /api/v1/incidents/{incident_id}/impact
- GET /api/v1/incidents/{incident_id}/impact-graph
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.impact_service import impact_service

router = APIRouter(prefix="", tags=["Impact Intelligence & Dependency Graph"])


@router.get("/incidents/{incident_id}/impact")
async def get_incident_impact(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Evaluates multi-tier operational impact:
    - Direct impacts (severed roadways, flooded structures)
    - Access impacts (delayed hospital ingress, fire station egress)
    - Route impacts (assigned emergency vehicles traversing hazard zone)
    - Operational dependencies (utility nodes, pumping stations)
    - Dependency graph nodes and edges
    """
    result = await impact_service.evaluate_incident_impact(incident_id, db)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    return result


@router.get("/incidents/{incident_id}/impact-graph")
async def get_incident_impact_graph(
    incident_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Returns visual relationship graph (nodes & edges) for 3D Cesium and incident panels."""
    result = await impact_service.evaluate_incident_impact(incident_id, db)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    return result.get("graph", {"nodes": [], "edges": []})
