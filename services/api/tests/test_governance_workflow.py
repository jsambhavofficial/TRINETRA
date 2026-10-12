"""
Integration tests for TRINETRA Phase 2 — Complete Role-Based Governance Workflows.
Verifies the end-to-end complaint-to-resolution lifecycle, state transitions,
RBAC scoping, evidence fusion correlation, audit trails, and citizen tracking.
"""
import pytest
from starlette.testclient import TestClient
from app.core.security import create_access_token


@pytest.fixture
def auth_tokens():
    """Generates valid JWT tokens for bootstrapped test role accounts."""
    return {
        "citizen": create_access_token({"sub": "usr-cit-rohit", "role": "CITIZEN", "email": "citizen.rohit@trinetra.gov.in"}),
        "district_gurugram": create_access_token({"sub": "usr-district-gurugram", "role": "DISTRICT_ADMIN", "district_id": "HR-GU", "email": "dc.gurugram@trinetra.gov.in"}),
        "district_faridabad": create_access_token({"sub": "usr-district-faridabad", "role": "DISTRICT_ADMIN", "district_id": "HR-FA", "email": "dc.faridabad@trinetra.gov.in"}),
        "department_pwd": create_access_token({"sub": "usr-dept-pwd", "role": "DEPARTMENT", "department_id": "DEPT-PWD", "email": "pwd.lead@trinetra.gov.in"}),
        "department_health": create_access_token({"sub": "usr-dept-health", "role": "DEPARTMENT", "department_id": "DEPT-HEALTH", "email": "health.lead@trinetra.gov.in"}),
        "field_officer": create_access_token({"sub": "usr-field-amb01", "role": "FIELD_OFFICER", "unit_id": "UNIT-AMB-01", "email": "field.amb01@trinetra.gov.in"}),
        "field_officer_other": create_access_token({"sub": "usr-field-other", "role": "FIELD_OFFICER", "unit_id": "UNIT-OTHER-99", "email": "field.other@trinetra.gov.in"}),
        "state_leadership": create_access_token({"sub": "usr-leadership-01", "role": "STATE_LEADERSHIP", "email": "leadership@trinetra.gov.in"}),
    }


def get_err(res):
    """Extracts error message from standardized JSON error response."""
    data = res.json()
    if "error" in data and isinstance(data["error"], dict):
        return data["error"].get("message", "")
    return data.get("detail", "")


def test_end_to_end_complaint_lifecycle(client: TestClient, auth_tokens):
    """
    Tests complete lifecycle:
    Citizen submits -> District acknowledges -> Department assigns officer ->
    Officer progresses and submits proof -> Supervisor validates & marks RESOLVED ->
    Citizen tracks & submits feedback -> Citizen reopens with reason.
    """
    # 1. Citizen submits complaint
    create_payload = {
        "category": "URBAN_FLOODING",
        "title": "Severe road waterlogging at Cyber City Phase 2",
        "description": "40cm water depth accumulated following storm, blocking underpass.",
        "district_id": "HR-GU",
        "department_id": "DEPT-PWD",
        "latitude": 28.4900,
        "longitude": 77.0900,
        "address": "Cyber City Underpass, Gurugram",
        "attachments": [{"uri": "/evidence/test_flood.jpg", "filename": "test_flood.jpg"}],
    }
    res = client.post(
        "/api/v1/complaints",
        json=create_payload,
        headers={"Authorization": f"Bearer {auth_tokens['citizen']}"},
    )
    assert res.status_code == 201
    comp_data = res.json()
    complaint_id = comp_data["id"]
    tracking_id = comp_data["tracking_id"]
    assert tracking_id.startswith("TRN-2026-")
    assert comp_data["status"] == "SUBMITTED"
    assert comp_data["district_id"] == "HR-GU"
    assert comp_data["department_id"] == "DEPT-PWD"
    assert len(comp_data["sop_checklist"]) >= 4

    # 2. Public tracking check
    track_res = client.get(f"/api/v1/complaints/track/{tracking_id}")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["tracking_id"] == tracking_id
    assert track_data["is_resolved"] is False
    assert len(track_data["milestones"]) >= 5
    # Ensure sensitive officer details are not in public response
    assert "officer_phone" not in track_data
    assert "resolution_proof" not in track_data

    # 3. District Admin of Gurugram views complaint in queue
    list_res = client.get(
        "/api/v1/complaints",
        headers={"Authorization": f"Bearer {auth_tokens['district_gurugram']}"},
    )
    assert list_res.status_code == 200
    cases = list_res.json()
    assert any(c["id"] == complaint_id for c in cases)

    # 4. District Admin of Faridabad CANNOT access Gurugram complaint
    cross_res = client.get(
        f"/api/v1/complaints/{complaint_id}",
        headers={"Authorization": f"Bearer {auth_tokens['district_faridabad']}"},
    )
    assert cross_res.status_code == 403
    assert "Cross-district access denied" in get_err(cross_res)

    # 5. Department assigns Field Officer UNIT-AMB-01
    assign_payload = {
        "assigned_unit_id": "UNIT-AMB-01",
        "assigned_officer_id": "usr-field-amb01",
        "assigned_officer_name": "Officer Vikram Singh",
        "priority": "HIGH",
        "notes": "Deploy portable dewatering pump immediately",
    }
    assign_res = client.post(
        f"/api/v1/complaints/{complaint_id}/assign",
        json=assign_payload,
        headers={"Authorization": f"Bearer {auth_tokens['department_pwd']}"},
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "ASSIGNED"
    assert assign_res.json()["assigned_unit_id"] == "UNIT-AMB-01"

    # 6. Unrelated department (Health) CANNOT reassign PWD complaint
    cross_dept_res = client.post(
        f"/api/v1/complaints/{complaint_id}/assign",
        json=assign_payload,
        headers={"Authorization": f"Bearer {auth_tokens['department_health']}"},
    )
    assert cross_dept_res.status_code == 403
    assert "Cross-department access denied" in get_err(cross_dept_res)

    # 7. Unrelated Field Officer UNIT-OTHER-99 CANNOT update progress
    unauthorized_officer_res = client.post(
        f"/api/v1/complaints/{complaint_id}/field-progress",
        json={"status": "IN_PROGRESS", "note": "Hacking another unit"},
        headers={"Authorization": f"Bearer {auth_tokens['field_officer_other']}"},
    )
    assert unauthorized_officer_res.status_code == 403

    # 8. Authorized Field Officer UNIT-AMB-01 updates progress and checks SOP step
    progress_res = client.post(
        f"/api/v1/complaints/{complaint_id}/field-progress",
        json={
            "status": "IN_PROGRESS",
            "sop_step_id": "sop-1",
            "sop_completed": True,
            "note": "Pump deployed at north entrance. Water receding rapidly.",
        },
        headers={"Authorization": f"Bearer {auth_tokens['field_officer']}"},
    )
    assert progress_res.status_code == 200
    updated_sop = progress_res.json()["sop_checklist"]
    step1 = next(s for s in updated_sop if s["id"] == "sop-1")
    assert step1["completed"] is True

    # 9. Field Officer attempts to directly mark RESOLVED (MUST FAIL)
    illegal_resolve_res = client.post(
        f"/api/v1/complaints/{complaint_id}/transition",
        json={"target_status": "RESOLVED"},
        headers={"Authorization": f"Bearer {auth_tokens['field_officer']}"},
    )
    assert illegal_resolve_res.status_code == 403
    assert "Field officers cannot bypass supervisor validation" in get_err(illegal_resolve_res)

    # 10. Field Officer submits completion proof
    proof_payload = {
        "before_photo": "https://storage.trinetra.gov.in/before_flood.jpg",
        "after_photo": "https://storage.trinetra.gov.in/after_clear.jpg",
        "field_note": "Dewatering complete; inlet grates cleared of silt. Road fully open to traffic.",
        "location_confirmed": True,
    }
    proof_res = client.post(
        f"/api/v1/complaints/{complaint_id}/submit-proof",
        json=proof_payload,
        headers={"Authorization": f"Bearer {auth_tokens['field_officer']}"},
    )
    assert proof_res.status_code == 200
    assert proof_res.json()["status"] == "AWAITING_VALIDATION"
    assert proof_res.json()["validation_status"] == "PENDING"

    # 11. Supervisor (PWD Department) rejects proof first to test rework loop
    reject_proof_res = client.post(
        f"/api/v1/complaints/{complaint_id}/validate-resolution",
        json={
            "decision": "REJECT_REWORK",
            "rejection_reason": "After-photo is blurry; please submit clear geotagged photo of cleared inlet drain.",
        },
        headers={"Authorization": f"Bearer {auth_tokens['department_pwd']}"},
    )
    assert reject_proof_res.status_code == 200
    assert reject_proof_res.json()["status"] == "IN_PROGRESS"
    assert reject_proof_res.json()["validation_status"] == "REWORK_REQUESTED"
    assert "blurry" in reject_proof_res.json()["rejection_reason"]

    # 12. Field Officer resubmits clear proof
    proof_res_2 = client.post(
        f"/api/v1/complaints/{complaint_id}/submit-proof",
        json={
            "before_photo": "https://storage.trinetra.gov.in/before_flood.jpg",
            "after_photo": "https://storage.trinetra.gov.in/after_clear_hd.jpg",
            "field_note": "High-res geotagged photo of cleared storm drain inlet attached.",
            "location_confirmed": True,
        },
        headers={"Authorization": f"Bearer {auth_tokens['field_officer']}"},
    )
    assert proof_res_2.status_code == 200
    assert proof_res_2.json()["status"] == "AWAITING_VALIDATION"

    # 13. Supervisor approves resolution
    approve_res = client.post(
        f"/api/v1/complaints/{complaint_id}/validate-resolution",
        json={"decision": "APPROVE"},
        headers={"Authorization": f"Bearer {auth_tokens['department_pwd']}"},
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "RESOLVED"
    assert approve_res.json()["resolved_at"] is not None

    # 14. Citizen submits feedback on resolved complaint
    feedback_res = client.post(
        f"/api/v1/complaints/{complaint_id}/feedback",
        json={"rating": 5, "comments": "Resolved very quickly! Great response by Haryana PWD."},
        headers={"Authorization": f"Bearer {auth_tokens['citizen']}"},
    )
    assert feedback_res.status_code == 200
    assert feedback_res.json()["feedback_rating"] == 5

    # 15. Citizen reopens grievance (e.g. water accumulation restarted)
    reopen_res = client.post(
        f"/api/v1/complaints/{complaint_id}/reopen",
        json={"reopen_reason": "Fresh thunderstorm caused water to pool again; inlet blocked again."},
        headers={"Authorization": f"Bearer {auth_tokens['citizen']}"},
    )
    assert reopen_res.status_code == 200
    assert reopen_res.json()["status"] == "REOPENED"
    assert "Fresh thunderstorm" in reopen_res.json()["reopen_reason"]

    # 16. Verify audit timeline includes full chronology
    detail_res = client.get(
        f"/api/v1/complaints/{complaint_id}",
        headers={"Authorization": f"Bearer {auth_tokens['district_gurugram']}"},
    )
    assert detail_res.status_code == 200
    timeline = detail_res.json()["timeline"]
    event_types = [t["eventType"] for t in timeline]
    assert "COMPLAINT_SUBMITTED" in event_types
    assert "OFFICER_ASSIGNED" in event_types
    assert "PROOF_SUBMITTED" in event_types
    assert "REWORK_REQUESTED" in event_types
    assert "RESOLUTION_APPROVED" in event_types
    assert "CITIZEN_FEEDBACK_RECEIVED" in event_types
    assert "COMPLAINT_REOPENED" in event_types


def test_state_leadership_governance_summary(client: TestClient, auth_tokens):
    """Verifies that State Leadership dashboard computes real aggregate metrics."""
    res = client.get(
        "/api/v1/governance/state-summary",
        headers={"Authorization": f"Bearer {auth_tokens['state_leadership']}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert data["summary"]["totalComplaints"] >= 1
    assert "districtPerformance" in data
    assert len(data["districtPerformance"]) == 22
    assert "departmentWorkload" in data
    assert len(data["recentActivity"]) >= 1


def test_invalid_status_transitions_denied(client: TestClient, auth_tokens):
    """Verifies that impossible or illegal status jumps are rejected with 400 Bad Request."""
    # Create fresh complaint in SUBMITTED state
    res = client.post(
        "/api/v1/complaints",
        json={
            "category": "POWER_OUTAGE",
            "title": "Transformer spark at Sector 14",
            "description": "Short circuit on pole",
            "district_id": "HR-GU",
        },
        headers={"Authorization": f"Bearer {auth_tokens['citizen']}"},
    )
    complaint_id = res.json()["id"]

    # Attempt illegal transition SUBMITTED -> RESOLVED directly by Admin
    bad_res = client.post(
        f"/api/v1/complaints/{complaint_id}/transition",
        json={"target_status": "RESOLVED"},
        headers={"Authorization": f"Bearer {auth_tokens['district_gurugram']}"},
    )
    assert bad_res.status_code == 400
    assert "Invalid transition" in get_err(bad_res)


def test_governance_events_rest_fallback(client: TestClient, auth_tokens):
    """Verifies that REST fallback for real-time notifications delivers recent audit events."""
    res = client.get(
        "/api/v1/governance/events?limit=10",
        headers={"Authorization": f"Bearer {auth_tokens['citizen']}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "events" in data
    assert isinstance(data["events"], list)
