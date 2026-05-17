"""
Farm Router — /api/farm
Handles farm profile management, weather intelligence, and season planning.
"""

from fastapi import APIRouter
from agents.weather_agent import run_weather_agent
from agents.season_planner import run_season_planner_agent
from pydantic import BaseModel

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


class SeasonRequest(BaseModel):
    crop_type: str
    planting_date: str           # format: YYYY-MM-DD
    acres: float
    farmer_lat: float = 30.1575  # default: Multan
    farmer_lng: float = 71.5249
    language: str = "roman_urdu" # roman_urdu | urdu | english


@router.post("/season-plan", summary="Generate full crop service calendar with urgency ranking")
async def get_season_plan(request: SeasonRequest):
    """
    Season Planner Agent pipeline:
    1. Calculate current crop stage and days to harvest from planting date
    2. Set READY_SOON flag when days_to_harvest <= 14
    3. LLM generates complete service calendar with urgency-ranked upcoming services
    4. Returns full calendar + harvest summary + post-harvest plan in farmer language
    """
    result = run_season_planner_agent(
        crop_type=request.crop_type,
        planting_date=request.planting_date,
        acres=request.acres,
        farmer_lat=request.farmer_lat,
        farmer_lng=request.farmer_lng,
        language=request.language
    )
    return result


@router.get("/", summary="Farm router status")
async def farm_status():
    """Liveness check for the farm router."""
    return {
        "status": "farm router active",
        "endpoints": [
            "GET /api/farm/weather/{lat}/{lng}",
            "POST /api/farm/season-plan"
        ]
    }
