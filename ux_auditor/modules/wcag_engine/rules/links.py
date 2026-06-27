"""WCAG 2.4.4 — Link Purpose (In Context): non-descriptive link text checks."""

import re
from typing import List
from bs4 import BeautifulSoup
from .base import BaseRule

# Link texts that are meaningless without visual context
_VAGUE_TEXTS = {
    "click here", "click", "here", "read more", "more", "learn more",
    "more info", "more information", "details", "link", "this link",
    "continue", "continue reading", "go", "info", "information",
    "tap here", "press here", "view", "view more", "see more",
    "open", "download", "submit", "start", "begin", "next", "back",
}


class LinkPurposeRule(BaseRule):
    rule_id = "WCAG_2_4_4"
    criterion = "2.4.4 Link Purpose (In Context)"
    wcag_url = "https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context"

    def check(self, soup: BeautifulSoup, css_text: str = "") -> List[dict]:
        issues = []

        for a in soup.find_all("a", href=True):
            href = a.get("href", "").strip()

            # Skip anchors with no real destination
            if not href or href == "#":
                # Empty href anchors used as buttons — flag separately
                if not a.get("role") and not a.get("aria-label"):
                    accessible_name = self._accessible_name(a)
                    if not accessible_name:
                        issues.append(self._issue(
                            severity="serious",
                            element=self._selector(a),
                            description="Anchor element has href=\"#\" with no accessible name. "
                                        "Screen readers cannot determine its purpose.",
                            recommendation="Add aria-label or descriptive text content. If it's a button, "
                                           "use <button> instead of <a href=\"#\">.",
                        ))
                continue

            accessible_name = self._accessible_name(a)

            # No accessible name at all
            if not accessible_name:
                issues.append(self._issue(
                    severity="critical",
                    element=self._selector(a),
                    description=f"Link pointing to \"{href}\" has no accessible name "
                                "(no text, no aria-label, no aria-labelledby, no title).",
                    recommendation="Add descriptive text content or aria-label that explains the "
                                   "link's destination or purpose.",
                ))
                continue

            # Vague link text
            name_lower = accessible_name.lower().strip().rstrip(".")
            # Remove trailing punctuation for matching
            name_clean = re.sub(r"[^a-z0-9 ]", "", name_lower).strip()
            if name_clean in _VAGUE_TEXTS:
                issues.append(self._issue(
                    severity="serious",
                    element=self._selector(a),
                    description=f"Link text \"{accessible_name}\" is non-descriptive. "
                                "When listed out of context (e.g., in a screen reader link list), "
                                "the destination cannot be determined.",
                    recommendation=f"Replace with descriptive text such as \"Read article about [topic]\" "
                                   f"or add aria-label=\"[descriptive label]\" to the <a> element.",
                ))

            # Link that opens in new tab without warning
            if a.get("target") == "_blank":
                sr_hint = a.find(attrs={"class": re.compile(r"sr[-_]only|visually[-_]hidden|screen[-_]reader")})
                aria_label = a.get("aria-label", "")
                if "new tab" not in aria_label.lower() and "new window" not in aria_label.lower() and not sr_hint:
                    issues.append(self._issue(
                        severity="minor",
                        element=self._selector(a),
                        description=f"Link \"{accessible_name}\" opens in a new tab (target=\"_blank\") "
                                    "without notifying users. This can disorient keyboard and screen reader users.",
                        recommendation="Add a screen-reader-only notice such as \"(opens in new tab)\" inside "
                                       "the link, or include it in the aria-label.",
                    ))

        return issues

    @staticmethod
    def _accessible_name(tag) -> str:
        """Resolve accessible name: aria-label > aria-labelledby > text content > title."""
        if tag.get("aria-label"):
            return tag["aria-label"].strip()
        if tag.get("aria-labelledby"):
            return tag["aria-labelledby"]  # Ideally we'd resolve IDs, but that requires DOM access
        text = tag.get_text(strip=True)
        if text:
            return text
        # Check for img with alt inside link
        img = tag.find("img")
        if img and img.get("alt"):
            return img["alt"]
        return tag.get("title", "")

    def _issue(self, severity, element, description, recommendation) -> dict:
        return {
            "rule_id": self.rule_id,
            "criterion": self.criterion,
            "severity": severity,
            "element": element,
            "description": description,
            "recommendation": recommendation,
            "wcag_url": self.wcag_url,
        }
