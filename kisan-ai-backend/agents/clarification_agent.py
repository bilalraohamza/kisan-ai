"""
Clarification Agent — Kisan AI
================================
Uses Gemini 2.0 Flash (via shared utils/gemini_client) for ALL reasoning:
  - Intent detection
  - Field extraction
  - Language detection
  - Missing-field analysis
  - Multilingual question generation

NO if/else logic. NO keyword lists. Gemini decides everything.
"""

import json
from utils.llm_client import call_llm
from services.database import get_session, save_session, get_recent_messages

def run_clarification_agent(message: str, session_id: str, language: str = "roman_urdu") -> dict:

    # Load session from SQLite
    session = get_session(session_id)
    recent_messages = get_recent_messages(session_id, limit=10)

    # Build conversation context
    conversation_context = "\n".join([
        f"{msg['role'].upper()}: {msg['content']}"
        for msg in recent_messages
    ])

    # Build known fields from session
    known_fields = {
        "crop_type": session.get('crop_type'),
        "acres": session.get('acres'),
        "location": session.get('location'),
        "planting_date": session.get('planting_date'),
        "language": session.get('language', language)
    }
    known_fields_clean = {k: v for k, v in known_fields.items() 
                          if v is not None}

    prompt = f"""
You are Kisan AI, an agricultural assistant for Pakistani farmers.

CONVERSATION HISTORY (last 10 messages):
{conversation_context if conversation_context else "No previous messages"}

ALREADY KNOWN ABOUT THIS FARMER — NEVER ASK FOR THESE AGAIN:
{json.dumps(known_fields_clean, ensure_ascii=False)}

CURRENT MESSAGE: "{message}"

TASKS:
1. Detect intent: disease_check, equipment_needed, labor_needed, 
   mandi_query, weather_query, season_planning, or unknown
2. Extract any NEW fields from current message only
3. Merge with already known fields
4. Check what is still missing for the detected intent
5. If missing fields exist, ask for ONE field only
6. Generate reply in {language}

REQUIRED FIELDS PER INTENT:
- disease_check: crop_type, acres, location
- equipment_needed: crop_type, acres, location, preferred_date
- labor_needed: crop_type, acres, location, preferred_date
- mandi_query: crop_type, location
- weather_query: location
- season_planning: crop_type, planting_date, acres, location

CRITICAL RULES:
- If crop_type is in ALREADY KNOWN, never ask for it again
- If location is in ALREADY KNOWN, never ask for it again
- If acres is in ALREADY KNOWN, never ask for it again
- missing_fields must never include fields in ALREADY KNOWN
- Extract crop names in any language: gandam=wheat, chawal=rice, 
  kapas=cotton, makki=maize, ganna=sugarcane

STRICT LANGUAGE RULE:
- roman_urdu: Roman Urdu only, no Urdu script
- urdu: Urdu script only
- english: English only
Current language: {language}

Return ONLY valid JSON. No markdown.
{{
  "intent": "string",
  "detected_language": "roman_urdu|urdu|english",
  "extracted_fields": {{
    "crop_type": "string or null",
    "acres": "number or null",
    "location": "string or null",
    "preferred_date": "string or null",
    "planting_date": "string or null"
  }},
  "missing_fields": ["list"],
  "needs_clarification": true or false,
  "clarification_question": "string or null",
  "reply": "string",
  "reply_for_tts": "string",
  "reasoning": "string"
}}
"""

    llm_output = call_llm(prompt)

    # Merge known fields with newly extracted fields
    new_extracted = llm_output.get("extracted_fields", {})
    final_fields = {**known_fields_clean}
    for key, value in new_extracted.items():
        if value is not None and value != "" and value != "unknown":
            final_fields[key] = value

    # Save to SQLite
    save_session(session_id, {
        'language': language,
        'crop_type': final_fields.get('crop_type'),
        'acres': final_fields.get('acres'),
        'location': final_fields.get('location'),
        'planting_date': final_fields.get('planting_date'),
        'intent': llm_output.get('intent'),
        'new_messages': [
            {'role': 'user', 'content': message, 
             'timestamp': __import__('datetime').datetime.utcnow().isoformat()},
            {'role': 'assistant', 
             'content': llm_output.get('reply', ''),
             'timestamp': __import__('datetime').datetime.utcnow().isoformat()}
        ]
    })

    # Build trace
    trace = {
        "agent": "Clarification Agent",
        "workplan": "1. Load session from SQLite 2. Build conversation context 3. Call LLM with full history 4. Merge extracted fields with known fields 5. Save to SQLite 6. Return response",
        "tool_call": "OpenRouter LLM + SQLite",
        "known_fields_loaded": known_fields_clean,
        "llm_raw_output": llm_output,
        "final_fields": final_fields,
        "observation": f"Intent: {llm_output.get('intent')}. Known: {known_fields_clean}. New: {new_extracted}",
        "reasoning": llm_output.get("reasoning", ""),
        "decision": "Ask clarification" if llm_output.get("needs_clarification") else f"All fields ready — trigger {llm_output.get('intent')}",
        "action": f"Returned question: {llm_output.get('clarification_question')}" if llm_output.get("needs_clarification") else "Passed complete data to next agent",
        "outcome": "Farmer must reply" if llm_output.get("needs_clarification") else "Ready for specialist agent"
    }

    return {
        "intent": llm_output.get("intent"),
        "detected_language": llm_output.get("detected_language", language),
        "extracted_fields": final_fields,
        "needs_clarification": llm_output.get("needs_clarification"),
        "clarification_question": llm_output.get("clarification_question"),
        "reply": llm_output.get("reply"),
        "reply_for_tts": llm_output.get("reply_for_tts"),
        "trace": trace
    }
