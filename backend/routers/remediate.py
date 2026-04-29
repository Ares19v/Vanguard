"""
Vanguard ASOC — /api/v1/remediate routes.
"""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config import settings
from db.database import get_db
from db.models import RemediationLog
from models.schemas import Finding, RemediationRequest, RemediationResult
from services.mock_scanner import MOCK_FINDINGS, get_finding_by_id
from services.remediator import remediate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/remediate", tags=["Remediator"])


def _log_result(result: RemediationResult, finding: Finding, db: Session) -> None:
    db.add(RemediationLog(
        finding_id=result.finding_id,
        service=str(finding.service),
        resource=finding.resource,
        severity=str(finding.severity),
        dry_run=result.dry_run,
        status=result.status,
        before_state=result.before,
        after_state=result.after,
        message=result.message,
    ))
    db.commit()


@router.post("/{finding_id}", response_model=RemediationResult)
async def remediate_finding(
    finding_id: str,
    req: RemediationRequest = RemediationRequest(),
    db: Session = Depends(get_db),
):
    """
    Remediate a single finding by ID.
    - dry_run=true (default): returns a before/after diff, no AWS changes
    - dry_run=false + MOCK_MODE=false: executes real AWS remediation
    """
    finding = get_finding_by_id(finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding {finding_id} not found")

    result = await remediate(finding, dry_run=req.dry_run)
    _log_result(result, finding, db)
    return result


@router.post("/bulk", response_model=List[RemediationResult])
async def remediate_bulk(
    req: RemediationRequest,
    db: Session = Depends(get_db),
):
    """
    Bulk remediation — pass a list of finding_ids (or omit for all unfixed findings).
    All respect the dry_run flag.
    """
    if req.finding_ids:
        findings = [f for f in MOCK_FINDINGS if f.id in req.finding_ids]
    else:
        findings = [f for f in MOCK_FINDINGS if not f.is_remediated]

    if not findings:
        raise HTTPException(status_code=404, detail="No matching findings to remediate")

    results: List[RemediationResult] = []
    for finding in findings:
        result = await remediate(finding, dry_run=req.dry_run)
        _log_result(result, finding, db)
        results.append(result)

    return results
