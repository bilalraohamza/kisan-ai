# Trace: Groq Integration

**File Modified**: `kisan-ai-backend/utils/llm_client.py`
**Date**: Day 5
**Developer**: Person A

## Objective
Integrate Groq API as the primary, fastest LLM provider for `call_llm` requests, improving the overall backend response times.

## Changes Made
- Added `call_groq` function that mimics the OpenAI-compatible REST API format used by OpenRouter.
- Configured it to use `GROQ_API_KEY` from environment variables.
- Set Groq model fallback priority: `gpt-oss-120b`, `llama-3.3-70b-versatile`, `llama-4-scout`.
- Updated `call_llm` priority order to:
  1. **Groq** (15s timeout)
  2. **Gemini 2.5 Flash** (25s timeout)
  3. **OpenRouter** (40s timeout)
