"""
NEXUS Phase 5 Comprehensive Automated Test Suite.
Tests:
- Impact Intelligence & Graph Generation
- What-If Simulation Engine
- AI Response Planner, Action Approval & Execution
- Closed-Loop Drone Verification & Incident Resolution
- Citizen Response Transparency Tracking & Public Alerts
- Voice Command Center with Typed Tools
- Repeatable R17 Flagship Scenario & Reset
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_impact_intelligence():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get(
            "/api/v1/incidents/inc-nxc-001/impact",
            headers={"X-User-Role": "COMMANDER"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "impact_summary" in data
        assert "direct_impacts" in data
        assert "access_impacts" in data
        assert "route_impacts" in data
        assert "graph" in data
        assert len(data["graph"]["nodes"]) >= 2
        assert len(data["graph"]["edges"]) >= 1


@pytest.mark.anyio
async def test_simulation_engine():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Presets
        presets_resp = await ac.get("/api/v1/simulation/presets")
        assert presets_resp.status_code == 200
        presets = presets_resp.json()
        assert len(presets) >= 2

        # 2. Run Road Closure Simulation
        sim_resp = await ac.post(
            "/api/v1/simulation/simulate",
            json={
                "scenario_type": "ROAD_CLOSURE",
                "target_entity_id": "ent-road-r17"
            }
        )
        assert sim_resp.status_code == 200
        sim_data = sim_resp.json()
        assert sim_data["is_simulated"] is True
        assert "metrics" in sim_data
        assert "alternative_routes" in sim_data
        assert len(sim_data["alternative_routes"]) >= 1
        assert sim_data["metrics"]["net_time_saved_mins"] > 0


@pytest.mark.anyio
async def test_response_planning_and_actions():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Generate/Get Plan
        plan_resp = await ac.get(
            "/api/v1/incidents/inc-nxc-001/response-plan",
            headers={"X-User-Role": "COMMANDER"}
        )
        assert plan_resp.status_code == 200
        plan_data = plan_resp.json()
        assert "actions" in plan_data
        assert len(plan_data["actions"]) >= 3
        action_id = plan_data["actions"][0]["action_id"]

        # 2. Approve Action
        appr_resp = await ac.post(
            f"/api/v1/actions/{action_id}/approve",
            json={"actor": "Commander Vikram Malhotra", "notes": "Approved for drill"},
            headers={"X-User-Role": "COMMANDER"}
        )
        assert appr_resp.status_code == 200
        assert appr_resp.json()["status"] == "APPROVED"

        # 3. Execute Action
        exec_resp = await ac.post(
            f"/api/v1/actions/{action_id}/execute",
            data={"actor": "Commander Vikram Malhotra"},
            headers={"X-User-Role": "COMMANDER"}
        )
        assert exec_resp.status_code == 200
        assert exec_resp.json()["status"] == "COMPLETED"


@pytest.mark.anyio
async def test_verification_and_resolution():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        verif_resp = await ac.post(
            "/api/v1/incidents/inc-nxc-001/verify",
            data={"actor": "Commander Vikram Malhotra"},
            headers={"X-User-Role": "COMMANDER"}
        )
        assert verif_resp.status_code == 200
        verif_data = verif_resp.json()
        assert verif_data["current_status"] == "RESOLVED"
        assert "verification_telemetry" in verif_data
        assert verif_data["verification_telemetry"]["water_depth_current_cm"] == 4.0
        # Reset back to active for subsequent tests
        await ac.post("/api/v1/scenarios/r17/reset")


@pytest.mark.anyio
async def test_citizen_tracking_and_alerts():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Tracking
        track_resp = await ac.get("/api/v1/reports/rep-12345/tracking")
        assert track_resp.status_code == 200
        track_data = track_resp.json()
        assert "stages" in track_data
        assert "timeline" in track_data
        assert len(track_data["timeline"]) >= 5

        # Public Alerts
        alerts_resp = await ac.get("/api/v1/citizen/alerts")
        assert alerts_resp.status_code == 200
        alerts = alerts_resp.json()
        assert len(alerts) >= 1


@pytest.mark.anyio
async def test_voice_command_center():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Query status
        v_resp = await ac.post(
            "/api/v1/voice/command",
            json={"query": "What is happening near R17?"}
        )
        assert v_resp.status_code == 200
        v_data = v_resp.json()
        assert v_data["intent"] == "QUERY_INCIDENT_STATUS"
        assert "client_action" in v_data

        # Simulate closure
        v_sim = await ac.post(
            "/api/v1/voice/command",
            json={"query": "What happens if R17 closes?"}
        )
        assert v_sim.status_code == 200
        assert v_sim.json()["intent"] == "RUN_WHAT_IF_SIMULATION"


@pytest.mark.anyio
async def test_scenario_reset_and_full_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Reset
        reset_resp = await ac.post("/api/v1/scenarios/r17/reset")
        assert reset_resp.status_code == 200
        assert reset_resp.json()["incident_status"] == "ACTIVE"

        # Full run
        flow_resp = await ac.post("/api/v1/scenarios/r17/run-full")
        assert flow_resp.status_code == 200
        flow_data = flow_resp.json()
        assert flow_data["status"] == "COMPLETED"
        assert len(flow_data["stages_executed"]) == 10
        assert flow_data["final_incident_status"] == "RESOLVED"

        # Reset world back to baseline active state for other tests
        cleanup_resp = await ac.post("/api/v1/scenarios/r17/reset")
        assert cleanup_resp.status_code == 200
        assert cleanup_resp.json()["incident_status"] == "ACTIVE"


@pytest.mark.anyio
async def test_scenario_step_execution():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1
        s1 = await ac.post("/api/v1/scenarios/r17/step/1")
        assert s1.status_code == 200
        assert s1.json()["step"] == 1
        assert s1.json()["time"] == "10:01"

        # Step 4: Fusion
        s4 = await ac.post("/api/v1/scenarios/r17/step/4")
        assert s4.status_code == 200
        assert s4.json()["step"] == 4
        assert "fusion_summary" in s4.json()

        # Step 10: Resolution
        s10 = await ac.post("/api/v1/scenarios/r17/step/10")
        assert s10.status_code == 200
        assert s10.json()["step"] == 10
        assert s10.json()["incident_status"] == "RESOLVED"

        # Cleanup reset
        cleanup = await ac.post("/api/v1/scenarios/r17/reset")
        assert cleanup.status_code == 200

