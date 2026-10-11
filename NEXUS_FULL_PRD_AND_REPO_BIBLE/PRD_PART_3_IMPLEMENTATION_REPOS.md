
# NEXUS — FULL PRODUCT REQUIREMENTS DOCUMENT
## PART 3 — REPOSITORY STRATEGY, EXACT IMPLEMENTATION PLAN, DEMO, TESTING, LICENSING & DELIVERY

---

# 0. THE MOST IMPORTANT RULE

Do NOT build everything from scratch.

For this hackathon:

> **Buy/borrow the commodity layer from open source. Spend engineering time on the intelligence layer.**

Do not waste 3 days writing:
- a map renderer
- a routing engine
- an object detector
- speech recognition
- GIS geometry operations
- generic graph algorithms

Use mature projects.

Build yourselves:
- world ontology
- evidence fusion logic
- impact graph semantics
- simulation adapters
- response planner
- policy layer
- verification loop
- product UX
- demo narrative

---

# 1. REPOSITORY / LIBRARY CATALOG

The detailed repository matrix is maintained separately in `REPO_CATALOG.md`.

Below is the recommended priority.

## Tier A — Use for core system

1. CesiumJS
2. PostGIS
3. pgvector
4. H3
5. OSMnx
6. NetworkX
7. OR-Tools
8. Grounding DINO
9. SAM 2
10. RT-DETR / PaddleDetection
11. LangGraph
12. OpenAI API / Realtime
13. Whisper / whisper.cpp
14. MapLibre GL JS

## Tier B — Use where the demo needs it

15. OSRM
16. Valhalla
17. GraphHopper
18. SUMO
19. GeoPandas
20. Shapely
21. GDAL
22. PROJ
23. OpenTelemetry
24. MinIO
25. OpenStreetMap tile server

## Tier C — Advanced / optional

26. OpenDroneMap / WebODM
27. MMDetection
28. additional tracking frameworks
29. local LLM runtimes
30. advanced graph database
31. advanced streaming platform

---

# 2. REPOSITORY USAGE RULE

For each repo classify:

### USE AS DEPENDENCY
Install package / import API.

### RUN AS SERVICE
Run separately, call via API.

### COPY SMALL PATTERN
Only small patterns, while respecting copyright/license.

### FORK / MODIFY
Only if truly necessary.

### STUDY ONLY
Look at architecture; do not copy code.

The team should prefer:

**dependency/service > fork > copy**

---

# 3. 3D MAP

## CesiumJS

Use for:

- globe
- terrain
- 3D buildings
- entity layers
- camera
- 3D Tiles
- routes
- time-aware rendering

This is the most important visual dependency.

Do not write your own 3D map renderer.

CesiumJS's current repository is Apache-2.0. citeturn971026search4

---

# 4. 2D MAP

## MapLibre GL JS

Use for:
- compact 2D map
- operations overview
- dense vector layers
- fallback mode

Current repository is under the 3-Clause BSD license. citeturn517041search2turn517041search0

---

# 5. GEO INDEXING

## H3

Use H3 for:

- heatmap bins
- incident density
- risk aggregation
- regional rollups

H3 is Apache-2.0. citeturn971026search6

---

# 6. STREET NETWORK

## OSMnx

Use to:
- download/model OSM road networks
- extract street graphs
- compute network structure
- build seed data

OSMnx is MIT licensed, and its README notes that OpenStreetMap data itself carries ODbL attribution obligations. citeturn517041search3

---

# 7. ROUTING

Pick ONE as the primary engine.

## Option A — OSRM

Strengths:
- fast
- C++
- mature
- easy HTTP service

Current repository is BSD-2-Clause. citeturn971026search7

## Option B — Valhalla

Strengths:
- flexible routing
- map matching
- richer routing features

Current Valhalla repository states MIT licensing; its test OSM data has separate ODbL considerations. citeturn294394search10

## Option C — GraphHopper

Strengths:
- routing
- isochrones
- alternative routes
- map matching
- Java server/library

Current repository is Apache-2.0. citeturn389795view3

### Recommendation

Use **OSRM or Valhalla** for the hackathon. Do not run three.

---

# 8. GRAPH ANALYSIS

## NetworkX

Use for:
- impact graph
- dependency graph
- shortest path analysis
- connected components
- centrality
- propagation

NetworkX is BSD-3-Clause. citeturn517041search1turn517041search6

---

# 9. OPTIMIZATION

## OR-Tools

Use for:
- resource allocation
- team assignment
- vehicle assignment
- routing optimization
- constraint optimization

Current OR-Tools repository states Apache-2.0 licensing. citeturn517041search9

---

# 10. GEOMETRY

## Shapely

Use for:
- geometry operations
- buffers
- intersections
- points/lines/polygons

Current Shapely is BSD-3-Clause; it uses GEOS under LGPL-2.1. citeturn971026search0

---

# 11. GEO DATA WRANGLING

## GeoPandas

Use for:
- GeoJSON
- vector analysis
- dataset preparation
- seed city generation
- preprocessing

Current GeoPandas is BSD-3-Clause. citeturn971026search5turn971026search8

---

# 12. GIS FORMAT CONVERSION

## GDAL

Use for:
- GeoTIFF
- raster/vector conversion
- import/export
- terrain preprocessing

Current GDAL repository describes itself as MIT-licensed. citeturn918605view7

---

# 13. COORDINATE TRANSFORMATION

## PROJ

Use for:
- coordinate reference system conversion
- geodesy
- projection

Do not write coordinate conversion logic manually.

---

# 14. VISION — OPEN-WORLD DETECTION

## Grounding DINO

This is extremely valuable for NEXUS.

Reason:

You can pass an image plus text such as:

```text
"flooded road. fallen tree. fire. smoke. damaged pole. crowd."
```

and use open-set detection to find relevant objects.

The current repository is Apache-2.0 and documents image+text prompting and open-set object detection. citeturn918605view0

### NEXUS use

Citizen photo:

> Detect: road obstruction, standing water, fire, smoke, damaged infrastructure.

This makes the system feel much more general than a fixed class detector.

---

# 15. VISION — SEGMENTATION

## SAM 2

Use for:
- precise region segmentation
- water region
- fire region
- damaged area
- object mask
- video segmentation

SAM 2's repository states that its code, checkpoints and training/demo code are Apache-2.0, while some demo fonts have separate licensing. citeturn517041search11turn517041search4

### NEXUS demo effect

Photo:

road + water

↓ 

segment water region

↓

calculate approximate affected area

↓

project region onto map/incident object

This produces a strong visual.

---

# 16. VISION — FAST DETECTION

## RT-DETR

Good for:
- people
- vehicles
- objects
- real-time-ish streams

The current official repository is Apache-2.0. citeturn389795view0

Use it when you need speed.

---

# 17. VISION — ALTERNATIVE FRAMEWORK

## MMDetection

Use if the team already knows OpenMMLab.

Current repo is Apache-2.0. citeturn294394search4

Do not use both MMDetection and PaddleDetection and RT-DETR unless there is a clear reason.

Choose one detection stack.

---

# 18. YOLO NOTE

Ultralytics is technically attractive.

However, current Ultralytics documentation says its YOLO offering uses AGPL-3.0 or a separate Enterprise License. citeturn294394search11

### Recommendation

Because this is a competition prototype and you want fewer licensing surprises:

Prefer:
- RT-DETR
- PaddleDetection
- Grounding DINO
- SAM 2

unless the team already has a strong reason to use Ultralytics.

---

# 19. SPEECH-TO-TEXT

## OpenAI Whisper

Use for:
- citizen voice reports
- voice commands
- multilingual reports
- speech-to-text

Current Whisper repository states that both code and model weights are MIT licensed. citeturn389795view1

---

# 20. LOCAL SPEECH

## whisper.cpp

Use when:
- internet unavailable
- CPU inference needed
- offline demo required
- edge deployment is desired

Current repository is MIT-licensed and supports CPU/GPU/various platforms. citeturn389795view2

---

# 21. LOCAL TTS

## Piper

Use if you need local TTS.

Current Piper repository states MIT licensing with notice preservation. citeturn294394search0

Use it for:
- offline voice
- responder alerts
- demo narration

---

# 22. AGENT WORKFLOW

## LangGraph

Use for:

- explicit state machine
- multi-step workflows
- human-in-the-loop
- retries
- state checkpointing

Current Python LangGraph package metadata specifies MIT licensing. citeturn294394search7

Do not give the agent arbitrary autonomy.

---

# 23. GENERAL AI

Use an LLM/multimodal model for:

- incident interpretation
- evidence summaries
- "why"
- scenario explanation
- response plan drafting
- tool selection
- conversational interaction

Use structured output.

Do not let the model write arbitrary SQL.

---

# 24. VOICE

Use a realtime speech/voice platform for:

- low-latency speech
- voice command
- context

For offline:
- whisper.cpp
- Piper

---

# 25. ROUTING DEMO

Choose OSRM.

Architecture:

```text
NEXUS
  ↓
route-service
  ↓
OSRM
  ↓
route geometry + time
```

When a road closes:

```text
remove edge / increase edge cost
→ request route again
→ update 3D route
```

---

# 26. TRAFFIC SIMULATION

## SUMO

SUMO is useful for:
- realistic vehicle simulation
- route shifts
- network load
- congestion

Current SUMO licensing is EPL-2.0 with GPL v2-or-later as a secondary option when using only open-source libraries. citeturn517041search10

### Hackathon decision

Use SUMO only if:
- you already know it, or
- traffic simulation is the centerpiece.

Otherwise build a graph-based approximation.

---

# 27. MAP DATA

Primary:
OpenStreetMap-derived seed data.

Use it for:
- roads
- buildings
- POIs
- road graph

Store proper attribution.

Do not assume any third-party tile server is free for unrestricted production use.

---

# 28. LOCAL TILE SERVER

The OpenStreetMap tile server Docker repo can be useful for local/self-hosted tile serving, but the data itself remains subject to OSM/ODbL terms. The repo itself is Apache-2.0. citeturn294394search6turn294394search9

---

# 29. TELEMETRY / LOGGING

## OpenTelemetry

Use to trace:

```text
report
→ AI
→ fusion
→ impact
→ simulation
→ plan
→ approval
→ action
→ verification
```

Current OpenTelemetry Python repo is Apache-2.0. citeturn294394search3

---

# 30. OPTIONAL AERIAL / DRONE

## OpenDroneMap / WebODM

Possible future use:
- drone imagery
- orthophotos
- 3D terrain
- damage survey

Do not add unless a drone/aerial scenario is part of the demo.

Because imagery/model/data licensing can be more complex, review all separate data and asset licenses before redistribution.

---

# 31. REPOSITORY COMBINATION FOR THE FINAL BUILD

The strongest practical combination is:

```text
CesiumJS
+ PostGIS
+ pgvector
+ H3
+ OSMnx
+ OSRM/Valhalla
+ NetworkX
+ OR-Tools
+ Grounding DINO
+ SAM 2
+ RT-DETR
+ OpenAI multimodal/voice
+ LangGraph
+ Whisper/whisper.cpp
+ Redis
+ MinIO
+ OpenTelemetry
```

---

# 32. WHAT WE SHOULD BUILD OURSELVES

These are the parts that make NEXUS OUR PRODUCT:

## 32.1 NEXUS Ontology

Define:
- entity types
- relationship types
- state transitions

## 32.2 Incident Fusion Engine

This is core IP.

## 32.3 Spatial Impact Engine

Map incident → network consequences.

## 32.4 Scenario Engine

Base state + changes → alternate world.

## 32.5 Policy Layer

AI action → authorization.

## 32.6 Verification Layer

Action → new evidence → outcome.

## 32.7 Command UX

The visual experience.

## 32.8 Evidence Graph

Source-to-conclusion relationships.

---

# 33. FULL TEAM WORK SPLIT

## Person 1 — Frontend / 3D

Own:
- Cesium
- scene
- layers
- camera
- panels
- animation

## Person 2 — Backend / GIS

Own:
- FastAPI
- PostgreSQL/PostGIS
- entities
- incidents
- spatial queries
- WebSocket

## Person 3 — AI / CV

Own:
- multimodal
- Grounding DINO
- SAM 2
- fusion assistance
- voice

## Person 4 — Simulation / Agents

Own:
- NetworkX
- routing
- OR-Tools
- scenario engine
- response planner
- policy/verification

---

# 34. DAY-BY-DAY EXECUTION

## Day 1
Architecture + repo + base map.

## Day 2
Seed world + entities + database.

## Day 3
Citizen reporting + evidence storage.

## Day 4
Image analysis + structured incident creation.

## Day 5
Evidence fusion.

## Day 6
Impact graph + heatmaps.

## Day 7
Routing + road closure scenario.

## Day 8
Scenario engine + comparisons.

## Day 9
Planner + voice.

## Day 10
Approval + action + verification.

## Day 11
Visual polish + timeline.

## Day 12
Demo hardening + fallback.

---

# 35. 30-DAY PREPARATION

## Days 1–5
- finalize city
- finalize visual identity
- build data model
- collect/prepare seed geography

## Days 6–10
- evidence pipeline
- multimodal analysis
- fusion

## Days 11–15
- impact graph
- routing
- scenario engine

## Days 16–20
- planner
- voice
- approval
- verification

## Days 21–25
- visual polish
- 3D assets
- performance
- failure recovery

## Days 26–30
- scripted demo
- backups
- pitch
- judge Q&A

---

# 36. DEMO SCRIPT — EXACT BEHAVIOUR

### OPEN

3D city.

Small live status.

---

### TRIGGER 1

Citizen uploads photo.

UI says:

> Evidence received.

AI:

> Possible road flooding detected.

---

### TRIGGER 2

Another video arrives.

NEXUS:

> Similar event nearby.

---

### TRIGGER 3

Voice report:

> "Bridge ke paas road pura paani se bhar gaya hai."

NEXUS:

> Matching active incident found.

---

### FUSION

Multiple cards collapse into:

**INCIDENT #1047**

Map:
red zone.

Evidence:
32 items.

---

### IMPACT

NEXUS shows:

```text
Road R17
 ↓
Ambulance route
 ↓
Hospital A
```

---

### WHY

AI:

> Hospital A access risk is increasing because its fastest route crosses R17.

---

### WHAT IF

User:

> "Road R17 45 minutes aur band rahe toh?"

Map enters simulation.

Future branches.

---

### PLANS

A:
cheap

B:
fast

C:
lowest disruption

---

### APPROVE

User selects C.

Approval panel.

---

### ACTION

Simulated state changes.

Route changes.

---

### VERIFY

New evidence arrives.

NEXUS:

> Emergency access improved.

---

### TIME MACHINE

Rewind to first report.

---

### END

The final product statement:

> **NEXUS turns fragmented real-world signals into a living operational model — then lets teams understand, simulate and coordinate responses against that model.**

---

# 37. JUDGE QUESTIONS WE MUST EXPECT

## "Why isn't this just Google Maps?"

Answer:

Google Maps is a map/navigation product.

NEXUS is a configurable operational world model combining organization-specific entities, evidence, incidents, relationships, simulations, policies and actions.

---

## "Why isn't this just a dashboard?"

Because dashboards show data.

NEXUS creates a connected state model and uses it for simulation, planning, action and verification.

---

## "Why AI?"

AI is needed for multimodal interpretation, evidence fusion assistance, natural language control, hypothesis generation and response planning.

Deterministic engines own calculations and authorization.

---

## "What is novel?"

Not individual components.

The novel product mechanism is:

> **multimodal evidence → spatial world state → causal/impact relationships → counterfactual futures → policy-bounded action → outcome verification**

---

## "Can government actually use this?"

The hackathon is a prototype. Production deployment would require:
- data agreements
- security
- privacy
- operational validation
- integrations
- governance

We deliberately designed the platform around these boundaries.

---

## "Can it work for companies?"

Yes.

Same ontology pattern:
HQ → region → branch → assets → events → dependencies → scenarios → actions.

---

# 38. FAILURE / RISKS

## Risk 1 — Too much scope

Mitigation:
one vertical, one city, one killer scenario.

## Risk 2 — AI hallucination

Mitigation:
evidence-backed structured outputs + deterministic tools.

## Risk 3 — Simulation feels fake

Mitigation:
clearly describe model assumptions and show scenario metrics.

## Risk 4 — Map becomes decoration

Mitigation:
every key action changes world state.

## Risk 5 — Too many repositories

Mitigation:
choose one stack per capability.

## Risk 6 — Licensing mistakes

Mitigation:
maintain third-party ledger and exact version/commit.

---

# 39. DEFINITION OF DONE

A judge can:

1. see the world
2. submit evidence
3. see evidence interpreted
4. watch evidence merge
5. see incident impact
6. ask why
7. create scenario
8. see future
9. compare plans
10. approve action
11. observe state change
12. observe verification
13. rewind timeline

If all 13 happen reliably, the product is demo-complete.

---

# 40. FINAL BUILD PHILOSOPHY

### DON'T BUILD A MAP.

Build a **world model**.

### DON'T BUILD A CHATBOT.

Build a **command interface to operational state**.

### DON'T BUILD A PREDICTION DEMO.

Build a **counterfactual decision system**.

### DON'T BUILD AN AUTOMATION.

Build an **observe → decide → act → verify loop**.

### DON'T SHOW 100 FEATURES.

Show one incident moving through the complete system.

---

# 41. FINAL TAGLINE

**NEXUS**

### SEE WHAT IS HAPPENING.
### UNDERSTAND WHY.
### SIMULATE WHAT COMES NEXT.
### ACT WITH AUTHORITY.
### VERIFY THE RESULT.

---

# 42. LAUNCH CHECKLIST

Before demo:

- [ ] Demo world is seeded.
- [ ] 3D loads fast.
- [ ] Evidence upload works.
- [ ] AI returns structured result.
- [ ] Fusion works.
- [ ] Impact graph works.
- [ ] Simulation is deterministic.
- [ ] Voice command works or has a fallback.
- [ ] Approval cannot be bypassed.
- [ ] Action changes state.
- [ ] Verification produces result.
- [ ] Timeline replay works.
- [ ] At least one external API can fail without killing the demo.
- [ ] License ledger is present.
- [ ] Third-party notices are present.
- [ ] Backup demo mode works.
