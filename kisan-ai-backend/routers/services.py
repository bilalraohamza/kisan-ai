"""
Services Router — /api/services
Handles agricultural service discovery and provider coordination.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Union
from agents.equipment_agent import run_equipment_agent
import os
import requests

router = APIRouter()

def geocode_city(city: str):
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
            return loc["lat"], loc["lng"]
    except Exception as e:
        print(f"[services] Geocode failed: {e}")
    return 30.1575, 71.5249

class ServiceRequest(BaseModel):
    service_type: str
    location: Optional[Union[dict, str]] = None
    crop_type: Optional[str] = "wheat"
    acres: Optional[float] = 5.0
    preferred_date: Optional[str] = "2026-05-21"
    session_id: Optional[str] = "default"
    language: Optional[str] = "roman_urdu"
    farmer_lat: Optional[float] = None
    farmer_lng: Optional[float] = None

@router.post("/find", summary="Find and rank agricultural service providers")
async def find_service(request: ServiceRequest):

    # Safely extract lat/lng from any format
    lat = 30.1575
    lng = 71.5249

    if request.farmer_lat and request.farmer_lng:
        # Direct lat/lng fields provided
        lat = request.farmer_lat
        lng = request.farmer_lng

    elif isinstance(request.location, dict):
        # Location as dict {"lat": x, "lng": y}
        lat = request.location.get("lat") or request.location.get("latitude") or 30.1575
        lng = request.location.get("lng") or request.location.get("longitude") or 71.5249

    elif isinstance(request.location, str) and request.location.strip():
        # Location as city name string — geocode it
        lat, lng = geocode_city(request.location)

    result = run_equipment_agent(
        service_type=request.service_type,
        farmer_lat=float(lat),
        farmer_lng=float(lng),
        crop_type=request.crop_type or "wheat",
        acres=float(request.acres or 5),
        preferred_date=request.preferred_date or "2026-05-21",
        session_id=request.session_id or "default",
        language=request.language or "roman_urdu"
    )
    return result

@router.get("/", summary="Services router status")
async def services_status():
    """Liveness check for the services router."""
    return {"status": "services router active — POST to /api/services/find to find providers"}
