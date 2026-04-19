"""
confidence_scorer.py
Calculates a calibrated confidence score (0–1) for the estimate.
"""


def compute_confidence(
    vision: dict,
    geo: dict,
    num_optional_fields: int,
    total_optional_fields: int = 3,
) -> float:
    """
    Weighted confidence score:
      40% — Gemini visual_confidence
      25% — Geo data quality (1.0 if Overpass returned data, 0.5 otherwise)
      20% — Image quality_score
      15% — Metadata completeness

    Returns a float rounded to 2 decimals.
    """
    visual_confidence = float(vision.get("visual_confidence", 0.5))
    geo_data_quality = float(geo.get("geo_data_quality", 0.5))
    image_quality = float(vision.get("image_quality_score", 50)) / 100.0
    metadata_completeness = (
        num_optional_fields / total_optional_fields if total_optional_fields > 0 else 0.0
    )

    confidence = (
        visual_confidence * 0.40
        + min(1.0, geo_data_quality) * 0.25
        + image_quality * 0.20
        + metadata_completeness * 0.15
    )

    return round(max(0.0, min(1.0, confidence)), 2)
