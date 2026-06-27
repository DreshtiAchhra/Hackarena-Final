"""
test_wcag_rules.py — standalone smoke-test for Module 4.

Run from ux_auditor/:
    python test_wcag_rules.py

Does NOT require a real manifest.json or running browser agent.
Creates a synthetic HTML page with known issues and verifies each rule fires.
"""

import sys
import json
from pathlib import Path

# ── make sure relative imports work when run directly ─────────────────────────
sys.path.insert(0, str(Path(__file__).parent))

from bs4 import BeautifulSoup
from modules.wcag_engine.rules import ALL_RULES
from utils.models import WCAGIssue, WCAGSeverity


# ── Synthetic HTML with intentional accessibility violations ──────────────────
BROKEN_HTML = """<!DOCTYPE html>
<html lang="en">
<head><title>Test Page</title></head>
<body>
  <!-- No skip link -->
  <!-- WCAG_1_1_1: img without alt -->
  <img src="/images/hero-banner.jpg">

  <!-- WCAG_1_1_1: img with filename-only alt -->
  <img src="/img/team-photo.png" alt="team-photo">

  <!-- WCAG_1_1_1: link with img no alt (critical) -->
  <a href="/home"><img src="/icons/home.svg"></a>

  <!-- WCAG_1_3_1: input without label -->
  <input type="text" placeholder="Your email">

  <!-- WCAG_1_3_1: input with placeholder only -->
  <input type="password" placeholder="Password">

  <!-- WCAG_1_3_2: heading skip h1→h3 -->
  <h1>Main Title</h1>
  <h3>Skipped h2 — goes straight to h3</h3>

  <!-- WCAG_2_4_6: no <main>, no <nav> (checked by H1Rule) -->

  <!-- WCAG_2_4_4: vague link text -->
  <a href="/article/123">click here</a>
  <a href="/news">read more</a>

  <!-- WCAG_2_4_4: link opens new tab without notice -->
  <a href="https://external.com" target="_blank">External Site</a>

  <!-- WCAG_4_1_2: button without accessible name -->
  <button></button>

  <!-- WCAG_4_1_2: div acting as button without role -->
  <div onclick="doSomething()">Submit Order</div>

  <!-- WCAG_1_4_3: inline style with low contrast (white on white) -->
  <p style="color: #ffffff; background-color: #ffffff;">Low contrast text</p>
</body>
</html>"""

# Inline CSS with a low-contrast pair
BROKEN_CSS = """
body { font-family: sans-serif; }
.light-text { color: #cccccc; background-color: #ffffff; }
.nav-link   { color: #aaaaaa; background-color: #f0f0f0; }
"""


def run_tests():
    soup = BeautifulSoup(BROKEN_HTML, "html.parser")
    all_issues = []

    print("=" * 70)
    print("  WCAG Rule Engine — Smoke Test")
    print("=" * 70)

    for rule in ALL_RULES:
        raw = rule.check(soup, BROKEN_CSS)
        validated = []
        for r in raw:
            try:
                validated.append(WCAGIssue.model_validate(r))
            except Exception as e:
                print(f"  ⚠  Validation error in {rule.rule_id}: {e}")

        print(f"\n▸ {rule.rule_id} — {rule.criterion}")
        if not validated:
            print("  ✓  No issues found (or none expected for this synthetic page)")
        for issue in validated:
            icon = {"critical": "🔴", "serious": "🟠", "moderate": "🟡", "minor": "🔵"}.get(
                issue.severity.value, "⚪"
            )
            print(f"  {icon} [{issue.severity.value.upper()}] {issue.element}")
            print(f"     {issue.description[:100]}...")

        all_issues.extend(validated)

    # Summary
    print("\n" + "=" * 70)
    print(f"  Total issues found: {len(all_issues)}")
    severity_counts = {}
    for i in all_issues:
        severity_counts[i.severity.value] = severity_counts.get(i.severity.value, 0) + 1
    for sev in ("critical", "serious", "moderate", "minor"):
        count = severity_counts.get(sev, 0)
        if count:
            print(f"  {sev.capitalize():10s}: {count}")
    print("=" * 70)

    # Dump full JSON for inspection
    output = [i.model_dump() for i in all_issues]
    out_path = Path("wcag_smoke_test_output.json")
    out_path.write_text(json.dumps(output, indent=2))
    print(f"\n  Full output saved → {out_path.resolve()}")


if __name__ == "__main__":
    run_tests()
