"""
Disease Router – /api/disease
Handles crop disease detection via image analysis.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/", summary="Disease detection status")
async def disease_status():
    """Placeholder – crop disease detection coming soon."""
    return {"status": "coming soon"}
