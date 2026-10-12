"""
Pytest configuration for TRINETRA with full test database isolation.
Configures an isolated SQLite test database (nexus_test_isolated.db) BEFORE
any application modules are loaded.
"""
import os
from pathlib import Path

# MUST BE SET BEFORE ANY APP IMPORTS
TEST_DB_PATH = Path("./nexus_test_isolated.db")
if TEST_DB_PATH.exists():
    try:
        TEST_DB_PATH.unlink()
    except Exception:
        pass

os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB_PATH.name}"
os.environ["SQLITE_DB_PATH"] = f"./{TEST_DB_PATH.name}"

import asyncio
import pytest
from fastapi.testclient import TestClient
from app.db.init_db import init_db
from app.main import app
from bootstrap_admin import bootstrap


@pytest.fixture(scope="session", autouse=True)
def setup_isolated_test_database():
    """Initializes schema and bootstrap accounts in the isolated test database."""
    async def _init():
        await init_db()
        await bootstrap()

    asyncio.run(_init())

    yield

    # Teardown
    from app.db.session import engine
    async def _cleanup():
        await engine.dispose()

    asyncio.run(_cleanup())
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        test_client.headers["X-User-Role"] = "COMMANDER"
        yield test_client
