"""
Global configuration and constants for the UX Auditor system.
Centralises all tuneable parameters so modules never hard-code values.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class DiscoverySettings:
    # Maximum pages to collect per audit run (prevents runaway crawls)
    max_pages: int = 50

    # HTTP request timeout in seconds
    request_timeout_seconds: int = 15

    # How many concurrent HTTP requests are allowed during crawl
    max_concurrent_requests: int = 5

    # User-agent sent with every HTTP request
    user_agent: str = (
        "UX-Auditor-Bot/1.0 (+https://github.com/ux-auditor)"
    )

    # Paths that are almost never meaningful UX pages — skip them
    excluded_extensions: tuple = field(default_factory=lambda: (
        ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg",
        ".webp", ".ico", ".css", ".js", ".woff", ".woff2",
        ".ttf", ".eot", ".mp4", ".mp3", ".zip", ".gz",
    ))

    # robots.txt / sitemap discovery filenames to probe
    sitemap_filenames: tuple = field(default_factory=lambda: (
        "sitemap.xml",
        "sitemap_index.xml",
        "sitemap-index.xml",
        "wp-sitemap.xml",
    ))


# Singleton instance consumed by all modules
DISCOVERY_SETTINGS = DiscoverySettings()
