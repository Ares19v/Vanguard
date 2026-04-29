"""
Vanguard ASOC — /api/v1/scan routes.
Handles triggering scans, streaming results, and fetching scan history.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from config import settings
from db.database import get_db
from db.models import ScanRun
from models.schemas import ScanReport, ScanStatus, ScanSummary
from services.mock_scanner import get_finding_by_id, run_mock_scan, stream_mock_scan
from services.aws_scanner import AWSScanner

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scan", tags=["Scanner"])

# In-memory status tracker (simple for single-process deployment)
_scan_status: dict[str, str] = {"status": ScanStatus.IDLE, "current_scan_id": None}


def _save_scan(report: ScanReport, db: Session) -> None:
    """Persist a completed scan report to SQLite."""
    db.add(ScanRun(
        id=report.scan_id,
        timestamp=report.timestamp,
        overall_score=report.overall_score,
        finding_count=len(report.findings),
        critical_count=sum(1 for f in report.findings if f.severity == "CRITICAL"),
        high_count=sum(1 for f in report.findings if f.severity == "HIGH"),
        medium_count=sum(1 for f in report.findings if f.severity == "MEDIUM"),
        low_count=sum(1 for f in report.findings if f.severity == "LOW"),
        info_count=sum(1 for f in report.findings if f.severity == "INFO"),
        mode=report.mode,
        region=report.region,
        duration_seconds=report.duration_seconds,
        services_scanned=report.services_scanned,
        findings_json=[f.model_dump(mode="json") for f in report.findings],
    ))
    db.commit()


@router.get("/status")
async def get_scan_status():
    """Return the current scan status (idle/running/done/failed)."""
    return _scan_status


@router.post("", response_model=ScanReport)
async def trigger_scan(db: Session = Depends(get_db)):
    """
    Trigger a full AWS security scan.
    Uses mock data when MOCK_MODE=true, real boto3 when false.
    """
    if _scan_status["status"] == ScanStatus.RUNNING:
        raise HTTPException(status_code=409, detail="A scan is already in progress")

    _scan_status["status"] = ScanStatus.RUNNING
    try:
        if settings.mock_mode:
            report = await run_mock_scan()
        else:
            scanner = AWSScanner()
            report  = await scanner.run_full_scan()

        _scan_status["status"]          = ScanStatus.DONE
        _scan_status["current_scan_id"] = report.scan_id
        _save_scan(report, db)
        return report

    except Exception as exc:
        _scan_status["status"] = ScanStatus.FAILED
        logger.error(f"Scan failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/stream")
async def stream_scan():
    """
    SSE endpoint — streams scan findings one by one as they are discovered.
    Frontend can animate each check appearing in sequence.
    """
    async def event_generator():
        async for service, finding in stream_mock_scan():
            payload = json.dumps({
                "service": service,
                "finding": finding.model_dump(mode="json"),
            })
            yield f"data: {payload}\n\n"
        yield "data: {\"done\": true}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/history", response_model=list[ScanSummary])
async def get_scan_history(
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
):
    """Return the last N scan summaries (for the audit trail page)."""
    rows = db.query(ScanRun).order_by(ScanRun.timestamp.desc()).limit(limit).all()
    return [
        ScanSummary(
            scan_id=r.id,
            timestamp=r.timestamp,
            finding_count=r.finding_count,
            critical_count=r.critical_count,
            high_count=r.high_count,
            medium_count=r.medium_count,
            low_count=r.low_count,
            overall_score=r.overall_score,
            mode=r.mode,
            duration_seconds=r.duration_seconds,
            services_scanned=r.services_scanned or [],
        )
        for r in rows
    ]


@router.get("/{scan_id}", response_model=ScanReport)
async def get_scan_by_id(scan_id: str, db: Session = Depends(get_db)):
    """Return the full ScanReport for a specific scan (drill-in from history)."""
    row = db.query(ScanRun).filter(ScanRun.id == scan_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found")
    from models.schemas import Finding
    return ScanReport(
        scan_id=row.id,
        timestamp=row.timestamp,
        findings=[Finding(**f) for f in (row.findings_json or [])],
        overall_score=row.overall_score,
        mode=row.mode,
        services_scanned=row.services_scanned or [],
        duration_seconds=row.duration_seconds,
        region=row.region,
    )
