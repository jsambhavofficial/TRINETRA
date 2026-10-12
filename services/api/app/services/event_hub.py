"""
TRINETRA Phase 3 — Realtime Event Hub & Scoped WebSocket Connection Manager.
Maintains connection pools, extracts JWT credentials, enforces jurisdictional
scoping on event broadcasts, and clearly labels simulated telemetry.
"""
import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set
from fastapi import WebSocket
from app.core.logging import logger
from app.core.security import decode_access_token


class ConnectedClient:
    def __init__(self, websocket: WebSocket, user_info: Optional[Dict] = None):
        self.websocket = websocket
        self.user_id = user_info.get("sub") if user_info else None
        self.role = user_info.get("role") if user_info else "ANONYMOUS"
        self.district_id = user_info.get("district_id") if user_info else None
        self.department_id = user_info.get("department_id") if user_info else None

    def can_receive(
        self,
        event_district: Optional[str] = None,
        event_dept: Optional[str] = None,
        target_citizen: Optional[str] = None
    ) -> bool:
        if self.role in ("PLATFORM_ADMIN", "STATE_LEADERSHIP"):
            return True
        if self.role == "DISTRICT_ADMIN":
            return event_district is None or self.district_id == event_district
        if self.role == "DEPARTMENT":
            return event_dept is None or self.department_id == event_dept
        if self.role == "CITIZEN":
            return target_citizen is None or self.user_id == target_citizen
        # Anonymous or field officers: public / un-scoped events only
        return event_district is None and target_citizen is None


class EventHub:
    def __init__(self):
        # Maps world_id -> Set of ConnectedClient
        self._clients: Dict[str, Set[ConnectedClient]] = {}
        self._simulation_task: Optional[asyncio.Task] = None
        self._step_counter = 0

    async def connect(self, world_id: str, websocket: WebSocket, token: Optional[str] = None):
        await websocket.accept()
        user_info = None
        if token:
            try:
                user_info = decode_access_token(token)
            except Exception:
                pass

        client = ConnectedClient(websocket, user_info)
        if world_id not in self._clients:
            self._clients[world_id] = set()
        self._clients[world_id].add(client)
        logger.info(f"WebSocket client connected to {world_id} (Role: {client.role}). Total: {len(self._clients[world_id])}")

        # Ensure demo simulator is running
        if self._simulation_task is None or self._simulation_task.done():
            self._simulation_task = asyncio.create_task(self._demo_ticker())

    def disconnect(self, world_id: str, websocket: WebSocket):
        if world_id in self._clients:
            to_remove = [c for c in self._clients[world_id] if c.websocket == websocket]
            for c in to_remove:
                self._clients[world_id].discard(c)
            logger.info(f"WebSocket client disconnected from {world_id}. Remaining: {len(self._clients[world_id])}")

    async def broadcast_event(
        self,
        world_id: str,
        event_type: str,
        payload: dict,
        district_id: Optional[str] = None,
        department_id: Optional[str] = None,
        citizen_id: Optional[str] = None,
    ):
        if world_id not in self._clients or not self._clients[world_id]:
            return

        message = {
            "eventId": f"evt-{datetime.now(timezone.utc).timestamp()}",
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload
        }
        dead_clients = set()
        for client in self._clients[world_id]:
            if not client.can_receive(district_id, department_id, citizen_id):
                continue
            try:
                await client.websocket.send_json(message)
            except Exception:
                dead_clients.add(client)

        for client in dead_clients:
            self._clients[world_id].discard(client)

    async def _demo_ticker(self):
        """
        Background ticker that emits deterministic synthetic events in DEMO MODE.
        Clearly labeled as SIMULATED_DEMO and is_synthetic: True.
        """
        logger.info("Starting deterministic synthetic demo ticker...")
        path = [
            (75.794, 26.919, 44, "Approaching R17 intersection - slow water crossing"),
            (75.792, 26.918, 38, "Diverting to Hospital Bypass Boulevard"),
            (75.789, 26.917, 52, "Navigating clear bypass corridor"),
            (75.786, 26.918, 48, "Approaching Memorial Hospital west gate"),
            (75.791, 26.918, 15, "Arrived at Emergency Trauma Bay - Patient transfer"),
            (75.793, 26.919, 0, "On Scene at Central Memorial Hospital")
        ]

        while True:
            await asyncio.sleep(4.0)
            if not any(self._clients.values()):
                await asyncio.sleep(2.0)
                continue

            self._step_counter = (self._step_counter + 1) % len(path)
            lng, lat, speed, status_text = path[self._step_counter]

            for world_id in list(self._clients.keys()):
                await self.broadcast_event(
                    world_id=world_id,
                    event_type="ASSET_UPDATED",
                    payload={
                        "id": "ast-amb-102",
                        "status": "EN_ROUTE" if speed > 0 else "ON_SCENE",
                        "geometry": {
                            "latitude": lat,
                            "longitude": lng
                        },
                        "state": {
                            "speedKmh": speed,
                            "fuelLevelPct": max(60, 85 - self._step_counter * 2),
                            "crewCount": 3,
                            "assignedIncidentId": "inc-1047",
                            "routeBlocked": self._step_counter < 2,
                            "statusText": status_text,
                        },
                        # Phase 3 Provenance & Synthetic Labeling
                        "is_synthetic": True,
                        "telemetry_type": "SIMULATED_DEMO",
                        "data_provenance": "SYNTHETIC_SCENARIO_FEED"
                    }
                )


event_hub = EventHub()
