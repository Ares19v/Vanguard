"""
Vanguard ASOC — Cost & Billing router
GET /api/v1/costs
"""

from __future__ import annotations

import logging

from fastapi import APIRouter

from config import settings
from models.schemas import CostResponse
from services.mock_costs import get_mock_costs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/costs", tags=["Costs"])


@router.get("", response_model=CostResponse)
async def get_costs():
    """
    Return cost and billing intelligence: MTD spend, forecast,
    per-service breakdown, daily trend, and idle resource waste.
    """
    if settings.mock_mode:
        return get_mock_costs()

    try:
        from services.cost_service import CostService
        svc = CostService()
        return await svc.get_costs()
    except Exception as exc:
        logger.error(f"Cost fetch error: {exc}")
        raise
