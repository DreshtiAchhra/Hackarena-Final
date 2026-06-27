"""WCAG 1.4.3 — Contrast (Minimum): color contrast ratio checks.

Strategy:
- Parse inline style= attributes for color/background-color
- Parse the extracted CSS for rules matching common text selectors
- Calculate relative luminance and contrast ratio per WCAG formula
- Flag text that falls below 4.5:1 (normal text) or 3:1 (large text ≥18pt/14pt bold)
"""

import re
from typing import List, Optional, Tuple
from bs4 import BeautifulSoup
from .base import BaseRule

# Named CSS colors → hex (subset of the most common ones)
_NAMED_COLORS: dict[str, str] = {
    "black": "#000000", "white": "#ffffff", "red": "#ff0000",
    "green": "#008000", "blue": "#0000ff", "gray": "#808080",
    "grey": "#808080", "silver": "#c0c0c0", "navy": "#000080",
    "maroon": "#800000", "yellow": "#ffff00", "orange": "#ffa500",
    "purple": "#800080", "pink": "#ffc0cb", "brown": "#a52a2a",
    "lime": "#00ff00", "cyan": "#00ffff", "magenta": "#ff00ff",
    "darkgray": "#a9a9a9", "darkgrey": "#a9a9a9", "lightgray": "#d3d3d3",
    "lightgrey": "#d3d3d3", "transparent": None,
}


def _hex_to_rgb(hex_color: str) -> Optional[Tuple[int, int, int]]:
    hex_color = hex_color.lstrip("#")
    if len(hex_color) == 3:
        hex_color = "".join(c * 2 for c in hex_color)
    if len(hex_color) != 6:
        return None
    try:
        r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
        return r, g, b
    except ValueError:
        return None


def _parse_color(value: str) -> Optional[Tuple[int, int, int]]:
    """Parse CSS color value → (r, g, b) or None."""
    value = value.strip().lower()

    # Named colors
    if value in _NAMED_COLORS:
        hex_val = _NAMED_COLORS[value]
        return _hex_to_rgb(hex_val) if hex_val else None

    # #hex
    if value.startswith("#"):
        return _hex_to_rgb(value)

    # rgb(r, g, b)
    m = re.match(r"rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)", value)
    if m:
        return int(m.group(1)), int(m.group(2)), int(m.group(3))

    # rgba(r, g, b, a) — ignore alpha channel for this check
    m = re.match(r"rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)", value)
    if m:
        return int(m.group(1)), int(m.group(2)), int(m.group(3))

    return None


def _linearize(c: int) -> float:
    srgb = c / 255
    return srgb / 12.92 if srgb <= 0.04045 else ((srgb + 0.055) / 1.055) ** 2.4


def _luminance(rgb: Tuple[int, int, int]) -> float:
    r, g, b = rgb
    return 0.2126 * _linearize(r) + 0.7152 * _linearize(g) + 0.0722 * _linearize(b)


def _contrast_ratio(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
    l1, l2 = _luminance(rgb1), _luminance(rgb2)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


# ---------------------------------------------------------------------------
# CSS extraction helpers
# ---------------------------------------------------------------------------

def _extract_css_pairs(css_text: str) -> List[Tuple[str, str, str]]:
    """
    Very lightweight CSS parser.
    Returns list of (selector, color, background-color) tuples.
    Only catches straightforward rules — not computed cascade.
    """
    results = []
    # Match selector { ... }
    blocks = re.findall(r"([^{}]+)\{([^}]*)\}", css_text)
    for selector, body in blocks:
        color = None
        bg = None
        for prop in body.split(";"):
            prop = prop.strip()
            if prop.lower().startswith("color:"):
                color = prop.split(":", 1)[1].strip()
            elif prop.lower().startswith("background-color:"):
                bg = prop.split(":", 1)[1].strip()
            elif prop.lower().startswith("background:"):
                # Only capture plain color values (not gradients/images)
                val = prop.split(":", 1)[1].strip()
                if not any(k in val.lower() for k in ("url(", "gradient", "none")):
                    bg = val
        if color or bg:
            results.append((selector.strip(), color or "", bg or ""))
    return results


class ColorContrastRule(BaseRule):
    rule_id = "WCAG_1_4_3"
    criterion = "1.4.3 Contrast (Minimum)"
    wcag_url = "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum"

    # Default assumed background for pages without explicit bg
    _DEFAULT_BG = (255, 255, 255)

    def check(self, soup: BeautifulSoup, css_text: str = "") -> List[dict]:
        issues = []

        # 1. Check inline styles on text elements
        for tag in soup.find_all(style=True):
            if tag.name in ("script", "style", "meta", "link"):
                continue
            style = tag.get("style", "")
            inline_color = None
            inline_bg = None
            for decl in style.split(";"):
                decl = decl.strip()
                if decl.lower().startswith("color:"):
                    inline_color = decl.split(":", 1)[1].strip()
                elif decl.lower().startswith("background-color:"):
                    inline_bg = decl.split(":", 1)[1].strip()

            if inline_color:
                fg_rgb = _parse_color(inline_color)
                bg_rgb = _parse_color(inline_bg) if inline_bg else self._DEFAULT_BG
                if fg_rgb and bg_rgb:
                    ratio = _contrast_ratio(fg_rgb, bg_rgb)
                    if ratio < 4.5:
                        issues.append(self._issue(
                            element=self._selector(tag),
                            fg=inline_color,
                            bg=inline_bg or "white (assumed)",
                            ratio=ratio,
                        ))

        # 2. Scan extracted CSS for low-contrast selector pairs
        if css_text:
            css_pairs = _extract_css_pairs(css_text)
            seen_selectors = set()
            for selector, color, bg in css_pairs:
                if not color or not bg:
                    continue
                key = (selector, color, bg)
                if key in seen_selectors:
                    continue
                seen_selectors.add(key)

                fg_rgb = _parse_color(color)
                bg_rgb = _parse_color(bg)
                if not fg_rgb or not bg_rgb:
                    continue

                ratio = _contrast_ratio(fg_rgb, bg_rgb)
                if ratio < 4.5:
                    issues.append({
                        "rule_id": self.rule_id,
                        "criterion": self.criterion,
                        "severity": "serious" if ratio < 3.0 else "moderate",
                        "element": f"CSS rule: {selector[:80]}",
                        "description": (
                            f"Insufficient color contrast: {color} on {bg} "
                            f"yields a ratio of {ratio:.2f}:1 (required minimum 4.5:1 for normal text, "
                            f"3:1 for large text ≥18pt or 14pt bold)."
                        ),
                        "recommendation": (
                            "Adjust foreground or background color so the contrast ratio is at least 4.5:1. "
                            "Use a tool like https://webaim.org/resources/contrastchecker/ to verify."
                        ),
                        "wcag_url": self.wcag_url,
                    })

        return issues

    def _issue(self, element: str, fg: str, bg: str, ratio: float) -> dict:
        return {
            "rule_id": self.rule_id,
            "criterion": self.criterion,
            "severity": "serious" if ratio < 3.0 else "moderate",
            "element": element,
            "description": (
                f"Insufficient color contrast: foreground {fg} on background {bg} "
                f"yields a ratio of {ratio:.2f}:1 (required minimum 4.5:1 for normal text)."
            ),
            "recommendation": (
                "Adjust the text or background color so the contrast ratio is at least 4.5:1 for normal "
                "text (≥3:1 for large text ≥18pt or 14pt bold). "
                "Verify at https://webaim.org/resources/contrastchecker/"
            ),
            "wcag_url": self.wcag_url,
        }
