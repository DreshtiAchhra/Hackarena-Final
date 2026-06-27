"""
Website Discovery Service
=========================
The single public entry-point for Module 1.

Orchestration logic:
  1. Try the SitemapParser (fast, metadata-rich).
  2. If no sitemap found OR sitemap returned < 2 pages, fall back to
     BrowserCrawler (slower but always works).
  3. Return a DiscoveryResult with a deduplicated, priority-sorted page list.

All sub-modules communicate through Pydantic models — no raw dicts leak out.
"""

from __future__ import annotations

import logging
import sys
from typing import Optional

import aiohttp

from config.settings import DISCOVERY_SETTINGS
from modules.discovery.sitemap_parser import SitemapParser
from modules.discovery.browser_crawler import BrowserCrawler
from utils.models import DiscoveryResult, DiscoveredPage
from utils.url_utils import normalise_url

logger = logging.getLogger(__name__)


class DiscoveryService:
    """
    Facade over SitemapParser + BrowserCrawler.

    Designed to be instantiated once and reused across requests,
    sharing a single aiohttp.ClientSession for connection pooling.
    """

    def __init__(self, session: Optional[aiohttp.ClientSession] = None) -> None:
        # Caller can inject a session (for testing / connection reuse)
        self._session = session
        self._owns_session = session is None

    # ------------------------------------------------------------------
    # Context manager support — ensures session is properly closed
    # ------------------------------------------------------------------

    async def __aenter__(self) -> "DiscoveryService":
        if self._owns_session:
            connector = aiohttp.TCPConnector(limit=20, ssl=False)
            self._session = aiohttp.ClientSession(
                connector=connector,
                headers={"User-Agent": DISCOVERY_SETTINGS.user_agent},
            )
        return self

    async def __aexit__(self, *_) -> None:
        if self._owns_session and self._session:
            await self._session.close()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def discover(self, url: str) -> DiscoveryResult:
        """
        Discover all pages reachable from *url*.

        Args:
            url: The seed URL supplied by the user.

        Returns:
            DiscoveryResult with a deduplicated list of DiscoveredPage objects.

        Raises:
            ValueError: If *url* is not a valid absolute HTTP(S) URL.
            RuntimeError: If called without an active session (missing async context).
        """
        if self._session is None:
            raise RuntimeError(
                "DiscoveryService must be used as an async context manager."
            )

        normalised = normalise_url(url)
        if not normalised:
            raise ValueError(f"Invalid or unsupported URL: {url!r}")

        logger.info("Starting discovery for: %s", normalised)

        # ── Step 1: Try sitemap ───────────────────────────────────────
        sitemap_parser = SitemapParser(self._session)
        pages, sitemap_found = await sitemap_parser.discover(normalised)

        crawl_used = False

        # ── Step 2: Fallback to crawler if sitemap is absent/sparse ──
        if not sitemap_found or len(pages) < 2:
            logger.info(
                "Sitemap %s — switching to BFS crawl.",
                "sparse" if sitemap_found else "not found",
            )
            crawler = BrowserCrawler(self._session)
            crawl_pages = await crawler.crawl(normalised)
            crawl_used = True

            # Merge: prefer sitemap pages (have priority metadata), then crawl
            existing_urls = {p.url for p in pages}
            for page in crawl_pages:
                if page.url not in existing_urls:
                    pages.append(page)
                    existing_urls.add(page.url)

        # ── Step 3: Sort by priority descending (sitemap pages first) ─
        pages.sort(key=lambda p: p.priority, reverse=True)

        # ── Step 4: Enforce max_pages cap ─────────────────────────────
        pages = pages[: DISCOVERY_SETTINGS.max_pages]

        result = DiscoveryResult(
            seed_url=normalised,
            pages=pages,
            sitemap_found=sitemap_found,
            crawl_used=crawl_used,
        )

        logger.info(
            "Discovery complete: %d pages | sitemap=%s | crawl=%s",
            result.total_discovered,
            sitemap_found,
            crawl_used,
        )
        return result
