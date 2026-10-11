"""
Database Initialization and Seed Data Loader.
Populates NEXUS CITY operational twin and core organizations if not already present.
"""
from datetime import datetime, timezone
import json
from pathlib import Path
from sqlalchemy import select
from app.core.config import settings
from app.core.logging import logger
from app.db.session import async_session_factory, engine
from app.models.base import Base
from app.models.evidence import EvidenceItemModel, IncidentCandidateModel, ProcessingJobModel, ReportModel  # noqa: F401 Phase 3
from app.models.fusion import (  # noqa: F401 Phase 4
    EvidenceFeatureModel,
    IncidentEvidenceModel,
    IncidentRelationshipModel,
    FusionDecisionModel,
    EvidenceTimelineEventModel,
)
from app.models.incident import EvidenceModel, IncidentModel
from app.models.organization import OrganizationModel, RoleModel, UserModel
from app.models.world import AssetModel, SpatialEntityModel, WorldModel
from app.models.response import ResponsePlanModel, ActionExecutionModel  # noqa: F401 Phase 5
from app.models.simulation import SimulationScenarioModel  # noqa: F401 Phase 5
from app.models.field import FieldAssignmentModel, ReportCorroborationModel, CitizenFeedbackModel  # noqa: F401 Closed Loop


def parse_datetime(dt_str: str) -> datetime:
    if not dt_str:
        return datetime.now(timezone.utc)
    if dt_str.endswith("Z"):
        dt_str = dt_str[:-1] + "+00:00"
    return datetime.fromisoformat(dt_str)


async def init_db() -> None:
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if "sqlite" in settings.DATABASE_URL:
            from sqlalchemy import text
            for col, col_type in [
                ("resolved_entity_id", "VARCHAR(64)"),
                ("entity_match_confidence", "FLOAT DEFAULT 0.0"),
                ("corroboration_score", "FLOAT DEFAULT 0.0"),
                ("epistemic_breakdown", "JSON"),
                ("fusion_rationale", "VARCHAR(1024)"),
                ("merged_into_id", "VARCHAR(64)"),
            ]:
                try:
                    await conn.execute(text(f"ALTER TABLE incidents ADD COLUMN {col} {col_type}"))
                except Exception:
                    pass  # Column already exists

    async with async_session_factory() as session:
        # Check if already seeded
        result = await session.execute(select(WorldModel).limit(1))
        existing_world = result.scalars().first()
        if existing_world:
            logger.info("Database already contains operational data. Skipping seed.")
            return

        seed_file = Path(__file__).resolve().parents[4] / "data" / "seed" / "nexus_city.json"
        if not seed_file.exists():
            # Try alternate relative path
            seed_file = Path("data/seed/nexus_city.json")

        if not seed_file.exists():
            logger.warning(f"Seed file not found at {seed_file}. Skipping seed data.")
            return

        logger.info(f"Loading synthetic seed data from {seed_file}...")
        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. World
        world_data = data.get("world", {})
        world = WorldModel(
            id=world_data.get("id"),
            name=world_data.get("name"),
            type=world_data.get("type"),
            geometry=world_data.get("geometry"),
            config=world_data.get("config"),
            status=world_data.get("status", "ACTIVE")
        )
        session.add(world)

        # 2. Organizations
        org_map = {}
        for org in data.get("organizations", []):
            org_obj = OrganizationModel(
                id=org.get("id"),
                name=org.get("name"),
                type=org.get("type"),
                parent_id=org.get("parentId")
            )
            session.add(org_obj)
            org_map[org_obj.id] = org_obj

        # 3. Roles
        for role in data.get("roles", []):
            role_obj = RoleModel(
                id=role.get("id"),
                name=role.get("name"),
                permissions=role.get("permissions", [])
            )
            session.add(role_obj)

        # 4. Users
        for user in data.get("users", []):
            user_obj = UserModel(
                id=user.get("id"),
                organization_id=user.get("organizationId"),
                role_id=user.get("roleId"),
                display_name=user.get("displayName"),
                email=user.get("email")
            )
            session.add(user_obj)

        # 5. Entities
        for ent in data.get("entities", []):
            ent_obj = SpatialEntityModel(
                id=ent.get("id"),
                world_id=ent.get("worldId"),
                entity_type=ent.get("entityType"),
                name=ent.get("name"),
                geometry=ent.get("geometry"),
                parent_entity_id=ent.get("parentEntityId"),
                status=ent.get("status", "OPERATIONAL"),
                attributes=ent.get("attributes", {})
            )
            session.add(ent_obj)

        # 6. Assets
        for ast in data.get("assets", []):
            ast_obj = AssetModel(
                id=ast.get("id"),
                entity_id=ast.get("entityId"),
                asset_type=ast.get("assetType"),
                name=ast.get("name"),
                geometry=ast.get("geometry"),
                state=ast.get("state", {}),
                availability=ast.get("availability", "AVAILABLE")
            )
            session.add(ast_obj)

        # 7. Incidents
        for inc in data.get("incidents", []):
            inc_obj = IncidentModel(
                id=inc.get("id"),
                world_id=inc.get("worldId"),
                incident_number=inc.get("incidentNumber"),
                title=inc.get("title"),
                incident_type=inc.get("incidentType"),
                status=inc.get("status"),
                severity=inc.get("severity"),
                confidence=inc.get("confidence", 0.8),
                geometry=inc.get("geometry"),
                affected_radius_meters=inc.get("affectedRadiusMeters", 100.0),
                started_at=parse_datetime(inc.get("startedAt")),
                detected_at=parse_datetime(inc.get("detectedAt")),
                evidence_count=inc.get("evidenceCount", 0),
                affected_entity_count=inc.get("affectedEntityCount", 0),
                epistemic_status=inc.get("epistemicStatus", "OBSERVED"),
                summary=inc.get("summary", "")
            )
            session.add(inc_obj)

        # 8. Evidence
        for ev in data.get("evidence", []):
            ev_obj = EvidenceModel(
                id=ev.get("id"),
                incident_id=ev.get("incidentId"),
                evidence_type=ev.get("evidenceType"),
                source=ev.get("source"),
                object_uri=ev.get("objectUri"),
                geometry=ev.get("geometry"),
                accuracy_meters=ev.get("accuracyMeters", 10.0),
                captured_at=parse_datetime(ev.get("capturedAt")),
                received_at=parse_datetime(ev.get("receivedAt")),
                analysis=ev.get("analysis"),
                confidence=ev.get("confidence", 0.8),
                privacy_state=ev.get("privacyState", "PUBLIC")
            )
            session.add(ev_obj)

        await session.commit()
        logger.info("Successfully populated NEXUS CITY seed data.")
