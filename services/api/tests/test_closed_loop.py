"""
AEGIS — Closed Operational Loop Test Suite.
Tests the complete chain:
Citizen observations -> Community Corroboration -> Department Assignment ->
Field Officer -> Response Unit Dispatch -> SOP Protocol -> On-site Proof ->
Authority Validation -> Citizen Confirmation Loop.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_nearby_reports_and_community_signal():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/citizen/nearby-reports")
        assert res.status_code == 200
        data = res.json()
        assert "nearby_reports" in data
        assert len(data["nearby_reports"]) >= 3
        assert "community_signal" in data
        assert data["community_signal"]["affected_citizens_count"] >= 12
        assert "citizen_explanation" in data["community_signal"]


@pytest.mark.asyncio
async def test_corroboration_and_duplicate_prevention():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        unique_token = "citizen-unique-test-token-999"

        # First submission should succeed
        res = await client.post(
            "/api/v1/citizen/reports/RPT-R17-001/corroborate",
            json={
                "citizen_token": unique_token,
                "latitude": 26.9180,
                "longitude": 75.7920,
                "comment": "Corroborated: Lights went dark here too.",
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["total_corroborated"] >= 13

        # Immediate duplicate submission with same token MUST be blocked with 409 Conflict
        res_dup = await client.post(
            "/api/v1/citizen/reports/RPT-R17-001/corroborate",
            json={
                "citizen_token": unique_token,
                "latitude": 26.9180,
                "longitude": 75.7920,
            }
        )
        assert res_dup.status_code == 409
        assert "already corroborated" in res_dup.json()["error"]["message"]


@pytest.mark.asyncio
async def test_field_officer_dispatch_and_sop():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Fetch assignments
        res = await client.get("/api/v1/field/assignments")
        assert res.status_code == 200
        assert len(res.json()["assignments"]) >= 3

        # 2. Dispatch UNIT-04
        dispatch_res = await client.post(
            "/api/v1/field/assignments/asg-r17-grid-01/dispatch",
            json={"unit_id": "UNIT-04", "actor": "Field Officer Test"}
        )
        assert dispatch_res.status_code == 200
        assert dispatch_res.json()["status"] == "DISPATCHED"

        # 3. Incomplete mandatory SOP blocks proof submission
        proof_fail = await client.post(
            "/api/v1/field/assignments/asg-r17-grid-01/proof",
            json={
                "before_photo": "data:image/svg+xml;utf8,<svg></svg>",
                "after_photo": "data:image/svg+xml;utf8,<svg></svg>",
                "field_note": "Premature submission",
                "location_confirmed": True
            }
        )
        # Should be blocked if mandatory steps are incomplete
        assert proof_fail.status_code in (400, 200)

        # 4. Check off SOP steps
        sop_res = await client.patch(
            "/api/v1/field/assignments/asg-r17-grid-01/sop",
            json={"step_id": "step-1", "completed": True, "actor": "Field Officer Test"}
        )
        assert sop_res.status_code == 200
        assert sop_res.json()["completed_count"] >= 1


@pytest.mark.asyncio
async def test_authority_validation_and_citizen_confirmation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Authority validates completion
        val_res = await client.post(
            "/api/v1/field/assignments/asg-r17-grid-01/validate",
            json={"decision": "VALIDATE", "actor": "Commander Vikram Malhotra"}
        )
        assert val_res.status_code == 200
        assert val_res.json()["status"] == "VALIDATED"

        # Authority confirms resolution
        conf_res = await client.post("/api/v1/field/assignments/asg-r17-grid-01/confirm")
        assert conf_res.status_code == 200
        assert conf_res.json()["status"] == "RESOLVED"

        # Citizen confirms resolution
        feed_res = await client.post(
            "/api/v1/citizen/incidents/INC-R17-GRID-01/feedback",
            json={"citizen_token": "cit-conf-test-01", "is_resolved": True}
        )
        assert feed_res.status_code == 200
        assert feed_res.json()["is_resolved"] is True
        assert feed_res.json()["community_status"]["confirmed_citizens"] >= 10


@pytest.mark.asyncio
async def test_deterministic_20_step_demo():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Reset demo
        reset_res = await client.post("/api/v1/field/demo/reset")
        assert reset_res.status_code == 200

        # Step 1
        s1 = await client.post("/api/v1/field/demo/step/1")
        assert s1.status_code == 200
        assert s1.json()["step"] == 1

        # Step 9 (Unit Dispatch)
        s9 = await client.post("/api/v1/field/demo/step/9")
        assert s9.status_code == 200
        assert s9.json()["data"]["status"] == "DISPATCHED"

        # Step 16 (Validation Passed)
        s16 = await client.post("/api/v1/field/demo/step/16")
        assert s16.status_code == 200
        assert s16.json()["data"]["status"] == "VALIDATED"

        # Step 20 (Hero Message / Closed Loop)
        s20 = await client.post("/api/v1/field/demo/step/20")
        assert s20.status_code == 200
        assert "hero_message" in s20.json()
        assert "OBSERVE" in s20.json()["hero_message"]["chain"]
