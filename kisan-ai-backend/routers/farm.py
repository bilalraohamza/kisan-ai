"""
Farm Router – /api/farm
Handles farm profile management and advisory data.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/", summary="Farm management status")
async def farm_status():
    """Placeholder – farm management module coming soon."""
    return {"status": "coming soon"}
