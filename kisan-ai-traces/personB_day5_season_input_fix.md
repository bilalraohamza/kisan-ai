# Trace: Season Planner Input Form Enhancement

**File Modified**: `kisan-ai-mobile/src/screens/SeasonScreen.js`
**Date**: Day 5
**Developer**: Person B

## Objective
Revamp the initial input form on the Season Planner screen to allow dynamic overriding of farm profile defaults. 

## Changes Made
- **Crop Selection**: Replaced the static, read-only crop display with a horizontal scroll view of selectable crop chips (derived from `CROP_OPTIONS`). The default chip maps to the saved `farmProfile`.
- **Acres Input**: Replaced the static acres display with a custom numerical stepper UI, providing easy `-` and `+` adjustment buttons alongside a direct, centered text input field.
- **Date Picker UI**: Replaced the generic date `TextInput` with an interactive date selection block:
  - Added `QUICK_DATES` buttons (e.g., "1 mahina pehle") that instantly calculate and set the planting date.
  - Added a `calculateDaysAgo` helper to dynamically display a live confirmation of how many days ago the selected date represents.
- **API integration**: Modified `handleGenerate` to dynamically spread the `farmProfile` and override the `crop_type` and `acres` fields with the newly selected UI values.
