"""
Vanguard ASOC — Network threat simulation engine.
Streams realistic ThreatEvent objects via an async generator.
Simulates: PORT_SCAN, BRUTE_FORCE, DATA_EXFIL, C2_BEACON, LATERAL_MOVEMENT, RECON, PRIVILEGE_ESC
"""

from __future__ import annotations

import asyncio
import random
import uuid
from datetime import datetime
from typing import AsyncGenerator

from models.schemas import EventType, GeoLocation, Severity, ThreatEvent


# ── Fake IP pools ─────────────────────────────────────────────────────────────
_SOURCE_IPS = [
    # Known bad / TOR exit nodes / botnets (all faked/representative)
    ("185.220.101.47", "RU", "Moscow",    "TOR Exit Node",        55.75,  37.62),
    ("195.123.240.112","CN", "Beijing",   "APT Infrastructure",   39.92, 116.38),
    ("91.108.56.22",  "IR", "Tehran",    "State Actor",          35.69,  51.39),
    ("178.73.215.171","DE", "Frankfurt",  "VPN Endpoint",         50.11,   8.68),
    ("45.55.36.51",   "US", "New York",  "Residential Proxy",    40.71, -74.00),
    ("103.21.244.0",  "IN", "Mumbai",    "Hosting Provider",     19.07,  72.87),
    ("80.82.77.33",   "NL", "Amsterdam", "Bulletproof Hosting",  52.37,   4.90),
    ("5.188.10.179",  "UA", "Kyiv",      "Compromised Server",   50.45,  30.52),
    ("62.233.50.245", "FR", "Paris",     "Open Proxy",          48.85,   2.35),
    ("159.65.234.12", "SG", "Singapore", "Cloud Exit Node",       1.35, 103.82),
]

_INTERNAL_IPS = [
    "10.0.1.42", "10.0.2.101", "10.0.3.78",
    "172.16.10.5", "172.16.20.8",
    "192.168.1.120", "192.168.2.45",
]

_PROTOCOLS = ["TCP", "UDP", "ICMP", "HTTP", "HTTPS", "DNS"]

_EVENT_CONFIGS = {
    EventType.PORT_SCAN: {
        "ports":    [21, 22, 23, 25, 80, 443, 1433, 3306, 3389, 5432, 8080, 8443, 9200, 27017],
        "details":  "Sequential port sweep detected across target subnet",
        "severity": [Severity.LOW, Severity.MEDIUM],
        "weight":   35,
    },
    EventType.BRUTE_FORCE: {
        "ports":    [22, 3389, 21, 25],
        "details":  "High volume of failed authentication attempts — credential stuffing",
        "severity": [Severity.MEDIUM, Severity.HIGH],
        "weight":   25,
    },
    EventType.C2_BEACON: {
        "ports":    [443, 80, 8080, 53],
        "details":  "Periodic beacon to known C2 infrastructure — possible implant",
        "severity": [Severity.HIGH, Severity.CRITICAL],
        "weight":   15,
    },
    EventType.DATA_EXFIL: {
        "ports":    [443, 80, 21, 2049],
        "details":  "Anomalous outbound data volume — potential exfiltration",
        "severity": [Severity.HIGH, Severity.CRITICAL],
        "weight":   10,
    },
    EventType.LATERAL_MOVEMENT: {
        "ports":    [445, 139, 135, 5985, 5986],
        "details":  "Internal east-west traffic to admin shares — lateral movement indicator",
        "severity": [Severity.MEDIUM, Severity.HIGH],
        "weight":   10,
    },
    EventType.RECON: {
        "ports":    [53, 80, 443, 161],
        "details":  "DNS enumeration and OS fingerprinting activity",
        "severity": [Severity.LOW, Severity.MEDIUM],
        "weight":   3,
    },
    EventType.PRIVILEGE_ESC: {
        "ports":    [22, 139, 445],
        "details":  "Privilege escalation attempt — SUID binary or sudo abuse detected",
        "severity": [Severity.HIGH, Severity.CRITICAL],
        "weight":   2,
    },
}

_EVENT_TYPES       = list(_EVENT_CONFIGS.keys())
_EVENT_WEIGHTS     = [_EVENT_CONFIGS[e]["weight"] for e in _EVENT_TYPES]
_INTERNAL_TARGETS  = _INTERNAL_IPS[:]


def _random_source():
    ip, country, city, isp, lat, lon = random.choice(_SOURCE_IPS)
    return ip, GeoLocation(lat=lat, lon=lon, country=country, city=city, isp=isp)


def _random_event() -> ThreatEvent:
    event_type = random.choices(_EVENT_TYPES, weights=_EVENT_WEIGHTS, k=1)[0]
    cfg        = _EVENT_CONFIGS[event_type]
    src_ip, geo = _random_source()
    target_ip  = random.choice(_INTERNAL_TARGETS)
    port       = random.choice(cfg["ports"])
    severity   = random.choice(cfg["severity"])
    protocol   = "TCP" if port not in (53, 161) else ("UDP" if port in (53, 161) else "TCP")
    bytes_xfr  = random.randint(512, 2_000_000) if event_type == EventType.DATA_EXFIL else None

    return ThreatEvent(
        event_id=str(uuid.uuid4()),
        source_ip=src_ip,
        source_port=random.randint(1024, 65535),
        target_ip=target_ip,
        target_port=port,
        protocol=protocol,
        event_type=event_type,
        severity=severity,
        timestamp=datetime.utcnow(),
        geo=geo,
        details=cfg["details"],
        bytes_transferred=bytes_xfr,
        ttl=random.randint(32, 128),
    )


async def threat_stream(
    interval_min: float = 0.8,
    interval_max: float = 2.5,
) -> AsyncGenerator[ThreatEvent, None]:
    """Continuously yield ThreatEvent objects with random realistic cadence."""
    while True:
        yield _random_event()
        await asyncio.sleep(random.uniform(interval_min, interval_max))


def generate_burst(n: int = 100) -> list[ThreatEvent]:
    """Generate N events instantly (used for /threats/summary on WebSocket connect)."""
    return [_random_event() for _ in range(n)]
