"""
World, District, SpatialEntity, Asset, and WorldSnapshot REST API endpoints.
"""
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.permissions import require_permission
from app.db.session import get_db
from app.models.incident import IncidentModel
from app.models.world import AssetModel, SpatialEntityModel, WorldModel
from app.schemas.incident import IncidentResponse
from app.schemas.world import (
    AssetResponse,
    DistrictResponse,
    SpatialEntityResponse,
    WorldResponse,
    WorldSnapshotResponse,
)
from app.services.district_service import get_seed_districts

router = APIRouter(prefix="", tags=["Worlds & Spatial Entities"])


@router.get("/worlds", response_model=List[WorldResponse])
async def list_worlds(
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    result = await db.execute(select(WorldModel))
    return result.scalars().all()


@router.get("/worlds/{world_id}", response_model=WorldResponse)
async def get_world(
    world_id: str,
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    result = await db.execute(select(WorldModel).where(WorldModel.id == world_id))
    world = result.scalars().first()
    if not world:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"World '{world_id}' not found"
        )
    return world


@router.get("/worlds/{world_id}/districts", response_model=List[DistrictResponse])
async def get_world_districts(
    world_id: str,
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    districts = get_seed_districts(world_id)
    return districts


@router.get("/worlds/{world_id}/snapshot", response_model=WorldSnapshotResponse)
async def get_world_snapshot(
    world_id: str,
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    """
    Returns an aggregated world model snapshot containing world metadata,
    districts, spatial entities, active operational assets, and current incidents.
    """
    # 1. World
    world_res = await db.execute(select(WorldModel).where(WorldModel.id == world_id))
    world = world_res.scalars().first()
    if not world:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"World '{world_id}' not found"
        )

    # 2. Districts
    districts = get_seed_districts(world_id)

    # 3. Entities
    entities_res = await db.execute(select(SpatialEntityModel).where(SpatialEntityModel.world_id == world_id))
    entities = entities_res.scalars().all()

    # 4. Assets
    assets_res = await db.execute(select(AssetModel))
    assets = assets_res.scalars().all()

    # 5. Incidents
    incidents_res = await db.execute(
        select(IncidentModel)
        .where(IncidentModel.world_id == world_id)
        .order_by(IncidentModel.incident_number.desc())
    )
    incidents = incidents_res.scalars().all()

    now_iso = datetime.now(timezone.utc).isoformat()

    return WorldSnapshotResponse(
        world=world,
        districts=districts,
        entities=entities,
        assets=assets,
        incidents=incidents,
        timestamp=now_iso,
        mode="LIVE"
    )


@router.get("/worlds/{world_id}/entities", response_model=List[SpatialEntityResponse])
async def get_world_entities(
    world_id: str,
    entity_type: Optional[str] = Query(None, description="Filter by entity type (HOSPITAL, ROAD, etc)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    stmt = select(SpatialEntityModel).where(SpatialEntityModel.world_id == world_id)
    if entity_type:
        stmt = stmt.where(SpatialEntityModel.entity_type == entity_type.upper())
    if status_filter:
        stmt = stmt.where(SpatialEntityModel.status == status_filter.upper())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/worlds/{world_id}/assets", response_model=List[AssetResponse])
async def get_world_assets(
    world_id: str,
    asset_type: Optional[str] = Query(None, description="Filter by asset type"),
    availability: Optional[str] = Query(None, description="Filter by availability status"),
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    stmt = select(AssetModel)
    if asset_type:
        stmt = stmt.where(AssetModel.asset_type == asset_type.upper())
    if availability:
        stmt = stmt.where(AssetModel.availability == availability.upper())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/worlds/{world_id}/incidents", response_model=List[IncidentResponse])
async def get_world_incidents(
    world_id: str,
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("incidents:read"))
):
    stmt = select(IncidentModel).where(IncidentModel.world_id == world_id).order_by(IncidentModel.incident_number.desc())
    if status_filter:
        stmt = stmt.where(IncidentModel.status == status_filter.upper())
    if severity:
        stmt = stmt.where(IncidentModel.severity == severity.upper())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/entities", response_model=List[SpatialEntityResponse])
async def list_entities(
    world_id: Optional[str] = Query(None, description="Filter by world ID"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (HOSPITAL, ROAD, etc)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by operational status"),
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    stmt = select(SpatialEntityModel)
    if world_id:
        stmt = stmt.where(SpatialEntityModel.world_id == world_id)
    if entity_type:
        stmt = stmt.where(SpatialEntityModel.entity_type == entity_type.upper())
    if status_filter:
        stmt = stmt.where(SpatialEntityModel.status == status_filter.upper())

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/entities/{entity_id}", response_model=SpatialEntityResponse)
async def get_entity(
    entity_id: str,
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    result = await db.execute(select(SpatialEntityModel).where(SpatialEntityModel.id == entity_id))
    entity = result.scalars().first()
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Spatial Entity '{entity_id}' not found"
        )
    return entity


@router.get("/assets", response_model=List[AssetResponse])
async def list_assets(
    asset_type: Optional[str] = Query(None, description="Filter by asset type (AMBULANCE, etc)"),
    availability: Optional[str] = Query(None, description="Filter by availability status"),
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    stmt = select(AssetModel)
    if asset_type:
        stmt = stmt.where(AssetModel.asset_type == asset_type.upper())
    if availability:
        stmt = stmt.where(AssetModel.availability == availability.upper())

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    result = await db.execute(select(AssetModel).where(AssetModel.id == asset_id))
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_id}' not found"
        )
    return asset
