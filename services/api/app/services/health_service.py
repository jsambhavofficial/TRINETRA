"""
Real Health Service
Performs active network & query health verification against Database, Redis, and Storage.
No hardcoded statuses.
"""
import time
from typing import Dict
from sqlalchemy import text
from app.core.config import settings
from app.core.logging import logger
from app.db.session import async_session_factory
from app.schemas.health import DependencyHealth, SystemHealth

START_TIME = time.time()


class HealthService:
    @staticmethod
    async def check_database() -> DependencyHealth:
        start = time.perf_counter()
        try:
            async with async_session_factory() as session:
                await session.execute(text("SELECT 1"))
            latency = (time.perf_counter() - start) * 1000
            db_type = "SQLite" if "sqlite" in settings.DATABASE_URL else "PostgreSQL/PostGIS"
            return DependencyHealth(
                status="HEALTHY",
                latency_ms=round(latency, 2),
                details=f"Connected to {db_type}"
            )
        except Exception as e:
            latency = (time.perf_counter() - start) * 1000
            logger.warning(f"Database health check failed: {e}")
            return DependencyHealth(
                status="UNHEALTHY",
                latency_ms=round(latency, 2),
                details=f"Connection error: {str(e)[:100]}"
            )

    @staticmethod
    async def check_redis() -> DependencyHealth:
        start = time.perf_counter()
        try:
            import redis.asyncio as aioredis
            r = aioredis.from_url(settings.REDIS_URL, socket_timeout=1.0)
            await r.ping()
            await r.aclose()
            latency = (time.perf_counter() - start) * 1000
            return DependencyHealth(
                status="HEALTHY",
                latency_ms=round(latency, 2),
                details="Redis pong received"
            )
        except Exception as e:
            latency = (time.perf_counter() - start) * 1000
            return DependencyHealth(
                status="DEGRADED",
                latency_ms=round(latency, 2),
                details=f"Redis unavailable ({str(e)[:80]}). Cache fallback active."
            )

    @staticmethod
    async def check_storage() -> DependencyHealth:
        start = time.perf_counter()
        import httpx
        try:
            # Check S3 / MinIO health endpoint
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(f"{settings.S3_ENDPOINT}/minio/health/live")
                latency = (time.perf_counter() - start) * 1000
                if res.status_code == 200:
                    return DependencyHealth(
                        status="HEALTHY",
                        latency_ms=round(latency, 2),
                        details="MinIO / S3 storage online"
                    )
                else:
                    return DependencyHealth(
                        status="DEGRADED",
                        latency_ms=round(latency, 2),
                        details=f"Storage responded with HTTP {res.status_code}"
                    )
        except Exception as e:
            latency = (time.perf_counter() - start) * 1000
            return DependencyHealth(
                status="DEGRADED",
                latency_ms=round(latency, 2),
                details="S3/MinIO unreachable. Local filesystem fallback active."
            )

    @classmethod
    async def get_system_health(cls) -> SystemHealth:
        db_health = await cls.check_database()
        redis_health = await cls.check_redis()
        storage_health = await cls.check_storage()

        # System is healthy if database is healthy; degraded if secondary services fail
        overall = "HEALTHY"
        if db_health.status == "UNHEALTHY":
            overall = "UNHEALTHY"
        elif redis_health.status != "HEALTHY" or storage_health.status != "HEALTHY":
            overall = "DEGRADED"

        return SystemHealth(
            status=overall,
            version="1.0.0-phase1",
            uptime_seconds=round(time.time() - START_TIME, 1),
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            environment=settings.APP_ENV,
            dependencies={
                "database": db_health,
                "redis": redis_health,
                "storage": storage_health
            }
        )
