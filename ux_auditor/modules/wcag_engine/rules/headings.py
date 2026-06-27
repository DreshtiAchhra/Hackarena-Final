"""WCAG 1.3.2 & 2.4.6 — Meaningful Sequence and Headings/Labels."""

from typing import List
from bs4 import BeautifulSoup
from .base import BaseRule


class HeadingHierarchyRule(BaseRule):
    rule_id = "WCAG_1_3_2"
    criterion = "1.3.2 Meaningful Sequence"
    wcag_url = "https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence"

    def check(self, soup: BeautifulSoup, css_text: str = "") -> List[dict]:
        issues = []

        headings = soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
        if not headings:
            return issues

        levels = [int(h.name[1]) for h in headings]

        prev_level = levels[0]
        for i, (level, tag) in enumerate(zip(levels[1:], headings[1:]), start=1):
            jump = level - prev_level
            if jump > 1:
                issues.append(self._issue(
                    rule_id=self.rule_id,
                    criterion=self.criterion,
                    wcag_url=self.wcag_url,
                    severity="moderate",
                    element=self._selector(tag),
                    description=f"Heading level skips from h{prev_level} to h{level}. "
                                "Screen reader users navigating by heading will encounter a confusing jump.",
                    recommendation=f"Add an h{prev_level + 1} between the h{prev_level} and this h{level}, "
                                   "or restructure content so heading levels are sequential.",
                ))
            # Empty headings
            if not tag.get_text(strip=True):
                issues.append(self._issue(
                    rule_id=self.rule_id,
                    criterion=self.criterion,
                    wcag_url=self.wcag_url,
                    severity="serious",
                    element=self._selector(tag),
                    description=f"<{tag.name}> is empty. Screen readers will announce an empty heading, "
                                "which is confusing and meaningless.",
                    recommendation="Remove the empty heading element, or add meaningful text content.",
                ))
            prev_level = level

        return issues

    def _issue(self, rule_id, criterion, wcag_url, severity, element, description, recommendation) -> dict:
        return {
            "rule_id": rule_id,
            "criterion": criterion,
            "severity": severity,
            "element": element,
            "description": description,
            "recommendation": recommendation,
            "wcag_url": wcag_url,
        }


class H1Rule(BaseRule):
    rule_id = "WCAG_2_4_6"
    criterion = "2.4.6 Headings and Labels"
    wcag_url = "https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels"

    def check(self, soup: BeautifulSoup, css_text: str = "") -> List[dict]:
        issues = []
        h1_tags = soup.find_all("h1")

        if not h1_tags:
            issues.append({
                "rule_id": self.rule_id,
                "criterion": self.criterion,
                "severity": "serious",
                "element": "<body>",
                "description": "Page has no <h1> element. Screen reader users rely on h1 to understand the "
                               "page's main topic.",
                "recommendation": "Add a single, descriptive <h1> that identifies the primary content of the page.",
                "wcag_url": self.wcag_url,
            })
        elif len(h1_tags) > 1:
            for tag in h1_tags[1:]:  # Flag all but the first
                issues.append({
                    "rule_id": self.rule_id,
                    "criterion": self.criterion,
                    "severity": "moderate",
                    "element": self._selector(tag),
                    "description": f"Page contains {len(h1_tags)} <h1> elements. Multiple h1s confuse the "
                                   "document outline and can mislead screen reader users.",
                    "recommendation": "Use a single <h1> for the primary page title. Use <h2>–<h6> for "
                                      "subsections.",
                    "wcag_url": self.wcag_url,
                })

        # Check for missing landmark regions
        has_main = soup.find("main") or soup.find(attrs={"role": "main"})
        has_nav = soup.find("nav") or soup.find(attrs={"role": "navigation"})

        if not has_main:
            issues.append({
                "rule_id": self.rule_id,
                "criterion": self.criterion,
                "severity": "serious",
                "element": "<body>",
                "description": "Page has no <main> landmark. Screen reader users use landmarks to jump "
                               "directly to primary content.",
                "recommendation": "Wrap the primary page content in a <main> element.",
                "wcag_url": self.wcag_url,
            })
        if not has_nav:
            issues.append({
                "rule_id": self.rule_id,
                "criterion": self.criterion,
                "severity": "minor",
                "element": "<body>",
                "description": "Page has no <nav> landmark. Navigation regions should be wrapped in <nav> "
                               "so screen reader users can find and skip them.",
                "recommendation": "Wrap navigation link groups in <nav> elements. Add aria-label if multiple "
                                  "navs exist (e.g., aria-label=\"Main navigation\").",
                "wcag_url": self.wcag_url,
            })

        return issues
