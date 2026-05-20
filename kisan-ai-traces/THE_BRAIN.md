# THE_BRAIN.md — Antigravity Trace Summary (Kisan AI)

Kisan AI is a trilingual autonomous multi-agent agricultural intelligence
system for Pakistani farmers. Built using Google Antigravity IDE over 5 days.

## Agent Architecture

6 autonomous agents built and deployed on Google Cloud Run:
1. Clarification Agent — intent detection and session memory
2. Crop Diagnosis Agent — Gemini Vision + LLM treatment plan
3. Weather Intelligence Agent — OpenWeatherMap + farming advisory
4. Equipment Coordinator Agent — Google Maps + provider ranking
5. Mandi Price Agent — real Pakistan market prices + sell timing
6. Season Planner Agent — full crop calendar from planting to harvest

---

## Traces

- day2_folder_rename.md — Renamed project folders and set up monorepo structure for kisan-ai-backend and kisan-ai-mobile
- day2_interpreter_guide.md — Configured Antigravity interpreter with Python FastAPI environment and dependencies
- personA_day2_clarification_agent.md — Built clarification agent with intent detection for 7 intents, SQLite session memory, and trilingual support
- personA_day2_fastapi_setup.md — Set up FastAPI backend with CORS, router structure, health endpoint, and Cloud Run deployment
- personA_day3_disease_agent.md — Built crop disease agent using Gemini 2.5 Flash vision for photo analysis and OpenRouter LLM for treatment plan generation
- personA_day3_weather_agent.md — Built weather intelligence agent using OpenWeatherMap 5-day forecast with farming-specific advisory generation
- personA_day4_equipment_agent.md — Built equipment coordinator agent using Google Maps Distance Matrix to rank nearby providers by distance, trust score, and availability
- personA_day4_mandi_agent.md — Built mandi price agent with real Pakistan market data, Google Maps distance calculation, government support price comparison, and AI sell timing advice
- personA_day4_season_planner.md — Built season planner agent generating complete crop calendar from planting date to post-harvest with urgency-ranked upcoming services
- personA_day5_cors_fix.md — Fixed CORS allow_credentials conflict that was causing frontend timeout errors on all API calls
- personA_day5_general_agriculture.md — Added general_agriculture and greeting intents to chat router so farmers can ask any farming question directly
- personA_day5_language_enforcement.md — Enforced strict language rules across all agent prompts to ensure responses match farmer's selected language
- personA_day5_more_providers.md — Added 8 more mock service providers to providers.json covering all 6 service types across major Punjab cities
- personA_day5_remove_gemini_text.md — Removed Gemini from text LLM chain, kept only for vision. Groq as primary, OpenRouter as fallback for all text tasks
- personA_day5_session_fix_v3.md — Fixed SQLite cold start issue by setting Cloud Run minimum instances to 1 to keep container always warm
- personA_day5_sqlite_memory.md — Implemented SQLite session memory in /tmp for storing farmer context across multi-turn conversations
- personB_day5_chat_modal_redesign.md — Redesigned message delete modal to match app maroon/gold theme, moved clear chat to header
- personB_day5_complete_language_fix.md — Updated all screen translations for Roman Urdu, Urdu, and English including feature cards, navigation labels, and crop names
- personB_day5_language_fix_v2.md — Fixed remaining language mixing issues in weather day names, mandi labels, and services screen
- personB_day5_messagebubble_fix.md — Fixed navigate_to buttons in chat to work correctly and show labels in farmer's selected language
- personB_day5_persistent_chat.md — Added AsyncStorage-based persistent chat history with long-press delete and header clear button
- personB_day5_season_crash_fix.md — Fixed SeasonScreen crash caused by undefined fields using null safety checks on all array mappings
- personB_day5_season_design_fix.md — Improved season planner service cards with emoji icons, urgency badges, and navigation buttons
- personB_day5_season_input_fix.md — Replaced read-only crop and acres fields with interactive chip selector and +/- counter
- personB_day5_season_layout_fix.md — Fixed acres input layout with correct flex sizing between minus and plus buttons
- personB_day5_season_planner.md — Built complete SeasonScreen with AI plan generation, crop timeline, upcoming services, and full calendar display
- personB_day5_timeout_fix.md — Increased all API timeouts to 90 seconds and added retry interceptor for timeout and 429 errors
- personB_day5_weather_gps_fix.md — Updated WeatherScreen to always use device GPS location for accurate local weather

---

## Key Agentic Decisions Made by AI

1. **Clarification Agent** detects that "gandam ka rate batao" is a mandi_query, extracts crop=wheat and asks for location before calling mandi agent
2. **Weather Agent** detects harvest is in 18 days and raises urgent_alert about incoming rain that could damage the crop
3. **Equipment Agent** ranks Vehari Labor Team as top provider because it is closest and available on the farmer's preferred date
4. **Mandi Agent** recommends selling now at Multan Grain Market because price is rising and net revenue after transport is highest
5. **Season Planner** marks harvester booking as HIGH urgency because only 15 days remain before estimated harvest date

---

## Failure Recoveries

1. Groq model IDs were wrong (llama-4-scout, gpt-oss-120b returning 404) — corrected to exact Groq API model strings from console
2. CORS allow_credentials=True with allow_origins=* caused all frontend requests to timeout — fixed by setting allow_credentials=False
3. Mandi agent crashed on "gandam" because crop normalization was missing — added CROP_NAME_MAP to normalize Urdu/Roman Urdu crop names to English keys
4. Season planner timed out at 60 seconds — fixed by switching to Groq as primary LLM reducing response time from 60s to 5s
5. Disease screen showed English technical description instead of farmer language — fixed by prioritizing farmer_description field over description

---

## LLM Provider Chain

Primary: Groq (llama-4-scout → gpt-oss-20b → llama-3.3-70b) — fastest
Fallback: OpenRouter (auto) — backup when Groq rate limited
Vision only: Gemini 2.5 Flash — crop disease photo analysis

---

## Deployment

Backend: Google Cloud Run asia-south1
URL: https://kisan-ai-backend-669164319923.asia-south1.run.app
Min instances: 1 (always warm, no cold start)
Frontend: React Native Expo (web + Android APK)