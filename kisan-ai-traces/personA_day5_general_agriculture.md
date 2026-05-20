# Trace: Handling General Agriculture, Greeting, and Unknown Intents in Chat

**Files Modified**: 
- `kisan-ai-backend/agents/clarification_agent.py`
- `kisan-ai-backend/routers/chat.py`

**Date**: Day 5
**Developer**: Person A

## Objective
Enhance Kisan Chat to act as a fully capable general agricultural assistant rather than failing when questions fall outside the narrow pre-defined specialist intents (weather, mandi, services, season).

## Changes Made

### 1. Updated Clarification Agent (`clarification_agent.py`)
- Added `general_agriculture` and `greeting` to the master intent list so Gemini can properly classify open-ended farming questions.
- Created explicit rules for `general_agriculture`:
  - Classifies any general questions about farming techniques, pests, crop care, fertilizers, soil, etc.
  - Skips clarification questions completely (no need for acres, location, etc. unless given).
  - Enforces `needs_clarification: false` immediately, bypassing the question loop and sending the intent straight to the routing layer.

### 2. Upgraded Routing Layer (`routers/chat.py`)
- **`general_agriculture` Handler**: Added a direct LLM call pipeline for `general_agriculture`. It uses a new structured prompt instructing the AI to provide a comprehensive, practical, and localized response for Pakistani farmers with proper multilingual (Urdu, Roman Urdu, English) constraints.
- **`greeting` Handler**: Added a localized, time-aware greeting generator that responds with an initial friendly message and a context-aware tip for the season.
- **`else` (Unknown) Handler**: Overhauled the final fallback block. Instead of returning a generic unknown error, it now passes the query through the LLM one last time to either answer the question if it's implicitly related to agriculture, or ask a clarifying question about how it can help with farming.
