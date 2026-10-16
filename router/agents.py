"""Agent definitions and the keyword router that picks FORGE (code) or ATLAS (fibre/GIS)."""

from __future__ import annotations

import re

AGENTS = {
    "FORGE": {
        "system": "You are FORGE, a senior software engineering agent. Write correct, "
                  "minimal, tested code and explain trade-offs briefly.",
        "keywords": r"\b(code|function|bug|error|stack ?trace|python|typescript|javascript|"
                    r"react|api|sql|git|commit|refactor|test|compile|script|repo|docker|"
                    r"fastapi|convex)\b",
    },
    "ATLAS": {
        "system": "You are ATLAS, a fibre-network and GIS planning agent. Help with route "
                  "design, splicing, OLT/ONT planning, link budgets and PyQGIS.",
        "keywords": r"\b(fibre|fiber|splice|splicing|olt|ont|odf|pon|gpon|ftth|duct|trench|"
                    r"pole|cable|link budget|attenuation|qgis|pyqgis|shapefile|geopackage|"
                    r"gis|layer|route|coverage|map)\b",
    },
}
DEFAULT_AGENT = "FORGE"


def classify(text: str, hint: str | None = None) -> str:
    """Explicit hint (model name 'forge'/'atlas') wins; otherwise keyword score."""
    if hint and hint.upper() in AGENTS:
        return hint.upper()
    scores = {name: len(re.findall(a["keywords"], text, re.I)) for name, a in AGENTS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else DEFAULT_AGENT
