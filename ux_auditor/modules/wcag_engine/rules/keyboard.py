"""WCAG 4.1.2 — Name, Role, Value: interactive element accessibility and keyboard checks."""

from typing import List
from bs4 import BeautifulSoup
from .base import BaseRule

_INTERACTIVE_ROLES = {
    "button", "link", "menuitem", "option", "tab", "checkbox",
    "radio", "switch", "slider", "spinbutton", "combobox",
    "listbox", "menu", "menubar", "tablist", "tree", "treegrid",
    "dialog", "alertdialog",
}

_VALID_ARIA_EXPANDED = {"true", "false"}
_VALID_ARIA_CHECKED = {"true", "false", "mixed"}
_VALID_ARIA_PRESSED = {"true", "false", "mixed"}


class KeyboardAriaRule(BaseRule):
    rule_id = "WCAG_4_1_2"
    criterion = "4.1.2 Name, Role, Value"
    wcag_url = "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value"

    def check(self, soup: BeautifulSoup, css_text: str = "") -> List[dict]:
        issues = []

        # 1. Non-semantic interactive elements (div/span with click handlers inferred via onclick / role)
        for tag in soup.find_all(["div", "span"]):
            has_onclick = tag.get("onclick") or tag.get("ng-click") or tag.get("@click")
            role = tag.get("role", "")
            tabindex = tag.get("tabindex")

            if has_onclick or role in _INTERACTIVE_ROLES:
                aria_label = tag.get("aria-label", "").strip()
                aria_labelledby = tag.get("aria-labelledby", "").strip()
                text = tag.get_text(strip=True)

                if not role:
                    issues.append(self._issue(
                        severity="serious",
                        element=self._selector(tag),
                        description=f"<{tag.name}> has an interactive handler but no role. "
                                    "Assistive technologies will not announce it as interactive.",
                        recommendation="Use a native <button> or <a> element, or add role=\"button\" and "
                                       "tabindex=\"0\" if a native element cannot be used.",
                    ))

                if tabindex is None and role in _INTERACTIVE_ROLES:
                    issues.append(self._issue(
                        severity="serious",
                        element=self._selector(tag),
                        description=f"Element with role=\"{role}\" has no tabindex. "
                                    "Keyboard users cannot reach it via Tab.",
                        recommendation="Add tabindex=\"0\" to make the element keyboard focusable.",
                    ))

                if not aria_label and not aria_labelledby and not text:
                    issues.append(self._issue(
                        severity="critical",
                        element=self._selector(tag),
                        description=f"Interactive <{tag.name}> has no accessible name "
                                    "(no aria-label, aria-labelledby, or text content).",
                        recommendation="Add aria-label=\"[descriptive name]\" or visible text content.",
                    ))

        # 2. Buttons without accessible names
        for button in soup.find_all("button"):
            text = button.get_text(strip=True)
            aria_label = button.get("aria-label", "").strip()
            aria_labelledby = button.get("aria-labelledby", "").strip()
            has_img_with_alt = any(
                img.get("alt") for img in button.find_all("img")
            )
            if not text and not aria_label and not aria_labelledby and not has_img_with_alt:
                issues.append(self._issue(
                    severity="critical",
                    element=self._selector(button),
                    description="<button> has no accessible name. Screen readers will announce it as "
                                "\"button\" with no indication of its action.",
                    recommendation="Add descriptive text content inside the button, or add "
                                   "aria-label=\"[action description]\".",
                ))

        # 3. Invalid ARIA attribute values
        for tag in soup.find_all(True):
            # aria-expanded
            expanded = tag.get("aria-expanded")
            if expanded is not None and expanded.lower() not in _VALID_ARIA_EXPANDED:
                issues.append(self._issue(
                    severity="moderate",
                    element=self._selector(tag),
                    description=f"aria-expanded=\"{expanded}\" is not a valid value. "
                                "Must be \"true\" or \"false\".",
                    recommendation="Set aria-expanded to either \"true\" or \"false\".",
                ))

            # aria-hidden on focusable element
            hidden = tag.get("aria-hidden")
            if hidden and hidden.lower() == "true":
                tabindex = tag.get("tabindex")
                if tabindex is not None and tabindex != "-1":
                    issues.append(self._issue(
                        severity="serious",
                        element=self._selector(tag),
                        description="aria-hidden=\"true\" is set on a focusable element (tabindex != -1). "
                                    "Keyboard users can focus it while screen reader users cannot access it.",
                        recommendation="Remove aria-hidden=\"true\", or add tabindex=\"-1\" to remove it "
                                       "from the focus order.",
                    ))

        # 4. Skip navigation link check
        first_link = soup.find("a")
        if first_link:
            href = first_link.get("href", "")
            if not href.startswith("#"):
                issues.append({
                    "rule_id": self.rule_id,
                    "criterion": self.criterion,
                    "severity": "moderate",
                    "element": "<body> (first <a>)",
                    "description": "Page does not appear to have a skip navigation link as the first focusable "
                                   "element. Keyboard users must Tab through all navigation items on every page.",
                    "recommendation": "Add a \"Skip to main content\" link as the very first element in "
                                      "<body>: <a href=\"#main-content\" class=\"skip-link\">Skip to main content</a>. "
                                      "Target a <main id=\"main-content\"> element.",
                    "wcag_url": self.wcag_url,
                })

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
