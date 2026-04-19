"""
fraud_detector.py
Rule-based fraud detection engine for kirana cash-flow estimates.
Applies 5 ordered rules; applies confidence penalty when >= 2 flags raised.
"""

from typing import List, Tuple

RULES = [
    "inventory_footfall_mismatch",
    "possible_inspection_day_restocking",
    "low_image_quality",
    "overstocked_high_competition_area",
    "estimate_exceeds_typical_kirana_range",
]


def detect_fraud(
    vision: dict,
    geo: dict,
    cash_flow: dict,
    confidence: float,
) -> Tuple[List[str], float, str]:
    """
    Evaluate fraud rules and return (flags, adjusted_confidence, recommendation).

    Rules are evaluated in order:
    1. High inventory + very low footfall proxy
    2. Inspection-day restocking suspicion from Gemini
    3. Low image quality
    4. Overstocked in high-competition area
    5. Estimate exceeds typical kirana range
    """
    flags: List[str] = []

    # Rule 1 — inventory / footfall mismatch
    if (
        vision.get("inventory_value_tier") == "very_high"
        and geo.get("footfall_proxy_index", 100) < 30
    ):
        flags.append("inventory_footfall_mismatch")

    # Rule 2 — inspection-day restocking
    if vision.get("refill_signal") == "inspection_day_suspicion":
        flags.append("possible_inspection_day_restocking")

    # Rule 3 — low image quality
    if vision.get("image_quality_score", 100) < 40:
        flags.append("low_image_quality")

    # Rule 4 — overstocked in crowded area
    if (
        geo.get("competition_density", 0) > 5
        and vision.get("inventory_value_tier") == "very_high"
    ):
        flags.append("overstocked_high_competition_area")

    # Rule 5 — estimate out of realistic range (>₹20L/month)
    monthly_high = cash_flow.get("monthly_revenue_range", [0, 0])[1]
    if monthly_high > 2_000_000:
        flags.append("estimate_exceeds_typical_kirana_range")

    # ── Confidence penalty + recommendation ───────────────────────────────
    adjusted_confidence = confidence
    if len(flags) >= 2:
        adjusted_confidence = max(0.0, confidence - 0.15)
        recommendation = "needs_verification"
    elif adjusted_confidence >= 0.70 and len(flags) == 0:
        recommendation = "pre_approve"
    else:
        recommendation = "standard_review"

    return flags, round(adjusted_confidence, 2), recommendation
