
# NEXUS — FULL PRODUCT REQUIREMENTS DOCUMENT
## PART 1 — PRODUCT, DOMAIN, USERS, FEATURES, UX & BEHAVIOUR

**Product:** NEXUS  
**Positioning:** The Living Intelligence Layer for the Physical World  
**Hackathon Track:** Open Innovation  
**Primary Demonstration:** Smart-City Emergency Operations  
**Future Templates:** Enterprise / Logistics / Industrial / Campus / Healthcare facility  
**Document status:** Build-grade product specification  
**Target build:** 12-day hackathon implementation + ~30-day preparation window

---

# 0. EXECUTIVE PRODUCT DEFINITION

NEXUS is a live operational intelligence platform that creates a digital representation of a real-world environment and continuously updates it from fragmented signals.

Those signals can include:

- citizen reports
- employee reports
- images
- videos
- voice
- text
- GPS
- CCTV
- sensors
- weather
- traffic
- organization databases
- facility systems
- maintenance records
- external APIs

NEXUS turns those signals into:

1. a **live world state**
2. a **shared incident model**
3. a **relationship / impact graph**
4. a **future simulation**
5. a set of **response plans**
6. an **authorized action**
7. a **verification loop**

The product is deliberately not defined as a "3D map."

The 3D map is the **interface** to the system's world model.

The actual product is the intelligence pipeline:

```text
REAL WORLD
    ↓
OBSERVE
    ↓
UNDERSTAND
    ↓
FUSE
    ↓
MODEL
    ↓
CONNECT
    ↓
PREDICT / SIMULATE
    ↓
PLAN
    ↓
AUTHORIZE
    ↓
ACT
    ↓
VERIFY
    ↓
UPDATE WORLD
```

---

# 1. PRODUCT VISION

## 1.1 Vision statement

> Give organizations a continuously updated, explainable, spatial understanding of what is happening in their physical world — and let them test and coordinate responses before consequences become larger.

## 1.2 Product promise

A user should be able to open NEXUS and answer, within seconds:

- What is happening?
- Where is it happening?
- How serious is it?
- What evidence supports it?
- What else is affected?
- Why is it happening?
- What happens next?
- What happens if we do nothing?
- What happens if we intervene?
- What response options exist?
- Who is allowed to approve them?
- Did the intervention actually work?

## 1.3 Product anti-promise

NEXUS does not claim:

- omniscience
- perfect prediction
- fully autonomous government control
- guaranteed emergency decisions
- flawless AI-generated causal explanations
- access to private infrastructure it is not connected to
- real-world operational authority by default

NEXUS must visibly distinguish:

**Observed fact**
vs.
**AI interpretation**
vs.
**Prediction**
vs.
**Simulation**
vs.
**Recommended action**

---

# 2. THE PRIMARY HACKATHON STORY

The entire demo should be designed around one connected story rather than dozens of independent features.

### Story:

1. A citizen sees flooding.
2. Citizen uploads a photo.
3. Another citizen uploads a video.
4. Someone submits a voice report.
5. NEXUS recognizes that all three describe the same real-world event.
6. The event becomes a single operational incident.
7. The 3D world updates.
8. Nearby roads turn operationally constrained.
9. An ambulance route becomes affected.
10. A hospital is identified as exposed.
11. NEXUS explains why.
12. The user asks what happens if the road remains blocked for 45 minutes.
13. NEXUS simulates the future.
14. NEXUS produces multiple response plans.
15. An authorized user approves one.
16. The route/action changes.
17. New evidence arrives.
18. NEXUS verifies improvement.
19. User rewinds the incident timeline and inspects the evidence chain.

This story demonstrates the entire architecture without requiring an enormous real deployment.

---

# 3. TARGET PERSONAS

## 3.1 Operations Commander

### Goal
Maintain situational awareness and coordinate action.

### Needs
- live city/organization view
- critical incidents
- cascading impacts
- scenario testing
- response plans
- approval workflows
- timeline replay

### Pain
Information is fragmented across dashboards, calls, messages and teams.

### NEXUS benefit
One operational picture plus explainable response simulation.

---

## 3.2 Regional / District Administrator

### Goal
Understand regional health and emerging incidents.

### Needs
- regional overview
- zone comparison
- facility risk
- unresolved events
- resource allocation
- AI-discovered patterns

---

## 3.3 Facility Manager

### Goal
Protect and operate one facility.

### Needs
- facility state
- incoming incidents
- dependencies
- assets
- staffing/resource state
- local response plans

---

## 3.4 Field Responder

### Goal
Complete assigned work safely and quickly.

### Needs
- exact incident location
- evidence
- route
- hazards
- task status
- status update

---

## 3.5 Citizen / Employee Reporter

### Goal
Report a real-world problem with minimum friction.

### Needs
- photo/video/voice/text
- automatic location
- minimal form filling
- privacy
- report status

---

## 3.6 Executive / HQ

### Goal
See organization-wide health.

### Needs
- macro view
- hotspots
- trend
- dependencies
- high-impact risk
- strategic scenarios

---

# 4. CORE PRODUCT OBJECTS

NEXUS should be an object/relationship system rather than a collection of screens.

## 4.1 World

The operational environment being represented.

Examples:
- Jaipur city
- UEM campus
- enterprise logistics network

Fields:
- `id`
- `name`
- `world_type`
- `bounding_geometry`
- `time_zone`
- `status`
- `configuration`

---

## 4.2 Spatial Entity

Any physical or virtual object represented spatially.

Types:
- road
- bridge
- building
- hospital
- warehouse
- branch
- utility node
- machine
- zone
- region

Fields:
- `id`
- `type`
- `name`
- `geometry`
- `parent_id`
- `status`
- `attributes`
- `visibility_policy`

---

## 4.3 Asset

Operational resource.

Types:
- ambulance
- responder team
- vehicle
- drone
- generator
- machine
- inventory batch

Fields:
- `id`
- `asset_type`
- `state`
- `location`
- `availability`
- `capacity`

---

## 4.4 Organization

Administrative tree.

Examples:

Government:

```text
Central
  → State
      → District
          → Zone
              → Facility
```

Enterprise:

```text
HQ
  → Region
      → State
          → City
              → Branch
                  → Department
```

Fields:
- `id`
- `name`
- `type`
- `parent_org_id`

---

## 4.5 Role

Permissions within an organization.

Examples:
- reporter
- viewer
- operator
- facility_manager
- regional_operator
- commander
- super_admin

Permissions should be action-based:

```text
can_view_incidents
can_view_sensitive_evidence
can_create_scenario
can_generate_plan
can_approve_action
can_execute_action
can_export
```

---

## 4.6 Evidence

Evidence artifact attached to a real-world event.

Types:
- image
- video
- audio
- text
- sensor signal
- official report
- API event

Evidence fields:
- `id`
- `type`
- `source`
- `object_uri`
- `captured_at`
- `received_at`
- `geometry`
- `metadata`
- `extracted_features`
- `privacy_state`
- `confidence`

---

## 4.7 Incident

A real-world event reconstructed from one or more evidence sources.

Fields:

```text
id
type
state
severity
confidence
geometry
started_at
detected_at
last_updated_at
status_reason
evidence_count
affected_entity_count
```

States:

```text
CANDIDATE
CONFIRMED
ACTIVE
ESCALATING
STABILIZING
RESOLVED
REJECTED
MERGED
```

---

## 4.8 Relationship

A typed connection between objects.

Examples:

```text
AFFECTS
DEPENDS_ON
CONNECTS_TO
ROUTES_TO
LOCATED_IN
SUPPLIES
BLOCKS
PROTECTS
OPERATES
ASSIGNED_TO
```

Relationships can have:

- confidence
- evidence
- timestamp
- source

---

## 4.9 Scenario

A hypothetical state change.

Examples:

- close road
- move ambulance
- disable bridge
- increase demand
- reduce capacity
- add responder

Fields:
- base_world_state
- modifications
- assumptions
- simulation_status
- result_metrics

---

## 4.10 Action

A permitted operational change.

Examples:
- publish alert
- reroute asset
- assign team
- create work order
- mark route unavailable

Actions should be auditable.

---

# 5. CORE FUNCTIONAL REQUIREMENTS

## FR-01 — LIVE WORLD

NEXUS shall render a 3D spatial environment containing:

- terrain
- roads
- buildings
- facilities
- operational assets
- incidents
- routes
- heat/risk overlays

---

## FR-02 — EVIDENCE INGESTION

System shall support:

- image
- video
- voice
- text

for demo.

Each input shall become an evidence object.

---

## FR-03 — LOCATION ATTACHMENT

Location source priority:

1. device GPS
2. user-selected map point
3. geocoded named location
4. approximate inferred location

System shall preserve an uncertainty radius when location is not exact.

---

## FR-04 — AI EVIDENCE INTERPRETATION

For images/videos/text/audio, the AI pipeline shall attempt to extract:

- event type
- relevant entities
- severity indicators
- temporal clues
- location clues
- visual signals
- natural language summary

Output must be structured JSON, not free text only.

---

## FR-05 — INCIDENT FUSION

System shall identify likely duplicate/related evidence and merge them into unified incidents.

Fusion factors:

- spatial similarity
- temporal overlap
- semantic similarity
- visual similarity
- entity overlap
- source independence
- external corroboration

---

## FR-06 — INCIDENT CONFIDENCE

System shall calculate an explainable confidence indicator.

Confidence should not be an arbitrary LLM number.

It should be based on deterministic signals such as:

- number of independent sources
- spatial agreement
- time agreement
- evidence agreement
- duplicate penalty
- external corroboration

---

## FR-07 — LIVE HEAT/RISK LAYERS

Support separate layers for:

- incident density
- severity
- active risk
- predicted risk
- evidence confidence
- propagation
- resource demand

Every predictive layer must be labeled.

---

## FR-08 — IMPACT GRAPH

For each significant incident, NEXUS should identify affected entities and relationships.

Example:

```text
Bridge closure
   ↓
Road capacity
   ↓
Traffic
   ↓
Emergency route
   ↓
Hospital access
```

---

## FR-09 — WHY ANALYSIS

User can ask why an entity is at risk.

The UI must show:

- conclusion
- evidence
- contributing factors
- assumptions
- confidence
- timestamp

---

## FR-10 — WHAT-IF

User can manipulate the world:

- close route
- change demand
- move asset
- disable facility
- alter capacity

The system creates a new scenario instead of mutating live state.

---

## FR-11 — FUTURE SIMULATION

NEXUS shall display:

- baseline
- scenario A
- scenario B
- scenario C

and compare outcomes.

---

## FR-12 — RESPONSE PLAN GENERATION

AI shall produce multiple response options with:

- objective
- actions
- resources
- prerequisites
- expected benefits
- risks
- uncertainty
- authorization requirement

---

## FR-13 — HUMAN AUTHORIZATION

High-impact actions shall require explicit approval.

Approval states:

```text
PENDING
APPROVED
REJECTED
MODIFIED
EXPIRED
```

---

## FR-14 — ACTION EXECUTION

For hackathon:

- simulated execution is acceptable
- real APIs can be used only where available and safe

---

## FR-15 — VERIFICATION

After action:

- collect updated signals
- compare before/after
- determine trend
- show outcome confidence

---

## FR-16 — TIMELINE REPLAY

System shall record:

- evidence arrival
- incident creation
- incident fusion
- plan generation
- approval
- action
- outcome

User can replay the timeline.

---

## FR-17 — VOICE COMMAND

Voice can:

- query
- filter
- investigate
- create scenario
- generate plans
- prepare action

It shall not bypass authorization.

---

## FR-18 — DISCOVERY

NEXUS may surface AI-discovered:

- anomalies
- hidden dependencies
- repeated patterns
- incident clusters
- bottlenecks

These must be labelled as AI hypotheses and linked to evidence.

---

# 6. EVIDENCE PIPELINE — DETAILED

## Input

Example citizen upload:

```text
photo.jpg
GPS: 26.91, 75.79
timestamp: 14:18
user text: "main road is flooded"
```

## Step A — Validate

- file type
- size
- malware scan if available
- timestamp
- location

## Step B — Analyze

Vision system:
- road
- standing water
- obstruction
- vehicle slowdown

Language system:
- road flooding
- severity
- location

## Step C — Normalize

Create:

```json
{
  "event_type": "ROAD_FLOODING",
  "severity_hint": "HIGH",
  "location": {
    "lat": 26.91,
    "lng": 75.79
  }
}
```

## Step D — Candidate match

Search for:
- nearby incidents
- recent related evidence
- similar reports

## Step E — Fuse

Attach if match confidence exceeds threshold.

## Step F — Update world state

Road:
`OPEN → DEGRADED`

## Step G — Impact engine

Find dependent assets/entities.

---

# 7. CITIZEN REPORTING PRODUCT

The reporting UX must be dramatically simpler than official forms.

### Primary screen

```text
WHAT DID YOU SEE?

[PHOTO]
[VIDEO]
[VOICE]
[TEXT]
```

Optional:
`Use current location`

Then NEXUS shows:

> I detected possible road flooding.

User can correct.

Then:

**SUBMIT**

No mandatory category tree unless the AI fails.

---

# 8. EVIDENCE FUSION EXAMPLE

Inputs:

```text
17 photos
4 videos
8 text reports
2 sensor events
1 weather signal
```

Output:

```text
INCIDENT #1047

Category:
Urban flooding

Confidence:
93%

Evidence:
32 items

Affected:
6 roads
1 hospital route
2 zones

Trend:
Worsening
```

UI should visually show:

```text
many signals
      ↓
same-world-event
```

---

# 9. SPATIAL VISUALIZATION REQUIREMENTS

NEXUS should support:

### Point
Incident marker.

### Line
Road/route.

### Polygon
Flood/fire/risk region.

### Volume / extrusion
Building or affected facility.

### Heatmap
Density/risk.

### Halo
Confidence/uncertainty.

### Animated propagation
Predicted spread.

### Flow lines
Traffic / resource movement.

---

# 10. MAP INTERACTION RULES

Click:

- entity → entity details
- incident → incident details
- evidence → source details
- relationship → impact explanation
- route → route metrics
- zone → aggregate health

Double click:
- zoom in

Command:
- fly to entity

Scenario mode:
- world state becomes read-only

Simulation:
- top banner must say `SIMULATION — NOT LIVE`

---

# 11. ORGANIZATION / ACCESS MODEL

Every view request must evaluate:

```text
USER
+
ORGANIZATION
+
ROLE
+
ENTITY
+
ACTION
```

Example:

A district user can see:
- district incidents
- hospitals in district
- response assets

but cannot automatically access:
- another district's restricted evidence
- individual reporter information
- executive-only metrics

---

# 12. PRIVACY

Citizen evidence should use:

- reporter ID separate from public incident ID
- privacy redaction
- limited exposure of raw media
- access-controlled evidence
- audit logs

Potential image preprocessing:
- face blur
- license plate blur

Do not store unnecessary personal attributes.

---

# 13. AI EXPLANATION CONTRACT

Every AI answer should carry:

```text
answer
observed_facts[]
inferences[]
assumptions[]
evidence_ids[]
confidence
generated_at
```

This prevents the UI from turning every AI statement into an unexplained assertion.

---

# 14. SIMULATION CONTRACT

Every simulation must explicitly state:

```text
BASELINE TIME
SCENARIO CHANGE
ASSUMPTIONS
MODEL TYPE
OUTPUT METRICS
UNCERTAINTY
```

Example:

```text
Scenario:
Road R17 closed for 45 min

Model:
Graph-based response simulation

Assumptions:
Current demand ±10%
No additional incidents

Result:
Emergency ETA +9 min
```

---

# 15. ACTION SAFETY CONTRACT

An action object:

```json
{
  "action_type": "REROUTE_ASSET",
  "target": "ambulance-17",
  "proposed_by": "planner-agent",
  "reason": ["incident-1047"],
  "impact": {...},
  "authorization_required": true,
  "rollback_supported": true
}
```

A model cannot bypass the policy layer.

---

# 16. VERIFICATION CONTRACT

After action:

```json
{
  "action_id": "act-17",
  "before_metrics": {...},
  "after_metrics": {...},
  "supporting_evidence": ["ev-23", "ev-27"],
  "result": "IMPROVED",
  "confidence": 0.87
}
```

---

# 17. NON-FUNCTIONAL REQUIREMENTS

## Performance

- map first interaction target: <4s
- common panel operations: <1s after data available
- AI evidence extraction target: <10s
- scenario target: <5s for demo world
- voice response target: low-latency conversational

## Reliability

- Demo Mode must work without external feeds.
- Seeded data must always be available.
- External API failure must not kill the presentation.

## Security

- no secrets in repo
- server-side authorization
- signed media URLs
- audit trail
- rate limits
- input validation

## Explainability

Predictions and simulations must be visually distinct from facts.

---

# 18. PRIMARY SCREENS

1. Command Center
2. Incident Detail
3. Evidence Viewer
4. Citizen Report
5. Scenario Builder
6. Scenario Compare
7. Response Planner
8. Approval Center
9. Timeline / Time Machine
10. Organization Hierarchy
11. Audit Trail
12. Discovery Center
13. Voice Command Center
14. Facility/Branch View
15. System Health

---

# 19. COMMAND CENTER

### Header

- NEXUS logo
- organization/world selector
- current time
- live/simulation switch
- voice control
- profile/role

### Left rail

- world layers
- incidents
- assets
- facilities
- evidence
- scenarios

### Center

3D map.

### Right rail

Context/AI insights.

### Bottom

Timeline and realtime event stream.

---

# 20. INCIDENT DETAIL

Sections:

### Summary
What happened.

### Evidence
Why we believe it.

### Impact
What it affects.

### Cause
Potential contributors.

### Forecast
What may happen.

### Plans
What to do.

### Timeline
What happened so far.

### Verification
Whether intervention worked.

---

# 21. THE "KILLER" UI INTERACTION

User asks:

> "What happens if Bridge B02 stays closed for 45 minutes?"

The application:

1. opens scenario mode
2. shows B02 closing
3. map transitions
4. traffic shifts
5. ambulance routes recalculate
6. hospital risk changes
7. incident propagation appears
8. result metrics populate
9. recommended interventions appear

The user should feel like they **edited reality**.

---

# 22. DEMO FAILURE PREVENTION

There must be three levels.

### Level 1 — Live
Real APIs and services.

### Level 2 — Synthetic live
Deterministic simulated feeds.

### Level 3 — Precomputed scenario
Known good outputs.

Switch automatically when needed.

Never show a broken external API on stage.

---

# 23. EXTENSIONS

Future versions can instantiate NEXUS for:

### Government
- city operations
- disaster coordination
- municipal services

### Enterprise
- branches
- warehouses
- stores
- supply chain

### Industrial
- plant safety
- predictive maintenance
- logistics

### Campus
- security
- maintenance
- events

### Healthcare
- hospital facilities
- ambulance/logistics coordination

---

# 24. WHAT IS ACTUALLY INNOVATIVE

Not:
- 3D map
- voice assistant
- AI summaries
- heatmap
- image classification

The differentiated combination is:

```text
MULTIMODAL EVIDENCE
+
SPATIAL WORLD MODEL
+
INCIDENT FUSION
+
RELATIONSHIP/IMPACT GRAPH
+
COUNTERFACTUAL SIMULATION
+
POLICY-BOUNDED ACTION
+
OUTCOME VERIFICATION
```

That is the product architecture that should be emphasized.
