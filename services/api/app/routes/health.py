"""
Health check endpoints for NEXUS API.
"""
from fastapi import APIRouter
from app.schemas.health import DependencyHealth, SystemHealth
from app.services.health_service import HealthService

router = APIRouter(tags=["Health"])


@router.get("/health")
async def basic_health():
    """Simple liveness probe for load balancers and orchestrators."""
    return {
        "status": "healthy",
        "service": "nexus-api",
        "version": "1.0.0-phase1"
    }


@router.get("/health/dependencies", response_model=SystemHealth)
async def dependency_health():
    """Deep readiness probe checking real Database, Redis, and Object Storage connections."""
    return await HealthService.get_system_health()
