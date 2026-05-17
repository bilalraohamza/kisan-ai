# personA — Day 4 — Season Planner Agent

**Project:** Kisan AI  
**Branch:** `backend`  
**Date:** 2026-05-17  
**Engineer:** Person A (Backend)  
**AI:** Antigravity

---

## Mission

Build a Season Planner Agent that:
1. Takes farmer crop type and planting date
2. Calculates current crop stage and days to harvest from a built-in CROP_TIMELINES dictionary
3. Sets `READY_SOON` flag when `days_to_harvest <= 14`
4. Sends all enriched data to OpenRouter LLM to generate a complete service calendar
5. LLM generates upcoming services with exact dates, urgency levels, and farmer-language reminders
6. Returns full calendar + trace — no if/else calendar logic, all reasoning done by LLM

---

## Files Created / Modified

| File | Action | Purpose |
|---|---|---|
| `agents/season_planner.py` | ✅ Created | Full 7-step planner pipeline |
| `routers/farm.py` | ✅ Updated | `POST /api/farm/season-plan` |
| `kisan-ai-traces/personA_day4_season_planner.md` | ✅ Created | This trace |

---

## Architecture

```
POST /api/farm/season-plan
         │
         ▼
   farm.py router
         │
         ▼
   season_planner.py
         │
         ├──► CROP_TIMELINES dict
         │       Crops: wheat, rice, cotton, sugarcane, maize
         │       Fields: plant_to_harvest_days, stages[], yield_tons_per_acre
         │
         ├──► Timeline Calculation
         │       days_since_planting = today - planting_date
         │       days_to_harvest = total_days - days_since_planting
         │       current_stage = last stage whose day <= days_since_planting
         │       crop_status = READY_SOON if days_to_harvest <= 14
         │
         ├──► OpenRouter LLM (call_llm)
         │       generates: upcoming_services[], full_calendar[],
         │                  harvest_summary, post_harvest_plan, reasoning
         │
         └──► combined JSON + trace
```

---

## Crop Timelines

| Crop | Harvest Days | Yield (tons/acre) | Key Stages |
|---|---|---|---|
| Wheat | 142 | 1.5 | Germination → Tillering → Heading → Grain Filling → Harvest |
| Rice | 135 | 2.0 | Transplanting → Tillering → Panicle Initiation → Harvest |
| Cotton | 170 | 1.2 | Germination → Squaring → Flowering → Boll Development → Harvest |
| Sugarcane | 365 | 40.0 | Planting → First Ratoon → Grand Growth → Maturity |
| Maize | 110 | 2.5 | Germination → Vegetative → Tasseling → Harvest |

---

## LLM Output Schema

```json
{
  "upcoming_services": [
    {
      "service": "Harvester Booking",
      "recommended_by": "YYYY-MM-DD",
      "urgency": "high",
      "reason": "Farmer-language reason",
      "action": "Specific farmer action"
    }
  ],
  "full_calendar": [
    {
      "date": "YYYY-MM-DD",
      "event": "Event name",
      "description": "Description in farmer language"
    }
  ],
  "harvest_summary": "Harvest readiness summary in farmer language",
  "post_harvest_plan": "Post-harvest steps in farmer language",
  "reasoning": "LLM calendar generation logic"
}
```

---

## API Request / Response Schema

### Request — `POST /api/farm/season-plan`

```json
{
  "crop_type": "wheat",
  "planting_date": "2026-01-15",
  "acres": 10,
  "farmer_lat": 30.0449,
  "farmer_lng": 72.3514,
  "language": "roman_urdu"
}
```

### Response

```json
{
  "farm_id": "wheat_2026-01-15",
  "crop_type": "wheat",
  "planting_date": "2026-01-15",
  "current_stage": "Harvest Ready",
  "days_since_planting": 121,
  "days_to_harvest": 21,
  "estimated_harvest_date": "2026-06-06",
  "crop_status": "GROWING",
  "estimated_yield_tons": 15.0,
  "upcoming_services": [...],
  "full_calendar": [...],
  "harvest_summary": "...",
  "post_harvest_plan": "...",
  "trace": { ... }
}
```

---

## READY_SOON Logic

| Condition | crop_status | LLM Behavior |
|---|---|---|
| `days_to_harvest > 14` | `GROWING` | Normal calendar — fertilizer, irrigation, pest check |
| `days_to_harvest <= 14` | `READY_SOON` | Harvester booking → **HIGH urgency #1** |
| `days_to_harvest <= 7` | `READY_SOON` | + Weather check alert added |

---

## Test Cases

### Test 1 — Wheat READY_SOON, Roman Urdu
```json
POST /api/farm/season-plan
{
  "crop_type": "wheat",
  "planting_date": "2026-01-15",
  "acres": 10,
  "farmer_lat": 30.0449,
  "farmer_lng": 72.3514,
  "language": "roman_urdu"
}
```
**Expected:** `crop_status: READY_SOON`, harvester booking `urgency: high`, Roman Urdu calendar

### Test 2 — Cotton Mid Season, English
```json
POST /api/farm/season-plan
{
  "crop_type": "cotton",
  "planting_date": "2026-03-01",
  "acres": 5,
  "farmer_lat": 30.1575,
  "farmer_lng": 71.5249,
  "language": "english"
}
```
**Expected:** `crop_status: GROWING`, upcoming fertilizer/pesticide services, English calendar

### Test 3 — Rice, Urdu Script
```json
POST /api/farm/season-plan
{
  "crop_type": "rice",
  "planting_date": "2026-02-01",
  "acres": 8,
  "farmer_lat": 31.5204,
  "farmer_lng": 74.3587,
  "language": "urdu"
}
```
**Expected:** Full Urdu script calendar with stage-appropriate services

---

## Environment Variables

```
OPENROUTER_API_KEY=...    # required — for LLM calendar generation
```

---

## Standing Rules

1. No if/else calendar reasoning logic — all done by LLM
2. CROP_TIMELINES dict handles unknown crops by defaulting to wheat
3. `timedelta` imported directly from `datetime` — no `__import__` hack
4. All traces → `kisan-ai/kisan-ai-traces/` at repo root
5. Naming: `personA_dayN_descriptive_name.md`
