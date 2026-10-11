"""
World, District, SpatialEntity, Asset, and WorldSnapshot Pydantic Response Schemas.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.common import GeoPoint
from app.schemas.incident import IncidentResponse


class WorldConfig(BaseModel):
    center: GeoPoint
    default_zoom: int
    bounds: Dict[str, float]
    time_zone: str
    enable_weather: bool
    enable_traffic: bool


class WorldResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    geometry: Dict[str, Any]
    config: Dict[str, Any]
    status: str
    created_at: datetime
    updated_at: datetime


class DistrictResponse(BaseModel):
    id: str
    world_id: str
    name: str
    code: str
    status: str
    operational_score: float
    population_estimate: int
    incident_count: int
    facility_count: int
    asset_count: int
    geometry: Dict[str, Any]
    color: str


class SpatialEntityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    world_id: str
    entity_type: str
    name: str
    geometry: Dict[str, Any]
    parent_entity_id: Optional[str] = None
    status: str
    attributes: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entity_id: Optional[str] = None
    asset_type: str
    name: str
    geometry: Dict[str, Any]
    state: Dict[str, Any]
    availability: str
    created_at: datetime
    updated_at: datetime


class WorldSnapshotResponse(BaseModel):
    world: WorldResponse
    districts: List[DistrictResponse]
    entities: List[SpatialEntityResponse]
    assets: List[AssetResponse]
    incidents: List[IncidentResponse]
    timestamp: str
    mode: str
