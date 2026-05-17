"""
Farm Router — /api/farm
Handles farm profile management and weather intelligence.
"""

from fastapi import APIRouter
from agents.weather_agent import run_weather_agent

router = APIRouter()


@router.get("/weather/{lat}/{lng}", summary="Get 5-day weather forecast with farming intelligence")
async def get_weather(
    lat: float,
    lng: float,
    language: str = "roman_urdu",
    crop_type: str = None,
    days_to_harvest: int = None
):
    """
    Two-step weather intelligence pipeline:
    1. OpenWeatherMap API fetches real 5-day forecast
    2. OpenRouter LLM interprets it for farming context

    Returns harvest window, urgency alerts, and daily farming advisories
    in the farmer's chosen language.
    """
    result = run_weather_agent(
        lat=lat,
        lng=lng,
        language=language,
        crop_type=crop_type,
        days_to_harvest=days_to_harvest
    )
    return result


@router.get("/", summary="Farm router status")
async def farm_status():
    """Liveness check for the farm router."""
    return {"status": "farm router active — GET /api/farm/weather/{lat}/{lng} for forecast"}
