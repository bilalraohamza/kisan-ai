# personA — Day 3 — Weather Intelligence Agent

**Project:** Kisan AI  
**Branch:** `backend`  
**Date:** 2026-05-17  
**Engineer:** Person A (Backend)  
**AI:** Antigravity

---

## Mission

Build a weather intelligence pipeline that:
1. Calls OpenWeatherMap API for real 5-day forecast at any GPS coordinate
2. Sends forecast data to OpenRouter LLM for farming context interpretation
3. Returns harvest window recommendations, urgency rain alerts, and daily advisories
4. Responds in the farmer's chosen language (Roman Urdu / Urdu / English)

---

## Files Created / Modified

| File | Action | Purpose |
|---|---|---|
| `agents/weather_agent.py` | ✅ Created | Full weather intelligence pipeline |
| `routers/farm.py` | ✅ Updated | `GET /api/farm/weather/{lat}/{lng}` |

---

## Architecture

```
GET /api/farm/weather/{lat}/{lng}?language=roman_urdu&crop_type=wheat&days_to_harvest=18
         │
         ▼
  farm.py router
         │
         ▼
  weather_agent.py
         │
         ├──► OpenWeatherMap API (data/2.5/forecast)
         │         returns: 40 × 3-hour slots over 5 days
         │         grouped into clean 5-day daily summary
         │
         ├──► OpenRouter LLM (call_llm)
         │         returns: farming advisories per day,
         │                  harvest window, urgency alert,
         │                  weekly_risk, action_today
         │
         └──► combined JSON + trace
```

---

## API Endpoint

```
GET /api/farm/weather/{lat}/{lng}

Query params:
  language        roman_urdu | urdu | english  (default: roman_urdu)
  crop_type       wheat, cotton, rice, etc.     (optional)
  days_to_harvest integer                        (optional — enables urgency alert)
```

---

## LLM Output Schema

```json
{
  "forecast_5_day": [
    {
      "date": "2026-05-17",
      "condition": "light rain",
      "rain_probability": 72,
      "temp_max": 38,
      "temp_min": 28,
      "farming_advisory": "Kal barish ka imkan hai. Harvester ko rokain."
    }
  ],
  "urgent_alert": "Agli 48 ghanton mein tez barish expected hai...",
  "best_harvest_window": "2026-05-19 to 2026-05-20",
  "weekly_risk": "high",
  "action_today": "Aaj hi katai shuru karein",
  "reasoning": "..."
}
```

---

## Test Cases

### Test 1 — Multan (Roman Urdu)
```
GET /api/farm/weather/30.1575/71.5249
```
**Expected:** 5-day forecast with Roman Urdu farming advisories

### Test 2 — Multan wheat, harvest in 18 days (Urdu)
```
GET /api/farm/weather/30.1575/71.5249?language=urdu&crop_type=wheat&days_to_harvest=18
```
**Expected:** Urdu script reply, urgency alert if rain in next 48h

### Test 3 — Lahore (English)
```
GET /api/farm/weather/31.5204/74.3587?language=english
```
**Expected:** English farming advisories

---

## Environment Variables Required

```
# kisan-ai-backend/.env
OPENWEATHER_API_KEY=...   # from openweathermap.org (free tier: 1000 calls/day)
OPENROUTER_API_KEY=...    # for LLM farming interpretation
```

---

## Rate Limits

| Service | Free Tier |
|---|---|
| OpenWeatherMap `/forecast` | 1000 calls/day, 60/min |
| OpenRouter (via llm_client) | Varies by model — auto-fallback across 4 models |

---

## Standing Rules (Reinforced)

1. `weather_agent.py` uses `llm_client.py` for all text reasoning — no if/else
2. All traces → `kisan-ai/kisan-ai-traces/` at repo root
3. Naming: `personA_dayN_descriptive_name.md`
