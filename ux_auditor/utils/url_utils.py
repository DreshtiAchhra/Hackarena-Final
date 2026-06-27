"""
URL utility functions used by both the sitemap parser and the browser crawler.
Kept pure (no I/O) so they are trivially unit-testable.
"""

from __future__ import annotations

from urllib.parse import urlparse, urljoin, urlunparse
from typing import Optional

from config.settings import DISCOVERY_SETTINGS


def normalise_url(url: str, base: Optional[str] = None) -> Optional[str]:
    """
    Return a canonical absolute URL, or None if the URL should be skipped.

    Normalisation steps:
      1. Resolve relative URLs against *base* when provided.
      2. Strip URL fragments (#section) — they are the same page.
      3. Drop trailing slashes for consistency.
      4. Lower-case the scheme and netloc.
      5. Reject non-HTTP(S) schemes (mailto:, javascript:, …).
      6. Reject URLs whose path ends with a known binary extension.
    """
    if base:
        url = urljoin(base, url.strip())

    parsed = urlparse(url)

    # Must be HTTP or HTTPS
    if parsed.scheme not in ("http", "https"):
        return None

    # Remove fragment; keep everything else
    cleaned = urlunparse((
        parsed.scheme.lower(),
        parsed.netloc.lower(),
        parsed.path.rstrip("/") or "/",
        parsed.params,
        parsed.query,
        "",  # no fragment
    ))

    # Drop URLs pointing at binary/static assets
    lower_path = parsed.path.lower()
    if any(lower_path.endswith(ext) for ext in DISCOVERY_SETTINGS.excluded_extensions):
        return None

    return cleaned


def same_origin(url: str, origin: str) -> bool:
    """Return True when *url* shares scheme+host with *origin*."""
    p_url = urlparse(url)
    p_origin = urlparse(origin)
    return (
        p_url.scheme.lower() == p_origin.scheme.lower()
        and p_url.netloc.lower() == p_origin.netloc.lower()
    )


def build_sitemap_candidates(base_url: str) -> list[str]:
    """
    Generate the list of sitemap URLs to probe for a given site root.
    Also probes robots.txt to extract a Sitemap: directive.
    """
    parsed = urlparse(base_url)
    root = f"{parsed.scheme}://{parsed.netloc}"
    return [
        f"{root}/{name}" for name in DISCOVERY_SETTINGS.sitemap_filenames
    ] + [f"{root}/robots.txt"]
