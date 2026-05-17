"""
Services Router — /api/services
Handles agricultural service discovery and provider coordination.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from agents.equipment_agent import run_equipment_agent

router = APIRouter()


class ServiceRequest(BaseModel):
    service_type: str
    location: dict
    crop_type: str
    acres: float
    preferred_date: str
    session_id: str
    language: str = "roman_urdu"


@router.post("/find", summary="Find and rank agricultural service providers")
async def find_service(request: ServiceRequest):
    """
    Equipment Coordinator pipeline:
    1. Load and filter providers from providers.json by service_type
    2. Google Distance Matrix API fetches real road distances
    3. OpenRouter LLM ranks providers by availability, distance, trust, and rate
    4. Returns ranked list with booking message and coordination plan

    service_type options: harvester | tractor | labor | storage | transport
    """
    result = run_equipment_agent(
        service_type=request.service_type,
        farmer_lat=request.location["lat"],
        farmer_lng=request.location["lng"],
        crop_type=request.crop_type,
        acres=request.acres,
        preferred_date=request.preferred_date,
        session_id=request.session_id,
        language=request.language,
    )
    return result


@router.get("/", summary="Services router status")
async def services_status():
    """Liveness check for the services router."""
    return {"status": "services router active — POST to /api/services/find to find providers"}
