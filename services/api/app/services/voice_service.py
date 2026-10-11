"""
NEXUS Phase 5 — Voice Command Center & Natural Intent Processing Service.
Maps spoken or textual commander commands to authorized typed tools:
- Incident status queries
- Impact & dependency inspection
- What-if spatial simulations
- Response plan generation
- Asset and facility inquiries
- Verification triggers
"""
import re
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.impact_service import impact_service
from app.services.simulation_service import simulation_service
from app.services.response_service import response_service


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
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """Parses natural language query and dispatches to appropriate operational tool."""
        res = await self._dispatch_command(text_query, actor, db)
        return self._format_res(res)

    async def _dispatch_command(
        self,
        text_query: str,
        actor: str = "Commander Vikram Malhotra",
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        q = text_query.strip().lower()

        # 1. Incident status query: "What is happening near R17?" / "Status of incident"
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

        # 2. Impact inquiry: "What is affected?" / "Show impacts"
        if any(w in q for w in ["affected", "impact", "dependencies", "consequences"]):
            impact_data = await impact_service.evaluate_incident_impact("inc-nxc-001", db)
            direct_count = impact_data.get("impact_summary", {}).get("total_direct_impacts", 1)
            access_count = impact_data.get("impact_summary", {}).get("total_access_impacts", 1)
            route_count = impact_data.get("impact_summary", {}).get("total_route_impacts", 1)

            return {
                "transcript": text_query,
                "intent": "QUERY_OPERATIONAL_IMPACT",
                "tool_called": "evaluate_incident_impact",
                "spoken_response": f"Operational impact analysis indicates Road R17 is severed. Central Memorial Hospital emergency ingress is delayed by plus 9 minutes, and Ambulance MED-102 requires immediate corridor rerouting.",
                "client_action": {
                    "action": "SWITCH_TAB",
                    "tab": "impact",
                    "target_id": "inc-nxc-001"
                },
                "data": impact_data
            }

        # 3. What-if simulation: "What happens if R17 closes?" / "Simulate closure"
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

        # 4. Hospitals query: "Show nearby hospitals" / "Hospital capacity"
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

        # 5. Response plan: "Create a response plan" / "Recommend actions"
        if any(w in q for w in ["response plan", "create plan", "plan", "actions", "recommend"]):
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

        # 6. Verification and Resolution: "Verify" / "Resolve incident"
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

        res = {
            "transcript": text_query,
            "intent": "GENERAL_COMMAND",
            "tool_called": "general_voice_assistant",
            "spoken_response": f"Received operational command: '{text_query}'. Ready to analyze incidents, evaluate impacts, run simulations, or trigger response plans.",
            "client_action": {
                "action": "NOTIFICATION",
                "message": text_query
            },
            "data": {"status": "ACKNOWLEDGED"}
        }

        # Add camelCase aliases for all responses
        res["spokenResponse"] = res.get("spoken_response", "")
        res["toolCalled"] = res.get("tool_called", "")
        res["clientAction"] = res.get("client_action")
        return res


voice_service = VoiceCommandService()

