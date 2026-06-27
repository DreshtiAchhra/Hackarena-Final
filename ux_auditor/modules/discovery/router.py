"""
FastAPI router for the Website Discovery Service.
Exposes POST /api/v1/discover for external consumers.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, field_validator

from modules.discovery import DiscoveryService
from utils.models import DiscoveryResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["discovery"])


class DiscoverRequest(BaseModel):
    """Request body for the discovery endpoint."""
    url: str

    @field_validator("url")
    @classmethod
    def must_be_http(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v.strip()


@router.post(
    "/discover",
    response_model=DiscoveryResult,
    summary="Discover all pages on a website",
    description=(
        "Probes the site's sitemap first. Falls back to BFS crawl "
        "when no sitemap is found or it contains fewer than 2 pages."
    ),
)
async def discover(request: DiscoverRequest) -> DiscoveryResult:
    """
    Discover pages reachable from the given URL.

    - **url**: Absolute HTTP/HTTPS URL of the website to audit.
    """
    try:
        async with DiscoveryService() as svc:
            result = await svc.discover(request.url)
        return result
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during discovery for %s", request.url)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Discovery failed due to an internal error.",
        ) from exc
