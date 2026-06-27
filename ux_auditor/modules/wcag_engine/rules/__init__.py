"""WCAG rule modules package."""

from .base import BaseRule
from .color import ColorContrastRule
from .forms import FormLabelRule
from .headings import HeadingHierarchyRule
from .images import ImageAltRule
from .keyboard import KeyboardAriaRule
from .links import LinkPurposeRule

ALL_RULES = [
    "BaseRule",
    "ColorContrastRule",
    "FormLabelRule",
    "HeadingHierarchyRule",
    "ImageAltRule",
    "KeyboardAriaRule",
    "LinkPurposeRule",
]
