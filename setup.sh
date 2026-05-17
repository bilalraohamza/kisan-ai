#!/bin/bash

echo "Setting up Kisan AI project structure..."

# ─── BACKEND ───────────────────────────────────────────────
mkdir -p kisan-ai-backend/agents
mkdir -p kisan-ai-backend/routers
mkdir -p kisan-ai-backend/models
mkdir -p kisan-ai-backend/data
mkdir -p kisan-ai-backend/karigar-traces

# ─── MOBILE (Person B) ─────────────────────────────────────
mkdir -p kisan-ai-mobile

# ─── AGENTS ────────────────────────────────────────────────
touch kisan-ai-backend/agents/__init__.py
touch kisan-ai-backend/agents/clarification_agent.py
touch kisan-ai-backend/agents/crop_diagnosis_agent.py
touch kisan-ai-backend/agents/treatment_recommender.py
touch kisan-ai-backend/agents/expert_connector.py
touch kisan-ai-backend/agents/weather_agent.py
touch kisan-ai-backend/agents/equipment_agent.py
touch kisan-ai-backend/agents/labor_agent.py
touch kisan-ai-backend/agents/mandi_price_agent.py
touch kisan-ai-backend/agents/storage_transport_agent.py
touch kisan-ai-backend/agents/season_planner.py

# ─── ROUTERS ───────────────────────────────────────────────
touch kisan-ai-backend/routers/__init__.py
touch kisan-ai-backend/routers/chat.py
touch kisan-ai-backend/routers/disease.py
touch kisan-ai-backend/routers/services.py
touch kisan-ai-backend/routers/mandi.py
touch kisan-ai-backend/routers/farm.py

# ─── MODELS ────────────────────────────────────────────────
touch kisan-ai-backend/models/__init__.py
touch kisan-ai-backend/models/schemas.py

# ─── DATA FILES ────────────────────────────────────────────
echo '[]' > kisan-ai-backend/data/providers.json
echo '[]' > kisan-ai-backend/data/diseases.json
echo '[]' > kisan-ai-backend/data/experts.json
echo '[]' > kisan-ai-backend/data/farmers.json

# ─── MAIN ENTRY ────────────────────────────────────────────
touch kisan-ai-backend/main.py
touch kisan-ai-backend/.env

# ─── BACKEND .gitignore ────────────────────────────────────
cat > kisan-ai-backend/.gitignore << 'EOF'
venv/
__pycache__/
*.pyc
.env
credentials.json
*.egg-info/
.DS_Store
EOF

# ─── karigar-traces README (Antigravity log record) ────────
cat > kisan-ai-backend/karigar-traces/README.md << 'EOF'
# karigar-traces — Antigravity Mission Logs

This folder stores every Artifact screenshot exported from Google Antigravity.
One screenshot per mission. These are mandatory for hackathon submission.

## Naming Convention

| File | Day | What it captures |
|------|-----|-----------------|
| day2_fastapi_setup.png | Day 2 | FastAPI project scaffold |
| day2_clarification_agent.png | Day 2 | Clarification agent build |
| day3_disease_data.png | Day 3 | diseases.json + experts.json data |
| day3_disease_agent.png | Day 3 | Crop diagnosis agent |
| day3_weather_agent.png | Day 3 | Weather agent |
| day4_providers_data.png | Day 4 | providers.json data |
| day4_equipment_labor_agents.png | Day 4 | Equipment + labor agents |
| day4_mandi_agent.png | Day 4 | Mandi price agent |
| day4_season_planner.png | Day 4 | Season planner agent |
| day5_readme.png | Day 5 | README.md mission |

## Rules

1. Export the Artifact screenshot immediately after each mission completes.
2. Do NOT rename files — Day 5 submission checklist references exact filenames.
3. If a mission failed and you corrected it, save an extra file:
   e.g. `day3_disease_agent_fix1.png` — these corrections are valuable to show.
4. THE_BRAIN.md (created on Day 5) will summarize every file in this folder.
EOF

# ─── karigar-traces THE_BRAIN placeholder ──────────────────
cat > kisan-ai-backend/karigar-traces/THE_BRAIN.md << 'EOF'
# THE_BRAIN.md — Antigravity Trace Summary

Fill this in on Day 5 (Task 5.A.3).

For each trace file, write one sentence about what decision was made.
Flag any failure recovery traces — these are especially valuable for judges.

## Traces

- day2_fastapi_setup.png —
- day2_clarification_agent.png —
- day3_disease_data.png —
- day3_disease_agent.png —
- day3_weather_agent.png —
- day4_providers_data.png —
- day4_equipment_labor_agents.png —
- day4_mandi_agent.png —
- day4_season_planner.png —
- day5_readme.png —

## Failure Recoveries

(List any missions where you had to correct Antigravity via comment)
EOF

# ─── Person B placeholder ──────────────────────────────────
cat > kisan-ai-mobile/README.md << 'EOF'
# kisan-ai-mobile

Person B works in this folder.
Flutter app — all screens, voice TTS, app design.

Backend base URL will be provided by Person A once deployed on Railway.
EOF

echo ""
echo "Done. Full structure created."
echo "Next: cd kisan-ai-backend && python -m venv venv"