"""
District Data Service
Provides district boundaries, operational scores, and facility/incident aggregations.
"""
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.schemas.world import DistrictResponse

_DISTRICTS_CACHE: Optional[List[Dict[str, Any]]] = None


def get_seed_districts(world_id: str) -> List[DistrictResponse]:
    global _DISTRICTS_CACHE
    if _DISTRICTS_CACHE is None:
        seed_file = Path(__file__).resolve().parents[4] / "data" / "seed" / "nexus_city.json"
        if not seed_file.exists():
            seed_file = Path("data/seed/nexus_city.json")

        if seed_file.exists():
            with open(seed_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                _DISTRICTS_CACHE = data.get("districts", [])
        else:
            _DISTRICTS_CACHE = []

    results = []
    for d in _DISTRICTS_CACHE or []:
        if d.get("worldId") == world_id:
            results.append(DistrictResponse(
                id=d["id"],
                world_id=d["worldId"],
                name=d["name"],
                code=d.get("code", d["name"][:5].upper()),
                status=d.get("status", "STABLE"),
                operational_score=float(d.get("operationalScore", 0.9)),
                population_estimate=int(d.get("populationEstimate", 200000)),
                incident_count=int(d.get("incidentCount", 0)),
                facility_count=int(d.get("facilityCount", 0)),
                asset_count=int(d.get("assetCount", 0)),
                geometry=d["geometry"],
                color=d.get("color", "#3B82F6")
            ))
    return results
