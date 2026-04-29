"""
Vanguard ASOC — Resource Inventory router
GET /api/v1/inventory
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Query

from config import settings
from models.schemas import InventoryResponse
from services.mock_inventory import get_mock_inventory

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("", response_model=InventoryResponse)
async def get_inventory(
    all_regions: bool = Query(False, description="Scan all AWS regions (slower)"),
):
    """
    Return a full snapshot of all AWS resources in the account.
    Supports single-region (fast) and all-region (comprehensive) modes.
    """
    if settings.mock_mode:
        return get_mock_inventory(all_regions=all_regions)

    # Live mode — real boto3 calls
    try:
        from services.resource_inventory import AWSInventory
        scanner = AWSInventory()
        return await scanner.run(all_regions=all_regions)
    except Exception as exc:
        logger.error(f"Inventory error: {exc}")
        raise
