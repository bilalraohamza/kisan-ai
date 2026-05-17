"""
Kisan AI Backend - Main Application Entry Point
Autonomous agricultural intelligence for Pakistani farmers
"""

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
# Session Store (in-memory; replace with Redis for production)
# ---------------------------------------------------------------------------
SESSION_STORE: dict = {}


def get_session(session_id: str) -> dict:
    """Return the current session context for a given session ID."""
    return SESSION_STORE.get(session_id, {})


def update_session(session_id: str, new_data: dict):
    """
    Merge new_data into the existing session.
    Only overwrites a key when the incoming value is non-empty and not 'unknown'.
    """
    existing = SESSION_STORE.get(session_id, {})
    for key, value in new_data.items():
        if value is not None and value != "" and value != "unknown":
            existing[key] = value
    SESSION_STORE[session_id] = existing


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
    }

# uvicorn main:app --reload --port 8000
