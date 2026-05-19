"""
Weather Intelligence Agent — Kisan AI
=======================================
Two-step pipeline:
  1. OpenWeatherMap API  → real 5-day forecast data
  2. OpenRouter LLM      → farming interpretation, harvest window, urgency alerts

No if/else logic. All interpretation done by LLM.
"""

import requests
import os
import json
from utils.llm_client import call_llm
from dotenv import load_dotenv

load_dotenv()


def run_weather_agent(
    lat: float,
    lng: float,
    language: str = "roman_urdu",
    crop_type: str = None,
    days_to_harvest: int = None
) -> dict:
    """
    Fetch real weather forecast and return farming-context intelligence.

    Args:
        lat:             Latitude of the farm.
        lng:             Longitude of the farm.
        language:        roman_urdu | urdu | english.
        crop_type:       Optional — improves harvest window advice.
        days_to_harvest: Optional — triggers urgency alert if rain imminent.

    Returns:
        dict with forecast_5_day, urgent_alert, best_harvest_window,
        weekly_risk, action_today, and full trace.
    """

    # ------------------------------------------------------------------
    # STEP 1 — WORKPLAN
    # ------------------------------------------------------------------
    workplan = (
        "1. Call OpenWeatherMap API for real 5-day forecast at farmer location "
        "2. Extract temperature, rain probability, wind, humidity per day "
        "3. Send forecast data to LLM to interpret in farming context "
        "4. LLM generates harvest window, urgency alerts, daily advisories "
        "5. Return structured forecast with farming intelligence "
        "6. Build and return full trace"
    )

    # ------------------------------------------------------------------
    # STEP 2 — LANGUAGE INSTRUCTION
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # STEP 3 — CALL OPENWEATHERMAP API
    # ------------------------------------------------------------------
    print(f"[weather_agent] Fetching weather for lat={lat}, lng={lng}...")

    weather_url = "https://api.openweathermap.org/data/2.5/forecast"
    weather_params = {
        "lat": lat,
        "lon": lng,
        "appid": os.getenv("OPENWEATHER_API_KEY"),
        "units": "metric",
        "cnt": 40
    }

    weather_response = requests.get(weather_url, params=weather_params, timeout=10)
    weather_data = weather_response.json()

    if weather_response.status_code != 200:
        raise Exception(f"OpenWeatherMap error: {weather_data}")

    # ------------------------------------------------------------------
    # STEP 4 — EXTRACT & CLEAN FORECAST DATA
    # ------------------------------------------------------------------
    city_name = weather_data.get("city", {}).get("name", "Your Location")
    forecast_list = weather_data.get("list", [])

    # Group 3-hour slots by day
    daily_summary = {}
    for item in forecast_list:
        date = item["dt_txt"].split(" ")[0]
        if date not in daily_summary:
            daily_summary[date] = {
                "date": date,
                "temps": [],
                "rain_probs": [],
                "conditions": [],
                "humidity": [],
                "wind_speed": []
            }
        daily_summary[date]["temps"].append(item["main"]["temp"])
        daily_summary[date]["rain_probs"].append(item.get("pop", 0) * 100)
        daily_summary[date]["conditions"].append(item["weather"][0]["description"])
        daily_summary[date]["humidity"].append(item["main"]["humidity"])
        daily_summary[date]["wind_speed"].append(item["wind"]["speed"])

    # Build clean 5-day summary
    clean_forecast = []
    for date, data in list(daily_summary.items())[:5]:
        clean_forecast.append({
            "date": date,
            "temp_max": round(max(data["temps"]), 1),
            "temp_min": round(min(data["temps"]), 1),
            "rain_probability": round(max(data["rain_probs"]), 1),
            "condition": data["conditions"][0],
            "humidity": round(sum(data["humidity"]) / len(data["humidity"]), 1),
            "wind_speed": round(sum(data["wind_speed"]) / len(data["wind_speed"]), 1)
        })

    # ------------------------------------------------------------------
    # STEP 5 — LLM PROMPT FOR FARMING INTERPRETATION
    # ------------------------------------------------------------------
    llm_prompt = f"""
You are an agricultural weather intelligence expert for Pakistani farmers.
Analyze this real 5-day weather forecast and generate farming advice.

Location: {city_name}
Crop type: {crop_type if crop_type else 'general farming'}
Days to harvest: {days_to_harvest if days_to_harvest else 'unknown'}

5-Day Forecast Data:
{json.dumps(clean_forecast, indent=2)}

Your tasks:
1. For each day generate a short farming advisory
2. Identify the best harvest window if applicable
3. Generate urgent alert if rain threatens harvest in next 5 days
4. Calculate overall farming risk level for this week
5. Recommend specific actions farmer should take today

ABSOLUTE LANGUAGE RULE — VIOLATION IS NOT ACCEPTABLE:
The farmer has selected language: {language}

You MUST write every single text field in that language.
No mixing. No exceptions.

IF language == "english":
  Write ALL text in English only.
  Zero Urdu words. Zero Roman Urdu.
  Good: "Heavy rain expected tomorrow, protect your crops."
  Bad: "Kal barish hogi" or "کل بارش ہوگی"

IF language == "roman_urdu":
  Write ALL text in Roman Urdu only.
  Use Urdu words spelled in English letters.
  Zero Urdu script characters.
  Good: "Kal tez barish hone ka imkan hai, fasal ko mehfooz karein."
  Bad: "کل تیز بارش" or "Heavy rain tomorrow"

IF language == "urdu":
  Write ALL text in Urdu script only.
  Zero English words for Urdu concepts.
  Zero Roman Urdu.
  Good: "کل تیز بارش ہونے کا امکان ہے، فصل کو محفوظ کریں۔"
  Bad: "Kal barish" or "Heavy rain"

This rule applies to EVERY text field in your JSON response
without any exception:
- farming_advisory for each day
- urgent_alert
- best_harvest_window
- action_today
- reasoning

Return ONLY valid JSON. No markdown. No explanation outside JSON.
{{
  "forecast_5_day": [
    {{
      "date": "YYYY-MM-DD",
      "condition": "weather condition",
      "rain_probability": number,
      "temp_max": number,
      "temp_min": number,
      "farming_advisory": "specific advice for this day in farmer language"
    }}
  ],
  "urgent_alert": "string or null — only if rain threatens harvest in next 48 hours",
  "best_harvest_window": "date range or null — best days to harvest based on forecast",
  "weekly_risk": "low or medium or high",
  "action_today": "what farmer should do today",
  "reasoning": "explain your weather interpretation and farming recommendations"
}}
"""

    # ------------------------------------------------------------------
    # STEP 6 — CALL LLM
    # ------------------------------------------------------------------
    llm_output = call_llm(llm_prompt)

    # ------------------------------------------------------------------
    # STEP 7 — BUILD TRACE
    # ------------------------------------------------------------------
    trace = {
        "agent": "Weather Intelligence Agent",
        "workplan": workplan,
        "tool_call": "OpenWeatherMap API + OpenRouter LLM",
        "api_raw_output": clean_forecast,
        "llm_raw_output": llm_output,
        "observation": (
            f"Retrieved 5-day forecast for {city_name}. "
            f"Max rain probability: {max(d['rain_probability'] for d in clean_forecast)}%. "
            f"Weekly risk: {llm_output.get('weekly_risk')}."
        ),
        "reasoning": llm_output.get("reasoning", ""),
        "decision": f"Weekly risk is {llm_output.get('weekly_risk')} — generated farming advisories",
        "action": "Returned 5-day forecast with farming intelligence",
        "outcome": "Farmer advised on best harvest window and daily farming actions"
    }

    # ------------------------------------------------------------------
    # STEP 8 — RETURN FULL RESPONSE
    # ------------------------------------------------------------------
    return {
        "location": city_name,
        "forecast_5_day": llm_output.get("forecast_5_day", clean_forecast),
        "urgent_alert": llm_output.get("urgent_alert"),
        "best_harvest_window": llm_output.get("best_harvest_window"),
        "weekly_risk": llm_output.get("weekly_risk"),
        "action_today": llm_output.get("action_today"),
        "trace": trace
    }
