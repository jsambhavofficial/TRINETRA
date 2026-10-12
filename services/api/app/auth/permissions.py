"""
TRINETRA Role-Based Access Control and Permission Enforcement.
Implements centralized policy verification across state governance domains.
Requires cryptographically authenticated identity.
"""
from typing import Callable, List, Optional
from fastapi import Depends, HTTPException, Request, status
from app.auth.dependencies import get_current_user
from app.models.organization import UserModel

# Canonical TRINETRA & Legacy Role Permission Definitions
ROLE_PERMISSIONS = {
    "PLATFORM_ADMIN": ["*"],
    "SUPER_ADMIN": ["*"],
    "STATE_LEADERSHIP": [
        "world:read",
        "governance:read",
        "incidents:read",
        "incidents:write",
        "evidence:read",
        "evidence:write",
        "scenarios:create",
        "scenarios:simulate",
        "plans:generate",
        "actions:approve",
        "actions:execute",
        "audit:read",
        "admin:read",
        "fusion:review",
        "fusion:decide",
    ],
    "COMMANDER": [
        "world:read",
        "governance:read",
        "incidents:read",
        "incidents:write",
        "evidence:read",
        "evidence:write",
        "scenarios:create",
        "scenarios:simulate",
        "plans:generate",
        "actions:approve",
        "actions:execute",
        "audit:read",
        "admin:read",
        "fusion:review",
        "fusion:decide",
    ],
    "DISTRICT_ADMIN": [
        "world:read",
        "governance:read",
        "incidents:read",
        "incidents:write",
        "evidence:read",
        "fusion:review",
        "tasks:assign",
    ],
    "REGIONAL_OPERATOR": [
        "world:read",
        "governance:read",
        "incidents:read",
        "incidents:write",
        "evidence:read",
        "fusion:review",
    ],
    "DEPARTMENT": [
        "world:read",
        "governance:read",
        "incidents:read",
        "tasks:assign",
        "tasks:review",
        "facilities:manage",
    ],
    "FACILITY_MANAGER": [
        "world:read",
        "incidents:read",
        "facilities:manage",
    ],
    "FIELD_OFFICER": [
        "world:read",
        "tasks:update",
        "telemetry:push",
        "evidence:submit",
    ],
    "FIELD_RESPONDER": [
        "world:read",
        "tasks:update",
        "telemetry:push",
        "evidence:submit",
    ],
    "CITIZEN": [
        "reports:submit",
        "reports:read_own",
        "tracking:read",
    ],
    "VIEWER": [
        "world:read",
        "incidents:read",
    ],
    "REPORTER": [
        "evidence:submit",
    ],
}


def has_permission(role: str, permission: str) -> bool:
    """Checks whether a role possesses a given permission."""
    perms = ROLE_PERMISSIONS.get(role, [])
    if "*" in perms:
        return True
    if permission in perms:
        return True
    domain = permission.split(":")[0]
    if f"{domain}:*" in perms:
        return True
    return False


async def get_current_user_role(
    user: UserModel = Depends(get_current_user)
) -> str:
    """Extracts verified operational role from authenticated user session."""
    return user.role


def require_permission(required_permission: str) -> Callable:
    """Dependency that enforces a specific permission requirement on authenticated caller."""
    async def permission_checker(user: UserModel = Depends(get_current_user)) -> UserModel:
        if not has_permission(user.role, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: role '{user.role}' lacks '{required_permission}'"
            )
        return user

    return permission_checker
