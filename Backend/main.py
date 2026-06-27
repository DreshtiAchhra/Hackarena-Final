"""
main.py — UX Auditor FastAPI application + Module Test Runner
=============================================================

Run modes:
  1. API server:
       python main.py server
       (or)  uvicorn main:app --reload --port 8000

  2. Module test (no server needed):
       python main.py test <url>
       e.g. python main.py test https://example.com

The test mode lets you quickly validate each module from the CLI
without standing up the full server.
"""

from __future__ import annotations

import asyncio
import json
import logging
import sys
from pathlib import Path

# Configure Windows asyncio event loop policy for subprocess support in Playwright
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Logging setup ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── FastAPI app ────────────────────────────────────────────────────────
app = FastAPI(
    title="Conversational UX Auditor",
    description="AI-powered website UX & accessibility analysis pipeline.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register module routers ────────────────────────────────────────────
from fastapi.staticfiles import StaticFiles
from modules.discovery.router import router as discovery_router  # noqa: E402
from modules.browser_agent.router import router as browser_router  # noqa: E402

app.include_router(discovery_router)
app.include_router(browser_router)

# Serve captures statically
app.mount("/captures", StaticFiles(directory="captures"), name="captures")


@app.get("/health", tags=["meta"])
async def health() -> dict:
    """Quick liveness probe."""
    return {"status": "ok", "version": app.version}


# ══════════════════════════════════════════════════════════════════════
# CLI test runner — Module 1: Discovery Service
# ══════════════════════════════════════════════════════════════════════

async def _run_discovery_test(url: str) -> None:
    """
    Standalone async test for the Website Discovery Service.
    Prints a formatted JSON summary to stdout.
    """
    from modules.discovery import DiscoveryService

    print(f"\n{'='*60}")
    print(f"  MODULE 1 TEST — Website Discovery Service")
    print(f"  Target: {url}")
    print(f"{'='*60}\n")

    async with DiscoveryService() as svc:
        result = await svc.discover(url)

    # Pretty-print the full result
    output = result.model_dump()
    print(json.dumps(output, indent=2))

    # Human-friendly summary
    print(f"\n{'─'*60}")
    print(f"  ✅ Seed URL       : {result.seed_url}")
    print(f"  📄 Pages found    : {result.total_discovered}")
    print(f"  🗺  Sitemap used  : {result.sitemap_found}")
    print(f"  🕷  Crawl used    : {result.crawl_used}")
    print(f"{'─'*60}")

    if result.pages:
        print("\n  Top 5 discovered pages:")
        for i, page in enumerate(result.pages[:5], 1):
            print(f"  {i}. [{page.method.value:8s}] {page.url}")
    print()


def main() -> None:
    args = sys.argv[1:]

    if not args or args[0] == "server":
        # ── Start API server ───────────────────────────────────────
        print("Starting UX Auditor API server on http://localhost:8000")
        print("Docs available at http://localhost:8000/docs\n")
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
        )

    elif args[0] == "test":
        # ── Run module test ────────────────────────────────────────
        if len(args) < 2:
            print("Usage: python main.py test <url>")
            print("Example: python main.py test https://example.com")
            sys.exit(1)

        target_url = args[1]
        asyncio.run(_run_discovery_test(target_url))

    else:
        print(f"Unknown command: {args[0]}")
        print("Usage:")
        print("  python main.py server          # start API")
        print("  python main.py test <url>      # test discovery module")
        sys.exit(1)


if __name__ == "__main__":
    main()
