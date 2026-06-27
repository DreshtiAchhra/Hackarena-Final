"""
utils/models.py — Shared Pydantic models for the Conversational UX Auditor pipeline.

This is the single source of truth for all data contracts between modules.
Every module imports from here — no module defines its own ad-hoc dicts.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ══════════════════════════════════════════════════════════════════════════════
# Module 1 — Discovery Service
# ══════════════════════════════════════════════════════════════════════════════

class DiscoveryMethod(str, Enum):
    """How a page URL was discovered."""
    SITEMAP = "sitemap"
    CRAWL   = "crawl"
    MANUAL  = "manual"   # URL supplied directly by caller


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
    """Output contract of the Website Discovery Service."""

    seed_url: str
    sitemap_found: bool = False
    crawl_used: bool = False
    total_discovered: int = 0
    pages: List[DiscoveredPage] = Field(default_factory=list)

    def model_post_init(self, __context) -> None:  # noqa: ANN001
        self.total_discovered = len(self.pages)


# ══════════════════════════════════════════════════════════════════════════════
# Module 2 — Browser Agent
# ══════════════════════════════════════════════════════════════════════════════

class PageCapture(BaseModel):
    """All artefacts collected for one page by the Browser Agent."""

    url: str
    status: str                      # "ok" | "error"
    error: Optional[str] = None
    html_path: Optional[str] = None
    screenshot_path: Optional[str] = None
    css_path: Optional[str] = None
    metadata_path: Optional[str] = None
    title: Optional[str] = None
    load_time_ms: Optional[int] = None
    final_url: Optional[str] = None  # may differ from url after redirects
    page_height_px: Optional[int] = None


class BrowserAgentResult(BaseModel):
    """Output contract of the Browser Agent (Module 2)."""

    total_pages: int
    successful: int
    failed: int
    output_dir: str
    captures: List[PageCapture] = Field(default_factory=list)


# ══════════════════════════════════════════════════════════════════════════════
# Module 4 — WCAG Rule Engine
# ══════════════════════════════════════════════════════════════════════════════

class WCAGSeverity(str, Enum):
    CRITICAL = "critical"   # Blocks access entirely (e.g. no alt on form button image)
    SERIOUS  = "serious"    # Major barrier (e.g. unlabelled form field)
    MODERATE = "moderate"   # Causes confusion (e.g. broken heading order)
    MINOR    = "minor"      # Best practice violation (e.g. redundant alt text)


class WCAGIssue(BaseModel):
    rule_id: str        = Field(..., description="e.g. WCAG_1_1_1")
    criterion: str      = Field(..., description="e.g. 1.1.1 Non-text Content")
    severity: WCAGSeverity
    element: str        = Field(..., description="CSS selector or description of offending element")
    description: str    = Field(..., description="What is wrong and why it matters")
    recommendation: str = Field(..., description="Actionable fix")
    wcag_url: str       = Field(..., description="Link to the WCAG Understanding doc")


class PageWCAGResult(BaseModel):
    url: str
    issues: List[WCAGIssue] = Field(default_factory=list)
    issue_count: int = 0
    critical_count: int = 0
    score: float = Field(
        default=100.0,
        description="0.0–100.0 accessibility score. 100 = no issues found.",
    )
    error: Optional[str] = Field(
        default=None,
        description="Set if the page could not be audited.",
    )

    def model_post_init(self, __context) -> None:  # noqa: ANN001
        """Auto-compute derived fields after construction."""
        self.issue_count = len(self.issues)
        self.critical_count = sum(
            1 for i in self.issues if i.severity == WCAGSeverity.CRITICAL
        )
        self.score = self._compute_score()

    def _compute_score(self) -> float:
        """
        Penalty-based score:
          - critical → −20 pts each
          - serious  → −10 pts each
          - moderate → −5  pts each
          - minor    → −2  pts each
        Clamped to [0, 100].
        """
        _PENALTY = {
            WCAGSeverity.CRITICAL: 20,
            WCAGSeverity.SERIOUS:  10,
            WCAGSeverity.MODERATE:  5,
            WCAGSeverity.MINOR:     2,
        }
        penalty = sum(_PENALTY.get(i.severity, 0) for i in self.issues)
        return max(0.0, 100.0 - penalty)


class WCAGAuditResult(BaseModel):
    total_pages: int
    total_issues: int
    pages: List[PageWCAGResult] = Field(default_factory=list)
    audit_timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    manifest_path: Optional[str] = None