"""
TRINETRA Phase 3 — AI-Assisted Triage and Routing Service.
Processes multi-modal citizen complaint inputs (text, voice transcript, media, confirmed location)
and produces structured, explainable triage recommendations grounded in Haryana administrative taxonomy.
Includes deterministic routing rules, duplicate candidate search, uncertainty flags, and human review gating.
"""
from datetime import datetime, timezone, timedelta
import math
import re
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.complaint import ComplaintModel
from app.services.ai_provider import (
    CATEGORY_KEYWORD_RULES,
    CATEGORY_TO_DEPARTMENT,
    ai_provider,
)
from app.services.fusion_engine import haversine_distance_m


# Subcategories by main category
CATEGORY_SUBCATEGORIES = {
    "URBAN_FLOODING": [
        ("UNDERPASS_SUBMERSION", ["underpass", "subway", "tunnel"]),
        ("STORM_DRAIN_CLOG", ["drain", "inlet", "choke", "silt", "nala"]),
        ("RESIDENTIAL_INUNDATION", ["colony", "house", "society", "sector"]),
        ("RIVER_EMBANKMENT_SEEPAGE", ["embankment", "river", "tangri", "ghaggar", "bundh"]),
    ],
    "ELECTRICAL_HAZARD": [
        ("TRANSFORMER_FAILURE", ["transformer", "spark", "oil leak"]),
        ("DOWNED_LIVE_WIRE", ["live cable", "snapped wire", "high-tension", "11kv", "touching"]),
        ("FEEDER_TRIP_OUTAGE", ["blackout", "feeder", "substation", "tripping"]),
    ],
    "ROAD_BLOCKAGE": [
        ("FALLEN_TREE_OBSTRUCTION", ["tree", "trunk", "branch", "highway"]),
        ("DEEP_POTHOLE_CLUSTER", ["pothole", "crater", "asphalt", "skid"]),
        ("STRUCTURAL_PAVER_COLLAPSE", ["paver", "sinkhole", "trench", "crossing"]),
    ],
    "HEALTH_HAZARD": [
        ("VECTOR_BREEDING_HOTSPOT", ["dengue", "mosquito", "larvae", "stagnant water"]),
        ("CONTAMINATED_WATER_SUPPLY", ["brown water", "smell", "drinking water", "tap", "pipeline contamination"]),
        ("BIOMEDICAL_WASTE_DUMPING", ["hospital waste", "syringes", "open ground", "dumping"]),
    ],
    "SEWERAGE_OVERFLOW": [
        ("TRUNK_SEWER_RUPTURE", ["trunk sewer", "pipeline burst", "manhole lid"]),
        ("COMMERCIAL_MARKET_OVERFLOW", ["market culvert", "retail", "shop"]),
    ],
    "CIVIL_INFRASTRUCTURE": [
        ("RETAINING_WALL_SUBSIDENCE", ["retaining wall", "riverbank", "scouring"]),
        ("CULVERT_BRIDGE_BREACH", ["culvert", "bridge", "approach slab"]),
    ],
}

# Safety escalation triggers
SAFETY_RULES = [
    ("LIFE_SAFETY", ["drowning", "electrocuted", "unconscious", "collapse", "trapped", "casualty", "injury"]),
    ("ELECTRICAL_FIRE", ["sparking", "fire", "live wire", "high-tension", "burning", "smoke"]),
    ("FLOOD_BREACH", ["embankment breach", "river overflow", "flood surge", "levee collapse"]),
    ("HAZARDOUS_CHEMICAL", ["chemical leak", "acid", "toxic vapor", "poisonous"]),
]


class TriageService:
    def __init__(self):
        self.provider_name = "TRINETRA_GOVERNANCE_TRIAGE_ENGINE"
        self.version = "triage-v2.0-haryana"

    async def execute_triage(
        self,
        text: str,
        language: str = "en",
        voice_transcript: Optional[str] = None,
        media_analysis: Optional[Dict[str, Any]] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        district_id: Optional[str] = "HR-GU",
        landmark: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        """
        Executes unified AI-assisted triage across all available inputs.
        Returns validated structured decision support object.
        """
        # Combine textual evidence
        combined_text = f"{text or ''} {voice_transcript or ''} {landmark or ''}".strip().lower()

        # 1. Category Classification
        scored_categories = []
        for cat, keywords in CATEGORY_KEYWORD_RULES:
            matches = [kw for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', combined_text)]
            if matches:
                conf = min(0.96, 0.50 + len(matches) * 0.15)
                scored_categories.append((cat, conf, matches))

        scored_categories.sort(key=lambda x: x[1], reverse=True)

        if scored_categories:
            top_category = scored_categories[0][0]
            confidence = scored_categories[0][1]
            keywords_matched = scored_categories[0][2]
        else:
            top_category = "CIVIL_INFRASTRUCTURE"
            confidence = 0.45
            keywords_matched = []

        # 2. Subcategory Resolution
        sub_cat = None
        sub_rules = CATEGORY_SUBCATEGORIES.get(top_category, [])
        for sc, sc_kws in sub_rules:
            if any(kw in combined_text for kw in sc_kws):
                sub_cat = sc
                break
        if not sub_cat and sub_rules:
            sub_cat = sub_rules[0][0]

        # 3. Departmental Routing via Authoritative Jurisdiction Rules
        dept_id, dept_name = CATEGORY_TO_DEPARTMENT.get(top_category, ("DEPT-PWD", "Public Works Department"))
        routing_rule = f"RULE_TAXONOMY_MAP_{top_category}_TO_{dept_id}"

        # 4. Priority Assessment & Rationale
        priority = "MEDIUM"
        priority_reason = "Standard civic grievance SLA applies."

        # Safety / Emergency Escalation Flags
        safety_flags = []
        for flag, trigger_kws in SAFETY_RULES:
            matched_triggers = [kw for kw in trigger_kws if kw in combined_text]
            if matched_triggers:
                safety_flags.append(f"{flag} (detected: {', '.join(matched_triggers)})")
                priority = "CRITICAL"
                priority_reason = f"Safety risk identified: {flag}. Requires immediate response."

        if priority != "CRITICAL":
            if any(w in combined_text for w in ["severe", "heavy", "urgent", "completely blocked", "overflow"]):
                priority = "HIGH"
                priority_reason = "Elevated severity due to substantial public disruption or infrastructure damage."

        # 5. Entity & Location Extraction
        extracted_entities = []
        if landmark:
            extracted_entities.append({
                "type": "LANDMARK",
                "name": landmark,
                "confidence": 0.90,
                "is_uncertain": False,
            })

        # Search for known infrastructure entities in text (e.g. Chowk, Sector, Underpass, Flyover)
        inf_patterns = [
            (r'sector\s*\d+[a-z]?', "URBAN_SECTOR"),
            (r'\w+\s+chowk', "TRAFFIC_INTERSECTION"),
            (r'\w+\s+underpass', "UNDERPASS_STRUCTURE"),
            (r'\w+\s+flyover', "ELEVATED_FLYOVER"),
            (r'\w+\s+hospital', "HEALTHCARE_FACILITY"),
        ]
        for pat, ent_type in inf_patterns:
            matches = re.findall(pat, combined_text, flags=re.IGNORECASE)
            for m in matches:
                extracted_entities.append({
                    "type": ent_type,
                    "name": m.title(),
                    "confidence": 0.85,
                    "is_uncertain": False,
                })

        # 6. Candidate Duplicate Search (within 800m if DB provided)
        duplicate_candidates = []
        if db and latitude and longitude:
            try:
                # Find open complaints in same category in the last 72 hours
                cutoff = datetime.now(timezone.utc) - timedelta(hours=72)
                q = (
                    select(ComplaintModel)
                    .where(
                        and_(
                            ComplaintModel.category == top_category,
                            ComplaintModel.district_id == district_id,
                            ComplaintModel.created_at >= cutoff,
                            ComplaintModel.status.in_(["SUBMITTED", "TRIAGED", "ASSIGNED", "IN_PROGRESS"]),
                        )
                    )
                    .limit(10)
                )
                res = await db.execute(q)
                candidates = res.scalars().all()

                for c in candidates:
                    if c.latitude and c.longitude:
                        dist_m = haversine_distance_m(latitude, longitude, c.latitude, c.longitude)
                        if dist_m <= 1000:
                            sim_score = round(max(0.60, 1.0 - (dist_m / 1500.0)), 2)
                            duplicate_candidates.append({
                                "id": c.id,
                                "tracking_id": c.tracking_id,
                                "title": c.title,
                                "status": c.status,
                                "distance_meters": round(dist_m, 1),
                                "similarity_score": sim_score,
                                "created_at": c.created_at.isoformat(),
                            })
            except Exception as e:
                logger.warning(f"Duplicate candidate check notice: {e}")

        # 7. Plain Language Summary
        summary = (
            f"[{priority} Priority] {top_category.replace('_', ' ').title()} complaint reported in {district_id}. "
            f"Automated routing recommends assignment to {dept_name}. "
            f"{'Safety flags detected: ' + ', '.join(safety_flags) if safety_flags else 'No immediate life-safety risk flagged.'}"
        )

        # 8. Human Review Gating Flag
        requires_human_triage = bool(confidence < 0.65 or safety_flags or len(duplicate_candidates) > 0)

        # 9. Next Recommended Operational Step
        if safety_flags:
            recommended_step = "IMMEDIATE_EMERGENCY_DISPATCH"
        elif duplicate_candidates:
            recommended_step = "REVIEW_POSSIBLE_DUPLICATE_LINK"
        elif requires_human_triage:
            recommended_step = "HUMAN_TRIAGE_VERIFICATION"
        else:
            recommended_step = "AUTO_ROUTE_TO_LINE_DEPARTMENT"

        return {
            "suggested_category": top_category,
            "suggested_subcategory": sub_cat,
            "suggested_department_id": dept_id,
            "suggested_department_name": dept_name,
            "suggested_priority": priority,
            "priority_reason": priority_reason,
            "plain_language_summary": summary,
            "extracted_entities": extracted_entities,
            "safety_escalation_flags": safety_flags,
            "duplicate_candidates": duplicate_candidates,
            "confidence_score": confidence,
            "evidence_keywords": keywords_matched,
            "routing_rule": routing_rule,
            "recommended_next_step": recommended_step,
            "requires_human_triage": requires_human_triage,
            "model_provider": self.provider_name,
            "model_version": self.version,
            "is_simulated": True,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "disclaimer": "AI recommendations provide decision support for administrative staff. Final routing and lifecycle decisions require authorized human oversight.",
        }


triage_service = TriageService()
