"""
Vanguard ASOC — Real AWS scanner (boto3).
Only runs when MOCK_MODE=false in config.
"""

from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from config import settings
from models.schemas import AWSService, Finding, ScanReport
from services.risk_scorer import risk_scorer

logger = logging.getLogger(__name__)


def _client(service: str, region: Optional[str] = None):
    kwargs: dict = {"region_name": region or settings.aws_default_region}
    if settings.aws_access_key_id:
        kwargs["aws_access_key_id"]     = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
    if settings.aws_session_token:
        kwargs["aws_session_token"] = settings.aws_session_token
    return boto3.client(service, **kwargs)


class AWSScanner:
    def __init__(self) -> None:
        self.findings: List[Finding] = []
        self.account_id: str = "unknown"

    # ── Account identity ──────────────────────────────────────────────────────
    def _resolve_account(self) -> str:
        try:
            return _client("sts").get_caller_identity()["Account"]
        except Exception:
            return "unknown"

    # ── S3 ────────────────────────────────────────────────────────────────────
    def scan_s3(self) -> List[Finding]:
        findings: List[Finding] = []
        try:
            s3 = _client("s3")
            for bucket in s3.list_buckets().get("Buckets", []):
                name = bucket["Name"]
                arn  = f"arn:aws:s3:::{name}"
                try:
                    cfg = s3.get_public_access_block(Bucket=name)[
                        "PublicAccessBlockConfiguration"
                    ]
                    if not all([cfg.get(k, False) for k in (
                        "BlockPublicAcls", "BlockPublicPolicy",
                        "IgnorePublicAcls", "RestrictPublicBuckets",
                    )]):
                        score, sev = risk_scorer.score("s3_public_acl")
                        findings.append(Finding(
                            service=AWSService.S3,
                            title=f"S3 Public Access Not Fully Blocked: {name}",
                            description=f"Bucket '{name}' has one or more public access block settings disabled.",
                            severity=sev, resource=arn, risk_score=score,
                            remediation_steps=[
                                f"aws s3api put-public-access-block --bucket {name} "
                                "--public-access-block-configuration "
                                "BlockPublicAcls=true,IgnorePublicAcls=true,"
                                "BlockPublicPolicy=true,RestrictPublicBuckets=true"
                            ],
                        ))
                except s3.exceptions.NoSuchPublicAccessBlockConfiguration:
                    score, sev = risk_scorer.score("s3_public_acl")
                    findings.append(Finding(
                        service=AWSService.S3,
                        title=f"S3 No Public Access Block Config: {name}",
                        description=f"Bucket '{name}' has no public access block configuration at all.",
                        severity=sev, resource=arn, risk_score=score,
                        remediation_steps=[
                            f"Configure public access block for bucket '{name}'",
                        ],
                    ))
        except NoCredentialsError:
            logger.error("AWS credentials not found — set them in .env or environment")
        except Exception as exc:
            logger.error(f"S3 scan error: {exc}")
        return findings

    # ── IAM ───────────────────────────────────────────────────────────────────
    def scan_iam(self) -> List[Finding]:
        findings: List[Finding] = []
        try:
            iam     = _client("iam")
            cutoff  = datetime.utcnow() - timedelta(days=90)

            for user in iam.list_users().get("Users", []):
                uname = user["UserName"]
                for key in iam.list_access_keys(UserName=uname).get("AccessKeyMetadata", []):
                    if key["Status"] != "Active":
                        continue
                    kid = key["AccessKeyId"]
                    try:
                        last = iam.get_access_key_last_used(AccessKeyId=kid)
                        used = last.get("AccessKeyLastUsed", {}).get("LastUsedDate")
                        if used and used.replace(tzinfo=None) < cutoff:
                            days = (datetime.utcnow() - used.replace(tzinfo=None)).days
                            score, sev = risk_scorer.score("iam_old_key")
                            findings.append(Finding(
                                service=AWSService.IAM,
                                title=f"Stale IAM Key ({days}d): {uname}",
                                description=f"Key {kid[:10]}... for '{uname}' unused for {days} days.",
                                severity=sev,
                                resource=f"arn:aws:iam::{self.account_id}:user/{uname}",
                                risk_score=score,
                                remediation_steps=[
                                    f"aws iam update-access-key --user-name {uname} --access-key-id {kid} --status Inactive",
                                ],
                                metadata={"key_id": kid, "days_unused": days, "user": uname},
                            ))
                    except ClientError:
                        pass
        except Exception as exc:
            logger.error(f"IAM scan error: {exc}")
        return findings

    # ── EC2 ───────────────────────────────────────────────────────────────────
    def scan_ec2(self) -> List[Finding]:
        findings: List[Finding] = []
        SENSITIVE = {22: "SSH", 3389: "RDP", 3306: "MySQL",
                     5432: "PostgreSQL", 27017: "MongoDB",
                     6379: "Redis", 9200: "Elasticsearch"}
        try:
            ec2 = _client("ec2")
            for sg in ec2.describe_security_groups().get("SecurityGroups", []):
                sg_id, sg_name = sg["GroupId"], sg.get("GroupName", "")
                for perm in sg.get("IpPermissions", []):
                    fp = perm.get("FromPort", 0)
                    tp = perm.get("ToPort", 65535)
                    for ip in perm.get("IpRanges", []):
                        if ip.get("CidrIp") != "0.0.0.0/0":
                            continue
                        for port, name in SENSITIVE.items():
                            if fp <= port <= tp:
                                ftype = "ec2_open_rdp" if port == 3389 else "ec2_open_ssh"
                                score, sev = risk_scorer.score(ftype)
                                findings.append(Finding(
                                    service=AWSService.EC2,
                                    title=f"SG Allows {name} (:{port}) from 0.0.0.0/0: {sg_name}",
                                    description=f"Security group {sg_id} ({sg_name}) allows inbound {name} from any IP.",
                                    severity=sev,
                                    resource=f"arn:aws:ec2:{settings.aws_default_region}:{self.account_id}:security-group/{sg_id}",
                                    risk_score=score,
                                    remediation_steps=[
                                        f"aws ec2 revoke-security-group-ingress --group-id {sg_id} --protocol tcp --port {port} --cidr 0.0.0.0/0",
                                    ],
                                    metadata={"sg_id": sg_id, "port": port},
                                ))
        except Exception as exc:
            logger.error(f"EC2 scan error: {exc}")
        return findings

    # ── RDS ───────────────────────────────────────────────────────────────────
    def scan_rds(self) -> List[Finding]:
        findings: List[Finding] = []
        try:
            rds = _client("rds")
            for db in rds.describe_db_instances().get("DBInstances", []):
                if db.get("PubliclyAccessible"):
                    dbid = db["DBInstanceIdentifier"]
                    score, sev = risk_scorer.score("rds_public")
                    findings.append(Finding(
                        service=AWSService.RDS,
                        title=f"RDS Publicly Accessible: {dbid}",
                        description=f"RDS {db['Engine']} instance '{dbid}' is reachable from the internet.",
                        severity=sev,
                        resource=f"arn:aws:rds:{settings.aws_default_region}:{self.account_id}:db:{dbid}",
                        risk_score=score,
                        remediation_steps=[
                            f"aws rds modify-db-instance --db-instance-identifier {dbid} --no-publicly-accessible --apply-immediately",
                        ],
                        metadata={"engine": db["Engine"], "instance_class": db.get("DBInstanceClass")},
                    ))
        except Exception as exc:
            logger.error(f"RDS scan error: {exc}")
        return findings

    # ── CloudTrail ────────────────────────────────────────────────────────────
    def scan_cloudtrail(self) -> List[Finding]:
        findings: List[Finding] = []
        try:
            ct = _client("cloudtrail")
            trails  = ct.describe_trails(includeShadowTrails=False).get("trailList", [])
            logging = [t for t in trails if ct.get_trail_status(Name=t["TrailARN"]).get("IsLogging")]
            if not logging:
                score, sev = risk_scorer.score("cloudtrail_disabled")
                findings.append(Finding(
                    service=AWSService.CLOUDTRAIL,
                    title="CloudTrail Not Logging in This Region",
                    description="No active CloudTrail trail — no API call audit log exists for this region.",
                    severity=sev,
                    resource=f"arn:aws:cloudtrail:{settings.aws_default_region}:{self.account_id}:trail/*",
                    risk_score=score,
                    remediation_steps=[
                        "aws cloudtrail create-trail --name audit-trail --s3-bucket-name <bucket>",
                        "aws cloudtrail start-logging --name audit-trail",
                    ],
                ))
        except Exception as exc:
            logger.error(f"CloudTrail scan error: {exc}")
        return findings

    # ── GuardDuty ─────────────────────────────────────────────────────────────
    def scan_guardduty(self) -> List[Finding]:
        findings: List[Finding] = []
        try:
            gd = _client("guardduty")
            detectors = gd.list_detectors().get("DetectorIds", [])
            if not detectors:
                score, sev = risk_scorer.score("cloudtrail_disabled")
                findings.append(Finding(
                    service=AWSService.GUARDDUTY,
                    title="GuardDuty Not Enabled in This Region",
                    description="GuardDuty is not active — no continuous threat detection is running.",
                    severity=sev,
                    resource=f"arn:aws:guardduty:{settings.aws_default_region}:{self.account_id}:detector/*",
                    risk_score=score,
                    remediation_steps=["aws guardduty create-detector --enable"],
                ))
                return findings

            for did in detectors:
                ids = gd.list_findings(
                    DetectorId=did,
                    FindingCriteria={"Criterion": {
                        "severity":           {"Gte": 7},
                        "service.archived":   {"Eq": ["false"]},
                    }},
                ).get("FindingIds", [])
                if ids:
                    for gdf in gd.get_findings(DetectorId=did, FindingIds=ids[:5]).get("Findings", []):
                        score, sev = risk_scorer.score("guardduty_finding")
                        findings.append(Finding(
                            service=AWSService.GUARDDUTY,
                            title=f"GuardDuty: {gdf.get('Title', 'Threat Detected')}",
                            description=gdf.get("Description", ""),
                            severity=sev, resource=gdf.get("Arn", ""),
                            risk_score=score,
                            remediation_steps=["Investigate in GuardDuty console", "Review CloudTrail for related calls"],
                            metadata={"finding_id": gdf.get("Id"), "type": gdf.get("Type")},
                        ))
        except Exception as exc:
            logger.error(f"GuardDuty scan error: {exc}")
        return findings

    # ── Full scan ─────────────────────────────────────────────────────────────
    async def run_full_scan(self) -> ScanReport:
        start = time.time()
        self.account_id = self._resolve_account()
        all_findings: List[Finding] = []
        for scanner in (self.scan_s3, self.scan_iam, self.scan_ec2,
                        self.scan_rds, self.scan_cloudtrail, self.scan_guardduty):
            all_findings.extend(scanner())
        return ScanReport(
            findings=all_findings,
            overall_score=risk_scorer.overall(all_findings),
            mode="live",
            services_scanned=["S3", "IAM", "EC2", "RDS", "CloudTrail", "GuardDuty"],
            duration_seconds=round(time.time() - start, 2),
            account_id=self.account_id,
            region=settings.aws_default_region,
        )
