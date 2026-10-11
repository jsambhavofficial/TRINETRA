"""
NEXUS Phase 5 — Citizen Response Transparency & Public Alerts Router.
Endpoints:
- GET /api/v1/reports/{report_id}/tracking
- GET /api/v1/citizen/alerts
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.citizen_service import citizen_service

router = APIRouter(prefix="", tags=["Citizen Transparency & Public Alerts"])


@router.get("/reports/{report_id}/tracking")
async def get_report_tracking(
    report_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns public-safe real-time status and milestone timeline for a citizen-submitted report.
    Redacts internal identities and sensitive tactical operational details.
    """
    return await citizen_service.get_report_tracking(report_id, db)


@router.get("/citizen/alerts")
async def get_citizen_alerts(
    db: AsyncSession = Depends(get_db)
):
    """Returns active public safety alerts for citizen awareness and hazard avoidance."""
    return await citizen_service.list_public_alerts(db)
