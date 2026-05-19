from fastapi import APIRouter
from pydantic import BaseModel
from agents.clarification_agent import run_clarification_agent
from agents.mandi_price_agent import run_mandi_price_agent
from agents.weather_agent import run_weather_agent
from agents.equipment_agent import run_equipment_agent
from agents.season_planner import run_season_planner_agent
import requests
import os

router = APIRouter()

def get_coords_for_location(location: str):
    if not location:
        return 30.1575, 71.5249

    # Try Google Maps Geocoding API
    try:
        response = requests.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={
                "address": f"{location}, Pakistan",
                "key": os.getenv("GOOGLE_MAPS_API_KEY")
            },
            timeout=5
        )
        data = response.json()
        if data["status"] == "OK":
            loc = data["results"][0]["geometry"]["location"]
            print(f"[geocoding] {location} -> {loc['lat']}, {loc['lng']}")
            return loc["lat"], loc["lng"]
        else:
            print(f"[geocoding] Failed for {location}: {data['status']}")
    except Exception as e:
        print(f"[geocoding] Error for {location}: {e}")

    # Fallback — center of Pakistan
    return 30.3753, 69.3451


class ChatRequest(BaseModel):
    message: str
    session_id: str
    language: str = "roman_urdu"
    farmer_profile: dict = {}


@router.post("")
async def chat(request: ChatRequest):

    # Step 1 — Run clarification agent
    result = run_clarification_agent(
        message=request.message,
        session_id=request.session_id,
        language=request.language
    )

    # Step 2 — If still needs clarification return question
    if result["needs_clarification"]:
        return {
            "reply": result["reply"],
            "reply_for_tts": result["reply_for_tts"],
            "needs_clarification": True,
            "clarification_question": result["clarification_question"],
            "action_triggered": result["intent"],
            "trace": result["trace"]
        }

    # Step 3 — All fields collected route to correct agent
    intent = result["intent"]
    fields = result["extracted_fields"]
    language = request.language

    crop_type = fields.get("crop_type", "wheat")
    location = fields.get("location", "")
    acres = float(fields.get("acres") or 5)
    preferred_date = fields.get("preferred_date", "2026-05-20")
    planting_date = fields.get("planting_date", "2026-01-15")

    # Get real coordinates for any location using Google Maps
    lat, lng = get_coords_for_location(location)

    # MANDI QUERY
    if intent == "mandi_query":
        mandi_result = run_mandi_price_agent(
            crop_type=crop_type,
            farmer_lat=lat,
            farmer_lng=lng,
            acres=acres,
            language=language
        )
        best = mandi_result.get("best_mandi", {})
        reply = (
            f"{mandi_result.get('sell_timing_advice', '')} "
            f"Sab se behtareen mandi: {best.get('name', '')} "
            f"— PKR {best.get('price_per_40kg', '')} per 40kg. "
            f"Net revenue: PKR {best.get('net_revenue_pkr', '')}."
        )
        return {
            "reply": reply,
            "reply_for_tts": reply,
            "needs_clarification": False,
            "clarification_question": None,
            "action_triggered": "mandi_query",
            "mandi_data": mandi_result,
            "trace": mandi_result["trace"]
        }

    # WEATHER QUERY
    elif intent == "weather_query":
        weather_result = run_weather_agent(
            lat=lat,
            lng=lng,
            language=language,
            crop_type=crop_type
        )
        reply = weather_result.get("action_today", "")
        if weather_result.get("urgent_alert"):
            reply = weather_result["urgent_alert"] + " " + reply
        return {
            "reply": reply,
            "reply_for_tts": reply,
            "needs_clarification": False,
            "clarification_question": None,
            "action_triggered": "weather_query",
            "weather_data": weather_result,
            "trace": weather_result["trace"]
        }

    # EQUIPMENT OR LABOR
    elif intent in ["equipment_needed", "labor_needed"]:
        service_type = "harvester" if intent == "equipment_needed" else "labor"
        equip_result = run_equipment_agent(
            service_type=service_type,
            farmer_lat=lat,
            farmer_lng=lng,
            crop_type=crop_type,
            acres=acres,
            preferred_date=preferred_date,
            session_id=request.session_id,
            language=language
        )
        reply = equip_result.get("top_recommendation", "")
        return {
            "reply": reply,
            "reply_for_tts": reply,
            "needs_clarification": False,
            "clarification_question": None,
            "action_triggered": intent,
            "service_data": equip_result,
            "trace": equip_result["trace"]
        }

    # SEASON PLANNING
    elif intent == "season_planning":
        season_result = run_season_planner_agent(
            crop_type=crop_type,
            planting_date=planting_date,
            acres=acres,
            farmer_lat=lat,
            farmer_lng=lng,
            language=language
        )
        reply = season_result.get("harvest_summary", "")
        return {
            "reply": reply,
            "reply_for_tts": reply,
            "needs_clarification": False,
            "clarification_question": None,
            "action_triggered": "season_planning",
            "season_data": season_result,
            "trace": season_result["trace"]
        }

    # UNKNOWN OR DISEASE
    else:
        return {
            "reply": result["reply"],
            "reply_for_tts": result["reply_for_tts"],
            "needs_clarification": False,
            "clarification_question": None,
            "action_triggered": intent,
            "trace": result["trace"]
        }