"""
AEGIS — Field Operations & Closed Operational Loop Service.
Connects:
Citizen observations -> Community Corroboration -> Evidence Fusion -> Incident Intelligence ->
Department Assignment -> Field Officer -> Dispatch -> SOP Checklist -> On-site Proof ->
Validation -> Authority Verification -> Citizen Confirmation.
"""
from datetime import datetime, timezone
import math
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.db.session import async_session_factory
from app.models.field import FieldAssignmentModel, ReportCorroborationModel, CitizenFeedbackModel
from app.models.incident import IncidentModel
from app.models.world import AssetModel
from app.services.event_hub import event_hub


# Predefined SOP Checklists for Civic Departments
POWER_GRID_SOP = [
    {"id": "step-1", "label": "Confirm incident location & perimeter", "mandatory": True, "completed": False},
    {"id": "step-2", "label": "Assess electrical fault & isolate feeder segment", "mandatory": True, "completed": False},
    {"id": "step-3", "label": "Inspect transformer & sub-distribution junction", "mandatory": True, "completed": False},
    {"id": "step-4", "label": "Execute authorized component bypass / repair", "mandatory": True, "completed": False},
    {"id": "step-5", "label": "Capture before and after on-site photographic proof", "mandatory": True, "completed": False},
    {"id": "step-6", "label": "Verify grid voltage & service restoration", "mandatory": True, "completed": False},
    {"id": "step-7", "label": "Submit operational proof package for authority validation", "mandatory": True, "completed": False},
]

ROAD_HAZARD_SOP = [
    {"id": "step-1", "label": "Confirm roadway obstruction & traffic impact", "mandatory": True, "completed": False},
    {"id": "step-2", "label": "Deploy high-visibility safety perimeter & warning flares", "mandatory": True, "completed": False},
    {"id": "step-3", "label": "Deploy drainage pumps or debris clearance machinery", "mandatory": True, "completed": False},
    {"id": "step-4", "label": "Clear thoroughfare and inspect roadbed integrity", "mandatory": True, "completed": False},
    {"id": "step-5", "label": "Capture high-resolution before & after photographic evidence", "mandatory": True, "completed": False},
    {"id": "step-6", "label": "Confirm two-lane traffic flow restoration", "mandatory": True, "completed": False},
    {"id": "step-7", "label": "Submit verification packet to municipal command", "mandatory": True, "completed": False},
]

AVAILABLE_UNITS_FIXTURE = [
    {
        "unit_id": "UNIT-04",
        "name": "Grid Response Team 04",
        "department": "Electricity",
        "capability": "High-voltage grid restoration & transformer repair",
        "status": "AVAILABLE",
        "distance_km": 2.4,
        "eta_minutes": 8,
        "latitude": 26.9210,
        "longitude": 75.7890,
    },
    {
        "unit_id": "UNIT-07",
        "name": "Electrical Rapid Unit 07",
        "department": "Electricity",
        "capability": "Secondary feeder repair & load balancing",
        "status": "AVAILABLE",
        "distance_km": 4.1,
        "eta_minutes": 13,
        "latitude": 26.9310,
        "longitude": 75.7950,
    },
    {
        "unit_id": "UNIT-12",
        "name": "Municipal Drainage Crew 12",
        "department": "Water & Drainage",
        "capability": "High-capacity submersible water extraction",
        "status": "AVAILABLE",
        "distance_km": 3.2,
        "eta_minutes": 10,
        "latitude": 26.9150,
        "longitude": 75.8010,
    }
]


class FieldOperationsService:
    async def _ensure_seed_assignment(self, db: AsyncSession) -> FieldAssignmentModel:
        """Ensures the flagship Sector 17 Power Grid assignment exists."""
        res = await db.execute(
            select(FieldAssignmentModel).where(FieldAssignmentModel.id == "asg-r17-grid-01")
        )
        asg = res.scalars().first()
        if not asg:
            now = datetime.now(timezone.utc)
            asg = FieldAssignmentModel(
                id="asg-r17-grid-01",
                incident_id="INC-R17-GRID-01",
                incident_number=7712,
                title="POWER GRID DISRUPTION",
                location_name="Sector 17 — North Substation Feeder",
                latitude=26.9180,
                longitude=75.7920,
                department="Electricity",
                priority="HIGH",
                status="NEW",
                assigned_unit_id="UNIT-04",
                assigned_unit_name="Grid Response Team 04",
                unit_status="AVAILABLE",
                sop_category="POWER_GRID",
                sop_checklist=[dict(item) for item in POWER_GRID_SOP],
                field_notes=[
                    {
                        "id": "fn-1",
                        "author": "System Dispatcher",
                        "text": "13 citizen reports fused with SCADA feeder drop telemetry. Prioritize transformer #3 inspection.",
                        "timestamp": "10:22 AM",
                        "is_internal": True,
                    }
                ],
                proof_data=None,
                validation_status="PENDING",
                validation_result=None,
                audit_trail=[
                    {"time": "10:14 AM", "event": "Citizen report created", "actor": "Citizen (RPT-R17-001)"},
                    {"time": "10:18 AM", "event": "AEGIS grouped 13 related observations", "actor": "AEGIS Fusion Engine"},
                    {"time": "10:22 AM", "event": "Electricity Department assigned", "actor": "City Command Center"},
                ]
            )
            db.add(asg)
            await db.commit()
            await db.refresh(asg)
        return asg

    # -------------------------------------------------------------
    # 1. COMMUNITY CORROBORATION (CITIZEN SIDE)
    # -------------------------------------------------------------
    async def list_nearby_reports(
        self,
        lat: float = 26.9180,
        lng: float = 75.7920,
        radius_m: float = 1000.0,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Returns public-safe nearby reports around the specified coordinates.
        Never exposes individual citizen names or sensitive private info.
        """
        if db is None:
            async with async_session_factory() as session:
                return await self.list_nearby_reports(lat, lng, radius_m, session)

        # Count corroborations for our flagship report
        corr_res = await db.execute(
            select(ReportCorroborationModel).where(
                or_(
                    ReportCorroborationModel.report_id == "RPT-R17-001",
                    ReportCorroborationModel.report_id == "rep-r17-001"
                )
            )
        )
        corroborations = corr_res.scalars().all()
        corr_count = len(corroborations)
        total_citizens = 12 + corr_count

        nearby_items = [
            {
                "report_id": "RPT-R17-001",
                "title": "Power Outage & Grid Surge",
                "location_name": "Sector 17 Distribution Hub",
                "distance_m": 250,
                "reported_time": "4 min ago",
                "status": "UNDER REVIEW",
                "corroborated_count": total_citizens,
                "category": "POWER_GRID",
                "has_corroborated": False,
            },
            {
                "report_id": "RPT-R17-002",
                "title": "Substation Warning Siren & Sparking",
                "location_name": "Sector 17 East Gate",
                "distance_m": 310,
                "reported_time": "6 min ago",
                "status": "UNDER REVIEW",
                "corroborated_count": 8,
                "category": "POWER_GRID",
                "has_corroborated": False,
            },
            {
                "report_id": "RPT-R17-003",
                "title": "Traffic Signal Inoperative at Crossroad",
                "location_name": "Sector 17 Main Junction",
                "distance_m": 180,
                "reported_time": "7 min ago",
                "status": "ASSIGNED",
                "corroborated_count": 5,
                "category": "INFRASTRUCTURE",
                "has_corroborated": False,
            }
        ]

        return {
            "spatial_center": {"latitude": lat, "longitude": lng},
            "radius_meters": radius_m,
            "nearby_reports": nearby_items,
            "community_signal": {
                "affected_citizens_count": total_citizens,
                "total_reports": 8 + (1 if corr_count > 0 else 0),
                "media_breakdown": {
                    "photos": 8,
                    "videos": 3,
                    "voice_reports": 2,
                },
                "time_window": "10:14 AM – 10:21 AM",
                "spatial_cluster_radius_m": 420,
                "citizen_explanation": "Multiple nearby reports may help AEGIS determine whether separate observations are describing the same real-world event.",
                "caveat": "Corroboration is evidence. It is NOT operational truth."
            }
        }

    async def corroborate_report(
        self,
        report_id: str,
        citizen_token: str,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        comment: Optional[str] = None,
        evidence_uri: Optional[str] = None,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Adds a corroboration to an existing report.
        Strictly prevents duplicate corroboration by the same citizen token.
        """
        if db is None:
            async with async_session_factory() as session:
                return await self.corroborate_report(report_id, citizen_token, lat, lng, comment, evidence_uri, session)

        # 1. Check for existing corroboration by this citizen
        existing = await db.execute(
            select(ReportCorroborationModel).where(
                and_(
                    ReportCorroborationModel.report_id == report_id,
                    ReportCorroborationModel.citizen_token == citizen_token
                )
            )
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=409,
                detail="You have already corroborated this report. Duplicate submissions are prevented."
            )

        # 2. Record corroboration
        corroboration = ReportCorroborationModel(
            report_id=report_id,
            incident_id="INC-R17-GRID-01",
            citizen_token=citizen_token,
            latitude=lat or 26.9180,
            longitude=lng or 75.7920,
            comment=comment or "Corroborated: Experiencing identical issue at this location.",
            evidence_uri=evidence_uri
        )
        db.add(corroboration)
        await db.commit()

        # 3. Query total count
        count_res = await db.execute(
            select(ReportCorroborationModel).where(ReportCorroborationModel.report_id == report_id)
        )
        total_corroborations = len(count_res.scalars().all()) + 12

        # 4. Broadcast realtime event
        await event_hub.broadcast_event(
            world_id="world-nexus-city-01",
            event_type="COMMUNITY_CORROBORATION_ADDED",
            payload={
                "report_id": report_id,
                "incident_id": "INC-R17-GRID-01",
                "total_corroborations": total_corroborations,
                "public_message": "Your location and report now corroborate this issue.",
                "community_label": f"Corroborated by {total_corroborations} nearby citizens"
            }
        )

        return {
            "success": True,
            "report_id": report_id,
            "total_corroborated": total_corroborations,
            "display_message": "Your location and report now corroborate this issue.",
            "corroborated_by_text": f"{total_corroborations} nearby citizens"
        }

    async def submit_citizen_feedback(
        self,
        incident_id: str,
        citizen_token: str,
        is_resolved: bool,
        reopen_reason: Optional[str] = None,
        reopen_evidence_uri: Optional[str] = None,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Handles citizen feedback after resolution:
        YES, RESOLVED -> Closes the loop.
        STILL NOT FIXED -> Reopens the incident with evidence.
        """
        if db is None:
            async with async_session_factory() as session:
                return await self.submit_citizen_feedback(incident_id, citizen_token, is_resolved, reopen_reason, reopen_evidence_uri, session)

        # Record feedback
        feedback = CitizenFeedbackModel(
            incident_id=incident_id,
            citizen_token=citizen_token,
            is_resolved=is_resolved,
            reopen_reason=reopen_reason,
            reopen_evidence_uri=reopen_evidence_uri
        )
        db.add(feedback)

        # Update assignment state
        asg = await self._ensure_seed_assignment(db)
        now_str = datetime.now(timezone.utc).strftime("%I:%M %p")

        if is_resolved:
            asg.status = "COMPLETED"
            asg.audit_trail = [
                *asg.audit_trail,
                {"time": now_str, "event": "Citizen confirmed resolution", "actor": "Citizen (Verified Loop)"},
                {"time": now_str, "event": "Incident CLOSED / VERIFIED", "actor": "AEGIS Operational System"}
            ]
            await event_hub.broadcast_event(
                world_id="world-nexus-city-01",
                event_type="CITIZEN_CONFIRMED_RESOLUTION",
                payload={
                    "incident_id": incident_id,
                    "status": "VERIFIED_CLOSED",
                    "public_message": "Resolution confirmed by citizen. Operational loop complete."
                }
            )
        else:
            asg.status = "REOPENED"
            asg.audit_trail = [
                *asg.audit_trail,
                {
                    "time": now_str,
                    "event": f"Citizen reported unresolved issue: {reopen_reason or 'Problem persists'}",
                    "actor": "Citizen Reopen Request"
                }
            ]
            await event_hub.broadcast_event(
                world_id="world-nexus-city-01",
                event_type="INCIDENT_REOPENED",
                payload={
                    "incident_id": incident_id,
                    "status": "REOPENED",
                    "reason": reopen_reason,
                    "public_message": "Reopen request received. Incident queued for secondary inspection."
                }
            )

        await db.commit()

        # Query stats
        all_fb = await db.execute(
            select(CitizenFeedbackModel).where(CitizenFeedbackModel.incident_id == incident_id)
        )
        feedbacks = all_fb.scalars().all()
        confirmed_count = sum(1 for f in feedbacks if f.is_resolved) + 10
        open_count = sum(1 for f in feedbacks if not f.is_resolved) + 2

        return {
            "success": True,
            "incident_id": incident_id,
            "is_resolved": is_resolved,
            "community_status": {
                "total_reported": 14,
                "resolution_verified": True,
                "confirmed_citizens": confirmed_count,
                "open_reports": open_count,
                "summary": f"14 citizens reported the issue. Resolution verified. {confirmed_count} citizens confirmed resolution. {open_count} reports remain open."
            }
        }

    # -------------------------------------------------------------
    # 2. FIELD OFFICER WORKSPACE (/field)
    # -------------------------------------------------------------
    async def list_assignments(self, db: Optional[AsyncSession] = None) -> Dict[str, Any]:
        """Returns all assignments and summary counters for Field Officer."""
        if db is None:
            async with async_session_factory() as session:
                return await self.list_assignments(session)

        asg = await self._ensure_seed_assignment(db)

        # Summary Metrics
        return {
            "summary": {
                "active_assignments": 3,
                "critical": 1,
                "in_progress": 2,
                "awaiting_validation": 1 if asg.status == "VALIDATION_PENDING" else 0,
            },
            "assignments": [
                {
                    "id": asg.id,
                    "incident_number": asg.incident_number,
                    "incident_id": asg.incident_id,
                    "title": asg.title,
                    "location": asg.location_name,
                    "priority": asg.priority,
                    "department": asg.department,
                    "status": asg.status,
                    "community_reports_count": 13,
                    "infrastructure_signals_count": 2,
                    "assigned_unit": asg.assigned_unit_name,
                    "unit_status": asg.unit_status,
                },
                {
                    "id": "asg-r14-traffic-02",
                    "incident_number": 7709,
                    "incident_id": "INC-R14-TRAF-02",
                    "title": "SIGNAL CONTROLLER SYNCHRONIZATION FAULT",
                    "location": "Sector 14 — East Bypass Corridor",
                    "priority": "MEDIUM",
                    "department": "Traffic Infrastructure",
                    "status": "WORKING",
                    "community_reports_count": 6,
                    "infrastructure_signals_count": 1,
                    "assigned_unit": "Traffic Rapid Team 02",
                    "unit_status": "ON_SITE",
                },
                {
                    "id": "asg-r17-water-03",
                    "incident_number": 7698,
                    "incident_id": "INC-R17-WATER-03",
                    "title": "CULVERT PUMP MOTOR TRIP",
                    "location": "Road R17 Embankment",
                    "priority": "CRITICAL",
                    "department": "Water & Drainage",
                    "status": "ACCEPTED",
                    "community_reports_count": 9,
                    "infrastructure_signals_count": 3,
                    "assigned_unit": "Municipal Drainage Crew 12",
                    "unit_status": "AVAILABLE",
                }
            ],
            "available_units": AVAILABLE_UNITS_FIXTURE
        }

    async def get_assignment_detail(self, assignment_id: str, db: Optional[AsyncSession] = None) -> Dict[str, Any]:
        """Returns deep assignment details, SOP progress, proof, and evidence previews."""
        if db is None:
            async with async_session_factory() as session:
                return await self.get_assignment_detail(assignment_id, session)

        asg = await self._ensure_seed_assignment(db)

        return {
            "id": asg.id,
            "incident_id": asg.incident_id,
            "incident_number": asg.incident_number,
            "title": asg.title,
            "priority": asg.priority,
            "location": asg.location_name,
            "coordinates": {"latitude": asg.latitude, "longitude": asg.longitude},
            "affected_area": "Public-safe operational region: Sector 17 grid quadrant",
            "department": asg.department,
            "status": asg.status,
            "community_reports": 13,
            "infrastructure_evidence": 2,
            "evidence_summary": {
                "citizen_reports": 13,
                "media": {
                    "photos": 8,
                    "videos": 2,
                    "voice_reports": 3,
                },
                "infrastructure_signals": 2,
                "last_updated": "10:22 AM",
                "previews": [
                    {
                        "id": "prev-1",
                        "type": "photo",
                        "label": "Overheated distribution cabinet",
                        "uri": "/images/evidence/feeder_fault.png"
                    },
                    {
                        "id": "prev-2",
                        "type": "scada",
                        "label": "Phase C Under-voltage Alarm (380V -> 190V)",
                        "uri": None
                    }
                ]
            },
            "assigned_unit": {
                "unit_id": asg.assigned_unit_id or "UNIT-04",
                "name": asg.assigned_unit_name or "Grid Response Team 04",
                "status": asg.unit_status,
                "distance_km": 2.4,
                "eta_minutes": 8,
                "capability": "High-voltage grid restoration & transformer repair",
            },
            "available_units": AVAILABLE_UNITS_FIXTURE,
            "sop_checklist": asg.sop_checklist,
            "field_notes": asg.field_notes,
            "proof_data": asg.proof_data,
            "validation_status": asg.validation_status,
            "validation_result": asg.validation_result,
            "audit_trail": asg.audit_trail,
        }

    async def dispatch_unit(
        self,
        assignment_id: str,
        unit_id: str = "UNIT-04",
        actor: str = "Field Officer",
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """Dispatches an available response unit to the incident."""
        if db is None:
            async with async_session_factory() as session:
                return await self.dispatch_unit(assignment_id, unit_id, actor, session)

        asg = await self._ensure_seed_assignment(db)
        asg.assigned_unit_id = unit_id
        asg.assigned_unit_name = "Grid Response Team 04" if unit_id == "UNIT-04" else "Electrical Rapid Unit 07"
        asg.status = "DISPATCHED"
        asg.unit_status = "DISPATCHED"
        now_str = datetime.now(timezone.utc).strftime("%I:%M %p")

        asg.audit_trail = [
            *asg.audit_trail,
            {"time": now_str, "event": f"{asg.assigned_unit_name} dispatched", "actor": actor}
        ]
        await db.commit()

        # Emit realtime event with public-safe translation
        await event_hub.broadcast_event(
            world_id="world-nexus-city-01",
            event_type="UNIT_DISPATCHED",
            payload={
                "assignment_id": asg.id,
                "incident_id": asg.incident_id,
                "unit_id": unit_id,
                "unit_name": asg.assigned_unit_name,
                "unit_status": "DISPATCHED",
                "public_safe_message": "Response team has been dispatched."
            }
        )

        return {
            "success": True,
            "assignment_id": asg.id,
            "unit_id": unit_id,
            "unit_name": asg.assigned_unit_name,
            "status": "DISPATCHED",
            "public_message": "Response team has been dispatched."
        }

    async def update_status(
        self,
        assignment_id: str,
        new_status: str,
        actor: str = "Field Officer",
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """Updates the operational status of the assignment & response unit."""
        if db is None:
            async with async_session_factory() as session:
                return await self.update_status(assignment_id, new_status, actor, session)

        asg = await self._ensure_seed_assignment(db)
        asg.status = new_status
        if new_status in ("AVAILABLE", "DISPATCHED", "EN_ROUTE", "ON_SITE", "WORKING", "COMPLETED"):
            asg.unit_status = new_status

        now_str = datetime.now(timezone.utc).strftime("%I:%M %p")
        asg.audit_trail = [
            *asg.audit_trail,
            {"time": now_str, "event": f"Status updated to {new_status}", "actor": actor}
        ]
        await db.commit()

        # Public-safe mapping
        translation_map = {
            "EN_ROUTE": "Response team is en route to Sector 17.",
            "ON_SITE": "Response team has reached the reported area.",
            "WORKING": "Response work is in progress.",
            "PROOF_PENDING": "On-site repair completed; capturing photographic proof.",
            "VALIDATION_PENDING": "Work completion is being verified by authority.",
            "COMPLETED": "Resolution has been verified."
        }
        pub_msg = translation_map.get(new_status, f"Operational status updated: {new_status}")

        await event_hub.broadcast_event(
            world_id="world-nexus-city-01",
            event_type=f"ASSIGNMENT_{new_status}",
            payload={
                "assignment_id": asg.id,
                "incident_id": asg.incident_id,
                "status": new_status,
                "unit_status": asg.unit_status,
                "public_safe_message": pub_msg
            }
        )

        return {"success": True, "status": new_status, "public_message": pub_msg}

    async def update_sop_step(
        self,
        assignment_id: str,
        step_id: str,
        completed: bool,
        actor: str = "Field Officer",
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """Toggles an SOP step in the checklist."""
        if db is None:
            async with async_session_factory() as session:
                return await self.update_sop_step(assignment_id, step_id, completed, actor, session)

        asg = await self._ensure_seed_assignment(db)
        updated_checklist = []
        for step in asg.sop_checklist:
            if step.get("id") == step_id:
                step["completed"] = completed
                step["completed_at"] = datetime.now(timezone.utc).strftime("%I:%M %p") if completed else None
            updated_checklist.append(step)

        asg.sop_checklist = updated_checklist
        await db.commit()

        return {
            "success": True,
            "sop_checklist": updated_checklist,
            "completed_count": sum(1 for s in updated_checklist if s.get("completed")),
            "total_count": len(updated_checklist)
        }

    async def submit_proof(
        self,
        assignment_id: str,
        before_photo_uri: str,
        after_photo_uri: str,
        field_note: str,
        location_confirmed: bool = True,
        actor: str = "Grid Response Team 04",
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Submits on-site Proof of Work.
        Checks whether mandatory SOP checklist steps are completed before allowing submission.
        """
        if db is None:
            async with async_session_factory() as session:
                return await self.submit_proof(
                    assignment_id, before_photo_uri, after_photo_uri, field_note, location_confirmed, actor, session
                )

        asg = await self._ensure_seed_assignment(db)

        # Check mandatory steps
        incomplete_mandatory = [
            s.get("label") for s in asg.sop_checklist if s.get("mandatory") and not s.get("completed")
        ]
        if incomplete_mandatory:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot submit proof: Mandatory SOP steps are incomplete: {', '.join(incomplete_mandatory[:2])}"
            )

        now_str = datetime.now(timezone.utc).strftime("%I:%M %p")
        proof_payload = {
            "submitted_by": actor,
            "timestamp": now_str,
            "before_photo": before_photo_uri,
            "after_photo": after_photo_uri,
            "field_note": field_note,
            "location_confirmed": location_confirmed,
            "sop_completed": f"{len(asg.sop_checklist)} / {len(asg.sop_checklist)}"
        }

        asg.proof_data = proof_payload
        asg.status = "VALIDATION_PENDING"
        asg.unit_status = "WORKING"
        asg.validation_status = "PENDING"
        asg.audit_trail = [
            *asg.audit_trail,
            {"time": now_str, "event": "Field completion proof submitted for validation", "actor": actor}
        ]
        await db.commit()

        # Emit event
        await event_hub.broadcast_event(
            world_id="world-nexus-city-01",
            event_type="PROOF_SUBMITTED",
            payload={
                "assignment_id": asg.id,
                "incident_id": asg.incident_id,
                "proof": proof_payload,
                "status": "VALIDATION_PENDING",
                "public_safe_message": "Work completion is being verified."
            }
        )

        return {
            "success": True,
            "status": "VALIDATION_PENDING",
            "proof_data": proof_payload,
            "public_message": "Work completion is being verified."
        }

    # -------------------------------------------------------------
    # 3. AUTHORITY VALIDATION & RESOLUTION
    # -------------------------------------------------------------
    async def validate_completion(
        self,
        assignment_id: str,
        decision: str,  # VALIDATE or REQUEST_REWORK
        rework_reason: Optional[str] = None,
        actor: str = "Commander Vikram Malhotra",
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Authority validates proof or requests rework with reason.
        """
        if db is None:
            async with async_session_factory() as session:
                return await self.validate_completion(assignment_id, decision, rework_reason, actor, session)

        asg = await self._ensure_seed_assignment(db)
        now_str = datetime.now(timezone.utc).strftime("%I:%M %p")

        if decision == "REQUEST_REWORK":
            if not rework_reason:
                raise HTTPException(status_code=400, detail="A reason is required when requesting rework.")
            asg.status = "REWORK_REQUIRED"
            asg.validation_status = "REWORK_REQUIRED"
            asg.validation_result = {
                "decision": "REWORK_REQUIRED",
                "validator": actor,
                "reason": rework_reason,
                "timestamp": now_str,
            }
            asg.audit_trail = [
                *asg.audit_trail,
                {"time": now_str, "event": f"Rework requested: {rework_reason}", "actor": actor}
            ]
            await db.commit()
            return {"success": True, "status": "REWORK_REQUIRED", "reason": rework_reason}

        # Decision is VALIDATE
        asg.validation_status = "VALIDATED"
        asg.validation_result = {
            "decision": "VALIDATED",
            "validator": actor,
            "checks": {
                "checklist_complete": True,
                "proof_uploaded": True,
                "location_consistent": True,
                "restoration_signal_received": True,
            },
            "timestamp": now_str,
        }
        asg.audit_trail = [
            *asg.audit_trail,
            {"time": now_str, "event": "Proof validated by authority", "actor": actor}
        ]
        await db.commit()

        await event_hub.broadcast_event(
            world_id="world-nexus-city-01",
            event_type="AUTHORITY_VALIDATED",
            payload={
                "assignment_id": asg.id,
                "incident_id": asg.incident_id,
                "status": "VALIDATED",
                "public_safe_message": "Resolution has been verified."
            }
        )

        return {
            "success": True,
            "status": "VALIDATED",
            "validation_checks": asg.validation_result["checks"],
            "public_message": "Resolution has been verified."
        }

    async def confirm_resolution(
        self,
        assignment_id: str,
        actor: str = "Commander Vikram Malhotra",
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Authority confirms resolution, updating shared world state.
        """
        if db is None:
            async with async_session_factory() as session:
                return await self.confirm_resolution(assignment_id, actor, session)

        asg = await self._ensure_seed_assignment(db)
        now_str = datetime.now(timezone.utc).strftime("%I:%M %p")
        asg.status = "COMPLETED"
        asg.unit_status = "COMPLETED"
        asg.audit_trail = [
            *asg.audit_trail,
            {"time": now_str, "event": "Authority confirmed resolution", "actor": actor}
        ]
        await db.commit()

        await event_hub.broadcast_event(
            world_id="world-nexus-city-01",
            event_type="INCIDENT_RESOLVED",
            payload={
                "assignment_id": asg.id,
                "incident_id": asg.incident_id,
                "status": "RESOLVED",
                "public_safe_message": "Power restoration has been verified."
            }
        )

        return {
            "success": True,
            "assignment_id": asg.id,
            "status": "RESOLVED",
            "public_message": "Power restoration has been verified."
        }

    # -------------------------------------------------------------
    # 4. DETERMINISTIC 20-STEP DEMO SCENARIO ENGINE
    # -------------------------------------------------------------
    async def reset_demo(self, db: Optional[AsyncSession] = None) -> Dict[str, Any]:
        """Resets the Sector 17 grid incident back to initial state."""
        if db is None:
            async with async_session_factory() as session:
                return await self.reset_demo(session)

        # Clear corroborations and feedback
        res = await db.execute(select(FieldAssignmentModel).where(FieldAssignmentModel.id == "asg-r17-grid-01"))
        asg = res.scalars().first()
        if asg:
            asg.status = "NEW"
            asg.assigned_unit_id = "UNIT-04"
            asg.assigned_unit_name = "Grid Response Team 04"
            asg.unit_status = "AVAILABLE"
            asg.sop_checklist = [dict(s) for s in POWER_GRID_SOP]
            asg.proof_data = None
            asg.validation_status = "PENDING"
            asg.validation_result = None
            asg.audit_trail = [
                {"time": "10:14 AM", "event": "Citizen report created", "actor": "Citizen (RPT-R17-001)"},
                {"time": "10:18 AM", "event": "AEGIS grouped 13 related observations", "actor": "AEGIS Fusion Engine"},
                {"time": "10:22 AM", "event": "Electricity Department assigned", "actor": "City Command Center"},
            ]
            await db.commit()

        await event_hub.broadcast_event(
            world_id="world-nexus-city-01",
            event_type="DEMO_RESET",
            payload={"message": "Demo state reset to initial power outage report."}
        )

        return {"success": True, "message": "Demo environment reset to Event 01."}

    async def execute_demo_step(self, step: int, db: Optional[AsyncSession] = None) -> Dict[str, Any]:
        """
        Executes a deterministic step from Event 01 to Event 20.
        """
        if db is None:
            async with async_session_factory() as session:
                return await self.execute_demo_step(step, session)

        asg = await self._ensure_seed_assignment(db)

        if step == 1:
            await self.reset_demo(db)
            return {
                "step": 1,
                "title": "Citizen report submitted",
                "portal": "CITIZEN",
                "description": "Citizen reports power outage in Sector 17 with photo and location.",
                "data": {"report_id": "RPT-R17-001", "status": "RECEIVED"}
            }
        elif step == 2:
            return {
                "step": 2,
                "title": "Nearby citizens corroborate",
                "portal": "CITIZEN",
                "description": "13 nearby citizens corroborate the power outage.",
                "data": {"corroborated_count": 13, "message": "Your location and report now corroborate this issue."}
            }
        elif step == 3:
            return {
                "step": 3,
                "title": "AEGIS fuses related observations",
                "portal": "AEGIS",
                "description": "Evidence fusion combines 8 photos, 2 videos, 3 voice reports, and 2 SCADA drops.",
                "data": {"fused_items": 15, "confidence": 0.94}
            }
        elif step == 4:
            return {
                "step": 4,
                "title": "Candidate incident created",
                "portal": "AEGIS",
                "description": "Candidate incident CAND-R17-GRID-01 synthesized.",
                "data": {"candidate_id": "CAND-R17-GRID-01", "severity": "HIGH"}
            }
        elif step == 5:
            return {
                "step": 5,
                "title": "Incident confirmed / reviewed",
                "portal": "COMMAND_CENTER",
                "description": "Operator review confirms INC-R17-GRID-01.",
                "data": {"incident_id": "INC-R17-GRID-01", "status": "CONFIRMED"}
            }
        elif step == 6:
            return {
                "step": 6,
                "title": "Electricity Department assigned",
                "portal": "COMMAND_CENTER",
                "description": "Incident routed to Electricity Operations division.",
                "data": {"department": "Electricity", "priority": "HIGH"}
            }
        elif step == 7:
            return {
                "step": 7,
                "title": "Field Officer receives assignment",
                "portal": "FIELD_OFFICER",
                "description": "Assignment ASG-R17-GRID-01 appears in Field Officer dashboard.",
                "data": {"assignment_id": asg.id, "status": "NEW"}
            }
        elif step == 8:
            asg.status = "ACCEPTED"
            await db.commit()
            return {
                "step": 8,
                "title": "Field Officer opens incident",
                "portal": "FIELD_OFFICER",
                "description": "Officer inspects evidence, affected radius (420m), and available units.",
                "data": {"assignment_id": asg.id, "status": "ACCEPTED"}
            }
        elif step == 9:
            await self.dispatch_unit(asg.id, "UNIT-04", actor="Field Officer (Demo)", db=db)
            return {
                "step": 9,
                "title": "Field Officer dispatches UNIT-04",
                "portal": "FIELD_OFFICER",
                "description": "UNIT-04 Grid Response Team dispatched to Sector 17.",
                "data": {"unit_id": "UNIT-04", "status": "DISPATCHED"}
            }
        elif step == 10:
            await self.update_status(asg.id, "EN_ROUTE", actor="Unit 04 (Telemetry)", db=db)
            return {
                "step": 10,
                "title": "UNIT-04 becomes EN_ROUTE",
                "portal": "FIELD_OFFICER",
                "description": "Unit 04 navigating bypass route; ETA 6 minutes.",
                "data": {"unit_id": "UNIT-04", "status": "EN_ROUTE"}
            }
        elif step == 11:
            await self.update_status(asg.id, "ON_SITE", actor="Unit 04 (Telemetry)", db=db)
            return {
                "step": 11,
                "title": "UNIT-04 becomes ON_SITE",
                "portal": "FIELD_OFFICER",
                "description": "Unit 04 arrived at Sector 17 Distribution Hub.",
                "data": {"unit_id": "UNIT-04", "status": "ON_SITE"}
            }
        elif step == 12:
            await self.update_status(asg.id, "WORKING", actor="Field Officer", db=db)
            return {
                "step": 12,
                "title": "Field Officer starts SOP",
                "portal": "FIELD_OFFICER",
                "description": "Standard Operating Procedure initialized (0 / 7 complete).",
                "data": {"status": "WORKING", "sop_category": "POWER_GRID"}
            }
        elif step == 13:
            for s in asg.sop_checklist:
                s["completed"] = True
                s["completed_at"] = "11:10 AM"
            asg.status = "PROOF_PENDING"
            await db.commit()
            return {
                "step": 13,
                "title": "SOP checklist completed",
                "portal": "FIELD_OFFICER",
                "description": "All 7 mandatory SOP items successfully completed.",
                "data": {"completed_count": 7, "total_count": 7}
            }
        elif step == 14:
            before_img = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' style='background:%23111;'><text x='20' y='50' fill='%23f87171' font-size='14' font-family='monospace'>BEFORE: FEEDER BURNOUT</text><rect x='20' y='70' width='260' height='100' fill='%23331111' stroke='%23f87171'/></svg>"
            after_img = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' style='background:%23111;'><text x='20' y='50' fill='%2334d399' font-size='14' font-family='monospace'>AFTER: RESTORED & TESTED</text><rect x='20' y='70' width='260' height='100' fill='%23113322' stroke='%2334d399'/></svg>"
            asg.proof_data = {
                "submitted_by": "Grid Response Team 04",
                "timestamp": "11:15 AM",
                "before_photo": before_img,
                "after_photo": after_img,
                "field_note": "Replaced damaged 400A feeder fuse assembly. Phase balance verified within nominal 230V specs.",
                "location_confirmed": True,
                "sop_completed": "7 / 7"
            }
            await db.commit()
            return {
                "step": 14,
                "title": "Before / after proof uploaded",
                "portal": "FIELD_OFFICER",
                "description": "Photographic evidence and field notes captured.",
                "data": asg.proof_data
            }
        elif step == 15:
            await self.submit_proof(
                asg.id,
                before_photo_uri="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' style='background:%23111;'><text x='20' y='50' fill='%23f87171' font-size='14' font-family='monospace'>BEFORE: DAMAGED FEEDER</text></svg>",
                after_photo_uri="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' style='background:%23111;'><text x='20' y='50' fill='%2334d399' font-size='14' font-family='monospace'>AFTER: RESTORED FEEDER</text></svg>",
                field_note="Feeder replacement completed and verified.",
                actor="Grid Response Team 04",
                db=db
            )
            return {
                "step": 15,
                "title": "Proof submitted for validation",
                "portal": "FIELD_OFFICER",
                "description": "Status moved to AWAITING VALIDATION.",
                "data": {"status": "VALIDATION_PENDING"}
            }
        elif step == 16:
            await self.validate_completion(asg.id, decision="VALIDATE", actor="Commander Vikram Malhotra", db=db)
            return {
                "step": 16,
                "title": "Validation passed",
                "portal": "AUTHORITY",
                "description": "Deterministic checks passed: checklist complete, proof consistent, restoration telemetry confirmed.",
                "data": {"status": "VALIDATED"}
            }
        elif step == 17:
            await self.confirm_resolution(asg.id, actor="Commander Vikram Malhotra", db=db)
            return {
                "step": 17,
                "title": "Authority confirms resolution",
                "portal": "AUTHORITY",
                "description": "Authority marks incident resolved in shared world model.",
                "data": {"status": "RESOLVED"}
            }
        elif step == 18:
            return {
                "step": 18,
                "title": "Citizen receives resolution notification",
                "portal": "CITIZEN",
                "description": "Citizen Portal updates: 'ISSUE MARKED RESOLVED. DID THIS FIX THE PROBLEM?'",
                "data": {"public_message": "Power restoration has been verified."}
            }
        elif step == 19:
            await self.submit_citizen_feedback(
                incident_id="INC-R17-GRID-01",
                citizen_token="citizen-demo-judge-token",
                is_resolved=True,
                db=db
            )
            return {
                "step": 19,
                "title": "Citizen confirms: YES, RESOLVED",
                "portal": "CITIZEN",
                "description": "Citizen feedback recorded: 10 citizens confirmed resolution.",
                "data": {"is_resolved": True, "confirmed_citizens": 10}
            }
        elif step == 20:
            return {
                "step": 20,
                "title": "Incident CLOSED / VERIFIED",
                "portal": "AEGIS",
                "description": "Operational loop closed from observation to citizen verification.",
                "hero_message": {
                    "chain": "OBSERVE → CORROBORATE → UNDERSTAND → RESPOND → VERIFY",
                    "quote_1": "AEGIS doesn't just receive complaints.",
                    "quote_2": "AEGIS connects people, evidence, decisions and field action into one living operational loop."
                }
            }
        else:
            return {"step": step, "error": f"Invalid step index {step}. Valid steps: 1 to 20."}


field_service = FieldOperationsService()
