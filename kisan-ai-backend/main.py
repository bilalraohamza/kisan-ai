"""
Kisan AI Backend - Main Application Entry Point
Autonomous agricultural intelligence for Pakistani farmers
"""

import json
import os
import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import chat, disease, services, mandi, farm

# ---------------------------------------------------------------------------
# App Initialisation
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Kisan AI Backend",
    version="1.0.0",
    description="Autonomous agricultural intelligence for Pakistani farmers",
)

# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Session Store — file-backed JSON (survives within the same Cloud Run instance)
# ---------------------------------------------------------------------------
# NOTE: Cloud Run may spin up multiple instances, so data can still be lost
# between instances. For true multi-instance persistence, upgrade to Redis.
# Within a single instance, /tmp persists across requests.

SESSION_FILE = "/tmp/sessions.json"
_session_lock = threading.Lock()


def _load_sessions() -> dict:
    """Read the sessions file from disk. Returns {} on any error."""
    try:
        if os.path.exists(SESSION_FILE):
            with open(SESSION_FILE, 'r') as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save_sessions(sessions: dict):
    """Write the sessions dict to disk. Silently ignores write errors."""
    try:
        with open(SESSION_FILE, 'w') as f:
            json.dump(sessions, f)
    except Exception:
        pass


def get_session(session_id: str) -> dict:
    """Return the current session context for a given session ID."""
    with _session_lock:
        sessions = _load_sessions()
        return sessions.get(session_id, {})


def update_session(session_id: str, new_data: dict):
    """
    Merge new_data into the existing session.
    Only overwrites a key when the incoming value is non-empty and not 'unknown'.
    """
    with _session_lock:
        sessions = _load_sessions()
        existing = sessions.get(session_id, {})
        for key, value in new_data.items():
            if value is not None and value != "" and value != "unknown":
                existing[key] = value
        sessions[session_id] = existing
        _save_sessions(sessions)


# ---------------------------------------------------------------------------
# Router Registration
# ---------------------------------------------------------------------------
app.include_router(chat.router,     prefix="/api/chat",     tags=["Chat"])
app.include_router(disease.router,  prefix="/api/disease",  tags=["Disease"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(mandi.router,    prefix="/api/mandi",    tags=["Mandi"])
app.include_router(farm.router,     prefix="/api/farm",     tags=["Farm"])

# ---------------------------------------------------------------------------
# Core Endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint – confirms the backend is alive."""
    return {"message": "Kisan AI Backend is running"}


@app.get("/health", tags=["Health"])
async def health_check():
    """Health-check endpoint for uptime monitoring and load-balancer probes."""
    return {
        "status": "ok",
        "project": "Kisan AI",
        "version": "1.0.0",
        "session_store": "file-backed JSON (/tmp/sessions.json)",
    }

# uvicorn main:app --reload --port 8000
