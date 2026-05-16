"""
Services Router – /api/services
Handles agri-services listings and recommendations.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/", summary="Services status")
async def services_status():
    """Placeholder – agricultural services coming soon."""
    return {"status": "coming soon"}
