
# NEXUS — FULL PRODUCT REQUIREMENTS DOCUMENT
## PART 2 — SYSTEM ARCHITECTURE, DATA MODEL, AI AGENTS, APIs & INTEGRATION

---

# 0. ARCHITECTURAL PRINCIPLE

NEXUS must be built as:

> **A deterministic operational system wrapped with AI.**

Do not build:

> AI chatbot → generates everything.

Instead:

```text
REAL DATA
   ↓
DETERMINISTIC STATE
   ↓
AI PERCEPTION / REASONING
   ↓
DETERMINISTIC TOOLS
   ↓
SIMULATION / POLICY
   ↓
AUTHORIZED ACTION
```

AI should be used where semantic interpretation and planning matter.

Deterministic code should own facts, permissions, calculations, coordinates, state transitions and audit.

---

# 1. REFERENCE ARCHITECTURE

```text
                          ┌──────────────────┐
                          │   WEB CLIENT     │
                          │ React / Next.js  │
                          │ CesiumJS         │
                          └────────┬─────────┘
                                   │
                          REST / WS / Voice
                                   │
                          ┌────────▼─────────┐
                          │    API GATEWAY   │
                          │      FastAPI     │
                          └────────┬─────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ INGESTION       │      │ WORLD STATE     │      │ AI ORCHESTRATOR │
│ media/API/feed  │      │ entities/events │      │ agents + tools  │
└───────┬─────────┘      └────────┬────────┘      └────────┬────────┘
        │                         │                         │
        ▼                         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ OBJECT STORAGE  │      │ POSTGRES/POSTGIS│      │ MODEL PROVIDERS │
│ S3 / MinIO      │      │ + pgvector      │      │ multimodal/LLM  │
└─────────────────┘      └────────┬────────┘      └─────────────────┘
                                  │
                        ┌─────────▼─────────┐
                        │ RELATIONSHIP /    │
                        │ IMPACT ENGINE     │
                        └─────────┬─────────┘
                                  │
                        ┌─────────▼─────────┐
                        │ SIMULATION ENGINE │
                        │ graph + optimizer │
                        └─────────┬─────────┘
                                  │
                        ┌─────────▼─────────┐
                        │ POLICY + APPROVAL │
                        └─────────┬─────────┘
                                  │
                        ┌─────────▼─────────┐
                        │ ACTION EXECUTOR   │
                        └─────────┬─────────┘
                                  │
                        ┌─────────▼─────────┐
                        │ VERIFICATION      │
                        └───────────────────┘
```

---

# 2. REPOSITORY STRUCTURE

Recommended monorepo:

```text
nexus/
├── apps/
│   ├── web/
│   └── responder/
│
├── services/
│   ├── api/
│   ├── worker/
│   ├── ai/
│   ├── simulation/
│   └── ingest/
│
├── packages/
│   ├── shared-types/
│   ├── ui/
│   ├── geospatial/
│   └── scenario-schema/
│
├── infra/
│   ├── docker/
│   ├── postgres/
│   ├── redis/
│   └── object-storage/
│
├── data/
│   ├── seed/
│   ├── demo-media/
│   ├── scenarios/
│   └── fixtures/
│
├── docs/
│   ├── PRD/
│   ├── architecture/
│   └── licenses/
│
├── THIRD_PARTY_NOTICES.md
└── README.md
```

---

# 3. FRONTEND ARCHITECTURE

## Framework

Next.js + React + TypeScript.

## Main modules

```text
world/
incident/
evidence/
scenario/
planner/
approval/
timeline/
admin/
voice/
```

## Rendering

CesiumJS is the main spatial engine.

MapLibre is optional for a lightweight 2D mode.

---

# 4. FRONTEND STATE

### Server state
TanStack Query.

### Local interaction state
Zustand.

### Realtime
WebSocket events.

### Route state
Next.js routing/query params.

---

# 5. 3D WORLD COMPONENTS

Create components:

```text
<NexusGlobe />
<EntityLayer />
<IncidentLayer />
<RouteLayer />
<HeatLayer />
<RiskLayer />
<PropagationLayer />
<SimulationLayer />
<AssetLayer />
<BuildingLayer />
<WorldCameraController />
```

Every layer should have:

- `visible`
- `opacity`
- `mode`
- `time`
- `source`
- `simulation`
- `confidence`

---

# 6. WORLD STATE ENGINE

The backend should own a normalized world state.

Concept:

```text
WorldSnapshot(t)
```

Contains:

- entities
- assets
- active incidents
- network capacities
- operational statuses
- relationships

A scenario does not mutate the live snapshot.

It creates:

```text
ScenarioState = Apply(WorldSnapshot(t), Modifications)
```

---

# 7. DATABASE MODEL

## organizations

```sql
id
name
type
parent_id
created_at
```

## roles

```sql
id
name
permissions_json
```

## users

```sql
id
organization_id
role_id
display_name
created_at
```

## worlds

```sql
id
name
type
geometry
config_json
```

## entities

```sql
id
world_id
entity_type
name
geometry
parent_entity_id
status
attributes_json
created_at
updated_at
```

## assets

```sql
id
entity_id
asset_type
geometry
state_json
availability
```

## incidents

```sql
id
world_id
incident_type
status
severity
confidence
geometry
started_at
detected_at
resolved_at
```

## evidence

```sql
id
incident_id
evidence_type
object_uri
geometry
captured_at
received_at
analysis_json
confidence
privacy_json
```

## entity_relationships

```sql
id
source_entity_id
relation_type
target_entity_id
confidence
evidence_json
valid_from
valid_to
```

## scenarios

```sql
id
world_id
created_by
base_timestamp
name
status
modifications_json
assumptions_json
result_json
```

## actions

```sql
id
scenario_id
action_type
target_json
reason_json
status
created_by
created_at
```

## approvals

```sql
id
action_id
approver_id
decision
comment
created_at
```

## verification_events

```sql
id
action_id
metrics_before_json
metrics_after_json
evidence_ids_json
result
confidence
created_at
```

## audit_events

```sql
id
actor_type
actor_id
event_type
entity_type
entity_id
metadata_json
created_at
```

---

# 8. SPATIAL DATABASE

PostGIS responsibilities:

- point lookup
- polygon intersection
- nearest entities
- incident clustering
- bounding box search
- radius search
- geofencing
- spatial joins

Never pull the entire city dataset into the browser.

Use spatial filters server-side.

---

# 9. VECTOR SEARCH

pgvector stores embeddings for:

- incident descriptions
- evidence captions
- extracted entities
- historical incident summaries
- documents

Similarity query should be combined with:

- spatial distance
- time difference
- type compatibility

Example:

```text
semantic_score
+
spatial_score
+
temporal_score
+
source_score
```

This gives the fusion engine a structured basis for grouping.

---

# 10. EVENT MODEL

Every event should have:

```json
{
  "event_id": "evt_123",
  "type": "EVIDENCE_ADDED",
  "timestamp": "...",
  "actor": "citizen",
  "entity_ids": ["road_17"],
  "incident_id": "inc_1047",
  "metadata": {}
}
```

---

# 11. REALTIME EVENT TYPES

```text
EVIDENCE_RECEIVED
EVIDENCE_ANALYZED
INCIDENT_CREATED
INCIDENT_FUSED
INCIDENT_UPDATED
IMPACT_UPDATED
SCENARIO_CREATED
SCENARIO_RUNNING
SCENARIO_COMPLETED
PLAN_GENERATED
ACTION_REQUESTED
ACTION_APPROVED
ACTION_EXECUTED
VERIFICATION_COMPLETED
```

---

# 12. WEBSOCKET TOPICS

Example:

```text
/world/{world_id}
/incidents/{incident_id}
/scenarios/{scenario_id}
/organization/{org_id}
```

Users subscribe based on permissions.

---

# 13. AI AGENT GRAPH

Use a controlled graph:

```text
                ┌─────────────┐
                │   OBSERVER  │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │ NORMALIZER  │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │    FUSER    │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │   IMPACT    │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │  SIMULATOR  │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │   PLANNER   │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │   POLICY    │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │ AUTHORIZED  │
                │   ACTION    │
                └──────┬──────┘
                       ↓
                ┌─────────────┐
                │  VERIFY     │
                └─────────────┘
```

---

# 14. OBSERVER AGENT

Inputs:
- new evidence
- feeds

Outputs:
- candidate observations

Must include:
- event type
- entities
- location
- confidence
- evidence reference

Never write directly to operational action tables.

---

# 15. NORMALIZER

Converts model outputs into a stable internal ontology.

For example:

```text
"water on street"
"flooded road"
"road full of water"
```

→

```text
ROAD_FLOODING
```

---

# 16. FUSER

The fuser should be primarily deterministic with AI-assisted candidate generation.

Pipeline:

```text
new evidence
 ↓
spatial candidate query
 ↓
temporal candidate query
 ↓
semantic candidate query
 ↓
visual similarity
 ↓
score
 ↓
merge / candidate
```

AI may propose:
> "likely same incident"

The fusion service decides.

---

# 17. IMPACT ENGINE

Input:

- incident
- relationships
- current state

Output:

```json
{
  "affected_entities": [],
  "affected_routes": [],
  "risk_changes": [],
  "dependency_chain": []
}
```

This engine is deterministic where possible.

---

# 18. IMPACT PROPAGATION

Represent a graph:

```text
event
  |
  v
entity
  |
  v
network edge
  |
  v
downstream entity
```

Each relationship may have a propagation rule.

Example:

```text
BLOCKS(road)
→ capacity = 0

AFFECTS(route, road)
→ route_invalid = true

CONNECTS(route, hospital)
→ hospital_access_risk += X
```

---

# 19. SIMULATOR

The simulator should be a plug-in model.

```text
Scenario
  ↓
Model Registry
  ├── RouteModel
  ├── CapacityModel
  ├── ResourceModel
  ├── TrafficModel
  └── RiskModel
```

This allows expansion later.

---

# 20. RESPONSE PLANNER

Planner takes:

- incident
- current state
- scenario outputs
- available resources
- policy limits

and produces 2–4 plans.

Example:

```json
{
  "plan_id": "plan_b",
  "objective": "preserve emergency access",
  "actions": [
    ...
  ],
  "estimated_impact": {
    "response_time": -0.19,
    "secondary_congestion": 0.04
  },
  "requires_approval": true
}
```

---

# 21. OPTIMIZATION

For resource allocation use OR-Tools where helpful.

Example:

Minimize:

```text
response_time
+ congestion_penalty
+ resource_cost
```

Subject to:

```text
vehicle availability
team availability
route constraints
time windows
authorization
```

---

# 22. VOICE ARCHITECTURE

```text
Microphone
 ↓
Realtime Voice API
 ↓
Conversation State
 ↓
Intent Router
 ↓
Tool Selection
 ↓
Policy
 ↓
Read or Write
```

Read-only voice commands:

- query map
- filter
- explain
- summarize
- inspect evidence

Write/plan commands:

- build scenario
- create response plan

Mutating commands:

- require explicit authorization

---

# 23. TOOL REGISTRY

Example tool set:

```text
search_entities
get_entity
find_nearby_incidents
get_incident
get_incident_evidence
get_impact_graph
get_timeline
create_scenario
simulate_scenario
compare_scenarios
generate_response_plans
check_authority
prepare_action
approve_action
execute_action
verify_action
```

The model only interacts through these defined tools.

---

# 24. POLICY ENGINE

Policy function:

```text
authorize(user, action, world_state)
```

Example:

```text
viewer:
  can_view = yes
  can_approve = no

operator:
  can_plan = yes
  can_execute_low_risk = maybe

commander:
  can_approve = yes
  high-impact = dual approval
```

For hackathon, implement a rules table.

Future: OPA/Cedar.

---

# 25. ACTION EXECUTOR

Action adapters:

```text
SimulatedRouteAdapter
NotificationAdapter
WorkOrderAdapter
AssetAssignmentAdapter
FacilityStateAdapter
```

This lets the demo behave as though it is integrated without pretending to have real-world control.

---

# 26. VERIFICATION ENGINE

For each action, define expected effect.

Example:

Action:
`REROUTE_AMBULANCE`

Expected:

- ETA down
- route leaves blocked road

Verification looks for:

- new route
- new telemetry
- updated traffic
- new evidence

Then returns:

```text
IMPROVED
NO_CHANGE
WORSENED
UNKNOWN
```

---

# 27. AUDIT MODEL

Every important operation creates an immutable-style audit event.

Example:

```text
17:32:12 REPORT_RECEIVED
17:32:14 REPORT_ANALYZED
17:32:15 INCIDENT_CREATED
17:32:19 EVIDENCE_FUSED
17:32:31 IMPACT_COMPUTED
17:32:43 PLAN_GENERATED
17:32:49 ACTION_APPROVED
17:32:50 ACTION_EXECUTED
17:33:20 VERIFICATION_COMPLETED
```

---

# 28. API CONTRACTS

## POST /reports

Input:

```json
{
  "type": "image",
  "media_uri": "...",
  "lat": 26.91,
  "lng": 75.79,
  "text": "main road flooded"
}
```

Output:

```json
{
  "evidence_id": "ev_123",
  "status": "processing"
}
```

---

## GET /incidents

Filters:

```text
bbox
severity
type
status
time_range
organization
```

---

## GET /incidents/{id}

Returns:

- summary
- evidence
- confidence
- impact
- timeline
- current status

---

## POST /scenarios

Input:

```json
{
  "name": "Bridge B02 closure",
  "changes": [
    {
      "type": "CLOSE_ENTITY",
      "entity_id": "bridge_b02"
    }
  ],
  "duration_minutes": 45
}
```

---

## POST /scenarios/{id}/simulate

Returns:

- state delta
- metrics
- impacted entities
- routes
- risk

---

## POST /plans/generate

Input:
scenario + objective + available resources

Output:
ranked response candidates

The ranking must be presented as an optimization result under stated criteria, not as an opaque "AI says this is best."

---

## POST /actions/{id}/approve

Requires:
- authorized user
- valid policy
- current state still valid

---

## POST /actions/{id}/execute

Only after approval.

---

## GET /actions/{id}/verification

Returns outcome.

---

# 29. SEARCH ARCHITECTURE

Search must support:

### exact
"hospital-a"

### semantic
"places where emergency access is getting worse"

### spatial
"incidents near hospitals"

### temporal
"incidents from last 30 minutes"

### relationship
"facilities depending on utility node U17"

These can be composed.

---

# 30. DATA SOURCES

## Primary hackathon dataset

Synthetic city data.

Recommended:
- roads
- buildings
- hospitals
- fire stations
- police stations
- bridges
- utility nodes
- ambulances
- teams
- incidents

## Supplemental

OpenStreetMap geography can seed road/building/place structure, but OSM data is under the ODbL and requires attribution/appropriate compliance.

---

# 31. MODEL SELECTION

## General reasoning

Use a multimodal reasoning model through an API for:
- photo understanding
- explanation
- planning
- voice command interpretation

## Segmentation

SAM 2.

## Open-set detection

Grounding DINO.

## Fast detector

RT-DETR or PaddleDetection.

## Speech

Whisper or whisper.cpp.

## TTS

Piper can be used for local speech synthesis.

---

# 32. MODEL FALLBACKS

For each capability:

```text
PRIMARY
 ↓
FAST LOCAL FALLBACK
 ↓
DEMO FIXTURE
```

Example:

Vision:
API → local model → seeded result

Speech:
Realtime → whisper.cpp → seeded transcript

Simulation:
live engine → deterministic scenario snapshot

---

# 33. PRIVACY PIPELINE

```text
RAW EVIDENCE
 ↓
privacy detector
 ↓
optional redaction
 ↓
restricted storage
 ↓
derived incident object
 ↓
authorized access
```

Raw image should not be public just because the incident exists.

---

# 34. SECURITY BOUNDARIES

### Browser cannot:
- change world state directly
- execute actions
- approve actions

### API checks:
- session
- organization
- role
- action
- target

### Worker:
- processes AI
- cannot bypass policy

### Action executor:
- requires action authorization token/state

---

# 35. FAILURE MODES

## AI fails

Fallback to deterministic labels or mock.

## Geocoder fails

Use selected point.

## routing service fails

Use local graph.

## model timeout

Use cached fixture.

## database failure

Not fully recoverable, so use preloaded demo environment.

## external weather API fails

Use seeded weather timeline.

---

# 36. DEMO MODE ARCHITECTURE

Demo Mode should have:

```text
seed_world.json
seed_entities.geojson
seed_relationships.json
seed_incidents.json
seed_evidence/
seed_scenarios/
```

Demo Mode can run without internet after initial deployment.

---

# 37. OBSERVABILITY

Every request gets:

```text
trace_id
```

AI workflow:

```text
trace_id
→ incident_id
→ agent_run_id
→ tool_calls
→ scenario_id
→ action_id
→ verification_id
```

This enables debugging.

---

# 38. DEPLOYMENT

## Minimum Docker Compose

```text
web
api
worker
postgres
redis
minio
```

Optional:
- SUMO
- local CV model container

---

# 39. SCALING LATER

Potential split:

```text
ingestion service
AI inference service
simulation service
world state service
policy service
realtime gateway
```

But not needed for hackathon.

---

# 40. ACCEPTANCE CRITERIA — SYSTEM

NEXUS is technically complete when:

- a photo can create evidence
- evidence can become an incident
- multiple evidence can fuse
- incident affects map
- impact graph is generated
- scenario can be created
- simulation produces state deltas
- response plans appear
- authorization is enforced
- action changes simulated world state
- verification produces an outcome
- timeline can replay all stages
- voice can navigate/read and create scenarios
