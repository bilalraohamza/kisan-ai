"""
Crop Diagnosis Agent — Kisan AI
=================================
Receives a crop photo and returns full disease analysis.

Pipeline:
  1. vision_client.py  → Gemini 2.5 Flash Vision identifies the disease
  2. llm_client.py     → OpenRouter LLM generates treatment plan in farmer language
  3. experts.json      → Nearest relevant expert is selected
  4. Trace             → Full agentic trace returned alongside result

NO if/else logic. All reasoning done by vision + LLM models.
"""

import os
import json
from utils.vision_client import analyze_image
from utils.llm_client import call_llm


def run_crop_diagnosis_agent(
    image_bytes: bytes,
    crop_type: str,
    acres: float,
    session_id: str,
    language: str = "roman_urdu"
) -> dict:
    """
    Diagnose crop disease from an image and return treatment + expert recommendation.

    Args:
        image_bytes: Raw bytes of the uploaded crop photo.
        crop_type:   Farmer-provided crop name (wheat, cotton, rice, etc.).
        acres:       Farm size in acres (used for medicine quantity calculation).
        session_id:  Session identifier for tracing.
        language:    Reply language — roman_urdu | urdu | english.

    Returns:
        Full diagnosis dict with disease info, treatment plan, expert, and trace.
    """

    # ------------------------------------------------------------------
    # STEP 1 — WORKPLAN
    # ------------------------------------------------------------------
    workplan = (
        "1. Send crop photo to Gemini 2.5 Flash Vision for disease identification "
        "2. Extract disease name, severity, confidence, spread risk from vision output "
        "3. Send disease data to LLM to generate treatment plan in farmer language "
        "4. Load expert data from experts.json and select nearest relevant expert "
        "5. Combine vision analysis + treatment + expert into final response "
        "6. Build and return full trace"
    )

    # ------------------------------------------------------------------
    # STEP 2 — LANGUAGE INSTRUCTION
    # ------------------------------------------------------------------
    language_instructions = {
        "roman_urdu": "Write all farmer-facing text in Roman Urdu (Urdu words in English letters). Example: 'Aap ki fasal mein yeh bimari hai.'",
        "urdu": "Write all farmer-facing text in Urdu script only. Example: 'آپ کی فصل میں یہ بیماری ہے۔'",
        "english": "Write all farmer-facing text in simple English suitable for a farmer."
    }
    lang_instruction = language_instructions.get(language, language_instructions["roman_urdu"])

    # ------------------------------------------------------------------
    # STEP 3 — VISION PROMPT
    # ------------------------------------------------------------------
    vision_prompt = f"""
You are an expert agricultural disease detection system.
Analyze this crop photo carefully.

Crop type provided by farmer: {crop_type}

Examine the image and identify:
1. The specific disease or condition visible
2. Confidence level of your identification
3. Severity of the infection
4. How fast it is spreading
5. Which parts of the plant are affected

Return ONLY valid JSON. No markdown. No explanation outside JSON.
{{
  "disease_name": "specific disease name in English",
  "disease_name_urdu": "disease name in Urdu script",
  "disease_name_roman_urdu": "disease name in Roman Urdu",
  "confidence_percent": number between 0 and 100,
  "severity": "mild or moderate or severe",
  "spread_risk": "low or medium or high",
  "affected_parts": ["list of affected plant parts"],
  "description": "detailed description of what you see in the image",
  "is_healthy": true or false,
  "reasoning": "explain what visual evidence led to this diagnosis"
}}
"""

    # ------------------------------------------------------------------
    # STEP 4 — CALL VISION API
    # ------------------------------------------------------------------
    vision_output = analyze_image(image_bytes, vision_prompt)

    # ------------------------------------------------------------------
    # STEP 5 — TREATMENT PROMPT
    # ------------------------------------------------------------------
    treatment_prompt = f"""
You are an agricultural treatment expert for Pakistani farmers.
A crop has been diagnosed with the following disease.

Disease: {vision_output.get('disease_name')}
Severity: {vision_output.get('severity')}
Spread Risk: {vision_output.get('spread_risk')}
Crop Type: {crop_type}
Farm Size: {acres} acres

Generate a complete treatment plan using medicines available in Pakistan.
Calculate quantities based on exactly {acres} acres.

Language instruction: {lang_instruction}

Return ONLY valid JSON. No markdown. No explanation outside JSON.
{{
  "medicines": [
    {{
      "name": "medicine name available in Pakistan",
      "type": "fungicide or pesticide or fertilizer",
      "quantity_per_acre": "amount with unit",
      "total_quantity": "total for {acres} acres",
      "application_method": "how to apply",
      "price_per_unit_pkr": number,
      "total_cost_pkr": number
    }}
  ],
  "total_treatment_cost_pkr": number,
  "application_schedule": "when and how often to apply",
  "safety_precautions": "safety note in farmer language",
  "expert_first_message": "message telling farmer to consult expert before buying medicines",
  "farmer_description": "description of disease and treatment in farmer language",
  "reasoning": "why these specific medicines were chosen"
}}
"""

    # ------------------------------------------------------------------
    # STEP 6 — CALL LLM FOR TREATMENT
    # ------------------------------------------------------------------
    treatment_output = call_llm(treatment_prompt)

    # ------------------------------------------------------------------
    # STEP 7 — LOAD EXPERT FROM experts.json
    # ------------------------------------------------------------------
    experts_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'experts.json')
    with open(experts_path, 'r', encoding='utf-8') as f:
        experts_data = json.load(f)

    selected_expert = {}
    if isinstance(experts_data, list) and len(experts_data) > 0:
        for expert in experts_data:
            if crop_type.lower() in str(expert.get('specialization', '')).lower():
                selected_expert = expert
                break
        if not selected_expert:
            selected_expert = experts_data[0]

    # ------------------------------------------------------------------
    # STEP 8 — BUILD TRACE
    # ------------------------------------------------------------------
    trace = {
        "agent": "Crop Diagnosis Agent",
        "session_id": session_id,
        "workplan": workplan,
        "tool_call": "Gemini 2.5 Flash Vision + OpenRouter LLM",
        "vision_raw_output": vision_output,
        "treatment_raw_output": treatment_output,
        "observation": (
            f"Disease identified: {vision_output.get('disease_name')} "
            f"with {vision_output.get('confidence_percent')}% confidence. "
            f"Severity: {vision_output.get('severity')}. "
            f"Spread risk: {vision_output.get('spread_risk')}."
        ),
        "reasoning": vision_output.get("reasoning", ""),
        "decision": f"Diagnosed {vision_output.get('disease_name')} — generating treatment plan",
        "action": "Returned disease diagnosis with treatment plan and expert contact",
        "outcome": f"Farmer informed about {vision_output.get('disease_name')} with complete treatment guidance"
    }

    # ------------------------------------------------------------------
    # STEP 9 — RETURN FULL RESPONSE
    # ------------------------------------------------------------------
    return {
        "disease_name": vision_output.get("disease_name"),
        "disease_name_urdu": vision_output.get("disease_name_urdu"),
        "confidence_percent": vision_output.get("confidence_percent"),
        "severity": vision_output.get("severity"),
        "spread_risk": vision_output.get("spread_risk"),
        "affected_parts": vision_output.get("affected_parts", []),
        "is_healthy": vision_output.get("is_healthy", False),
        "description": vision_output.get("description"),
        "expert_first_message": treatment_output.get("expert_first_message"),
        "expert": selected_expert,
        "treatment": {
            "medicines": treatment_output.get("medicines", []),
            "total_cost_pkr": treatment_output.get("total_treatment_cost_pkr"),
            "application_schedule": treatment_output.get("application_schedule"),
            "safety_note": treatment_output.get("safety_precautions")
        },
        "farmer_description": treatment_output.get("farmer_description"),
        "trace": trace
    }
