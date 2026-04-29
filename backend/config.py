"""
Vanguard ASOC — Configuration
Loads all environment variables via python-dotenv / pydantic-settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────
    app_name: str = "Vanguard ASOC"
    version: str = "1.0.0"
    debug: bool = False

    # ── Mode ──────────────────────────────────────────────────────────────
    mock_mode: bool = True   # True = use simulated data, no real AWS calls
    dry_run: bool = True     # True = remediator shows diffs, won't execute

    # ── AWS ───────────────────────────────────────────────────────────────
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_default_region: str = "us-east-1"
    aws_session_token: Optional[str] = None

    # ── AI ────────────────────────────────────────────────────────────────
    gemini_api_key: str = ""   # Required — set in .env

    # ── Auth ──────────────────────────────────────────────────────────────
    jwt_secret: str = ""       # Required — set in .env (use: python -c "import secrets; print(secrets.token_hex(32))")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # ── Database ──────────────────────────────────────────────────────────
    database_url: str = "sqlite:///./vanguard.db"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


# Module-level singleton used across services
settings = get_settings()
