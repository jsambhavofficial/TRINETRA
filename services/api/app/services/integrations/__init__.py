"""
TRINETRA Haryana Integration Adapters Export.
"""
from app.services.integrations.base import BaseHaryanaIntegrationAdapter, ProvenanceCategory
from app.services.integrations.saral import HaryanaSaralAdapter
from app.services.integrations.cm_window import HaryanaCMWindowAdapter
from app.services.integrations.dial112 import HaryanaDial112Adapter

ADAPTERS = [
    HaryanaSaralAdapter(),
    HaryanaCMWindowAdapter(),
    HaryanaDial112Adapter(),
]


async def get_all_integrations_status():
    statuses = []
    for a in ADAPTERS:
        st = await a.health_check()
        statuses.append(st)
    return statuses


__all__ = [
    "BaseHaryanaIntegrationAdapter",
    "ProvenanceCategory",
    "HaryanaSaralAdapter",
    "HaryanaCMWindowAdapter",
    "HaryanaDial112Adapter",
    "ADAPTERS",
    "get_all_integrations_status",
]
