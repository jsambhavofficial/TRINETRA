"""
WebSocket Route for NEXUS Realtime Operational Stream.
Provides bidirectional event synchronization and telemetry streaming.
"""
from typing import Optional
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from app.services.event_hub import event_hub

router = APIRouter(tags=["Realtime"])


@router.websocket("/ws/world/{world_id}")
async def world_websocket_endpoint(
    websocket: WebSocket,
    world_id: str,
    token: Optional[str] = Query(None)
):
    await event_hub.connect(world_id, websocket, token=token)
    try:
        while True:
            # Receive client ping or filter updates
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        event_hub.disconnect(world_id, websocket)
    except Exception:
        event_hub.disconnect(world_id, websocket)

