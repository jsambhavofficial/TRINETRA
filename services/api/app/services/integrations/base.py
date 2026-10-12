"""
TRINETRA Phase 3 — Haryana State System Integration Adapter Base.
Defines clean, documented interfaces for future authorized integrations with
Haryana government systems (Antyodaya SARAL, CM Window, Dial 112 CAD).
Enforces explicit data provenance recording and distinguishes live from scaffolding.
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from enum import Enum


class ProvenanceCategory(str, Enum):
    CITIZEN_SUBMITTED = "CITIZEN_SUBMITTED"
    DEPARTMENT_INPUT = "DEPARTMENT_INPUT"
    VERIFIED_EXTERNAL = "VERIFIED_EXTERNAL"
    PUBLIC_DATASET = "PUBLIC_DATASET"
    SYNTHETIC_DEMO = "SYNTHETIC_DEMO"
    DERIVED_AI_INSIGHT = "DERIVED_AI_INSIGHT"


class BaseHaryanaIntegrationAdapter(ABC):
    def __init__(self, system_id: str, name: str, is_mock: bool = True):
        self.system_id = system_id
        self.name = name
        self.is_mock = is_mock
        self.last_sync_time: Optional[datetime] = None

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Verifies network reachability, API key validity, or sandbox connectivity."""
        pass

    @abstractmethod
    async def ingest_external_records(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Safely fetches or stages external records with provenance tags."""
        pass

    def build_provenance_metadata(
        self,
        external_reference_id: str,
        category: ProvenanceCategory,
        details: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Constructs standardized immutable provenance block."""
        return {
            "source_type": category.value,
            "provider": self.name,
            "system_id": self.system_id,
            "external_reference_id": external_reference_id,
            "ingested_at": datetime.now(timezone.utc).isoformat(),
            "is_synthetic": self.is_mock,
            "verification_status": "SCAFFOLDED_STUB" if self.is_mock else "VERIFIED_LIVE",
            "details": details or {},
        }
