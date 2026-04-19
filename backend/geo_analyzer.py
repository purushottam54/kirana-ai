"""
geo_analyzer.py
Fetches geo intelligence from OpenStreetMap Overpass API.
No API key needed — completely free.
"""

import logging
import urllib.parse
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

OVERPASS_BASE = "https://overpass-api.de/api/interpreter"
NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse"

ROAD_TIER_MAP = {
    "motorway": 80, "trunk": 80, "primary": 80,
    "secondary": 60, "tertiary": 60,
    "residential": 35, "unclassified": 35,
    "service": 20, "track": 20, "footway": 20,
}


def _overpass_query(query: str, timeout: int = 10) -> Optional[dict]:
    """Execute an Overpass QL query and return parsed JSON or None."""
    encoded = urllib.parse.quote(query)
    url = f"{OVERPASS_BASE}?data={encoded}"
    try:
        resp = httpx.get(url, timeout=timeout, headers={"User-Agent": "KiranaCashFlowAI/1.0"})
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.warning(f"Overpass query failed: {e}")
        return None


def _reverse_geocode(lat: float, lon: float) -> Optional[str]:
    """Nominatim reverse geocode; returns display_name or None."""
    try:
        resp = httpx.get(
            NOMINATIM_BASE,
            params={"lat": lat, "lon": lon, "format": "json"},
            timeout=8,
            headers={"User-Agent": "KiranaCashFlowAI/1.0"},
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("display_name")
    except Exception as e:
        logger.warning(f"Nominatim reverse geocode failed: {e}")
        return None


def analyze_location(lat: float, lon: float) -> dict:
    """
    Runs three Overpass queries around the GPS coordinates and computes
    competition_density, footfall_proxy_index, road_tier, catchment_score.

    Returns a dict; never raises — returns minimal defaults on failure.
    """
    geo_data_quality = 0.5  # upgraded to 1.0 if Overpass data comes back

    # ── Query A: Competitor kirana / supermarkets within 300 m ─────────────
    query_a = (
        f'[out:json];(node["shop"~"convenience|supermarket|grocery"]'
        f'(around:300,{lat},{lon}););out count;'
    )
    result_a = _overpass_query(query_a)
    competition_density = 0
    if result_a:
        geo_data_quality = 1.0
        try:
            competition_density = int(
                result_a.get("elements", [{}])[0].get("tags", {}).get("total", 0)
            )
        except (IndexError, KeyError, ValueError):
            competition_density = len(result_a.get("elements", []))

    # ── Query B: Footfall POIs within 500 m ────────────────────────────────
    query_b = (
        f'[out:json];(node["amenity"~"school|college|bus_station|bank|hospital|office"]'
        f'(around:500,{lat},{lon}););out count;'
    )
    result_b = _overpass_query(query_b)
    footfall_raw = 0
    if result_b:
        geo_data_quality = 1.0
        try:
            footfall_raw = int(
                result_b.get("elements", [{}])[0].get("tags", {}).get("total", 0)
            )
        except (IndexError, KeyError, ValueError):
            footfall_raw = len(result_b.get("elements", []))

    footfall_proxy_index = min(100, footfall_raw * 8)

    # ── Query C: Road type ─────────────────────────────────────────────────
    query_c = f'[out:json];way["highway"](around:50,{lat},{lon});out tags;'
    result_c = _overpass_query(query_c)
    road_tier_score = 35  # default residential
    road_tier = "residential"
    if result_c:
        for element in result_c.get("elements", []):
            highway = element.get("tags", {}).get("highway", "")
            if highway in ROAD_TIER_MAP:
                score = ROAD_TIER_MAP[highway]
                if score > road_tier_score:
                    road_tier_score = score
                    road_tier = highway
                break

    # ── Derived scores ─────────────────────────────────────────────────────
    catchment_score = footfall_proxy_index * 0.6 + road_tier_score * 0.4

    # Reverse geocode for address
    address = _reverse_geocode(lat, lon) or f"{lat:.4f}, {lon:.4f}"

    return {
        "competition_density": competition_density,
        "footfall_proxy_index": footfall_proxy_index,
        "road_tier": road_tier,
        "road_tier_score": road_tier_score,
        "catchment_score": round(catchment_score, 2),
        "address": address,
        "geo_data_quality": geo_data_quality,
        "lat": lat,
        "lon": lon,
    }
