# personA — Day 2 — Clarification Agent

**Project:** Kisan AI  
**Branch:** `backend`  
**Date:** 2026-05-16  
**Engineer:** Person A (Backend)  
**AI:** Antigravity · Gemini 2.0 Flash

---

## Mission

Build a Clarification Agent that:
- Reads any farmer message (Urdu script / Roman Urdu / English)
- Detects intent using **Gemini 2.0 Flash** (no keyword matching)
- Extracts structured fields (crop, acres, location, dates)
- Detects language and responds **in the farmer's own language**
- Asks exactly ONE clarification question when a required field is missing
- Persists context across turns via a session store
- Returns a complete agentic trace for every call

---

## Files Created / Modified

| File | Action | Purpose |
|---|---|---|
| `kisan-ai-backend/agents/clarification_agent.py` | ✅ Created | Gemini 2.0 Flash agent |
| `kisan-ai-backend/routers/chat.py` | ✅ Updated | POST /api/chat + session wiring |
| `kisan-ai-backend/main.py` | ✅ Updated | SESSION_STORE + helpers |
| `kisan-ai-backend/.env.example` | ✅ Created | API key template |

---

## Architecture

```
POST /api/chat
      │
      ▼
  chat.py router
      │  loads session context
      ▼
  clarification_agent.py
      │  builds prompt with message + session
      ▼
  Gemini 2.0 Flash
      │  returns JSON: intent, fields, language, missing, reply
      ▼
  chat.py router
      │  updates session with extracted fields
      ▼
  JSON response + full trace
```

---

## Session Store (main.py)

```python
SESSION_STORE: dict = {}

def get_session(session_id: str) -> dict:
    return SESSION_STORE.get(session_id, {})

def update_session(session_id: str, new_data: dict):
    existing = SESSION_STORE.get(session_id, {})
    for key, value in new_data.items():
        if value is not None and value != "" and value != "unknown":
            existing[key] = value
    SESSION_STORE[session_id] = existing
```

> **Note:** In-memory only. Restart clears all sessions. Replace with Redis before production.

---

## Gemini Prompt Design

The prompt instructs Gemini to return **only valid JSON** with these keys:

| Key | Description |
|---|---|
| `intent` | One of 7 predefined intents |
| `detected_language` | `roman_urdu` / `urdu` / `english` |
| `extracted_fields` | crop_type, acres, location, preferred_date, planting_date |
| `missing_fields` | List of fields still needed |
| `needs_clarification` | Boolean |
| `clarification_question` | Single question in farmer's language, or null |
| `reply` | Full natural reply in farmer's language |
| `reply_for_tts` | Clean reply (no special characters) |
| `reasoning` | Gemini's self-explanation |

---

## Required Fields Per Intent

| Intent | Required Fields |
|---|---|
| `disease_check` | crop_type, acres, location |
| `equipment_needed` | crop_type, acres, location, preferred_date |
| `labor_needed` | crop_type, acres, location, preferred_date |
| `mandi_query` | crop_type, location |
| `weather_query` | location |
| `season_planning` | crop_type, planting_date, acres, location |

---

## Test Cases

### Test 1 — Roman Urdu vague message
```json
POST /api/chat
{
  "message": "meri fasal kharab ho rahi hai",
  "session_id": "test1",
  "language": "roman_urdu",
  "farmer_profile": {}
}
```
**Expected:** `needs_clarification: true`, asks for `crop_type` in Roman Urdu

---

### Test 2 — English with partial info
```json
POST /api/chat
{
  "message": "I need a harvester for my 5 acre wheat farm",
  "session_id": "test2",
  "language": "english",
  "farmer_profile": {}
}
```
**Expected:** `intent: equipment_needed`, asks for `location`

---

### Test 3 — Urdu script
```json
POST /api/chat
{
  "message": "مجھے گندم کی قیمت جاننی ہے",
  "session_id": "test3",
  "language": "urdu",
  "farmer_profile": {}
}
```
**Expected:** `intent: mandi_query`, `detected_language: urdu`, asks for `location` in Urdu script

---

### Test 4 — All fields in one message
```json
POST /api/chat
{
  "message": "Vehari mein 10 acre gehun hai, harvester chahiye aglay hafte",
  "session_id": "test4",
  "language": "roman_urdu",
  "farmer_profile": {}
}
```
**Expected:** `needs_clarification: false`, all fields extracted, `intent: equipment_needed`

---

## Blocker: GEMINI_API_KEY Missing

Tests confirmed server is running (`GET /health → 200 ok`).  
`POST /api/chat` returns `500` because `.env` has no API key.

**Resolution:**  
Add to `kisan-ai-backend/.env`:
```
GEMINI_API_KEY=AIza...your_real_key_here
```
Then restart uvicorn:
```bash
uvicorn main:app --reload --port 8000
```

---

## Standing Rules (Reinforced)

1. **Gemini 2.0 Flash for ALL reasoning** — no if/else chains, no word lists
2. **All traces go to `kisan-ai/kisan-ai-traces/`** (repo root)
3. **Naming:** `personA_dayN_descriptive_name.md`

---

## Next Steps

- [ ] Add `GEMINI_API_KEY` to `.env` and run all 4 tests
- [ ] Implement `routers/disease.py` wired to `agents/crop_diagnosis_agent.py`
- [ ] Add multi-turn test: send Test 1, then reply with crop name, confirm session carry-over
