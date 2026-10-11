
# NEXUS — REPOSITORY & OPEN-SOURCE RESOURCE CATALOG
## Practical usage guide

This file answers:

> "Kaun sa GitHub repo hum seedha use kar sakte hain, kis ka kya kaam hai, kis ko avoid karna hai, aur kis license ko check karna hai?"

## 1. BUILD VS BORROW

### BORROW

Use mature projects for:
- maps
- GIS geometry
- routing
- model inference
- graph algorithms
- optimization
- speech

### BUILD

Write NEXUS logic for:
- ontology
- evidence fusion
- incident state
- impact semantics
- scenario state
- policy
- approval
- verification
- UI
- audit
- demo orchestration

---

# 2. MUST-HAVE REPOS

| Repo | Purpose | Suggested role |
|---|---|---|
| CesiumJS | 3D world | Core |
| PostGIS | spatial database | Core |
| pgvector | semantic matching | Core |
| H3 | spatial aggregation | Core |
| OSMnx | road network | Core |
| NetworkX | impact graph | Core |
| Grounding DINO | open-set CV | Core |
| SAM 2 | segmentation | Core |
| LangGraph | agent workflow | Core |
| OpenAI SDK/API | multimodal/voice | Core |
| FastAPI | backend | Core |

---

# 3. SECONDARY REPOS

| Repo | Purpose | When |
|---|---|---|
| MapLibre GL JS | 2D map | 2D mode |
| OSRM | routing | network |
| Valhalla | routing | alternative |
| GraphHopper | routing | alternative |
| OR-Tools | optimization | planning |
| GeoPandas | geo preprocessing | dataset |
| Shapely | geometry | backend |
| RT-DETR | fast detection | realtime |
| Whisper | speech | voice |
| whisper.cpp | offline voice | fallback |
| Piper | offline TTS | fallback |
| OpenTelemetry | tracing | quality |
| SUMO | traffic | advanced |

---

# 4. CESIUM RECIPE

Use:
- `Viewer`
- `Entity`
- `CustomDataSource`
- `GeoJsonDataSource`
- `3D Tiles`
- `Clock`
- `SampledPositionProperty`

NEXUS implementation:

```text
Cesium Viewer
  ├── Base imagery
  ├── Terrain
  ├── Buildings
  ├── Entities
  ├── Incident DataSource
  ├── Risk DataSource
  ├── Simulation DataSource
  └── Asset DataSource
```

---

# 5. POSTGIS RECIPE

Use PostGIS for:
- `ST_DWithin`
- `ST_Intersects`
- `ST_Buffer`
- `ST_Contains`
- `ST_Distance`
- geometry indexes

Examples:

### Find nearby incidents

```sql
SELECT *
FROM incidents
WHERE ST_DWithin(
  geometry,
  ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography,
  :radius_m
);
```

### Find affected entities

Use spatial intersection against the incident polygon/route.

---

# 6. H3 RECIPE

Use H3 index:

```text
incident points
  ↓
H3 cell
  ↓
count/severity
  ↓
hex heatmap
```

Store:
- resolution
- cell id
- metric
- timestamp

---

# 7. OSMNX RECIPE

Use OSMnx once during seed preparation to build:
- roads
- intersections
- street graph
- POIs

Save the result to your own dataset.

Do not download OSM from live internet every time the demo opens.

---

# 8. OSRM / VALHALLA / GRAPHHOPPER

Pick one.

### OSRM
Best for:
- fast demo
- straightforward API

### Valhalla
Best for:
- richer routing
- map matching

### GraphHopper
Best for:
- Java-friendly teams
- alternative route analysis

Do not integrate all three.

---

# 9. NETWORKX RECIPE

Use NetworkX for the semantic impact graph:

```text
bridge
  ↓ BLOCKS
road
  ↓ AFFECTS
route
  ↓ CONNECTS
hospital
```

NetworkX should not be treated as the world database.

Database:
PostGIS/Postgres

Graph algorithm:
NetworkX

---

# 10. OR-TOOLS RECIPE

Use OR-Tools when the question becomes:

> "Which combination of actions satisfies constraints best?"

Example:

Inputs:
- 4 ambulances
- 3 hospitals
- 5 incidents
- road availability

Objective:
Minimize response time.

Constraints:
- one ambulance cannot handle two simultaneous events
- hospital capacity
- route availability

---

# 11. GROUNDING DINO RECIPE

Use prompts such as:

```text
flooded road.
standing water.
fallen tree.
damaged utility pole.
fire.
smoke.
crowd.
blocked road.
```

Use detections as candidates.

Do not treat raw model scores as incident severity.

---

# 12. SAM 2 RECIPE

Use when you need:
> "Which exact pixels belong to the affected object/area?"

Example:
- water region
- damaged road
- smoke
- fire region

Then calculate approximate pixel area or region mask.

Do not convert pixel area into real-world square meters without a valid geometric reference.

---

# 13. RT-DETR RECIPE

Use for:
- vehicle count
- people
- buses
- trucks
- emergency vehicles

Good for event streams.

---

# 14. WHISPER RECIPE

Citizen voice:

```text
audio
↓
Whisper
↓
transcript
↓
multimodal text reasoning
↓
structured event
```

---

# 15. WHISPER.CPP RECIPE

Use in Demo Mode if:
- internet fails
- API fails
- you need a local transcript

---

# 16. PIPER RECIPE

Use only if local TTS is needed.

For hackathon, cloud/realtime TTS can be simpler.

---

# 17. LANGGRAPH RECIPE

Do NOT build free-form autonomous loops.

Use an explicit graph.

```text
START
 ↓
OBSERVE
 ↓
FUSE
 ↓
IMPACT
 ↓
SIMULATE
 ↓
PLAN
 ↓
POLICY
 ↓
APPROVE
 ↓
ACT
 ↓
VERIFY
 ↓
END
```

This is easier to test.

---

# 18. SUMO RECIPE

If used:

```text
NEXUS Scenario
 ↓
traffic scenario generator
 ↓
SUMO
 ↓
traffic results
 ↓
impact engine
 ↓
Cesium visualization
```

This is advanced.

For the first competition prototype, a deterministic route/capacity model is faster.

---

# 19. OPEN DATA

Use:
- OpenStreetMap for base geography
- synthetic incident data
- synthetic organization data
- your own captured demo media

For OSM-derived datasets, include required attribution and comply with ODbL.

---

# 20. LICENSE LEDGER TEMPLATE

```text
| Dependency | Version/Commit | License | Used for | Attribution | Notes |
|---|---|---|---|---|---|
| CesiumJS | pinned | Apache-2.0 | 3D | required | review bundled assets |
| MapLibre | pinned | BSD-3-Clause | 2D | retain notice | review dependencies |
| H3 | pinned | Apache-2.0 | indexing | retain notice | upstream only |
| PostGIS | pinned | GPL-2+ | GIS DB | license file | deployment review |
| SAM 2 | pinned | Apache-2.0 | segmentation | retain notice | inspect fonts/assets |
| ... | ... | ... | ... | ... | ... |
```

---

# 21. REPO SECURITY

Before adding any repo:

- check latest license
- check release/commit
- inspect dependency tree
- check model weights
- check sample datasets
- check included fonts/images
- scan for known vulnerabilities
- pin version/commit

Do not build against random `main` branches days before the competition.

---

# 22. REPO IMPORT STRATEGY

### Best

Package dependency.

### Second

Run repo as service.

### Third

Fork and modify.

### Worst

Copy huge portions into your app.

The more code copied, the harder license tracking becomes.

---

# 23. "CAN WE USE THIS IN THE HACKATHON?"

Generally:

### Yes, subject to exact license compliance

- CesiumJS
- MapLibre
- H3
- OSMnx
- NetworkX
- OR-Tools
- Grounding DINO
- SAM 2
- RT-DETR
- Whisper
- whisper.cpp
- LangGraph
- OpenTelemetry

### Requires special review

- PostGIS GPL obligations
- OSM ODbL data
- Ultralytics AGPL/Enterprise
- SUMO EPL/GPL option
- third-party imagery
- model-specific datasets
- proprietary map tiles/APIs

The hackathon text allowing open-source resources does not override the third-party license itself.

---

# 24. WHAT NOT TO DO

Do not:

- download a full random GitHub project and rename it
- hide third-party code
- remove license files
- use unlicensed 3D assets
- scrape proprietary map imagery
- claim open-source model outputs are your trained model
- claim a simulated result is a real forecast
- use a repo just because it has a large star count

---

# 25. RECOMMENDED FINAL COMBINATION

For the hackathon, lock this:

```text
3D:
CesiumJS

2D:
MapLibre

Spatial:
PostGIS + H3

Data prep:
OSMnx + GeoPandas + Shapely

Routing:
OSRM

Graph:
NetworkX

Optimization:
OR-Tools

Vision:
Grounding DINO + SAM 2 + RT-DETR

Voice:
Realtime Voice API + Whisper fallback

Agents:
LangGraph

Vector:
pgvector

Backend:
FastAPI

Frontend:
Next.js/React

Cache:
Redis

Storage:
MinIO

Observability:
OpenTelemetry

Containers:
Docker Compose
```

This is intentionally smaller than an over-engineered enterprise architecture.

