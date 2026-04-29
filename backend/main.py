"""
Vanguard ASOC — FastAPI application entry point.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db.database import init_db
from models.schemas import HealthResponse
from routers import ai_consultant, remediate, scan, threats, inventory, costs, metrics, iam_explorer, settings as settings_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("vanguard")


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🛡️  Vanguard ASOC v{settings.version} starting…")
    logger.info(f"   Mode  : {'MOCK 🔵' if settings.mock_mode else 'LIVE 🔴'}")
    logger.info(f"   Dry-run: {settings.dry_run}")
    init_db()
    logger.info("   SQLite DB initialised")
    yield
    logger.info("Vanguard shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Vanguard ASOC API",
    description=(
        "Automated Security Operations Center — "
        "AWS scanning, AI-driven remediation, live threat feed."
    ),
    version=settings.version,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
PREFIX = "/api/v1"
app.include_router(scan.router,              prefix=PREFIX)
app.include_router(remediate.router,         prefix=PREFIX)
app.include_router(threats.router,           prefix=PREFIX)
app.include_router(ai_consultant.router,     prefix=PREFIX)
app.include_router(inventory.router,         prefix=PREFIX)
app.include_router(costs.router,             prefix=PREFIX)
app.include_router(metrics.router,           prefix=PREFIX)
app.include_router(iam_explorer.router,      prefix=PREFIX)
app.include_router(settings_router.router,   prefix=PREFIX)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["Meta"])
async def health():
    return HealthResponse(
        status="online",
        mode="mock" if settings.mock_mode else "live",
        dry_run=settings.dry_run,
        version=settings.version,
    )


@app.get("/", tags=["Meta"])
async def root():
    return {
        "project": "Vanguard ASOC",
        "version": settings.version,
        "docs": "/api/docs",
        "health": "/health",
    }


# ── Dev entry point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
