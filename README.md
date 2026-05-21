# 🌾 Kisan AI — Autonomous Agricultural Intelligence for Pakistani Farmers

> Google Antigravity Hackathon 2026 Submission  
> Trilingual AI system — Roman Urdu · اردو · English

**Live Backend:** https://kisan-ai-backend-669164319923.asia-south1.run.app  
**API Docs:** https://kisan-ai-backend-669164319923.asia-south1.run.app/docs  
**Demo:** Email `demo@kisanai.pk` · Password `kisan2026`

---

## 🎯 Problem Statement

67% of Pakistan's workforce is in agriculture yet farmers have no intelligent guidance for:
- Identifying crop diseases before they spread
- Knowing the best time and place to sell their crop
- Booking equipment and labor at the right time
- Planning their entire farming season proactively
- Getting weather-based farming advice in their own language

**Kisan AI** gives every Pakistani farmer a personal AI agricultural advisor — available 24/7, speaking their language, connected to real market data.

---

## 🏗️ Overall Solution Design

Kisan AI is a **multi-agent autonomous system** with a trilingual mobile frontend. The design follows an agentic workflow pattern:

```
Farmer Message
      ↓
Clarification Agent (intent detection + session memory)
      ↓
Intent Router (chat.py)
      ↓
Specialist Agent (calls real APIs + LLM reasoning)
      ↓
Structured Response with Trace
      ↓
Mobile App (displays result in farmer's language)
```

Each agent follows a strict trace format:
`workplan → tool_call → observation → reasoning → decision → action → outcome`

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                     │
│         (Android APK + Web — Expo)                      │
│                                                         │
│  Chat  Disease  Weather  Mandi  Services  Calendar      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│              FastAPI Backend (Google Cloud Run)         │
│                   asia-south1 region                    │
│                                                         │
│  /api/chat  /api/disease  /api/farm  /api/mandi         │
│  /api/services                                          │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌──────────┐   ┌──────────┐
   │  Groq   │   │OpenRouter│   │  Gemini  │
   │(primary)│   │(fallback)│   │(vision)  │
   └─────────┘   └──────────┘   └──────────┘
        │
        ├── OpenWeatherMap API
        ├── Google Maps Distance Matrix API
        ├── Google Maps Geocoding API
        └── SQLite Session Memory (/tmp)
```

---

## 🤖 Agents Developed

### 1. Clarification Agent
**File:** `agents/clarification_agent.py`

Detects farmer intent from natural language input and collects missing information through conversation.

- **Input:** Farmer message + session history
- **Tool:** Groq LLM (llama-4-scout)
- **Intents detected:** `mandi_query`, `weather_query`, `equipment_needed`, `labor_needed`, `disease_check`, `season_planning`, `general_agriculture`, `greeting`
- **Output:** Intent, extracted fields, clarification question if needed
- **Memory:** SQLite stores crop type, location, acres across conversation turns

### 2. Crop Diagnosis Agent
**File:** `agents/crop_diagnosis_agent.py`

Analyzes crop disease from farmer-uploaded photo using computer vision.

- **Input:** Crop photo (base64) + language
- **Tool 1:** Gemini 2.5 Flash Vision API — identifies disease from image
- **Tool 2:** Groq LLM — generates treatment plan in farmer's language
- **Output:** Disease name, confidence, farmer description, treatment steps, medicines, expert contact
- **Decision:** Routes to treatment LLM only if disease is identified with >50% confidence

### 3. Weather Intelligence Agent
**File:** `agents/weather_agent.py`

Generates farming-specific weather advisory from 5-day forecast data.

- **Input:** GPS coordinates + crop type + language
- **Tool:** OpenWeatherMap 5-day Forecast API
- **LLM:** Groq — interprets weather for farming context
- **Output:** 5-day forecast, urgent alerts, best harvest window, weekly risk level, action for today
- **Decision:** Raises urgent_alert if rain probability >70% in next 48 hours during harvest period

### 4. Equipment Coordinator Agent
**File:** `agents/equipment_agent.py`

Finds and ranks nearby service providers for farm equipment and labor.

- **Input:** Service type + farmer GPS + preferred date + acres
- **Tool:** Google Maps Distance Matrix API — calculates real distances
- **LLM:** Groq — ranks providers and generates booking message
- **Output:** Ranked provider list, top recommendation, coordination plan, backup provider
- **Decision:** Ranks by distance, availability on preferred date, trust score, and rate per acre

### 5. Mandi Price Agent
**File:** `agents/mandi_price_agent.py`

Analyzes Pakistan crop market prices and recommends best selling strategy.

- **Input:** Crop type + farmer GPS + acres + language
- **Tool:** Google Maps Distance Matrix API — calculates distance to each mandi
- **LLM:** Groq — analyzes prices and generates sell timing advice
- **Data:** Real Pakistan mandi prices for wheat, rice, cotton, sugarcane, maize, onion, potato
- **Output:** Best mandi, net revenue after transport, government support price comparison, wait or sell recommendation
- **Decision:** Compares net revenue (price minus transport cost) across all mandis to find true best option

### 6. Season Planner Agent
**File:** `agents/season_planner.py`

Generates complete crop farming calendar from planting date to post-harvest.

- **Input:** Crop type + planting date + acres + GPS + language
- **Tool:** LLM reasoning over crop timeline data
- **Output:** Current growth stage, days to harvest, upcoming services with urgency, full calendar, post-harvest plan
- **Decision:** Marks services as HIGH urgency if recommended date is within 7 days, MEDIUM if within 30 days

---

## 🔌 APIs and Integrations

### Real APIs (Live Data)

| API | Purpose | Endpoint |
|---|---|---|
| **OpenWeatherMap** | 5-day weather forecast | `api.openweathermap.org/data/2.5/forecast` |
| **Google Maps Distance Matrix** | Distance from farmer to mandis/providers | `maps.googleapis.com/maps/api/distancematrix` |
| **Google Maps Geocoding** | Convert city name to GPS coordinates | `maps.googleapis.com/maps/api/geocode` |
| **Gemini 2.5 Flash** | Crop disease photo analysis | `generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash` |
| **Groq API** | Fast LLM inference (primary) | `api.groq.com/openai/v1/chat/completions` |
| **OpenRouter** | LLM fallback | `openrouter.ai/api/v1/chat/completions` |

### Mock/Local Data

| Data | File | Reason |
|---|---|---|
| Pakistan mandi prices | `data/mandi_prices.json` | No free real-time Pakistan mandi API exists |
| Service providers | `data/providers.json` | 15 providers across Punjab cities |
| Agricultural experts | `data/experts.json` | 4 expert contacts |

**Note:** All distances, net revenues, and travel times for mock data are calculated using real Google Maps API — only the base prices and provider details are mock.

---

## 🌐 Trilingual System

Every agent prompt enforces strict language rules:

```python
# Enforced in every agent
if language == "english":   # English only — zero Urdu
if language == "roman_urdu": # Roman Urdu only — zero Urdu script
if language == "urdu":       # Urdu script only — zero Roman letters
```

TTS (Text-to-Speech):
- Urdu → `ur-PK` voice
- Roman Urdu → `ur-PK` voice (Urdu words in Latin script)
- English → `en-US` voice

---

## 📱 Mobile App Screens

| Screen | Backend Endpoint | Real API Used |
|---|---|---|
| Kisan Chat | `POST /api/chat` | Groq LLM |
| Bimari Scanner | `POST /api/disease/analyze` | Gemini Vision |
| Mausam | `GET /api/farm/weather/{lat}/{lng}` | OpenWeatherMap |
| Mandi Bhav | `GET /api/mandi/prices/{crop}` | Google Maps |
| Khadmaat | `POST /api/services/find` | Google Maps |
| AI Calendar | `POST /api/farm/season-plan` | Groq LLM |
| Meri Zameen | `POST /api/farm/save` | Google Geocoding |

---

## 🚀 Deployment

```
Platform:     Google Cloud Run
Region:       asia-south1 (Pakistan-closest)
Min instances: 1 (always warm — no cold start)
Max instances: 3
Memory:       512MB per instance
```

---

## 📂 Repository Structure

```
kisan-ai/
├── kisan-ai-backend/        # Python FastAPI backend
│   ├── agents/              # 6 autonomous agents
│   ├── routers/             # API endpoints
│   ├── utils/               # LLM client + vision client
│   ├── services/            # SQLite session memory
│   └── data/                # Mock data (prices, providers)
├── kisan-ai-mobile/         # React Native Expo frontend
│   └── src/
│       ├── screens/         # 8 app screens
│       ├── components/      # Reusable UI components
│       ├── context/         # Auth + Language context
│       ├── constants/       # Colors + translations
│       └── services/        # Centralized API client
└── kisan-ai-traces/         # Antigravity mission artifacts
    └── THE_BRAIN.md         # Agent decision summaries
```

---

## 👥 Team

| Member | Role |
|---|---|
| Person A (Rao Hamza Bilal) | Backend, all 6 agents, Cloud Run, LLM integration |
| Person B (Hasnain Shareef) | Frontend, all screens, language system, UX/UI |
