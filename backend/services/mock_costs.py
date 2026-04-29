"""
Vanguard ASOC — Mock Cost & Billing data
Realistic simulated AWS Cost Explorer responses for MOCK_MODE=true.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import List

from models.schemas import CostResponse, DailyCost, IdleResource, ServiceCost

_NOW = datetime.utcnow()


def _date(days_ago: int) -> str:
    return (_NOW - timedelta(days=days_ago)).strftime("%Y-%m-%d")


# 30 days of daily spend (realistic variance)
_RAW_DAILY = [
    38.12, 41.05, 39.87, 43.22, 40.91, 44.78, 42.33,   # week 1
    45.12, 47.88, 46.34, 51.22, 49.77, 52.10, 50.43,   # week 2
    53.87, 56.23, 54.11, 58.45, 57.22, 61.89, 59.34,   # week 3
    63.22, 65.87, 62.44, 67.11, 64.78, 68.92, 66.34,   # week 4
    70.12, 69.45,                                        # last 2 days
]

MOCK_DAILY: List[DailyCost] = [
    DailyCost(date=_date(29 - i), amount=amt)
    for i, amt in enumerate(_RAW_DAILY)
]

MOCK_BY_SERVICE: List[ServiceCost] = [
    ServiceCost(service="Amazon EC2",            amount=521.27, percentage=34.8),
    ServiceCost(service="Amazon RDS",            amount=430.24, percentage=28.7),
    ServiceCost(service="Amazon S3",             amount=239.13, percentage=15.9),
    ServiceCost(service="AWS Lambda",            amount=2.19,   percentage=0.1),
    ServiceCost(service="Amazon CloudFront",     amount=87.44,  percentage=5.8),
    ServiceCost(service="Elastic Load Balancing",amount=64.80,  percentage=4.3),
    ServiceCost(service="Amazon VPC",            amount=43.20,  percentage=2.9),
    ServiceCost(service="AWS CloudTrail",        amount=18.30,  percentage=1.2),
    ServiceCost(service="Amazon Route 53",       amount=11.50,  percentage=0.8),
    ServiceCost(service="Other",                 amount=82.93,  percentage=5.5),
]

MOCK_IDLE: List[IdleResource] = [
    IdleResource(
        resource_id="i-2c3d4e5f6a7b8c9d0",
        resource_type="EC2 Instance",
        reason="Instance stopped for 120+ days but EBS volumes still attached and being charged",
        estimated_monthly_waste=8.00,
        region="us-east-1",
        recommendation="Snapshot EBS volumes then delete the stopped instance",
    ),
    IdleResource(
        resource_id="eipalloc-2c3d4e5f67890123",
        resource_type="Elastic IP",
        reason="Unassociated Elastic IP — charges $0.005/hour when not in use",
        estimated_monthly_waste=3.60,
        region="us-east-1",
        recommendation="Release the Elastic IP if no longer needed",
    ),
    IdleResource(
        resource_id="eipalloc-3d4e5f6789012345",
        resource_type="Elastic IP",
        reason="Unassociated Elastic IP — charges $0.005/hour when not in use",
        estimated_monthly_waste=3.60,
        region="us-east-1",
        recommendation="Release the Elastic IP if no longer needed",
    ),
    IdleResource(
        resource_id="old-migration-script",
        resource_type="Lambda Function",
        reason="Zero invocations in 380+ days, using deprecated Python 3.8 runtime",
        estimated_monthly_waste=0.0,
        region="us-east-1",
        recommendation="Delete or archive the function — no longer serving any purpose",
    ),
    IdleResource(
        resource_id="i-3d4e5f6a7b8c9d0e1",
        resource_type="EC2 Instance",
        reason="Average CPU utilization is 3.1% over 7 days — severely under-provisioned",
        estimated_monthly_waste=144.00,
        region="us-east-1",
        recommendation="Downsize from m5.xlarge to t3.medium — save ~$144/month",
    ),
    IdleResource(
        resource_id="dev-mysql-test",
        resource_type="RDS Instance",
        reason="Instance stopped — EBS storage still charged at $0.115/GB/month",
        estimated_monthly_waste=2.30,
        region="us-east-1",
        recommendation="Create a snapshot and delete the instance, restore when needed",
    ),
]

MTD_TOTAL  = sum(d.amount for d in MOCK_DAILY[-(_NOW.day):])
LAST_MONTH = 1248.50
FORECAST   = MTD_TOTAL * (30 / _NOW.day)


def get_mock_costs() -> CostResponse:
    mtd_change = ((MTD_TOTAL - (LAST_MONTH * (_NOW.day / 30))) /
                  (LAST_MONTH * (_NOW.day / 30))) * 100

    return CostResponse(
        account_id="123456789012",
        period_start=datetime(_NOW.year, _NOW.month, 1).strftime("%Y-%m-%d"),
        period_end=_NOW.strftime("%Y-%m-%d"),
        mtd_total=round(MTD_TOTAL, 2),
        mtd_change_pct=round(mtd_change, 1),
        forecasted_month_total=round(FORECAST, 2),
        last_month_total=LAST_MONTH,
        currency="USD",
        daily_trend=MOCK_DAILY,
        by_service=MOCK_BY_SERVICE,
        top_resource_costs=[
            {"id": "i-1b2c3d4e5f6a7b8c9", "name": "api-server-prod-02", "type": "EC2", "monthly": 276.40},
            {"id": "analytics-pg-02",      "name": "analytics-pg-02",    "type": "RDS", "monthly": 750.24},
            {"id": "prod-mysql-01",         "name": "prod-mysql-01",      "type": "RDS", "monthly": 680.00},
            {"id": "i-3d4e5f6a7b8c9d0e1",  "name": "ml-worker-prod-01",  "type": "EC2", "monthly": 192.00},
            {"id": "i-0a1b2c3d4e5f6a7b8",  "name": "web-server-prod-01", "type": "EC2", "monthly": 33.87},
        ],
        idle_resources=MOCK_IDLE,
        total_estimated_waste=round(sum(r.estimated_monthly_waste for r in MOCK_IDLE), 2),
        mode="mock",
    )
