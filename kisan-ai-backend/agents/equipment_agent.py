"""
Equipment Coordinator Agent — Kisan AI
========================================
Ranks agricultural service providers for a farmer using:
  1. providers.json         → filtered list by service type
  2. Google Distance Matrix → real road distances to each provider (Haversine fallback)
  3. OpenRouter LLM         → intelligent ranking by trust, distance, rate, availability

No if/else ranking logic. All reasoning done by LLM.
"""

import requests
import os
import json
import math
from utils.llm_client import call_llm
from dotenv import load_dotenv

load_dotenv()


# ---------------------------------------------------------------------------
# Distance helpers
# ---------------------------------------------------------------------------

def calculate_distance_fallback(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine great-circle distance in km — used when Google Maps is unavailable."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


def get_distances_from_google(farmer_lat: float, farmer_lng: float, providers: list) -> list:
    """
    Call Google Distance Matrix API for real road distances.
    Falls back to Haversine per provider if the API fails or key is missing.
    """
    destinations = "|".join([f"{p['lat']},{p['lng']}" for p in providers])

    try:
        response = requests.get(
            "https://maps.googleapis.com/maps/api/distancematrix/json",
            params={
                "origins": f"{farmer_lat},{farmer_lng}",
                "destinations": destinations,
                "key": os.getenv("GOOGLE_MAPS_API_KEY"),
                "units": "metric",
            },
            timeout=10,
        )
        data = response.json()

        distances = []
        if data.get("status") == "OK":
            elements = data["rows"][0]["elements"]
            for i, element in enumerate(elements):
                if element["status"] == "OK":
                    distances.append({
                        "provider_id": providers[i]["id"],
                        "distance_km": round(element["distance"]["value"] / 1000, 1),
                        "duration_minutes": round(element["duration"]["value"] / 60, 0),
                    })
                else:
                    distances.append({
                        "provider_id": providers[i]["id"],
                        "distance_km": calculate_distance_fallback(
                            farmer_lat, farmer_lng, providers[i]["lat"], providers[i]["lng"]
                        ),
                        "duration_minutes": None,
                    })
        return distances

    except Exception as e:
        print(f"[equipment_agent] Google Maps failed: {e}. Using Haversine fallback.")
        return [
            {
                "provider_id": p["id"],
                "distance_km": calculate_distance_fallback(
                    farmer_lat, farmer_lng, p["lat"], p["lng"]
                ),
                "duration_minutes": None,
            }
            for p in providers
        ]


# ---------------------------------------------------------------------------
# Main agent
# ---------------------------------------------------------------------------

def run_equipment_agent(
    service_type: str,
    farmer_lat: float,
    farmer_lng: float,
    crop_type: str,
    acres: float,
    preferred_date: str,
    session_id: str,
    language: str = "roman_urdu",
) -> dict:
    """
    Find, rank, and recommend agricultural service providers.

    Args:
        service_type:   harvester | tractor | labor | storage | transport
        farmer_lat:     Farmer GPS latitude.
        farmer_lng:     Farmer GPS longitude.
        crop_type:      Crop name (wheat, cotton, rice, etc.).
        acres:          Farm size for total cost calculation.
        preferred_date: ISO date string (YYYY-MM-DD) farmer wants service.
        session_id:     Session identifier for tracing.
        language:       roman_urdu | urdu | english.

    Returns:
        Ranked providers + coordination plan + booking message + trace.
    """

    # ------------------------------------------------------------------
    # STEP 1 — WORKPLAN
    # ------------------------------------------------------------------
    workplan = (
        "1. Load providers from providers.json filtered by service type "
        "2. Call Google Distance Matrix API for real distances to each provider "
        "3. Attach distance data to each provider "
        "4. Send enriched provider list to LLM for intelligent ranking "
        "5. LLM ranks by trust score, distance, rate, and availability "
        "6. LLM generates coordination plan and recommendation in farmer language "
        "7. Return ranked providers with full coordination plan "
        "8. Build and return full trace"
    )

    # ------------------------------------------------------------------
    # STEP 2 — LANGUAGE INSTRUCTION
    # ------------------------------------------------------------------
    language_instructions = {
        "roman_urdu": "Write ALL farmer-facing text in Roman Urdu only. NEVER use Urdu script.",
        "urdu": "Write ALL farmer-facing text in Urdu script only. NEVER use Roman letters for Urdu words.",
        "english": "Write ALL farmer-facing text in simple English only.",
    }
    lang_instruction = language_instructions.get(language, language_instructions["roman_urdu"])

    # ------------------------------------------------------------------
    # STEP 3 — LOAD AND FILTER PROVIDERS
    # ------------------------------------------------------------------
    providers_path = os.path.join(os.path.dirname(__file__), "..", "data", "providers.json")
    with open(providers_path, "r", encoding="utf-8") as f:
        all_providers = json.load(f)

    filtered_providers = [p for p in all_providers if p["type"] == service_type]

    if not filtered_providers:
        raise Exception(f"No providers found for service type: {service_type}")

    print(f"[equipment_agent] Found {len(filtered_providers)} providers for {service_type}")

    # ------------------------------------------------------------------
    # STEP 4 — GET DISTANCES
    # ------------------------------------------------------------------
    distances = get_distances_from_google(farmer_lat, farmer_lng, filtered_providers)
    distance_map = {d["provider_id"]: d for d in distances}

    enriched_providers = []
    for provider in filtered_providers:
        dist_data = distance_map.get(provider["id"], {})
        enriched_providers.append({
            **provider,
            "distance_km": dist_data.get("distance_km", 999),
            "duration_minutes": dist_data.get("duration_minutes"),
            "total_cost_pkr": provider["rate_pkr_per_acre"] * acres,
            "available_on_preferred_date": preferred_date in provider.get("availability", []),
        })

    # ------------------------------------------------------------------
    # STEP 5 — LLM RANKING PROMPT
    # ------------------------------------------------------------------
    llm_prompt = f"""
You are an agricultural service coordinator for Pakistani farmers.
Rank these {service_type} providers for a farmer and generate a coordination plan.

Farmer needs:
- Service type: {service_type}
- Crop: {crop_type}
- Farm size: {acres} acres
- Preferred date: {preferred_date}
- Farmer location: lat {farmer_lat}, lng {farmer_lng}

Available providers with real distances:
{json.dumps(enriched_providers, indent=2)}

Ranking criteria (in order of importance):
1. Available on preferred date
2. Distance from farmer (closer is better)
3. Trust score (higher is better)
4. Rate per acre (lower is better)

Your tasks:
1. Rank all providers from best to worst with reasoning for each
2. Generate a coordination recommendation for the top provider
3. Generate a booking message farmer can send to the top provider
4. Calculate total cost for {acres} acres with top provider
5. Suggest backup provider in case top provider is unavailable

STRICT LANGUAGE RULE: {lang_instruction}

Return ONLY valid JSON. No markdown. No explanation outside JSON.
{{
  "ranked_providers": [
    {{
      "rank": 1,
      "id": "provider id",
      "name": "provider name",
      "distance_km": number,
      "rate_pkr_per_acre": number,
      "total_cost_pkr": number,
      "trust_score": number,
      "phone": "string",
      "area": "string",
      "available_on_preferred_date": true or false,
      "ranking_reason": "why this provider was ranked here in farmer language"
    }}
  ],
  "top_recommendation": "detailed recommendation for top provider in farmer language",
  "booking_message": "message farmer can send or say to book the top provider",
  "backup_provider": "name and phone of backup provider",
  "total_cost_pkr": number,
  "coordination_plan": "step by step plan for farmer in farmer language",
  "reasoning": "explain your ranking decisions"
}}
"""

    # ------------------------------------------------------------------
    # STEP 6 — CALL LLM
    # ------------------------------------------------------------------
    llm_output = call_llm(llm_prompt)

    # ------------------------------------------------------------------
    # STEP 7 — BUILD TRACE
    # ------------------------------------------------------------------
    top_provider = llm_output.get("ranked_providers", [{}])[0]
    trace = {
        "agent": "Equipment Coordinator Agent",
        "session_id": session_id,
        "workplan": workplan,
        "tool_call": "Google Distance Matrix API + OpenRouter LLM",
        "api_raw_output": enriched_providers,
        "llm_raw_output": llm_output,
        "observation": (
            f"Found {len(filtered_providers)} {service_type} providers. "
            f"Top ranked: {top_provider.get('name', 'unknown')}. "
            f"Total cost: PKR {llm_output.get('total_cost_pkr')}."
        ),
        "reasoning": llm_output.get("reasoning", ""),
        "decision": f"Recommended {top_provider.get('name', 'unknown')} as top provider",
        "action": "Returned ranked provider list with coordination plan",
        "outcome": "Farmer has ranked providers and booking message ready",
    }

    # ------------------------------------------------------------------
    # STEP 8 — RETURN FULL RESPONSE
    # ------------------------------------------------------------------
    return {
        "service_type": service_type,
        "providers": llm_output.get("ranked_providers", []),
        "top_recommendation": llm_output.get("top_recommendation"),
        "booking_message": llm_output.get("booking_message"),
        "backup_provider": llm_output.get("backup_provider"),
        "total_cost_pkr": llm_output.get("total_cost_pkr"),
        "coordination_plan": llm_output.get("coordination_plan"),
        "trace": trace,
    }
