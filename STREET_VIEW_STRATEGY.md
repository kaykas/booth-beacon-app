# Street View Strategy - Making It Work Consistently

**Date:** January 4, 2026
**Issue:** Street View data is validated but not used effectively
**Your Insight:** "If we know the store name, Street View should work reliably"

---

## Current State Analysis

### What's Working ✅
- **85% of booths** (746/880) have Street View validated
- Panorama IDs are stored in database
- Street View metadata API works correctly
- Distance and heading calculations are accurate

### What's NOT Working ❌
1. **Street View data is never displayed** - BoothImage doesn't use it
2. **Only uses Google Places photos** - which can expire or fail
3. **No fallback to Street View** - shows placeholder instead
4. **Coordinate-based search only** - doesn't use venue name for better search

---

## The Problem: Inconsistent Photo Display

### Current Image Priority (BoothImage.tsx)
```typescript
const imageUrl = booth.photo_exterior_url      // Google Places photo
  || booth.ai_generated_image_url             // AI image
  || booth.ai_preview_url;                    // AI preview

// Street View is NEVER used!
```

### Why This Fails
1. **Google Places photos expire** after ~1 year (photo references become invalid)
2. **No fallback to Street View** even though we have panorama IDs
3. **Coordinates might be imprecise** (inside building vs street-facing)
4. **Doesn't leverage venue names** for better Street View search

---

## Your Insight: Use Venue Names

**You're absolutely right!** If we know:
- Booth name: "The Parkside"
- Address: "1600 17th St, San Francisco, CA"
- Type: Bar/Restaurant

Then Street View should reliably show that storefront.

### Current Approach (Coordinate-Based)
```typescript
// Search by lat/lng only
const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=50&key=${key}`;
```

**Problem:** Coordinates might be:
- Inside the building (no Street View)
- At rear entrance (wrong view)
- Slightly off due to geocoding

### Better Approach (Name + Address Based)
```typescript
// Search by place name first, then validate with coordinates
const placeSearch = `The Parkside, 1600 17th St, San Francisco, CA`;
const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(placeSearch)}&key=${key}`;
```

**Benefits:**
- Google Places knows where storefronts are
- More reliable street-facing view
- Handles indoor vs outdoor correctly
- Better for venues inside larger buildings

---

## Proposed Solution: 3-Tier Image Strategy

### Tier 1: Community Photos (Highest Quality)
- Real user-submitted photos
- Authentic booth experience
- Shows current condition

### Tier 2: Google Places + Street View (Most Reliable)
```typescript
// Priority:
1. photo_exterior_url (Google Places) - IF not expired
2. Street View (panorama_id) - IF available
3. Google Places search - Try to refresh
```

### Tier 3: AI Fallback (Last Resort)
- ai_generated_image_url
- ai_preview_url
- Vintage placeholder

---

## Implementation Plan

### Phase 1: Use Existing Street View Data (Quick Win)
**Goal:** Start displaying the 746 booths that already have Street View validated

**Changes:**
1. **Update BoothImage.tsx** to include Street View in fallback chain:
```typescript
const getImageUrl = () => {
  // 1. Community/Google photo
  if (booth.photo_exterior_url && !isExpired(booth.photo_exterior_url)) {
    return booth.photo_exterior_url;
  }

  // 2. Street View (NEW!)
  if (booth.street_view_available && booth.street_view_panorama_id) {
    return getStreetViewUrl(booth);
  }

  // 3. AI fallbacks
  if (booth.ai_generated_image_url) return booth.ai_generated_image_url;
  if (booth.ai_preview_url && !isBrokenUnsplash) return booth.ai_preview_url;

  // 4. Placeholder
  return null;
};

function getStreetViewUrl(booth: Booth): string {
  const { street_view_panorama_id, street_view_heading, latitude, longitude } = booth;

  // Use panorama ID for most reliable results
  if (street_view_panorama_id) {
    return `https://maps.googleapis.com/maps/api/streetview?size=800x600&pano=${street_view_panorama_id}&heading=${street_view_heading || 0}&pitch=0&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
  }

  // Fallback to coordinates
  return `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
}
```

**Impact:**
- 746 booths immediately get Street View fallback
- No more placeholders for booths with valid addresses
- More reliable image display

---

### Phase 2: Improve Street View Search (Name-Based)
**Goal:** Better Street View coverage using venue names

**Changes:**
1. **Update enrich-booth function** to search by name first:
```typescript
async function validateStreetView(booth: Booth, googleApiKey: string) {
  // Method 1: Search by venue name + address (most reliable)
  if (booth.name && booth.address) {
    const searchQuery = `${booth.name}, ${booth.address}`;
    const placeUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=geometry&key=${googleApiKey}`;

    const placeResponse = await fetch(placeUrl);
    const placeData = await placeResponse.json();

    if (placeData.status === 'OK' && placeData.candidates[0]) {
      const location = placeData.candidates[0].geometry.location;
      // Now search Street View at this more accurate location
      return searchStreetView(location.lat, location.lng, googleApiKey);
    }
  }

  // Method 2: Fallback to coordinates
  if (booth.latitude && booth.longitude) {
    return searchStreetView(booth.latitude, booth.longitude, googleApiKey);
  }

  return { available: false };
}
```

**Benefits:**
- Better street-facing views
- Handles venues inside buildings
- More accurate for complex addresses
- Reduces false negatives

---

### Phase 3: Photo Expiration Detection (Proactive)
**Goal:** Detect expired Google Places photos and auto-refresh

**Strategy:**
1. **Add expiration tracking:**
```typescript
// New columns
photo_exterior_fetched_at: timestamp
photo_exterior_last_validated: timestamp
```

2. **Periodic validation:**
```typescript
// Check if photo is still accessible
async function validatePhotoUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Mark for re-enrichment if photo expired
if (booth.photo_exterior_url && isOlderThan1Year(booth.photo_exterior_fetched_at)) {
  const isValid = await validatePhotoUrl(booth.photo_exterior_url);
  if (!isValid) {
    // Clear expired photo, will trigger Street View fallback
    await supabase.from('booths').update({
      photo_exterior_url: null,
      needs_enrichment: true
    }).eq('id', booth.id);
  }
}
```

---

## Success Metrics

### Phase 1 (Quick Win)
- [ ] BoothImage uses Street View for 746 booths
- [ ] Zero placeholders for booths with valid Street View
- [ ] Street View images display correctly with proper heading

### Phase 2 (Better Coverage)
- [ ] Increase Street View coverage from 85% to 95%+
- [ ] Reduce "No Street View" false negatives
- [ ] Better street-facing views for indoor venues

### Phase 3 (Reliability)
- [ ] Auto-detect expired Google Places photos
- [ ] Automatic failover to Street View
- [ ] Periodic validation cron job

---

## Why This Matters

### User Experience
- ✅ **Always show something** - no more "no image available"
- ✅ **Reliable images** - Street View doesn't expire like photo references
- ✅ **Better context** - see the storefront/venue exterior
- ✅ **Authentic feel** - real street views vs AI generated

### Technical Benefits
- ✅ **Free** - Street View API is same cost as Places photos
- ✅ **Reliable** - panorama IDs don't expire
- ✅ **Already validated** - 746 booths ready to use
- ✅ **Fallback chain** - graceful degradation

---

## Quick Start: Phase 1 Implementation

**Priority:** HIGH
**Effort:** 1-2 hours
**Impact:** Immediate improvement for 746 booths

**Files to modify:**
1. `src/components/booth/BoothImage.tsx` - Add Street View to image priority
2. `src/lib/streetView.ts` (NEW) - Street View URL helper functions
3. Test on booths with expired Google Photos

**Expected result:**
- Heebe-Jeebe shows Street View of 1600 17th St
- Parkside shows Street View of venue exterior
- No more placeholders for validated Street View booths

---

## Conclusion

**Your insight is spot-on:** If we know the venue name and address, Street View should work reliably.

**Current problem:** We're validating Street View but not using it.

**Solution:**
1. Use existing Street View data (746 booths)
2. Improve search using venue names
3. Build proper fallback chain

**Next step:** Implement Phase 1 to immediately improve image coverage?

---

**Analysis by:** Claude AI
**User insight:** Use venue names for reliable Street View
**Status:** Ready for implementation
