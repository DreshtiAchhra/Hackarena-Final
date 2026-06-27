"""
Browser Agent — Module 2
========================
Consumes the DiscoveryResult (page queue) from Module 1.
For each page, uses Playwright (headless Chromium) to:
  1. Render the page fully (JS executed, network idle).
  2. Capture full-page screenshot (PNG).
  3. Extract final rendered HTML (post-JS).
  4. Collect all active CSS (inline + external, deduped).
  5. Gather basic page metadata (title, viewport, load time).

Output: List[PageCapture] — one per page, written to an output directory.
All artefacts are saved as files; the JSON manifest references them by path.

Design decisions:
  - Single browser instance, one context per run (shared cookie jar is fine
    for public sites; isolate contexts if auth is needed later).
  - Pages are processed concurrently up to BROWSER_SETTINGS.max_workers.
  - asyncio.Semaphore gates concurrency — Playwright is process-heavy.
  - Each page gets its own Playwright Page object (closed after capture)
    to prevent state leakage between pages.
  - CSS is extracted via document.styleSheets so we get computed/injected
    styles that plain HTML scraping would miss.
  - Screenshots use full_page=True so the auditor sees everything, not
    just the above-the-fold viewport.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

from playwright.async_api import (
    async_playwright,
    Browser,
    BrowserContext,
    Page,
    TimeoutError as PWTimeout,
)

logger = logging.getLogger(__name__)


# ── Settings ──────────────────────────────────────────────────────────

@dataclass(frozen=True)
class BrowserSettings:
    # Concurrent pages processed at once (Chromium is memory-heavy)
    max_workers: int = 3

    # Milliseconds to wait for networkidle after navigation
    network_idle_timeout: int = 20_000  # 20 s

    # Milliseconds for individual page load hard-cap
    page_load_timeout: int = 30_000     # 30 s

    # Viewport dimensions
    viewport_width: int = 1280
    viewport_height: int = 800

    # Output directory (relative to CWD)
    output_dir: str = "captures"

    # Whether to capture screenshots (disable for speed during dev)
    capture_screenshots: bool = True


BROWSER_SETTINGS = BrowserSettings()


# ── Data model ────────────────────────────────────────────────────────

@dataclass
class PageCapture:
    """All artefacts collected for one page. Paths are relative to output_dir."""
    url: str
    status: str                    # "ok" | "error"
    error: Optional[str] = None

    # File paths (set after saving)
    html_path: Optional[str] = None
    screenshot_path: Optional[str] = None
    css_path: Optional[str] = None
    metadata_path: Optional[str] = None

    # Inline metadata (also written to metadata_path as JSON)
    title: Optional[str] = None
    load_time_ms: Optional[int] = None
    final_url: Optional[str] = None       # after redirects
    page_height_px: Optional[int] = None


@dataclass
class BrowserAgentResult:
    """Output contract passed to Module 3 (Data Collector / Lighthouse)."""
    total_pages: int
    successful: int
    failed: int
    output_dir: str
    captures: List[PageCapture] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "total_pages": self.total_pages,
            "successful": self.successful,
            "failed": self.failed,
            "output_dir": self.output_dir,
            "captures": [asdict(c) for c in self.captures],
        }


# ── Browser Agent ─────────────────────────────────────────────────────

class BrowserAgent:
    """
    Playwright-based page capture agent.

    Usage (mirrors Module 1 pattern):
        async with BrowserAgent() as agent:
            result = await agent.run(discovery_result)
    """

    def __init__(self, settings: BrowserSettings = BROWSER_SETTINGS) -> None:
        self._settings = settings
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._sem = asyncio.Semaphore(settings.max_workers)
        self._output_dir = Path(settings.output_dir)

    # ── Context manager ───────────────────────────────────────────────

    async def __aenter__(self) -> "BrowserAgent":
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",   # avoid /dev/shm OOM in containers
                "--disable-gpu",
            ],
        )
        self._context = await self._browser.new_context(
            viewport={
                "width": self._settings.viewport_width,
                "height": self._settings.viewport_height,
            },
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 "
                "UX-Auditor/1.0"
            ),
            ignore_https_errors=True,
        )
        self._output_dir.mkdir(parents=True, exist_ok=True)
        logger.info("Browser agent ready. Output: %s", self._output_dir.resolve())
        return self

    async def __aexit__(self, *_) -> None:
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        await self._pw.stop()

    # ── Public API ────────────────────────────────────────────────────

    async def run(self, urls: List[str]) -> BrowserAgentResult:
        """
        Process all URLs from the discovery result.

        Args:
            urls: List of absolute URLs to capture.

        Returns:
            BrowserAgentResult with one PageCapture per URL.
        """
        tasks = [self._capture_page(url) for url in urls]
        captures: List[PageCapture] = await asyncio.gather(*tasks)

        successful = sum(1 for c in captures if c.status == "ok")
        result = BrowserAgentResult(
            total_pages=len(captures),
            successful=successful,
            failed=len(captures) - successful,
            output_dir=str(self._output_dir.resolve()),
            captures=captures,
        )

        # Write the manifest so Module 3 can pick it up
        manifest_path = self._output_dir / "manifest.json"
        manifest_path.write_text(json.dumps(result.to_dict(), indent=2))
        logger.info(
            "Agent done — %d ok / %d failed. Manifest: %s",
            successful, result.failed, manifest_path,
        )
        return result

    # ── Per-page capture ──────────────────────────────────────────────

    async def _capture_page(self, url: str) -> PageCapture:
        """Capture a single page; never raises — errors are recorded in PageCapture."""
        async with self._sem:
            page = await self._context.new_page()
            capture = PageCapture(url=url, status="error")
            try:
                capture = await self._do_capture(page, url)
            except Exception as exc:
                capture.error = str(exc)
                logger.warning("Capture failed for %s: %s", url, exc)
            finally:
                await page.close()
            return capture

    async def _do_capture(self, page: Page, url: str) -> PageCapture:
        """
        Navigate, wait for network idle, then collect all artefacts.
        Returns a fully-populated PageCapture on success.
        """
        capture = PageCapture(url=url, status="error")
        slug = self._url_to_slug(url)
        page_dir = self._output_dir / slug
        page_dir.mkdir(parents=True, exist_ok=True)

        # ── 1. Navigate ───────────────────────────────────────────────
        t0 = time.monotonic()
        try:
            response = await page.goto(
                url,
                wait_until="networkidle",
                timeout=self._settings.network_idle_timeout,
            )
        except PWTimeout:
            # Fallback: accept the page even if network never goes idle
            # (common on pages with polling / SSE / ads)
            logger.debug("networkidle timeout for %s — capturing anyway", url)
            response = None

        capture.load_time_ms = int((time.monotonic() - t0) * 1000)
        capture.final_url = page.url  # may differ from url due to redirects

        # ── 2. Page title ─────────────────────────────────────────────
        capture.title = await page.title()

        # ── 3. Full-page height (useful for UX heuristics later) ──────
        capture.page_height_px = await page.evaluate(
            "document.documentElement.scrollHeight"
        )

        # ── 4. Rendered HTML ──────────────────────────────────────────
        html = await page.content()       # post-JS rendered DOM
        html_path = page_dir / "rendered.html"
        html_path.write_text(html, encoding="utf-8")
        capture.html_path = str(html_path)

        # ── 5. CSS collection ─────────────────────────────────────────
        css_text = await self._extract_css(page)
        css_path = page_dir / "styles.css"
        css_path.write_text(css_text, encoding="utf-8")
        capture.css_path = str(css_path)

        # ── 6. Full-page screenshot ───────────────────────────────────
        if self._settings.capture_screenshots:
            ss_path = page_dir / "screenshot.png"
            await page.screenshot(
                path=str(ss_path),
                full_page=True,
                type="png",
            )
            capture.screenshot_path = str(ss_path)

        # ── 7. Metadata JSON ──────────────────────────────────────────
        metadata = {
            "url": url,
            "final_url": capture.final_url,
            "title": capture.title,
            "load_time_ms": capture.load_time_ms,
            "page_height_px": capture.page_height_px,
            "http_status": response.status if response else None,
            "viewport": {
                "width": self._settings.viewport_width,
                "height": self._settings.viewport_height,
            },
        }
        meta_path = page_dir / "metadata.json"
        meta_path.write_text(json.dumps(metadata, indent=2))
        capture.metadata_path = str(meta_path)

        capture.status = "ok"
        logger.info("✅ Captured %s (%d ms)", url, capture.load_time_ms)
        return capture

    # ── CSS extraction ────────────────────────────────────────────────

    @staticmethod
    async def _extract_css(page: Page) -> str:
        """
        Extract all CSS text visible to the browser:
          - Inline <style> blocks
          - External stylesheets (already fetched by the browser)
          - <style> injected by JS frameworks

        Uses document.styleSheets API — more reliable than parsing HTML
        because it includes dynamically injected styles.
        """
        css_chunks: List[str] = await page.evaluate("""
            () => {
                const chunks = [];
                for (const sheet of document.styleSheets) {
                    try {
                        // cssRules throws SecurityError for cross-origin sheets
                        const rules = Array.from(sheet.cssRules || []);
                        if (rules.length > 0) {
                            const src = sheet.href ? `/* Source: ${sheet.href} */` : '/* inline */';
                            chunks.push(src + '\\n' + rules.map(r => r.cssText).join('\\n'));
                        }
                    } catch (e) {
                        // Cross-origin stylesheet — record the URL but skip rules
                        if (sheet.href) {
                            chunks.push(`/* cross-origin (skipped): ${sheet.href} */`);
                        }
                    }
                }
                return chunks;
            }
        """)
        return "\n\n".join(css_chunks) if css_chunks else "/* no styles found */"

    # ── Utility ───────────────────────────────────────────────────────

    @staticmethod
    def _url_to_slug(url: str) -> str:
        """
        Convert a URL to a safe filesystem directory name.
        e.g. https://example.com/about → example.com__about
        """
        parsed = urlparse(url)
        path_part = parsed.path.strip("/").replace("/", "__") or "root"
        return f"{parsed.netloc}__{path_part}"[:120]   # cap at 120 chars