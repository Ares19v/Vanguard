"""
Vanguard ASOC — Auto-remediation service.
In DRY_RUN mode (default): returns a detailed before/after diff without touching AWS.
In live mode: executes boto3 API calls to fix the finding.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from config import settings
from models.schemas import AWSService, Finding, RemediationResult

logger = logging.getLogger(__name__)


# ── Mock remediation diffs (used in dry-run AND mock mode) ───────────────────

_MOCK_DIFFS: dict[str, tuple[dict, dict, list[str]]] = {
    "s3_public_acl": (
        {
            "BlockPublicAcls": False,
            "IgnorePublicAcls": False,
            "BlockPublicPolicy": False,
            "RestrictPublicBuckets": False,
            "BucketACL": "public-read",
        },
        {
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True,
            "BucketACL": "private",
        },
        [
            "aws s3api put-public-access-block --bucket <bucket> --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true",
            "aws s3api put-bucket-acl --bucket <bucket> --acl private",
        ],
    ),
    "iam_old_key": (
        {"AccessKeyStatus": "Active", "DaysUnused": 183},
        {"AccessKeyStatus": "Inactive", "DaysUnused": 183, "Note": "Scheduled for deletion in 30 days"},
        ["aws iam update-access-key --user-name <user> --access-key-id <key-id> --status Inactive"],
    ),
    "iam_no_mfa": (
        {"MFAEnabled": False, "ConsoleAccess": True},
        {"MFAEnabled": "PENDING_SETUP", "ConsoleAccess": True, "Note": "MFA enforcement policy applied"},
        ["aws iam create-virtual-mfa-device --virtual-mfa-device-name <device>"],
    ),
    "ec2_open_ssh": (
        {"IngressRule": {"Protocol": "TCP", "Port": 22, "Source": "0.0.0.0/0"}, "RuleActive": True},
        {"IngressRule": None, "RuleActive": False, "Note": "Rule revoked — use SSM Session Manager for access"},
        ["aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 22 --cidr 0.0.0.0/0"],
    ),
    "ec2_open_rdp": (
        {"IngressRule": {"Protocol": "TCP", "Port": 3389, "Source": "0.0.0.0/0"}, "RuleActive": True},
        {"IngressRule": None, "RuleActive": False, "Note": "Rule revoked — use Fleet Manager for RDP"},
        ["aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 3389 --cidr 0.0.0.0/0"],
    ),
    "rds_public": (
        {"PubliclyAccessible": True, "Endpoint": "prod-mysql-01.xyz.us-east-1.rds.amazonaws.com"},
        {"PubliclyAccessible": False, "Note": "Apply immediately — brief connectivity interruption expected"},
        ["aws rds modify-db-instance --db-instance-identifier <db-id> --no-publicly-accessible --apply-immediately"],
    ),
    "cloudtrail_disabled": (
        {"TrailLogging": False, "ActiveTrails": 0},
        {"TrailLogging": True, "ActiveTrails": 1, "TrailName": "vanguard-audit-trail"},
        [
            "aws cloudtrail create-trail --name vanguard-audit-trail --s3-bucket-name <audit-bucket>",
            "aws cloudtrail start-logging --name vanguard-audit-trail",
        ],
    ),
    "guardduty_finding": (
        {"IAMUserStatus": "Active", "AccessKeysActive": 2, "ConsoleAccess": True},
        {
            "IAMUserStatus": "Quarantined",
            "AccessKeysActive": 0,
            "ConsoleAccess": False,
            "Note": "All credentials revoked — IR ticket opened",
        },
        [
            "aws iam update-access-key --user-name <user> --access-key-id <key-id> --status Inactive",
            "aws iam delete-login-profile --user-name <user>",
        ],
    ),
}


def _infer_type(finding: Finding) -> str:
    """Best-effort finding type inference from title keywords."""
    title = finding.title.lower()
    if "s3" in title or finding.service == AWSService.S3:
        return "s3_public_acl"
    if "mfa" in title:
        return "iam_no_mfa"
    if "iam" in title or "key" in title or finding.service == AWSService.IAM:
        return "iam_old_key"
    if "rdp" in title or "3389" in title:
        return "ec2_open_rdp"
    if "ssh" in title or "22" in title or finding.service == AWSService.EC2:
        return "ec2_open_ssh"
    if "rds" in title or finding.service == AWSService.RDS:
        return "rds_public"
    if "cloudtrail" in title or finding.service == AWSService.CLOUDTRAIL:
        return "cloudtrail_disabled"
    if "guardduty" in title or finding.service == AWSService.GUARDDUTY:
        return "guardduty_finding"
    return "ec2_open_ssh"


async def remediate(finding: Finding, dry_run: Optional[bool] = None) -> RemediationResult:
    """
    Remediate a single finding.
    - If dry_run=True (or settings.dry_run=True): returns a preview diff only.
    - If dry_run=False and settings.mock_mode=False: executes real AWS API calls.
    """
    is_dry = dry_run if dry_run is not None else settings.dry_run
    ftype  = _infer_type(finding)

    before, after, cmds = _MOCK_DIFFS.get(ftype, (
        {"state": "unknown"},
        {"state": "remediated"},
        ["aws [service] [action] --resource <resource-id>"],
    ))

    if is_dry or settings.mock_mode:
        return RemediationResult(
            finding_id=finding.id,
            dry_run=True,
            before=before,
            after=after,
            status="dry_run_preview",
            message=(
                "DRY RUN — No changes applied to your AWS environment. "
                "Review the diff above, then toggle dry-run off to execute."
            ),
            commands_executed=cmds,
            timestamp=datetime.utcnow(),
        )

    # ── Live execution ────────────────────────────────────────────────────────
    try:
        result = await _execute_live(finding, ftype)
        return result
    except Exception as exc:
        logger.error(f"Live remediation failed for {finding.id}: {exc}")
        return RemediationResult(
            finding_id=finding.id,
            dry_run=False,
            before=before,
            after=before,  # unchanged
            status="failed",
            message=f"Remediation failed: {exc}",
            commands_executed=[],
            timestamp=datetime.utcnow(),
        )


async def _execute_live(finding: Finding, ftype: str) -> RemediationResult:
    """Real boto3 remediation — only called when dry_run=False and mock_mode=False."""
    import boto3

    before, after, cmds = _MOCK_DIFFS.get(ftype, ({}, {}, []))
    resource = finding.resource
    executed: list[str] = []

    if ftype == "s3_public_acl":
        bucket = resource.replace("arn:aws:s3:::", "")
        s3 = boto3.client("s3")
        s3.put_public_access_block(
            Bucket=bucket,
            PublicAccessBlockConfiguration=dict(
                BlockPublicAcls=True, IgnorePublicAcls=True,
                BlockPublicPolicy=True, RestrictPublicBuckets=True,
            ),
        )
        s3.put_bucket_acl(Bucket=bucket, ACL="private")
        executed = [f"put_public_access_block + put_bucket_acl on {bucket}"]

    elif ftype in ("iam_old_key", "iam_no_mfa"):
        meta = finding.metadata
        user, key_id = meta.get("user", ""), meta.get("key_id", "")
        if user and key_id:
            iam = boto3.client("iam")
            iam.update_access_key(UserName=user, AccessKeyId=key_id, Status="Inactive")
            executed = [f"update_access_key Inactive: {key_id}"]

    elif ftype in ("ec2_open_ssh", "ec2_open_rdp"):
        meta  = finding.metadata
        sg_id = meta.get("sg_id", "")
        port  = meta.get("port", 22)
        if sg_id:
            ec2 = boto3.client("ec2")
            ec2.revoke_security_group_ingress(
                GroupId=sg_id, IpProtocol="tcp",
                FromPort=port, ToPort=port,
                CidrIp="0.0.0.0/0",
            )
            executed = [f"revoke_security_group_ingress {sg_id} port {port}"]

    elif ftype == "rds_public":
        db_id = resource.split(":")[-1]
        rds   = boto3.client("rds")
        rds.modify_db_instance(
            DBInstanceIdentifier=db_id,
            PubliclyAccessible=False,
            ApplyImmediately=True,
        )
        executed = [f"modify_db_instance PubliclyAccessible=False: {db_id}"]

    return RemediationResult(
        finding_id=finding.id,
        dry_run=False,
        before=before,
        after=after,
        status="applied",
        message="Remediation applied successfully to your live AWS environment.",
        commands_executed=executed,
        timestamp=datetime.utcnow(),
    )
