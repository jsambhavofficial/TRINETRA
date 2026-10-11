"""
Enrich data/seed/nexus_city.json with Phase 2 data:
- Districts (North, South, East, West)
- 25 3D extruded buildings
- Detailed hospital operational state
- Road capacity and status fields
- Emergency station details
"""
import json
from pathlib import Path

seed_path = Path("data/seed/nexus_city.json")
with open(seed_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# 1. Add Districts
districts = [
    {
        "id": "dst-north",
        "worldId": "world-nexus-city-01",
        "name": "North Operational Sector",
        "code": "NORTH",
        "status": "STABLE",
        "operationalScore": 0.88,
        "populationEstimate": 245000,
        "incidentCount": 1,
        "facilityCount": 5,
        "assetCount": 4,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [75.75, 26.93],
                    [75.88, 26.93],
                    [75.88, 26.98],
                    [75.75, 26.98],
                    [75.75, 26.93]
                ]
            ]
        },
        "color": "#3B82F6"
    },
    {
        "id": "dst-south",
        "worldId": "world-nexus-city-01",
        "name": "South Operational Sector",
        "code": "SOUTH",
        "status": "STABLE",
        "operationalScore": 0.95,
        "populationEstimate": 198000,
        "incidentCount": 0,
        "facilityCount": 4,
        "assetCount": 3,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [75.75, 26.85],
                    [75.88, 26.85],
                    [75.88, 26.89],
                    [75.75, 26.89],
                    [75.75, 26.85]
                ]
            ]
        },
        "color": "#10B981"
    },
    {
        "id": "dst-east",
        "worldId": "world-nexus-city-01",
        "name": "East Operational Sector",
        "code": "EAST",
        "status": "ELEVATED_RISK",
        "operationalScore": 0.82,
        "populationEstimate": 310000,
        "incidentCount": 1,
        "facilityCount": 4,
        "assetCount": 4,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [75.81, 26.89],
                    [75.88, 26.89],
                    [75.88, 26.93],
                    [75.81, 26.93],
                    [75.81, 26.89]
                ]
            ]
        },
        "color": "#F59E0B"
    },
    {
        "id": "dst-west",
        "worldId": "world-nexus-city-01",
        "name": "West Operational Sector",
        "code": "WEST",
        "status": "CONSTRAINED",
        "operationalScore": 0.71,
        "populationEstimate": 420000,
        "incidentCount": 2,
        "facilityCount": 7,
        "assetCount": 6,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [75.75, 26.89],
                    [75.81, 26.89],
                    [75.81, 26.93],
                    [75.75, 26.93],
                    [75.75, 26.89]
                ]
            ]
        },
        "color": "#EF4444"
    }
]

data["districts"] = districts

# 2. Update Hospitals with exact structured fields required by Section 8
for ent in data.get("entities", []):
    if ent.get("entityType") == "HOSPITAL":
        if "Central Memorial" in ent.get("name", ""):
            ent["attributes"].update({
                "occupancy": 0.72,
                "icu_occupancy": 0.84,
                "ambulances_available": 3,
                "power_status": "STABLE",
                "access_status": "COMPROMISED",
                "risk_level": "HIGH",
                "beds_total": 650,
                "beds_occupied": 468,
                "district": "dst-west"
            })
            ent["status"] = "AT_RISK"
        elif "North District" in ent.get("name", ""):
            ent["attributes"].update({
                "occupancy": 0.58,
                "icu_occupancy": 0.62,
                "ambulances_available": 4,
                "power_status": "STABLE",
                "access_status": "NORMAL",
                "risk_level": "LOW",
                "beds_total": 220,
                "beds_occupied": 128,
                "district": "dst-north"
            })
        elif "Apex Trauma" in ent.get("name", ""):
            ent["attributes"].update({
                "occupancy": 0.81,
                "icu_occupancy": 0.78,
                "ambulances_available": 5,
                "power_status": "STABLE",
                "access_status": "NORMAL",
                "risk_level": "LOW",
                "beds_total": 480,
                "beds_occupied": 389,
                "district": "dst-south"
            })
        elif "West Metro" in ent.get("name", ""):
            ent["attributes"].update({
                "occupancy": 0.64,
                "icu_occupancy": 0.69,
                "ambulances_available": 3,
                "power_status": "STABLE",
                "access_status": "NORMAL",
                "risk_level": "LOW",
                "beds_total": 310,
                "beds_occupied": 198,
                "district": "dst-west"
            })

    if ent.get("entityType") == "EMERGENCY_STATION":
        ent["attributes"].update({
            "service_zone": "dst-west" if "Station #1" in ent["name"] else ("dst-north" if "#2" in ent["name"] else "dst-east"),
            "teams_available": 4,
            "vehicles_ready": 6,
            "operational_readiness": "100%"
        })

    if ent.get("entityType") == "ROAD":
        # Add capacity and district
        dist = "dst-west"
        if "North" in ent["name"] or "Substation" in ent["name"]:
            dist = "dst-north"
        elif "South" in ent["name"] or "Apex" in ent["name"]:
            dist = "dst-south"
        elif "East" in ent["name"]:
            dist = "dst-east"

        ent["attributes"]["district"] = dist
        ent["attributes"]["capacity_vph"] = ent["attributes"].get("lanes", 2) * 950
        ent["attributes"]["speed_limit"] = ent["attributes"].get("speedLimitKmh", 50)

# 3. Add 25 3D Extruded Buildings (Commercial, Civic, Tech, Residential towers)
buildings = []
building_configs = [
    ("NEXUS Command Tower Alpha", 75.795, 26.915, 110, "CIVIC"),
    ("State Secretariat Highrise", 75.797, 26.916, 85, "GOVERNMENT"),
    ("Metropolitan Financial Tower 1", 75.791, 26.913, 95, "COMMERCIAL"),
    ("Metropolitan Financial Tower 2", 75.793, 26.911, 88, "COMMERCIAL"),
    ("Riverfront Plaza Complex", 75.802, 26.920, 65, "MIXED_USE"),
    ("Civic Center West Wing", 75.793, 26.916, 50, "CIVIC"),
    ("North Sector IT Park Block A", 75.808, 26.948, 70, "TECH"),
    ("North Sector IT Park Block B", 75.811, 26.950, 75, "TECH"),
    ("Central Telecom Tower Base", 75.814, 26.937, 45, "INFRASTRUCTURE"),
    ("Apex Health Tower", 75.774, 26.897, 60, "MEDICAL"),
    ("Riverbank Residential Tower A", 75.805, 26.927, 72, "RESIDENTIAL"),
    ("Riverbank Residential Tower B", 75.808, 26.929, 68, "RESIDENTIAL"),
    ("Grand Hotel & Conference Center", 75.787, 26.917, 58, "HOSPITALITY"),
    ("City Central Library & Archive", 75.798, 26.912, 38, "EDUCATION"),
    ("Metro Transportation Center", 75.784, 26.923, 42, "TRANSIT"),
    ("East Industrial Tech Hub 1", 75.848, 26.902, 48, "INDUSTRIAL"),
    ("East Industrial Tech Hub 2", 75.852, 26.905, 52, "INDUSTRIAL"),
    ("South District Municipal Office", 75.788, 26.882, 40, "GOVERNMENT"),
    ("West District Court Complex", 75.760, 26.918, 55, "JUDICIAL"),
    ("University Engineering Quad", 75.753, 26.923, 35, "EDUCATION"),
    ("University Life Sciences Center", 75.756, 26.926, 45, "EDUCATION"),
    ("Emergency Medical Annex 1", 75.790, 26.920, 40, "MEDICAL"),
    ("Emergency Medical Annex 2", 75.794, 26.922, 36, "MEDICAL"),
    ("Harbor Logistics Depot Office", 75.764, 26.902, 30, "LOGISTICS"),
    ("Urban Water Works Office", 75.817, 26.926, 28, "UTILITY")
]

for idx, (b_name, lng, lat, height, b_type) in enumerate(building_configs, start=1):
    # Footprint: small square around coordinate (approx 40m x 40m)
    d = 0.00035
    footprint = [
        [lng - d, lat - d],
        [lng + d, lat - d],
        [lng + d, lat + d],
        [lng - d, lat + d],
        [lng - d, lat - d]
    ]
    b_id = f"ent-bld-{idx:02d}"
    dist_id = "dst-north" if lat > 26.93 else ("dst-south" if lat < 26.89 else ("dst-east" if lng > 75.81 else "dst-west"))
    buildings.append({
        "id": b_id,
        "worldId": "world-nexus-city-01",
        "entityType": "BUILDING",
        "name": b_name,
        "geometry": {
            "type": "Polygon",
            "coordinates": [footprint]
        },
        "status": "OPERATIONAL",
        "attributes": {
            "building_type": b_type,
            "height_meters": height,
            "floors": max(3, int(height / 3.5)),
            "district": dist_id,
            "structural_status": "NOMINAL"
        }
    })

# Add buildings to entities
existing_ids = {e["id"] for e in data.get("entities", [])}
for b in buildings:
    if b["id"] not in existing_ids:
        data["entities"].append(b)

# 4. Add third incident (#1049) to ensure rich incident variety
inc_1049 = {
    "id": "inc-1049",
    "worldId": "world-nexus-city-01",
    "incidentNumber": 1049,
    "title": "Minor Structural Debris at Riverfront Promenade",
    "incidentType": "INFRASTRUCTURE_DAMAGE",
    "status": "STABILIZING",
    "severity": "LOW",
    "confidence": 0.85,
    "geometry": { "latitude": 26.9265, "longitude": 75.8032 },
    "affectedRadiusMeters": 150,
    "startedAt": "2026-10-02T13:30:00Z",
    "detectedAt": "2026-10-02T13:32:00Z",
    "resolvedAt": None,
    "evidenceCount": 6,
    "affectedEntityCount": 1,
    "epistemicStatus": "OBSERVED",
    "summary": "Tree branches and barrier dislodged by strong wind gust along Riverfront Promenade. Maintenance team PU-7 dispatched to clear debris."
}

if not any(i.get("id") == "inc-1049" for i in data.get("incidents", [])):
    data["incidents"].append(inc_1049)

with open(seed_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print(f"Updated {seed_path} with {len(districts)} districts, {len(buildings)} buildings, total entities: {len(data['entities'])}, incidents: {len(data['incidents'])}")
