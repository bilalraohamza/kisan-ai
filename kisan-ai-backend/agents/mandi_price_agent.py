"""
Mandi Price Agent — Kisan AI
==============================
Pipeline:
  1. mandi_prices.json      → crop-specific market prices across Pakistan
  2. Google Distance Matrix  → real road distances to each mandi (Haversine fallback)
  3. Net revenue calculation → gross revenue minus transport cost per mandi
  4. OpenRouter LLM         → trend interpretation and sell timing advice

No if/else logic. All interpretation and advice done by LLM.
"""

import requests
import os
import json
import math
from utils.llm_client import call_llm
from dotenv import load_dotenv

load_dotenv()

# Transport cost assumption: PKR 15 per km per ton of produce
TRANSPORT_COST_PER_KM_PER_TON = 15


# ---------------------------------------------------------------------------
# Distance helpers (identical pattern to equipment_agent)
# ---------------------------------------------------------------------------

def calculate_distance_fallback(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine great-circle distance in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


def get_distances_from_google(farmer_lat: float, farmer_lng: float, mandis: list) -> list:
    """Real road distances via Google Distance Matrix. Falls back to Haversine."""
    destinations = "|".join([f"{m['lat']},{m['lng']}" for m in mandis])
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
                        "mandi_index": i,
                        "distance_km": round(element["distance"]["value"] / 1000, 1),
                    })
                else:
                    distances.append({
                        "mandi_index": i,
                        "distance_km": calculate_distance_fallback(
                            farmer_lat, farmer_lng, mandis[i]["lat"], mandis[i]["lng"]
                        ),
                    })
        return distances
    except Exception as e:
        print(f"[mandi_agent] Google Maps failed: {e}. Using Haversine fallback.")
        return [
            {
                "mandi_index": i,
                "distance_km": calculate_distance_fallback(
                    farmer_lat, farmer_lng, m["lat"], m["lng"]
                ),
            }
            for i, m in enumerate(mandis)
        ]


# ---------------------------------------------------------------------------
# Main agent
# ---------------------------------------------------------------------------

def run_mandi_price_agent(
    crop_type: str,
    farmer_lat: float,
    farmer_lng: float,
    acres: float,
    language: str = "roman_urdu",
) -> dict:
    """
    Find best mandi by net revenue and return sell timing advice.

    Args:
        crop_type:   wheat | rice | cotton | sugarcane | maize | onion | potato
        farmer_lat:  GPS latitude of farm.
        farmer_lng:  GPS longitude of farm.
        acres:       Farm size — used to estimate yield and transport cost.
        language:    roman_urdu | urdu | english.

    Returns:
        Ranked mandis + best_mandi + sell timing advice + full trace.
    """

    # ------------------------------------------------------------------
    # STEP 1 — WORKPLAN
    # ------------------------------------------------------------------
    workplan = (
        "1. Load mandi prices from mandi_prices.json for requested crop "
        "2. Call Google Distance Matrix API for real distances to each mandi "
        "3. Calculate transport cost and net price after transport per mandi "
        "4. Sort mandis by net revenue descending "
        "5. Send all data to LLM for trend interpretation and sell timing advice "
        "6. LLM generates sell timing recommendation in farmer language "
        "7. Return ranked mandis with net prices and advice "
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
    # STEP 3 — LOAD MANDI PRICES
    # ------------------------------------------------------------------
    prices_path = os.path.join(os.path.dirname(__file__), "..", "data", "mandi_prices.json")
    with open(prices_path, "r", encoding="utf-8") as f:
        all_prices = json.load(f)

    crop_data = all_prices.get(crop_type.lower())
    if not crop_data:
        raise Exception(f"No mandi data found for crop: {crop_type}")

    mandis = crop_data["mandis"]
    govt_support_price = crop_data["govt_support_price_per_40kg"]

    # ------------------------------------------------------------------
    # STEP 4 — GET REAL DISTANCES
    # ------------------------------------------------------------------
    distances = get_distances_from_google(farmer_lat, farmer_lng, mandis)

    # ------------------------------------------------------------------
    # STEP 5 — CALCULATE TRANSPORT COST AND NET REVENUE
    # ------------------------------------------------------------------
    # Assumption: 1 acre = 1.5 tons average yield
    estimated_yield_tons = acres * 1.5

    enriched_mandis = []
    for i, mandi in enumerate(mandis):
        dist_km = distances[i]["distance_km"] if i < len(distances) else 999
        transport_cost = round(dist_km * TRANSPORT_COST_PER_KM_PER_TON * estimated_yield_tons, 0)
        gross_revenue = (mandi["price_per_40kg"] / 40) * (estimated_yield_tons * 1000)
        net_revenue = gross_revenue - transport_cost

        enriched_mandis.append({
            **mandi,
            "distance_km": dist_km,
            "transport_cost_pkr": transport_cost,
            "gross_revenue_pkr": round(gross_revenue, 0),
            "net_revenue_pkr": round(net_revenue, 0),
            "net_price_per_kg": round(net_revenue / (estimated_yield_tons * 1000), 2),
        })

    # Sort by net revenue descending
    enriched_mandis.sort(key=lambda x: x["net_revenue_pkr"], reverse=True)
    best_mandi = enriched_mandis[0]

    # ------------------------------------------------------------------
    # STEP 6 — LLM PROMPT
    # ------------------------------------------------------------------
    llm_prompt = f"""
You are an agricultural market intelligence expert for Pakistani farmers.
Analyze these mandi prices and generate sell timing advice.

Crop: {crop_type}
Farm size: {acres} acres
Estimated yield: {estimated_yield_tons} tons
Government support price: PKR {govt_support_price} per 40kg

Mandi prices with real distances and net revenues:
{json.dumps(enriched_mandis, indent=2)}

Your tasks:
1. Analyze price trends across all mandis
2. Identify if prices are rising, stable, or falling overall
3. Generate sell timing advice — should farmer sell now or wait?
4. Explain why the best mandi is the best choice
5. Calculate how much more farmer earns vs government support price
6. Generate one urgent alert if prices are falling fast

STRICT LANGUAGE RULE — THIS IS MANDATORY:
You MUST write EVERY text field in this exact language: {language}

If language is "english":
  - Write everything in English only
  - Example sell_timing_advice: "Sell now at Faisalabad Sugar Mills for best net return"
  - NEVER use Urdu or Roman Urdu words

If language is "roman_urdu":
  - Write everything in Roman Urdu only
  - Example sell_timing_advice: "Abhi Faisalabad mein bechein, sab se zyada net milega"
  - NEVER use Urdu script characters

If language is "urdu":
  - Write everything in Urdu script only
  - Example sell_timing_advice: "ابھی فیصل آباد میں بیچیں، سب سے زیادہ خالص ملے گا"
  - NEVER use Roman letters for Urdu words

This rule applies to ALL of these fields:
- sell_timing_advice
- best_mandi_reason
- market_vs_support
- urgent_alert
- potential_extra_earning
- reasoning

Current language selection: {language}
Violating this rule is not acceptable.

Return ONLY valid JSON. No markdown. No explanation outside JSON.
{{
  "overall_trend": "rising or stable or falling",
  "sell_timing_advice": "detailed advice on when to sell in farmer language",
  "best_mandi_reason": "why this mandi gives best net return in farmer language",
  "market_vs_support": "how market price compares to govt support price in farmer language",
  "urgent_alert": "string or null — only if prices falling fast",
  "wait_or_sell": "sell_now or wait_3_5_days or wait_1_week",
  "potential_extra_earning": "string describing how much more farmer earns vs support price (e.g. 'PKR 5,000 zyada milega')",
  "reasoning": "explain your market analysis and recommendation"
}}
"""

    # ------------------------------------------------------------------
    # STEP 7 — CALL LLM
    # ------------------------------------------------------------------
    llm_output = call_llm(llm_prompt)

    # ------------------------------------------------------------------
    # STEP 8 — BUILD TRACE
    # ------------------------------------------------------------------
    trace = {
        "agent": "Mandi Price Agent",
        "workplan": workplan,
        "tool_call": "Google Distance Matrix API + OpenRouter LLM",
        "api_raw_output": enriched_mandis,
        "llm_raw_output": llm_output,
        "observation": (
            f"Found {len(mandis)} mandis for {crop_type}. "
            f"Best mandi: {best_mandi['name']} at PKR {best_mandi['price_per_40kg']}/40kg. "
            f"Net revenue: PKR {best_mandi['net_revenue_pkr']}. "
            f"Overall trend: {llm_output.get('overall_trend')}."
        ),
        "reasoning": llm_output.get("reasoning", ""),
        "decision": f"Best mandi is {best_mandi['name']} — {llm_output.get('wait_or_sell')}",
        "action": "Returned ranked mandi list with sell timing advice",
        "outcome": f"Farmer advised to {llm_output.get('wait_or_sell')} at {best_mandi['name']}",
    }

    # ------------------------------------------------------------------
    # STEP 9 — RETURN FULL RESPONSE
    # ------------------------------------------------------------------
    return {
        "crop_type": crop_type,
        "prices": enriched_mandis,
        "best_mandi": {
            "name": best_mandi["name"],
            "city": best_mandi["city"],
            "price_per_40kg": best_mandi["price_per_40kg"],
            "distance_km": best_mandi["distance_km"],
            "net_revenue_pkr": best_mandi["net_revenue_pkr"],
            "transport_cost_pkr": best_mandi["transport_cost_pkr"],
        },
        "govt_support_price": govt_support_price,
        "overall_trend": llm_output.get("overall_trend"),
        "sell_timing_advice": llm_output.get("sell_timing_advice"),
        "best_mandi_reason": llm_output.get("best_mandi_reason"),
        "market_vs_support": llm_output.get("market_vs_support"),
        "urgent_alert": llm_output.get("urgent_alert"),
        "wait_or_sell": llm_output.get("wait_or_sell"),
        "potential_extra_earning": str(llm_output.get("potential_extra_earning", "")),
        "trace": trace,
    }
