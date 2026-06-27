"""
Browser Crawler (Fallback)
==========================
Used when no sitemap is found or the sitemap is sparse.

Strategy:
  - Breadth-First Search (BFS) starting from the seed URL.
  - Stays within the same origin (no external link following).
  - Respects max_pages and max_concurrent_requests limits.
  - Uses aiohttp (not Playwright) for speed — this is link discovery only.
    The Browser Agent module (future) handles full JS rendering.

Design decisions:
  - asyncio.Semaphore caps concurrency without thread overhead.
  - BeautifulSoup is used for robust <a href> extraction, tolerant of
    malformed HTML that lxml would reject.
  - Pages are yielded in BFS order so shallow (important) pages are
    discovered first, even if max_pages cuts the crawl short.
"""

from __future__ import annotations

import asyncio
import logging
from collections import deque
from typing import List, Set

import aiohttp
from bs4 import BeautifulSoup

from config.settings import DISCOVERY_SETTINGS
from utils.models import DiscoveredPage, DiscoveryMethod
from utils.url_utils import normalise_url, same_origin

logger = logging.getLogger(__name__)


class BrowserCrawler:
    """
    Lightweight async BFS link crawler.

    Usage:
        crawler = BrowserCrawler(session)
        pages = await crawler.crawl("https://example.com")
    """

    def __init__(self, session: aiohttp.ClientSession) -> None:
        self._session = session
        self._sem = asyncio.Semaphore(DISCOVERY_SETTINGS.max_concurrent_requests)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def crawl(self, seed_url: str) -> List[DiscoveredPage]:
        """
        BFS crawl starting at *seed_url*.
        Returns up to max_pages DiscoveredPage objects.
        """
        visited: Set[str] = set()
        # Queue entries: (url, depth)
        queue: deque[tuple[str, int]] = deque()
        pages: List[DiscoveredPage] = []

        normalised_seed = normalise_url(seed_url)
        if not normalised_seed:
            logger.error("Invalid seed URL: %s", seed_url)
            return pages

        queue.append((normalised_seed, 0))
        visited.add(normalised_seed)

        while queue and len(pages) < DISCOVERY_SETTINGS.max_pages:
            # Process the current BFS level concurrently
            level_batch = self._drain_level(queue, DISCOVERY_SETTINGS.max_concurrent_requests)
            if not level_batch:
                break

            tasks = [
                self._fetch_links(url, depth, seed_url)
                for url, depth in level_batch
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for (url, depth), result in zip(level_batch, results):
                if isinstance(result, Exception):
                    logger.debug("Crawl error for %s: %s", url, result)
                    continue

                # The page itself is valid — record it
                pages.append(
                    DiscoveredPage(
                        url=url,
                        method=DiscoveryMethod.CRAWL,
                        depth=depth,
                    )
                )

                # Enqueue newly discovered child links
                for child_url in result:
                    if child_url not in visited and same_origin(child_url, seed_url):
                        visited.add(child_url)
                        queue.append((child_url, depth + 1))

        logger.info("Crawl complete — %d pages discovered", len(pages))
        return pages[: DISCOVERY_SETTINGS.max_pages]

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _drain_level(
        queue: deque[tuple[str, int]], batch_size: int
    ) -> list[tuple[str, int]]:
        """Pop up to *batch_size* items from the queue."""
        batch = []
        while queue and len(batch) < batch_size:
            batch.append(queue.popleft())
        return batch

    async def _fetch_links(
        self, url: str, depth: int, base_url: str
    ) -> List[str]:
        """
        Fetch *url* and return a list of same-origin absolute links found.
        Raises on network or HTTP errors so the caller can log and skip.
        """
        async with self._sem:
            async with self._session.get(
                url,
                timeout=aiohttp.ClientTimeout(
                    total=DISCOVERY_SETTINGS.request_timeout_seconds
                ),
                allow_redirects=True,
                headers={"User-Agent": DISCOVERY_SETTINGS.user_agent},
            ) as resp:
                if resp.status != 200:
                    logger.debug("HTTP %s for %s", resp.status, url)
                    return []

                content_type = resp.headers.get("Content-Type", "")
                if "text/html" not in content_type:
                    # Only parse HTML pages for links
                    return []

                html = await resp.text(errors="replace")

        return self._extract_links(html, url)

    @staticmethod
    def _extract_links(html: str, base_url: str) -> List[str]:
        """
        Parse HTML and return normalised absolute URLs from <a href> tags.
        BeautifulSoup is used here for resilience against messy real-world HTML.
        """
        soup = BeautifulSoup(html, "html.parser")
        links: List[str] = []

        for tag in soup.find_all("a", href=True):
            href = tag["href"].strip()
            normalised = normalise_url(href, base=base_url)
            if normalised:
                links.append(normalised)

        return links
