# Trace: Season Planner Input Layout Fixes

**File Modified**: `kisan-ai-mobile/src/screens/SeasonScreen.js`
**Date**: Day 5
**Developer**: Person B

## Objective
Fix layout overflow and sizing issues across the new Season Planner interactive input form.

## Changes Made
- **Acres Input Row**: 
  - Added `flexShrink: 0` to the `-` and `+` buttons to prevent them from being squashed out of view.
  - Adjusted the `acresInput` container to use `minWidth: 60` and `maxWidth: 120` to prevent it from greedily expanding and hiding the surrounding buttons.
  - Reduced horizontal padding and optimized gaps so the row perfectly fits smaller mobile screens.
- **Crop Chips**: 
  - Reduced the overall size of crop chips (`paddingVertical`, `paddingHorizontal`, and `gap`) to allow more chips to comfortably fit within the initial horizontal scroll view without excessive scrolling.
  - Shrunk emoji and text font sizes slightly for better hierarchy.
- **Quick Date Buttons**:
  - Decreased the padding, border radius, and font size of the quick date select buttons so they don't look excessively bulky above the standard date input row.
