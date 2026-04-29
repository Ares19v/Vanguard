"""
Vanguard ASOC — /api/v1/threats routes.
WebSocket streaming + REST summary endpoint.
"""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.threat_engine import generate_burst, threat_stream

logger = logging.getLogger(__name__)
router  = APIRouter(prefix="/threats", tags=["Threat Feed"])


@router.websocket("/stream")
async def threats_websocket(ws: WebSocket):
    """
    WebSocket endpoint — streams ThreatEvent JSON continuously.
    On connect: sends 50 historical events immediately, then live stream.
    """
    await ws.accept()
    logger.info(f"Threat feed client connected: {ws.client}")

    try:
        # Seed the feed with a burst of historical events
        for event in generate_burst(n=50):
            await ws.send_text(event.model_dump_json())
            await asyncio.sleep(0.02)   # stagger seed events slightly

        # Then stream live events indefinitely
        async for event in threat_stream():
            await ws.send_text(event.model_dump_json())

    except WebSocketDisconnect:
        logger.info(f"Threat feed client disconnected: {ws.client}")
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")
        try:
            await ws.close(code=1011)
        except Exception:
            pass


@router.get("/summary")
async def threats_summary(n: int = 100):
    """
    REST fallback — returns N pre-generated threat events.
    Useful for initial page load without WebSocket.
    """
    events = generate_burst(n=min(n, 500))
    return [e.model_dump() for e in events]
