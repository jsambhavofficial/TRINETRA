"""
NEXUS API Main Application Factory
Operational Intelligence and Spatial State Gateway.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import logger
from app.db.init_db import init_db
from app.middleware.request_id import RequestIDMiddleware
from app.routes.health import router as health_router
from app.routes.incidents import router as incidents_router
from app.routes.fusion import router as fusion_router
from app.routes.organizations import router as orgs_router
from app.routes.reports import router as reports_router
from app.routes.websocket import router as ws_router
from app.routes.worlds import router as worlds_router
from app.routes.impact import router as impact_router
from app.routes.simulation import router as simulation_router
from app.routes.response import router as response_router
from app.routes.citizen import router as citizen_router
from app.routes.voice import router as voice_router
from app.routes.scenarios import router as scenarios_router
from app.routes.field import router as field_router
from app.routes.auth import router as auth_router
from app.routes.governance import router as governance_router
from app.routes.complaints import router as complaints_router
from app.routes.intelligence import router as intelligence_router
from app.services.job_worker import job_worker




@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting NEXUS Operational API Engine (Phase 3)...")
    try:
        await init_db()
    except Exception as e:
        logger.error(f"Critical error during database initialization: {e}")
    # Start Phase 3 background job worker
    job_worker.start()
    yield
    logger.info("Shutting down NEXUS Operational API Engine.")


app = FastAPI(
    title="NEXUS Operational Intelligence API",
    description="The Living Intelligence Layer for the Physical World - Core State Gateway",
    version="1.0.0-phase3",
    lifespan=lifespan
)

# 1. Telemetry / Request ID Middleware
app.add_middleware(RequestIDMiddleware)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.API_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response



# 3. Standardized Error Handling
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "PERMISSION_DENIED",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_SERVER_ERROR"
    }
    error_code = code_map.get(exc.status_code, "API_ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": error_code,
                "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail)
            }
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Internal server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred in the operational gateway."
            }
        }
    )


# 4. Mount Routes
# Direct health routes at root
app.include_router(health_router)

# Versioned API routes
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(governance_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(orgs_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)  # Phase 3: BEFORE worlds/incidents to prevent path shadowing
app.include_router(fusion_router, prefix=settings.API_V1_STR)   # Phase 4: Fusion & Incident Intelligence
app.include_router(worlds_router, prefix=settings.API_V1_STR)
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(impact_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(response_router, prefix=settings.API_V1_STR)
app.include_router(citizen_router, prefix=settings.API_V1_STR)
app.include_router(field_router, prefix=settings.API_V1_STR)
app.include_router(intelligence_router, prefix=settings.API_V1_STR)
app.include_router(voice_router, prefix=settings.API_V1_STR)
app.include_router(scenarios_router, prefix=settings.API_V1_STR)

app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "product": "TRINETRA",
        "tagline": "State Governance Intelligence & Response Platform",
        "state": "Haryana, India",
        "status": "operational",
        "docs_url": "/docs",
        "health_url": "/health"
    }
