# TRINETRA Backend API Service

FastAPI-based state governance, intelligence fusion, and operational response gateway for Haryana.

## Overview
TRINETRA API provides:
- **Governance & Complaint Management**: Unified grievance intake, automated AI classification, priority scoring, SLA computation, and departmental routing.
- **State System Integrations**: Connectors for Dial 112, CM Window, and Antyodaya Saral.
- **Multimodal Evidence & Fusion**: Ingestion of citizen media, GPS geotag validation, and graph-based clustering across all 22 Haryana districts.
- **Role-Based Access Control (RBAC)**: Secure JWT authentication with roles: `CITIZEN`, `FIELD_OFFICER`, `DEPARTMENT_OFFICIAL`, `DISTRICT_ADMIN`, `STATE_LEADERSHIP`.
- **Spatial Digital Twin**: Fast geospatial querying, Haversine proximity computation, and H3 spatial grid indexing.
- **What-If Simulation & Impact Intelligence**: Topological graph routing, resource allocation, and counterfactual response evaluation.

## Quickstart
```bash
# Activate virtual environment
.\.venv\Scripts\Activate.ps1    # Windows PowerShell
# source .venv/bin/activate     # Linux / macOS

# Install dependencies
pip install -e .

# Run development server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Base: `http://localhost:8000/api/v1`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Redoc Documentation: `http://localhost:8000/redoc`
- Health Endpoint: `http://localhost:8000/health`
