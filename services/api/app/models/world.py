"""
World, SpatialEntity, and Asset SQLAlchemy Models.
"""
from typing import List, Optional
from sqlalchemy import Float, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimeStampedModel


class WorldModel(TimeStampedModel):
    __tablename__ = "worlds"

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    geometry: Mapped[dict] = mapped_column(JSON, nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE", nullable=False)

    entities: Mapped[List["SpatialEntityModel"]] = relationship(
        "SpatialEntityModel",
        back_populates="world",
        cascade="all, delete-orphan"
    )
    incidents: Mapped[List["IncidentModel"]] = relationship(  # type: ignore
        "IncidentModel",
        back_populates="world",
        cascade="all, delete-orphan"
    )


class SpatialEntityModel(TimeStampedModel):
    __tablename__ = "entities"

    world_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("worlds.id"),
        nullable=False,
        index=True
    )
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    geometry: Mapped[dict] = mapped_column(JSON, nullable=False)
    parent_entity_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("entities.id"),
        nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), default="OPERATIONAL", nullable=False)
    attributes: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    world: Mapped["WorldModel"] = relationship("WorldModel", back_populates="entities")
    assets: Mapped[List["AssetModel"]] = relationship(
        "AssetModel",
        back_populates="entity"
    )


class AssetModel(TimeStampedModel):
    __tablename__ = "assets"

    entity_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("entities.id"),
        nullable=True,
        index=True
    )
    asset_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    geometry: Mapped[dict] = mapped_column(JSON, nullable=False)
    state: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    availability: Mapped[str] = mapped_column(String(32), default="AVAILABLE", nullable=False)

    entity: Mapped[Optional["SpatialEntityModel"]] = relationship(
        "SpatialEntityModel",
        back_populates="assets"
    )
