"""
NEXUS Role-Based Access Control and Permission Enforcement.
Implements centralized policy verification across operational domains.
"""
from typing import Callable, List, Optional
from fastapi import Depends, HTTPException, Header, status
from app.schemas.organization import UserResponse

# Role Permission Definitions
ROLE_PERMISSIONS = {
    "SUPER_ADMIN": ["*"],
    "COMMANDER": [
        "world:read",
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
        "admin:read"
    ],
    "REGIONAL_OPERATOR": [
        "world:read",
        "incidents:read",
        "incidents:write",
        "evidence:read",
        "scenarios:create",
        "scenarios:simulate",
        "plans:generate"
    ],
    "FACILITY_MANAGER": [
        "world:read",
        "incidents:read",
        "facilities:manage"
    ],
    "FIELD_RESPONDER": [
        "world:read",
        "incidents:read",
        "tasks:update",
        "telemetry:push"
    ],
    "VIEWER": [
        "world:read",
        "incidents:read"
    ],
    "REPORTER": [
        "evidence:submit"
    ]
}


def has_permission(role: str, permission: str) -> bool:
    """Checks whether a role possesses a given permission."""
    perms = ROLE_PERMISSIONS.get(role, [])
    if "*" in perms:
        return True
    if permission in perms:
        return True
    # Support wildcard domain matches (e.g. world:* matches world:read)
    domain = permission.split(":")[0]
    if f"{domain}:*" in perms:
        return True
    return False


async def get_current_user_role(
    x_user_role: Optional[str] = Header(default="COMMANDER", alias="X-User-Role")
) -> str:
    """Extracts operational role from request header (defaults to COMMANDER in development)."""
    if x_user_role not in ROLE_PERMISSIONS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or unrecognized operational role: {x_user_role}"
        )
    return x_user_role


def require_permission(required_permission: str) -> Callable:
    """Dependency that enforces a specific permission requirement."""
    async def permission_checker(role: str = Depends(get_current_user_role)):
        if not has_permission(role, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: role '{role}' lacks '{required_permission}'"
            )
        return role

    return permission_checker
