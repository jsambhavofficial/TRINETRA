
# NEXUS — MASTER TECH STACK & IMPLEMENTATION MAP

## 1. RECOMMENDED FINAL STACK

### Frontend

- Next.js
- React
- TypeScript
- CesiumJS
- MapLibre GL JS
- Tailwind CSS
- shadcn/ui or equivalent
- TanStack Query
- Zustand
- WebSocket client

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- Redis

### Data

- PostgreSQL
- PostGIS
- pgvector
- MinIO / S3

### AI & Intelligence Kernel

- Google Gemini 2.5 Flash Lite (`gemini-flash-lite-latest` via Google GenAI SDK)
- DeterministicRulesAIProvider (zero-downtime offline fallback)
- AI Deduplication & Incident Clustering Engine (50 citizen grievances -> 1 master department mission)
- Multimodal Complaint Reasoner (image classification, category, priority P1-P4, SLA)
- Realtime Web Speech API & NLP Voice Command Center
- H3 Uber Hexcell spatial indexing + Haversine 1000m proximity fusion
- Grounding DINO / YOLOv8 vision perception
- Whisper / whisper.cpp audio transcription

### Geospatial

- H3
- OSMnx
- GeoPandas
- Shapely
- GDAL
- PROJ

### Routing

Choose one:
- OSRM
- Valhalla
- GraphHopper

### Simulation

- NetworkX
- OR-Tools
- optional SUMO

### Observability

- OpenTelemetry
- optional Prometheus/Grafana

### Delivery

- Docker Compose
- GitHub Actions
- Playwright
- Pytest

---

# 2. EXACT RESPONSIBILITY MAP

| Product capability | Primary technology | NEXUS-owned logic |
|---|---|---|
| 3D globe | CesiumJS | world layer model |
| 2D mode | MapLibre | operational filters |
| spatial database | PostGIS | entity semantics |
| heatmap | H3 | risk aggregation |
| road graph | OSMnx + PostGIS | dependency model |
| routing | OSRM/Valhalla | action-aware reroute |
| CV detection | Grounding DINO/RT-DETR | incident mapping |
| segmentation | SAM 2 | affected-area interpretation |
| speech | Whisper/Realtime | command semantics |
| agents | LangGraph | NEXUS workflow |
| graph reasoning | NetworkX | impact propagation |
| optimization | OR-Tools | plan constraints |
| vector search | pgvector | evidence matching |
| storage | MinIO/S3 | provenance |
| realtime | WebSockets | world updates |
| telemetry | OpenTelemetry | traceability |

---

# 3. REPOSITORY CATALOG

## A. CESIUMJS

Repository:
https://github.com/CesiumGS/cesium

Use:
- 3D globe
- terrain
- buildings
- dynamic entities
- 3D Tiles
- camera transitions
- simulation visualization

License:
Apache-2.0. citeturn971026search4

Priority:
**MUST**

---

## B. MAPLIBRE GL JS

Repository:
https://github.com/maplibre/maplibre-gl-js

Use:
- 2D vector map
- dense data overlays
- lightweight fallback

License:
BSD-3-Clause. citeturn517041search2turn517041search0

Priority:
SHOULD

---

## C. H3

Repository:
https://github.com/uber/h3

Use:
- hex spatial bins
- density
- risk cells
- heatmaps
- region aggregation

License:
Apache-2.0. citeturn971026search6

Priority:
MUST

---

## D. POSTGIS

Repository:
https://github.com/postgis/postgis

Use:
- geometry
- spatial queries
- geofencing
- point/polygon operations
- nearest entity queries

License:
PostGIS core is GPL-2.0-or-later, with additional dependency licenses. citeturn517041search7

Priority:
MUST

Important:
Review deployment/license implications for your intended distribution.

---

## E. PGVECTOR

Repository:
https://github.com/pgvector/pgvector

Use:
- embedding similarity
- report matching
- semantic incident search
- document/evidence retrieval

License:
Permissive PostgreSQL-compatible licensing; current repository license grants use, modification and distribution subject to its notice terms. citeturn517041search5turn517041search8

Priority:
MUST

---

## F. OSMNX

Repository:
https://github.com/gboeing/osmnx

Use:
- seed road network
- OSM graph extraction
- amenities
- buildings
- routing graph preparation

License:
MIT. OSM source data has its own ODbL attribution requirements. citeturn517041search3

Priority:
MUST

---

## G. NETWORKX

Repository:
https://github.com/networkx/networkx

Use:
- impact graph
- connectivity
- graph propagation
- dependency analysis
- scenario network effects

License:
BSD-3-Clause. citeturn517041search1

Priority:
MUST

---

## H. OR-TOOLS

Repository:
https://github.com/google/or-tools

Use:
- response optimization
- resource allocation
- route/resource constraints
- scheduling

License:
Apache-2.0. citeturn517041search9

Priority:
SHOULD

---

## I. OSRM

Repository:
https://github.com/Project-OSRM/osrm-backend

Use:
- route computation
- nearest road
- table duration
- map matching

License:
BSD-2-Clause. citeturn971026search7

Priority:
SHOULD

---

## J. VALHALLA

Repository:
https://github.com/valhalla/valhalla

Use:
- routing
- map matching
- isochrones
- travel time

License:
MIT. OSM test data has separate ODbL licensing considerations. citeturn294394search10

Priority:
Alternative to OSRM.

---

## K. GRAPHHOPPER

Repository:
https://github.com/graphhopper/graphhopper

Use:
- routing
- isochrones
- alternative routes
- map matching

License:
Apache-2.0. citeturn389795view3

Priority:
Alternative to OSRM/Valhalla.

---

## L. GEOPANDAS

Repository:
https://github.com/geopandas/geopandas

Use:
- preprocessing
- geographic data handling
- seed data generation

License:
BSD-3-Clause. citeturn971026search5turn971026search8

Priority:
MUST for data prep.

---

## M. SHAPELY

Repository:
https://github.com/shapely/shapely

Use:
- geometry operations
- buffers
- intersections
- topology

License:
BSD-3-Clause. GEOS underneath is LGPL-2.1. citeturn971026search0turn971026search2

Priority:
MUST for backend GIS.

---

## N. GDAL

Repository:
https://github.com/OSGeo/gdal

Use:
- raster/vector conversion
- GeoTIFF
- terrain
- preprocessing

License:
Current repository describes GDAL as MIT licensed. citeturn918605view7

Priority:
OPTIONAL.

---

## O. PROJ

Repository:
https://github.com/OSGeo/PROJ

Use:
- coordinate reference systems
- projection conversion
- geospatial transformations

Priority:
OPTIONAL.

Pin and review exact release license metadata before redistribution.

---

## P. GROUNDING DINO

Repository:
https://github.com/IDEA-Research/GroundingDINO

Use:
- open-vocabulary detection
- text-prompted object detection

License:
Apache-2.0. citeturn918605view0

Priority:
MUST for advanced photo analysis.

---

## Q. SAM 2

Repository:
https://github.com/facebookresearch/sam2

Use:
- image segmentation
- video segmentation
- region extraction
- object masks

License:
Apache-2.0 for code/checkpoints/demo/training code, with separate font licensing in demo assets. citeturn517041search11

Priority:
SHOULD/MUST depending on demo.

---

## R. RT-DETR

Repository:
https://github.com/lyuwenyu/RT-DETR

Use:
- real-time object detection
- vehicle/person/object stream detection

License:
Apache-2.0. citeturn389795view0

Priority:
SHOULD.

---

## S. MMDETECTION

Repository:
https://github.com/open-mmlab/mmdetection

Use:
- model zoo
- detection/segmentation framework

License:
Apache-2.0. citeturn294394search4

Priority:
ALTERNATIVE.

Do not add this if RT-DETR already covers the need.

---

## T. ULTRALYTICS

Repository:
https://github.com/ultralytics/ultralytics

Use:
- object detection
- segmentation
- tracking

License:
AGPL-3.0 or Enterprise License per current Ultralytics documentation. citeturn294394search11

Priority:
OPTIONAL / LICENSE-SENSITIVE.

---

## U. LANGGRAPH

Repository:
https://github.com/langchain-ai/langgraph

Use:
- stateful agent workflow
- orchestration
- checkpoints
- human approval

License:
MIT. citeturn294394search7

Priority:
MUST.

---

## V. WHISPER

Repository:
https://github.com/openai/whisper

Use:
- speech recognition
- multilingual audio
- voice report transcription

License:
MIT for code and model weights. citeturn389795view1

Priority:
SHOULD.

---

## W. WHISPER.CPP

Repository:
https://github.com/ggml-org/whisper.cpp

Use:
- offline ASR
- local CPU/GPU speech

License:
MIT. citeturn389795view2

Priority:
SHOULD as fallback.

---

## X. PIPER

Repository:
https://github.com/rhasspy/piper

Use:
- offline TTS
- local voice

License:
MIT. citeturn294394search0

Priority:
OPTIONAL.

---

## Y. SUMO

Repository:
https://github.com/eclipse-sumo/sumo

Use:
- traffic simulation
- vehicle network
- congestion experiments

License:
EPL-2.0 with GPL v2-or-later secondary option under stated conditions. citeturn517041search10

Priority:
OPTIONAL.

---

## Z. OPENTELEMETRY PYTHON

Repository:
https://github.com/open-telemetry/opentelemetry-python

Use:
- trace IDs
- AI tool call tracing
- latency
- errors

License:
Apache-2.0. citeturn294394search3

Priority:
SHOULD.

---

# 4. LICENSE TIERS

## Green — generally simple, still preserve notices

- Apache-2.0
- MIT
- BSD-2-Clause
- BSD-3-Clause

Examples:
CesiumJS, H3, OSMnx, NetworkX, SAM 2, RT-DETR, Whisper, GraphHopper, MapLibre.

Still review:
- bundled models
- fonts
- example assets
- datasets

## Yellow — review carefully

- GPL
- LGPL
- dual licenses
- model-specific license
- data licenses

Examples:
PostGIS, Ultralytics, SUMO, OSM data.

## Red — do not copy blindly

- repositories without clear license
- model weights with unclear terms
- third-party datasets without redistribution rights
- commercial SaaS clones
- scraped copyrighted imagery

---

# 5. THIRD-PARTY NOTICE FILE

Create:

```text
THIRD_PARTY_NOTICES.md
```

Columns:

```text
Dependency
Version
Commit
Repository
License
Usage
Attribution
Modifications
Notes
```

Every installed project goes here.

---

# 6. EXACT PACKAGE GROUPS

## frontend

```text
next
react
typescript
cesium
maplibre-gl
@tanstack/react-query
zustand
zod
tailwindcss
```

## backend

```text
fastapi
uvicorn
pydantic
sqlalchemy
alembic
asyncpg
redis
boto3
```

## geospatial

```text
geopandas
shapely
osmnx
h3
pyproj
rasterio
```

## graph/optimization

```text
networkx
ortools
```

## AI

```text
openai
langgraph
torch
transformers
opencv-python
sam2
groundingdino
```

Do not install everything on day 1.

---

# 7. WHAT TO BUILD FIRST

### Sprint 1

```text
Cesium
PostGIS
FastAPI
Next.js
```

### Sprint 2

```text
Evidence upload
AI interpretation
Incident entity
```

### Sprint 3

```text
H3
NetworkX
OSRM/Valhalla
```

### Sprint 4

```text
Scenario
Planner
Approval
Verification
```

### Sprint 5

```text
Grounding DINO
SAM 2
Voice
```

---

# 8. WHAT NOT TO ADD EARLY

Do NOT start with:
- SUMO
- Neo4j
- Kafka
- Kubernetes
- custom model training
- drones
- photogrammetry
- ten different map providers

Get the end-to-end loop working first.

---

# 9. FINAL ARCHITECTURE

```text
                           NEXUS
                             │
                   ┌─────────▼─────────┐
                   │   LIVE WORLD      │
                   │   3D / GIS        │
                   └─────────┬─────────┘
                             │
           ┌─────────────────┼──────────────────┐
           │                 │                  │
        Evidence          Entities          Events
           │                 │                  │
           └─────────────────┼──────────────────┘
                             │
                      AI OBSERVATION
                             │
                       INCIDENT FUSION
                             │
                       IMPACT GRAPH
                             │
                     COUNTERFACTUAL
                       SIMULATION
                             │
                    RESPONSE PLANS
                             │
                       POLICY GATE
                             │
                        APPROVAL
                             │
                         ACTION
                             │
                       VERIFICATION
                             │
                     UPDATED WORLD
```

---

# 10. FINAL PRINCIPLE

The hackathon judges do not need to see every repository.

They need to see a product that feels impossible but is technically believable.

Open-source gives us the commodity infrastructure.

**NEXUS's value is the orchestration and intelligence layer.**
