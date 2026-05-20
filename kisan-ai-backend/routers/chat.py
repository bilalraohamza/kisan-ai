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
        
        advice = mandi_result.get('sell_timing_advice') or ''
        mandi_name = best.get('name') or ''
        price = best.get('price_per_40kg')
        net = best.get('net_revenue_pkr')

        parts = [p for p in [
            advice,
            f"Sab se behtareen mandi: {mandi_name}" if mandi_name else None,
            f"PKR {price}/40kg" if price else None,
            f"Net: PKR {net}" if net else None,
        ] if p] if language == 'roman_urdu' else [p for p in [
            advice,
            f"Best mandi: {mandi_name}" if mandi_name else None,
            f"PKR {price}/40kg" if price else None,
        ] if p]

        reply = " ".join(parts) or {
            "roman_urdu": "Mandi prices check ki gayi hain. Mandi tab mein tafseel dekhein.",
            "urdu": "منڈی قیمتیں چیک کی گئی ہیں۔ منڈی ٹیب میں تفصیل دیکھیں۔",
            "english": "Mandi prices checked. See full details in the Mandi tab."
        }.get(language, "Mandi prices check ki gayi hain.")

        return {
            "reply": reply,
            "reply_for_tts": reply,
            "needs_clarification": False,
            "clarification_question": None,
            "action_triggered": "mandi_query",
            "navigate_to": "Mandi",
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
        action = weather_result.get("action_today") or ""
        alert = weather_result.get("urgent_alert") or ""
        reply = f"{alert} {action}".strip() or "Mausam ki maloomat hasil ho gayi hai."
        return {
            "reply": reply,
            "reply_for_tts": reply,
            "needs_clarification": False,
            "clarification_question": None,
            "action_triggered": "weather_query",
            "navigate_to": "Weather",
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
            "navigate_to": "Services",
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
            "navigate_to": "Calendar",
            "season_data": season_result,
            "trace": season_result["trace"]
        }

    # DISEASE CHECK — route to crop diagnosis agent
    elif intent == "disease_check":
        reply = (
            language == 'urdu' and
            "بیماری کی تشخیص کے لیے براہ کرم بیماری سکینر استعمال کریں۔ نیچے بیماری ٹیب پر جائیں اور اپنی فصل کی تصویر اپ لوڈ کریں۔" or
            language == 'english' and
            "For disease detection please use the Disease Scanner. Go to the Disease tab and upload a photo of your crop for AI analysis." or
            "Bimari ki pehchan ke liye Disease Scanner use karein. Neeche Bimari tab par jayein aur apni fasal ki tasveer upload karein."
        )
        return {
            "reply": reply,
            "reply_for_tts": reply,
            "needs_clarification": False,
            "clarification_question": None,
            "action_triggered": "disease_check",
            "navigate_to": "Disease",
            "trace": result["trace"]
        }

    elif intent == "general_agriculture":
        from utils.llm_client import call_llm
    
        agri_prompt = f"""
You are Kisan AI, an expert agricultural advisor for Pakistani farmers
with deep knowledge of Pakistan's farming conditions, crops, climate,
and available resources.

Farmer's question: {request.message}
Farmer's crop: {fields.get('crop_type', 'not specified')}
Farmer's location: {fields.get('location', 'Pakistan')}
Language: {request.language}

Answer this farming question with:
1. Direct practical answer
2. Specific quantities, timing, or methods where relevant
3. Pakistan-specific advice (local crop varieties, local products)
4. Warning if there is any risk
5. One follow-up tip

STRICT LANGUAGE RULE:
- english: Answer in English only
- roman_urdu: Answer in Roman Urdu only
- urdu: Answer in Urdu script only
Current language: {request.language}

Return ONLY valid JSON:
{{
  "reply": "comprehensive answer in correct language",
  "reply_for_tts": "same answer clean for text to speech"
}}
"""
        agri_output = call_llm(agri_prompt)
        reply = agri_output.get("reply") or result["reply"]
        reply_tts = agri_output.get("reply_for_tts") or reply
    
        return {
            "reply": reply,
            "reply_for_tts": reply_tts,
            "needs_clarification": False,
            "clarification_question": None,
            "action_triggered": "general_agriculture",
            "navigate_to": None,
            "trace": result["trace"]
        }

    elif intent == "greeting":
        from utils.llm_client import call_llm
        import datetime
    
        hour = (datetime.datetime.utcnow().hour + 5) % 24
        time_of_day = "subah" if hour < 12 else "dopahar" if hour < 17 else "shaam"
    
        greet_prompt = f"""
You are Kisan AI greeting a Pakistani farmer.
Generate a warm, friendly greeting in {request.language}.
Time of day: {time_of_day}
Include one helpful farming tip for today's season (May in Pakistan).

Return ONLY valid JSON:
{{
  "reply": "warm greeting with farming tip in correct language",
  "reply_for_tts": "same greeting clean for TTS"
}}
"""
        greet_output = call_llm(greet_prompt)
        reply = greet_output.get("reply") or "Assalam o Alaikum! Main Kisan AI hoon. Aap ki kya madad kar sakta hoon?"
    
        return {
            "reply": reply,
            "reply_for_tts": greet_output.get("reply_for_tts") or reply,
            "needs_clarification": False,
            "clarification_question": None,
            "action_triggered": "greeting",
            "navigate_to": None,
            "trace": result["trace"]
        }

    else:
        from utils.llm_client import call_llm
    
        fallback_prompt = f"""
You are Kisan AI, agricultural assistant for Pakistani farmers.
The farmer said: "{request.message}"
Language: {request.language}

If this is an agricultural question, answer it helpfully.
If this is unclear, ask what farming help they need.

STRICT LANGUAGE RULE:
- english: English only
- roman_urdu: Roman Urdu only  
- urdu: Urdu script only

Return ONLY valid JSON:
{{
  "reply": "helpful response in correct language",
  "reply_for_tts": "clean version for TTS"
}}
"""
        fallback = call_llm(fallback_prompt)
        reply = fallback.get("reply") or result.get("reply") or "Apna sawaal dobara likhein."
    
        return {
            "reply": reply,
            "reply_for_tts": fallback.get("reply_for_tts") or reply,
            "needs_clarification": False,
            "clarification_question": None,
            "action_triggered": intent or "unknown",
            "navigate_to": None,
            "trace": result["trace"]
        }