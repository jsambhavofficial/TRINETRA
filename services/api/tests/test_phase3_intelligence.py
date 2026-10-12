"""
TRINETRA Phase 3 — Governance Intelligence, Explainable AI & Production Hardening Test Suite.
Verifies:
1. State leadership & district-scoped governance intelligence aggregations & ageing
2. Traceable drill-down authorization enforcement
3. SLA alert watchdog rules, scan, acknowledgment, and resolution lifecycle
4. Configurable SLA thresholds RBAC protection
5. Provider-independent AI classification, routing, and escalation memo generation
6. Natural-language query assistant grounding and cross-district access refusal
7. Haryana state system integration adapter scaffolding and provenance status
8. File upload security against disallowed extensions
"""
import pytest
from starlette.testclient import TestClient
from app.core.security import create_access_token


@pytest.fixture
def state_leadership_headers():
    token = create_access_token({
        "sub": "usr-leadership-01",
        "email": "leadership@trinetra.gov.in",
        "role": "STATE_LEADERSHIP",
        "district_id": None,
        "department_id": None,
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def gurugram_dc_headers():
    token = create_access_token({
        "sub": "usr-district-gurugram",
        "email": "dc.gurugram@trinetra.gov.in",
        "role": "DISTRICT_ADMIN",
        "district_id": "HR-GU",
        "department_id": None,
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def citizen_headers():
    token = create_access_token({
        "sub": "usr-cit-rohit",
        "email": "citizen.rohit@trinetra.gov.in",
        "role": "CITIZEN",
        "district_id": "HR-GU",
        "department_id": None,
    })
    return {"Authorization": f"Bearer {token}"}


def test_governance_intelligence_overview_state_leadership(client: TestClient, state_leadership_headers):
    """Verifies state leadership receives statewide metrics, ageing, repeated clusters, and freshness."""
    res = client.get("/api/v1/intelligence/overview", headers=state_leadership_headers)
    assert res.status_code == 200
    data = res.json()

    assert "metrics" in data
    assert "ageing" in data
    assert "repeated_clusters" in data
    assert "anomalies" in data
    assert "data_freshness_iso" in data
    assert data["caller_scope"]["role"] == "STATE_LEADERSHIP"

    # Ageing buckets must exist
    ageing = data["ageing"]["buckets"]
    assert "under_24h" in ageing
    assert "24_to_48h" in ageing
    assert "48_to_72h" in ageing
    assert "over_72h" in ageing


def test_governance_intelligence_scoping_district_admin(client: TestClient, gurugram_dc_headers):
    """Verifies Gurugram DC receives metrics scoped strictly to HR-GU."""
    res = client.get("/api/v1/intelligence/overview", headers=gurugram_dc_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["caller_scope"]["role"] == "DISTRICT_ADMIN"
    assert data["caller_scope"]["district_id"] == "HR-GU"

    # Any district in by_district breakdown must only be HR-GU
    by_district = data["metrics"].get("by_district", {})
    for dist_id in by_district.keys():
        assert dist_id == "HR-GU"


def test_intelligence_drilldown_authorization(client: TestClient, gurugram_dc_headers, state_leadership_headers):
    """Verifies drill-down endpoint validates permissions for each requested record ID."""
    # Gurugram DC requests both Gurugram record and Faridabad record
    res = client.post(
        "/api/v1/intelligence/drilldown",
        headers=gurugram_dc_headers,
        json={"record_ids": ["cmp-gur-001", "cmp-far-001"]},
    )
    assert res.status_code == 200
    records = res.json()

    # Gurugram DC must only receive Gurugram records, Faridabad record must be excluded
    returned_ids = [r["id"] for r in records]
    assert "cmp-gur-001" in returned_ids
    assert "cmp-far-001" not in returned_ids

    # State leadership requests both and receives both
    res_state = client.post(
        "/api/v1/intelligence/drilldown",
        headers=state_leadership_headers,
        json={"record_ids": ["cmp-gur-001", "cmp-far-001"]},
    )
    assert res_state.status_code == 200
    state_records = res_state.json()
    state_ids = [r["id"] for r in state_records]
    assert "cmp-gur-001" in state_ids
    assert "cmp-far-001" in state_ids


def test_governance_alert_scan_and_lifecycle(client: TestClient, gurugram_dc_headers):
    """Verifies alert scan, acknowledgment, and resolution lifecycle."""
    # 1. Trigger scan
    scan_res = client.post("/api/v1/intelligence/alerts/scan", headers=gurugram_dc_headers)
    assert scan_res.status_code == 200
    assert scan_res.json()["status"] == "COMPLETED"

    # 2. List alerts scoped to Gurugram
    list_res = client.get("/api/v1/intelligence/alerts", headers=gurugram_dc_headers)
    assert list_res.status_code == 200
    alerts = list_res.json()
    assert len(alerts) >= 1

    target_alert = alerts[0]
    alert_id = target_alert["id"]

    # 3. Acknowledge alert
    ack_res = client.post(f"/api/v1/intelligence/alerts/{alert_id}/acknowledge", headers=gurugram_dc_headers)
    assert ack_res.status_code == 200
    assert ack_res.json()["alert_status"] == "ACKNOWLEDGED"

    # 4. Resolve alert
    resolve_res = client.post(
        f"/api/v1/intelligence/alerts/{alert_id}/resolve",
        headers=gurugram_dc_headers,
        json={"notes": "Field unit dispatched and temporary submersible pump deployed."},
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["alert_status"] == "RESOLVED"
    assert "submersible pump" in resolve_res.json()["resolution_notes"]


def test_sla_configuration_update_rbac(client: TestClient, state_leadership_headers, citizen_headers):
    """Verifies that only authorized leadership can update SLA parameters."""
    # Citizen attempts update -> 403 Forbidden
    res_denied = client.put(
        "/api/v1/intelligence/alerts/config",
        headers=citizen_headers,
        json={"thresholds": {"UNACKNOWLEDGED_CRITICAL_HOURS": 2.0}},
    )
    assert res_denied.status_code == 403

    # State leadership updates threshold -> 200 OK
    res_ok = client.put(
        "/api/v1/intelligence/alerts/config",
        headers=state_leadership_headers,
        json={"thresholds": {"UNACKNOWLEDGED_CRITICAL_HOURS": 3.0}},
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["config"]["UNACKNOWLEDGED_CRITICAL_HOURS"] == 3.0


def test_ai_provider_classification_and_routing_fallback(client: TestClient, citizen_headers):
    """Verifies deterministic AI classifier and departmental routing suggestion."""
    res = client.post(
        "/api/v1/intelligence/ai/classify",
        headers=citizen_headers,
        json={
            "title": "Severe Waterlogging and Submerged Underpass",
            "description": "Drain water level is rising rapidly after storm rain. Road is submerged with water.",
            "district_id": "HR-GU",
        },
    )
    assert res.status_code == 200
    data = res.json()

    assert data["classification"]["suggested_category"] == "URBAN_FLOODING"
    assert data["classification"]["is_simulated"] is True
    assert data["routing"]["suggested_department_id"] == "DEPT-PWD"
    assert "disclaimer" in data


def test_ai_escalation_draft_memorandum(client: TestClient, gurugram_dc_headers):
    """Verifies AI escalation memo generation grounded in actual complaint record."""
    res = client.post(
        "/api/v1/intelligence/ai/draft-escalation",
        headers=gurugram_dc_headers,
        json={
            "complaint_id": "cmp-gur-001",
            "reason": "Water levels exceeding 45cm at critical transit corridor during peak hours.",
        },
    )
    assert res.status_code == 200
    data = res.json()

    assert data["target_record_id"] == "cmp-gur-001"
    assert data["tracking_id"] == "TRN-2026-GUR001"
    assert "ADMINISTRATIVE ESCALATION MEMORANDUM" in data["draft_text"]
    assert "disclaimer" in data


def test_governance_voice_assistant_intents_and_scope(client: TestClient, gurugram_dc_headers):
    """Verifies natural language query processing, grounding, and cross-district denial."""
    # 1. Grounded query: Departmental pending workload
    res_workload = client.post(
        "/api/v1/voice/command",
        headers=gurugram_dc_headers,
        json={"query": "Which departments have the highest pending workload this month?"},
    )
    assert res_workload.status_code == 200
    w_data = res_workload.json()
    assert w_data["intent"] == "QUERY_DEPARTMENT_WORKLOAD"
    assert w_data["data"]["is_grounded"] is True

    # 2. Cross-district query attempt: Gurugram DC requests Faridabad records -> Access Denied
    res_denied = client.post(
        "/api/v1/voice/command",
        headers=gurugram_dc_headers,
        json={"query": "Show unresolved complaints in Faridabad"},
    )
    assert res_denied.status_code == 200
    d_data = res_denied.json()
    assert d_data["intent"] == "ACCESS_DENIED"
    assert "restricted from querying records outside your administrative jurisdiction" in d_data["spokenResponse"]


def test_external_integrations_status_scaffolding(client: TestClient, gurugram_dc_headers):
    """Verifies state adapter connectivity status endpoint clearly marks scaffolded stubs."""
    res = client.get("/api/v1/governance/integrations/status", headers=gurugram_dc_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["active_adapters"] >= 3
    system_ids = [a["system_id"] for a in data["adapters"]]
    assert "HARYANA_SARAL" in system_ids
    assert "HARYANA_CM_WINDOW" in system_ids
    assert "HARYANA_DIAL_112" in system_ids

    # Each adapter must be clearly marked as mock/scaffolded
    for a in data["adapters"]:
        assert a["is_mock"] is True
        assert a["status"] == "CONFIGURED_STANDBY"


def test_file_upload_security_disallowed_extension(client: TestClient, citizen_headers):
    """Verifies uploading dangerous executable or script files is rejected."""
    files = {"file": ("malicious_script.sh", b"#!/bin/bash\necho bad", "text/x-shellscript")}
    res = client.post("/api/v1/evidence/upload", headers=citizen_headers, files=files)
    assert res.status_code == 400
    assert "prohibited for security reasons" in res.json()["error"]["message"]
