"""
Organization, Role, and User SQLAlchemy Models.
"""
from typing import List, Optional
from sqlalchemy import ForeignKey, JSON, String
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
        back_populates="role"
    )


class UserModel(TimeStampedModel):
    __tablename__ = "users"

    organization_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("organizations.id"),
        nullable=False
    )
    role_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("roles.id"),
        nullable=False
    )
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)

    organization: Mapped["OrganizationModel"] = relationship(
        "OrganizationModel",
        back_populates="users"
    )
    role: Mapped["RoleModel"] = relationship(
        "RoleModel",
        back_populates="users"
    )
