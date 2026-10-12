# TRINETRA — Haryana Governance Synthetic Demonstration Dataset

## 1. Overview
This dataset contains **25,000 realistic civic and operational incident records** distributed across all **22 administrative districts of Haryana, India**. It provides realistic end-to-end load testing and demonstration data for the TRINETRA state governance platform.

Every record is explicitly tagged with `is_demo=True` (`1`) so that production systems and live queries can cleanly separate real citizen grievances from synthetic demonstration data.

---

## 2. Spatial Extent & Haryana Bounding Envelope
All coordinates are strictly verified and clamped within Haryana's geographic envelope:
- **Latitude Range:** `27.6000° N` to `31.0000° N`
- **Longitude Range:** `74.4000° E` to `77.7000° E`

### District Centroids & Weighted Distribution
The 25,000 complaints are distributed using realistic administrative weights reflecting urbanization, population density, and seasonal civic load:

| District Code | District Name | Centroid (Lat, Lng) | Distribution Weight |
|---|---|---|---|
| `HR-GU` | Gurugram | `28.4595, 77.0266` | 16% (~4,000) |
| `HR-FA` | Faridabad | `28.4089, 77.3178` | 14% (~3,500) |
| `HR-SO` | Sonipat | `28.9931, 77.0151` | 7% (~1,750) |
| `HR-PP` | Panipat | `29.3909, 76.9635` | 6% (~1,500) |
| `HR-KR` | Karnal | `29.6857, 76.9905` | 6% (~1,500) |
| `HR-AM` | Ambala | `30.3782, 76.7767` | 6% (~1,500) |
| `HR-RO` | Rohtak | `28.8955, 76.6066` | 6% (~1,500) |
| `HR-HI` | Hisar | `29.1492, 75.7217` | 6% (~1,500) |
| `HR-PK` | Panchkula | `30.6942, 76.8606` | 5% (~1,250) |
| `HR-YN` | Yamunanagar | `30.1727, 77.2989` | 4% (~1,000) |
| `HR-RE` | Rewari | `28.1833, 76.6167` | 4% (~1,000) |
| `HR-JH` | Jind | `29.3167, 76.3167` | 3% (~750) |
| `HR-SI` | Sirsa | `29.5321, 75.0318` | 3% (~750) |
| `HR-BW` | Bhiwani | `28.7932, 76.1390` | 3% (~750) |
| `HR-JJ` | Jhajjar | `28.6063, 76.6565` | 3% (~750) |
| `HR-KU` | Kurukshetra | `29.9695, 76.8783` | 3% (~750) |
| `HR-KT` | Kaithal | `29.8015, 76.3996` | 2% (~500) |
| `HR-PW` | Palwal | `27.9962, 77.3695` | 2% (~500) |
| `HR-FT` | Fatehabad | `29.5133, 75.4528` | 2% (~500) |
| `HR-MA` | Mahendragarh | `28.0444, 76.1089` | 2% (~500) |
| `HR-NU` | Nuh | `28.1070, 77.0150` | 2% (~500) |
| `HR-CD` | Charkhi Dadri | `28.5921, 76.2653` | 2% (~500) |

---

## 3. Categories & Target Line Departments
1. **`URBAN_FLOODING`** $\to$ *Public Works Department (B&R) / Urban Local Bodies*
   - Subcategories: `UNDERPASS_SUBMERSION`, `STORM_DRAIN_CLOG`, `RESIDENTIAL_INUNDATION`, `RIVER_EMBANKMENT_SEEPAGE`
2. **`ELECTRICAL_HAZARD`** $\to$ *Haryana Vidyut Prasaran Nigam (HVPNL / UHBVN / DHBVN)*
   - Subcategories: `TRANSFORMER_FAILURE`, `DOWNED_LIVE_WIRE`, `FEEDER_TRIP_OUTAGE`
3. **`ROAD_BLOCKAGE`** $\to$ *Public Works Department (B&R)*
   - Subcategories: `FALLEN_TREE_OBSTRUCTION`, `DEEP_POTHOLE_CLUSTER`, `STRUCTURAL_PAVER_COLLAPSE`
4. **`SEWERAGE_OVERFLOW`** $\to$ *Urban Local Bodies (ULB) & Municipal Corporations*
   - Subcategories: `TRUNK_SEWER_RUPTURE`, `COMMERCIAL_MARKET_OVERFLOW`
5. **`HEALTH_HAZARD`** $\to$ *Department of Health & Family Welfare*
   - Subcategories: `VECTOR_BREEDING_HOTSPOT`, `CONTAMINATED_WATER_SUPPLY`, `BIOMEDICAL_WASTE_DUMPING`
6. **`CIVIL_INFRASTRUCTURE`** $\to$ *Public Works Department (B&R)*
   - Subcategories: `RETAINING_WALL_SUBSIDENCE`, `CULVERT_BRIDGE_BREACH`

---

## 4. Lifecycle & Status Breakdown
The dataset exhibits realistic operational maturity across the governance lifecycle:
- **`RESOLVED`**: ~44% (accompanied by resolved timestamp and completion proof)
- **`IN_PROGRESS`**: ~22% (field unit dispatched and actively working)
- **`ASSIGNED`**: ~14% (triaged and allocated to jurisdictional unit)
- **`SUBMITTED` / `TRIAGED`**: ~12% (newly ingested or waiting department acceptance)
- **`AWAITING_VALIDATION`**: ~4% (field proof submitted; pending supervisory sign-off)
- **`ESCALATED`**: ~2% (flagged for expedited District HQ or State DMC intervention)
- **`NEEDS_INFORMATION`**: ~2% (citizen clarification requested)

---

## 5. High-Performance Viewport API Guidance
**Do not stream 25,000 raw points into client browsers simultaneously.**
Use the server-side spatial query endpoint:
```http
GET /api/v1/complaints/spatial/viewport?min_lat=27.6&max_lat=31.0&min_lng=74.4&max_lng=77.7&zoom=8
```
- **When `zoom < 10`:** Backend returns aggregated district clusters with counts and priority breakdowns.
- **When `zoom >= 10`:** Backend returns up to 250 individual pinpoint coordinates inside the active viewport.
- **For District Analytics:** Use `GET /api/v1/complaints/spatial/districts` to fetch pre-aggregated statistics for all 22 districts.
