"""
Sitemap Parser
==============
Responsibilities:
  - Probe known sitemap locations and robots.txt for a Sitemap: directive.
  - Parse standard XML sitemaps and sitemap-index files (recursive).
  - Return a list of DiscoveredPage objects with priority / lastmod metadata.

Design decisions:
  - Pure async I/O via aiohttp so it never blocks the event loop.
  - Sitemap index files are resolved recursively (max 2 hops — enough for
    real sites, protects against infinite loops).
  - lxml is used for fast XML parsing; falls back gracefully on parse errors.
"""

from __future__ import annotations

import asyncio
import logging
import re
from typing import List, Optional, Set

import aiohttp
from lxml import etree

from config.settings import DISCOVERY_SETTINGS
from utils.models import DiscoveredPage, DiscoveryMethod
from utils.url_utils import normalise_url, build_sitemap_candidates

logger = logging.getLogger(__name__)

# XML namespace used by the Sitemap Protocol
_SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"


class SitemapParser:
    """
    Attempts to discover pages via XML sitemaps before falling back to crawl.

    Usage:
        parser = SitemapParser(session)
        pages, found = await parser.discover("https://example.com")
    """

    def __init__(self, session: aiohttp.ClientSession) -> None:
        self._session = session
        self._visited_sitemaps: Set[str] = set()  # guard against loops

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def discover(self, base_url: str) -> tuple[List[DiscoveredPage], bool]:
        """
        Try every known sitemap location for *base_url*.

        Returns:
            (pages, sitemap_found)
            pages        — deduplicated DiscoveredPage list
            sitemap_found — True when at least one sitemap was parsed
        """
        candidates = build_sitemap_candidates(base_url)
        pages: List[DiscoveredPage] = []
        sitemap_found = False

        for candidate in candidates:
            if candidate.endswith("robots.txt"):
                sitemap_url = await self._extract_sitemap_from_robots(candidate)
                if sitemap_url:
                    result = await self._parse_sitemap(sitemap_url, depth=0)
                    if result:
                        pages.extend(result)
                        sitemap_found = True
            else:
                result = await self._parse_sitemap(candidate, depth=0)
                if result:
                    pages.extend(result)
                    sitemap_found = True

        # Deduplicate while preserving first-seen order
        seen: Set[str] = set()
        unique: List[DiscoveredPage] = []
        for page in pages:
            if page.url not in seen:
                seen.add(page.url)
                unique.append(page)

        # Honour max_pages limit
        return unique[: DISCOVERY_SETTINGS.max_pages], sitemap_found

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _fetch(self, url: str) -> Optional[bytes]:
        """Fetch raw bytes from *url*; return None on any error."""
        try:
            async with self._session.get(
                url,
                timeout=aiohttp.ClientTimeout(
                    total=DISCOVERY_SETTINGS.request_timeout_seconds
                ),
                allow_redirects=True,
            ) as resp:
                if resp.status == 200:
                    return await resp.read()
                logger.debug("HTTP %s for %s", resp.status, url)
                return None
        except Exception as exc:  # network errors, timeouts, …
            logger.debug("Fetch failed for %s: %s", url, exc)
            return None

    async def _extract_sitemap_from_robots(self, robots_url: str) -> Optional[str]:
        """
        Parse robots.txt and return the first Sitemap: directive URL found,
        or None if absent.
        """
        raw = await self._fetch(robots_url)
        if not raw:
            return None
        text = raw.decode("utf-8", errors="replace")
        for line in text.splitlines():
            if line.lower().startswith("sitemap:"):
                sitemap_url = line.split(":", 1)[1].strip()
                logger.info("robots.txt revealed sitemap: %s", sitemap_url)
                return sitemap_url
        return None

    async def _parse_sitemap(
        self, url: str, depth: int
    ) -> Optional[List[DiscoveredPage]]:
        """
        Fetch and parse a single sitemap or sitemap-index file.
        Recursively resolves sitemap-index entries (max depth = 2).
        """
        if url in self._visited_sitemaps:
            return None
        if depth > 2:
            logger.warning("Sitemap recursion depth exceeded at %s", url)
            return None

        self._visited_sitemaps.add(url)
        raw = await self._fetch(url)
        if not raw:
            return None

        try:
            root = etree.fromstring(raw)
        except etree.XMLSyntaxError as exc:
            logger.warning("XML parse error for %s: %s", url, exc)
            return None

        tag = root.tag  # e.g. "{http://…}sitemapindex" or "{http://…}urlset"

        if "sitemapindex" in tag:
            return await self._parse_sitemap_index(root, depth)
        elif "urlset" in tag:
            return self._parse_urlset(root)
        else:
            logger.warning("Unknown sitemap root element: %s", tag)
            return None

    async def _parse_sitemap_index(
        self, root: etree._Element, depth: int
    ) -> List[DiscoveredPage]:
        """Handle <sitemapindex> by recursively fetching each child sitemap."""
        ns = {"sm": _SITEMAP_NS}
        child_urls = [
            loc.text.strip()
            for loc in root.findall("sm:sitemap/sm:loc", ns)
            if loc.text
        ]
        logger.info("Sitemap index contains %d child sitemaps", len(child_urls))

        # Fetch all child sitemaps concurrently
        tasks = [self._parse_sitemap(u, depth + 1) for u in child_urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        pages: List[DiscoveredPage] = []
        for result in results:
            if isinstance(result, list):
                pages.extend(result)
            elif isinstance(result, Exception):
                logger.debug("Child sitemap error: %s", result)
        return pages

    def _parse_urlset(self, root: etree._Element) -> List[DiscoveredPage]:
        """Handle <urlset> by extracting each <url> entry."""
        ns = {"sm": _SITEMAP_NS}
        pages: List[DiscoveredPage] = []

        for url_el in root.findall("sm:url", ns):
            loc = url_el.findtext("sm:loc", namespaces=ns)
            if not loc:
                continue

            normalised = normalise_url(loc.strip())
            if not normalised:
                continue

            priority_text = url_el.findtext("sm:priority", namespaces=ns)
            lastmod_text = url_el.findtext("sm:lastmod", namespaces=ns)

            try:
                priority = float(priority_text) if priority_text else 0.5
            except ValueError:
                priority = 0.5

            pages.append(
                DiscoveredPage(
                    url=normalised,
                    method=DiscoveryMethod.SITEMAP,
                    priority=priority,
                    last_modified=lastmod_text.strip() if lastmod_text else None,
                )
            )

        logger.info("Parsed %d URLs from urlset", len(pages))
        return pages
