"""
Season Planner Agent
Calculates crop stage and days to harvest, then uses LLM to generate
a complete service calendar with urgency-ranked upcoming reminders.
"""

import os
import json
from datetime import datetime, date, timedelta
from utils.llm_client import call_llm
from dotenv import load_dotenv

load_dotenv()

CROP_TIMELINES = {
    "wheat": {
        "plant_to_harvest_days": 142,
        "stages": [
            {"name": "Germination", "day": 0},
            {"name": "Tillering", "day": 30},
            {"name": "Heading", "day": 75},
            {"name": "Grain Filling", "day": 100},
            {"name": "Harvest Ready", "day": 135}
        ],
        "yield_tons_per_acre": 1.5
    },
    "rice": {
        "plant_to_harvest_days": 135,
        "stages": [
            {"name": "Transplanting", "day": 0},
            {"name": "Tillering", "day": 25},
            {"name": "Panicle Initiation", "day": 70},
            {"name": "Harvest Ready", "day": 130}
        ],
        "yield_tons_per_acre": 2.0
    },
    "cotton": {
        "plant_to_harvest_days": 170,
        "stages": [
            {"name": "Germination", "day": 0},
            {"name": "Squaring", "day": 45},
            {"name": "Flowering", "day": 75},
            {"name": "Boll Development", "day": 110},
            {"name": "Harvest Ready", "day": 165}
        ],
        "yield_tons_per_acre": 1.2
    },
    "sugarcane": {
        "plant_to_harvest_days": 365,
        "stages": [
            {"name": "Planting", "day": 0},
            {"name": "First Ratoon", "day": 90},
            {"name": "Grand Growth", "day": 180},
            {"name": "Maturity", "day": 365}
        ],
        "yield_tons_per_acre": 40.0
    },
    "maize": {
        "plant_to_harvest_days": 110,
        "stages": [
            {"name": "Germination", "day": 0},
            {"name": "Vegetative", "day": 30},
            {"name": "Tasseling", "day": 65},
            {"name": "Harvest Ready", "day": 105}
        ],
        "yield_tons_per_acre": 2.5
    }
}


def run_season_planner_agent(
    crop_type: str,
    planting_date: str,
    acres: float,
    farmer_lat: float,
    farmer_lng: float,
    language: str = "roman_urdu"
) -> dict:

    # STEP 1.1 — WORKPLAN
    workplan = (
        "1. Load crop timeline data for requested crop type "
        "2. Calculate current stage and days to harvest from planting date "
        "3. Set READY_SOON flag if days_to_harvest <= 14 "
        "4. Send crop data to LLM to generate complete service calendar "
        "5. LLM generates upcoming services with dates, urgency, and reminders "
        "6. Return full calendar with farmer-language reminders "
        "7. Build and return full trace"
    )

    # STEP 1.2 — LANGUAGE INSTRUCTION
    # Language rule is embedded directly in the prompt

    # STEP 1.3 — CALCULATE CROP TIMELINE
    crop_timeline = CROP_TIMELINES.get(crop_type.lower())
    if not crop_timeline:
        crop_timeline = CROP_TIMELINES["wheat"]

    planting = datetime.strptime(planting_date, "%Y-%m-%d").date()
    today = date.today()
    days_since_planting = (today - planting).days
    total_days = crop_timeline["plant_to_harvest_days"]
    days_to_harvest = max(0, total_days - days_since_planting)
    estimated_harvest_date = planting + timedelta(days=total_days)

    # Determine current stage
    current_stage = crop_timeline["stages"][0]["name"]
    for stage in crop_timeline["stages"]:
        if days_since_planting >= stage["day"]:
            current_stage = stage["name"]

    crop_status = "READY_SOON" if days_to_harvest <= 14 else "GROWING"
    estimated_yield = crop_timeline["yield_tons_per_acre"] * acres

    # STEP 1.4 — LLM PROMPT
    llm_prompt = f"""
You are an agricultural season planning expert for Pakistani farmers.
Generate a complete service calendar for this farmer's crop.

Crop information:
- Crop type: {crop_type}
- Planting date: {planting_date}
- Today: {today.isoformat()}
- Days since planting: {days_since_planting}
- Current stage: {current_stage}
- Days to harvest: {days_to_harvest}
- Estimated harvest date: {estimated_harvest_date.isoformat()}
- Farm size: {acres} acres
- Estimated yield: {estimated_yield} tons
- Crop status: {crop_status}
- Farmer location: lat {farmer_lat}, lng {farmer_lng}

Crop stages timeline:
{json.dumps(crop_timeline['stages'], indent=2)}

Your tasks:
1. Generate upcoming services needed in the next 30 days based on
   current crop stage and days to harvest
2. For each service specify exact recommended date
3. Assign urgency: high, medium, or low
4. Generate reminder text in farmer language
5. If READY_SOON, make harvester booking the most urgent item
6. Generate full crop calendar from today to post-harvest sale

CRITICAL RULES:
- If days_to_harvest <= 14: harvester booking is URGENT HIGH priority
- If days_to_harvest <= 7: add weather check alert
- Always include: equipment booking, labor arrangement,
  storage booking, transport arrangement, mandi visit

ABSOLUTE LANGUAGE RULE — VIOLATION IS NOT ACCEPTABLE:
The farmer has selected language: {language}

You MUST write every single text field in that language.
No mixing. No exceptions.

IF language == "english":
  Write ALL text in English only.
  Zero Urdu words. Zero Roman Urdu.
  Good: "Book combine harvester by 20 May for wheat harvest"
  Bad: "Combine book karein" or "کمبائن بک کریں"

IF language == "roman_urdu":
  Write ALL text in Roman Urdu only.
  Use Urdu words spelled in English letters.
  Zero Urdu script characters.
  Good: "20 May tak combine book karein, gehun katayi ke liye"
  Bad: "کمبائن" or "Book harvester"

IF language == "urdu":
  Write ALL text in Urdu script only.
  Zero English words for Urdu concepts.
  Zero Roman Urdu.
  Good: "20 مئی تک کمبائن ہارویسٹر بک کریں"
  Bad: "Combine book karein" or "Book harvester"

This rule applies to EVERY text field in your JSON response
without any exception:
- reason for each upcoming service
- action for each upcoming service
- description for each calendar event
- harvest_summary
- post_harvest_plan
- reasoning

Return ONLY valid JSON. No markdown. No explanation outside JSON.
{{
  "upcoming_services": [
    {{
      "service": "service name",
      "recommended_by": "YYYY-MM-DD",
      "urgency": "high or medium or low",
      "reason": "why this service is needed now in farmer language",
      "action": "what farmer should do specifically"
    }}
  ],
  "full_calendar": [
    {{
      "date": "YYYY-MM-DD",
      "event": "event name",
      "description": "description in farmer language"
    }}
  ],
  "harvest_summary": "summary of harvest readiness in farmer language",
  "post_harvest_plan": "what to do after harvest in farmer language",
  "reasoning": "explain your calendar generation logic"
}}
"""

    # STEP 1.5 — CALL LLM
    llm_output = call_llm(llm_prompt)

    # STEP 1.6 — BUILD TRACE
    trace = {
        "agent": "Season Planner Agent",
        "workplan": workplan,
        "tool_call": "OpenRouter LLM",
        "llm_raw_output": llm_output,
        "observation": (
            f"Crop: {crop_type}. Days since planting: {days_since_planting}. "
            f"Current stage: {current_stage}. Days to harvest: {days_to_harvest}. "
            f"Status: {crop_status}."
        ),
        "reasoning": llm_output.get("reasoning", ""),
        "decision": f"Crop is {crop_status} — generated {len(llm_output.get('upcoming_services', []))} upcoming services",
        "action": "Returned complete season calendar with urgency levels",
        "outcome": "Farmer has full service schedule from today to post-harvest"
    }

    return {
        "farm_id": f"{crop_type}_{planting_date}",
        "crop_type": crop_type,
        "planting_date": planting_date,
        "current_stage": current_stage,
        "days_since_planting": days_since_planting,
        "days_to_harvest": days_to_harvest,
        "estimated_harvest_date": estimated_harvest_date.isoformat(),
        "crop_status": crop_status,
        "estimated_yield_tons": estimated_yield,
        "upcoming_services": llm_output.get("upcoming_services", []),
        "full_calendar": llm_output.get("full_calendar", []),
        "harvest_summary": llm_output.get("harvest_summary"),
        "post_harvest_plan": llm_output.get("post_harvest_plan"),
        "trace": trace
    }
