"""Abstract base class for all WCAG rules."""

from abc import ABC, abstractmethod
from typing import List

from bs4 import BeautifulSoup


class BaseRule(ABC):
    """All WCAG rule checkers inherit from this."""

    rule_id: str = ""
    criterion: str = ""
    wcag_url: str = ""

    @abstractmethod
    def check(self, soup: BeautifulSoup, css_text: str = "") -> List[dict]:
        """
        Run the rule against parsed HTML (and optional CSS text).

        Returns a list of raw issue dicts matching WCAGIssue fields:
            rule_id, criterion, severity, element, description,
            recommendation, wcag_url
        """
        ...

    # ------------------------------------------------------------------ helpers
    @staticmethod
    def _selector(tag) -> str:
        """Build a readable CSS-ish selector string for a BeautifulSoup tag."""
        parts = [tag.name]
        if tag.get("id"):
            parts.append(f"#{tag['id']}")
        elif tag.get("class"):
            parts.append("." + ".".join(tag["class"]))
        # Include a snippet of text or key attribute for context
        if tag.name == "a" and tag.get_text(strip=True):
            parts.append(f'[text="{tag.get_text(strip=True)[:40]}"]')
        elif tag.get("name"):
            parts.append(f'[name="{tag["name"]}"]')
        elif tag.get("src"):
            src = tag["src"]
            parts.append(f'[src="...{src[-30:]}"]')
        return "".join(parts)
