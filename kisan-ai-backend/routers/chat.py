"""
Chat Router – /api/chat
Handles farmer chat interactions powered by Gemini.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/", summary="Chat status")
async def chat_status():
    """Placeholder – full chat agent coming soon."""
    return {"status": "coming soon"}
