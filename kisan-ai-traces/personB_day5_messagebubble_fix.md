# personB · Day 5 — MessageBubble Navigation & Language Fix

**File:** `kisan-ai-mobile/src/components/MessageBubble.js`  
**Date:** 2026-05-20

---

## Problem 1 — Navigate buttons tapped but nothing happened

### Root Cause
`MessageBubble` called `navigation.navigate(message.navigate_to)` directly (e.g. `"Weather"`, `"Services"`).  
The Chat screen lives inside a **Stack navigator** that sits *on top of* the Tab navigator (`Tabs`).  
Calling `navigate("Weather")` from inside the stack tried to find a stack screen called `Weather`, which doesn't exist there — so nothing happened.

### Fix Applied
```js
onPress={() => {
  navigation.goBack();          // pop Chat off the stack
  setTimeout(() => {
    navigation.navigate('Tabs', {
      screen: message.navigate_to   // e.g. 'Weather', 'Services'
    });
  }, 300);                      // let goBack animation complete first
}}
```

---

## Problem 2 — Button labels hardcoded in Roman Urdu

### Root Cause
Button text was a chain of ternaries with Roman Urdu strings only.  
The clarify bubble header `⚠ WAZAHAT DARKAR` was also a hardcoded string.

### Fix Applied

Added two pure helper functions at module level (outside the component):

```js
const getNavigateLabel = (navigateTo, language) => {
  const labels = {
    Disease:  { roman_urdu: '🔬 Bimari Scanner Kholein', urdu: '🔬 بیماری سکینر کھولیں', english: '🔬 Open Disease Scanner' },
    Mandi:    { roman_urdu: '🏪 Mandi Dekhen',           urdu: '🏪 منڈی دیکھیں',          english: '🏪 View Mandi Prices'   },
    Weather:  { roman_urdu: '🌤 Mausam Dekhen',          urdu: '🌤 موسم دیکھیں',           english: '🌤 View Weather'         },
    Services: { roman_urdu: '🚜 Services Dekhen',        urdu: '🚜 خدمات دیکھیں',          english: '🚜 View Services'        },
    Season:   { roman_urdu: '📅 Calendar Dekhen',        urdu: '📅 کیلنڈر دیکھیں',         english: '📅 View Calendar'        },
  };
  const lang = language || 'roman_urdu';
  return labels[navigateTo]?.[lang] || '→ ' + navigateTo;
};

const getClarifyLabel = (language) =>
  ({ roman_urdu: '⚠ WAZAHAT DARKAR', urdu: '⚠ وضاحت درکار', english: '⚠ CLARIFICATION NEEDED' }[language]
    || '⚠ WAZAHAT DARKAR');
```

JSX updated:
```jsx
<Text style={styles.clarifyLabel}>{getClarifyLabel(language)}</Text>
// ...
<Text style={styles.navigateBtnText}>
  {getNavigateLabel(message.navigate_to, message.language)}
</Text>
```

---

## Summary of Changes

| # | What changed | Why |
|---|---|---|
| 1 | `onPress` now calls `goBack()` then `navigate('Tabs', {screen})` | Chat is a stack screen; must pop it before switching tabs |
| 2 | `getNavigateLabel()` replaces hardcoded ternary chain | Supports `roman_urdu`, `urdu`, `english` |
| 3 | `getClarifyLabel()` replaces hardcoded `⚠ WAZAHAT DARKAR` | Matches session language |
