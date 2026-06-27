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
from modules.discovery.router import router as discovery_router  # noqa: E402

app.include_router(discovery_router)


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


async def _run_browser_agent_test(urls_or_json: str) -> None:
    """
    Standalone test for the Browser Agent.
    Accepts either:
      - a single URL string, or
      - a path to a discovery manifest JSON (output of Module 1 test)
    """
    from modules.browser_agent import BrowserAgent

    # Resolve input: JSON file path or bare URL
    p = Path(urls_or_json)
    if p.exists() and p.suffix == ".json":
        data = json.loads(p.read_text())
        urls = [page["url"] for page in data.get("pages", [])]
        print(f"Loaded {len(urls)} URLs from {p}")
    else:
        urls = [urls_or_json]

    print(f"\n{'='*60}")
    print(f"  MODULE 2 TEST — Browser Agent")
    print(f"  Pages to capture: {len(urls)}")
    print(f"{'='*60}\n")

    async with BrowserAgent() as agent:
        result = await agent.run(urls)

    print(json.dumps(result.to_dict(), indent=2))

    print(f"\n{'─'*60}")
    print(f"  ✅ Total   : {result.total_pages}")
    print(f"  ✔  OK      : {result.successful}")
    print(f"  ✖  Failed  : {result.failed}")
    print(f"  📁 Output  : {result.output_dir}")
    print(f"{'─'*60}\n")
    for c in result.captures:
        icon = "✅" if c.status == "ok" else "❌"
        print(f"  {icon} {c.url}")
        if c.status == "ok":
            print(f"      title={c.title!r}  load={c.load_time_ms}ms  height={c.page_height_px}px")
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

    elif args[0] == "test-browser":
        # ── Run browser agent test ─────────────────────────────────
        if len(args) < 2:
            print("Usage: python main.py test-browser <url|discovery.json>")
            print("Example: python main.py test-browser https://example.com")
            print("Example: python main.py test-browser discovery_result.json")
            sys.exit(1)
        asyncio.run(_run_browser_agent_test(args[1]))

    else:
        print(f"Unknown command: {args[0]}")
        print("Usage:")
        print("  python main.py server                        # start API")
        print("  python main.py test <url>                    # test Module 1: Discovery")
        print("  python main.py test-browser <url|file.json>  # test Module 2: Browser Agent")
        sys.exit(1)


if __name__ == "__main__":
    main()