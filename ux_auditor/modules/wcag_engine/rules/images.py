"""WCAG 1.1.1 — Non-text Content: image alt text checks."""

from typing import List
from bs4 import BeautifulSoup
from .base import BaseRule

_REDUNDANT_ALTS = {"image", "photo", "picture", "graphic", "icon", "logo", "img"}
_EMPTY_ROLE_KEYWORDS = {"spacer", "divider", "separator", "decoration", "decorative"}


class ImageAltRule(BaseRule):
    rule_id = "WCAG_1_1_1"
    criterion = "1.1.1 Non-text Content"
    wcag_url = "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content"

    def check(self, soup: BeautifulSoup, css_text: str = "") -> List[dict]:
        issues = []

        for img in soup.find_all("img"):
            alt = img.get("alt")
            role = img.get("role", "")
            src = img.get("src", "")

            # Decorative images should have alt="" and role="presentation"
            if role in ("presentation", "none"):
                if alt is None:
                    issues.append(self._issue(
                        severity="serious",
                        element=self._selector(img),
                        description="Decorative image (role=presentation/none) is missing alt attribute entirely. "
                                    "Screen readers may still announce it.",
                        recommendation='Add alt="" to explicitly mark as decorative.',
                    ))
                continue  # role=presentation/none with alt="" is correct — no further checks

            # Missing alt attribute entirely (not just empty)
            if alt is None:
                issues.append(self._issue(
                    severity="critical",
                    element=self._selector(img),
                    description=f"<img> is missing the alt attribute. Screen readers will fall back to "
                                f"announcing the filename ({src.split('/')[-1] or 'unknown'}).",
                    recommendation="Add a descriptive alt attribute that conveys the image's meaning and purpose.",
                ))
                continue

            # Explicitly empty alt — fine for decorative, but flag if image appears meaningful
            if alt.strip() == "":
                # If the image is inside a link or button and is the only content, that's critical
                parent = img.parent
                if parent and parent.name in ("a", "button"):
                    sibling_text = parent.get_text(strip=True)
                    if not sibling_text:
                        issues.append(self._issue(
                            severity="critical",
                            element=self._selector(img),
                            description="Image is the only content inside a link/button and has alt=\"\". "
                                        "Screen reader users cannot determine the control's purpose.",
                            recommendation="Add descriptive alt text that explains the link/button action "
                                           "(e.g., alt=\"Go to homepage\").",
                        ))
                continue  # alt="" is otherwise acceptable for decorative images

            # Redundant or meaningless alt text
            alt_lower = alt.strip().lower()
            if alt_lower in _REDUNDANT_ALTS or any(w in alt_lower for w in _EMPTY_ROLE_KEYWORDS):
                issues.append(self._issue(
                    severity="minor",
                    element=self._selector(img),
                    description=f'Alt text "{alt}" is generic and describes the element type rather than its content.',
                    recommendation="Replace with text that describes what the image communicates, "
                                   "not what type of element it is.",
                ))

            # Alt text that is just the filename
            filename = src.split("/")[-1].split("?")[0]
            if filename and alt_lower.replace("-", " ").replace("_", " ") == filename.rsplit(".", 1)[0].replace("-", " ").replace("_", " ").lower():
                issues.append(self._issue(
                    severity="moderate",
                    element=self._selector(img),
                    description=f'Alt text appears to be the filename ("{alt}"). '
                                "This provides no meaningful context.",
                    recommendation="Write alt text that describes the image's content and purpose.",
                ))

        return issues

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
