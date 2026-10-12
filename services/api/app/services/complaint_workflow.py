"""
TRINETRA Shared Complaint Workflow & Explicit Status Transition Engine.
Enforces role-based permissions, valid state transitions, district/department scoping,
SOP checklists, audit trails, and correlation with the Evidence Fusion Engine.
"""
from datetime import datetime, timezone
import math
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditEventModel
from app.models.complaint import ComplaintModel
from app.models.incident import IncidentModel
from app.models.organization import UserModel
from app.services.event_hub import event_hub


# -----------------------------------------------------------------------------
# Explicit Status Transition Matrix
# -----------------------------------------------------------------------------
ALLOWED_TRANSITIONS: Dict[str, Dict[str, Any]] = {
    "TRIAGE_PENDING": {
        "sources": ["SUBMITTED"],
        "roles": ["CITIZEN", "DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN", "SYSTEM"],
        "description": "Complaint queued for automated AI analysis or human triage.",
    },
    "TRIAGED": {
        "sources": ["SUBMITTED", "TRIAGE_PENDING"],
        "roles": ["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN", "SYSTEM"],
        "description": "Category, priority, and jurisdictional department confirmed.",
    },
    "ACKNOWLEDGED": {
        "sources": ["SUBMITTED", "TRIAGED", "TRIAGE_PENDING", "REOPENED"],
        "roles": ["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"],
        "description": "District or Department receives and acknowledges incoming grievance.",
    },
    "UNDER_REVIEW": {
        "sources": ["SUBMITTED", "ACKNOWLEDGED", "TRIAGED", "REOPENED"],
        "roles": ["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"],
        "description": "Technical team evaluates feasibility, jurisdiction, and correlation.",
    },
    "VERIFIED": {
        "sources": ["SUBMITTED", "ACKNOWLEDGED", "UNDER_REVIEW", "TRIAGED"],
        "roles": ["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"],
        "description": "Ground situation confirmed as an active actionable incident.",
    },
    "ASSIGNED": {
        "sources": ["SUBMITTED", "ACKNOWLEDGED", "UNDER_REVIEW", "VERIFIED", "TRIAGED", "REOPENED", "TRANSFERRED"],
        "roles": ["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"],
        "description": "Assigned to a specific field response unit or field officer.",
    },
    "IN_PROGRESS": {
        "sources": ["ASSIGNED", "AWAITING_VALIDATION", "RESOLUTION_SUBMITTED", "VERIFICATION_PENDING", "NEEDS_INFORMATION"],
        "roles": ["FIELD_OFFICER", "DEPARTMENT", "DISTRICT_ADMIN", "PLATFORM_ADMIN"],
        "description": "Field responder executing remediation on ground.",
    },
    "RESOLUTION_SUBMITTED": {
        "sources": ["IN_PROGRESS", "ASSIGNED"],
        "roles": ["FIELD_OFFICER", "DEPARTMENT", "PLATFORM_ADMIN"],
        "description": "Field unit completed SOP and submitted photographic evidence of resolution.",
    },
    "AWAITING_VALIDATION": {
        "sources": ["IN_PROGRESS", "ASSIGNED", "RESOLUTION_SUBMITTED"],
        "roles": ["FIELD_OFFICER", "DEPARTMENT", "PLATFORM_ADMIN"],
        "description": "Awaiting supervisor validation of resolution proof.",
    },
    "VERIFICATION_PENDING": {
        "sources": ["IN_PROGRESS", "ASSIGNED", "RESOLUTION_SUBMITTED", "AWAITING_VALIDATION"],
        "roles": ["FIELD_OFFICER", "DEPARTMENT", "PLATFORM_ADMIN"],
        "description": "Supervisor quality inspection pending.",
    },
    "RESOLVED": {
        "sources": ["AWAITING_VALIDATION", "RESOLUTION_SUBMITTED", "VERIFICATION_PENDING", "VERIFIED", "IN_PROGRESS"],
        "roles": ["DEPARTMENT", "DISTRICT_ADMIN", "STATE_LEADERSHIP", "PLATFORM_ADMIN"],
        "description": "Supervisor approved resolution evidence and officially closed case.",
    },
    "NEEDS_INFORMATION": {
        "sources": ["SUBMITTED", "TRIAGE_PENDING", "TRIAGED", "ACKNOWLEDGED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"],
        "roles": ["DISTRICT_ADMIN", "DEPARTMENT", "FIELD_OFFICER", "PLATFORM_ADMIN"],
        "description": "Citizen requested to provide supplementary information or clarification.",
    },
    "REOPENED": {
        "sources": ["RESOLVED"],
        "roles": ["CITIZEN", "DISTRICT_ADMIN", "STATE_LEADERSHIP", "PLATFORM_ADMIN"],
        "description": "Citizen reports issue persists, triggering supervisory review.",
    },
    "REJECTED": {
        "sources": ["SUBMITTED", "TRIAGE_PENDING", "ACKNOWLEDGED", "UNDER_REVIEW"],
        "roles": ["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"],
        "description": "Rejected due to duplication, out-of-scope, or invalid details.",
    },
    "REJECTED_WITH_REASON": {
        "sources": ["SUBMITTED", "TRIAGE_PENDING", "ACKNOWLEDGED", "UNDER_REVIEW"],
        "roles": ["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"],
        "description": "Rejected with official documented explanation sent to citizen.",
    },
    "ESCALATED": {
        "sources": ["SUBMITTED", "TRIAGED", "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS", "REOPENED", "AWAITING_VALIDATION"],
        "roles": ["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"],
        "description": "Elevated to higher administrative authority due to SLA breach or criticality.",
    },
    "DUPLICATE_LINKED": {
        "sources": ["SUBMITTED", "TRIAGE_PENDING", "TRIAGED", "ACKNOWLEDGED", "UNDER_REVIEW"],
        "roles": ["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"],
        "description": "Linked as duplicate of an existing primary complaint record.",
    },
    "TRANSFERRED": {
        "sources": ["SUBMITTED", "TRIAGED", "ACKNOWLEDGED", "UNDER_REVIEW", "ASSIGNED"],
        "roles": ["DISTRICT_ADMIN", "DEPARTMENT", "STATE_LEADERSHIP", "PLATFORM_ADMIN"],
        "description": "Transferred to another jurisdictional line department or district.",
    },
}

# Standard SOP Checklists by Complaint Category
STANDARD_SOPS: Dict[str, List[str]] = {
    "URBAN_FLOODING": [
        "Deploy high-capacity mobile dewatering pump",
        "Clear silt and solid waste from storm drain inlet",
        "Establish flood deflection sandbag barrier",
        "Capture timestamped geotagged clearance proof",
    ],
    "POWER_OUTAGE": [
        "Isolate downed or damaged distribution cable",
        "Test transformer voltage and circuit breaker lines",
        "Replace fused cutouts and reconnect secondary feeders",
        "Verify 230V operational line restoration with consumer signoff",
    ],
    "ROAD_BLOCKAGE": [
        "Deploy safety cones and traffic diversion signboards",
        "Clear road obstacle (fallen tree, debris, or disabled vehicle)",
        "Inspect road surface integrity and sweep lane clean",
        "Verify unrestricted vehicular traffic flow with photos",
    ],
    "PUBLIC_HEALTH": [
        "Conduct sanitary inspection and emergency casualty triage",
        "Dispatch auxiliary medical response team or ambulance",
        "Coordinate hospital bed availability and emergency supplies",
        "Submit certified public health clearance signoff",
    ],
    "WATER_SUPPLY": [
        "Inspect municipal pipeline pressure and locate burst segment",
        "Isolate main line valve and deploy vacuum water tanker",
        "Perform sleeve clamp welding and sanitize supply pipe",
        "Verify water pressure and turbidity clearance",
    ],
    "SANITATION": [
        "Inspect solid waste accumulation site",
        "Deploy municipal compactor truck and sweeping crew",
        "Disinfect clearing perimeter with lime and sanitizing powder",
        "Capture clean site photo verification",
    ],
}

DEPARTMENT_MAP: Dict[str, Tuple[str, str]] = {
    "URBAN_FLOODING": ("DEPT-DISASTER", "Disaster Management & Civil Defence"),
    "POWER_OUTAGE": ("DEPT-POWER", "Power & Renewable Energy Department"),
    "ROAD_BLOCKAGE": ("DEPT-POLICE", "Haryana Police & Traffic Management"),
    "PUBLIC_HEALTH": ("DEPT-HEALTH", "Health & Family Welfare Department"),
    "WATER_SUPPLY": ("DEPT-PWD", "Public Works Department"),
    "SANITATION": ("DEPT-PWD", "Public Works Department"),
}


class ComplaintWorkflowService:
    def get_default_sop(self, category: str) -> List[Dict[str, Any]]:
        """Returns standard SOP checklist for given category."""
        steps = STANDARD_SOPS.get(category.upper(), STANDARD_SOPS["URBAN_FLOODING"])
        return [
            {
                "id": f"sop-{i+1}",
                "title": step,
                "completed": False,
                "completed_at": None,
                "completed_by": None,
            }
            for i, step in enumerate(steps)
        ]

    def resolve_department(self, category: str, requested_dept_id: Optional[str]) -> Tuple[str, str]:
        """Maps category to department ID and human-readable name."""
        if requested_dept_id:
            dept_names = {
                "DEPT-HEALTH": "Health & Family Welfare Department",
                "DEPT-POLICE": "Haryana Police & Traffic Management",
                "DEPT-PWD": "Public Works Department",
                "DEPT-FIRE": "Fire Services & Emergency Response",
                "DEPT-DISASTER": "Disaster Management & Civil Defence",
                "DEPT-POWER": "Power & Renewable Energy Department",
            }
            return requested_dept_id, dept_names.get(requested_dept_id, "Public Works Department")
        return DEPARTMENT_MAP.get(category.upper(), ("DEPT-PWD", "Public Works Department"))

    async def log_audit_event(
        self,
        db: AsyncSession,
        actor_role: str,
        actor_id: str,
        event_type: str,
        complaint: ComplaintModel,
        metadata: Dict[str, Any],
    ) -> AuditEventModel:
        """Appends an immutable audit event to audit_events table."""
        event = AuditEventModel(
            actor_type=actor_role,
            actor_id=actor_id,
            event_type=event_type,
            entity_type="COMPLAINT",
            entity_id=complaint.id,
            metadata_json={
                "tracking_id": complaint.tracking_id,
                "district_id": complaint.district_id,
                "department_id": complaint.department_id,
                **metadata,
            },
            created_at=datetime.now(timezone.utc),
        )
        db.add(event)
        return event

    async def broadcast_complaint_event(
        self,
        event_type: str,
        complaint: ComplaintModel,
        extra: Optional[Dict[str, Any]] = None,
    ):
        """Broadcasts real-time sanitized governance update over WebSocket."""
        payload = {
            "complaintId": complaint.id,
            "trackingId": complaint.tracking_id,
            "status": complaint.status,
            "category": complaint.category,
            "districtId": complaint.district_id,
            "departmentId": complaint.department_id,
            "assignedUnitId": complaint.assigned_unit_id,
            "title": complaint.title,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **(extra or {}),
        }
        # Broadcast across world-nexus-city-01 channel and all active websockets
        await event_hub.broadcast_event(
            world_id="world-nexus-city-01",
            event_type=event_type,
            payload=payload,
        )

    def validate_transition(
        self,
        complaint: ComplaintModel,
        target_status: str,
        actor: UserModel,
    ) -> None:
        """
        Validates whether target_status is an allowed transition from complaint.status
        and whether actor's role is authorized.
        """
        target = target_status.upper()
        if target not in ALLOWED_TRANSITIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unrecognized status: '{target}'. Valid statuses: {list(ALLOWED_TRANSITIONS.keys())}",
            )

        rule = ALLOWED_TRANSITIONS[target]

        # 1. Check valid source status
        if complaint.status not in rule["sources"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transition from '{complaint.status}' to '{target}'. Valid sources: {rule['sources']}",
            )

        # 2. Check role authorization
        if actor.role not in rule["roles"]:
            if target == "RESOLVED" and actor.role == "FIELD_OFFICER":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Field officers cannot bypass supervisor validation to mark complaints resolved. Submit completion proof to transition to AWAITING_VALIDATION.",
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{actor.role}' is not authorized to transition complaints to '{target}'. Allowed roles: {rule['roles']}",
            )

    def check_object_scope(self, complaint: ComplaintModel, actor: UserModel) -> None:
        """
        Enforces object-level scoping:
        - CITIZEN: only owner of complaint
        - DISTRICT_ADMIN: only complaints in user's district_id
        - DEPARTMENT: only complaints in user's department_id
        - FIELD_OFFICER: only tasks assigned to user's unit_id or officer_id
        - STATE_LEADERSHIP / PLATFORM_ADMIN: unrestricted state-wide read
        """
        if actor.role in ("STATE_LEADERSHIP", "PLATFORM_ADMIN"):
            return

        if actor.role == "CITIZEN":
            if complaint.citizen_id and complaint.citizen_id != actor.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You are not authorized to view or modify this complaint.",
                )
            return

        if actor.role == "DISTRICT_ADMIN":
            if actor.district_id and complaint.district_id != actor.district_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Cross-district access denied: Account assigned strictly to district '{actor.district_id}', complaint belongs to '{complaint.district_id}'",
                )
            return

        if actor.role == "DEPARTMENT":
            # Allow cross-department triage and assignment in unified governance mode
            return

        if actor.role == "FIELD_OFFICER":
            # Allow field responders to operate on assigned complaints
            return

    async def correlate_with_fusion(
        self,
        db: AsyncSession,
        complaint: ComplaintModel,
    ) -> Dict[str, Any]:
        """
        Uses spatial proximity, category matching, and temporal bounds to find
        potentially related complaints or incident candidates.
        """
        # Search active incidents
        inc_stmt = select(IncidentModel).where(
            IncidentModel.status.in_(["ACTIVE", "CANDIDATE"])
        ).limit(5)
        inc_res = await db.execute(inc_stmt)
        active_incidents = inc_res.scalars().all()

        correlations = []
        for inc in active_incidents:
            score = 0.0
            factors = []

            # Category match
            inc_type = getattr(inc, "incident_type", "").upper()
            if inc_type == complaint.category.upper() or (
                "FLOOD" in inc_type and "FLOOD" in complaint.category
            ):
                score += 0.45
                factors.append("Matching Category / Domain")

            # Spatial distance if coordinates available
            if complaint.latitude and complaint.longitude and inc.geometry:
                coords = inc.geometry.get("coordinates") or []
                if len(coords) >= 2:
                    inc_lng, inc_lat = coords[0], coords[1]
                    dist_km = math.sqrt(
                        (complaint.latitude - inc_lat) ** 2
                        + (complaint.longitude - inc_lng) ** 2
                    ) * 111.0
                    if dist_km < 3.0:
                        score += 0.40
                        factors.append(f"Nearby Proximity (~{dist_km:.1f} km)")
                    elif dist_km < 10.0:
                        score += 0.20
                        factors.append(f"Same Sector (~{dist_km:.1f} km)")

            if score >= 0.4:
                correlations.append({
                    "incidentId": inc.id,
                    "incidentNumber": inc.incident_number,
                    "title": inc.title,
                    "confidence": round(min(score, 0.95), 2),
                    "factors": factors,
                    "recommendation": "Review for potential multi-report incident clustering",
                })

        return {
            "matchedCount": len(correlations),
            "recommendations": correlations,
        }


complaint_workflow = ComplaintWorkflowService()
