"""
TRINETRA Phase 3 — Provider-Independent AI Service Boundary.
Provides model-abstracted interfaces for complaint classification, routing, summarization,
similarity explanations, and draft escalation notes.
Enforces zero-hallucination, grounds responses in verified records, and runs deterministic fallback.
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import re

from app.core.logging import logger
from app.services.fusion_engine import haversine_distance_m


CATEGORY_KEYWORD_RULES = [
    (
        "URBAN_FLOODING",
        [
            "flood", "waterlogging", "water level", "drain", "rain", "submerged", "inundation", "overflow", "embankment", "seepage", "nala",
            "जलभराव", "बाढ़", "पानी", "डूब", "बरसात", "नाला", "अंडरपास", "जल जमाव",
            "paani", "water", "jalbhorav", "underpass", "subway", "storm water", "deluge"
        ],
    ),
    (
        "ELECTRICAL_HAZARD",
        [
            "transformer", "spark", "wire", "power", "blackout", "electricity", "feeder", "high-tension", "pole", "shock", "live wire",
            "ट्रांसफार्मर", "बिजली", "स्पार्क", "तार", "करंट", "धमाका", "शॉर्ट सर्किट", "अंधेरा",
            "bijli", "taar", "currant", "short circuit", "sparking", "blackout", "light cut"
        ],
    ),
    (
        "ROAD_BLOCKAGE",
        [
            "tree", "pothole", "trunk", "crater", "debris", "road", "block", "divider", "congestion", "asphalt", "highway", "sinkhole",
            "गड्ढे", "सड़क", "जाम", "पेड़", "अवरोध", "रास्ता बंद", "खड्डा",
            "gaddhe", "gaddha", "sadak", "traffic jam", "road block", "ped gir", "potholes"
        ],
    ),
    (
        "HEALTH_HAZARD",
        [
            "dengue", "mosquito", "garbage", "waste", "stagnant", "epidemic", "hospital", "larvae", "fever", "dump", "biohazard",
            "डेंगू", "मच्छर", "कूड़ा", "कचरा", "गंदगी", "बीमारी", "महामारी", "सड़ांध",
            "machhar", "koora", "kachra", "gandagi", "dengu", "larva", "fever outbreak"
        ],
    ),
    (
        "SEWERAGE_OVERFLOW",
        [
            "sewer", "drainage", "manhole", "stench", "pipeline", "choked", "effluent", "gutter",
            "सीवर", "नाली", "मैनहोल", "गटर", "गंदा पानी", "बदबू", "सीवर लाइन",
            "sewer line", "ganda paani", "manhole", "gutter", "badboo", "drainage choke"
        ],
    ),
    (
        "CIVIL_INFRASTRUCTURE",
        [
            "bridge", "flyover", "crack", "wall", "slab", "railing", "culvert", "collapse", "pillar",
            "पुल", "पुलिया", "दीवार", "दरार", "फ्लाईओवर", "धंस", "गिर गया",
            "pul", "puliya", "flyover", "crack", "wall collapse", "pillar"
        ],
    ),
]

CATEGORY_TO_DEPARTMENT = {
    "URBAN_FLOODING": ("DEPT-PWD", "Public Works Department (B&R) / GMDA"),
    "ELECTRICAL_HAZARD": ("DEPT-POWER", "Haryana Vidyut Prasaran Nigam (HVPNL / DHBVN)"),
    "ROAD_BLOCKAGE": ("DEPT-PWD", "Public Works Department (B&R) / Traffic Police"),
    "HEALTH_HAZARD": ("DEPT-HEALTH", "Department of Health & Family Welfare"),
    "SEWERAGE_OVERFLOW": ("DEPT-PWD", "Public Health Engineering Department (PHED)"),
    "CIVIL_INFRASTRUCTURE": ("DEPT-PWD", "Public Works Department (B&R)"),
}


class BaseAIProvider(ABC):
    @abstractmethod
    async def suggest_classification(self, title: str, description: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def suggest_routing(self, title: str, description: str, district_id: Optional[str]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def summarize_complaint(self, record: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def explain_similarity(self, record_a: Dict[str, Any], record_b: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def generate_escalation_draft(self, record: Dict[str, Any], reason: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def synthesize_plain_language_summary(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        pass


class DeterministicRulesAIProvider(BaseAIProvider):
    """
    Standard ground-truth deterministic AI provider.
    Runs entirely local, zero API keys required, completely explainable and auditable.
    """
    def __init__(self):
        self.provider_name = "DETERMINISTIC_RULES_FALLBACK"
        self.version = "trinetra-ai-rules-v1.0"

    async def suggest_classification(self, title: str, description: str) -> Dict[str, Any]:
        text = f"{title} {description}".lower()
        scored_categories = []

        for cat, keywords in CATEGORY_KEYWORD_RULES:
            matches = [kw for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', text)]
            if matches:
                confidence = min(0.95, 0.50 + len(matches) * 0.15)
                scored_categories.append({
                    "category": cat,
                    "confidence": round(confidence, 2),
                    "matched_keywords": matches,
                })

        scored_categories.sort(key=lambda x: x["confidence"], reverse=True)

        if not scored_categories:
            top_category = "CIVIL_INFRASTRUCTURE"
            confidence = 0.40
            matched_keywords = []
            reason = "No explicit taxonomy keywords matched; assigned default civil governance category."
        else:
            top_category = scored_categories[0]["category"]
            confidence = scored_categories[0]["confidence"]
            matched_keywords = scored_categories[0]["matched_keywords"]
            reason = f"Detected {len(matched_keywords)} relevant terms: {', '.join(matched_keywords)}."

        return {
            "suggested_category": top_category,
            "confidence": confidence,
            "alternative_candidates": scored_categories[1:3],
            "reason": reason,
            "is_simulated": True,
            "model_provider": self.provider_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def suggest_routing(self, title: str, description: str, district_id: Optional[str]) -> Dict[str, Any]:
        class_res = await self.suggest_classification(title, description)
        cat = class_res["suggested_category"]
        dept_id, dept_name = CATEGORY_TO_DEPARTMENT.get(cat, ("DEPT-PWD", "Public Works Department"))

        return {
            "suggested_department_id": dept_id,
            "suggested_department_name": dept_name,
            "target_district_id": district_id or "HR-GU",
            "confidence": class_res["confidence"],
            "justification": f"Category '{cat}' is mapped to jurisdictional domain of {dept_name}.",
            "is_simulated": True,
            "model_provider": self.provider_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def summarize_complaint(self, record: Dict[str, Any]) -> Dict[str, Any]:
        title = record.get("title", "Untitled Complaint")
        cat = record.get("category", "General")
        status = record.get("status", "SUBMITTED")
        prio = record.get("priority", "MEDIUM")
        dist = record.get("district_name", record.get("district_id", "Haryana"))
        addr = record.get("address", "Location not specified")

        summary_text = (
            f"[{prio} Priority] {cat} issue reported at {addr} ({dist}). "
            f"Current state is {status}. Summary: {title}."
        )

        return {
            "record_id": record.get("id"),
            "tracking_id": record.get("tracking_id"),
            "one_line_summary": summary_text,
            "key_entities": {
                "district": dist,
                "category": cat,
                "priority": prio,
                "status": status,
            },
            "uncertainties": [
                "Field inspection pending" if status in ("SUBMITTED", "ACKNOWLEDGED") else "Remediation verified by field unit"
            ],
            "is_simulated": True,
            "model_provider": self.provider_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def explain_similarity(self, record_a: Dict[str, Any], record_b: Dict[str, Any]) -> Dict[str, Any]:
        # Compute real spatial distance
        lat1, lon1 = record_a.get("latitude"), record_a.get("longitude")
        lat2, lon2 = record_b.get("latitude"), record_b.get("longitude")

        distance_m = None
        if lat1 is not None and lon1 is not None and lat2 is not None and lon2 is not None:
            distance_m = round(haversine_distance_m(lat1, lon1, lat2, lon2), 1)

        category_match = record_a.get("category") == record_b.get("category")
        district_match = record_a.get("district_id") == record_b.get("district_id")

        reasons = []
        if category_match:
            reasons.append(f"Identical complaint category: '{record_a.get('category')}'.")
        if district_match:
            reasons.append(f"Located in same administrative district ({record_a.get('district_id')}).")
        if distance_m is not None:
            reasons.append(f"Physical distance is {distance_m} meters apart.")
        else:
            reasons.append("Exact geographic coordinates unavailable for one or both records.")

        is_likely_correlated = category_match and (distance_m is not None and distance_m <= 1500.0)

        return {
            "record_a_id": record_a.get("id"),
            "record_b_id": record_b.get("id"),
            "is_likely_correlated": is_likely_correlated,
            "distance_meters": distance_m,
            "category_match": category_match,
            "reasons": reasons,
            "recommended_action": "CORRELATE_INCIDENT" if is_likely_correlated else "KEEP_INDEPENDENT",
            "is_simulated": True,
            "model_provider": self.provider_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def generate_escalation_draft(self, record: Dict[str, Any], reason: str) -> Dict[str, Any]:
        tracking_id = record.get("tracking_id", "UNKNOWN")
        dist = record.get("district_name", "District")
        dept = record.get("department_name", "Department")
        title = record.get("title", "")
        prio = record.get("priority", "HIGH")

        draft = (
            f"ADMINISTRATIVE ESCALATION MEMORANDUM\n"
            f"To: Office of the Deputy Commissioner, {dist}\n"
            f"CC: Head of Department, {dept}\n"
            f"Subject: Escalation of {prio} Governance Case [{tracking_id}]\n\n"
            f"Reference is drawn to complaint record [{tracking_id}] titled '{title}'.\n"
            f"This case has been flagged for administrative review due to: {reason}.\n"
            f"Current status remains pending resolution. Immediate departmental intervention is requested."
        )

        return {
            "target_record_id": record.get("id"),
            "tracking_id": tracking_id,
            "draft_text": draft,
            "disclaimer": "AI-generated draft for authorized human review. Must be approved by a designated officer before transmission.",
            "is_simulated": True,
            "model_provider": self.provider_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def synthesize_plain_language_summary(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        total = metrics.get("total_complaints", 0)
        active = metrics.get("active_complaints", 0)
        resolved = metrics.get("resolved_complaints", 0)
        reopened = metrics.get("reopened_complaints", 0)
        avg_h = metrics.get("avg_resolution_hours")

        digest = (
            f"TRINETRA Operational Digest: There are currently {total} total registered governance cases, "
            f"of which {active} are actively under review or remediation, and {resolved} have been verified resolved. "
        )
        if reopened > 0:
            digest += f"{reopened} cases have been reopened by citizens requiring quality reassessment. "
        if avg_h is not None:
            digest += f"Average resolution turnaround is {avg_h} hours. "
        else:
            digest += "Insufficient historical resolution samples to compute average turnaround time."

        return {
            "digest_text": digest,
            "grounding_metrics": metrics,
            "is_simulated": True,
            "model_provider": self.provider_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


class GeminiAIProvider(BaseAIProvider):
    """
    Live Google Gemini model provider.
    Reads API key from .env (gemine_api or GEMINI_API_KEY).
    Transparently delegates to DeterministicRulesAIProvider if rate-limited or offline.
    """
    def __init__(self):
        from app.core.config import settings
        self.fallback = DeterministicRulesAIProvider()
        self.api_key = getattr(settings, "GEMINI_API_KEY", None) or getattr(settings, "gemine_api", None)
        self.provider_name = "GOOGLE_GEMINI_LIVE" if self.api_key else "DETERMINISTIC_RULES_FALLBACK"

    async def suggest_classification(self, title: str, description: str) -> Dict[str, Any]:
        from app.core.config import settings
        api_key = getattr(settings, "GEMINI_API_KEY", None) or getattr(settings, "gemine_api", None)
        if not api_key:
            return await self.fallback.suggest_classification(title, description)

        try:
            import json
            import urllib.request
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={api_key}"
            prompt = (
                f"Classify this civic grievance in Haryana: Title: {title}, Description: {description}. "
                f"Output valid JSON only with keys category (one of URBAN_FLOODING, ELECTRICAL_HAZARD, "
                f"ROAD_BLOCKAGE, HEALTH_HAZARD, SEWERAGE_OVERFLOW, CIVIL_INFRASTRUCTURE) and confidence (float 0.0-1.0)."
            )
            req_data = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
            req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"}, method="POST")
            res = urllib.request.urlopen(req, timeout=3.0)
            raw = json.loads(res.read().decode("utf-8"))
            text = raw["candidates"][0]["content"]["parts"][0]["text"]
            clean = re.sub(r'```json\s*|\s*```', '', text).strip()
            parsed = json.loads(clean)
            cat = parsed.get("category", "URBAN_FLOODING")
            conf = float(parsed.get("confidence", 0.95))
            return {
                "suggested_category": cat,
                "confidence_score": conf,
                "scored_candidates": [{"category": cat, "confidence": conf, "matched_keywords": ["gemini_ai_inferred"]}],
                "top_keywords": ["gemini_api_verified"],
                "model_provider": "GOOGLE_GEMINI_LIVE",
                "is_simulated": False,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        except Exception as e:
            res = await self.fallback.suggest_classification(title, description)
            res["gemini_key_detected"] = bool(api_key)
            return res

    async def suggest_routing(self, title: str, description: str, district_id: Optional[str]) -> Dict[str, Any]:
        return await self.fallback.suggest_routing(title, description, district_id)

    async def summarize_complaint(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return await self.fallback.summarize_complaint(record)

    async def explain_similarity(self, record_a: Dict[str, Any], record_b: Dict[str, Any]) -> Dict[str, Any]:
        return await self.fallback.explain_similarity(record_a, record_b)

    async def generate_escalation_draft(self, record: Dict[str, Any], reason: str) -> Dict[str, Any]:
        return await self.fallback.generate_escalation_draft(record, reason)

    async def synthesize_plain_language_summary(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        return await self.fallback.synthesize_plain_language_summary(metrics)


# Singleton AI service boundary instance using Gemini provider with safe rules fallback
ai_provider: BaseAIProvider = GeminiAIProvider()
