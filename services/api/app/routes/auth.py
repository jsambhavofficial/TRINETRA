"""
TRINETRA Authentication and Identity Management Router.
Provides citizen self-registration, credential login/logout, session tokens,
and protected administrator account provisioning.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.dependencies import get_current_user, require_role
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.organization import UserModel
from app.schemas.auth import (
    AuthTokenResponse,
    CitizenRegisterRequest,
    LoginRequest,
    UserProfileResponse,
    UserProvisionRequest,
)

router = APIRouter(prefix="/auth", tags=["TRINETRA Authentication & RBAC"])


def _set_auth_cookie(response: Response, token: str) -> None:
    """Sets a secure HttpOnly cookie for session persistence."""
    response.set_cookie(
        key="trinetra_session",
        value=token,
        httponly=True,
        max_age=86400,  # 24 hours
        samesite="lax",
        secure=False,  # Set to True in HTTPS production
        path="/"
    )


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_citizen(
    payload: CitizenRegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Public self-registration for citizens.
    Privileged roles cannot be provisioned via this endpoint (strictly enforces CITIZEN).
    """
    # Check if email is already registered
    existing_stmt = select(UserModel).where(UserModel.email == payload.email.lower().strip())
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address is already registered."
        )

    user_id = f"user-cit-{uuid.uuid4().hex[:12]}"
    hashed_pwd = hash_password(payload.password)

    new_user = UserModel(
        id=user_id,
        organization_id="org-nexus-ops",
        role_id="role-viewer",
        email=payload.email.lower().strip(),
        display_name=payload.display_name.strip(),
        hashed_password=hashed_pwd,
        role="CITIZEN",
        district_id=payload.district_id,
        phone=payload.phone,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token_payload = {
        "sub": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "display_name": new_user.display_name,
        "district_id": new_user.district_id,
    }
    access_token = create_access_token(token_payload)
    _set_auth_cookie(response, access_token)

    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserProfileResponse.model_validate(new_user)
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticates user credentials and issues a signed JWT token & HttpOnly cookie.
    """
    stmt = select(UserModel).where(UserModel.email == payload.email.lower().strip())
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact system administrator.",
        )

    token_payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "display_name": user.display_name,
        "district_id": user.district_id,
        "department_id": user.department_id,
        "unit_id": user.unit_id,
    }
    access_token = create_access_token(token_payload)
    _set_auth_cookie(response, access_token)

    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserProfileResponse.model_validate(user)
    )


@router.post("/logout")
async def logout(response: Response):
    """Invalidates the caller's session cookie."""
    response.delete_cookie(key="trinetra_session", path="/")
    return {"message": "Session terminated successfully"}


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: UserModel = Depends(get_current_user)
):
    """Returns the authenticated user's profile and authorized governance scope."""
    return UserProfileResponse.model_validate(current_user)


@router.post("/provision", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def provision_user(
    payload: UserProvisionRequest,
    admin_user: UserModel = Depends(require_role(["PLATFORM_ADMIN", "STATE_LEADERSHIP"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Privileged account provisioning endpoint.
    Restricted strictly to authorized Administrators and State Leadership.
    """
    from app.auth.dependencies import VALID_ROLES
    if payload.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid operational role. Allowed: {sorted(list(VALID_ROLES))}"
        )

    existing_stmt = select(UserModel).where(UserModel.email == payload.email.lower().strip())
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    user_id = f"user-{payload.role.lower()[:8]}-{uuid.uuid4().hex[:8]}"
    hashed_pwd = hash_password(payload.password)

    new_user = UserModel(
        id=user_id,
        organization_id="org-nexus-ops",
        role_id="role-viewer",
        email=payload.email.lower().strip(),
        display_name=payload.display_name.strip(),
        hashed_password=hashed_pwd,
        role=payload.role,
        district_id=payload.district_id,
        department_id=payload.department_id,
        unit_id=payload.unit_id,
        phone=payload.phone,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserProfileResponse.model_validate(new_user)
