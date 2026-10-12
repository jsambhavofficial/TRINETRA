"""
TRINETRA Secure Provisioning & Account Bootstrap Script.
Run this script to initialize database schemas and safely provision:
1. The Initial Platform Administrator
2. Documented local development test accounts for all 5 roles.

Usage:
  python bootstrap_admin.py
"""
import asyncio
from typing import List, Dict
from sqlalchemy import select
from app.core.security import hash_password
from app.db.init_db import init_db
from app.db.session import async_session_factory
from app.models.organization import UserModel

TEST_ACCOUNTS: List[Dict[str, str]] = [
    {
        "id": "usr-admin-root-01",
        "email": "admin@trinetra.gov.in",
        "password": "Trinetra@2026Admin",
        "display_name": "Chief Technical Administrator",
        "role": "PLATFORM_ADMIN",
        "district_id": None,
        "department_id": None,
        "unit_id": None,
        "phone": "+91-172-2740001",
    },
    {
        "id": "usr-leadership-01",
        "email": "leadership@trinetra.gov.in",
        "password": "Leadership@2026",
        "display_name": "Shri Rajesh Kumar, IAS (Principal Secretary)",
        "role": "STATE_LEADERSHIP",
        "district_id": None,
        "department_id": None,
        "unit_id": None,
        "phone": "+91-172-2740002",
    },
    {
        "id": "usr-district-gurugram",
        "email": "dc.gurugram@trinetra.gov.in",
        "password": "District@2026",
        "display_name": "Deputy Commissioner Gurugram",
        "role": "DISTRICT_ADMIN",
        "district_id": "HR-GU",
        "department_id": None,
        "unit_id": None,
        "phone": "+91-124-2321144",
    },
    {
        "id": "usr-dept-health",
        "email": "health.lead@trinetra.gov.in",
        "password": "Department@2026",
        "display_name": "Dr. Sunita Rao (Director Health Services)",
        "role": "DEPARTMENT",
        "district_id": None,
        "department_id": "DEPT-HEALTH",
        "unit_id": None,
        "phone": "+91-172-2573900",
    },
    {
        "id": "usr-field-amb01",
        "email": "field.amb01@trinetra.gov.in",
        "password": "Field@2026",
        "display_name": "Officer Vikram Singh (Rapid Rescue 108)",
        "role": "FIELD_OFFICER",
        "district_id": "HR-GU",
        "department_id": "DEPT-HEALTH",
        "unit_id": "UNIT-AMB-01",
        "phone": "+91-9876543210",
    },
    {
        "id": "usr-district-faridabad",
        "email": "dc.faridabad@trinetra.gov.in",
        "password": "Faridabad@2026",
        "display_name": "Deputy Commissioner Faridabad",
        "role": "DISTRICT_ADMIN",
        "district_id": "HR-FA",
        "department_id": None,
        "unit_id": None,
        "phone": "+91-129-2227800",
    },
    {
        "id": "usr-dept-pwd",
        "email": "pwd.lead@trinetra.gov.in",
        "password": "Department@2026",
        "display_name": "Er. Rajesh Bhardwaj (Engineer-in-Chief PWD)",
        "role": "DEPARTMENT",
        "district_id": None,
        "department_id": "DEPT-PWD",
        "unit_id": None,
        "phone": "+91-172-2560120",
    },
    {
        "id": "usr-field-other",
        "email": "field.other@trinetra.gov.in",
        "password": "Field@2026",
        "display_name": "Officer Sunil (Other Unit 99)",
        "role": "FIELD_OFFICER",
        "district_id": "HR-FA",
        "department_id": "DEPT-PWD",
        "unit_id": "UNIT-OTHER-99",
        "phone": "+91-9876543299",
    },
    {
        "id": "usr-cit-rohit",
        "email": "citizen.rohit@trinetra.gov.in",
        "password": "Citizen@2026",
        "display_name": "Rohit Verma (Resident, Gurugram)",
        "role": "CITIZEN",
        "district_id": "HR-GU",
        "department_id": None,
        "unit_id": None,
        "phone": "+91-9988776655",
    },
]


async def bootstrap():
    print("=" * 70)
    print("  TRINETRA — Secure Identity Bootstrap & Development Account Seeder  ")
    print("=" * 70)

    # 1. Ensure DB schemas and columns exist
    await init_db()

    async with async_session_factory() as session:
        for acc in TEST_ACCOUNTS:
            email = acc["email"]
            stmt = select(UserModel).where(UserModel.email == email)
            res = await session.execute(stmt)
            existing = res.scalars().first()

            hashed_pwd = hash_password(acc["password"])

            if existing:
                print(f"[EXISTS] User '{email}' found. Updating credentials & role...")
                existing.display_name = acc["display_name"]
                existing.hashed_password = hashed_pwd
                existing.role = acc["role"]
                existing.district_id = acc["district_id"]
                existing.department_id = acc["department_id"]
                existing.unit_id = acc["unit_id"]
                existing.phone = acc["phone"]
                existing.is_active = True
            else:
                print(f"[CREATED] Provisioning new account for '{email}' ({acc['role']})...")
                new_user = UserModel(
                    id=acc["id"],
                    organization_id="org-nexus-ops",
                    role_id="role-viewer",
                    email=email,
                    display_name=acc["display_name"],
                    hashed_password=hashed_pwd,
                    role=acc["role"],
                    district_id=acc["district_id"],
                    department_id=acc["department_id"],
                    unit_id=acc["unit_id"],
                    phone=acc["phone"],
                    is_active=True,
                )
                session.add(new_user)

        await session.commit()

    print("\n" + "=" * 70)
    print("  BOOTSTRAP COMPLETE — Provisioned Accounts Summary:  ")
    print("=" * 70)
    for acc in TEST_ACCOUNTS:
        scope = acc['district_id'] or acc['department_id'] or acc['unit_id'] or 'State-wide'
        print(f"  • Role: {acc['role']:<17} | Email: {acc['email']:<32} | Scope: {scope}")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(bootstrap())
