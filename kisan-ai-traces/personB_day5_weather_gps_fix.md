# Trace: Weather GPS Fix

**File Modified**: `kisan-ai-mobile/src/screens/WeatherScreen.js`
**Date**: Day 5
**Developer**: Person B

## Objective
Remove dependency on saved farm profile lat/lng for weather. Weather should ALWAYS use device GPS location automatically. 

## Changes Made
1. Replaced the `loadCropAndWeather` function to eliminate logic that checked `farmProfile?.lat` and `farmProfile?.lng`. 
2. Used `Location.requestForegroundPermissionsAsync` to ask for permissions unconditionally.
3. Used `Location.getCurrentPositionAsync` to retrieve precise location coords. 
4. Implemented inline language check for the error message in JSX:
   - `urdu`: "GPS کی اجازت نہیں ملی۔ سیٹنگز میں لوکیشن آن کریں۔"
   - `english`: "GPS permission denied. Please enable location in settings."
   - `roman_urdu`: "GPS ki ijazat nahi mili. Settings mein location on karein."
