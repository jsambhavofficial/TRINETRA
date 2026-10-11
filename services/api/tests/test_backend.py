"""
Comprehensive Backend Tests for NEXUS Phase 1.
Tests:
1. Health and Dependency Check
2. Role-Based Access Control and Permissions
3. World Model and Entity Retrieval
4. Incident and Evidence Querying
5. Error Response Format Uniformity
"""
import pytest
from app.auth.permissions import has_permission


def test_basic_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "nexus-api"
    assert "version" in data


def test_dependency_health(client):
    response = client.get("/health/dependencies")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "dependencies" in data
    assert "database" in data["dependencies"]
    assert "redis" in data["dependencies"]
    assert "storage" in data["dependencies"]
    # Database must be healthy in dev with sqlite
    assert data["dependencies"]["database"]["status"] == "HEALTHY"


def test_permission_logic():
    # SUPER_ADMIN has wildcard access
    assert has_permission("SUPER_ADMIN", "anything:action") is True

    # COMMANDER permissions
    assert has_permission("COMMANDER", "world:read") is True
    assert has_permission("COMMANDER", "actions:approve") is True
    assert has_permission("COMMANDER", "actions:execute") is True

    # VIEWER has read only
    assert has_permission("VIEWER", "world:read") is True
    assert has_permission("VIEWER", "actions:approve") is False
    assert has_permission("VIEWER", "actions:execute") is False

    # REPORTER can only submit evidence
    assert has_permission("REPORTER", "evidence:submit") is True
    assert has_permission("REPORTER", "world:read") is False


def test_permission_header_enforcement(client):
    # Request as VIEWER trying to read world - should succeed
    res = client.get("/api/v1/worlds", headers={"X-User-Role": "VIEWER"})
    assert res.status_code == 200

    # Request with invalid role
    res_invalid = client.get("/api/v1/worlds", headers={"X-User-Role": "UNKNOWN_ROLE"})
    assert res_invalid.status_code == 401
    assert "error" in res_invalid.json()
    assert res_invalid.json()["error"]["code"] == "UNAUTHORIZED"


def test_worlds_and_entities_seed(client):
    # Ensure seed world is present
    res_worlds = client.get("/api/v1/worlds")
    assert res_worlds.status_code == 200
    worlds = res_worlds.json()
    assert len(worlds) >= 1
    assert worlds[0]["id"] == "world-nexus-city-01"

    # Ensure entities are present
    res_entities = client.get("/api/v1/entities")
    assert res_entities.status_code == 200
    entities = res_entities.json()
    assert len(entities) >= 20  # Over 20 roads, hospitals, facilities seeded

    # Verify hospital entity
    hospitals = [e for e in entities if e["entity_type"] == "HOSPITAL"]
    assert len(hospitals) == 4
    central_hosp = next(h for h in hospitals if h["name"] == "Central Memorial Hospital")
    assert central_hosp["status"] == "AT_RISK"

    # Verify road R17
    roads = [e for e in entities if e["entity_type"] == "ROAD"]
    assert len(roads) >= 15
    road_17 = next(r for r in roads if "R17" in r["name"])
    assert road_17["status"] == "DEGRADED"


def test_incidents_and_evidence_seed(client):
    res_inc = client.get("/api/v1/incidents")
    assert res_inc.status_code == 200
    incidents = res_inc.json()
    assert len(incidents) >= 1

    inc_1047 = next(i for i in incidents if i["incident_number"] == 1047)
    assert inc_1047["status"] in ("ACTIVE", "CORROBORATED")
    assert inc_1047["severity"] == "HIGH"
    assert inc_1047["confidence"] >= 0.90

    # Evidence items
    res_ev = client.get("/api/v1/evidence")
    assert res_ev.status_code == 200
    evidence = res_ev.json()
    assert len(evidence) >= 2


def test_error_response_format(client):
    # Request non-existent entity
    res = client.get("/api/v1/entities/non-existent-id-999")
    assert res.status_code == 404
    data = res.json()
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "not found" in data["error"]["message"].lower()


def test_world_snapshot_and_districts(client):
    world_id = "world-nexus-city-01"

    # Test districts endpoint
    res_dist = client.get(f"/api/v1/worlds/{world_id}/districts")
    assert res_dist.status_code == 200
    districts = res_dist.json()
    assert len(districts) == 4
    district_codes = {d["code"] for d in districts}
    assert district_codes == {"NORTH", "SOUTH", "EAST", "WEST"}

    # Test aggregated snapshot endpoint
    res_snap = client.get(f"/api/v1/worlds/{world_id}/snapshot")
    assert res_snap.status_code == 200
    snap = res_snap.json()
    assert "world" in snap
    assert snap["world"]["id"] == world_id
    assert "districts" in snap
    assert len(snap["districts"]) == 4
    assert "entities" in snap
    assert len(snap["entities"]) >= 40  # Includes buildings, roads, facilities
    assert "assets" in snap
    assert len(snap["assets"]) >= 10
    assert "incidents" in snap
    assert len(snap["incidents"]) >= 2
    assert snap["mode"] == "LIVE"
  
  
# ==============================================================  
# PHASE 3 TESTS: Evidence, Reports, Candidate Incidents, AI  
# ==============================================================  
  
def test_text_report_creation(client):  
    resp = client.post('/api/v1/reports', data={'text_content': 'Flood near bridge', 'world_id': 'world-nexus-city-01', 'latitude': '26.916', 'longitude': '75.790'})  
    assert resp.status_code == 202  
    data = resp.json()  
    assert 'report_id' in data  
    assert 'evidence_id' in data  
    assert data['status'] == 'PROCESSING'  
  
  
def test_image_upload(client):  
    import io  
    fake_image = io.BytesIO(b'GIF89a' + b'\x00' * 100)  
    resp = client.post('/api/v1/evidence/upload', files={'file': ('flood.jpg', fake_image, 'image/jpeg')}, data={'world_id': 'world-nexus-city-01', 'latitude': '26.916', 'longitude': '75.790'})  
    assert resp.status_code == 202  
    data = resp.json()  
    assert 'evidence_id' in data  
    assert data['status'] == 'PROCESSING'  
    assert data['evidence_type'] == 'IMAGE'  
  
  
def test_evidence_retrieval(client):  
    import io  
    fake_image = io.BytesIO(b'GIF89a' + b'\x00' * 100)  
    upload = client.post('/api/v1/evidence/upload', files={'file': ('test.jpg', fake_image, 'image/jpeg')}, data={'world_id': 'world-nexus-city-01'})  
    evidence_id = upload.json()['evidence_id']  
    resp = client.get(f'/api/v1/evidence/{evidence_id}')  
    assert resp.status_code == 200  
    data = resp.json()  
    assert data['id'] == evidence_id  
    assert data['evidence_type'] == 'IMAGE'  
    assert data['status'] in ('UPLOADED', 'PROCESSING', 'ANALYZED')  
  
  
def test_candidates_endpoint(client):  
    resp = client.get('/api/v1/incidents/candidates')  
    assert resp.status_code == 200  
    assert isinstance(resp.json(), list)  
  
  
def test_entity_resolution(client):  
    resp = client.get('/api/v1/entities/resolve?q=flood+near+bridge')  
    assert resp.status_code == 200  
    data = resp.json()  
    assert 'candidates' in data  
    assert 'resolved' in data  
  
  
def test_evidence_analysis_trace(client):  
    import io, time  
    fake_image = io.BytesIO(b'GIF89a' + b'\x00' * 100)  
    upload = client.post('/api/v1/evidence/upload', files={'file': ('flood.jpg', fake_image, 'image/jpeg')}, data={'world_id': 'world-nexus-city-01'})  
    evidence_id = upload.json()['evidence_id']  
    resp = client.get(f'/api/v1/evidence/{evidence_id}/analysis')  
    assert resp.status_code == 200  
    data = resp.json()  
    assert 'evidence_id' in data  
    assert 'status' in data  
    assert 'processing_trace' in data 
