# Trace: Backend API Timeout Fix

**Files Modified**: 
- `kisan-ai-mobile/src/services/api.js`

**Date**: Day 5
**Developer**: Person B

## Objective
Address API timeout issues caused by long-running backend LLM calls. Extend timeout thresholds and implement robust retry logic.

## Changes Made
1. **api.js**:
   - Increased the default `axios` instance timeout to `90000` (90 seconds).
   - Ensured the response interceptor logic is in place to retry on `ECONNABORTED`, timeout messages, `429`, and `503` with exact requested log strings.
   - Updated `analyzeDisease`, `getWeather`, and `getMandiPrices` to explicitly pass `timeout: 90000`.
   - Updated `getSeasonPlan` signature to accept `acres`, `farmerLat`, and `farmerLng`, passing them to the backend endpoint with a 90 second timeout.
