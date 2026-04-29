"""
Vanguard ASOC — CVSS-inspired risk scoring engine.

Score formula (0 – 100):
  exploitability = attack_vector × complexity × privileges × interaction
  impact         = (confidentiality + integrity + availability) / 3
  raw            = exploitability × impact × scope_multiplier × 100
  score          = clamp(raw, 0, 100)
"""

from typing import Dict, Tuple


# ── Severity bands ────────────────────────────────────────────────────────────
SEVERITY_BANDS: Dict[str, Tuple[float, float]] = {
    "CRITICAL": (85.0, 100.0),
    "HIGH":     (65.0,  84.9),
    "MEDIUM":   (40.0,  64.9),
    "LOW":      (15.0,  39.9),
    "INFO":     (0.0,   14.9),
}

SEVERITY_COLORS: Dict[str, str] = {
    "CRITICAL": "#ef4444",
    "HIGH":     "#f97316",
    "MEDIUM":   "#f59e0b",
    "LOW":      "#3b82f6",
    "INFO":     "#6b7280",
}

SEVERITY_BG: Dict[str, str] = {
    "CRITICAL": "rgba(239,68,68,0.15)",
    "HIGH":     "rgba(249,115,22,0.15)",
    "MEDIUM":   "rgba(245,158,11,0.15)",
    "LOW":      "rgba(59,130,246,0.15)",
    "INFO":     "rgba(107,114,128,0.15)",
}


# ── Per-finding-type weight profiles ─────────────────────────────────────────
_W = Dict[str, float]

FINDING_PROFILES: Dict[str, _W] = {
    "s3_public_acl": dict(
        attack_vector=1.0, complexity=1.0, privileges=1.0,
        interaction=1.0, scope=1.1,
        confidentiality=1.0, integrity=0.5, availability=0.0,
    ),
    "iam_old_key": dict(
        attack_vector=1.0, complexity=0.5, privileges=0.7,
        interaction=1.0, scope=1.1,
        confidentiality=1.0, integrity=1.0, availability=0.5,
    ),
    "iam_no_mfa": dict(
        attack_vector=1.0, complexity=0.5, privileges=0.7,
        interaction=1.0, scope=1.1,
        confidentiality=1.0, integrity=1.0, availability=0.8,
    ),
    "ec2_open_ssh": dict(
        attack_vector=1.0, complexity=0.5, privileges=1.0,
        interaction=1.0, scope=1.0,
        confidentiality=1.0, integrity=1.0, availability=1.0,
    ),
    "ec2_open_rdp": dict(
        attack_vector=1.0, complexity=0.5, privileges=1.0,
        interaction=1.0, scope=1.0,
        confidentiality=1.0, integrity=1.0, availability=1.0,
    ),
    "rds_public": dict(
        attack_vector=1.0, complexity=0.5, privileges=0.7,
        interaction=1.0, scope=1.1,
        confidentiality=1.0, integrity=1.0, availability=0.5,
    ),
    "cloudtrail_disabled": dict(
        attack_vector=0.6, complexity=0.5, privileges=0.5,
        interaction=1.0, scope=1.0,
        confidentiality=0.5, integrity=0.3, availability=0.0,
    ),
    "guardduty_finding": dict(
        attack_vector=1.0, complexity=1.0, privileges=1.0,
        interaction=1.0, scope=1.1,
        confidentiality=1.0, integrity=1.0, availability=1.0,
    ),
    "default": dict(
        attack_vector=0.85, complexity=0.77, privileges=0.85,
        interaction=0.85, scope=1.0,
        confidentiality=0.56, integrity=0.22, availability=0.22,
    ),
}


class RiskScorer:
    """Stateless scorer — all methods are pure functions."""

    def score(self, finding_type: str) -> Tuple[float, str]:
        """Return (risk_score 0-100, severity_label)."""
        p = FINDING_PROFILES.get(finding_type, FINDING_PROFILES["default"])

        exploitability = (
            p["attack_vector"] *
            p["complexity"] *
            p["privileges"] *
            p["interaction"]
        )
        impact = (p["confidentiality"] + p["integrity"] + p["availability"]) / 3.0
        raw = exploitability * impact * p["scope"] * 100.0

        score = round(max(0.0, min(100.0, raw)), 1)
        severity = self._band(score)
        return score, severity

    def _band(self, score: float) -> str:
        for sev, (lo, hi) in SEVERITY_BANDS.items():
            if lo <= score <= hi:
                return sev
        return "INFO"

    def color(self, severity: str) -> str:
        return SEVERITY_COLORS.get(severity, "#6b7280")

    def bg(self, severity: str) -> str:
        return SEVERITY_BG.get(severity, "rgba(107,114,128,0.15)")

    def overall(self, findings: list) -> float:
        """Weighted mean — CRITICAL findings count 4×, HIGH 3×, etc."""
        if not findings:
            return 0.0
        weight_map = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "INFO": 0.5}
        total_w = total_s = 0.0
        for f in findings:
            sev = f.severity if hasattr(f, "severity") else f.get("severity", "LOW")
            rs  = f.risk_score if hasattr(f, "risk_score") else f.get("risk_score", 50.0)
            w   = weight_map.get(str(sev), 1.0)
            total_s += rs * w
            total_w += w
        return round(total_s / total_w, 1) if total_w else 0.0


# Module-level singleton
risk_scorer = RiskScorer()
