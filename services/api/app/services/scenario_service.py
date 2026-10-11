"""
NEXUS Phase 5 — Deterministic Flagship R17 Scenario Engine.
Provides repeatable, step-by-step or one-click execution of the entire operational pipeline:
OBSERVE -> UNDERSTAND -> FUSE -> IMPACT -> SIMULATE -> PLAN -> AUTHORIZE -> ACT -> VERIFY -> RESOLVE.
Includes instant scenario reset capability.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.incident import IncidentModel
from app.models.world import AssetModel, SpatialEntityModel
from app.models.response import ActionExecutionModel, ResponsePlanModel
from app.db.session import async_session_factory
from app.services.event_hub import event_hub
from app.services.fusion_engine import fusion_engine
from app.services.impact_service import impact_service
from app.services.simulation_service import simulation_service
from app.services.response_service import response_service


class ScenarioService:
    async def reset_scenario(self, world_id: str = "world-nexus-city-01", db: Optional[AsyncSession] = None) -> Dict[str, Any]:
        """Resets the world and R17 incident back to initial active flood state."""
        if db is None:
            async with async_session_factory() as session:
                return await self.reset_scenario(world_id, session)

        # 1. Reset Incident #1047
        inc_res = await db.execute(select(IncidentModel).where(IncidentModel.incident_number == 1047))
        inc = inc_res.scalars().first()
        now = datetime.now(timezone.utc)

        if inc:
            inc.status = "ACTIVE"
            inc.confidence = 0.94
            inc.severity = "HIGH"
            inc.resolved_at = None
            inc.title = "Severe Flash Flooding & Road Severance on R17"
            inc.summary = "Severe road surface flooding (38cm) across Road R17 corridor between Bridge B02 and Memorial Way. Submerged road surface, vehicles stalled, and primary southern emergency route to Central Memorial Hospital is severed."
            inc.corroboration_score = 0.94
            inc.epistemic_status = "OBSERVED"

        # 2. Reset Road R17 Entity
        ent_res = await db.execute(select(SpatialEntityModel).where(or_(SpatialEntityModel.id == "ent-road-r17", SpatialEntityModel.name.like("%R17%"))))
        for ent in ent_res.scalars().all():
            ent.status = "DEGRADED"
            ent.attributes = {
                **(ent.attributes or {}),
                "water_depth_cm": 38.0,
                "traffic_flow_pct": 0,
                "structural_integrity": "COMPROMISED"
            }

        # 3. Reset Assets
        ast_res = await db.execute(select(AssetModel))
        for ast in ast_res.scalars().all():
            if "102" in ast.name:
                ast.availability = "ENGAGED"
                ast.state = {
                    **(ast.state or {}),
                    "statusText": "In transit - detour required",
                    "routeBlocked": True,
                    "assignedIncidentId": "inc-nxc-001"
                }
            elif "pu" in ast.id.lower() or "pump" in ast.name.lower():
                ast.availability = "AVAILABLE"
                ast.state = {
                    **(ast.state or {}),
                    "statusText": "On standby at Station 4",
                    "assignedIncidentId": None
                }

        # 4. Reset Action Executions
        act_res = await db.execute(select(ActionExecutionModel))
        for act in act_res.scalars().all():
            if "pump" in act.title.lower():
                act.status = "PENDING"
                act.executed_at = None
                act.verified_at = None
            elif "drone" in act.title.lower():
                act.status = "PENDING"
                act.executed_at = None
                act.verified_at = None

        await db.commit()

        # Broadcast world reset event
        await event_hub.broadcast_event(
            world_id=world_id,
            event_type="INCIDENT_UPDATED",
            payload={
                "id": inc.id if inc else "inc-nxc-001",
                "status": "ACTIVE",
                "message": "Scenario reset to Baseline: Active Flood on Road R17 (38cm water)."
            }
        )

        return {
            "scenario": "R17_FLAGSHIP_FLOODING",
            "world_id": world_id,
            "status": "RESET_COMPLETED",
            "incident_status": "ACTIVE",
            "water_level_cm": 38.0,
            "message": "Scenario successfully reset to initial active incident conditions."
        }

    async def execute_full_flagship_flow(self, world_id: str = "world-nexus-city-01", db: Optional[AsyncSession] = None) -> Dict[str, Any]:
        """
        Executes the entire 10-step flagship scenario in sequence:
        1. Fuse 4 multimodal evidence items into Incident #1047
        2. Evaluate multi-tier impact graph
        3. Run What-If simulation for Road R17 closure
        4. Synthesize AI Response Plan
        5. Authorize all actions (Commander Approval)
        6. Execute demo-safe dispatches
        7. Run closed-loop drone verification
        8. Resolve incident and restore world state!
        """
        if db is None:
            async with async_session_factory() as session:
                return await self.execute_full_flagship_flow(world_id, session)

        # Step 1: Fusion
        fusion_result = await fusion_engine.run_core_demo_fusion(world_id, db)

        # Step 2: Impact
        impact_result = await impact_service.evaluate_incident_impact("inc-nxc-001", db)

        # Step 3: Simulation
        sim_result = await simulation_service.run_scenario("ROAD_CLOSURE", "ent-road-r17", "inc-nxc-001", db=db)

        # Step 4: Plan
        plan_result = await response_service.get_or_generate_plan("inc-nxc-001", db)

        # Step 5 & 6: Authorize & Execute Actions
        actions = plan_result.get("actions", [])
        for act in actions:
            act_id = act.get("action_id")
            if act_id:
                await response_service.approve_action(act_id, actor="Commander Vikram Malhotra", notes="Approved during flagship drill", db=db)
                await response_service.execute_action(act_id, actor="Commander Vikram Malhotra", db=db)

        # Step 7 & 8: Verification & Resolution
        verif_result = await response_service.verify_closed_loop("inc-nxc-001", actor="Commander Vikram Malhotra", db=db)

        return {
            "scenario": "R17_FLAGSHIP_FULL_FLOW",
            "status": "COMPLETED",
            "stages_executed": [
                "1_MULTIMODAL_INGESTION",
                "2_AI_UNDERSTANDING",
                "3_EVIDENCE_FUSION",
                "4_INCIDENT_CONFIRMATION",
                "5_IMPACT_ANALYSIS",
                "6_WHAT_IF_SIMULATION",
                "7_RESPONSE_PLANNING",
                "8_COMMANDER_AUTHORIZATION",
                "9_DEMO_SAFE_DISPATCH",
                "10_CLOSED_LOOP_VERIFICATION_RESOLVED"
            ],
            "fusion_summary": fusion_result,
            "impact_summary": impact_result.get("impact_summary"),
            "simulation_metrics": sim_result.get("metrics"),
            "actions_executed": len(actions),
            "final_incident_status": verif_result.get("current_status", "RESOLVED"),
            "message": "Flagship end-to-end scenario executed successfully. World model is updated and verified."
        }

    async def execute_step(self, step_index: int, world_id: str = "world-nexus-city-01", db: Optional[AsyncSession] = None) -> Dict[str, Any]:
        """Executes a specific step (1 to 10) of the deterministic R17 demo scenario."""
        if db is None:
            async with async_session_factory() as session:
                return await self.execute_step(step_index, world_id, session)

        if step_index == 1:
            await self.reset_scenario(world_id, db)
            return {
                "step": 1,
                "time": "10:01",
                "title": "Citizen Report Logged",
                "incident_status": "ACTIVE",
                "description": "Citizen observation of 38cm flooding blocking Road R17 logged."
            }
        elif step_index == 2:
            return {
                "step": 2,
                "time": "10:03",
                "title": "AI Multimodal Analysis",
                "incident_status": "ACTIVE",
                "description": "Perception worker detected road flooding, stalled vehicles (91% confidence)."
            }
        elif step_index == 3:
            return {
                "step": 3,
                "time": "10:05",
                "title": "Second Observation & Sensor Corroboration",
                "incident_status": "ACTIVE",
                "description": "Municipal culvert sensor IoT data corroborates 38cm water accumulation."
            }
        elif step_index == 4:
            fusion_result = await fusion_engine.run_core_demo_fusion(world_id, db)
            return {
                "step": 4,
                "time": "10:07",
                "title": "Evidence Fusion",
                "incident_status": "ACTIVE",
                "fusion_summary": fusion_result,
                "description": "Evidence items fused into canonical incident #1047 with 94% confidence."
            }
        elif step_index == 5:
            return {
                "step": 5,
                "time": "10:09",
                "title": "Incident Confirmed Active",
                "incident_status": "ACTIVE",
                "description": "Severe road severance confirmed. Spatial alert halos active."
            }
        elif step_index == 6:
            impact_result = await impact_service.evaluate_incident_impact("inc-nxc-001", db)
            return {
                "step": 6,
                "time": "10:11",
                "title": "Authority Notified & Impact Evaluated",
                "incident_status": "ACTIVE",
                "impact_summary": impact_result.get("impact_summary"),
                "description": "Direct severance of Road R17 and +9.0 min hospital delay calculated."
            }
        elif step_index == 7:
            sim_result = await simulation_service.run_scenario("ROAD_CLOSURE", "ent-road-r17", "inc-nxc-001", db=db)
            plan_result = await response_service.get_or_generate_plan("inc-nxc-001", db)
            return {
                "step": 7,
                "time": "10:14",
                "title": "What-If Simulation & AI Response Plan",
                "incident_status": "ACTIVE",
                "simulation": sim_result.get("metrics"),
                "actions": len(plan_result.get("actions", [])),
                "description": "Route comparison identifies 7.1 min bypass corridor. 5 response actions synthesized."
            }
        elif step_index == 8:
            plan_result = await response_service.get_or_generate_plan("inc-nxc-001", db)
            for act in plan_result.get("actions", []):
                act_id = act.get("action_id")
                if act_id:
                    await response_service.approve_action(act_id, actor="Commander Vikram Malhotra", db=db)
                    await response_service.execute_action(act_id, actor="Commander Vikram Malhotra", db=db)
            return {
                "step": 8,
                "time": "10:16",
                "title": "Commander Authorization & Unit Dispatch",
                "incident_status": "ACTIVE",
                "description": "Actions authorized. High-Water Rescue Unit PU-04 dispatched to R17."
            }
        elif step_index == 9:
            return {
                "step": 9,
                "time": "10:22",
                "title": "Closed-Loop Recon Verification",
                "incident_status": "ACTIVE",
                "description": "Recon Drone Alpha scanning road surface; floodwater drainage verified."
            }
        elif step_index == 10:
            verif_result = await response_service.verify_closed_loop("inc-nxc-001", actor="Commander Vikram Malhotra", db=db)
            return {
                "step": 10,
                "time": "10:30",
                "title": "Hazard Cleared & Incident Resolved",
                "incident_status": verif_result.get("current_status", "RESOLVED"),
                "description": "Road R17 verified open to traffic. Citizen tracking confirms resolution."
            }
        else:
            return {"step": step_index, "error": f"Invalid step index {step_index}"}


scenario_service = ScenarioService()
