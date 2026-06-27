"""
Shared Pydantic models that act as the data contracts between modules.
Every module imports from here — no module defines its own ad-hoc dicts.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, HttpUrl, field_validator


class DiscoveryMethod(str, Enum):
    """How a page URL was discovered."""
    SITEMAP = "sitemap"
    CRAWL = "crawl"
    MANUAL = "manual"          # URL supplied directly by caller


class DiscoveredPage(BaseModel):
    """A single page identified during website discovery."""

    url: str                              # Absolute URL of the page
    method: DiscoveryMethod               # How it was found
    depth: int = 0                        # Crawl depth (0 = seed URL)
    priority: float = 0.5                 # From sitemap <priority> tag (default 0.5)
    last_modified: Optional[str] = None   # ISO-8601 string if present in sitemap

    @field_validator("url")
    @classmethod
    def url_must_be_absolute(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError(f"URL must be absolute, got: {v}")
        return v


class DiscoveryResult(BaseModel):
    """
    Output contract of the Website Discovery Service.
    Downstream modules (Browser Agent, etc.) consume this.
    """

    seed_url: str                          # The URL the user submitted
    pages: List[DiscoveredPage]            # Deduplicated, ordered page list
    sitemap_found: bool = False
    crawl_used: bool = False               # True when sitemap was absent/failed
    total_discovered: int = 0

    def model_post_init(self, __context) -> None:  # noqa: ANN001
        self.total_discovered = len(self.pages)
