"""
Vanguard ASOC — Settings / Account Connect router
POST /api/v1/settings/connect  — validate AWS credentials & optionally write .env
GET  /api/v1/settings          — return current app settings
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException

from config import settings
from models.schemas import AppSettings, ConnectRequest, ConnectResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["Settings"])

# Path to the backend .env file
_ENV_PATH = Path(__file__).parent.parent / ".env"

ALL_REGIONS = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
    "ap-south-1", "sa-east-1", "ca-central-1",
]


@router.get("", response_model=AppSettings)
async def get_settings():
    """Return current application settings and connection status."""
    connected = bool(
        settings.aws_access_key_id and
        settings.aws_access_key_id != "your_access_key_here"
    )
    return AppSettings(
        mock_mode=settings.mock_mode,
        dry_run=settings.dry_run,
        aws_default_region=settings.aws_default_region,
        aws_connected=connected,
        version=settings.version,
    )


@router.post("/connect", response_model=ConnectResponse)
async def connect_account(req: ConnectRequest):
    """
    Validate AWS credentials via STS GetCallerIdentity.
    If save_to_env=True, writes credentials to backend/.env and reloads config.
    """
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError

    try:
        kwargs: dict = {
            "region_name": req.aws_default_region,
            "aws_access_key_id": req.aws_access_key_id,
            "aws_secret_access_key": req.aws_secret_access_key,
        }
        if req.aws_session_token:
            kwargs["aws_session_token"] = req.aws_session_token

        sts = boto3.client("sts", **kwargs)
        identity = sts.get_caller_identity()
        account_id = identity["Account"]
        user_arn = identity["Arn"]

        # Try to get account alias
        iam = boto3.client("iam", **kwargs)
        try:
            aliases = iam.list_account_aliases().get("AccountAliases", [])
            alias = aliases[0] if aliases else None
        except Exception:
            alias = None

        if req.save_to_env:
            _write_env(req)
            _reload_settings(req)

        return ConnectResponse(
            success=True,
            account_id=account_id,
            account_alias=alias,
            user_arn=user_arn,
            regions_available=ALL_REGIONS,
            message=f"Connected to AWS account {account_id}" + (f" ({alias})" if alias else ""),
        )

    except NoCredentialsError:
        raise HTTPException(status_code=401, detail="Invalid AWS credentials — no credentials found")
    except ClientError as e:
        code = e.response["Error"]["Code"]
        msg  = e.response["Error"]["Message"]
        raise HTTPException(status_code=401, detail=f"AWS auth failed [{code}]: {msg}")
    except Exception as exc:
        logger.error(f"Connect error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


def _write_env(req: ConnectRequest) -> None:
    """Write credentials and settings to backend/.env."""
    lines = []
    if _ENV_PATH.exists():
        lines = _ENV_PATH.read_text().splitlines()

    def _set(key: str, value: str) -> None:
        idx = next((i for i, l in enumerate(lines) if l.startswith(f"{key}=")), None)
        if idx is not None:
            lines[idx] = f"{key}={value}"
        else:
            lines.append(f"{key}={value}")

    _set("MOCK_MODE",              str(req.mock_mode).lower())
    _set("DRY_RUN",                str(req.dry_run).lower())
    _set("AWS_ACCESS_KEY_ID",      req.aws_access_key_id)
    _set("AWS_SECRET_ACCESS_KEY",  req.aws_secret_access_key)
    _set("AWS_DEFAULT_REGION",     req.aws_default_region)
    if req.aws_session_token:
        _set("AWS_SESSION_TOKEN",  req.aws_session_token)
    if req.gemini_api_key:
        _set("GEMINI_API_KEY",     req.gemini_api_key)

    _ENV_PATH.write_text("\n".join(lines) + "\n")
    logger.info(f"Wrote credentials to {_ENV_PATH}")


def _reload_settings(req: ConnectRequest) -> None:
    """Update live settings object without restarting the server."""
    settings.aws_access_key_id      = req.aws_access_key_id
    settings.aws_secret_access_key  = req.aws_secret_access_key
    settings.aws_default_region     = req.aws_default_region
    settings.mock_mode              = req.mock_mode
    settings.dry_run                = req.dry_run
    if req.aws_session_token:
        settings.aws_session_token  = req.aws_session_token
    if req.gemini_api_key:
        settings.gemini_api_key     = req.gemini_api_key
    logger.info("Live settings updated — no restart needed")
