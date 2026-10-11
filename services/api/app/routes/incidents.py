"""
Incident and Evidence REST API endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.permissions import require_permission
from app.db.session import get_db
from app.models.incident import EvidenceModel, IncidentModel
from app.schemas.incident import EvidenceResponse, IncidentResponse

router = APIRouter(prefix="", tags=["Incidents & Evidence"])


@router.get("/incidents", response_model=List[IncidentResponse])
async def list_incidents(
    world_id: Optional[str] = Query(None, description="Filter by world ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (ACTIVE, etc)"),
    severity: Optional[str] = Query(None, description="Filter by severity (HIGH, CRITICAL, etc)"),
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("incidents:read"))
):
    stmt = select(IncidentModel).order_by(IncidentModel.incident_number.desc())
    if world_id:
        stmt = stmt.where(IncidentModel.world_id == world_id)
    if status_filter:
        stmt = stmt.where(IncidentModel.status == status_filter.upper())
    if severity:
        stmt = stmt.where(IncidentModel.severity == severity.upper())

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("incidents:read"))
):
    result = await db.execute(select(IncidentModel).where(IncidentModel.id == incident_id))
    incident = result.scalars().first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident '{incident_id}' not found"
        )
    return incident


@router.get("/evidence", response_model=List[EvidenceResponse])
async def list_evidence(
    incident_id: Optional[str] = Query(None, description="Filter by incident ID"),
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("incidents:read"))
):
    stmt = select(EvidenceModel).order_by(EvidenceModel.captured_at.desc())
    if incident_id:
        stmt = stmt.where(EvidenceModel.incident_id == incident_id)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/evidence/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence(
    evidence_id: str,
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("incidents:read"))
):
    result = await db.execute(select(EvidenceModel).where(EvidenceModel.id == evidence_id))
    evidence = result.scalars().first()
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence '{evidence_id}' not found"
        )
    return evidence
