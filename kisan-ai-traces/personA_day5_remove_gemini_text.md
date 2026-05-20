# Trace: Remove Gemini from Text Tasks

**File Modified**: `kisan-ai-backend/utils/llm_client.py`
**Date**: Day 5
**Developer**: Person A

## Objective
Remove Gemini from the text LLM pipeline due to latency issues. Restrict Gemini usage exclusively to image-related tasks (e.g., crop disease analysis in `vision_client.py`). 

## Changes Made
- Removed the `GEMINI_MODELS` list from `llm_client.py`.
- Removed the `call_gemini_direct` function completely from `llm_client.py`.
- Updated the `call_llm` execution block to rely strictly on Groq as the primary fast provider, followed immediately by OpenRouter as the secondary fallback.
- The `GEMINI_API_KEY` environment variable remains active but is now accessed solely by `vision_client.py`.
