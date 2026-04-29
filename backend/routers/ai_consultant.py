"""
Vanguard ASOC — /api/v1/ai routes.
Gemini 1.5 Pro streaming chat and per-finding explanation endpoints.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest
from services.gemini_client import explain_finding, stream_chat
from services.mock_scanner import get_finding_by_id

logger = logging.getLogger(__name__)
router  = APIRouter(prefix="/ai", tags=["AI Consultant"])


@router.post("/chat")
async def chat(req: ChatRequest):
    """
    SSE streaming chat endpoint.
    Pass a finding_context to get hyper-specific security advice.
    Streams Gemini tokens back as Server-Sent Events.
    """
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages array is required")

    async def _event_stream():
        async for chunk in stream_chat(req.messages, req.finding_context):
            # SSE format: "data: <text>\n\n"
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":  "no-cache",
            "X-Accel-Buffering": "no",
            "Connection":     "keep-alive",
        },
    )


@router.get("/explain/{finding_id}")
async def explain(finding_id: str):
    """
    Auto-explain a specific finding by ID via SSE.
    The AI generates: risk rationale, exploitation path, step-by-step remediation.
    """
    finding = get_finding_by_id(finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding {finding_id} not found")

    async def _stream():
        async for chunk in explain_finding(finding):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        _stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
