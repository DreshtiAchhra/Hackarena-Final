"""
modules/wcag_engine/engine.py

WCAGEngine — orchestrates per-page HTML/CSS static analysis using the rule set
defined in modules/wcag_engine/rules/.

Usage (mirrors Module 1 & 2 patterns):

    async with WCAGEngine() as engine:
        result = await engine.audit("captures/manifest.json")

    print(result.model_dump_json(indent=2))
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from bs4 import BeautifulSoup

from utils.models import (
    BrowserAgentResult,
    PageCapture,
    PageWCAGResult,
    WCAGAuditResult,
    WCAGIssue,
    WCAGSeverity,
)
from .rules import ALL_RULES

logger = logging.getLogger(__name__)


class WCAGEngine:
    """Static WCAG 2.1 AA analysis engine for captured HTML/CSS artefacts."""

    # ──────────────────────────────────────────────────────────── lifecycle ───

    async def __aenter__(self) -> "WCAGEngine":
        logger.info("WCAGEngine starting up")
        return self

    async def __aexit__(self, *_) -> None:
        logger.info("WCAGEngine shut down")

    # ──────────────────────────────────────────────────────────── public API ──

    async def audit(self, manifest_path: str) -> WCAGAuditResult:
        """
        Read a browser_agent manifest.json, run all WCAG rules over every
        successfully captured page, and return a WCAGAuditResult.

        Per the core principle: never raise — errors are captured per page.
        """
        manifest = self._load_manifest(manifest_path)
        page_results: List[PageWCAGResult] = []

        for capture in manifest.captures:
            result = await self._audit_page(capture)
            page_results.append(result)

        total_issues = sum(r.issue_count for r in page_results)

        return WCAGAuditResult(
            total_pages=len(page_results),
            total_issues=total_issues,
            pages=page_results,
            audit_timestamp=datetime.now(timezone.utc).isoformat(),
            manifest_path=str(manifest_path),
        )

    # ──────────────────────────────────────────────────────── internal helpers ─

    def _load_manifest(self, manifest_path: str) -> BrowserAgentResult:
        path = Path(manifest_path)
        if not path.exists():
            raise FileNotFoundError(f"Manifest not found: {manifest_path}")
        raw = json.loads(path.read_text(encoding="utf-8"))
        return BrowserAgentResult.model_validate(raw)

    async def _audit_page(self, capture: PageCapture) -> PageWCAGResult:
        """Run all rules against a single page capture. Never raises."""
        url = capture.url

        # Skip pages that the browser agent failed to capture
        if capture.status != "ok" or not capture.html_path:
            reason = capture.error or "Browser agent did not capture this page successfully."
            logger.warning("Skipping %s — %s", url, reason)
            return PageWCAGResult(url=url, issues=[], error=reason)

        try:
            html_text = Path(capture.html_path).read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            logger.error("Cannot read HTML for %s: %s", url, exc)
            return PageWCAGResult(url=url, issues=[], error=str(exc))

        css_text = ""
        if capture.css_path:
            try:
                css_text = Path(capture.css_path).read_text(encoding="utf-8", errors="replace")
            except OSError as exc:
                logger.warning("Cannot read CSS for %s: %s", url, exc)

        soup = BeautifulSoup(html_text, "html.parser")

        raw_issues: list[dict] = []
        for rule in ALL_RULES:
            try:
                raw_issues.extend(rule.check(soup, css_text))
            except Exception as exc:  # noqa: BLE001
                logger.error(
                    "Rule %s raised on %s: %s", rule.rule_id, url, exc, exc_info=True
                )
                # Don't let one broken rule abort the whole page

        # Coerce raw dicts → WCAGIssue models (drop malformed ones gracefully)
        typed_issues: List[WCAGIssue] = []
        for raw in raw_issues:
            try:
                typed_issues.append(WCAGIssue.model_validate(raw))
            except Exception as exc:  # noqa: BLE001
                logger.warning("Dropping malformed issue dict on %s: %s | %s", url, raw, exc)

        return PageWCAGResult(url=url, issues=typed_issues)

    # ──────────────────────────────────────────────────────── repr ────────────

    def __repr__(self) -> str:
        return f"WCAGEngine(rules={len(ALL_RULES)})"
