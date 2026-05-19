"""
Kisan AI — Centralised Pydantic Schemas
========================================
All request and response models live here.
Import from this module in every router — do NOT define inline models.

Usage:
    from models.schemas import ChatRequest, ChatResponse, ...
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ===========================================================================
# Shared / Nested Models
# ===========================================================================

class FarmerProfile(BaseModel):
    """Optional farm context sent by the mobile app."""
    crop: Optional[str] = Field(None, description="Primary crop being grown")
    acres: Optional[float] = Field(None, description="Farm size in acres")
    city: Optional[str] = Field(None, description="Nearest city or tehsil")
    language: Optional[str] = Field("roman_urdu", description="roman_urdu | urdu | english")


class Expert(BaseModel):
    """Agricultural expert recommended by the disease agent."""
    name: Optional[str] = None
    title: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    city: Optional[str] = None
    available: Optional[bool] = None


class Provider(BaseModel):
    """Agricultural service provider returned by the equipment agent."""
    name: Optional[str] = None
    service_type: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    rate_per_acre: Optional[float] = None
    trust_score: Optional[float] = None
    distance_km: Optional[float] = None
    available_date: Optional[str] = None


class MandiEntry(BaseModel):
    """Single mandi with price and distance data."""
    name: Optional[str] = None
    city: Optional[str] = None
    price_per_40kg: Optional[float] = None
    distance_km: Optional[float] = None
    transport_cost_pkr: Optional[float] = None
    gross_revenue_pkr: Optional[float] = None
    net_revenue_pkr: Optional[float] = None
    net_price_per_kg: Optional[float] = None


class WeatherDay(BaseModel):
    """Single day of the 5-day forecast."""
    date: Optional[str] = None
    condition: Optional[str] = None
    rain_probability: Optional[float] = None
    temp_max: Optional[float] = None
    temp_min: Optional[float] = None
    farming_advisory: Optional[str] = None


# ===========================================================================
# Request Models
# ===========================================================================

class ChatRequest(BaseModel):
    message: str
    session_id: str
    language: str = "roman_urdu"
    farmer_profile: dict = {}


class ServiceRequest(BaseModel):
    """POST /api/services/find — agricultural service discovery."""
    service_type: str = Field(..., description="harvester | tractor | labor | storage | transport")
    location: Dict[str, float] = Field(..., description='GPS coords e.g. {"lat": 30.1, "lng": 71.5}')
    crop_type: str = Field(..., description="e.g. wheat, cotton, rice")
    acres: float = Field(..., description="Farm size in acres")
    preferred_date: str = Field(..., description="When service is needed (YYYY-MM-DD or relative)")
    session_id: str = Field(..., description="Unique session identifier (UUID)")
    language: str = Field("roman_urdu", description="roman_urdu | urdu | english")


class SeasonRequest(BaseModel):
    """POST /api/farm/season-plan — crop season calendar."""
    crop_type: str = Field(..., description="e.g. wheat, cotton, rice")
    planting_date: str = Field(..., description="Planting date in YYYY-MM-DD format")
    acres: float = Field(..., description="Farm size in acres")
    farmer_lat: float = Field(30.1575, description="GPS latitude (default: Multan)")
    farmer_lng: float = Field(71.5249, description="GPS longitude (default: Multan)")
    language: str = Field("roman_urdu", description="roman_urdu | urdu | english")


# ===========================================================================
# Response Models
# ===========================================================================

class ChatResponse(BaseModel):
    """POST /api/chat — reply from clarification agent."""
    reply: str = Field(..., description="Natural language reply to display to farmer")
    reply_for_tts: str = Field(..., description="TTS-clean version — no special characters")
    needs_clarification: bool = Field(..., description="True if more info is required from farmer")
    clarification_question: Optional[str] = Field(None, description="Next question to ask farmer")
    action_triggered: str = Field(..., description="Detected intent / agent that will be called")
    trace: Dict[str, Any] = Field(..., description="Full agentic trace for audit and judging")


class DiseaseAnalysisResponse(BaseModel):
    """POST /api/disease/analyze — crop diagnosis result."""
    disease_name: Optional[str] = Field(None, description="English disease name")
    disease_name_urdu: Optional[str] = Field(None, description="Disease name in Urdu script")
    confidence_percent: Optional[float] = Field(None, description="Vision model confidence 0–100")
    severity: Optional[str] = Field(None, description="mild | moderate | severe")
    spread_risk: Optional[str] = Field(None, description="low | medium | high")
    affected_parts: List[str] = Field(default_factory=list, description="Affected plant parts")
    is_healthy: bool = Field(False, description="True if no disease detected")
    description: Optional[str] = Field(None, description="Visual description of condition")
    expert_first_message: Optional[str] = Field(
        None,
        description="ALWAYS show this BEFORE medicines list (ethical requirement)"
    )
    expert: Optional[Expert] = Field(None, description="Recommended expert contact")
    treatment: Optional[Dict[str, Any]] = Field(None, description="Medicine list, cost, schedule")
    farmer_description: Optional[str] = Field(None, description="Disease summary in farmer language")
    trace: Dict[str, Any] = Field(..., description="Full agentic trace for audit and judging")


class WeatherResponse(BaseModel):
    """GET /api/farm/weather/:lat/:lng — 5-day farming forecast."""
    location: Optional[str] = Field(None, description="City name from OpenWeatherMap")
    forecast_5_day: List[WeatherDay] = Field(
        default_factory=list, description="Daily forecast with farming advisories"
    )
    urgent_alert: Optional[str] = Field(None, description="Alert if rain threatens harvest")
    best_harvest_window: Optional[str] = Field(None, description="Best harvest date range")
    weekly_risk: Optional[str] = Field(None, description="low | medium | high")
    action_today: Optional[str] = Field(None, description="What farmer should do today")
    trace: Dict[str, Any] = Field(..., description="Full agentic trace for audit and judging")


class MandiPriceResponse(BaseModel):
    """GET /api/mandi/prices/:crop_type — mandi prices with sell timing advice."""
    crop_type: str = Field(..., description="Requested crop")
    prices: List[MandiEntry] = Field(
        default_factory=list, description="All mandis ranked by net revenue"
    )
    best_mandi: Optional[Dict[str, Any]] = Field(None, description="Top-ranked mandi summary")
    govt_support_price: Optional[float] = Field(
        None, description="Government minimum support price per 40kg"
    )
    overall_trend: Optional[str] = Field(None, description="rising | stable | falling")
    sell_timing_advice: Optional[str] = Field(None, description="LLM sell timing recommendation")
    best_mandi_reason: Optional[str] = Field(None, description="Why this mandi is best")
    market_vs_support: Optional[str] = Field(None, description="Market vs govt price comparison")
    urgent_alert: Optional[str] = Field(None, description="Alert if prices are falling fast")
    wait_or_sell: Optional[str] = Field(None, description="sell_now | wait_3_5_days | wait_1_week")
    potential_extra_earning: Optional[str] = Field(None, description="Extra income vs support price")
    trace: Dict[str, Any] = Field(..., description="Full agentic trace for audit and judging")
