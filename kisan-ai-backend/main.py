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
from services.database import init_db

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
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()
    print("[main] SQLite database initialized")


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
