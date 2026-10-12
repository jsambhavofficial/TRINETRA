"""
TRINETRA Phase 3 — CM Window Grievance Redressal Adapter Scaffolding.
Adapter boundary for Chief Minister's Grievance Redressal and Monitoring System.
"""
from typing import Any, Dict, List
from app.services.integrations.base import BaseHaryanaIntegrationAdapter, ProvenanceCategory


class HaryanaCMWindowAdapter(BaseHaryanaIntegrationAdapter):
    def __init__(self, api_endpoint: str = "https://cmwindow.haryana.gov.in/api/v1", is_mock: bool = True):
        super().__init__(
            system_id="HARYANA_CM_WINDOW",
            name="Haryana CM Window Grievance Portal",
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
            "disclaimer": "Scaffolded adapter. Awaiting state IT cell webhook integration."
        }

    async def ingest_external_records(self, limit: int = 10) -> List[Dict[str, Any]]:
        if self.is_mock:
            return [
                {
                    "external_id": "CMW/2026/GUR/00412",
                    "subject": "Delay in desilting drainage canal before monsoon",
                    "district": "HR-GU",
                    "status": "FORWARDED_TO_DC",
                    "provenance": self.build_provenance_metadata(
                        external_reference_id="CMW/2026/GUR/00412",
                        category=ProvenanceCategory.SYNTHETIC_DEMO,
                        details={"portal": "CM Window Haryana"}
                    )
                }
            ]
        return []
