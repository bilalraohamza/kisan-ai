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


def run_clarification_agent(message: str, session_context: dict) -> dict:
    """
    Run the clarification agent against a single farmer message.

    Args:
        message:         Raw farmer message (any language / script).
        session_context: Existing session dict accumulated across turns.

    Returns:
        dict with keys: intent, detected_language, extracted_fields,
        needs_clarification, clarification_question, reply, reply_for_tts, trace.
    """

    # ------------------------------------------------------------------
    # STEP 1 — WORKPLAN (logged in trace)
    # ------------------------------------------------------------------
    workplan = (
        "1. Send farmer message to Gemini 2.0 Flash "
        "2. Gemini detects intent, extracts all available fields, detects language "
        "3. Check which required fields are still missing "
        "4. If missing fields exist, ask for ONE field in farmer's language "
        "5. If all fields collected, return intent and data to trigger next agent "
        "6. Build and return full trace"
    )

    # ------------------------------------------------------------------
    # STEP 2 — GEMINI PROMPT
    # ------------------------------------------------------------------
    prompt = f"""
You are an agricultural assistant for Pakistani farmers.
Analyze this farmer message and the existing session context.

Farmer message: "{message}"
Session context so far: {json.dumps(session_context)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL MEMORY RULE — READ THIS FIRST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The session_context already contains fields collected from previous messages.
You MUST treat these as already answered.
Do NOT ask for any field that already exists in session_context.
Only ask for fields that are completely missing from session_context.

Currently collected fields: {json.dumps(session_context)}

Specific rules:
- If "crop_type" is already in session_context → NEVER ask for crop type again.
- If "location" is already in session_context → NEVER ask for location again.
- If "acres" is already in session_context → NEVER ask for acres again.
- If "preferred_date" is already in session_context → NEVER ask for date again.
- If "planting_date" is already in session_context → NEVER ask for planting date again.

Treat every key in session_context as 100% confirmed. Do not re-verify them.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your tasks:
1. Detect the farmer's intent. Choose ONE from:
   - disease_check
   - equipment_needed
   - labor_needed
   - mandi_query
   - weather_query
   - season_planning
   - unknown

2. Extract any NEW fields mentioned in THIS message only:
   - crop_type (example: wheat, gehun, chawal, cotton, گندم)
   - acres (any number mentioned with acre, kanal, marla — convert all to acres)
   - location (any city, village, tehsil, district name)
   - preferred_date (any date or time reference)
   - planting_date (when the crop was planted)

3. Detect language:
   - urdu: if message contains Urdu script characters
   - roman_urdu: if message uses Roman letters but Urdu words
   - english: if message is in English

4. Check which required fields are still missing after combining
   extracted fields with session context.

   Required fields per intent:
   - disease_check: crop_type, acres, location
   - equipment_needed: crop_type, acres, location, preferred_date
   - labor_needed: crop_type, acres, location, preferred_date
   - mandi_query: crop_type, location
   - weather_query: location
   - season_planning: crop_type, planting_date, acres, location

   IMPORTANT: A field present in session_context counts as collected.
   Only put it in missing_fields if it is absent from BOTH session_context
   AND the current message.

5. If a field is missing, generate ONE clarification question
   in the detected language asking for that field.

   Language rules:
   - roman_urdu: Write in Roman Urdu. Example: "Aap ka fasal konsa hai?"
   - urdu: Write in Urdu script. Example: "آپ کی فصل کون سی ہے؟"
   - english: Write in simple English. Example: "What crop are you growing?"

6. Generate a natural conversational reply in the farmer's language.
   If clarification is needed, the reply IS the clarification question.
   If all fields collected, reply confirms and says processing is starting.

Return ONLY valid JSON. No markdown. No explanation outside JSON.
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
  "missing_fields": ["list of missing field names"],
  "needs_clarification": true or false,
  "clarification_question": "string or null",
  "reply": "string — natural reply in farmer's language",
  "reply_for_tts": "string — same reply but clean, no special characters",
  "reasoning": "string — explain why you made these decisions"
}}
"""

    # ------------------------------------------------------------------
    # STEP 3 — CALL LLM (via shared OpenRouter client)
    # ------------------------------------------------------------------
    llm_output = call_llm(prompt)

    # ------------------------------------------------------------------
    # STEP 4 — BUILD TRACE
    # ------------------------------------------------------------------
    trace = {
        "agent": "Clarification Agent",
        "model": "openrouter/auto",
        "workplan": workplan,
        "tool_call": "OpenRouter LLM — intent detection, field extraction, language detection",
        "llm_raw_output": llm_output,
        "observation": (
            f"Intent detected: {llm_output['intent']}. "
            f"Language: {llm_output['detected_language']}. "
            f"Fields extracted: {llm_output['extracted_fields']}. "
            f"Missing: {llm_output['missing_fields']}"
        ),
        "reasoning": llm_output.get("reasoning", ""),
        "decision": (
            "Ask clarification"
            if llm_output["needs_clarification"]
            else f"All fields collected — trigger {llm_output['intent']}"
        ),
        "action": (
            f"Returned question: {llm_output['clarification_question']}"
            if llm_output["needs_clarification"]
            else "Passed complete data to next agent"
        ),
        "outcome": (
            "Farmer must reply with more information"
            if llm_output["needs_clarification"]
            else "Intent and all fields ready for specialist agent"
        ),
    }

    # ------------------------------------------------------------------
    # STEP 5 — RETURN STRUCTURED RESULT
    # ------------------------------------------------------------------
    return {
        "intent": llm_output["intent"],
        "detected_language": llm_output["detected_language"],
        "extracted_fields": llm_output["extracted_fields"],
        "needs_clarification": llm_output["needs_clarification"],
        "clarification_question": llm_output.get("clarification_question"),
        "reply": llm_output["reply"],
        "reply_for_tts": llm_output["reply_for_tts"],
        "trace": trace,
    }
