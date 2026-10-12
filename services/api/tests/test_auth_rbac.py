"""
Unit and Integration Tests for TRINETRA Authentication, RBAC, and Haryana Governance Scopes.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_citizen_registration_and_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        email = "test.citizen.new@trinetra.gov.in"
        password = "SecurePassword123"

        # 1. Citizen registration
        res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": password,
                "display_name": "Test Citizen User",
                "phone": "+91-9876543210",
                "district_id": "HR-GU",
            }
        )
        assert res.status_code == 201
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == "CITIZEN"
        assert data["user"]["email"] == email

        # 2. Duplicate registration must fail with 409
        dup_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": password,
                "display_name": "Test Citizen User",
            }
        )
        assert dup_res.status_code == 409

        # 3. Login with correct credentials
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password}
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # 4. Login with wrong password must return 401
        bad_login = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "WrongPassword"}
        )
        assert bad_login.status_code == 401

        # 5. Access /auth/me with token
        me_res = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_res.status_code == 200
        assert me_res.json()["email"] == email
        assert me_res.json()["role"] == "CITIZEN"


@pytest.mark.asyncio
async def test_unauthorized_access_denial():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Without authorization header, accessing protected endpoint must return 401
        res = await client.get("/api/v1/auth/me")
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_role_based_privilege_escalation_prevention():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as a normal citizen
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "citizen.rohit@trinetra.gov.in", "password": "Citizen@2026"}
        )
        assert login_res.status_code == 200
        citizen_token = login_res.json()["access_token"]

        # Citizen attempts to provision another user (must be rejected with 403 Forbidden)
        res = await client.post(
            "/api/v1/auth/provision",
            headers={"Authorization": f"Bearer {citizen_token}"},
            json={
                "email": "rogue.admin@trinetra.gov.in",
                "password": "Password123",
                "display_name": "Rogue Admin",
                "role": "PLATFORM_ADMIN"
            }
        )
        assert res.status_code == 403


@pytest.mark.asyncio
async def test_privileged_user_provisioning_by_admin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as Platform Admin
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@trinetra.gov.in", "password": "Trinetra@2026Admin"}
        )
        assert login_res.status_code == 200
        admin_token = login_res.json()["access_token"]

        # Provision a new District Admin
        new_email = "dc.panchkula.test@trinetra.gov.in"
        res = await client.post(
            "/api/v1/auth/provision",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": new_email,
                "password": "District@2026",
                "display_name": "DC Panchkula",
                "role": "DISTRICT_ADMIN",
                "district_id": "HR-PK"
            }
        )
        assert res.status_code == 201
        data = res.json()
        assert data["email"] == new_email
        assert data["role"] == "DISTRICT_ADMIN"
        assert data["district_id"] == "HR-PK"


@pytest.mark.asyncio
async def test_haryana_governance_framework_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. State metadata
        res = await client.get("/api/v1/governance/state")
        assert res.status_code == 200
        state = res.json()["state"]
        assert state["name"] == "Haryana"
        assert state["capital"] == "Chandigarh"
        assert state["center"]["latitude"] == 29.0588
        assert state["center"]["longitude"] == 76.0856

        # 2. 22 Districts
        districts_res = await client.get("/api/v1/governance/districts")
        assert districts_res.status_code == 200
        assert districts_res.json()["total_districts"] == 22

        # 3. Departments
        depts_res = await client.get("/api/v1/governance/departments")
        assert depts_res.status_code == 200
        assert len(depts_res.json()["departments"]) >= 7
