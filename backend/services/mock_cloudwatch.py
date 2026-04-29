"""
Vanguard ASOC — Mock CloudWatch Metrics
Realistic simulated time-series metric data for MOCK_MODE=true.
"""

from __future__ import annotations

import math
import random
from datetime import datetime, timedelta
from typing import List

from models.schemas import MetricDataPoint, ResourceMetrics

_NOW = datetime.utcnow()

random.seed(42)


def _ts(hours_ago: float) -> str:
    return (_NOW - timedelta(hours=hours_ago)).strftime("%Y-%m-%dT%H:%M:%SZ")


def _gen_cpu_series(points: int, base: float, noise: float, spike_at: int = -1) -> List[MetricDataPoint]:
    series = []
    for i in range(points):
        val = base + random.uniform(-noise, noise)
        if i == spike_at:
            val = min(98.0, val + random.uniform(30, 50))
        val = max(0.1, min(99.9, val))
        series.append(MetricDataPoint(
            timestamp=_ts((points - i) * (24 / points)),
            value=round(val, 2),
            unit="Percent",
        ))
    return series


def _gen_network_series(points: int, base_mb: float) -> List[MetricDataPoint]:
    series = []
    for i in range(points):
        # Higher during business hours (simulate)
        hour = (_NOW - timedelta(hours=(points - i) * (24 / points))).hour
        multiplier = 1.5 if 8 <= hour <= 18 else 0.6
        val = (base_mb * multiplier + random.uniform(-base_mb * 0.2, base_mb * 0.2)) * 1024 * 1024
        series.append(MetricDataPoint(
            timestamp=_ts((points - i) * (24 / points)),
            value=round(max(0, val), 0),
            unit="Bytes",
        ))
    return series


def _gen_zero_series(points: int) -> List[MetricDataPoint]:
    return [
        MetricDataPoint(timestamp=_ts((points - i) * (24 / points)), value=0.0, unit="Count")
        for i in range(points)
    ]


MOCK_METRICS: dict[str, ResourceMetrics] = {
    # High-traffic API server
    "i-1b2c3d4e5f6a7b8c9": ResourceMetrics(
        resource_id="i-1b2c3d4e5f6a7b8c9",
        resource_type="ec2",
        region="us-east-1",
        period="24h",
        cpu_utilization=_gen_cpu_series(48, base=67.0, noise=12.0, spike_at=22),
        network_in_bytes=_gen_network_series(48, base_mb=85.0),
        network_out_bytes=_gen_network_series(48, base_mb=140.0),
        disk_read_bytes=_gen_network_series(48, base_mb=12.0),
        disk_write_bytes=_gen_network_series(48, base_mb=34.0),
        avg_cpu=67.2,
        max_cpu=94.8,
        is_idle=False,
        mode="mock",
    ),
    # Web server - moderate usage
    "i-0a1b2c3d4e5f6a7b8": ResourceMetrics(
        resource_id="i-0a1b2c3d4e5f6a7b8",
        resource_type="ec2",
        region="us-east-1",
        period="24h",
        cpu_utilization=_gen_cpu_series(48, base=23.0, noise=8.0),
        network_in_bytes=_gen_network_series(48, base_mb=25.0),
        network_out_bytes=_gen_network_series(48, base_mb=55.0),
        disk_read_bytes=_gen_network_series(48, base_mb=3.0),
        disk_write_bytes=_gen_network_series(48, base_mb=5.0),
        avg_cpu=23.4,
        max_cpu=41.2,
        is_idle=False,
        mode="mock",
    ),
    # Idle ML worker — candidate for downsizing
    "i-3d4e5f6a7b8c9d0e1": ResourceMetrics(
        resource_id="i-3d4e5f6a7b8c9d0e1",
        resource_type="ec2",
        region="us-east-1",
        period="24h",
        cpu_utilization=_gen_cpu_series(48, base=3.0, noise=1.5),
        network_in_bytes=_gen_network_series(48, base_mb=0.5),
        network_out_bytes=_gen_network_series(48, base_mb=0.8),
        disk_read_bytes=_gen_network_series(48, base_mb=0.1),
        disk_write_bytes=_gen_network_series(48, base_mb=0.2),
        avg_cpu=3.1,
        max_cpu=7.8,
        is_idle=True,
        mode="mock",
    ),
    # Prod MySQL RDS
    "prod-mysql-01": ResourceMetrics(
        resource_id="prod-mysql-01",
        resource_type="rds",
        region="us-east-1",
        period="24h",
        cpu_utilization=_gen_cpu_series(48, base=41.0, noise=15.0),
        free_storage_bytes=[
            MetricDataPoint(
                timestamp=_ts((48 - i) * (24 / 48)),
                value=round((187.3 - i * 0.02) * 1024 * 1024 * 1024, 0),
                unit="Bytes",
            )
            for i in range(48)
        ],
        db_connections=[
            MetricDataPoint(
                timestamp=_ts((48 - i) * (24 / 48)),
                value=round(120 + random.uniform(-30, 30)),
                unit="Count",
            )
            for i in range(48)
        ],
        avg_cpu=41.2,
        max_cpu=78.3,
        is_idle=False,
        mode="mock",
    ),
    # Analytics PostgreSQL RDS — high load
    "analytics-pg-02": ResourceMetrics(
        resource_id="analytics-pg-02",
        resource_type="rds",
        region="us-east-1",
        period="24h",
        cpu_utilization=_gen_cpu_series(48, base=78.0, noise=14.0, spike_at=10),
        free_storage_bytes=[
            MetricDataPoint(
                timestamp=_ts((48 - i) * (24 / 48)),
                value=round((423.0 - i * 0.05) * 1024 * 1024 * 1024, 0),
                unit="Bytes",
            )
            for i in range(48)
        ],
        db_connections=[
            MetricDataPoint(
                timestamp=_ts((48 - i) * (24 / 48)),
                value=round(340 + random.uniform(-50, 50)),
                unit="Count",
            )
            for i in range(48)
        ],
        avg_cpu=78.5,
        max_cpu=97.1,
        is_idle=False,
        mode="mock",
    ),
    # Active Lambda
    "process-user-uploads": ResourceMetrics(
        resource_id="process-user-uploads",
        resource_type="lambda",
        region="us-east-1",
        period="24h",
        invocations=[
            MetricDataPoint(
                timestamp=_ts((48 - i) * (24 / 48)),
                value=round(600 + random.uniform(-200, 400)),
                unit="Count",
            )
            for i in range(48)
        ],
        errors=[
            MetricDataPoint(
                timestamp=_ts((48 - i) * (24 / 48)),
                value=round(random.uniform(0, 1)),
                unit="Count",
            )
            for i in range(48)
        ],
        duration_ms=[
            MetricDataPoint(
                timestamp=_ts((48 - i) * (24 / 48)),
                value=round(847 + random.uniform(-200, 300), 1),
                unit="Milliseconds",
            )
            for i in range(48)
        ],
        throttles=_gen_zero_series(48),
        avg_cpu=None,
        max_cpu=None,
        is_idle=False,
        mode="mock",
    ),
    # Idle / deprecated Lambda
    "old-migration-script": ResourceMetrics(
        resource_id="old-migration-script",
        resource_type="lambda",
        region="us-east-1",
        period="24h",
        invocations=_gen_zero_series(48),
        errors=_gen_zero_series(48),
        duration_ms=_gen_zero_series(48),
        throttles=_gen_zero_series(48),
        avg_cpu=None,
        max_cpu=None,
        is_idle=True,
        mode="mock",
    ),
}


def get_mock_metrics(resource_id: str, period: str = "24h") -> ResourceMetrics:
    if resource_id in MOCK_METRICS:
        m = MOCK_METRICS[resource_id]
        m.period = period
        return m
    # Return empty placeholder for unknown resources
    return ResourceMetrics(
        resource_id=resource_id,
        resource_type="ec2",
        region="us-east-1",
        period=period,
        cpu_utilization=_gen_cpu_series(24, base=0.5, noise=0.3),
        avg_cpu=0.5,
        max_cpu=1.0,
        is_idle=True,
        mode="mock",
    )


def get_all_mock_metrics() -> list[ResourceMetrics]:
    return list(MOCK_METRICS.values())
