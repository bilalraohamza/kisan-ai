# personA — Day 3 — Crop Diagnosis Agent

**Project:** Kisan AI  
**Branch:** `backend`  
**Date:** 2026-05-17  
**Engineer:** Person A (Backend)  
**AI:** Antigravity

---

## Mission

Build a complete crop disease detection pipeline:
1. Farmer uploads a crop photo via `POST /api/disease/analyze`
2. Gemini 2.5 Flash Vision identifies the disease
3. OpenRouter LLM generates a treatment plan in the farmer's language
4. Nearest matching expert is recommended from `experts.json`
5. Full agentic trace returned with every response

---

## Files Created / Modified

| File | Action | Purpose |
|---|---|---|
| `utils/vision_client.py` | ✅ Created | Gemini 2.5 Flash Vision API wrapper |
| `agents/crop_diagnosis_agent.py` | ✅ Created | Full diagnosis pipeline agent |
| `data/experts.json` | ✅ Populated | 4 mock agricultural experts |
| `routers/disease.py` | ✅ Updated | `POST /api/disease/analyze` endpoint |

---

## Architecture

```
POST /api/disease/analyze (multipart/form-data)
         │
         ▼
  disease.py router
         │  reads image bytes + form fields
         ▼
  crop_diagnosis_agent.py
         │
         ├──► vision_client.py ──► Gemini 2.5 Flash Vision
         │         returns: disease_name, severity, confidence, affected_parts
         │
         ├──► llm_client.py ──► OpenRouter LLM
         │         returns: medicines[], cost, schedule, farmer_description
         │
         ├──► data/experts.json
         │         returns: nearest expert for crop type
         │
         └──► combined JSON response + trace
```

---

## vision_client.py

- Uses `GEMINI_API_KEY` from `.env`
- Gemini 2.5 Flash REST endpoint (multimodal)
- Rate-limit: 6s minimum between calls
- Retry: 3 attempts with 15s backoff on 429

---

## Vision Prompt Output Schema

```json
{
  "disease_name": "Wheat Rust",
  "disease_name_urdu": "گندم کا زنگ",
  "disease_name_roman_urdu": "Gandum ka Zang",
  "confidence_percent": 87,
  "severity": "moderate",
  "spread_risk": "high",
  "affected_parts": ["leaves", "stems"],
  "description": "...",
  "is_healthy": false,
  "reasoning": "..."
}
```

---

## Treatment Prompt Output Schema

```json
{
  "medicines": [
    {
      "name": "Tilt 250 EC",
      "type": "fungicide",
      "quantity_per_acre": "250ml",
      "total_quantity": "1250ml",
      "application_method": "spray",
      "price_per_unit_pkr": 1200,
      "total_cost_pkr": 6000
    }
  ],
  "total_treatment_cost_pkr": 6000,
  "application_schedule": "...",
  "safety_precautions": "...",
  "expert_first_message": "...",
  "farmer_description": "...",
  "reasoning": "..."
}
```

---

## Expert Selection Logic

- Loads `data/experts.json`
- Iterates experts and checks if `crop_type` appears in their `specialization` field
- Falls back to `experts[0]` if no crop match found

---

## Experts Mock Data

| ID | Name | Specialization | Area |
|---|---|---|---|
| exp001 | Dr. Muhammad Asif | wheat cotton rice | Multan |
| exp002 | Dr. Tariq Mehmood | rice sugarcane maize | Lahore |
| exp003 | Dr. Khalid Hussain | cotton wheat vegetables | Faisalabad |
| exp004 | Dr. Amjad Ali | wheat maize potato onion | Vehari |

---

## How to Test

1. Go to `http://localhost:8000/docs`
2. Open `POST /api/disease/analyze`
3. Click **Try it out**
4. Upload any crop photo (JPEG)
5. Fill in:
   - `crop_type`: wheat
   - `acres`: 5
   - `session_id`: test_disease_1
   - `language`: roman_urdu
6. Click **Execute**

**Expected response:**
- `disease_name` — from Gemini Vision
- `confidence_percent` — 0–100
- `treatment.medicines` — list with Pakistan-available medicines
- `expert` — nearest matching expert with phone number
- `expert_first_message` — advisory to consult expert before buying

---

## Environment Variables Required

```
# kisan-ai-backend/.env
GEMINI_API_KEY=...      # for vision_client.py (Gemini 2.5 Flash)
OPENROUTER_API_KEY=...  # for llm_client.py (treatment LLM)
```

---

## Standing Rules (Reinforced)

1. `vision_client.py` — image analysis only (Gemini 2.5 Flash Vision)
2. `llm_client.py` — all text reasoning (OpenRouter)
3. All traces → `kisan-ai/kisan-ai-traces/` at repo root
4. Naming: `personA_dayN_descriptive_name.md`
