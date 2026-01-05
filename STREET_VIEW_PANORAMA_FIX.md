# Street View Panorama Fix - Heebe-Jeebe Case Study

**Date:** January 5, 2026
**Issue:** Street View showing wrong location for Heebe-Jeebe General Store
**Status:** ✅ FIXED

---

## The Problem

User reported: "The address is correct and the streetview is some other location... it's showing some other store that's a couple of blocks away."

**Booth:** Heebe Jeebe General Store, 46 Kentucky St, Petaluma, CA 94952
**Website:** https://boothbeacon.org/booth/heebe-jeebe-general-store-petaluma

---

## Root Cause Analysis

### Issue #1: API Returns CLOSEST Panorama, Not BEST
The Google Street View Metadata API returns the **closest** panorama to search coordinates, not necessarily the best or most recent one.

**What we found:**
- **2019 panorama** (old, wrong): 7.6m from booth → **CLOSEST** → API returned this
- **2024 panorama** (new, correct): 15.7m from booth → Better positioned, but farther

### Issue #2: Missing `source=outdoor` Parameter
The enrichment function didn't specify imagery source, allowing the API to return any type of Street View:
- Official Google Street View cars (usually best)
- Photo Spheres
- User-submitted photos
- Older imagery

---

## The Fix

### 1. Manual Correction for Heebe-Jeebe ✅

Updated database with correct panorama:

```typescript
// WRONG (what API found):
{
  panoramaId: 'CAoSFkNJSE0wb2dLRUlDQWdJQ01vc3J1UGc.',
  date: '2019-10',
  distance: 7.6m,
  heading: 326°
}

// CORRECT (user found via Google Maps):
{
  panoramaId: 'MHdQf2FHITow55EFOR3HWw',
  date: '2024-07',
  distance: 15.7m,
  heading: 39°
}
```

**Result:** Heebe-Jeebe now shows correct 2024 Street View imagery.

### 2. Enrichment Function Improvement ✅

Added `source=outdoor` parameter to prefer official Google Street View imagery:

```typescript
// Before:
const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=100&key=${apiKey}`;

// After:
const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=100&source=outdoor&key=${apiKey}`;
```

**Testing showed:**
- **Without** `source=outdoor`: Returns 2019 panorama (wrong)
- **With** `source=outdoor`: Returns 2024 panorama (better, but still not the exact one Google Maps shows)

**Impact:** Future enrichments will prefer newer, outdoor imagery over older panoramas.

---

## Comparison: Three Panoramas at This Location

| Panorama | Date | Distance | Found By | Shows Heebe-Jeebe? |
|----------|------|----------|----------|-------------------|
| `CAoS...UGc.` | 2019-10 | 7.6m | Default API search | ❌ No (old) |
| `rMZ0...ORdQ` | 2024-07 | 14.1m | API with `source=outdoor` | ❓ Unknown |
| `MHdQ...HWw` | 2024-07 | 15.7m | Google Maps UI / User | ✅ **Yes** |

The correct panorama is **1.6m farther** than what `source=outdoor` finds, which explains why the API doesn't return it automatically.

---

## Why This Happens

### Google Maps UI vs API Behavior
- **Google Maps UI:** Uses complex heuristics to choose the "best" panorama (considers recency, position, quality, user behavior)
- **Street View API:** Returns the **closest** panorama within the search radius
- **Result:** API and UI can return different panoramas for the same location

### The Distance Paradox
Closer ≠ Better for storefronts:
- A panorama 7m away might be **behind** the building
- A panorama 15m away might be perfectly positioned **across the street** facing the entrance

---

## Lessons Learned

### For Future Enrichments
1. ✅ **Use `source=outdoor`** - Prefers official Street View imagery (deployed)
2. ⚠️ **API limitations** - Cannot programmatically get "best" panorama, only closest
3. 🎯 **Name-based search** - Already implemented, helps find correct building location
4. 🔄 **Manual verification needed** - For critical booths, may need user verification

### Edge Cases to Watch For
- Booths on corners (multiple Street View angles available)
- Booths inside malls (no Street View available, but building exterior exists)
- Recently updated Street View imagery (newer panoramas may be farther away)
- Dense urban areas (many panoramas close together)

---

## Files Modified

### Production ✅
- `supabase/functions/enrich-booth/index.ts` - Added `source=outdoor` parameter
- Database: Updated Heebe-Jeebe with correct panorama ID and heading

### Documentation ✅
- `STREET_VIEW_PANORAMA_FIX.md` - This file
- `NAME_BASED_STREET_VIEW_COMPLETE.md` - Previous Street View work

---

## Testing & Verification

### Manual Test URLs
You can verify the fix by comparing these panoramas:

**Wrong (2019):**
```
https://www.google.com/maps/@?api=1&map_action=pano&pano=CAoSFkNJSE0wb2dLRUlDQWdJQ01vc3J1UGc.
```

**Correct (2024):**
```
https://www.google.com/maps/@?api=1&map_action=pano&pano=MHdQf2FHITow55EFOR3HWw
```

**Live Website:**
```
https://boothbeacon.org/booth/heebe-jeebe-general-store-petaluma
```

---

## Future Improvements (Optional)

### Option 1: Sample Multiple Points
Search Street View at multiple coordinates around the booth (north, south, east, west) and choose the newest panorama.

### Option 2: Prefer Newer Imagery
If multiple panoramas are found within a reasonable distance (e.g., <20m), prefer the one with the most recent date.

### Option 3: User Verification System
Add a flag for users to report "wrong Street View" and allow manual correction via admin panel.

### Option 4: Google Maps JavaScript API
Use the JavaScript API's `getPanorama` method which may have different selection logic than the REST API.

---

## Summary

**Problem:** Street View API returns closest panorama, which may be outdated or poorly positioned.

**Solution:**
1. ✅ Added `source=outdoor` to prefer official Street View imagery
2. ✅ Manually corrected Heebe-Jeebe with user-verified panorama ID
3. ℹ️ Documented limitation: API cannot match Google Maps UI's "best" panorama selection

**Result:** Heebe-Jeebe now shows correct storefront. Future enrichments will use newer imagery.

**Trade-off:** Some booths may still need manual verification, as API behavior differs from Google Maps UI.

---

**Deployed by:** Claude AI
**Deployment:** Complete (Edge Function + Database)
**Status:** Production
