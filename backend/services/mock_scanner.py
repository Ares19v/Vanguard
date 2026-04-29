"""
Vanguard ASOC — Mock AWS scanner.
Generates a realistic, structured set of security findings without
making any real AWS API calls. This is the default when MOCK_MODE=true.
"""

from __future__ import annotations

import asyncio
import random
import uuid
from datetime import datetime
from typing import AsyncGenerator, List, Tuple

from models.schemas import AWSService, Finding, ScanReport, Severity
from services.risk_scorer import risk_scorer


MOCK_ACCOUNT_ID = "123456789012"
MOCK_REGION     = "us-east-1"


def _finding(
    service: AWSService,
    title: str,
    description: str,
    resource: str,
    finding_type: str,
    remediation_steps: List[str],
    metadata: dict | None = None,
) -> Finding:
    score, severity = risk_scorer.score(finding_type)
    return Finding(
        id=str(uuid.uuid4()),
        service=service,
        title=title,
        description=description,
        severity=severity,
        resource=resource,
        risk_score=score,
        remediation_steps=remediation_steps,
        region=MOCK_REGION,
        account_id=MOCK_ACCOUNT_ID,
        metadata=metadata or {},
        discovered_at=datetime.utcnow(),
    )


# ── Static finding catalogue ──────────────────────────────────────────────────
MOCK_FINDINGS: List[Finding] = [

    # S3
    _finding(
        AWSService.S3,
        "Public S3 Bucket — company-backups-2024",
        (
            "The S3 bucket 'company-backups-2024' has its ACL set to public-read, "
            "exposing 3,847 objects (142 GB) — including database dumps and config "
            "files — to the open internet. Any unauthenticated user can enumerate "
            "and download all objects."
        ),
        "arn:aws:s3:::company-backups-2024",
        "s3_public_acl",
        [
            "Open S3 → company-backups-2024 → Permissions",
            "Under 'Block public access', enable all four settings",
            "Remove any public grants from bucket and object ACLs",
            "Review bucket policy — remove Principal: '*' statements",
            "Enable SSE-KMS encryption on the bucket",
        ],
        {"object_count": 3847, "size_gb": 142.3, "public_since": "2024-01-15"},
    ),

    _finding(
        AWSService.S3,
        "S3 Bucket Policy Exposes All Objects — frontend-assets-prod",
        (
            "Bucket policy on 'frontend-assets-prod' grants s3:GetObject to '*'. "
            "While static assets are intentional, sensitive env config files "
            "(.env, appsettings.json) discovered in the bucket are also exposed."
        ),
        "arn:aws:s3:::frontend-assets-prod",
        "s3_public_acl",
        [
            "Audit bucket contents — move sensitive files to a private bucket",
            "Scope policy Principal to CloudFront OAI instead of '*'",
            "Enable S3 Access Analyzer for continuous visibility",
        ],
        {"object_count": 1203, "sensitive_files_found": 4},
    ),

    # IAM
    _finding(
        AWSService.IAM,
        "IAM Access Key Unused 183 Days — svc-deploy-legacy",
        (
            "Access key AKIAIOSFODNN7EXAMPLE for user 'svc-deploy-legacy' has "
            "not been used in 183 days. Stale credentials represent an "
            "undetected entry point if they were ever exposed."
        ),
        "arn:aws:iam::123456789012:user/svc-deploy-legacy",
        "iam_old_key",
        [
            "Verify: aws iam get-access-key-last-used --access-key-id AKIAIOSFODNN7EXAMPLE",
            "Deactivate: aws iam update-access-key --status Inactive --access-key-id AKIAIOSFODNN7EXAMPLE --user-name svc-deploy-legacy",
            "Delete after 30d: aws iam delete-access-key --access-key-id AKIAIOSFODNN7EXAMPLE --user-name svc-deploy-legacy",
            "Migrate to IAM Roles with temporary STS credentials",
        ],
        {"key_id": "AKIAIOSFODNN7EXAMPLE", "days_unused": 183, "user": "svc-deploy-legacy"},
    ),

    _finding(
        AWSService.IAM,
        "Root Account MFA Not Enabled",
        (
            "The AWS root account does not have MFA enabled. Root has unrestricted "
            "access to every service and resource. A compromised root account cannot "
            "be restricted by SCPs or IAM policies."
        ),
        "arn:aws:iam::123456789012:root",
        "iam_no_mfa",
        [
            "Sign in as root → IAM → Security credentials → MFA",
            "Activate a TOTP device (Google Authenticator / Authy)",
            "Store MFA recovery codes in an offline, secured location",
            "Create a daily-use IAM admin user — never use root operationally",
        ],
        {"mfa_enabled": False, "root_access_keys_active": 0},
    ),

    # EC2
    _finding(
        AWSService.EC2,
        "SG Allows SSH (Port 22) from 0.0.0.0/0 — WebServerSG",
        (
            "Security group sg-0a1b2c3d4e5f (WebServerSG) in vpc-abc123 permits "
            "inbound SSH from any IP address. Three EC2 instances are attached, "
            "exposing them to brute-force and exploitation attempts."
        ),
        "arn:aws:ec2:us-east-1:123456789012:security-group/sg-0a1b2c3d4e5f",
        "ec2_open_ssh",
        [
            "EC2 → Security Groups → sg-0a1b2c3d4e5f → Inbound rules",
            "Remove rule: Type=SSH, Source=0.0.0.0/0",
            "Replace with corporate IP CIDR or Session Manager (zero open ports)",
            "Enable VPC Flow Logs to audit existing connections",
        ],
        {"sg_id": "sg-0a1b2c3d4e5f", "sg_name": "WebServerSG", "vpc": "vpc-abc123", "attached_instances": 3},
    ),

    _finding(
        AWSService.EC2,
        "SG Allows RDP (Port 3389) from 0.0.0.0/0 — WindowsServerSG",
        (
            "Security group sg-9z8y7x6w5v (WindowsServerSG) allows inbound RDP "
            "from 0.0.0.0/0. RDP is the #1 initial access vector for ransomware "
            "operators and APT groups."
        ),
        "arn:aws:ec2:us-east-1:123456789012:security-group/sg-9z8y7x6w5v",
        "ec2_open_rdp",
        [
            "Remove 0.0.0.0/0 inbound rule for port 3389 immediately",
            "Enable Fleet Manager (agentless RDP via SSM — no open ports required)",
            "Add NACL deny rule for port 3389 at subnet level",
            "Deploy CloudWatch alert on EventID 4625 (failed RDP logins)",
        ],
        {"sg_id": "sg-9z8y7x6w5v", "sg_name": "WindowsServerSG", "attached_instances": 1},
    ),

    # RDS
    _finding(
        AWSService.RDS,
        "RDS Instance Publicly Accessible — prod-mysql-01",
        (
            "RDS MySQL instance 'prod-mysql-01' (db.r6g.xlarge) has "
            "PubliclyAccessible=True. The database is reachable on port 3306 "
            "from the open internet. Encryption at rest is disabled."
        ),
        "arn:aws:rds:us-east-1:123456789012:db:prod-mysql-01",
        "rds_public",
        [
            "aws rds modify-db-instance --db-instance-identifier prod-mysql-01 --no-publicly-accessible --apply-immediately",
            "Move instance to a private subnet with no IGW route",
            "Remove SG rules allowing 0.0.0.0/0 on port 3306",
            "Enable RDS encryption: snapshot → restore with KMS key",
        ],
        {"instance_class": "db.r6g.xlarge", "engine": "MySQL 8.0.35", "multi_az": True, "encrypted": False},
    ),

    # CloudTrail
    _finding(
        AWSService.CLOUDTRAIL,
        "CloudTrail Logging Disabled — us-east-1",
        (
            "No active CloudTrail trail is logging management events in us-east-1. "
            "Without CloudTrail, there is no audit log of any API call. Security "
            "incidents in this region cannot be investigated retroactively."
        ),
        "arn:aws:cloudtrail:us-east-1:123456789012:trail/*",
        "cloudtrail_disabled",
        [
            "aws cloudtrail create-trail --name vanguard-audit-trail --s3-bucket-name your-audit-logs-bucket",
            "aws cloudtrail start-logging --name vanguard-audit-trail",
            "Enable log file validation (--enable-log-file-validation)",
            "Route trail to CloudWatch Logs for real-time alerting",
            "Enable CloudTrail Insights for anomalous API rate detection",
        ],
        {"active_trails": 0, "regions_affected": ["us-east-1", "eu-west-1", "ap-southeast-1"]},
    ),

    # GuardDuty
    _finding(
        AWSService.GUARDDUTY,
        "GuardDuty — Console Login from TOR Exit Node: dev-contractor-01",
        (
            "GuardDuty detected a successful AWS Console login by 'dev-contractor-01' "
            "from 185.220.101.47 — a known TOR exit node. This strongly indicates "
            "credential compromise. The user has IAM:FullAccess policy attached."
        ),
        "arn:aws:iam::123456789012:user/dev-contractor-01",
        "guardduty_finding",
        [
            "Immediately disable all access keys: aws iam update-access-key --status Inactive",
            "Delete console password: aws iam delete-login-profile --user-name dev-contractor-01",
            "Review CloudTrail for ALL actions by this user in last 7 days",
            "Check for new IAM users/roles created, changes to bucket policies, SCPs",
            "Use IAM Access Analyzer to surface any new external resource shares",
            "Open a security incident response ticket",
        ],
        {
            "user": "dev-contractor-01",
            "source_ip": "185.220.101.47",
            "ip_type": "TOR_EXIT_NODE",
            "guardduty_finding_id": "fb7e9c4f2a3b1d8e",
            "user_policy": "IAMFullAccess",
        },
    ),
]


async def run_mock_scan() -> ScanReport:
    """Return a complete ScanReport from mock data (no AWS calls)."""
    import time
    start = time.time()
    await asyncio.sleep(0.1)  # tiny yield so this is truly async
    overall = risk_scorer.overall(MOCK_FINDINGS)
    duration = round(time.time() - start, 3)
    return ScanReport(
        scan_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        findings=MOCK_FINDINGS,
        overall_score=overall,
        mode="mock",
        services_scanned=["S3", "IAM", "EC2", "RDS", "CloudTrail", "GuardDuty"],
        duration_seconds=duration,
        account_id=MOCK_ACCOUNT_ID,
        region=MOCK_REGION,
    )


async def stream_mock_scan() -> AsyncGenerator[Tuple[str, Finding], None]:
    """
    Async generator — yields (service_name, finding) with realistic delays
    so the frontend can animate findings appearing one by one.
    """
    buckets: List[Tuple[str, List[Finding]]] = [
        ("S3",          MOCK_FINDINGS[0:2]),
        ("IAM",         MOCK_FINDINGS[2:4]),
        ("EC2",         MOCK_FINDINGS[4:6]),
        ("RDS",         MOCK_FINDINGS[6:7]),
        ("CloudTrail",  MOCK_FINDINGS[7:8]),
        ("GuardDuty",   MOCK_FINDINGS[8:9]),
    ]
    for service_name, findings in buckets:
        await asyncio.sleep(random.uniform(0.6, 1.4))
        for finding in findings:
            yield service_name, finding
            await asyncio.sleep(random.uniform(0.15, 0.5))


def get_finding_by_id(finding_id: str) -> Finding | None:
    """Look up a mock finding by ID."""
    return next((f for f in MOCK_FINDINGS if f.id == finding_id), None)
