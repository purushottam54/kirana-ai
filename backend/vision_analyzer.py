"""
vision_analyzer.py
Sends shop images to Gemini 2.0 Flash for structured visual analysis.
Uses the new google-genai SDK (google.genai).
Returns a parsed dict with inventory, shelf, and fraud signals.
"""

import os
import json
import re
import logging
from typing import List

import PIL.Image
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

VISION_PROMPT = """You are a financial underwriting AI for Indian kirana stores.
Analyze these shop images carefully and return ONLY a valid JSON object.
No markdown, no explanation, no backticks. Just raw JSON.

{
  "shelf_density_index": <integer 0-100, % of shelf space occupied>,
  "sku_diversity_score": <integer 0-100, variety of product categories>,
  "inventory_value_tier": <"low"|"medium"|"high"|"very_high">,
  "inventory_value_approx_inr": <estimated total inventory value as integer>,
  "refill_signal": <"recently_stocked"|"normal"|"depleted"|"inspection_day_suspicion">,
  "store_size_estimate": <"small"|"medium"|"large">,
  "category_mix": ["list", "of", "detected", "product", "categories"],
  "counter_activity_level": <"low"|"medium"|"high">,
  "store_condition": <"poor"|"average"|"good"|"excellent">,
  "fraud_flags": ["list of suspicion signals, empty if none"],
  "image_quality_score": <integer 0-100>,
  "visual_confidence": <float 0.0-1.0>,
  "reasoning": "1-2 sentence explanation of your key observations"
}"""

FALLBACK_RESULT = {
    "shelf_density_index": 50,
    "sku_diversity_score": 50,
    "inventory_value_tier": "medium",
    "inventory_value_approx_inr": 150000,
    "refill_signal": "normal",
    "store_size_estimate": "medium",
    "category_mix": ["groceries", "beverages"],
    "counter_activity_level": "medium",
    "store_condition": "average",
    "fraud_flags": [],
    "image_quality_score": 40,
    "visual_confidence": 0.45,
    "reasoning": "Analysis could not be completed fully; fallback estimates used.",
}


def _clean_json_text(raw: str) -> str:
    """Strip markdown fences and extra whitespace from LLM output."""
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?", "", raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r"```$", "", raw).strip()
    return raw


def _build_parts(prompt: str, pil_images: List[PIL.Image.Image]) -> List:
    """Build content parts: text prompt + PIL images."""
    parts = [prompt]
    for img in pil_images:
        parts.append(img)
    return parts


def analyze_images(image_paths: List[str]) -> dict:
    """
    Send images to Gemini 2.0 Flash and parse structured response.
    Returns parsed vision dict; never raises — returns fallback on failure.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY not set; returning fallback result.")
        return {**FALLBACK_RESULT, "reasoning": "GEMINI_API_KEY not configured."}

    # Initialize new SDK client
    client = genai.Client(api_key=api_key)

    # Load PIL images
    pil_images: List[PIL.Image.Image] = []
    for path in image_paths:
        try:
            img = PIL.Image.open(path)
            img.load()
            pil_images.append(img)
        except Exception as e:
            logger.warning(f"Could not open image {path}: {e}")

    if not pil_images:
        logger.error("No valid images to send to Gemini.")
        return {**FALLBACK_RESULT, "reasoning": "No valid images supplied."}

    config = types.GenerateContentConfig(
        temperature=0.1,
    )

    # Build content: [prompt_text, img1, img2, ...]
    contents = [VISION_PROMPT] + pil_images

    # First attempt
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=config,
        )
        raw_text = response.text
        cleaned = _clean_json_text(raw_text)
        result = json.loads(cleaned)
        _validate_vision_result(result)
        return result
    except json.JSONDecodeError:
        logger.warning("First Gemini parse failed; retrying with stricter prompt.")
    except Exception as e:
        logger.error(f"Gemini first attempt failed: {e}")

    # Retry with stricter prompt
    try:
        retry_prompt = VISION_PROMPT + "\n\nReturn ONLY raw JSON, nothing else."
        contents_retry = [retry_prompt] + pil_images
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents_retry,
            config=config,
        )
        raw_text = response.text
        cleaned = _clean_json_text(raw_text)
        result = json.loads(cleaned)
        _validate_vision_result(result)
        return result
    except Exception as e:
        logger.error(f"Gemini vision analysis failed on retry: {e}")
        return {**FALLBACK_RESULT, "reasoning": f"AI analysis error: {str(e)[:200]}"}


def _validate_vision_result(result: dict) -> None:
    """
    Ensure required keys exist; fill defaults for missing optional ones.
    Raises ValueError if critical fields are missing.
    """
    required = [
        "shelf_density_index", "sku_diversity_score",
        "inventory_value_tier", "visual_confidence", "reasoning",
    ]
    for key in required:
        if key not in result:
            raise ValueError(f"Missing key in Gemini response: {key}")

    result["shelf_density_index"] = max(0, min(100, int(result.get("shelf_density_index", 50))))
    result["sku_diversity_score"] = max(0, min(100, int(result.get("sku_diversity_score", 50))))
    result["image_quality_score"] = max(0, min(100, int(result.get("image_quality_score", 50))))
    result["visual_confidence"] = max(0.0, min(1.0, float(result.get("visual_confidence", 0.5))))

    valid_tiers = {"low", "medium", "high", "very_high"}
    if result.get("inventory_value_tier") not in valid_tiers:
        result["inventory_value_tier"] = "medium"

    if "fraud_flags" not in result:
        result["fraud_flags"] = []
    if "category_mix" not in result:
        result["category_mix"] = []
