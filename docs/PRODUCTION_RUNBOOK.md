# TRINETRA — Production Operations & Reliability Runbook
**State Governance Intelligence & Response Platform (Haryana, India)**

---

## 1. Architecture Overview
TRINETRA is built as a resilient, multi-tier architecture:
- **Presentation Layer**: Next.js 15 (Node.js 22 LTS / React 19) serving 5 role-based portals (State Leadership, District Admin, Department Head, Field Officer, Citizen).
- **Application & Intelligence Gateway**: FastAPI (Python 3.11) with Uvicorn, async SQLAlchemy ORM, and H3 hexagonal spatial indexing.
- **Data & State Persistence**:
  - Development / Edge: SQLite (`nexus_dev.db`) with async WAL mode.
  - Production / Staging: PostgreSQL 16 + PostGIS 3.4.
  - File Storage: MinIO / S3 for resolution proofs and evidence media.
  - Cache & PubSub: Redis 7 for real-time telemetry caches.

---

## 2. Environment Configuration
Copy `.env.production.example` to `.env` in the deployment directory:
```bash
cp .env.production.example .env
```
Ensure `SECRET_KEY` is generated using a secure random entropy source:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 3. Database Initialization & Bootstrap
To initialize schema and seed initial administrative accounts:
```bash
# 1. Enter services/api directory
cd services/api

# 2. Run database migration / schema initialization
python -c "import asyncio; from app.db.init_db import init_db; asyncio.run(init_db())"

# 3. Bootstrap role accounts
python bootstrap_admin.py
```

---

## 4. Docker Deployment
Launch services using Docker Compose:
```bash
cd infra/docker
docker-compose -f docker-compose.yml up -d --build
```
Verify container health:
```bash
docker-compose ps
```

---

## 5. Health & Observability Endpoints
| Endpoint | Method | Expected Response | Description |
|---|---|---|---|
| `/health` | `GET` | `{"status": "healthy"}` | Basic gateway liveness check |
| `/api/v1/health` | `GET` | `{"status": "healthy", "database": "connected"}` | Deep dependency readiness check |
| `/api/v1/governance/state` | `GET` | `{"state": "Haryana", "is_demo": ...}` | Provenance disclaimer & boundaries |
| `/api/v1/governance/integrations/status` | `GET` | `{"adapters": [...]}` | External adapter connectivity status |

---

## 6. Backup & Disaster Recovery

### SQLite Backup (Development / Edge Standby)
```bash
# Safely snapshot SQLite database using sqlite3 vacuum into
sqlite3 nexus_dev.db "VACUUM INTO 'backups/trinetra_backup_$(date +%Y%m%d_%H%M%S).db';"
```

### PostgreSQL Backup (Production)
```bash
# Automated pg_dump
docker exec -t nexus-postgres pg_dump -U postgres -d nexus -F c -b -v -f /tmp/backup.dump
docker cp nexus-postgres:/tmp/backup.dump ./backups/trinetra_pg_$(date +%Y%m%d_%H%M%S).dump
```

### PostgreSQL Restore
```bash
docker cp ./backups/target_backup.dump nexus-postgres:/tmp/restore.dump
docker exec -t nexus-postgres pg_restore -U postgres -d nexus -v -c /tmp/restore.dump
```

---

## 7. Incident Escalation & Rollback Plan
If an operational defect is identified in a deployment:
1. Revert to the last known stable Docker image tag:
   ```bash
   docker-compose down
   # update image tags in docker-compose.yml to previous stable commit
   docker-compose up -d
   ```
2. Check logs for request correlation IDs:
   ```bash
   docker logs -f nexus-api | grep "request_id"
   ```
3. If database schema was modified, restore the snapshot created immediately before the migration.
