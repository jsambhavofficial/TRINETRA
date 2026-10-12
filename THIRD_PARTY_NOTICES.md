# THIRD-PARTY SOFTWARE NOTICES AND LICENSES

This file documents third-party open-source components, libraries, services, and datasets utilized in **TRINETRA — State Governance Intelligence & Operational Platform**.

---

## 1. Third-Party Dependency Ledger

| Component | Version / Commit | License | Repository / Origin | Role in TRINETRA | Attribution & Compliance Requirements |
|---|---|---|---|---|---|
| **Next.js** | `^15.0.0` | MIT | https://github.com/vercel/next.js | Core web application framework, SSR/CSR hydration, routing. | Copyright (c) 2026 Vercel, Inc. License notice retained. |
| **React** | `^19.0.0` | MIT | https://github.com/facebook/react | UI component architecture and virtual DOM. | Copyright (c) Meta Platforms, Inc. License notice retained. |
| **Tailwind CSS** | `^3.4.0` | MIT | https://github.com/tailwindlabs/tailwindcss | Utility-first styling and theme token engine. | Copyright (c) Tailwind Labs, Inc. License notice retained. |
| **Lucide Icons** | `^0.450.0` | ISC | https://github.com/lucide-icons/lucide | Accessible SVG iconography for operational HUD. | Copyright (c) Lucide Contributors. License notice retained. |
| **FastAPI** | `^0.115.0` | MIT | https://github.com/fastapi/fastapi | High-performance asynchronous API gateway. | Copyright (c) Sebastián Ramírez. License notice retained. |
| **Pydantic** | `^2.9.0` | MIT | https://github.com/pydantic/pydantic | Data validation and canonical schema serialization. | Copyright (c) Samuel Colvin and Pydantic contributors. License notice retained. |
| **SQLAlchemy** | `^2.0.35` | MIT | https://github.com/sqlalchemy/sqlalchemy | Relational ORM and database engine. | Copyright (c) Michael Bayer and SQLAlchemy authors. |
| **Alembic** | `^1.13.3` | MIT | https://github.com/sqlalchemy/alembic | Database migration framework. | Copyright (c) Michael Bayer and Alembic authors. |
| **CesiumJS** *(Phase 2)* | `^1.121.0` | Apache-2.0 | https://github.com/CesiumGS/cesium | 3D globe and spatial visualization runtime. | Apache License 2.0. Copyright (c) Cesium GS, Inc. |
| **PostGIS** | `3.4+` | GPL-2.0-or-later | https://github.com/postgis/postgis | Spatial geometry engine and spatial index. | Used as standalone service in container. Not statically linked. |
| **Redis** | `7.4+` | RSALv2 / SSPLv1 or BSD-3 | https://github.com/redis/redis | Cache, rate limiting, and event subscription. | Used as external standalone service via standard wire protocol. |
| **MinIO** | `RELEASE.2024` | AGPL-3.0 | https://github.com/minio/minio | S3-compatible local object storage. | Standalone storage service accessed exclusively over HTTP REST/S3 API. |
| **H3** *(Phase 6)* | `4.1+` | Apache-2.0 | https://github.com/uber/h3 | Hexagonal spatial hierarchical indexing. | Copyright (c) Uber Technologies, Inc. Apache-2.0. |
| **NetworkX** *(Phase 6)* | `3.3+` | BSD-3-Clause | https://github.com/networkx/networkx | Dependency graph analysis & impact propagation. | Copyright (c) NetworkX Developers. Notice retained. |
| **OpenStreetMap** | Current seed | ODbL 1.0 | https://www.openstreetmap.org | Base geographic road and building layouts for synthetic world. | Mandatory attribution: *"© OpenStreetMap contributors, ODbL 1.0"*. |

---

## 2. Licensing Compliance Directives

1. **Service Boundaries**: AGPL-3.0 (MinIO) and GPL-2.0+ (PostGIS) components run strictly as isolated standalone network services behind standard HTTP/S3/Postgres wire protocols and are never statically linked into application source code.
2. **Attribution Preservation**: All permissive (MIT, Apache-2.0, BSD) license texts and copyright notices are preserved in distributable builds.
3. **No Unlicensed Assets**: Synthetic datasets and procedural geometries are generated and validated without proprietary restriction.
