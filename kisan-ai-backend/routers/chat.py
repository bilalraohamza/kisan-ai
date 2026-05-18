"""
Chat Router – /api/chat
Handles farmer chat interactions via the Clarification Agent.
"""

import sys
import os

# Ensure the backend root is on the path so `from main import ...` works
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter
from agents.clarification_agent import run_clarification_agent
from models.schemas import ChatRequest, ChatResponse

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /api/chat  — Main conversation endpoint
# ---------------------------------------------------------------------------

@router.post("", response_model=ChatResponse, summary="Send a farmer message and receive a contextual reply")
async def chat(request: ChatRequest):
    """
    Entry point for the Kisan AI chat pipeline.

    1. Load existing session context.
    2. Inject farmer_profile into context.
    3. Run the Clarification Agent (Gemini 2.0 Flash).
    4. Persist extracted fields and detected metadata back to session.
    5. Return reply, TTS-safe reply, clarification flag, and full trace.
    """
    from main import get_session, update_session

    # Load session and enrich with current farmer profile
    session_context = get_session(request.session_id)
    session_context["farmer_profile"] = request.farm_profile.model_dump(exclude_none=True)

    # Run Gemini-powered clarification agent
    result = run_clarification_agent(request.message, session_context)

    # Persist extracted fields (skips nulls / empty / 'unknown')
    update_session(request.session_id, result.get("extracted_fields", {}))
    update_session(request.session_id, {
        "detected_language": result["detected_language"],
        "intent": result["intent"],
    })

    return {
        "reply": result["reply"],
        "reply_for_tts": result["reply_for_tts"],
        "needs_clarification": result["needs_clarification"],
        "clarification_question": result["clarification_question"],
        "action_triggered": result["intent"],
        "trace": result["trace"],
    }


# ---------------------------------------------------------------------------
# GET /api/chat  — Placeholder / status
# ---------------------------------------------------------------------------

@router.get("/", summary="Chat router status")
async def chat_status():
    """Liveness check for the chat router."""
    return {"status": "chat router active — POST to /api/chat to talk to a farmer agent"}
