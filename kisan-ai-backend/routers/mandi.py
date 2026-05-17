"""
Mandi Router — /api/mandi
Handles real-time mandi price data and sell timing intelligence.
"""

from fastapi import APIRouter
from agents.mandi_price_agent import run_mandi_price_agent

router = APIRouter()


@router.get("/prices/{crop_type}", summary="Get mandi prices and sell timing advice for a crop")
async def get_mandi_prices(
    crop_type: str,
    farmer_lat: float = 30.1575,
    farmer_lng: float = 71.5249,
    acres: float = 5.0,
    language: str = "roman_urdu",
):
    """
    Mandi Price Intelligence pipeline:
    1. Loads prices from mandi_prices.json for the requested crop
    2. Google Distance Matrix calculates real distances to each mandi
    3. Net revenue = gross revenue − transport cost per mandi
    4. OpenRouter LLM interprets trends and generates sell timing advice

    Supported crops: wheat | rice | cotton | sugarcane | maize | onion | potato
    """
    result = run_mandi_price_agent(
        crop_type=crop_type,
        farmer_lat=farmer_lat,
        farmer_lng=farmer_lng,
        acres=acres,
        language=language,
    )
    return result


@router.get("/", summary="Mandi router status")
async def mandi_status():
    """Liveness check for the mandi router."""
    return {"status": "mandi router active — GET /api/mandi/prices/{crop_type} for prices"}
