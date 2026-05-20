# personB · Day 5 — Chat Modal Redesign & Clear Chat to Header

**File changed:** `kisan-ai-mobile/src/screens/ChatScreen.js`  
**Date:** 2026-05-20

---

## Problem 1 — Modal did not match app theme

### Fix
Replaced generic white card (centered, padded) with a bottom-sheet style modal using the maroon/gold design system:

| Property | Old | New |
|---|---|---|
| Position | `justifyContent: center` | `justifyContent: flex-end` (bottom sheet) |
| Overlay | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.6)` |
| Card | `borderRadius: 16`, no border | `borderRadius: 20`, `borderColor: C.sep` |
| Header | None | Maroon bar with white bold title |
| Delete text | grey, small | `#DC2626` red, `fontSize: 15` |
| Cancel | grey rounded box | `C.cream` background, `C.inkMuted` text |

New style keys: `modalHeader`, `modalDeleteBtn`, `modalDeleteText`, `modalCancelBtn`  
Removed: `modalOption`, `modalOptionDanger`, `modalOptionText`, `modalCancel`

---

## Problem 2 — "Clear entire chat" removed from modal

### Fix
- Removed "Clear entire chat" option from the modal entirely
- Modal now only shows: **maroon header → Delete this message → Cancel**
- Removed `setShowDeleteModal(false)` from `clearAllMessages()` (no longer called from modal)

---

## Problem 3 — Clear Chat moved to header

### Fix
- Replaced the old plain trash `TouchableOpacity` in `headerRight` with a styled `clearBtn`
- Button uses `Alert.alert()` with a native confirmation dialog before clearing
- Alert text is language-aware (`roman_urdu` / `urdu` / `english`)
- Alert has two buttons: **Cancel** (style: `cancel`) and **Yes, Clear** (style: `destructive`)

```js
Alert.alert(title, message, [
  { text: 'Nahi', style: 'cancel' },
  { text: 'Haan, Clear Karein', style: 'destructive', onPress: clearAllMessages }
]);
```

New styles added: `clearBtn`, `clearBtnText`

---

## Summary of Changes

| # | Change | Why |
|---|---|---|
| 1 | Added `Alert` to RN imports | Needed for confirmation dialog |
| 2 | `clearAllMessages` no longer calls `setShowDeleteModal(false)` | Not triggered from modal anymore |
| 3 | Header trash replaced with `clearBtn` + `Alert.alert` confirmation | Safer UX, keeps modal focused |
| 4 | Modal redesigned: maroon header, bottom-sheet layout | Matches app theme |
| 5 | Modal now only shows Delete + Cancel | Single-purpose, cleaner UX |
