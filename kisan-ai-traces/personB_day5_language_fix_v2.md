# personB_day5_language_fix_v2

**Mission:** Fix remaining language mixing issues in Kisan AI React Native app.

**Date:** 2026-05-19  
**Status:** ✅ COMPLETE

---

## Problems Fixed

### PROBLEM 1 — Weather screen location shows GPS name instead of saved farm location ✅

**Root cause:** The `navigation.addListener('focus', ...)` dependency array was missing `language`, so the listener was stale and didn't re-bind when language changed. Additionally, `loadCropAndWeather` always reads from `AsyncStorage` freshly (correct), but needed to reset the location name on each call.

**Fix applied in `WeatherScreen.js`:**
```js
// language added to dependency array
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    setLoading(true);
    setError(false);
    loadCropAndWeather();
  });
  return unsubscribe;
}, [navigation, language]);  // <-- language added
```

`loadCropAndWeather` now:
1. Always reads `AsyncStorage.getItem('farmProfile')` fresh on every call
2. Prioritises `farmProfile.lat/lng` (non-zero) → sets `locationName` from `farmProfile.location`
3. Falls back to device GPS only if no saved coordinates

---

### PROBLEM 2 — Day names not translating (showing English "Tue, Wed...") ✅

**Root cause:** `toLocaleDateString('en-PK', { weekday: 'short' })` is hardcoded to English locale.

**Fix applied in `WeatherScreen.js`:** Added two pure helper functions:

```js
// Short day name (for forecast chips)
const getDayName = (dateStr, language) => {
  const date = new Date(dateStr);
  if (language === 'urdu') {
    const urduDays = ['اتوار','پیر','منگل','بدھ','جمعرات','جمعہ','ہفتہ'];
    return urduDays[date.getDay()];
  }
  if (language === 'roman_urdu') {
    const romanDays = ['Itwar','Peer','Mangal','Budh','Jumerat','Juma','Hafta'];
    return romanDays[date.getDay()];
  }
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()];
};

// Full date string (for advisory rows)
const getFullDayName = (dateStr, language) => { ... };
```

Also added `getCropLabel(cropType, language)` to translate the crop name shown in the header subtitle (e.g., "Chawal" → "چاول" → "Rice").

---

### PROBLEM 3 — Mandi screen mixed language strings ✅

**Strings fixed:**

| Element | Before | After |
|---------|--------|-------|
| "Net:" label | Hardcoded `Net:` | `{m.netLabel || 'Net'}:` |
| "transport" label | Hardcoded `transport` | `{m.transportLabel \|\| 'transport'}` |
| Distance unit | Used `m.dist` already | Confirmed working |
| Market trend text | Already using `m.trending` | ✅ Already fixed |
| Rising/Falling/Stable | Already using `m.rising/falling/stable` | ✅ Already fixed |
| Sell badge text | Already using `m.sellNow/wait3/wait1` | ✅ Already fixed |

**New keys added to `strings.js`:**
```js
// roman_urdu
netLabel: "Net",
transportLabel: "transport",

// urdu
netLabel: "خالص",
transportLabel: "ٹرانسپورٹ",

// english
netLabel: "Net",
transportLabel: "transport cost",
```

---

### PROBLEM 4 — AI advice text language (backend issue) ✅

**Fix applied in `MandiScreen.js`:** Added `language` to the `useEffect` dependency array so `fetchPrices` is called again whenever the language changes:

```js
useEffect(() => {
  fetchPrices(selectedCrop.value);
}, [selectedCrop, farmerLat, farmerLng, language]); // language added
```

`fetchPrices` already passes `language || 'roman_urdu'` to `getMandiPrices()` — now it re-fetches with the new language whenever the user switches, so the backend generates advice in the correct language.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/screens/WeatherScreen.js` | Full rewrite: focus listener with language dep, `getDayName`, `getFullDayName`, `getCropLabel` helpers |
| `src/screens/MandiScreen.js` | `netLabel`, `transportLabel` translation keys; `language` in useEffect dep array |
| `src/constants/strings.js` | Added `netLabel` and `transportLabel` for all 3 languages |

---

## Verification

| Scenario | Expected | Status |
|----------|----------|--------|
| Switch to Urdu, go to Weather | Day cards show اتوار/پیر/منگل... | ✅ |
| Advisory rows show date | بدھ, 15 مئی format | ✅ |
| Weather header subtitle | Shows saved farm city, not GPS name | ✅ |
| Crop name in header | Translates with language | ✅ |
| Mandi: Net label in Urdu | Shows خالص | ✅ |
| Mandi: Transport in Urdu | Shows ٹرانسپورٹ | ✅ |
| Mandi: AI advice language | Refetches from backend with new language | ✅ |
| Sell badge text | Uses m.sellNow/wait3/wait1 | ✅ |
