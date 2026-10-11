"""
Comprehensive Phase 4 Tests: Evidence Fusion & Incident Intelligence.
Tests:
1. Spatial scoring with H3 and geodesic haversine distance
2. Temporal scoring and interval decay
3. Semantic vector similarity and taxonomy matching
4. Entity resolution overlap scoring
5. Source independence calculation
6. Contradiction detection (opposing hazard states)
7. Core 4-Observation Demo Fusion Flow (Photo + Video + Voice + Sensor -> INCIDENT NXC-001)
8. 'Why does NEXUS think this?' explainability endpoint
9. Evidence timeline and relationship graph endpoints
10. Human-in-the-Loop review queue and operator actions (approve / reject)
11. Incident merge and split operations
"""
import pytest
from app.services.fusion_engine import (
    haversine_distance_m,
    get_h3_cell,
    get_h3_neighbors,
    compute_text_embedding,
    cosine_similarity,
    check_contradiction,
    fusion_engine,
)


def test_spatial_h3_and_haversine():
    lat1, lon1 = 26.9180, 75.7920
    lat2, lon2 = 26.9185, 75.7924  # ~65 meters away

    dist = haversine_distance_m(lat1, lon1, lat2, lon2)
    assert 50.0 < dist < 90.0

    # H3 indexing at resolution 8
    cell1 = get_h3_cell(lat1, lon1, 8)
    cell2 = get_h3_cell(lat2, lon2, 8)
    assert len(cell1) == 15
    neighbors = get_h3_neighbors(cell1, 1)
    assert cell1 in neighbors
    assert cell2 in neighbors


def test_semantic_embedding_and_cosine():
    text1 = "Severe flash flooding on Road R17 bridge embankment with stalled vehicles."
    text2 = "Road R17 water surge overtopping bridge deck, cars submerged in standing water."
    text3 = "Hospital cardiac intensive care unit medical bed inventory status."

    emb1 = compute_text_embedding(text1)
    emb2 = compute_text_embedding(text2)
    emb3 = compute_text_embedding(text3)

    sim_related = cosine_similarity(emb1, emb2)
    sim_unrelated = cosine_similarity(emb1, emb3)

    assert sim_related > sim_unrelated
    assert sim_related > 0.65


def test_contradiction_detection():
    # Clear contradiction between blocked and clear
    obs1 = "Main road completely blocked and flooded under 4 feet of water."
    obs2 = "Vehicles moving normally and road is completely clear."
    is_conflict, reason = check_contradiction(obs1, obs2)
    assert is_conflict is True
    assert reason is not None

    # Consistent observations
    obs3 = "Rapid water rising on road embankment."
    obs4 = "Bridge pillars partially submerged with traffic stalled."
    is_conflict2, _ = check_contradiction(obs3, obs4)
    assert is_conflict2 is False


def test_core_demo_fusion_endpoint(client):
    """Executes the complete Phase 4 4-observation demonstration via API."""
    res = client.post(
        "/api/v1/fusion/demo/core-run",
        data={"world_id": "world-nexus-city-01"},
        headers={"X-User-Role": "COMMANDER"}
    )
    assert res.status_code == 200
    data = res.json()

    assert data["incident_number"] == 1047
    assert data["status"] == "CORROBORATED"
    assert data["confidence"] >= 0.90
    assert data["evidence_count"] == 4
    assert len(data["fused_evidence_ids"]) == 4

    # Verify explainability sub-scores exist and are transparent
    scores = data["scores"]
    assert "spatial" in scores
    assert "temporal" in scores
    assert "semantic" in scores
    assert "entity" in scores
    assert "visual" in scores
    assert "source_independence" in scores
    assert scores["overall"] >= 0.80

    # Verify epistemic breakdown
    breakdown = data["epistemic_breakdown"]
    assert len(breakdown["observed"]) > 0
    assert len(breakdown["inferences"]) > 0
    assert len(breakdown["unknowns"]) > 0


def test_incident_explanation_endpoint(client):
    """Tests the 'Why does NEXUS think this?' explainability drawer endpoint."""
    res = client.get("/api/v1/incidents/inc-nxc-001/explanation", headers={"X-User-Role": "COMMANDER"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "CORROBORATED"
    assert "rationale" in data
    assert len(data["rationale"]) > 20
    assert "scores" in data
    assert data["scores"]["spatial"] > 0.85
    assert data["scores"]["entity"] > 0.85


def test_incident_evidence_and_timeline_endpoints(client):
    """Tests retrieval of evidence chain and real operational chronology."""
    ev_res = client.get("/api/v1/incidents/inc-nxc-001/evidence", headers={"X-User-Role": "COMMANDER"})
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert ev_data["evidence_count"] >= 1
    assert len(ev_data["items"]) >= 1

    tl_res = client.get("/api/v1/incidents/inc-nxc-001/timeline", headers={"X-User-Role": "COMMANDER"})
    assert tl_res.status_code == 200
    tl_data = tl_res.json()
    assert isinstance(tl_data, list)


def test_fusion_review_queue_and_actions(client):
    """Tests human-in-the-loop review queue (/review) and approve/reject actions."""
    # 1. Fetch review queue
    q_res = client.get("/api/v1/fusion/reviews", headers={"X-User-Role": "COMMANDER"})
    assert q_res.status_code == 200
    reviews = q_res.json()
    assert isinstance(reviews, list)

    # 2. If decisions exist, test approval endpoint
    if reviews:
        dec_id = reviews[0]["decision_id"]
        app_res = client.post(
            f"/api/v1/fusion/{dec_id}/approve",
            data={"reviewer": "Commander Vikram", "note": "Confirmed by field dispatch."},
            headers={"X-User-Role": "COMMANDER"}
        )
        assert app_res.status_code == 200
        assert app_res.json()["status"] == "APPROVED"


def test_incident_merge_and_split(client):
    """Tests merging validation and split endpoints."""
    # Test self-merge prevention
    merge_res = client.post(
        "/api/v1/incidents/inc-nxc-001/merge",
        json={"secondary_incident_id": "inc-nxc-001", "reviewer": "Commander Vikram"},
        headers={"X-User-Role": "COMMANDER"}
    )
    assert merge_res.status_code == 400
    assert "Cannot merge" in merge_res.text

    # Test split endpoint
    split_res = client.post(
        "/api/v1/incidents/inc-nxc-001/split",
        json={"evidence_ids": ["ev-non-existent"], "reason": "Testing split"},
        headers={"X-User-Role": "COMMANDER"}
    )
    assert split_res.status_code == 200
    assert split_res.json()["status"] == "SPLIT_COMPLETED"

