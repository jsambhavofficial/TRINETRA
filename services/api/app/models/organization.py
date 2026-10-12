"""
Organization, Role, and User SQLAlchemy Models.
Extended for TRINETRA with real authentication, district/department/unit scoping, and RBAC.
"""
from typing import List, Optional
from sqlalchemy import Boolean, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimeStampedModel


class OrganizationModel(TimeStampedModel):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    parent_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("organizations.id"),
        nullable=True
    )

    parent: Mapped[Optional["OrganizationModel"]] = relationship(
        "OrganizationModel",
        remote_side="OrganizationModel.id",
        backref="children"
    )
    users: Mapped[List["UserModel"]] = relationship(
        "UserModel",
        back_populates="organization"
    )


class RoleModel(TimeStampedModel):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    permissions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    users: Mapped[List["UserModel"]] = relationship(
        "UserModel",
        back_populates="role_rel"
    )


class UserModel(TimeStampedModel):
    __tablename__ = "users"

    # Legacy foreign keys (nullable for backwards compatibility)
    organization_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("organizations.id"),
        nullable=True
    )
    role_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("roles.id"),
        nullable=True
    )

    # Core TRINETRA Identity & Credentials
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)

    # Server-enforced Role: STATE_LEADERSHIP, DISTRICT_ADMIN, DEPARTMENT, FIELD_OFFICER, CITIZEN, PLATFORM_ADMIN
    role: Mapped[str] = mapped_column(String(32), default="CITIZEN", nullable=False)

    # Authorized Governance Scopes
    district_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)     # e.g., 'HR-GU' (Gurugram)
    department_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)   # e.g., 'DEPT-HEALTH'
    unit_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)         # e.g., 'UNIT-AMB-01'
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    organization: Mapped[Optional["OrganizationModel"]] = relationship(
        "OrganizationModel",
        back_populates="users"
    )
    role_rel: Mapped[Optional["RoleModel"]] = relationship(
        "RoleModel",
        back_populates="users"
    )
