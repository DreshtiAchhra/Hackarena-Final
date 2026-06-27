"""
FastAPI router for the Browser Agent Service.
Exposes POST /api/v1/browser-agent for external consumers.
"""

from __future__ import annotations

import logging
from typing import List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from modules.browser_agent.agent import BrowserAgent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["browser_agent"])


class BrowserAgentRequest(BaseModel):
    """Request body containing page URLs to capture."""
    urls: List[str]


@router.post(
    "/browser-agent",
    summary="Run Playwright capture on target URLs",
    description="Invokes the headless browser agent to render pages, capture screenshots, HTML, and CSS.",
)
async def run_browser_agent(request: BrowserAgentRequest) -> dict:
    """
    Run browser capture for the given URLs.
    """
    if not request.urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL list cannot be empty.",
        )
    
    try:
        async with BrowserAgent() as agent:
            result = await agent.run(request.urls)
        return result.to_dict()
    except Exception as exc:
        logger.exception("Unexpected error during browser capture")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Browser capture failed: {str(exc)}",
        ) from exc
