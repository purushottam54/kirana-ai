"""
cash_flow_model.py
Implements the deterministic cash-flow estimation model for Indian kirana stores.
All outputs are calibrated ranges, not single-point predictions.
"""

from typing import Optional, Tuple

INVENTORY_MULTIPLIERS = {
    "low": 0.6,
    "medium": 1.0,
    "high": 1.4,
    "very_high": 1.8,
}


def estimate_cash_flow(
    vision: dict,
    geo: dict,
    shop_size_sqft: Optional[float] = None,
    rent_monthly: Optional[float] = None,
    years_operating: Optional[float] = None,
) -> dict:
    """
    Estimate daily sales, monthly revenue, and monthly income as ranges.

    Parameters
    ----------
    vision : dict  — output from vision_analyzer.analyze_images()
    geo    : dict  — output from geo_analyzer.analyze_location()
    shop_size_sqft, rent_monthly, years_operating : optional metadata

    Returns
    -------
    dict with daily_sales_range, monthly_revenue_range, monthly_income_range,
    plus intermediate scores for transparency.
    """
    # ── Raw composite score ────────────────────────────────────────────────
    inv_tier = vision.get("inventory_value_tier", "medium")
    inv_multiplier = INVENTORY_MULTIPLIERS.get(inv_tier, 1.0)

    raw_score = (
        vision.get("shelf_density_index", 50) * 0.30
        + vision.get("sku_diversity_score", 50) * 0.20
        + inv_multiplier * 100 * 0.25
        + geo.get("footfall_proxy_index", 30) * 0.15
        + geo.get("catchment_score", 30) * 0.10
    )

    # ── Competition discount ───────────────────────────────────────────────
    competition = geo.get("competition_density", 0)
    competition_factor = max(0.70, 1.0 - (competition * 0.05))
    adjusted_score = raw_score * competition_factor

    # ── INR daily sales range ──────────────────────────────────────────────
    daily_low = int(adjusted_score * 1.4)
    daily_high = int(adjusted_score * 2.8)

    # Clamp to realistic kirana bounds
    daily_low = max(1_500, min(daily_low, 80_000))
    daily_high = max(3_000, min(daily_high, 150_000))

    # Ensure high > low
    if daily_high <= daily_low:
        daily_high = daily_low + 1_500

    # ── Metadata adjustment — shop size ───────────────────────────────────
    if shop_size_sqft and shop_size_sqft > 0:
        size_factor = min(1.3, max(0.8, shop_size_sqft / 200))
        daily_low = int(daily_low * size_factor)
        daily_high = int(daily_high * size_factor)

    # ── Metadata adjustment — years of operation (trust signal) ───────────
    if years_operating and years_operating > 0:
        # Older stores get slight uplift (max +15% at 10 years)
        tenure_boost = min(1.15, 1.0 + years_operating * 0.015)
        daily_low = int(daily_low * tenure_boost)
        daily_high = int(daily_high * tenure_boost)

    # ── Monthly revenue (26 operating days) ───────────────────────────────
    monthly_revenue_low = daily_low * 26
    monthly_revenue_high = daily_high * 26

    # ── Monthly net income (EBITDA proxy, 12–20% margins typical) ─────────
    monthly_income_low = int(monthly_revenue_low * 0.12)
    monthly_income_high = int(monthly_revenue_high * 0.20)

    return {
        "daily_sales_range": [daily_low, daily_high],
        "monthly_revenue_range": [monthly_revenue_low, monthly_revenue_high],
        "monthly_income_range": [monthly_income_low, monthly_income_high],
        # Intermediate diagnostics for explainability
        "_raw_score": round(raw_score, 2),
        "_adjusted_score": round(adjusted_score, 2),
        "_competition_factor": round(competition_factor, 3),
    }
