"""
modules/wcag_engine/router.py

FastAPI router — POST /api/v1/wcag-audit

Register in main.py:
    from modules.wcag_engine.router import router as wcag_router
    app.include_router(wcag_router)
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .engine import WCAGEngine
from utils.models import WCAGAuditResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["WCAG Audit"])


class WCAGAuditRequest(BaseModel):
    manifest_path: str


@router.post(
    "/wcag-audit",
    response_model=WCAGAuditResult,
    summary="Run WCAG 2.1 AA static analysis on browser-agent captures",
    description=(
        "Accepts the path to a `manifest.json` produced by the Browser Agent (Module 2). "
        "Runs all configured WCAG rule checkers over the captured HTML/CSS and returns "
        "a structured audit result with per-page issues, severity ratings, and scores."
    ),
)
async def wcag_audit(request: WCAGAuditRequest) -> WCAGAuditResult:
    logger.info("WCAG audit request received for manifest: %s", request.manifest_path)
    try:
        async with WCAGEngine() as engine:
            result = await engine.audit(request.manifest_path)
        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error during WCAG audit")
        raise HTTPException(status_code=500, detail=f"Audit failed: {exc}") from exc
