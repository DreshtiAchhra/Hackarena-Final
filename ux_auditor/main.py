"""
main.py — UX Auditor FastAPI application + Module Test Runner
=============================================================

Run modes:
  1. API server:
       python main.py server
       (or)  uvicorn main:app --reload --port 8000

  2. Module tests (no server needed):
       python main.py test <url>
       python main.py test-browser <url|manifest.json>
       python main.py test-wcag <manifest.json>
"""

from __future__ import annotations

import asyncio
import json
import logging
import sys
from pathlib import Path

# ── Windows asyncio policy ─────────────────────────────────────────────
# Must be set before any async work. Required for Playwright on Windows.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# ── Logging setup ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── FastAPI app ────────────────────────────────────────────────────────
# All routers and mounts MUST be registered after this line.
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

# Module 1 — Discovery (always present)
from modules.discovery.router import router as discovery_router  # noqa: E402
app.include_router(discovery_router)

# Module 2 — Browser Agent (guarded: router.py may not exist yet)
try:
    from modules.browser_agent.router import router as browser_router
    app.include_router(browser_router)
    logger.info("Browser Agent router registered.")
except ImportError:
    logger.warning(
        "modules/browser_agent/router.py not found — "
        "POST /api/v1/browser-agent will be unavailable until it is created."
    )

# Module 4 — WCAG Engine (guarded: module may not exist yet)
try:
    from modules.wcag_engine.router import router as wcag_router
    app.include_router(wcag_router)
    logger.info("WCAG Engine router registered.")
except ImportError:
    logger.warning(
        "modules/wcag_engine/router.py not found — "
        "POST /api/v1/wcag-audit will be unavailable until it is created."
    )

# ── Static file serving ────────────────────────────────────────────────
# Only mount if the captures directory exists (created by Browser Agent).
_captures_dir = Path("captures")
if _captures_dir.exists():
    app.mount("/captures", StaticFiles(directory=str(_captures_dir)), name="captures")
    logger.info("Serving /captures from %s", _captures_dir.resolve())
else:
    logger.warning(
        "captures/ directory not found — /captures static mount skipped. "
        "Run 'python main.py test-browser <url>' to create it."
    )


# ── Health check ───────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
async def health() -> dict:
    """Quick liveness probe."""
    return {"status": "ok", "version": app.version}


# ══════════════════════════════════════════════════════════════════════
# CLI test runner — Module 1: Discovery Service
# ══════════════════════════════════════════════════════════════════════

async def _run_discovery_test(url: str) -> None:
    """Standalone async test for the Website Discovery Service."""
    from modules.discovery import DiscoveryService

    print(f"\n{'='*60}")
    print(f"  MODULE 1 TEST — Website Discovery Service")
    print(f"  Target: {url}")
    print(f"{'='*60}\n")

    async with DiscoveryService() as svc:
        result = await svc.discover(url)

    print(json.dumps(result.model_dump(), indent=2))

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


# ══════════════════════════════════════════════════════════════════════
# CLI test runner — Module 2: Browser Agent
# ══════════════════════════════════════════════════════════════════════

async def _run_browser_agent_test(urls_or_json: str) -> None:
    """
    Standalone test for the Browser Agent.
    Accepts either:
      - a single URL string, or
      - a path to a discovery result JSON (output of Module 1).
    """
    from modules.browser_agent import BrowserAgent

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


# ══════════════════════════════════════════════════════════════════════
# CLI test runner — Module 4: WCAG Rule Engine
# ══════════════════════════════════════════════════════════════════════

async def _run_wcag_test(manifest_path: str) -> None:
    """
    Standalone test for the WCAG Rule Engine.
    Reads a manifest.json produced by the Browser Agent (Module 2).

    TODO: Uncomment the active implementation block below once
          modules/wcag_engine/engine.py is created with a WCAGEngine class.
    """
    # Guard: verify the manifest file exists
    p = Path(manifest_path)
    if not p.exists():
        print(f"\n  ❌ Manifest file not found: {manifest_path}")
        print("     Run 'python main.py test-browser <url>' first to generate it.")
        sys.exit(1)

    # Guard: check the WCAG engine module exists before trying to use it
    try:
        from modules.wcag_engine import WCAGEngine  # noqa: F401
    except ImportError:
        print(f"\n{'='*60}")
        print("  MODULE 4 TEST — WCAG Rule Engine")
        print(f"{'='*60}\n")
        print("  ⚠️  modules/wcag_engine/ has not been implemented yet.")
        print("     Create modules/wcag_engine/engine.py with a WCAGEngine class,")
        print("     then re-run this command.")
        print()
        return

    # ── Active implementation (uncomment when WCAGEngine is ready) ────
    # print(f"\n{'='*60}")
    # print(f"  MODULE 4 TEST — WCAG Rule Engine")
    # print(f"  Manifest: {manifest_path}")
    # print(f"{'='*60}\n")
    #
    # async with WCAGEngine() as engine:
    #     result = await engine.audit(manifest_path)
    #
    # print(json.dumps(result.model_dump(), indent=2))
    #
    # print(f"\n{'─'*60}")
    # print(f"  📄 Pages audited : {result.total_pages}")
    # print(f"  🚨 Total issues  : {result.total_issues}")
    # print(f"{'─'*60}\n")
    # for page in result.pages:
    #     print(f"  {page.url}  —  {page.issue_count} issues (score: {page.score:.1f})")
    # print()


# ══════════════════════════════════════════════════════════════════════
# Entry point
# ══════════════════════════════════════════════════════════════════════

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
        # ── Module 1: Discovery Service ────────────────────────────
        if len(args) < 2:
            print("Usage: python main.py test <url>")
            print("Example: python main.py test https://example.com")
            sys.exit(1)
        asyncio.run(_run_discovery_test(args[1]))

    elif args[0] == "test-browser":
        # ── Module 2: Browser Agent ────────────────────────────────
        if len(args) < 2:
            print("Usage: python main.py test-browser <url|discovery.json>")
            print("Example: python main.py test-browser https://example.com")
            print("Example: python main.py test-browser discovery_result.json")
            sys.exit(1)
        asyncio.run(_run_browser_agent_test(args[1]))

    elif args[0] == "test-wcag":
        # ── Module 4: WCAG Rule Engine ─────────────────────────────
        if len(args) < 2:
            print("Usage: python main.py test-wcag <manifest.json>")
            print("Example: python main.py test-wcag captures/manifest.json")
            sys.exit(1)
        asyncio.run(_run_wcag_test(args[1]))

    else:
        print(f"Unknown command: {args[0]}")
        print("Usage:")
        print("  python main.py server                        # start API server")
        print("  python main.py test <url>                    # Module 1: Discovery")
        print("  python main.py test-browser <url|file.json>  # Module 2: Browser Agent")
        print("  python main.py test-wcag <manifest.json>     # Module 4: WCAG Engine")
        sys.exit(1)


if __name__ == "__main__":
    main()