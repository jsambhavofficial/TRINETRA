# NEXUS — The Living Spatial Intelligence & Operational Command Platform

> **NEXUS** transforms fragmented real-world observations into an authoritative spatial digital twin, fuses multimodal AI evidence, computes causal dependencies and topological impacts, runs counterfactual non-mutating simulations, coordinates policy-bounded authorized response plans, and closes the operational loop with autonomous physical verification.

---

## 1. System Architecture

```text
REAL WORLD OBSERVATIONS (Photo, Video, Voice, Geotag, IoT Sensors)
                                ↓
                 MULTIMODAL AI PERCEPTION ENGINE
          (Scene Recognition, Feature Extraction, Confidence)
                                ↓
                 EVIDENCE FUSION & GRAPH CLUSTERING
       (Spatiotemporal Haversine/H3, Semantic Cosine, Agreement)
                                ↓
                    LIVING OPERATIONAL TWIN
         (CesiumJS 3D / Tactical Vector Engine / PostGIS)
                                ↓
                 IMPACT INTELLIGENCE & CAUSAL GRAPH
             (Direct, Access Delay, Route, Utility Strain)
                                ↓
                WHAT-IF COUNTERFACTUAL SIMULATION
              (Isolated Non-Mutating Network Routing)
                                ↓
                     AI RESPONSE PLAN SYNTHESIS
                (Prioritized Action Recommendations)
                                ↓
                 POLICY-BOUNDED RBAC AUTHORIZATION
                  (Human-in-the-Loop Verification)
                                ↓
                  SAFE DEMO EXECUTION & DISPATCH
                    (Telemetry & Asset State)
                                ↓
                  CLOSED-LOOP DRONE VERIFICATION
             (Differential State Sensors → Resolution)
                                ↓
                   CITIZEN RESPONSE TRANSPARENCY
               (Public-Safe 9-Milestone Progress Portal)
```

---

## 2. Quickstart & Local Setup

NEXUS is designed for 100% offline hackathon resilience. No external API keys or cloud connections are required during live judging.

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+ (virtualenv recommended)

### 1. Start the FastAPI Backend
```bash
cd "services/api"
# Activate virtual environment
.\.venv\Scripts\Activate.ps1    # Windows PowerShell
# source .venv/bin/activate     # macOS / Linux

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- API Base: `http://localhost:8000/api/v1`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Health Checks: `http://localhost:8000/health`

### 2. Start the Next.js Command Center
```bash
cd "apps/web"
npm install
npm run dev
```
- Command Center: `http://localhost:3000/world`
- Public Citizen Reporter: `http://localhost:3000/report`
- Citizen Transparency Tracker: `http://localhost:3000/track?id=REP-R17-001`
- Operator Review Queue: `http://localhost:3000/review`

---

## 3. Demo Mode / Judge Mode Guide

NEXUS includes an integrated **Judge Mode & Demo Controller** docked at the bottom of the 3D Command Center:

### Dedicated Transport Controls
- **JUDGE MODE Pill:** Click in the top header or bottom bar to toggle the scenario controller and view the 7-Question Judge Briefing.
- **AUTO PLAY:** Automatically choreographs the 10-step flagship narrative every 4.5 seconds with cinematic camera flights.
- **PAUSE:** Instantly pause autoplay to inspect data or answer judge inquiries.
- **NEXT / PREV EVENT:** Step forward or backward through the 10 deterministic spatiotemporal milestones.
- **RESET DEMO:** Idempotently restores the entire digital twin, road status, hospital access, and incident state back to baseline.

### 10-Step Deterministic Timeline

| Step | Time | Title | Category | Camera Focus | Operational State Change |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **01** | `10:01` | Citizen Field Report | `CITIZEN_INGEST` | Observation Site (`26.918°N, 75.792°E`) | Citizen photo logs 38cm flooding on Road R17. |
| **02** | `10:03` | AI Perception | `AI_PERCEPTION` | Incident Core (`26.912°N, 75.787°E`) | Vision worker extracts stalled vehicles & severity HIGH (91%). |
| **03** | `10:05` | Sensor Corroboration | `SENSOR_FUSION` | Culvert P02 (`26.912°N, 75.787°E`) | Municipal IoT culvert sensor corroborates 38cm rising surge. |
| **04** | `10:07` | Evidence Fusion | `FUSION_ENGINE` | Corridor R17 (`26.912°N, 75.787°E`) | 4 items cluster into canonical Incident #1047 (94% confidence). |
| **05** | `10:09` | Incident Confirmed | `INCIDENT_INTELLIGENCE` | Bridge B02 (`26.922°N, 75.798°E`) | Severity elevated to CONFIRMED; pulsing alert halo activates. |
| **06** | `10:11` | Impact Evaluation | `IMPACT_INTELLIGENCE` | Memorial Hospital (`26.918°N, 75.792°E`) | Road R17 severed; +9.0 min ambulance ingress delay computed. |
| **07** | `10:14` | What-If Simulation | `SIMULATION_PLANNING` | Bypass Corridor R14 (`26.930°N, 75.785°E`) | Counterfactual simulation models 7.1 min bypass corridor. |
| **08** | `10:16` | Authorization & Dispatch | `AUTHORIZATION_ACTION` | Rescue Unit PU-04 (`26.908°N, 75.775°E`) | Commander authorizes plan; units dispatched; traffic diverted. |
| **09** | `10:22` | Drone Verification | `VERIFICATION` | Verification Site (`26.912°N, 75.787°E`) | Recon Drone Alpha confirms floodwater receding to 4.2cm. |
| **10** | `10:30` | Incident Resolved | `RESOLUTION` | Metropolitan Overview (`26.912°N, 75.787°E`) | Road R17 verified open; incident marked RESOLVED in all portals. |

---

## 4. Role-Based Access Control (RBAC)

NEXUS supports four distinct operational profiles using the same underlying physical world twin:

1. **CITIZEN (Public Safe):**
   - Visible: Public safety advisories, road closures, general hospital status, own report tracking.
   - Restricted: Confidential utility nodes, operational response unit GPS locations, unvetted candidate feeds, internal response plans.
2. **RESPONDER (Tactical Units):**
   - Visible: Assigned emergency incidents, active dispatch corridors, nearby medical facilities, field telemetry updates.
3. **AUTHORITY (City Commander):**
   - Visible: Full operational digital twin, multi-tier impact graphs, non-mutating simulations, policy evaluation, action authorization, closed-loop verification triggers.
4. **ADMIN (Governance & Audit):**
   - Visible: User role administration, system health, audit event inspection, AI model thresholds.

---

## 5. Answers to the 12 Final Judge Questions

### 1. Why not Google Maps?
Google Maps is a consumer navigation tool that displays static map tiles with consumer traffic delays. It has no concept of operational twins, topological facility dependencies (e.g. trauma ICU bed availability linked to bridge clearance), counterfactual simulation, policy authorization, or closed-loop sensor verification. NEXUS is an operational command operating system.

### 2. Why not a chatbot?
Chatbots generate conversational text without spatial grounding or deterministic guarantees. In emergency operations, text answers hallucinate coordinates and invent unavailable assets. NEXUS uses structured, typed AI agents bounded by deterministic spatial algorithms and strict RBAC policies.

### 3. How do you prevent hallucination?
NEXUS enforces a strict separation between **AI Observations** and **Operational Truth**:
- AI outputs are classified as epistemic hypotheses (`OBSERVED`, `INFERRED`, `UNKNOWN`).
- Candidates must achieve multi-source corroboration through the Evidence Fusion Engine before becoming an active incident.
- AI can recommend a response plan, but cannot execute actions without human commander authorization.

### 4. What is actually AI?
- Multimodal visual perception extracting objects, water accumulation, and event cues from citizen media.
- Speech-to-text tokenization and semantic entity resolution from voice emergency calls.
- Spatiotemporal and semantic vector cosine clustering across multimodal evidence items.
- Explainable AI rationale synthesis detailing the mathematical basis for fusion confidence.

### 5. What is deterministic?
- Spatial math (Haversine geodesic distances, bounding box intersection, H3 spatial indexing).
- Directed causal dependency graphs and topological shortest-path routing.
- RBAC and ABAC policy enforcement matrices.
- Database state machines and audit trails.

### 6. How does evidence fusion work?
The fusion engine computes a composite multi-vector corroboration score:
$$\text{Score} = w_s \cdot S_{\text{spatial}} + w_t \cdot S_{\text{temporal}} + w_m \cdot S_{\text{semantic}} + w_e \cdot S_{\text{entity}} + w_v \cdot S_{\text{visual}} + w_i \cdot S_{\text{independence}}$$
When this score exceeds the jurisdictional threshold ($\ge 0.85$), candidate observations are fused into a single canonical incident.

### 7. How does the citizen benefit?
Citizens receive immediate transparency. Instead of submitting a report into a black hole, the `/track` portal displays a real-time 9-stage progress stepper reflecting genuine operational dispatch and verification states.

### 8. How do authorities benefit?
Authorities gain instant operational clarity. Instead of reading through hundreds of duplicative emergency calls, they see ONE authoritative incident, its cascading impact on critical hospitals, a simulated alternative detour, and a pre-compiled response plan ready for one-click authorization.

### 9. How does this scale?
The backend uses asynchronous FastAPI endpoints, spatial indexing, bounded geospatial queries, and event-driven WebSocket broadcasting. The architecture supports sharding by geographic world partitions.

### 10. How is privacy handled?
Citizen identity, phone numbers, and device identifiers are strictly segregated. Evidence storage URLs are private and accessed via signed accessors. Public citizen views redact operational unit coordinates and confidential grid assets.

### 11. What is real vs demo?
- **Real:** The entire FastAPI backend, SQLite/PostgreSQL ORM database, REST APIs, spatial calculations, non-mutating routing simulations, action authorization state machines, Next.js frontend, and Cesium/vector spatial twin.
- **Deterministic Demo:** The Jaipur/NEXUS City fixture dataset (4 hospitals, 3 stations, 12 ambulances, 4 corroborating evidence items) designed for reliable, offline hackathon presentation.

### 12. What happens if AI fails?
NEXUS fails gracefully. If external AI perception models timeout or fail, the system falls back to deterministic rule-based heuristic extraction marked with `source_type: DEMO_FIXTURE` or routes the item to the human operator review queue (`/review`). The application never crashes or produces white screens.

---

## 6. Testing & Quality Assurance

### Run Automated Backend Tests
```bash
cd "services/api"
.\.venv\Scripts\python -m pytest tests/ -v
```
- **30 passed, 0 failed (100% pass rate)** covering backend health, evidence ingestion, fusion scoring, impact intelligence, simulation, response planning, closed-loop verification, citizen tracking, voice commands, and scenario step choreography.

### Run Frontend Static Type Verification
```bash
cd "apps/web"
npx tsc --noEmit
```
- **0 errors**: Clean TypeScript compilation across all command center and public pages.

---

## 7. Open Source Dependencies & Licenses

| Dependency | Purpose | License |
| :--- | :--- | :--- |
| **CesiumJS** | 3D Globe & Spatial Canvas | Apache-2.0 |
| **Next.js** | React Web Framework | MIT |
| **FastAPI** | Asynchronous Python API Engine | MIT |
| **SQLAlchemy** | SQL ORM & Session Management | MIT |
| **Zustand** | Global Frontend State Store | MIT |
| **Lucide Icons** | Mission Control Operational Iconography | ISC |
| **Tailwind CSS** | Styling System | MIT |
