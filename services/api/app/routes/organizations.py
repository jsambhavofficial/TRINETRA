"""
Organization, Role, and User REST API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.permissions import require_permission
from app.db.session import get_db
from app.models.organization import OrganizationModel, RoleModel, UserModel
from app.schemas.organization import OrganizationResponse, RoleResponse, UserResponse

router = APIRouter(prefix="", tags=["Organizations & Access"])


@router.get("/organizations", response_model=List[OrganizationResponse])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    result = await db.execute(select(OrganizationModel))
    return result.scalars().all()


@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    result = await db.execute(select(OrganizationModel).where(OrganizationModel.id == org_id))
    org = result.scalars().first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization '{org_id}' not found"
        )
    return org


@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    result = await db.execute(select(RoleModel))
    return result.scalars().all()


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _perm: str = Depends(require_permission("world:read"))
):
    result = await db.execute(select(UserModel))
    users = result.scalars().all()
    # Format with role and org name
    response = []
    for u in users:
        response.append(UserResponse(
            id=u.id,
            organization_id=u.organization_id,
            role_id=u.role_id,
            display_name=u.display_name,
            email=u.email,
            role_name=u.role.name if u.role else None,
            organization_name=u.organization.name if u.organization else None,
            created_at=u.created_at,
            updated_at=u.updated_at
        ))
    return response
