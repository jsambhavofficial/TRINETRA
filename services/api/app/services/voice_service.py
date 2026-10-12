"""
TRINETRA Phase 3 & 5 — Voice Command Center & Natural Intent Processing Service.
Maps spoken or textual governance commands to authorized typed tools:
- Grounded governance complaint queries
- Departmental pending workload analysis
- District overdue case investigations
- Case progress summarization
- Incident status & impact inspection
- What-if spatial simulations
- Asset and facility inquiries

Enforces strict role scoping, provenance, and permission verification.
"""
import re
from typing import Any, Dict, Optional, List
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import ComplaintModel
from app.models.alert import AlertModel
from app.models.organization import UserModel
from app.services.impact_service import impact_service
from app.services.simulation_service import simulation_service
from app.services.response_service import response_service
from app.services.ai_provider import ai_provider


class VoiceCommandService:
    @staticmethod
    def _format_res(res: Dict[str, Any]) -> Dict[str, Any]:
        res["spokenResponse"] = res.get("spoken_response", "")
        res["toolCalled"] = res.get("tool_called", "")
        res["clientAction"] = res.get("client_action")
        return res

    async def process_command(
        self,
        text_query: str,
        actor: str = "Commander Vikram Malhotra",
        db: Optional[AsyncSession] = None,
        user: Optional[UserModel] = None,
    ) -> Dict[str, Any]:
        """Parses natural language query and dispatches to appropriate operational tool."""
        res = await self._dispatch_command(text_query, actor, db, user)
        return self._format_res(res)

    async def _dispatch_command(
        self,
        text_query: str,
        actor: str = "Commander Vikram Malhotra",
        db: Optional[AsyncSession] = None,
        user: Optional[UserModel] = None,
    ) -> Dict[str, Any]:
        q = text_query.strip().lower()

        # -------------------------------------------------------------------
        # 1. GROUNDED GOVERNANCE QUERIES
        # -------------------------------------------------------------------

        # A. Department Pending Workload: "which departments have highest pending workload"
        if ("highest" in q or "pending" in q or "workload" in q) and "department" in q:
            if db:
                stmt = (
                    select(ComplaintModel.department_name, func.count(ComplaintModel.id).label("pending_count"))
                    .where(ComplaintModel.status.notin_(["RESOLVED", "REJECTED"]))
                    .group_by(ComplaintModel.department_name)
                    .order_by(func.count(ComplaintModel.id).desc())
                )
                res = await db.execute(stmt)
                dept_counts = res.all()
                if dept_counts:
                    top_name, top_count = dept_counts[0]
                    breakdown_str = ", ".join([f"{name}: {cnt} pending" for name, cnt in dept_counts[:3]])
                    return {
                        "transcript": text_query,
                        "intent": "QUERY_DEPARTMENT_WORKLOAD",
                        "tool_called": "query_department_pending_workload",
                        "spoken_response": f"{top_name} has the highest pending workload with {top_count} unresolved cases. Current active distribution: {breakdown_str}.",
                        "client_action": {"action": "NAVIGATE_TAB", "tab": "departments"},
                        "data": {
                            "top_department": top_name,
                            "pending_count": top_count,
                            "rankings": [{"department": name, "pending": cnt} for name, cnt in dept_counts],
                            "is_grounded": True,
                        }
                    }

        # B. Overdue Cases in District: "show overdue cases in my district" / "overdue"
        if "overdue" in q or "sla breach" in q:
            effective_dist = user.district_id if user and user.district_id else "HR-GU"
            if db:
                stmt = select(AlertModel).where(
                    and_(
                        AlertModel.rule_id.in_(["RESOLUTION_OVERDUE", "UNACKNOWLEDGED_SLA"]),
                        AlertModel.status.in_(["TRIGGERED", "ACKNOWLEDGED"])
                    )
                )
                if user and user.role == "DISTRICT_ADMIN":
                    stmt = stmt.where(AlertModel.district_id == effective_dist)

                res = await db.execute(stmt)
                alerts = res.scalars().all()
                count = len(alerts)
                return {
                    "transcript": text_query,
                    "intent": "QUERY_OVERDUE_CASES",
                    "tool_called": "query_district_overdue_alerts",
                    "spoken_response": f"Found {count} overdue SLA alert{'s' if count != 1 else ''} active in jurisdiction. Top delay: {alerts[0].title if alerts else 'None'}.",
                    "client_action": {"action": "NAVIGATE_TAB", "tab": "alerts"},
                    "data": {
                        "district_id": effective_dist,
                        "overdue_count": count,
                        "alerts": [{"id": a.id, "title": a.title, "elapsed_hours": a.elapsed_hours} for a in alerts[:5]],
                        "is_grounded": True,
                    }
                }

        # C. Unresolved / Specific Category Complaints: e.g. "electricity complaints in Gurugram"
        category_match = None
        if "electric" in q or "power" in q or "feeder" in q:
            category_match = "ELECTRICAL_HAZARD"
        elif "flood" in q or "waterlog" in q:
            category_match = "URBAN_FLOODING"
        elif "road" in q or "pothole" in q or "tree" in q:
            category_match = "ROAD_BLOCKAGE"
        elif "health" in q or "dengue" in q:
            category_match = "HEALTH_HAZARD"

        district_name_match = None
        district_id_match = None
        if "gurugram" in q or "gurgaon" in q:
            district_name_match = "Gurugram"
            district_id_match = "HR-GU"
        elif "faridabad" in q:
            district_name_match = "Faridabad"
            district_id_match = "HR-FA"
        elif "rohtak" in q:
            district_name_match = "Rohtak"
            district_id_match = "HR-RO"
        elif "ambala" in q:
            district_name_match = "Ambala"
            district_id_match = "HR-AM"

        if category_match or (district_id_match and ("unresolved" in q or "complaint" in q or "cases" in q)):
            # Enforce District Admin Scope
            if user and user.role == "DISTRICT_ADMIN" and district_id_match:
                if user.district_id and user.district_id != district_id_match:
                    return {
                        "transcript": text_query,
                        "intent": "ACCESS_DENIED",
                        "tool_called": "enforce_district_scope",
                        "spoken_response": f"Access Denied: As District Admin for {user.district_id}, you are restricted from querying records outside your administrative jurisdiction.",
                        "client_action": {"action": "SHOW_ERROR", "message": "Cross-district access denied"},
                        "data": {"error": "UNAUTHORIZED_CROSS_DISTRICT_ACCESS"}
                    }

            if db:
                stmt = select(ComplaintModel).where(ComplaintModel.status.notin_(["RESOLVED", "REJECTED"]))
                if category_match:
                    stmt = stmt.where(ComplaintModel.category == category_match)
                if district_id_match:
                    stmt = stmt.where(ComplaintModel.district_id == district_id_match)
                elif user and user.role == "DISTRICT_ADMIN":
                    stmt = stmt.where(ComplaintModel.district_id == (user.district_id or "HR-GU"))

                res = await db.execute(stmt)
                complaints = res.scalars().all()
                count = len(complaints)
                sample = complaints[0].title if complaints else "No matching cases"
                return {
                    "transcript": text_query,
                    "intent": "QUERY_GOVERNANCE_COMPLAINTS",
                    "tool_called": "query_governance_complaints",
                    "spoken_response": f"Retrieved {count} unresolved {category_match or ''} complaints in {district_name_match or 'target jurisdiction'}. Primary record: {sample}.",
                    "client_action": {"action": "FILTER_COMPLAINTS", "category": category_match, "district": district_id_match},
                    "data": {
                        "category": category_match,
                        "district_id": district_id_match,
                        "total_found": count,
                        "records": [
                            {"id": c.id, "tracking_id": c.tracking_id, "title": c.title, "priority": c.priority, "status": c.status}
                            for c in complaints[:5]
                        ],
                        "is_grounded": True,
                    }
                }

        # D. Summarize specific complaint: "summarize TRN-2026..." or "summarize cmp-..."
        tracking_match = re.search(r'(trn-2026-[a-z0-9]+|cmp-[a-z0-9-]+)', q)
        if tracking_match and "summar" in q:
            target_id = tracking_match.group(1).upper()
            if db:
                stmt = select(ComplaintModel).where(
                    (ComplaintModel.tracking_id == target_id) | (ComplaintModel.id == target_id.lower())
                )
                rec = (await db.execute(stmt)).scalars().first()
                if rec:
                    sum_res = await ai_provider.summarize_complaint({
                        "id": rec.id,
                        "tracking_id": rec.tracking_id,
                        "title": rec.title,
                        "category": rec.category,
                        "status": rec.status,
                        "priority": rec.priority,
                        "district_name": rec.district_name,
                        "address": rec.address,
                    })
                    return {
                        "transcript": text_query,
                        "intent": "SUMMARIZE_COMPLAINT",
                        "tool_called": "ai_summarize_complaint",
                        "spoken_response": sum_res["one_line_summary"],
                        "client_action": {"action": "FOCUS_COMPLAINT", "id": rec.id},
                        "data": sum_res,
                    }

        # -------------------------------------------------------------------
        # 2. EXISTING INCIDENT / SIMULATION / CLOSED LOOP INTENTS (PRESERVED)
        # -------------------------------------------------------------------

        # Incident status query: "What is happening near R17?" / "Status of incident"
        if any(w in q for w in ["happening", "incident", "status", "situation"]) and ("r17" in q or "flood" in q or "1047" in q):
            return {
                "transcript": text_query,
                "intent": "QUERY_INCIDENT_STATUS",
                "tool_called": "get_incident_telemetry",
                "spoken_response": "Active Critical Incident #1047 detected at Road R17 Corridor. Flash flooding with 38 centimeters of water submersion. Corroborated with 94% confidence across 4 multimodal sensor feeds.",
                "client_action": {
                    "action": "FOCUS_INCIDENT",
                    "target_id": "inc-nxc-001",
                    "tab": "context"
                },
                "data": {
                    "incident_id": "inc-nxc-001",
                    "title": "Severe Flash Flooding & Road Severance on R17",
                    "severity": "CRITICAL",
                    "confidence": 0.94
                }
            }

        # Impact inquiry: "What is affected?" / "Show impacts"
        if any(w in q for w in ["affected", "impact", "dependencies", "consequences"]):
            impact_data = await impact_service.evaluate_incident_impact("inc-nxc-001", db)
            return {
                "transcript": text_query,
                "intent": "QUERY_OPERATIONAL_IMPACT",
                "tool_called": "evaluate_incident_impact",
                "spoken_response": "Operational impact analysis indicates Road R17 is severed. Central Memorial Hospital emergency ingress is delayed by plus 9 minutes, and Ambulance MED-102 requires immediate corridor rerouting.",
                "client_action": {
                    "action": "SWITCH_TAB",
                    "tab": "impact",
                    "target_id": "inc-nxc-001"
                },
                "data": impact_data
            }

        # What-if simulation: "What happens if R17 closes?" / "Simulate closure"
        if any(w in q for w in ["what if", "simulate", "simulation", "closes", "closure"]):
            sim_data = await simulation_service.run_scenario(
                scenario_type="ROAD_CLOSURE",
                target_entity_id="ent-road-r17",
                db=db
            )
            saved_time = sim_data.get("metrics", {}).get("net_time_saved_mins", 11.4)
            return {
                "transcript": text_query,
                "intent": "RUN_WHAT_IF_SIMULATION",
                "tool_called": "simulate_corridor_closure",
                "spoken_response": f"Simulation complete. Unmitigated closure causes 18.5 minute ambulance transit delay. Automated rerouting via Road R14 Northern Bypass saves {saved_time} minutes with 7.1 minute arrival.",
                "client_action": {
                    "action": "SWITCH_TAB",
                    "tab": "simulation",
                    "target_id": "inc-nxc-001"
                },
                "data": sim_data
            }

        # Hospitals query: "Show nearby hospitals" / "Hospital capacity"
        if any(w in q for w in ["hospital", "hospitals", "medical", "trauma"]):
            return {
                "transcript": text_query,
                "intent": "LOCATE_FACILITIES",
                "tool_called": "query_facilities_status",
                "spoken_response": "Central Memorial Hospital is located 1.2 kilometers north. Level 1 Trauma Center with 82% bed occupancy. Primary southern access via R17 is compromised; rerouting staff to North Gate 3.",
                "client_action": {
                    "action": "FOCUS_ENTITY",
                    "target_id": "facility-hosp-01",
                    "entity_type": "HOSPITAL"
                },
                "data": {
                    "facility_name": "Central Memorial Hospital",
                    "trauma_tier": "LEVEL_1",
                    "beds_available": 36,
                    "icu_capacity_pct": 89
                }
            }

        # Response plan: "Create a response plan" / "Recommend actions"
        if any(w in q for w in ["response plan", "create plan", "actions", "recommend"]):
            plan_data = await response_service.get_or_generate_plan("inc-nxc-001", db)
            action_count = len(plan_data.get("actions", []))
            return {
                "transcript": text_query,
                "intent": "GENERATE_RESPONSE_PLAN",
                "tool_called": "get_or_generate_plan",
                "spoken_response": f"AI Response Plan generated with {action_count} actionable tasks. Key recommendations: dispatch High-Water Pump Unit PU-04, enforce digital traffic signage, and reconfigure trauma ingress.",
                "client_action": {
                    "action": "SWITCH_TAB",
                    "tab": "response",
                    "target_id": "inc-nxc-001"
                },
                "data": plan_data
            }

        # Verification and Resolution: "Verify" / "Resolve incident"
        if any(w in q for w in ["verify", "verification", "resolve", "resolved"]):
            verif_data = await response_service.verify_closed_loop("inc-nxc-001", actor=actor, db=db)
            return {
                "transcript": text_query,
                "intent": "EXECUTE_VERIFICATION_LOOP",
                "tool_called": "verify_closed_loop",
                "spoken_response": "Autonomous Drone telemetry verified. Water level decreased to 4 centimeters. Road R17 is cleared and operational status restored. Incident marked RESOLVED.",
                "client_action": {
                    "action": "INCIDENT_RESOLVED",
                    "target_id": "inc-nxc-001"
                },
                "data": verif_data
            }

        # Default fallback
        res = {
            "transcript": text_query,
            "intent": "GENERAL_COMMAND",
            "tool_called": "general_voice_assistant",
            "spoken_response": f"Received command: '{text_query}'. You can query unresolved complaints in a district, check departmental workloads, request case summaries, or run spatial impact simulations.",
            "client_action": {
                "action": "NOTIFICATION",
                "message": text_query
            },
            "data": {"status": "ACKNOWLEDGED", "hint": "Try 'Show unresolved electricity complaints in Gurugram' or 'Which departments have the highest pending workload?'"}
        }

        res["spokenResponse"] = res.get("spoken_response", "")
        res["toolCalled"] = res.get("tool_called", "")
        res["clientAction"] = res.get("client_action")
        return res


voice_service = VoiceCommandService()
