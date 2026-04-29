"""
Vanguard ASOC — AWS CloudWatch Metrics Service
"""

import boto3
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from config import settings
from models.schemas import ResourceMetrics, MetricPoint

logger = logging.getLogger(__name__)

class CloudWatchService:
    def __init__(self):
        self.session = boto3.Session(
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            aws_session_token=settings.aws_session_token,
            region_name=settings.aws_default_region
        )

    def get_resource_metrics(self, resource_id: str, resource_type: str, period: str = "24h") -> ResourceMetrics:
        cw = self.session.client("cloudwatch")
        
        hours = {"1h": 1, "6h": 6, "24h": 24, "7d": 168}[period]
        end = datetime.utcnow()
        start = end - timedelta(hours=hours)
        
        # Determine Namespace and Dimension based on type
        namespace = "AWS/EC2" if resource_type == "EC2" else "AWS/RDS"
        dimension_name = "InstanceId" if resource_type == "EC2" else "DBInstanceIdentifier"
        
        def get_stat(metric_name: str, stat: str = "Average"):
            try:
                res = cw.get_metric_statistics(
                    Namespace=namespace,
                    MetricName=metric_name,
                    Dimensions=[{'Name': dimension_name, 'Value': resource_id}],
                    StartTime=start,
                    EndTime=end,
                    Period=3600 if hours > 24 else 300,
                    Statistics=[stat]
                )
                points = sorted(res["Datapoints"], key=lambda x: x["Timestamp"])
                return [MetricPoint(timestamp=p["Timestamp"].isoformat(), value=p[stat]) for p in points]
            except:
                return []

        cpu_points = get_stat("CPUUtilization")
        net_in = get_stat("NetworkIn")
        net_out = get_stat("NetworkOut")
        
        avg_cpu = sum(p.value for p in cpu_points) / len(cpu_points) if cpu_points else 0
        max_cpu = max(p.value for p in cpu_points) if cpu_points else 0

        return ResourceMetrics(
            resource_id=resource_id,
            resource_type=resource_type,
            cpu_utilization=cpu_points,
            network_in=net_in,
            network_out=net_out,
            disk_iops=[],
            avg_cpu=avg_cpu,
            max_cpu=max_cpu,
            is_idle=avg_cpu < 5 and len(cpu_points) > 0
        )
