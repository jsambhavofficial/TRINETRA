"""
Pydantic Schemas for TRINETRA Authentication and User Management.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CitizenRegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=128)
    password: str = Field(..., min_length=6, max_length=128)
    display_name: str = Field(..., min_length=2, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=32)
    district_id: Optional[str] = Field(default=None, max_length=32)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=128)
    password: str = Field(..., min_length=1)


class UserProvisionRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=128)
    password: str = Field(..., min_length=6, max_length=128)
    display_name: str = Field(..., min_length=2, max_length=128)
    role: str = Field(..., description="STATE_LEADERSHIP, DISTRICT_ADMIN, DEPARTMENT, FIELD_OFFICER, PLATFORM_ADMIN")
    district_id: Optional[str] = None
    department_id: Optional[str] = None
    unit_id: Optional[str] = None
    phone: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: str
    email: str
    display_name: str
    role: str
    district_id: Optional[str] = None
    department_id: Optional[str] = None
    unit_id: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
