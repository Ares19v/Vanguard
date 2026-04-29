"""
Vanguard ASOC — SQLAlchemy ORM models.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.sql import func

from db.database import Base


class ScanRun(Base):
    """One complete AWS scan session."""
    __tablename__ = "scan_runs"

    id               = Column(String,  primary_key=True)
    timestamp        = Column(DateTime, default=func.now())
    overall_score    = Column(Float,   default=0.0)
    finding_count    = Column(Integer, default=0)
    critical_count   = Column(Integer, default=0)
    high_count       = Column(Integer, default=0)
    medium_count     = Column(Integer, default=0)
    low_count        = Column(Integer, default=0)
    info_count       = Column(Integer, default=0)
    mode             = Column(String,  default="mock")
    region           = Column(String,  default="us-east-1")
    duration_seconds = Column(Float,   default=0.0)
    services_scanned = Column(JSON,    default=list)
    findings_json    = Column(JSON,    default=list)    # full Finding list serialised


class RemediationLog(Base):
    """Audit trail for every remediation action (live or dry-run)."""
    __tablename__ = "remediation_log"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    finding_id   = Column(String,  nullable=False, index=True)
    scan_id      = Column(String,  nullable=True)
    service      = Column(String)
    resource     = Column(String)
    severity     = Column(String)
    dry_run      = Column(Boolean, default=True)
    status       = Column(String)
    before_state = Column(JSON)
    after_state  = Column(JSON)
    timestamp    = Column(DateTime, default=func.now())
    message      = Column(Text)
