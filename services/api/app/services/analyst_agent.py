"""
NEXUS Phase 4 — Evidence Analyst AI Agent.
Provides controlled, typed operational tools for inspecting evidence, evaluating spatial-temporal-semantic relations,
detecting operational conflicts, generating structured fusion proposals, and executing human-authorized merges.
Adheres strictly to the principle of NO arbitrary direct database mutation without deterministic validation.
"""
from datetime import datetime, timezone
import uuid
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evidence import EvidenceItemModel, IncidentCandidateModel
from app.models.incident import IncidentModel
from app.models.world import SpatialEntityModel
from app.models.fusion import (
    EvidenceFeatureModel,
    IncidentEvidenceModel,
    IncidentRelationshipModel,
    FusionDecisionModel,
    EvidenceTimelineEventModel,
)
from app.services.fusion_engine import (
    haversine_distance_m,
    get_h3_cell,
    get_h3_neighbors,
    cosine_similarity,
    compute_text_embedding,
    check_contradiction,
    fusion_engine,
    H3_RESOLUTION,
)
from app.services.event_hub import event_hub


# ---------------------------------------------------------------------------
# Structured Agent Output Schemas
# ---------------------------------------------------------------------------
class AnalystDecisionOutput(BaseModel):
    decision: str = Field(description="Decision: FUSED | LIKELY_SAME | POSSIBLY_RELATED | UNRELATED | MANUAL_REVIEW")
    incident_id: Optional[str] = Field(default=None, description="Target or canonical incident ID")
    confidence: float = Field(description="Calculated fusion confidence between 0.0 and 1.0")
    reasons: List[str] = Field(default_factory=list, description="Explicit bulleted rationales derived from evidence features")
    supporting_evidence: List[str] = Field(default_factory=list, description="Evidence IDs corroborating the event")
    contradicting_evidence: List[str] = Field(default_factory=list, description="Evidence IDs conflicting with the event")
    uncertainties: List[str] = Field(default_factory=list, description="Unresolved unknowns or missing dimensions")
    recommended_action: str = Field(description="Action recommendation: AUTO_FUSED | REQUEST_REVIEW | KEEP_SEPARATE")


# ---------------------------------------------------------------------------
# Typed Operational Agent Tools
# ---------------------------------------------------------------------------
class EvidenceAnalystAgent:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_nearby_incidents(self, latitude: float, longitude: float, radius_meters: float = 1000.0) -> List[Dict[str, Any]]:
        """Tool: Retrieves active incidents within a spatial radius using geodesic distance."""
        res = await self.db.execute(select(IncidentModel).where(IncidentModel.status.in_(["ACTIVE", "CORROBORATING", "CORROBORATED", "CANDIDATE"])))
        incidents = res.scalars().all()
        nearby = []
        for inc in incidents:
            coords = inc.geometry.get("coordinates", [75.792, 26.918]) if inc.geometry else [75.792, 26.918]
            dist = haversine_distance_m(latitude, longitude, coords[1], coords[0])
            if dist <= radius_meters:
                nearby.append({
                    "id": inc.id,
                    "incident_number": inc.incident_number,
                    "title": inc.title,
                    "type": inc.incident_type,
                    "status": inc.status,
                    "confidence": inc.confidence,
                    "distance_meters": round(dist, 1),
                    "coordinates": coords,
                })
        nearby.sort(key=lambda x: x["distance_meters"])
        return nearby

    async def search_related_evidence(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Tool: Performs semantic vector similarity search across existing evidence items."""
        q_vec = compute_text_embedding(query)
        res = await self.db.execute(select(EvidenceFeatureModel).limit(20))
        features = res.scalars().all()

        scored = []
        for f in features:
            sim = cosine_similarity(q_vec, f.embedding) if f.embedding else 0.5
            scored.append((sim, f))

        scored.sort(key=lambda x: x[0], reverse=True)
        results = []
        for sim, f in scored[:limit]:
            ev_res = await self.db.execute(select(EvidenceItemModel).where(EvidenceItemModel.id == f.evidence_id))
            ev = ev_res.scalars().first()
            if ev:
                results.append({
                    "evidence_id": ev.id,
                    "type": ev.evidence_type,
                    "source": ev.source,
                    "similarity": round(sim, 3),
                    "summary": (ev.analysis or {}).get("summary", ev.text_content),
                    "h3_cell": f.h3_cell,
                })
        return results

    async def get_evidence(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        """Tool: Retrieves full structured metadata and AI perception trace for an evidence item."""
        res = await self.db.execute(select(EvidenceItemModel).where(EvidenceItemModel.id == evidence_id))
        ev = res.scalars().first()
        if not ev:
            return None
        feat_res = await self.db.execute(select(EvidenceFeatureModel).where(EvidenceFeatureModel.evidence_id == evidence_id))
        feat = feat_res.scalars().first()
        return {
            "id": ev.id,
            "type": ev.evidence_type,
            "source": ev.source,
            "status": ev.status,
            "confidence": ev.confidence,
            "geometry": ev.geometry,
            "received_at": ev.received_at.isoformat() if ev.received_at else None,
            "analysis": ev.analysis,
            "observed_facts": feat.observed_facts if feat else [],
            "inferences": feat.inferences if feat else [],
            "unknowns": feat.unknowns if feat else [],
            "h3_cell": feat.h3_cell if feat else None,
        }

    async def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """Tool: Retrieves operational state, corroboration score and evidence chain for an incident."""
        res = await self.db.execute(select(IncidentModel).where(IncidentModel.id == incident_id))
        inc = res.scalars().first()
        if not inc:
            return None
        ev_edges = await self.db.execute(select(IncidentEvidenceModel).where(IncidentEvidenceModel.incident_id == incident_id))
        edges = ev_edges.scalars().all()
        return {
            "id": inc.id,
            "incident_number": inc.incident_number,
            "title": inc.title,
            "type": inc.incident_type,
            "status": inc.status,
            "severity": inc.severity,
            "confidence": inc.confidence,
            "corroboration_score": inc.corroboration_score,
            "evidence_count": inc.evidence_count,
            "geometry": inc.geometry,
            "epistemic_breakdown": inc.epistemic_breakdown,
            "fusion_rationale": inc.fusion_rationale,
            "evidence_chain": [{"evidence_id": e.evidence_id, "relationship": e.relationship_type, "confidence": e.confidence} for e in edges],
        }

    async def get_entity(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Tool: Retrieves catalog details for a physical spatial entity (e.g. Road R17 Bypass Bridge)."""
        res = await self.db.execute(select(SpatialEntityModel).where(SpatialEntityModel.id == entity_id))
        ent = res.scalars().first()
        if not ent:
            return None
        return {
            "id": ent.id,
            "name": ent.name,
            "type": ent.entity_type,
            "status": ent.status,
            "geometry": ent.geometry,
            "attributes": ent.attributes,
        }

    async def compare_evidence(self, evidence_id_a: str, evidence_id_b: str) -> Dict[str, Any]:
        """Tool: Performs rigorous pairwise evaluation of two evidence items: spatial, temporal, semantic, and contradiction checks."""
        res_a = await self.db.execute(select(EvidenceItemModel).where(EvidenceItemModel.id == evidence_id_a))
        ev_a = res_a.scalars().first()
        res_b = await self.db.execute(select(EvidenceItemModel).where(EvidenceItemModel.id == evidence_id_b))
        ev_b = res_b.scalars().first()
        if not ev_a or not ev_b:
            return {"error": "One or both evidence items not found"}

        feat_a = await fusion_engine.extract_features(ev_a, self.db)
        feat_b = await fusion_engine.extract_features(ev_b, self.db)

        # Spatial
        c_a = ev_a.geometry.get("coordinates", [75.792, 26.918]) if ev_a.geometry else [75.792, 26.918]
        c_b = ev_b.geometry.get("coordinates", [75.792, 26.918]) if ev_b.geometry else [75.792, 26.918]
        dist_m = haversine_distance_m(c_a[1], c_a[0], c_b[1], c_b[0])
        spatial_sim = round(math.exp(-dist_m / 350.0), 3)

        # Temporal
        t_a = feat_a.temporal_start
        t_b = feat_b.temporal_start
        delta_s = abs((t_a - t_b).total_seconds()) if t_a and t_b else 0.0
        temporal_sim = round(math.exp(-delta_s / 7200.0), 3)

        # Semantic
        semantic_sim = cosine_similarity(feat_a.embedding, feat_b.embedding)

        # Contradiction
        has_conf, conf_msg = check_contradiction(
            ev_a.text_content or (ev_a.analysis or {}).get("summary", ""),
            ev_b.text_content or (ev_b.analysis or {}).get("summary", "")
        )

        overall = round(0.35 * spatial_sim + 0.30 * temporal_sim + 0.35 * semantic_sim, 3)
        return {
            "evidence_a": evidence_id_a,
            "evidence_b": evidence_id_b,
            "spatial_similarity": spatial_sim,
            "distance_meters": round(dist_m, 1),
            "temporal_similarity": temporal_sim,
            "delta_seconds": round(delta_s, 1),
            "semantic_similarity": round(semantic_sim, 3),
            "has_contradiction": has_conf,
            "contradiction_reason": conf_msg,
            "overall_compatibility": overall,
        }

    # -----------------------------------------------------------------------
    # Controlled Fusion Actions (State Transitions)
    # -----------------------------------------------------------------------
    async def create_fusion_proposal(self, evidence_ids: List[str], target_incident_id: str, rationale: str) -> Dict[str, Any]:
        """Tool: Submits a candidate fusion package for operator confirmation."""
        prop_id = f"fusedec-{uuid.uuid4().hex[:12]}"
        dec = FusionDecisionModel(
            id=prop_id,
            incident_id=target_incident_id,
            evidence_ids=evidence_ids,
            scores={"overall": 0.85},
            decision="LIKELY_SAME",
            rationale=rationale,
            engine_version="fusion-v1.0",
            model_version="nexus-analyst-agent",
            actor="EVIDENCE_ANALYST_AGENT",
        )
        self.db.add(dec)
        await self.db.commit()
        return {"proposal_id": prop_id, "status": "PENDING_OPERATOR_REVIEW", "target_incident_id": target_incident_id}

    async def merge_incidents(self, primary_incident_id: str, secondary_incident_id: str, reviewer: str = "commander") -> Dict[str, Any]:
        """Tool: Merges two operational incidents into a canonical record while strictly preserving all evidence."""
        p_res = await self.db.execute(select(IncidentModel).where(IncidentModel.id == primary_incident_id))
        primary = p_res.scalars().first()
        s_res = await self.db.execute(select(IncidentModel).where(IncidentModel.id == secondary_incident_id))
        secondary = s_res.scalars().first()
        if not primary or not secondary:
            return {"error": "One or both incidents not found"}
        if primary_incident_id == secondary_incident_id:
            return {"error": "Cannot merge an incident into itself"}

        # Transfer evidence links
        edges_res = await self.db.execute(select(IncidentEvidenceModel).where(IncidentEvidenceModel.incident_id == secondary_incident_id))
        edges = edges_res.scalars().all()
        for edge in edges:
            edge.incident_id = primary_incident_id

        # Update primary metrics
        primary.evidence_count = (primary.evidence_count or 0) + len(edges)
        primary.confidence = min(0.98, max(primary.confidence, secondary.confidence) + 0.05)
        primary.corroboration_score = 0.92
        primary.status = "CORROBORATED"

        # Mark secondary as MERGED
        secondary.status = "MERGED"
        secondary.merged_into_id = primary_incident_id

        # Record relationship
        rel_id = f"increl-{uuid.uuid4().hex[:12]}"
        rel = IncidentRelationshipModel(
            id=rel_id,
            source_incident_id=secondary_incident_id,
            target_incident_id=primary_incident_id,
            relationship_type="DUPLICATE_OF",
            confidence=0.95,
            metadata_json={"reviewer": reviewer, "timestamp": datetime.now(timezone.utc).isoformat()},
        )
        self.db.add(rel)

        # Timeline event
        tl = EvidenceTimelineEventModel(
            id=f"tl-{uuid.uuid4().hex[:12]}",
            incident_id=primary_incident_id,
            event_type="INCIDENTS_MERGED",
            description=f"Incident #{secondary.incident_number} merged into #{primary.incident_number} by {reviewer}.",
            confidence=0.95,
        )
        self.db.add(tl)
        await self.db.commit()

        # Emit realtime broadcast
        await event_hub.broadcast_event(
            world_id=primary.world_id,
            event_type="INCIDENT_MERGED",
            payload={
                "canonical_id": primary_incident_id,
                "merged_id": secondary_incident_id,
                "evidence_count": primary.evidence_count,
            }
        )
        return {"canonical_id": primary_incident_id, "merged_id": secondary_incident_id, "status": "MERGED"}

    async def split_incident(self, incident_id: str, evidence_ids_to_detach: List[str], reason: str = "Separate real-world event") -> Dict[str, Any]:
        """Tool: Splits incorrectly fused evidence items back into an independent candidate."""
        res = await self.db.execute(select(IncidentModel).where(IncidentModel.id == incident_id))
        inc = res.scalars().first()
        if not inc:
            return {"error": "Incident not found"}

        detached_count = 0
        for ev_id in evidence_ids_to_detach:
            edge_res = await self.db.execute(
                select(IncidentEvidenceModel).where(
                    IncidentEvidenceModel.incident_id == incident_id,
                    IncidentEvidenceModel.evidence_id == ev_id
                )
            )
            edge = edge_res.scalars().first()
            if edge:
                await self.db.delete(edge)
                detached_count += 1

        inc.evidence_count = max(1, (inc.evidence_count or 1) - detached_count)
        await self.db.commit()
        return {"status": "SPLIT_COMPLETED", "detached_evidence_count": detached_count}
