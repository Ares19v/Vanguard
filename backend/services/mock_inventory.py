"""
Vanguard ASOC — Mock Resource Inventory
Realistic simulated AWS resource data for demo / MOCK_MODE=true.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta
from typing import List

from models.schemas import (
    EC2Instance, ElasticIP, InventoryResponse, LambdaFunction,
    LoadBalancer, RDSInstance, S3BucketDetail, VPCDetail,
)

MOCK_ACCOUNT_ID = "123456789012"
MOCK_REGION     = "us-east-1"

_NOW = datetime.utcnow()


def _uptime(days: int, hours: int = 0) -> int:
    return (days * 86400) + (hours * 3600)


# ── EC2 Instances ─────────────────────────────────────────────────────────────
MOCK_EC2: List[EC2Instance] = [
    EC2Instance(
        instance_id="i-0a1b2c3d4e5f6a7b8",
        instance_type="t3.medium",
        state="running",
        public_ip="54.210.123.45",
        private_ip="10.0.1.15",
        public_dns="ec2-54-210-123-45.compute-1.amazonaws.com",
        ami_id="ami-0c55b159cbfafe1f0",
        ami_name="amzn2-ami-hvm-2.0.20231101.0-x86_64-gp2",
        launch_time=_NOW - timedelta(days=47, hours=3),
        uptime_seconds=_uptime(47, 3),
        availability_zone="us-east-1a",
        region="us-east-1",
        key_pair="prod-keypair-main",
        iam_role="EC2-S3ReadRole",
        vpc_id="vpc-0abc12345def67890",
        subnet_id="subnet-0a1b2c3d4e5f67890",
        security_groups=[
            {"id": "sg-0a1b2c3d4e5f", "name": "WebServerSG"},
            {"id": "sg-1a2b3c4d5e6f", "name": "DefaultSG"},
        ],
        tags={"Name": "web-server-prod-01", "Env": "production", "Team": "platform"},
        platform="Amazon Linux",
        architecture="x86_64",
        ebs_volumes=[
            {"volume_id": "vol-0a1b2c3d4e5f6789", "size_gb": 30, "type": "gp3",
             "encrypted": True, "iops": 3000, "delete_on_termination": True},
        ],
        cpu_utilization=23.4,
        monthly_cost_estimate=33.87,
    ),
    EC2Instance(
        instance_id="i-1b2c3d4e5f6a7b8c9",
        instance_type="c5.2xlarge",
        state="running",
        public_ip=None,
        private_ip="10.0.2.44",
        ami_id="ami-0d5ae304a0b933f8c",
        ami_name="ubuntu/images/hvm-ssd/ubuntu-22.04-amd64-server-20231010",
        launch_time=_NOW - timedelta(days=12, hours=7),
        uptime_seconds=_uptime(12, 7),
        availability_zone="us-east-1b",
        region="us-east-1",
        key_pair="backend-keypair",
        iam_role="EC2-FullAccess-Role",
        vpc_id="vpc-0abc12345def67890",
        subnet_id="subnet-1b2c3d4e5f678901",
        security_groups=[
            {"id": "sg-9z8y7x6w5v", "name": "BackendSG"},
        ],
        tags={"Name": "api-server-prod-02", "Env": "production", "Team": "backend"},
        platform="Ubuntu",
        architecture="x86_64",
        ebs_volumes=[
            {"volume_id": "vol-1b2c3d4e5f6789a", "size_gb": 100, "type": "gp3",
             "encrypted": True, "iops": 3000, "delete_on_termination": False},
            {"volume_id": "vol-2c3d4e5f6789ab", "size_gb": 200, "type": "io1",
             "encrypted": True, "iops": 10000, "delete_on_termination": False},
        ],
        cpu_utilization=67.2,
        monthly_cost_estimate=276.40,
    ),
    EC2Instance(
        instance_id="i-2c3d4e5f6a7b8c9d0",
        instance_type="t2.micro",
        state="stopped",
        public_ip=None,
        private_ip="10.0.3.101",
        ami_id="ami-0c55b159cbfafe1f0",
        ami_name="amzn2-ami-hvm-2.0.20231101.0-x86_64-gp2",
        launch_time=_NOW - timedelta(days=120),
        uptime_seconds=0,
        availability_zone="us-east-1c",
        region="us-east-1",
        key_pair="dev-keypair-old",
        iam_role=None,
        vpc_id="vpc-0abc12345def67890",
        subnet_id="subnet-2c3d4e5f67890123",
        security_groups=[
            {"id": "sg-0a1b2c3d4e5f", "name": "WebServerSG"},
        ],
        tags={"Name": "dev-test-old", "Env": "development"},
        platform="Amazon Linux",
        architecture="x86_64",
        ebs_volumes=[
            {"volume_id": "vol-3d4e5f6789abcd", "size_gb": 8, "type": "gp2",
             "encrypted": False, "iops": None, "delete_on_termination": False},
        ],
        cpu_utilization=0.0,
        monthly_cost_estimate=0.0,
    ),
    EC2Instance(
        instance_id="i-3d4e5f6a7b8c9d0e1",
        instance_type="m5.xlarge",
        state="running",
        public_ip="18.232.45.67",
        private_ip="10.0.1.88",
        public_dns="ec2-18-232-45-67.compute-1.amazonaws.com",
        ami_id="ami-0d5ae304a0b933f8c",
        ami_name="ubuntu/images/hvm-ssd/ubuntu-22.04-amd64-server-20231010",
        launch_time=_NOW - timedelta(days=89, hours=14),
        uptime_seconds=_uptime(89, 14),
        availability_zone="us-east-1a",
        region="us-east-1",
        key_pair="prod-keypair-main",
        iam_role="WorkerNode-Role",
        vpc_id="vpc-0abc12345def67890",
        subnet_id="subnet-0a1b2c3d4e5f67890",
        security_groups=[
            {"id": "sg-9z8y7x6w5v", "name": "WindowsServerSG"},
        ],
        tags={"Name": "ml-worker-prod-01", "Env": "production", "Team": "ml"},
        platform="Ubuntu",
        architecture="x86_64",
        ebs_volumes=[
            {"volume_id": "vol-4e5f6789abcdef", "size_gb": 500, "type": "gp3",
             "encrypted": True, "iops": 3000, "delete_on_termination": True},
        ],
        cpu_utilization=3.1,
        monthly_cost_estimate=192.00,
    ),
]

# ── S3 Buckets ────────────────────────────────────────────────────────────────
MOCK_S3: List[S3BucketDetail] = [
    S3BucketDetail(
        name="company-backups-2024",
        region="us-east-1",
        creation_date=datetime(2024, 1, 10),
        total_size_bytes=152_613_748_736,  # ~142 GB
        total_size_gb=142.3,
        object_count=3847,
        storage_class_breakdown={"STANDARD": 58.2, "STANDARD_IA": 31.5, "GLACIER": 10.3},
        versioning="Enabled",
        encryption="None",
        public_access_blocked=False,
        replication_enabled=False,
        lifecycle_rules_count=2,
        access_logs_enabled=False,
        cors_enabled=False,
        tags={"Env": "production", "Team": "ops"},
        estimated_monthly_cost=3.27,
    ),
    S3BucketDetail(
        name="frontend-assets-prod",
        region="us-east-1",
        creation_date=datetime(2023, 8, 22),
        total_size_bytes=2_147_483_648,  # 2 GB
        total_size_gb=2.0,
        object_count=1203,
        storage_class_breakdown={"STANDARD": 100.0},
        versioning="Suspended",
        encryption="SSE-S3",
        public_access_blocked=False,
        replication_enabled=False,
        lifecycle_rules_count=0,
        access_logs_enabled=True,
        cors_enabled=True,
        tags={"Env": "production", "Team": "frontend"},
        estimated_monthly_cost=0.05,
    ),
    S3BucketDetail(
        name="ml-training-data-store",
        region="us-west-2",
        creation_date=datetime(2024, 3, 5),
        total_size_bytes=10_737_418_240_000,  # ~10 TB
        total_size_gb=10240.0,
        object_count=2_847_291,
        storage_class_breakdown={"STANDARD": 12.0, "STANDARD_IA": 28.0, "GLACIER": 60.0},
        versioning="Disabled",
        encryption="SSE-KMS",
        public_access_blocked=True,
        replication_enabled=True,
        lifecycle_rules_count=5,
        access_logs_enabled=True,
        cors_enabled=False,
        tags={"Env": "production", "Team": "ml", "CostCenter": "ml-platform"},
        estimated_monthly_cost=234.88,
    ),
    S3BucketDetail(
        name="dev-artifacts-scratch",
        region="us-east-1",
        creation_date=datetime(2023, 11, 15),
        total_size_bytes=536_870_912,  # 512 MB
        total_size_gb=0.5,
        object_count=87,
        storage_class_breakdown={"STANDARD": 100.0},
        versioning="Disabled",
        encryption="None",
        public_access_blocked=True,
        replication_enabled=False,
        lifecycle_rules_count=0,
        access_logs_enabled=False,
        cors_enabled=False,
        tags={"Env": "development"},
        estimated_monthly_cost=0.01,
    ),
    S3BucketDetail(
        name="audit-logs-cloudtrail",
        region="us-east-1",
        creation_date=datetime(2023, 6, 1),
        total_size_bytes=42_949_672_960,  # 40 GB
        total_size_gb=40.0,
        object_count=482_903,
        storage_class_breakdown={"STANDARD": 5.0, "STANDARD_IA": 95.0},
        versioning="Enabled",
        encryption="SSE-KMS",
        public_access_blocked=True,
        replication_enabled=False,
        lifecycle_rules_count=3,
        access_logs_enabled=False,
        cors_enabled=False,
        tags={"Env": "production", "Purpose": "compliance"},
        estimated_monthly_cost=0.92,
    ),
]

# ── RDS Instances ─────────────────────────────────────────────────────────────
MOCK_RDS: List[RDSInstance] = [
    RDSInstance(
        instance_id="prod-mysql-01",
        engine="MySQL",
        engine_version="8.0.35",
        instance_class="db.r6g.xlarge",
        status="available",
        multi_az=True,
        publicly_accessible=True,
        allocated_storage_gb=500,
        endpoint="prod-mysql-01.cxyz123abc.us-east-1.rds.amazonaws.com",
        port=3306,
        region="us-east-1",
        availability_zone="us-east-1a",
        backup_retention_days=7,
        encrypted=False,
        deletion_protection=True,
        tags={"Env": "production", "Team": "backend"},
        cpu_utilization=41.2,
        free_storage_gb=187.3,
        monthly_cost_estimate=680.00,
    ),
    RDSInstance(
        instance_id="analytics-pg-02",
        engine="PostgreSQL",
        engine_version="15.4",
        instance_class="db.m5.2xlarge",
        status="available",
        multi_az=False,
        publicly_accessible=False,
        allocated_storage_gb=1000,
        endpoint="analytics-pg-02.cxyz123abc.us-east-1.rds.amazonaws.com",
        port=5432,
        region="us-east-1",
        availability_zone="us-east-1b",
        backup_retention_days=14,
        encrypted=True,
        deletion_protection=True,
        tags={"Env": "production", "Team": "data"},
        cpu_utilization=78.5,
        free_storage_gb=423.0,
        monthly_cost_estimate=750.24,
    ),
    RDSInstance(
        instance_id="dev-mysql-test",
        engine="MySQL",
        engine_version="8.0.35",
        instance_class="db.t3.micro",
        status="stopped",
        multi_az=False,
        publicly_accessible=False,
        allocated_storage_gb=20,
        endpoint=None,
        port=3306,
        region="us-east-1",
        availability_zone="us-east-1c",
        backup_retention_days=1,
        encrypted=False,
        deletion_protection=False,
        tags={"Env": "development"},
        cpu_utilization=None,
        free_storage_gb=None,
        monthly_cost_estimate=0.0,
    ),
]

# ── Lambda Functions ──────────────────────────────────────────────────────────
MOCK_LAMBDA: List[LambdaFunction] = [
    LambdaFunction(
        function_name="process-user-uploads",
        function_arn="arn:aws:lambda:us-east-1:123456789012:function:process-user-uploads",
        runtime="python3.11",
        handler="handler.lambda_handler",
        code_size_bytes=2_458_624,
        memory_mb=512,
        timeout_seconds=30,
        last_modified=_NOW - timedelta(days=3),
        role="arn:aws:iam::123456789012:role/LambdaS3Role",
        description="Processes uploaded files, runs virus scan, moves to processed/ prefix",
        region="us-east-1",
        invocations_24h=14_832,
        errors_24h=12,
        avg_duration_ms=847.2,
        monthly_cost_estimate=1.87,
        tags={"Env": "production", "Team": "platform"},
    ),
    LambdaFunction(
        function_name="send-notifications",
        function_arn="arn:aws:lambda:us-east-1:123456789012:function:send-notifications",
        runtime="nodejs18.x",
        handler="index.handler",
        code_size_bytes=892_928,
        memory_mb=256,
        timeout_seconds=10,
        last_modified=_NOW - timedelta(days=21),
        role="arn:aws:iam::123456789012:role/LambdaSESRole",
        description="Sends email/SMS notifications via SES and SNS",
        region="us-east-1",
        invocations_24h=2_341,
        errors_24h=0,
        avg_duration_ms=234.5,
        monthly_cost_estimate=0.23,
        tags={"Env": "production", "Team": "notifications"},
    ),
    LambdaFunction(
        function_name="nightly-report-generator",
        function_arn="arn:aws:lambda:us-east-1:123456789012:function:nightly-report-generator",
        runtime="python3.11",
        handler="report.generate",
        code_size_bytes=5_242_880,
        memory_mb=1024,
        timeout_seconds=300,
        last_modified=_NOW - timedelta(days=45),
        role="arn:aws:iam::123456789012:role/LambdaReportRole",
        description="Runs nightly BI reports and sends to S3",
        region="us-east-1",
        invocations_24h=1,
        errors_24h=0,
        avg_duration_ms=187_432.0,
        monthly_cost_estimate=0.09,
        tags={"Env": "production", "Team": "data"},
    ),
    LambdaFunction(
        function_name="old-migration-script",
        function_arn="arn:aws:lambda:us-east-1:123456789012:function:old-migration-script",
        runtime="python3.8",
        handler="migrate.main",
        code_size_bytes=102_400,
        memory_mb=128,
        timeout_seconds=60,
        last_modified=_NOW - timedelta(days=380),
        role="arn:aws:iam::123456789012:role/LambdaBasicRole",
        description="One-time DB migration — never deleted",
        region="us-east-1",
        invocations_24h=0,
        errors_24h=0,
        avg_duration_ms=None,
        monthly_cost_estimate=0.0,
        tags={"Env": "deprecated"},
    ),
]

# ── VPCs ──────────────────────────────────────────────────────────────────────
MOCK_VPCS: List[VPCDetail] = [
    VPCDetail(
        vpc_id="vpc-0abc12345def67890",
        cidr_block="10.0.0.0/16",
        is_default=False,
        state="available",
        region="us-east-1",
        subnet_count=6,
        subnets=[
            {"id": "subnet-0a1b2c3d4e5f67890", "cidr": "10.0.1.0/24", "az": "us-east-1a", "public": True},
            {"id": "subnet-1b2c3d4e5f678901", "cidr": "10.0.2.0/24", "az": "us-east-1b", "public": True},
            {"id": "subnet-2c3d4e5f67890123", "cidr": "10.0.3.0/24", "az": "us-east-1c", "public": False},
            {"id": "subnet-3d4e5f6789012345", "cidr": "10.0.4.0/24", "az": "us-east-1a", "public": False},
            {"id": "subnet-4e5f678901234567", "cidr": "10.0.5.0/24", "az": "us-east-1b", "public": False},
            {"id": "subnet-5f6789012345678a", "cidr": "10.0.6.0/24", "az": "us-east-1c", "public": False},
        ],
        internet_gateway_attached=True,
        nat_gateways=2,
        route_tables=4,
        security_groups=12,
        tags={"Name": "prod-vpc", "Env": "production"},
    ),
    VPCDetail(
        vpc_id="vpc-1def23456abc78901",
        cidr_block="172.31.0.0/16",
        is_default=True,
        state="available",
        region="us-east-1",
        subnet_count=3,
        subnets=[
            {"id": "subnet-aabbccdd11223344", "cidr": "172.31.0.0/20", "az": "us-east-1a", "public": True},
            {"id": "subnet-bbccdd1122334455", "cidr": "172.31.16.0/20", "az": "us-east-1b", "public": True},
            {"id": "subnet-ccdd112233445566", "cidr": "172.31.32.0/20", "az": "us-east-1c", "public": True},
        ],
        internet_gateway_attached=True,
        nat_gateways=0,
        route_tables=1,
        security_groups=3,
        tags={"Name": "default"},
    ),
]

# ── Elastic IPs ───────────────────────────────────────────────────────────────
MOCK_EIPS: List[ElasticIP] = [
    ElasticIP(
        allocation_id="eipalloc-0a1b2c3d4e5f67890",
        public_ip="54.210.123.45",
        associated_instance="i-0a1b2c3d4e5f6a7b8",
        is_idle=False,
        region="us-east-1",
    ),
    ElasticIP(
        allocation_id="eipalloc-1b2c3d4e5f678901",
        public_ip="18.232.45.67",
        associated_instance="i-3d4e5f6a7b8c9d0e1",
        is_idle=False,
        region="us-east-1",
    ),
    ElasticIP(
        allocation_id="eipalloc-2c3d4e5f67890123",
        public_ip="34.201.87.12",
        associated_instance=None,
        is_idle=True,
        region="us-east-1",
    ),
    ElasticIP(
        allocation_id="eipalloc-3d4e5f6789012345",
        public_ip="52.90.34.201",
        associated_instance=None,
        is_idle=True,
        region="us-east-1",
    ),
]

# ── Load Balancers ────────────────────────────────────────────────────────────
MOCK_LBS: List[LoadBalancer] = [
    LoadBalancer(
        name="prod-alb-frontend",
        arn="arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/prod-alb-frontend/abc123",
        lb_type="application",
        scheme="internet-facing",
        state="active",
        dns_name="prod-alb-frontend-123456789.us-east-1.elb.amazonaws.com",
        region="us-east-1",
        availability_zones=["us-east-1a", "us-east-1b"],
        target_group_count=3,
        created_at=datetime(2023, 9, 15),
    ),
    LoadBalancer(
        name="internal-nlb-backend",
        arn="arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/net/internal-nlb-backend/def456",
        lb_type="network",
        scheme="internal",
        state="active",
        dns_name="internal-nlb-backend-abc456789.elb.us-east-1.amazonaws.com",
        region="us-east-1",
        availability_zones=["us-east-1a", "us-east-1b", "us-east-1c"],
        target_group_count=2,
        created_at=datetime(2024, 1, 20),
    ),
]


def get_mock_inventory(all_regions: bool = False) -> InventoryResponse:
    total = (
        len(MOCK_EC2) + len(MOCK_S3) + len(MOCK_RDS) +
        len(MOCK_LAMBDA) + len(MOCK_VPCS) + len(MOCK_EIPS) + len(MOCK_LBS)
    )
    idle = (
        sum(1 for i in MOCK_EC2 if i.state == "stopped") +
        sum(1 for e in MOCK_EIPS if e.is_idle) +
        sum(1 for f in MOCK_LAMBDA if (f.invocations_24h or 0) == 0)
    )
    regions = (
        ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]
        if all_regions else ["us-east-1"]
    )
    return InventoryResponse(
        account_id=MOCK_ACCOUNT_ID,
        region=MOCK_REGION,
        all_regions=all_regions,
        regions_scanned=regions,
        ec2_instances=MOCK_EC2,
        s3_buckets=MOCK_S3,
        rds_instances=MOCK_RDS,
        lambda_functions=MOCK_LAMBDA,
        vpcs=MOCK_VPCS,
        elastic_ips=MOCK_EIPS,
        load_balancers=MOCK_LBS,
        total_resources=total,
        idle_resources=idle,
        mode="mock",
    )
