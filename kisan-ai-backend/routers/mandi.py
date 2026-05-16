"""
Mandi Router – /api/mandi
Handles real-time mandi (market) price data for crops.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/", summary="Mandi prices status")
async def mandi_status():
    """Placeholder – mandi price intelligence coming soon."""
    return {"status": "coming soon"}
