# personA — Day 4 — Equipment Coordinator Agent

**Project:** Kisan AI  
**Branch:** `backend`  
**Date:** 2026-05-17  
**Engineer:** Person A (Backend)  
**AI:** Antigravity

---

## Mission

Build an Equipment Coordinator Agent that:
1. Loads agricultural service providers filtered by type (harvester/tractor/labor/storage/transport)
2. Fetches real road distances via Google Distance Matrix API (Haversine fallback if unavailable)
3. Sends enriched provider list to OpenRouter LLM for intelligent ranking
4. Returns ranked providers with booking message and step-by-step coordination plan

---

## Files Created / Modified

| File | Action | Purpose |
|---|---|---|
| `data/providers.json` | ✅ Populated | 7 mock providers across 5 service types |
| `agents/equipment_agent.py` | ✅ Created | Full 8-step coordinator pipeline |
| `routers/services.py` | ✅ Updated | `POST /api/services/find` |

---

## Architecture

```
POST /api/services/find
         │
         ▼
  services.py router
         │
         ▼
  equipment_agent.py
         │
         ├──► providers.json  (filter by service_type)
         │
         ├──► Google Distance Matrix API
         │       └── Haversine fallback if Google Maps key missing
         │
         ├──► Enrich each provider with:
         │       distance_km, duration_minutes,
         │       total_cost_pkr, available_on_preferred_date
         │
         ├──► OpenRouter LLM (call_llm)
         │       ranks by: availability → distance → trust → rate
         │       generates: ranking_reason, booking_message,
         │                  coordination_plan, backup_provider
         │
         └──► combined JSON + trace
```

---

## Providers Mock Data

| ID | Name | Type | Area | Rate/Acre | Trust |
|---|---|---|---|---|---|
| prov001 | Ahmad Machinery | harvester | Multan | ₨3,500 | 4.8 |
| prov002 | Khan Harvesters | harvester | Vehari | ₨3,200 | 4.5 |
| prov003 | Malik Tractor Service | tractor | Lahore | ₨1,800 | 4.6 |
| prov004 | Faisalabad Combine Works | harvester | Faisalabad | ₨3,800 | 4.7 |
| prov005 | Bahawalpur Labor Group | labor | Bahawalpur | ₨2,500 | 4.4 |
| prov006 | Sahiwal Storage Facility | storage | Sahiwal | ₨800 | 4.3 |
| prov007 | Punjab Transport Co | transport | Lahore | ₨1,200 | 4.5 |

---

## LLM Output Schema

```json
{
  "ranked_providers": [
    {
      "rank": 1,
      "id": "prov002",
      "name": "Khan Harvesters",
      "distance_km": 0.0,
      "rate_pkr_per_acre": 3200,
      "total_cost_pkr": 32000,
      "trust_score": 4.5,
      "phone": "0301-4445566",
      "area": "Vehari",
      "available_on_preferred_date": true,
      "ranking_reason": "..."
    }
  ],
  "top_recommendation": "...",
  "booking_message": "...",
  "backup_provider": "Ahmad Machinery — 0300-1112233",
  "total_cost_pkr": 32000,
  "coordination_plan": "...",
  "reasoning": "..."
}
```

---

## Distance Strategy

| Scenario | Method |
|---|---|
| `GOOGLE_MAPS_API_KEY` set | Google Distance Matrix (real road distance + duration) |
| Key missing / API error | Haversine great-circle fallback (straight-line km) |

**Haversine validation:** Multan → Vehari = 80.5 km ✅ (expected ~85 km by road)

---

## Test Cases

### Test 1 — Harvester, Roman Urdu
```json
POST /api/services/find
{
  "service_type": "harvester",
  "location": {"lat": 30.0449, "lng": 72.3514},
  "crop_type": "wheat",
  "acres": 10,
  "preferred_date": "2026-05-20",
  "session_id": "test_equip_1",
  "language": "roman_urdu"
}
```
**Expected:** prov002 (Khan Harvesters) ranked #1 (local, available 20th), Roman Urdu plan

### Test 2 — Tractor, English
```json
POST /api/services/find
{
  "service_type": "tractor",
  "location": {"lat": 31.5204, "lng": 74.3587},
  "crop_type": "cotton",
  "acres": 5,
  "preferred_date": "2026-05-19",
  "session_id": "test_equip_2",
  "language": "english"
}
```
**Expected:** prov003 (Malik Tractor Service, Lahore) ranked #1 (local, available 19th), English plan

---

## Environment Variables

```
GOOGLE_MAPS_API_KEY=...   # optional — Haversine fallback used if missing
OPENROUTER_API_KEY=...    # required — for LLM ranking
```

---

## Standing Rules

1. No if/else ranking logic — all reasoning done by LLM
2. Google Maps → Haversine fallback is automatic and silent
3. All traces → `kisan-ai/kisan-ai-traces/` at repo root
4. Naming: `personA_dayN_descriptive_name.md`
