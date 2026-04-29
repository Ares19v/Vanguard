"""
Vanguard ASOC — IAM Explorer router
GET /api/v1/iam
"""

from __future__ import annotations

import logging

from fastapi import APIRouter

from config import settings
from models.schemas import IAMResponse
from services.mock_iam import get_mock_iam

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/iam", tags=["IAM"])


@router.get("", response_model=IAMResponse)
async def get_iam():
    """
    Return full IAM posture: users, roles, MFA status,
    overprivileged accounts, and password policy.
    """
    if settings.mock_mode:
        return get_mock_iam()

    try:
        from services.iam_explorer import IAMExplorer
        svc = IAMExplorer()
        return await svc.get_full_posture()
    except Exception as exc:
        logger.error(f"IAM explorer error: {exc}")
        raise
