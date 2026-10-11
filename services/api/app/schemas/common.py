"""
Common Pydantic Schemas for spatial coordinates and errors.
"""
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class GeoPoint(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    altitude: Optional[float] = None


class GeoBounds(BaseModel):
    north: float
    south: float
    east: float
    west: float


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
