"""
TRINETRA Phase 3 — Haryana ERSS Dial 112 CAD Integration Adapter Scaffolding.
Adapter boundary for Haryana Police Emergency Response Support System (ERSS Dial 112).
"""
from typing import Any, Dict, List
from app.services.integrations.base import BaseHaryanaIntegrationAdapter, ProvenanceCategory


class HaryanaDial112Adapter(BaseHaryanaIntegrationAdapter):
    def __init__(self, api_endpoint: str = "https://erss112.haryanapolice.gov.in/cad/v1", is_mock: bool = True):
        super().__init__(
            system_id="HARYANA_DIAL_112",
            name="Haryana Emergency Response Support System (ERSS Dial 112)",
            is_mock=is_mock
        )
        self.api_endpoint = api_endpoint

    async def health_check(self) -> Dict[str, Any]:
        return {
            "system_id": self.system_id,
            "name": self.name,
            "status": "CONFIGURED_STANDBY" if self.is_mock else "ONLINE",
            "is_mock": self.is_mock,
            "api_endpoint": self.api_endpoint,
            "disclaimer": "Scaffolded CAD adapter. Awaiting Haryana State Police Control Room gateway credentials."
        }

    async def ingest_external_records(self, limit: int = 10) -> List[Dict[str, Any]]:
        if self.is_mock:
            return [
                {
                    "external_id": "CAD-HR-2026-99014",
                    "event_type": "HIGHWAY_ROAD_BLOCKAGE",
                    "district": "HR-RO",
                    "cad_unit_dispatched": "PCR-ROH-04",
                    "provenance": self.build_provenance_metadata(
                        external_reference_id="CAD-HR-2026-99014",
                        category=ProvenanceCategory.SYNTHETIC_DEMO,
                        details={"control_room": "Panchkula ERSS Center"}
                    )
                }
            ]
        return []
