# Day 2 — FastAPI Backend Scaffold

**Project:** Kisan AI  
**Branch:** `backend`  
**Date:** 2026-05-16  
**Author:** Antigravity (AI Pair Programmer)

---

## Objective

Bootstrap the FastAPI application entry point for the Kisan AI backend, register all domain routers, configure CORS, and add core platform endpoints — without touching any business logic yet.

---

## Files Created / Modified

| File | Action | Purpose |
|---|---|---|
| `kisan-ai-backend/main.py` | ✅ Written | FastAPI app factory + router registration |
| `kisan-ai-backend/routers/chat.py` | ✅ Written | Chat domain placeholder |
| `kisan-ai-backend/routers/disease.py` | ✅ Written | Disease detection placeholder |
| `kisan-ai-backend/routers/services.py` | ✅ Written | Agri-services placeholder |
| `kisan-ai-backend/routers/mandi.py` | ✅ Written | Mandi price placeholder |
| `kisan-ai-backend/routers/farm.py` | ✅ Written | Farm management placeholder |

---

## App Configuration

```python
app = FastAPI(
    title="Kisan AI Backend",
    version="1.0.0",
    description="Autonomous agricultural intelligence for Pakistani farmers",
)
```

---

## CORS Policy

All origins, methods, and headers are allowed for development flexibility.  
**Note:** Restrict `allow_origins` to the deployed frontend domain before production.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Router Map

| Router | Prefix | Tag |
|---|---|---|
| `chat.router` | `/api/chat` | Chat |
| `disease.router` | `/api/disease` | Disease |
| `services.router` | `/api/services` | Services |
| `mandi.router` | `/api/mandi` | Mandi |
| `farm.router` | `/api/farm` | Farm |

---

## Core Endpoints

### `GET /`
```json
{ "message": "Kisan AI Backend is running" }
```

### `GET /health`
```json
{
  "status": "ok",
  "project": "Kisan AI",
  "version": "1.0.0"
}
```

---

## Placeholder Router Pattern

Every router follows this minimal stub so the app starts without errors:

```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/", summary="<Module> status")
async def <module>_status():
    return {"status": "coming soon"}
```

---

## How to Run

```bash
cd kisan-ai-backend
uvicorn main:app --reload --port 8000
```

Interactive docs available at: `http://localhost:8000/docs`

---

## Next Steps (Day 3+)

- [ ] Implement `routers/chat.py` — Gemini-powered farmer Q&A
- [ ] Implement `routers/disease.py` — image upload + crop diagnosis agent
- [ ] Implement `routers/mandi.py` — live mandi price scraper / mock data
- [ ] Implement `routers/farm.py` — farm profile CRUD
- [ ] Implement `routers/services.py` — agri-service directory
- [ ] Add Pydantic request/response models under `models/`
- [ ] Wire in `agents/crop_diagnosis_agent.py`
- [ ] Add `.env`-driven API key loading via `python-dotenv`
