# personA — Day 4 — Mandi Price Agent

**Project:** Kisan AI  
**Branch:** `backend`  
**Date:** 2026-05-17  
**Engineer:** Person A (Backend)  
**AI:** Antigravity

---

## Mission

Build a Mandi Price Intelligence Agent that:
1. Loads real mandi prices for any supported crop from `mandi_prices.json`
2. Fetches road distances to each mandi (Google Maps → Haversine fallback)
3. Calculates net revenue = gross revenue − transport cost per mandi
4. Sends enriched data to OpenRouter LLM for trend interpretation and sell timing advice
5. Returns ranked mandis + sell timing decision in farmer's language

---

## Files Created / Modified

| File | Action | Purpose |
|---|---|---|
| `data/mandi_prices.json` | ✅ Created | Mock prices for 7 crops, 20+ mandis |
| `agents/mandi_price_agent.py` | ✅ Created | Full 9-step price intelligence pipeline |
| `routers/mandi.py` | ✅ Updated | `GET /api/mandi/prices/{crop_type}` |

---

## Architecture

```
GET /api/mandi/prices/{crop_type}?farmer_lat=&farmer_lng=&acres=&language=
         │
         ▼
  mandi.py router
         │
         ▼
  mandi_price_agent.py
         │
         ├──► mandi_prices.json  (crop-specific mandi list)
         │
         ├──► Google Distance Matrix API
         │       └── Haversine fallback if Google Maps unavailable
         │
         ├──► Net Revenue Calculation per mandi:
         │       estimated_yield_tons = acres × 1.5
         │       transport_cost = distance_km × PKR 15/km/ton × yield_tons
         │       gross_revenue = (price_per_40kg ÷ 40) × yield_kg
         │       net_revenue = gross_revenue − transport_cost
         │
         ├──► Sort mandis by net_revenue DESC → best_mandi[0]
         │
         ├──► OpenRouter LLM (call_llm)
         │       trend analysis, sell timing, market vs govt price comparison
         │
         └──► combined JSON + trace
```

---

## Crops Supported

| Crop | Govt Support Price (per 40kg) | Mandis |
|---|---|---|
| wheat | ₨3,900 | 5 (Multan, Lahore, Faisalabad, Vehari, Bahawalpur) |
| rice | ₨4,000 | 3 (Sheikhupura, Gujranwala, Lahore) |
| cotton | ₨8,500 | 3 (Multan, Bahawalpur, Rahim Yar Khan) |
| sugarcane | ₨450 | 2 (Faisalabad, Lahore) |
| maize | ₨2,000 | 2 (Sahiwal, Multan) |
| onion | ₨1,200 | 2 (Karachi, Lahore) |
| potato | ₨1,500 | 2 (Okara, Lahore) |

---

## Net Revenue Calculation (validated)

**Scenario:** 10 acres wheat, farmer in Vehari → Multan Grain Market  
- Yield: 10 × 1.5 = 15 tons  
- Gross: (4100 ÷ 40) × 15,000 kg = PKR 1,537,500  
- Transport: 80.5 km × PKR 15/km/ton × 15 tons = PKR 18,113  
- **Net: PKR 1,519,387** ✅

---

## LLM Output Schema

```json
{
  "overall_trend": "rising",
  "sell_timing_advice": "Abhi bechna faida mand hai...",
  "best_mandi_reason": "Multan mein transport cost kam hai...",
  "market_vs_support": "Market price PKR 200 zyada hai...",
  "urgent_alert": null,
  "wait_or_sell": "sell_now",
  "potential_extra_earning": "PKR 30,000 zyada milenge...",
  "reasoning": "..."
}
```

---

## Test Cases

### Test 1 — Wheat, Roman Urdu, Vehari
```
GET /api/mandi/prices/wheat?farmer_lat=30.0449&farmer_lng=72.3514&acres=10&language=roman_urdu
```
**Expected:** Multan Grain Market ranked #1 (highest net revenue), Roman Urdu advice

### Test 2 — Cotton, English, Multan
```
GET /api/mandi/prices/cotton?farmer_lat=30.1575&farmer_lng=71.5249&acres=5&language=english
```
**Expected:** Multan Cotton Exchange ranked #1 (local + high price), English advice

### Test 3 — Rice, Urdu, Lahore
```
GET /api/mandi/prices/rice?farmer_lat=31.5204&farmer_lng=74.3587&acres=8&language=urdu
```
**Expected:** Lahore Rice Market ranked #1 (zero transport), full Urdu script

---

## Standing Rules

1. No if/else ranking — net revenue sorted mathematically, LLM interprets meaning
2. Google Maps → Haversine fallback is automatic and silent
3. All traces → `kisan-ai/kisan-ai-traces/` at repo root
4. Naming: `personA_dayN_descriptive_name.md`
