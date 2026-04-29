"""
Vanguard ASOC — CloudWatch Metrics router
GET /api/v1/metrics/{resource_id}
GET /api/v1/metrics          (all resources summary)
"""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Query

from config import settings
from models.schemas import ResourceMetrics
from services.mock_cloudwatch import get_all_mock_metrics, get_mock_metrics

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("", response_model=List[ResourceMetrics])
async def get_all_metrics():
    """Return metrics summary for all known resources."""
    if settings.mock_mode:
        return get_all_mock_metrics()

    try:
        from services.cloudwatch_service import CloudWatchService
        svc = CloudWatchService()
        return await svc.get_all()
    except Exception as exc:
        logger.error(f"Metrics error: {exc}")
        raise


@router.get("/{resource_id}", response_model=ResourceMetrics)
async def get_resource_metrics(
    resource_id: str,
    period: str = Query("24h", description="1h | 6h | 24h | 7d"),
):
    """Return detailed time-series metrics for a specific resource."""
    if settings.mock_mode:
        return get_mock_metrics(resource_id, period)

    try:
        from services.cloudwatch_service import CloudWatchService
        svc = CloudWatchService()
        return await svc.get_for_resource(resource_id, period)
    except Exception as exc:
        logger.error(f"Metrics error for {resource_id}: {exc}")
        raise
