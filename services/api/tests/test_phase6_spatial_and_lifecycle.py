"""
Comprehensive Verification for Phase 4 Extended Lifecycle and Phase 6 Haryana GIS Spatial Engine.
"""
import pytest
from starlette.testclient import TestClient
from app.core.security import create_access_token


@pytest.fixture
def auth_headers():
    return {
        "citizen": {
            "Authorization": f"Bearer {create_access_token({'sub': 'usr-cit-101', 'role': 'CITIZEN', 'email': 'citizen.amit@trinetra.gov.in'})}"
        },
        "district_gurugram": {
            "Authorization": f"Bearer {create_access_token({'sub': 'usr-district-gurugram', 'role': 'DISTRICT_ADMIN', 'district_id': 'HR-GU', 'email': 'dc.gurugram@trinetra.gov.in'})}"
        },
        "dept_pwd": {
            "Authorization": f"Bearer {create_access_token({'sub': 'usr-dept-pwd', 'role': 'DEPARTMENT', 'department_id': 'DEPT-PWD', 'email': 'ee.pwd@trinetra.gov.in'})}"
        },
        "field_unit": {
            "Authorization": f"Bearer {create_access_token({'sub': 'usr-field-01', 'role': 'FIELD_OFFICER', 'unit_id': 'UNIT-GUR-01', 'email': 'field01@trinetra.gov.in'})}"
        },
        "state_leadership": {
            "Authorization": f"Bearer {create_access_token({'sub': 'usr-state-lead', 'role': 'STATE_LEADERSHIP', 'email': 'cmo@trinetra.gov.in'})}"
        },
    }


def test_spatial_district_aggregates(client: TestClient, auth_headers):
    """Verifies spatial districts endpoint returns metrics for all 22 Haryana districts."""
    res = client.get("/api/v1/complaints/spatial/districts", headers=auth_headers["state_leadership"])
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 22
    gurugram = next((d for d in data if d["district_code"] == "HR-GU"), None)
    assert gurugram is not None
    assert gurugram["district_name"] == "Gurugram"
    assert gurugram["latitude"] == pytest.approx(28.4595, rel=1e-2)


def test_spatial_viewport_clustering_vs_pins(client: TestClient, auth_headers):
    """Verifies zoom < 10 returns clusters, while zoom >= 10 returns individual pins."""
    # 1. Zoom out: clusters
    res_cluster = client.get(
        "/api/v1/complaints/spatial/viewport",
        params={"min_lat": 27.6, "max_lat": 31.0, "min_lng": 74.4, "max_lng": 77.7, "zoom": 8},
        headers=auth_headers["district_gurugram"],
    )
    assert res_cluster.status_code == 200
    cluster_data = res_cluster.json()
    assert cluster_data["mode"] == "clusters"
    assert "clusters" in cluster_data
    assert isinstance(cluster_data["clusters"], list)

    # 2. Zoom in: pins
    res_pins = client.get(
        "/api/v1/complaints/spatial/viewport",
        params={"min_lat": 28.3, "max_lat": 28.6, "min_lng": 76.9, "max_lng": 77.2, "zoom": 12},
        headers=auth_headers["district_gurugram"],
    )
    assert res_pins.status_code == 200
    pin_data = res_pins.json()
    assert pin_data["mode"] == "pins"
    assert "pins" in pin_data
    assert isinstance(pin_data["pins"], list)


def test_extended_lifecycle_actions(client: TestClient, auth_headers):
    """Verifies request-info, provide-info, escalation, transfer, link-duplicate, and triage override."""
    # 1. Citizen creates a complaint
    create_res = client.post(
        "/api/v1/complaints",
        json={
            "category": "URBAN_FLOODING",
            "title": "Submerged underpass near NH-48 junction",
            "description": "Rainwater accumulation more than 3 feet. Traffic completely halted near IFFCO Chowk underpass.",
            "district_id": "HR-GU",
            "locality": "Sector 29, Gurugram",
            "latitude": 28.4721,
            "longitude": 77.0725,
        },
        headers=auth_headers["citizen"],
    )
    assert create_res.status_code == 201
    comp = create_res.json()
    comp_id = comp["id"]
    assert comp["status"] == "SUBMITTED"
    assert comp["ai_triage"] is not None
    assert comp["sub_category"] is not None
    # Internal notes must be redacted for citizen
    assert comp["internal_notes"] == []

    # 2. District Admin requests information
    req_info_res = client.post(
        f"/api/v1/complaints/{comp_id}/request-information",
        json={"question": "Please provide an exact landmark or whether service lane is also inundated."},
        headers=auth_headers["district_gurugram"],
    )
    assert req_info_res.status_code == 200
    assert req_info_res.json()["status"] == "NEEDS_INFORMATION"
    assert len(req_info_res.json()["internal_notes"]) > 0

    # 3. Citizen provides requested information
    prov_info_res = client.post(
        f"/api/v1/complaints/{comp_id}/provide-information",
        json={"response_text": "Both main carriageway and service road towards Jaipur side are blocked."},
        headers=auth_headers["citizen"],
    )
    assert prov_info_res.status_code == 200
    assert prov_info_res.json()["status"] in ("TRIAGED", "IN_PROGRESS")
    assert prov_info_res.json()["internal_notes"] == []

    # 4. District Admin escalates complaint
    esc_res = client.post(
        f"/api/v1/complaints/{comp_id}/escalate",
        json={"reason": "National Highway arterial corridor choked during peak rush hour.", "target_level": "DISTRICT_HQ"},
        headers=auth_headers["district_gurugram"],
    )
    assert esc_res.status_code == 200
    assert esc_res.json()["status"] == "ESCALATED"
    assert esc_res.json()["is_escalated"] is True

    # 5. Admin overrides AI triage
    override_res = client.post(
        f"/api/v1/complaints/{comp_id}/override-triage",
        json={
            "category": "URBAN_FLOODING",
            "priority": "CRITICAL",
            "reason": "Elevated to CRITICAL due to highway paralysis.",
        },
        headers=auth_headers["district_gurugram"],
    )
    assert override_res.status_code == 200
    assert override_res.json()["priority"] == "CRITICAL"
    assert override_res.json()["human_override"] is not None

    # 6. Transfer jurisdiction
    transfer_res = client.post(
        f"/api/v1/complaints/{comp_id}/transfer",
        json={"target_district_id": "HR-FA", "rationale": "Jurisdictional boundary adjustment to Faridabad border."},
        headers=auth_headers["district_gurugram"],
    )
    assert transfer_res.status_code == 200
    assert transfer_res.json()["status"] == "TRANSFERRED"
    assert transfer_res.json()["district_id"] == "HR-FA"
