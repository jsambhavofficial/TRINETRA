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
from app.models.audit import AuditEventModel
from app.models.complaint import ComplaintModel, generate_tracking_id
from app.models.alert import AlertModel



def parse_datetime(dt_str: str) -> datetime:
    if not dt_str:
        return datetime.now(timezone.utc)
    if dt_str.endswith("Z"):
        dt_str = dt_str[:-1] + "+00:00"
    return datetime.fromisoformat(dt_str)


def load_csv_complaints() -> list:
    """Loads complete Haryana governance dataset from CSV file if present."""
    candidates = [
        Path(__file__).resolve().parents[2] / "data" / "seed" / "haryana_full_governance.csv",
        Path(__file__).resolve().parents[4] / "data" / "seed" / "haryana_full_governance.csv",
        Path("services/api/data/seed/haryana_full_governance.csv"),
        Path("data/seed/haryana_full_governance.csv"),
        Path("/app/data/seed/haryana_full_governance.csv"),
        Path("/app/services/api/data/seed/haryana_full_governance.csv"),
    ]
    csv_path = next((p for p in candidates if p.exists()), None)
    if not csv_path or not csv_path.exists():
        return []
    import csv
    complaints = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cr_at = parse_datetime(row["created_at"]) if row.get("created_at") else datetime.now(timezone.utc)
            res_at = parse_datetime(row["resolved_at"]) if row.get("resolved_at") else None
            complaints.append(
                ComplaintModel(
                    id=row["id"],
                    tracking_id=row["tracking_id"],
                    citizen_id="usr-citizen-rohit" if "Rohit" in row["citizen_name"] else f"usr-cit-{row['district_id'].lower()}",
                    citizen_name=row["citizen_name"],
                    citizen_phone=row["citizen_phone"],
                    district_id=row["district_id"],
                    district_name=row["district_name"],
                    department_id=row["department_id"],
                    department_name=row["department_name"],
                    category=row["category"],
                    title=row["title"],
                    description=row["description"],
                    latitude=float(row["latitude"]) if row.get("latitude") else None,
                    longitude=float(row["longitude"]) if row.get("longitude") else None,
                    address=row["address"],
                    status=row["status"],
                    priority=row["priority"],
                    assigned_unit_id=row["assigned_unit_id"] if row.get("assigned_unit_id") else None,
                    assigned_officer_name=row["assigned_officer_name"] if row.get("assigned_officer_name") else None,
                    created_at=cr_at,
                    resolved_at=res_at,
                    resolution_proof={"note": "Remediation verified by field unit", "status": "APPROVED"} if row["status"] == "RESOLVED" else None,
                    validation_status="APPROVED" if row["status"] == "RESOLVED" else ("PENDING" if row["status"] == "AWAITING_VALIDATION" else None),
                )
            )
    return complaints



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

            # Safe TRINETRA Users table schema evolution
            for col, col_type in [
                ("hashed_password", "VARCHAR(256)"),
                ("role", "VARCHAR(32) DEFAULT 'CITIZEN'"),
                ("district_id", "VARCHAR(32)"),
                ("department_id", "VARCHAR(32)"),
                ("unit_id", "VARCHAR(32)"),
                ("phone", "VARCHAR(32)"),
                ("is_active", "BOOLEAN DEFAULT 1"),
            ]:
                try:
                    await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                except Exception:
                    pass  # Column already exists

            # Safe Reports table district & reporter linkage
            for col, col_type in [
                ("district_id", "VARCHAR(32)"),
            ]:
                try:
                    await conn.execute(text(f"ALTER TABLE reports ADD COLUMN {col} {col_type}"))
                except Exception:
                    pass

            # Safe Complaints table Phase 2-7 schema evolution
            for col, col_type in [
                ("language", "VARCHAR(16) DEFAULT 'en'"),
                ("voice_transcript", "TEXT"),
                ("voice_audio_uri", "VARCHAR(512)"),
                ("sub_category", "VARCHAR(64)"),
                ("locality", "VARCHAR(128)"),
                ("ai_triage", "JSON"),
                ("ai_routing_rule", "VARCHAR(128)"),
                ("human_override", "JSON"),
                ("internal_notes", "JSON DEFAULT '[]'"),
                ("citizen_updates", "JSON DEFAULT '[]'"),
                ("is_demo", "BOOLEAN DEFAULT 0"),
            ]:
                try:
                    await conn.execute(text(f"ALTER TABLE complaints ADD COLUMN {col} {col_type}"))
                except Exception:
                    pass

    async with async_session_factory() as session:
        # Check and populate complaints seed (including CSV dataset for all 22 Haryana districts)
        existing_cmp_ids = {r[0] for r in (await session.execute(select(ComplaintModel.id))).all()}
        now = datetime.now(timezone.utc)
        seed_complaints = [
                ComplaintModel(
                    id="cmp-gur-001",
                    tracking_id="TRN-2026-GUR001",
                    citizen_id="usr-citizen-rohit",
                    citizen_name="Rohit Verma",
                    citizen_phone="+91-98100-11223",
                    category="URBAN_FLOODING",
                    title="Severe Waterlogging & Inundation at Subhash Chowk Underpass",
                    description="Storm runoff water level reached 45cm at underpass entrance following heavy rain. Traffic diverted; submersible pump inlet clogged with silt.",
                    district_id="HR-GU",
                    district_name="Gurugram",
                    department_id="DEPT-PWD",
                    department_name="Public Works Department",
                    latitude=28.4350,
                    longitude=77.0390,
                    address="Subhash Chowk, Sohna Road, Sector 38, Gurugram",
                    attachments=[{"uri": "/storage/evidence/flood_subhash_chowk.jpg", "filename": "flood_subhash_chowk.jpg", "mime": "image/jpeg", "size_bytes": 1048576}],
                    status="IN_PROGRESS",
                    priority="CRITICAL",
                    source="CITIZEN_WEB",
                    assigned_unit_id="UNIT-AMB-01",
                    assigned_officer_id="usr-field-01",
                    assigned_officer_name="Inspector Sandeep Rao",
                    assigned_at=now,
                    sop_checklist=[
                        {"id": "sop-1", "title": "Deploy high-capacity mobile dewatering pump", "completed": True, "completed_at": now.isoformat(), "completed_by": "Inspector Sandeep Rao"},
                        {"id": "sop-2", "title": "Clear silt and solid waste from storm drain inlet", "completed": True, "completed_at": now.isoformat(), "completed_by": "Inspector Sandeep Rao"},
                        {"id": "sop-3", "title": "Establish flood deflection sandbag barrier", "completed": False, "completed_at": None, "completed_by": None},
                        {"id": "sop-4", "title": "Capture timestamped geotagged clearance proof", "completed": False, "completed_at": None, "completed_by": None},
                    ],
                    field_notes=[{"author": "Inspector Sandeep Rao", "text": "Pump deployed at south bay. Water level receding by ~5cm per 15 minutes.", "created_at": now.isoformat(), "unit_id": "UNIT-AMB-01"}],
                    created_at=now,
                ),
                ComplaintModel(
                    id="cmp-gur-002",
                    tracking_id="TRN-2026-GUR002",
                    citizen_id="usr-citizen-rohit",
                    citizen_name="Rohit Verma",
                    citizen_phone="+91-98100-11223",
                    category="PUBLIC_HEALTH",
                    title="Civil Hospital Sector 10 Emergency Triage Auxiliary Activation",
                    description="Emergency triage casualty overflow following industrial area incident. Secondary power line requires certified validation.",
                    district_id="HR-GU",
                    district_name="Gurugram",
                    department_id="DEPT-HEALTH",
                    department_name="Health & Family Welfare Department",
                    latitude=28.4680,
                    longitude=77.0180,
                    address="Civil Hospital, Sector 10A, Gurugram",
                    attachments=[],
                    status="AWAITING_VALIDATION",
                    priority="HIGH",
                    source="EMERGENCY_112",
                    assigned_unit_id="UNIT-HLTH-02",
                    assigned_officer_id="usr-field-01",
                    assigned_officer_name="Dr. Aarav Mehta",
                    assigned_at=now,
                    sop_checklist=[
                        {"id": "sop-1", "title": "Prepare secondary trauma overflow ward", "completed": True, "completed_at": now.isoformat(), "completed_by": "Dr. Aarav Mehta"},
                        {"id": "sop-2", "title": "Inspect auxiliary generator fuel supply", "completed": True, "completed_at": now.isoformat(), "completed_by": "Dr. Aarav Mehta"},
                        {"id": "sop-3", "title": "Calibrate critical ventilator oxygen lines", "completed": True, "completed_at": now.isoformat(), "completed_by": "Dr. Aarav Mehta"},
                    ],
                    resolution_proof={
                        "before_photo": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
                        "after_photo": "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800",
                        "field_note": "Auxiliary triage operational with 20 monitored beds. Backup power online.",
                        "location_confirmed": True,
                        "submitted_at": now.isoformat(),
                        "unit_id": "UNIT-HLTH-02",
                        "officer_name": "Dr. Aarav Mehta"
                    },
                    validation_status="PENDING",
                    created_at=now,
                ),
                ComplaintModel(
                    id="cmp-far-001",
                    tracking_id="TRN-2026-FAR001",
                    citizen_id="usr-citizen-priya",
                    citizen_name="Priya Sharma",
                    citizen_phone="+91-98111-22334",
                    category="POWER_OUTAGE",
                    title="11kV Feeder Line Cable Break at NH-19 Industrial Corridor",
                    description="Overhead electrical branch collapse ruptured feeder line causing power disruption in Industrial Area Phase II.",
                    district_id="HR-FA",
                    district_name="Faridabad",
                    department_id="DEPT-POWER",
                    department_name="Power & Renewable Energy Department",
                    latitude=28.3850,
                    longitude=77.3150,
                    address="Sector 24, NH-19 Corridor, Faridabad",
                    attachments=[],
                    status="RESOLVED",
                    priority="HIGH",
                    source="CITIZEN_WEB",
                    assigned_unit_id="UNIT-PWR-01",
                    assigned_officer_name="Lineman Rajesh Kumar",
                    resolved_at=now,
                    feedback_rating=5,
                    feedback_comments="Feeder restored rapidly within 45 minutes of report. Excellent coordination.",
                    created_at=now,
                ),
                ComplaintModel(
                    id="cmp-roh-001",
                    tracking_id="TRN-2026-ROH001",
                    citizen_id="usr-citizen-amit",
                    citizen_name="Amit Chahal",
                    citizen_phone="+91-98122-33445",
                    category="ROAD_BLOCKAGE",
                    title="Downed Banyan Tree Obstructing Rohtak-Jhajjar Highway Km 14",
                    description="Heavy trunk fell across dual lanes, causing 2km vehicular backlog near PGIMS bypass.",
                    district_id="HR-RO",
                    district_name="Rohtak",
                    department_id="DEPT-POLICE",
                    department_name="Haryana Police & Traffic Management",
                    latitude=28.8950,
                    longitude=76.6060,
                    address="Rohtak-Jhajjar Highway Km 14, Rohtak",
                    attachments=[],
                    status="SUBMITTED",
                    priority="MEDIUM",
                    source="CITIZEN_WEB",
                    created_at=now,
                ),
                ComplaintModel(
                    id="cmp-amb-001",
                    tracking_id="TRN-2026-AMB001",
                    citizen_id="usr-citizen-sunil",
                    citizen_name="Sunil Saini",
                    citizen_phone="+91-98133-44556",
                    category="URBAN_FLOODING",
                    title="Tangri River Embankment Seepage Alert near Cantonment Ring Road",
                    description="Excess river discharge causing seepage through outer levee. Previous sandbagging shifting under strong water current.",
                    district_id="HR-AM",
                    district_name="Ambala",
                    department_id="DEPT-DISASTER",
                    department_name="Disaster Management & Civil Defence",
                    latitude=30.3780,
                    longitude=76.7760,
                    address="Tangri Embankment, Cantonment Outer Ring Road, Ambala",
                    attachments=[],
                    status="REOPENED",
                    priority="CRITICAL",
                    source="CITIZEN_WEB",
                    reopen_reason="Seepage resumed after morning river discharge spike. Sandbags displaced.",
                    created_at=now,
                ),
        ]
        # Include all CSV complaints across all 22 Haryana districts
        csv_complaints = load_csv_complaints()
        candidates = seed_complaints + csv_complaints
        new_complaints_count = 0
        for c in candidates:
            if c.id not in existing_cmp_ids:
                session.add(c)
                existing_cmp_ids.add(c.id)
                session.add(
                    AuditEventModel(
                        actor_type="SYSTEM",
                        actor_id="system-bootstrap",
                        event_type="COMPLAINT_BOOTSTRAP",
                        entity_type="COMPLAINT",
                        entity_id=c.id,
                        metadata_json={"tracking_id": c.tracking_id, "status": c.status, "district": c.district_id},
                        created_at=now,
                    )
                )
                new_complaints_count += 1
        if new_complaints_count > 0:
            await session.commit()
            logger.info(f"Populated and committed {new_complaints_count} new TRINETRA Haryana governance complaints from seeds & CSV.")

        # Check governance alerts seed
        alt_res = await session.execute(select(AlertModel).limit(1))
        if not alt_res.scalars().first():
            logger.info("Populating initial TRINETRA Haryana governance alerts...")
            now = datetime.now(timezone.utc)
            seed_alerts = [
                AlertModel(
                    id="alt-sla-001",
                    rule_id="UNACKNOWLEDGED_SLA",
                    title="Critical Waterlogging at Subhash Chowk pending acknowledgment > 4h",
                    severity="HIGH",
                    status="TRIGGERED",
                    district_id="HR-GU",
                    department_id="DEPT-PWD",
                    entity_type="COMPLAINT",
                    entity_id="cmp-gur-001",
                    trigger_reason="Complaint unacknowledged for 5.2 hours, exceeding the 4.0-hour SLA threshold for CRITICAL complaints.",
                    sla_configured_hours=4.0,
                    elapsed_hours=5.2,
                    is_synthetic=False,
                    metadata_json={"tracking_id": "TRN-2026-GUR001", "rule_name": "Unacknowledged SLA Watchdog"},
                    created_at=now,
                ),
                AlertModel(
                    id="alt-ovd-002",
                    rule_id="RESOLUTION_OVERDUE",
                    title="Faridabad Sector 15 transformer outage exceeded 24h SLA",
                    severity="CRITICAL",
                    status="TRIGGERED",
                    district_id="HR-FA",
                    department_id="DEPT-POWER",
                    entity_type="COMPLAINT",
                    entity_id="cmp-far-001",
                    trigger_reason="Emergency power restoration breached 24-hour target turnaround time. Field unit pending equipment delivery.",
                    sla_configured_hours=24.0,
                    elapsed_hours=29.5,
                    is_synthetic=False,
                    metadata_json={"tracking_id": "TRN-2026-FAR001", "rule_name": "Overdue Case Escalator"},
                    created_at=now,
                ),
                AlertModel(
                    id="alt-rpn-003",
                    rule_id="REOPENED_SURGE",
                    title="Citizen Rohit reopened pothole repair dispute in Gurugram",
                    severity="MEDIUM",
                    status="ACKNOWLEDGED",
                    district_id="HR-GU",
                    department_id="DEPT-PWD",
                    entity_type="COMPLAINT",
                    entity_id="cmp-gur-002",
                    trigger_reason="Citizen rejected patch work quality and reopened complaint with reason 'Pothole patch broke again'.",
                    sla_configured_hours=12.0,
                    elapsed_hours=2.0,
                    acknowledged_by="usr-dc-gurugram",
                    acknowledged_at=now,
                    is_synthetic=False,
                    metadata_json={"tracking_id": "TRN-2026-GUR002", "citizen_id": "usr-citizen-rohit"},
                    created_at=now,
                ),
            ]
            for a in seed_alerts:
                session.add(a)

            await session.commit()
            logger.info("Successfully seeded 5 initial Haryana governance complaints.")

        # Check if already seeded worlds
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
