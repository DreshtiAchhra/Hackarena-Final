"""WCAG 1.3.1 — Info and Relationships: form label checks."""

from typing import List
from bs4 import BeautifulSoup
from .base import BaseRule

_LABEL_INPUT_TYPES = {
    "text", "email", "password", "search", "tel", "url", "number",
    "date", "time", "datetime-local", "month", "week", "file",
    "textarea", "select",
}
_SKIP_TYPES = {"hidden", "submit", "button", "reset", "image"}


class FormLabelRule(BaseRule):
    rule_id = "WCAG_1_3_1"
    criterion = "1.3.1 Info and Relationships"
    wcag_url = "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships"

    def check(self, soup: BeautifulSoup, css_text: str = "") -> List[dict]:
        issues = []

        # Build lookup: id → <label> elements
        label_for_ids = {
            lbl["for"]
            for lbl in soup.find_all("label")
            if lbl.get("for")
        }

        # Check <input>, <textarea>, <select>
        for tag in soup.find_all(["input", "textarea", "select"]):
            input_type = tag.get("type", "text").lower()
            if tag.name == "input" and input_type in _SKIP_TYPES:
                continue

            tag_id = tag.get("id", "")
            aria_label = tag.get("aria-label", "").strip()
            aria_labelledby = tag.get("aria-labelledby", "").strip()
            title = tag.get("title", "").strip()
            placeholder = tag.get("placeholder", "").strip()

            # Correctly labelled via aria-label or aria-labelledby
            if aria_label or aria_labelledby:
                continue

            # Labelled via <label for="...">
            if tag_id and tag_id in label_for_ids:
                continue

            # Labelled via wrapping <label>
            parent = tag.parent
            if parent and parent.name == "label":
                label_text = parent.get_text(strip=True)
                if label_text:
                    continue

            # Title attribute as accessible name (acceptable but non-ideal)
            if title:
                issues.append(self._issue(
                    severity="minor",
                    element=self._selector(tag),
                    description=f"Input relies on title=\"{title}\" as its accessible name. "
                                "Title tooltips are not surfaced consistently by screen readers.",
                    recommendation="Use a visible <label> element or aria-label instead of title.",
                ))
                continue

            # Placeholder-only label (critical — disappears on focus)
            if placeholder:
                issues.append(self._issue(
                    severity="serious",
                    element=self._selector(tag),
                    description=f"Input uses only placeholder=\"{placeholder}\" with no associated label. "
                                "Placeholder text disappears when users start typing, leaving no persistent label.",
                    recommendation="Add a <label> element linked via for/id, or use aria-label. "
                                   "Keep placeholder as supplemental hint, not the primary label.",
                ))
            else:
                issues.append(self._issue(
                    severity="critical",
                    element=self._selector(tag),
                    description="Form control has no accessible label (no <label>, aria-label, "
                                "aria-labelledby, or title).",
                    recommendation="Add a visible <label for=\"...\"> linked to this input's id, "
                                   "or add aria-label=\"...\" directly on the element.",
                ))

        # Check for fieldset/legend on radio groups and checkboxes
        for fieldset_check in soup.find_all("fieldset"):
            if not fieldset_check.find("legend"):
                issues.append(self._issue(
                    severity="moderate",
                    element=self._selector(fieldset_check),
                    description="<fieldset> is missing a <legend> element. "
                                "Screen readers need the legend to announce the group's purpose.",
                    recommendation="Add a <legend> as the first child of <fieldset> to describe the group.",
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
