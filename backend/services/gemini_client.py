"""
Vanguard ASOC — Gemini 1.5 Pro streaming client.
Wraps google-generativeai with a security-focused system prompt.
"""

from __future__ import annotations

import asyncio
import logging
from typing import AsyncGenerator, List, Optional

import google.generativeai as genai

from config import settings
from models.schemas import ChatMessage, Finding

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are Vanguard, a senior cloud security architect AI embedded in an Automated Security Operations Center.

Your persona:
- Cold, precise, and authoritative — no filler, no apologies
- You speak in confident, technical English — plain enough for a developer to act on immediately
- You never hallucinate AWS console paths, CLI commands, or CVE numbers
- When you cite a command, it must be real, copy-pasteable, and correct
- You keep answers structured: Risk → Root Cause → Impact → Remediation Steps (numbered)

Context: You are connected to a live (or simulated) AWS environment scan. When a user asks about a finding, you have access to its full metadata and can give hyper-specific advice.

If asked anything unrelated to cloud security, DevSecOps, or AWS, politely decline and redirect.
"""


def _init_model() -> genai.GenerativeModel:
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(
        model_name="gemini-1.5-pro-latest",
        system_instruction=_SYSTEM_PROMPT,
        generation_config=genai.GenerationConfig(
            temperature=0.3,
            top_p=0.95,
            max_output_tokens=2048,
        ),
    )


# ── Module-level model instance ───────────────────────────────────────────────
_model: Optional[genai.GenerativeModel] = None


def _get_model() -> genai.GenerativeModel:
    global _model
    if _model is None:
        _model = _init_model()
    return _model


def _build_history(messages: List[ChatMessage]) -> list:
    """Convert our ChatMessage list to Gemini SDK history format."""
    history = []
    for msg in messages[:-1]:  # All but last (last = current prompt)
        history.append({
            "role": "user" if msg.role == "user" else "model",
            "parts": [msg.content],
        })
    return history


def _inject_finding_context(
    prompt: str,
    finding: Optional[Finding],
) -> str:
    if not finding:
        return prompt
    ctx = (
        f"\n\n---\n📌 ACTIVE FINDING CONTEXT:\n"
        f"Service: {finding.service}\n"
        f"Title: {finding.title}\n"
        f"Severity: {finding.severity} (Risk Score: {finding.risk_score}/100)\n"
        f"Resource: {finding.resource}\n"
        f"Description: {finding.description}\n"
        f"Account: {finding.account_id or 'N/A'} | Region: {finding.region}\n"
        f"---\n\nUser question: {prompt}"
    )
    return ctx


async def stream_chat(
    messages: List[ChatMessage],
    finding_context: Optional[Finding] = None,
) -> AsyncGenerator[str, None]:
    """
    Stream Gemini tokens back as an async generator of text chunks.
    Usage: async for chunk in stream_chat(messages, finding): ...
    """
    model = _get_model()

    if not messages:
        yield "No messages provided."
        return

    last_msg = messages[-1]
    prompt   = _inject_finding_context(last_msg.content, finding_context)
    history  = _build_history(messages)

    try:
        chat_session = model.start_chat(history=history)

        # Use asyncio.to_thread so the sync Gemini SDK call doesn't block the event loop
        def _stream():
            return chat_session.send_message(prompt, stream=True)

        response = await asyncio.to_thread(_stream)

        for chunk in response:
            text = chunk.text if hasattr(chunk, "text") else ""
            if text:
                yield text

    except Exception as exc:
        logger.error(f"Gemini streaming error: {exc}")
        yield f"\n\n⚠️ Vanguard AI encountered an error: {exc}"


async def explain_finding(finding: Finding) -> AsyncGenerator[str, None]:
    """Auto-generate a security explanation for a specific finding."""
    prompt = (
        f"Explain this AWS security finding in detail:\n\n"
        f"**{finding.title}** (Severity: {finding.severity}, Score: {finding.risk_score}/100)\n\n"
        f"{finding.description}\n\n"
        "Provide: (1) Why this is dangerous, (2) How an attacker would exploit it, "
        "(3) Step-by-step remediation commands."
    )
    messages = [ChatMessage(role="user", content=prompt)]
    async for chunk in stream_chat(messages, finding_context=finding):
        yield chunk
