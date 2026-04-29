"""
Vanguard ASOC — Pydantic schemas (request/response models).
All API shapes are defined here for consistency across routers.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ══════════════════════════════════════════════════════════════════════════════
#  Enumerations
# ══════════════════════════════════════════════════════════════════════════════

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH     = "HIGH"
    MEDIUM   = "MEDIUM"
    LOW      = "LOW"
    INFO     = "INFO"


class AWSService(str, Enum):
    S3          = "S3"
    IAM         = "IAM"
    EC2         = "EC2"
    RDS         = "RDS"
    CLOUDTRAIL  = "CloudTrail"
    GUARDDUTY   = "GuardDuty"
    LAMBDA      = "Lambda"
    VPC         = "VPC"
    ECS         = "ECS"
    CLOUDFRONT  = "CloudFront"
    ELB         = "ELB"


class ScanStatus(str, Enum):
    IDLE    = "idle"
    RUNNING = "running"
    DONE    = "done"
    FAILED  = "failed"


class EventType(str, Enum):
    PORT_SCAN         = "PORT_SCAN"
    BRUTE_FORCE       = "BRUTE_FORCE"
    DATA_EXFIL        = "DATA_EXFIL"
    C2_BEACON         = "C2_BEACON"
    LATERAL_MOVEMENT  = "LATERAL_MOVEMENT"
    RECON             = "RECON"
    PRIVILEGE_ESC     = "PRIVILEGE_ESC"


class ResourceState(str, Enum):
    RUNNING   = "running"
    STOPPED   = "stopped"
    AVAILABLE = "available"
    PENDING   = "pending"
    DELETED   = "deleted"
    UNKNOWN   = "unknown"


# ══════════════════════════════════════════════════════════════════════════════
#  Security Findings
# ══════════════════════════════════════════════════════════════════════════════

class Finding(BaseModel):
    id: str                         = Field(default_factory=lambda: str(uuid.uuid4()))
    service: AWSService
    title: str
    description: str
    severity: Severity
    resource: str
    resource_arn: Optional[str]     = None
    risk_score: float               = Field(ge=0.0, le=100.0)
    remediation_steps: List[str]
    is_remediated: bool             = False
    region: str                     = "us-east-1"
    account_id: Optional[str]       = None
    metadata: Dict[str, Any]        = {}
    discovered_at: datetime         = Field(default_factory=datetime.utcnow)

    model_config = {"use_enum_values": True}


class ScanReport(BaseModel):
    scan_id: str                    = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime             = Field(default_factory=datetime.utcnow)
    findings: List[Finding]
    overall_score: float
    mode: str                       = "mock"   # "mock" | "live"
    services_scanned: List[str]     = []
    duration_seconds: float         = 0.0
    account_id: Optional[str]       = None
    region: str                     = "us-east-1"

    @property
    def critical_count(self) -> int:
        return sum(1 for f in self.findings if f.severity == Severity.CRITICAL)

    @property
    def high_count(self) -> int:
        return sum(1 for f in self.findings if f.severity == Severity.HIGH)


class ScanSummary(BaseModel):
    """Lightweight representation stored in scan history."""
    scan_id: str
    timestamp: datetime
    finding_count: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    overall_score: float
    mode: str
    duration_seconds: float
    services_scanned: List[str]


# ══════════════════════════════════════════════════════════════════════════════
#  Network Threats
# ══════════════════════════════════════════════════════════════════════════════

class GeoLocation(BaseModel):
    lat: float
    lon: float
    country: str
    city: str
    isp: Optional[str]  = None


class ThreatEvent(BaseModel):
    event_id: str                   = Field(default_factory=lambda: str(uuid.uuid4()))
    source_ip: str
    source_port: int
    target_ip: str
    target_port: int
    protocol: str                   = "TCP"
    event_type: EventType
    severity: Severity
    timestamp: datetime             = Field(default_factory=datetime.utcnow)
    geo: GeoLocation
    details: str
    bytes_transferred: Optional[int] = None
    ttl: Optional[int]              = None

    model_config = {"use_enum_values": True}


# ══════════════════════════════════════════════════════════════════════════════
#  AI Consultant
# ══════════════════════════════════════════════════════════════════════════════

class ChatMessage(BaseModel):
    role: str       # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    finding_context: Optional[Finding] = None


# ══════════════════════════════════════════════════════════════════════════════
#  Remediation
# ══════════════════════════════════════════════════════════════════════════════

class RemediationRequest(BaseModel):
    dry_run: bool           = True
    finding_ids: Optional[List[str]] = None     # None = all unfixed


class RemediationResult(BaseModel):
    finding_id: str
    dry_run: bool
    before: Dict[str, Any]
    after: Dict[str, Any]
    status: str             # "applied" | "dry_run_preview" | "failed"
    message: str
    commands_executed: List[str]  = []
    timestamp: datetime           = Field(default_factory=datetime.utcnow)


# ══════════════════════════════════════════════════════════════════════════════
#  Resource Inventory
# ══════════════════════════════════════════════════════════════════════════════

class EC2Instance(BaseModel):
    instance_id: str
    instance_type: str
    state: str
    public_ip: Optional[str]     = None
    private_ip: Optional[str]    = None
    public_dns: Optional[str]    = None
    ami_id: str                  = ""
    ami_name: Optional[str]      = None
    launch_time: datetime
    uptime_seconds: int          = 0
    availability_zone: str       = ""
    region: str                  = ""
    key_pair: Optional[str]      = None
    iam_role: Optional[str]      = None
    vpc_id: Optional[str]        = None
    subnet_id: Optional[str]     = None
    security_groups: List[Dict[str, str]] = []
    tags: Dict[str, str]         = {}
    platform: Optional[str]      = None
    architecture: str            = "x86_64"
    ebs_volumes: List[Dict[str, Any]] = []
    cpu_utilization: Optional[float]  = None   # avg last 24h %
    monthly_cost_estimate: Optional[float] = None


class S3BucketDetail(BaseModel):
    name: str
    region: str                  = ""
    creation_date: Optional[datetime] = None
    total_size_bytes: int        = 0
    total_size_gb: float         = 0.0
    object_count: int            = 0
    storage_class_breakdown: Dict[str, float] = {}
    versioning: str              = "Disabled"   # Enabled / Suspended / Disabled
    encryption: str              = "None"       # SSE-S3 / SSE-KMS / None
    public_access_blocked: bool  = True
    replication_enabled: bool    = False
    lifecycle_rules_count: int   = 0
    access_logs_enabled: bool    = False
    cors_enabled: bool           = False
    tags: Dict[str, str]         = {}
    estimated_monthly_cost: Optional[float] = None


class RDSInstance(BaseModel):
    instance_id: str
    engine: str
    engine_version: str          = ""
    instance_class: str
    status: str
    multi_az: bool               = False
    publicly_accessible: bool    = False
    allocated_storage_gb: int    = 0
    endpoint: Optional[str]      = None
    port: Optional[int]          = None
    region: str                  = ""
    availability_zone: str       = ""
    backup_retention_days: int   = 0
    encrypted: bool              = False
    deletion_protection: bool    = False
    tags: Dict[str, str]         = {}
    cpu_utilization: Optional[float]  = None
    free_storage_gb: Optional[float]  = None
    monthly_cost_estimate: Optional[float] = None


class LambdaFunction(BaseModel):
    function_name: str
    function_arn: str            = ""
    runtime: str
    handler: str                 = ""
    code_size_bytes: int         = 0
    memory_mb: int               = 128
    timeout_seconds: int         = 3
    last_modified: Optional[datetime] = None
    role: str                    = ""
    description: str             = ""
    region: str                  = ""
    invocations_24h: Optional[int]   = None
    errors_24h: Optional[int]        = None
    avg_duration_ms: Optional[float] = None
    monthly_cost_estimate: Optional[float] = None
    tags: Dict[str, str]         = {}


class VPCDetail(BaseModel):
    vpc_id: str
    cidr_block: str
    is_default: bool             = False
    state: str                   = "available"
    region: str                  = ""
    subnet_count: int            = 0
    subnets: List[Dict[str, Any]] = []
    internet_gateway_attached: bool = False
    nat_gateways: int            = 0
    route_tables: int            = 0
    security_groups: int         = 0
    tags: Dict[str, str]         = {}


class ElasticIP(BaseModel):
    allocation_id: str
    public_ip: str
    associated_instance: Optional[str] = None
    is_idle: bool                = True   # not associated = wasted money
    region: str                  = ""


class LoadBalancer(BaseModel):
    name: str
    arn: str                     = ""
    lb_type: str                 = "application"   # application / network
    scheme: str                  = "internet-facing"
    state: str                   = "active"
    dns_name: str                = ""
    region: str                  = ""
    availability_zones: List[str] = []
    target_group_count: int      = 0
    created_at: Optional[datetime] = None


class InventoryResponse(BaseModel):
    account_id: str              = ""
    region: str                  = ""
    all_regions: bool            = False
    regions_scanned: List[str]   = []
    ec2_instances: List[EC2Instance]     = []
    s3_buckets: List[S3BucketDetail]     = []
    rds_instances: List[RDSInstance]     = []
    lambda_functions: List[LambdaFunction] = []
    vpcs: List[VPCDetail]                = []
    elastic_ips: List[ElasticIP]         = []
    load_balancers: List[LoadBalancer]   = []
    total_resources: int         = 0
    idle_resources: int          = 0
    scanned_at: datetime         = Field(default_factory=datetime.utcnow)
    mode: str                    = "mock"


# ══════════════════════════════════════════════════════════════════════════════
#  Cost & Billing
# ══════════════════════════════════════════════════════════════════════════════

class DailyCost(BaseModel):
    date: str
    amount: float
    currency: str = "USD"


class ServiceCost(BaseModel):
    service: str
    amount: float
    percentage: float
    currency: str = "USD"


class IdleResource(BaseModel):
    resource_id: str
    resource_type: str
    reason: str
    estimated_monthly_waste: float
    region: str                  = ""
    recommendation: str          = ""


class CostResponse(BaseModel):
    account_id: str              = ""
    period_start: str            = ""
    period_end: str              = ""
    mtd_total: float             = 0.0
    mtd_change_pct: float        = 0.0   # vs last month same period
    forecasted_month_total: float = 0.0
    last_month_total: float      = 0.0
    currency: str                = "USD"
    daily_trend: List[DailyCost] = []
    by_service: List[ServiceCost] = []
    top_resource_costs: List[Dict[str, Any]] = []
    idle_resources: List[IdleResource] = []
    total_estimated_waste: float = 0.0
    mode: str                    = "mock"


# ══════════════════════════════════════════════════════════════════════════════
#  CloudWatch Metrics
# ══════════════════════════════════════════════════════════════════════════════

class MetricDataPoint(BaseModel):
    timestamp: str
    value: float
    unit: str = ""


class ResourceMetrics(BaseModel):
    resource_id: str
    resource_type: str           = "ec2"
    region: str                  = ""
    period: str                  = "24h"
    cpu_utilization: List[MetricDataPoint]    = []
    network_in_bytes: List[MetricDataPoint]   = []
    network_out_bytes: List[MetricDataPoint]  = []
    disk_read_bytes: List[MetricDataPoint]    = []
    disk_write_bytes: List[MetricDataPoint]   = []
    # RDS-specific
    free_storage_bytes: List[MetricDataPoint] = []
    db_connections: List[MetricDataPoint]     = []
    # Lambda-specific
    invocations: List[MetricDataPoint]        = []
    errors: List[MetricDataPoint]             = []
    duration_ms: List[MetricDataPoint]        = []
    throttles: List[MetricDataPoint]          = []
    # Summary stats
    avg_cpu: Optional[float]     = None
    max_cpu: Optional[float]     = None
    is_idle: bool                = False
    mode: str                    = "mock"


# ══════════════════════════════════════════════════════════════════════════════
#  IAM Explorer
# ══════════════════════════════════════════════════════════════════════════════

class IAMUser(BaseModel):
    user_id: str
    username: str
    arn: str                     = ""
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    console_access: bool         = False
    mfa_enabled: bool            = False
    access_keys: List[Dict[str, Any]] = []
    attached_policies: List[str] = []
    groups: List[str]            = []
    is_admin: bool               = False
    tags: Dict[str, str]         = {}


class IAMRole(BaseModel):
    role_id: str
    role_name: str
    arn: str                     = ""
    description: str             = ""
    created_at: Optional[datetime] = None
    trust_policy_principals: List[str] = []
    attached_policies: List[str] = []
    last_used: Optional[datetime] = None
    tags: Dict[str, str]         = {}


class PasswordPolicy(BaseModel):
    minimum_length: int          = 8
    require_uppercase: bool      = False
    require_lowercase: bool      = False
    require_numbers: bool        = False
    require_symbols: bool        = False
    max_age_days: Optional[int]  = None
    prevent_reuse: Optional[int] = None
    hard_expiry: bool            = False


class IAMResponse(BaseModel):
    account_id: str              = ""
    users: List[IAMUser]         = []
    roles: List[IAMRole]         = []
    password_policy: Optional[PasswordPolicy] = None
    total_users: int             = 0
    users_without_mfa: int       = 0
    admin_users: int             = 0
    users_with_console_no_mfa: int = 0
    mode: str                    = "mock"


# ══════════════════════════════════════════════════════════════════════════════
#  Settings / Auth
# ══════════════════════════════════════════════════════════════════════════════

class ConnectRequest(BaseModel):
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_default_region: str      = "us-east-1"
    aws_session_token: Optional[str] = None
    gemini_api_key: Optional[str]    = None
    mock_mode: bool              = False
    dry_run: bool                = True
    save_to_env: bool            = True
    scan_all_regions: bool       = False


class ConnectResponse(BaseModel):
    success: bool
    account_id: str              = ""
    account_alias: Optional[str] = None
    user_arn: str                = ""
    regions_available: List[str] = []
    message: str                 = ""


class AppSettings(BaseModel):
    mock_mode: bool
    dry_run: bool
    aws_default_region: str
    scan_all_regions: bool       = False
    aws_connected: bool          = False
    account_id: Optional[str]    = None
    version: str                 = "1.0.0"


# ══════════════════════════════════════════════════════════════════════════════
#  Meta
# ══════════════════════════════════════════════════════════════════════════════

class HealthResponse(BaseModel):
    status: str
    mode: str
    dry_run: bool
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
