"""
Organization, Role, and User Pydantic Response Schemas.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    parent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    permissions: List[str]
    created_at: datetime


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    role_id: str
    display_name: str
    email: str
    role_name: Optional[str] = None
    organization_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
