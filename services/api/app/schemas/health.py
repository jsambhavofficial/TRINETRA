"""
Health and Dependency Status Pydantic Schemas.
"""
from typing import Dict, Optional
from pydantic import BaseModel


class DependencyHealth(BaseModel):
    status: str  # "HEALTHY" | "DEGRADED" | "UNHEALTHY"
    latency_ms: float
    details: Optional[str] = None


class SystemHealth(BaseModel):
    status: str  # "HEALTHY" | "DEGRADED" | "UNHEALTHY"
    version: str
    uptime_seconds: float
    timestamp: str
    environment: str
    dependencies: Dict[str, DependencyHealth]
