# SQLite Session Memory Migration

## Objective
Replace the in-memory/JSON-file `SESSION_STORE` with a robust SQLite-backed session database to properly maintain conversation state across requests in the Kisan AI backend.

## Implementation Details

### 1. Database Service (`services/database.py`)
- Created a new SQLite integration using `/tmp/kisan_ai.db`.
- Designed the `chat_sessions` schema to persist:
  - `session_id`, `language`
  - Extracted fields: `crop_type`, `acres`, `location`, `lat`, `lng`, `planting_date`
  - JSON arrays: `intent_history` and full `messages` history
- Implemented `get_session`, `save_session`, `append_messages`, and `get_recent_messages` helper functions.

### 2. Application Startup (`main.py`)
- Removed the old volatile JSON `SESSION_FILE` and global `_session_lock` logic.
- Registered an `@app.on_event("startup")` hook to safely initialize the SQLite schema when the FastAPI application starts up.

### 3. Agent Integration (`agents/clarification_agent.py`)
- Transitioned the `run_clarification_agent` to seamlessly load state via `get_session` and `get_recent_messages`.
- Updated the LLM prompt to actively provide up to the last 10 messages from the database as `CONVERSATION HISTORY`.
- Modified post-processing to explicitly merge previously known fields from the database and properly save the new conversation turn back using `save_session`.

### 4. Router Simplification (`routers/chat.py` & `models/schemas.py`)
- Cleaned up the `ChatRequest` schema, removing overly complex default factories.
- Stripped all manual session lookup logic from the `/api/chat` route since it is now natively handled inside the clarification agent.

## Verification
A multi-turn conversation sequence was tested against the `/api/chat` endpoint using the `sqlite_test_1` session ID. The backend successfully retrieved and retained variables:
- Turn 1 (`Gandam ka rate kya hy`): `crop_type` was extracted and saved.
- Turn 2 (`Multan`): SQLite restored `crop_type: gandum` and persisted `location: Multan`.
- Turn 3 (`5 acre`): All accumulated context was recalled correctly, preventing duplicate LLM requests.

SQLite integration is fully functional and ready for production.
