import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
import json

BASE = "http://127.0.0.1:8000/api/farm/season-plan"

# ── TEST 1 ── Wheat, Roman Urdu
print("\n" + "="*60)
print("TEST 1 — Wheat (Roman Urdu) — expect READY_SOON")
print("="*60)
r = requests.post(BASE, json={
    "crop_type": "wheat",
    "planting_date": "2026-01-15",
    "acres": 10,
    "farmer_lat": 30.0449,
    "farmer_lng": 72.3514,
    "language": "roman_urdu"
})
d = r.json()
print(f"  crop_status      : {d['crop_status']}")
print(f"  current_stage    : {d['current_stage']}")
print(f"  days_to_harvest  : {d['days_to_harvest']}")
print(f"  est_harvest_date : {d['estimated_harvest_date']}")
print(f"  est_yield_tons   : {d['estimated_yield_tons']}")
print(f"  upcoming_services: {len(d['upcoming_services'])} items")
if d['upcoming_services']:
    s = d['upcoming_services'][0]
    print(f"    #1: {s['service']} | urgency={s['urgency']} | by={s['recommended_by']}")
print(f"  full_calendar    : {len(d['full_calendar'])} events")
print(f"  harvest_summary  : {str(d.get('harvest_summary',''))[:120]}")

# ── TEST 2 ── Cotton, English
print("\n" + "="*60)
print("TEST 2 — Cotton mid-season (English) — expect GROWING")
print("="*60)
r = requests.post(BASE, json={
    "crop_type": "cotton",
    "planting_date": "2026-03-01",
    "acres": 5,
    "farmer_lat": 30.1575,
    "farmer_lng": 71.5249,
    "language": "english"
})
d = r.json()
print(f"  crop_status      : {d['crop_status']}")
print(f"  current_stage    : {d['current_stage']}")
print(f"  days_to_harvest  : {d['days_to_harvest']}")
print(f"  upcoming_services: {len(d['upcoming_services'])} items")
for s in d['upcoming_services'][:3]:
    print(f"    - {s['service']} | urgency={s['urgency']}")
print(f"  post_harvest_plan: {str(d.get('post_harvest_plan',''))[:120]}")

# ── TEST 3 ── Rice, Urdu
print("\n" + "="*60)
print("TEST 3 — Rice (Urdu script) — expect full Urdu calendar")
print("="*60)
r = requests.post(BASE, json={
    "crop_type": "rice",
    "planting_date": "2026-02-01",
    "acres": 8,
    "farmer_lat": 31.5204,
    "farmer_lng": 74.3587,
    "language": "urdu"
})
d = r.json()
print(f"  crop_status      : {d['crop_status']}")
print(f"  current_stage    : {d['current_stage']}")
print(f"  days_to_harvest  : {d['days_to_harvest']}")
print(f"  upcoming_services: {len(d['upcoming_services'])} items")
print(f"  harvest_summary  : {str(d.get('harvest_summary',''))[:150]}")
print(f"  full_calendar    : {len(d['full_calendar'])} events")

print("\n✅ All 3 tests complete.")
