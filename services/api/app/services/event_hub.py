"""
Realtime Event Hub and WebSocket Connection Manager
Maintains world connection pools and broadcasts real operational telemetry events.
"""
import asyncio
from datetime import datetime, timezone
import json
from typing import Dict, List, Set
from fastapi import WebSocket
from app.core.logging import logger


class EventHub:
    def __init__(self):
        # Maps world_id -> Set of active WebSocket connections
        self._connections: Dict[str, Set[WebSocket]] = {}
        self._simulation_task: asyncio.Task = None
        self._step_counter = 0

    async def connect(self, world_id: str, websocket: WebSocket):
        await websocket.accept()
        if world_id not in self._connections:
            self._connections[world_id] = set()
        self._connections[world_id].add(websocket)
        logger.info(f"WebSocket client connected to world {world_id}. Total: {len(self._connections[world_id])}")

        # Ensure demo simulator is running
        if self._simulation_task is None or self._simulation_task.done():
            self._simulation_task = asyncio.create_task(self._demo_ticker())

    def disconnect(self, world_id: str, websocket: WebSocket):
        if world_id in self._connections:
            self._connections[world_id].discard(websocket)
            logger.info(f"WebSocket client disconnected from world {world_id}. Remaining: {len(self._connections[world_id])}")

    async def broadcast_event(self, world_id: str, event_type: str, payload: dict):
        if world_id not in self._connections or not self._connections[world_id]:
            return

        message = {
            "eventId": f"evt-{datetime.now(timezone.utc).timestamp()}",
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload
        }
        dead_connections = set()
        for ws in self._connections[world_id]:
            try:
                await ws.send_json(message)
            except Exception:
                dead_connections.add(ws)

        for ws in dead_connections:
            self._connections[world_id].discard(ws)

    async def _demo_ticker(self):
        """
        Background ticker that emits deterministic synthetic events in DEMO MODE.
        Moves Ambulance MED-102 along a predetermined trajectory.
        """
        logger.info("Starting deterministic synthetic demo ticker...")
        # Trajectory coordinates along Road R17 bypass towards Central Memorial Hospital
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
            if not any(self._connections.values()):
                # Sleep longer if no clients are listening
                await asyncio.sleep(2.0)
                continue

            self._step_counter = (self._step_counter + 1) % len(path)
            lng, lat, speed, status_text = path[self._step_counter]

            for world_id in list(self._connections.keys()):
                # 1. Broadcast ambulance movement
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
                            "destinationName": "Central Memorial Hospital"
                        },
                        "message": f"MED-102 Telemetry: {status_text} (Speed: {speed} km/h)"
                    }
                )

                # Periodic incident telemetry pulse
                if self._step_counter % 3 == 0:
                    await self.broadcast_event(
                        world_id=world_id,
                        event_type="INCIDENT_UPDATED",
                        payload={
                            "id": "inc-1047",
                            "status": "ACTIVE",
                            "confidence": 0.94,
                            "affectedEntityCount": 4,
                            "message": "Incident #1047: Runoff stabilized; water level 38cm on Road R17."
                        }
                    )


event_hub = EventHub()
