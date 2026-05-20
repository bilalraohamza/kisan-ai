from fastapi import APIRouter
from pydantic import BaseModel
from agents.weather_agent import run_weather_agent
from agents.season_planner import run_season_planner_agent
from services.database import save_session
from typing import Optional
import requests
import os

router = APIRouter()


def geocode_city(city: str):
    """Convert city name to real lat/lng using Google Maps Geocoding API."""
    try:
        response = requests.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={
                "address": f"{city}, Pakistan",
                "key": os.getenv("GOOGLE_MAPS_API_KEY")
            },
            timeout=5
        )
        data = response.json()
        if data.get("status") == "OK":
            loc = data["results"][0]["geometry"]["location"]
            formatted = data["results"][0]["formatted_address"]
            print(f"[geocode] {city} -> {loc['lat']}, {loc['lng']} ({formatted})")
            return loc["lat"], loc["lng"], formatted
    except Exception as e:
        print(f"[geocode] Failed for {city}: {e}")
    return 30.3753, 69.3451, city


class FarmProfile(BaseModel):
    crop_type: Optional[str] = None
    location: Optional[str] = None
    acres: Optional[float] = None
    language: Optional[str] = "roman_urdu"
    lat: Optional[float] = None
    lng: Optional[float] = None
    session_id: Optional[str] = None


@router.post("/save")
async def save_farm(profile: FarmProfile):
    lat = profile.lat
    lng = profile.lng
    formatted_location = profile.location

    # If no coordinates provided but city name exists, geocode it
    if profile.location and (not lat or not lng or lat == 0 or lng == 0):
        lat, lng, formatted_location = geocode_city(profile.location)

    if profile.session_id:
        save_session(profile.session_id, {
            'crop_type': profile.crop_type,
            'location': formatted_location,
            'acres': profile.acres,
            'language': profile.language,
            'lat': lat,
            'lng': lng,
        })

    return {
        "status": "saved",
        "crop_type": profile.crop_type,
        "location": formatted_location,
        "acres": profile.acres,
        "language": profile.language,
        "lat": lat,
        "lng": lng
    }


@router.get("/weather/{lat}/{lng}")
async def get_weather(
    lat: float,
    lng: float,
    language: str = "roman_urdu",
    crop_type: str = None,
    days_to_harvest: int = None
):
    try:
        result = run_weather_agent(
            lat=lat,
            lng=lng,
            language=language,
            crop_type=crop_type,
            days_to_harvest=days_to_harvest
        )
        return result
    except Exception as e:
        print(f"[weather] Unhandled error: {e}")
        return {
            "location": "Pakistan",
            "forecast_5_day": [],
            "urgent_alert": None,
            "best_harvest_window": None,
            "weekly_risk": "unknown",
            "action_today": (
                "Mausam service abhi available nahi. Baad mein try karein."
                if language == "roman_urdu"
                else "Weather service unavailable. Please try again later."
            ),
            "trace": {"error": str(e)}
        }


class SeasonRequest(BaseModel):
    crop_type: str
    planting_date: str
    acres: float
    farmer_lat: float = 30.1575
    farmer_lng: float = 71.5249
    language: str = "roman_urdu"


@router.post("/season-plan")
async def get_season_plan(request: SeasonRequest):
    result = run_season_planner_agent(
        crop_type=request.crop_type,
        planting_date=request.planting_date,
        acres=request.acres,
        farmer_lat=request.farmer_lat,
        farmer_lng=request.farmer_lng,
        language=request.language
    )
    return result