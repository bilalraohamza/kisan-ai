# personA_day5_language_enforcement

**Mission:** Fix language enforcement in ALL agent files in kisan-ai-backend/agents/

**Date:** 2026-05-19  
**Status:** ✅ COMPLETE

---

## Problem

Every agent receives a `language` parameter but the LLM ignored it
and responded in Roman Urdu regardless of what language was selected.

**Root cause:** The old language instructions were weak one-liners like:
```python
lang_instruction = language_instructions.get(language, ...)
# → "Write ALL farmer-facing text in Roman Urdu only. NEVER use Urdu script."
```
This single sentence is insufficient for LLMs to reliably follow — especially
when the surrounding data (crop names, mandi names, etc.) is in a mixed language.

---

## Solution Applied

Replaced ALL weak language instructions with a unified **ABSOLUTE LANGUAGE RULE** block
that includes:
1. **Named condition branches** (`IF language == "english"`)
2. **Concrete Good/Bad examples** for each language
3. **Explicit field list** so the model knows exactly which fields are covered
4. **Embedded directly in the f-string** (no intermediate `lang_instruction` variable)

---

## Files Modified

### 1. `agents/mandi_price_agent.py` ✅
Already patched in previous session. Confirmed the detailed block is in place.

**Fields covered:** `sell_timing_advice`, `best_mandi_reason`, `market_vs_support`,
`urgent_alert`, `potential_extra_earning`, `reasoning`

---

### 2. `agents/weather_agent.py` ✅
**Before:** 17-line rule block with examples but using old `Current language selected:` format  
**After:** Unified ABSOLUTE LANGUAGE RULE block

**Fields covered:** `farming_advisory` (per day), `urgent_alert`,
`best_harvest_window`, `action_today`, `reasoning`

---

### 3. `agents/equipment_agent.py` ✅
**Before:** `STRICT LANGUAGE RULE: {lang_instruction}` (one-liner)  
**After:** Full ABSOLUTE LANGUAGE RULE block with provider-specific examples

Also removed the now-unused `language_instructions` dict and `lang_instruction` variable.

**Fields covered:** `ranking_reason` (per provider), `top_recommendation`,
`booking_message`, `coordination_plan`, `backup_provider`, `reasoning`

---

### 4. `agents/season_planner.py` ✅
**Before:** `STRICT LANGUAGE RULE: {lang_instruction}` (one-liner)  
**After:** Full ABSOLUTE LANGUAGE RULE block with calendar-specific examples

Also removed the now-unused `language_instructions` dict and `lang_instruction` variable.

**Fields covered:** `reason` (per service), `action` (per service),
`description` (per calendar event), `harvest_summary`, `post_harvest_plan`, `reasoning`

---

### 5. `agents/clarification_agent.py` ✅
**Before:**
```
STRICT LANGUAGE RULE:
- roman_urdu: Roman Urdu only, no Urdu script
- urdu: Urdu script only
- english: English only
Current language: {language}
```
**After:** Full ABSOLUTE LANGUAGE RULE block with question/reply examples

**Fields covered:** `clarification_question`, `reply`, `reply_for_tts`

---

### 6. `agents/crop_diagnosis_agent.py` ✅
**Before:** `Language instruction: {lang_instruction}` (one-liner)  
**After:** Full ABSOLUTE LANGUAGE RULE block with disease-specific examples

Also removed the now-unused `language_instructions` dict and `lang_instruction` variable.

**Fields covered:** `safety_precautions`, `expert_first_message`,
`farmer_description`, `application_schedule`, `reasoning`

---

## New Rule Template (applied to all agents)

```
ABSOLUTE LANGUAGE RULE — VIOLATION IS NOT ACCEPTABLE:
The farmer has selected language: {language}

You MUST write every single text field in that language.
No mixing. No exceptions.

IF language == "english":
  Write ALL text in English only.
  Zero Urdu words. Zero Roman Urdu.
  Good: "..."
  Bad: "..." or "..."

IF language == "roman_urdu":
  Write ALL text in Roman Urdu only.
  Use Urdu words spelled in English letters.
  Zero Urdu script characters.
  Good: "..."
  Bad: "..." or "..."

IF language == "urdu":
  Write ALL text in Urdu script only.
  Zero English words for Urdu concepts.
  Zero Roman Urdu.
  Good: "..."
  Bad: "..." or "..."

This rule applies to EVERY text field in your JSON response
without any exception:
- [field1]
- [field2]
- ...
```

---

## Why This Works Better

| Old approach | New approach |
|---|---|
| One-liner instruction | Multi-branch with named conditions |
| No examples | Concrete Good/Bad examples per language |
| Generic field reference | Explicit list of every affected field |
| Weak framing ("STRICT") | Strong framing ("VIOLATION IS NOT ACCEPTABLE") |
| Intermediate variable | Embedded directly in f-string — no stale reference |

---

## Next Step: Redeploy to Cloud Run

```bash
cd kisan-ai-backend
gcloud run deploy kisan-ai-backend \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated
```
