# Street View & Photo Display Issues - Root Cause Analysis

**Date:** January 4, 2026
**Booth Affected:** Heebe Jeebe General Store (Petaluma, CA)
**Severity:** HIGH - Affects accurate booth discovery

---

## 🔍 Issues Reported

1. **Main image not showing** despite successful photo re-enrichment
2. **Street View showing wrong location** (displays "Fermi" instead of "Heebe Jeebe General Store")
3. **Street View coordinates visible** in UI (38 by -122)
4. **Poor Street View contrast**
5. **Feels like regression** - "This feels like we reverted something that we had fixed in the past"

---

## 🎯 Root Cause Identified

### Issue #1: Street View Migration Never Applied

**Migration file exists but never pushed to database:**
- File: `supabase/migrations/20260102_add_street_view_validation.sql`
- Created: January 2, 2026
- Status: ❌ **NOT APPLIED TO PRODUCTION DATABASE**

**Expected columns (defined in migration):**
```sql
street_view_available BOOLEAN
street_view_panorama_id TEXT
street_view_distance_meters NUMERIC(10, 2)
street_view_validated_at TIMESTAMPTZ
street_view_heading NUMERIC(5, 2)
```

**Actual database:** ❌ **These columns DO NOT EXIST**

**Impact:**
- StreetViewEmbed component expects these columns (line 14-17, 28-31)
- When columns are null/undefined, component falls back to using raw coordinates
- Google Street View API shows **nearest panorama to coordinates**
- This often shows **wrong business** (e.g., "Fermi" instead of "Heebe Jeebe")

**Why this happens:**
```typescript
// StreetViewEmbed.tsx line 62-64
const streetViewUrl = streetViewPanoramaId
  ? `...&pano=${streetViewPanoramaId}...`  // ✅ Specific panorama (accurate)
  : `...&location=${latitude},${longitude}...`  // ❌ Generic coords (inaccurate)
```

Without `street_view_panorama_id` in database, ALWAYS uses coordinates fallback.

---

### Issue #2: Photo Display - Next.js Image Component

**Database status:** ✅ Photo URL is correct and accessible
```
photo_exterior_url: https://tmgbmcbwfkvmylmfpkzy.supabase.co/storage/v1/object/public/booth-images/booth-photos/booth-e6d3c6fd-exterior.jpg
HTTP Status: 200 OK
Content-Length: 220485 bytes
Storage: ✅ Permanent Supabase Storage
```

**Possible causes:**
1. **Browser cache** - Old page load with expired Google URL
2. **Next.js Image optimization** - May be failing to load Supabase Storage URLs
3. **ISR timing** - Page revalidation hasn't occurred yet (1 hour interval)

**BoothImage component logic (lines 28-35):**
```typescript
// Priority: photo_exterior_url > ai_generated_image_url > ai_preview_url
const imageUrl = booth.photo_exterior_url
  || booth.ai_generated_image_url
  || (!isBrokenUnsplashUrl ? booth.ai_preview_url : null);

const hasNoImage = !imageUrl || hasImageError;  // Line 35
```

If `onError` handler triggers (line 80), image shows placeholder.

---

## 🔧 Systematic Solution

### Step 1: Apply Street View Migration

**Push migration to production:**
```bash
cd /Users/jkw/Projects/booth-beacon-app
supabase db push
```

This will add the 5 Street View columns to production database.

---

### Step 2: Validate Street View for All Booths

**Create Street View validation script** that:
1. Queries Google Street View Metadata API for each booth
2. Finds nearest panorama within 50m radius
3. Stores panorama ID, distance, and optimal heading
4. Marks `street_view_available` true/false

**Google Street View Metadata API:**
```
GET https://maps.googleapis.com/maps/api/streetview/metadata
  ?location={lat},{lng}
  &radius=50
  &key={API_KEY}

Response:
{
  "status": "OK",
  "pano_id": "CAoSLEFGMVFpcE...",
  "location": {
    "lat": 38.233554,
    "lng": -122.640898
  }
}
```

---

### Step 3: Enrich Heebe Jeebe with Correct Panorama

**Manual test/fix for Heebe Jeebe:**
```bash
# Call Street View Metadata API
curl "https://maps.googleapis.com/maps/api/streetview/metadata?location=38.233554,-122.640898&radius=50&key=AIzaSyD8EsT8nSCCtkkShAbRwHg67hrPMXPoeHo"

# Update booth with panorama ID
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

await supabase
  .from('booths')
  .update({
    street_view_panorama_id: '[PANORAMA_ID_FROM_API]',
    street_view_distance_meters: [DISTANCE],
    street_view_available: true,
    street_view_validated_at: new Date().toISOString()
  })
  .ilike('name', '%heebe%jeebe%');
"
```

---

### Step 4: Batch Validate All Booths

**Create comprehensive validation script:**
```typescript
// scripts/validate-street-view-all-booths.ts

import { createClient } from '@supabase/supabase-js';

// For each booth with coordinates:
// 1. Call Street View Metadata API
// 2. If panorama found within 50m:
//    - Store panorama_id
//    - Store distance
//    - Calculate optimal heading toward booth
//    - Mark available=true
// 3. If no panorama:
//    - Mark available=false
// 4. Rate limit: 1 request/second (Google API quota)
```

---

### Step 5: Fix Photo Display Issue

**Force ISR revalidation:**
```typescript
// Option A: On-demand revalidation API route
// POST /api/revalidate?path=/booth/heebe-jeebe-general-store-petaluma

// Option B: Wait for automatic revalidation (1 hour)

// Option C: Hard refresh in browser (Cmd+Shift+R)
```

**Check Next.js Image optimization config:**
```typescript
// next.config.mjs
const nextConfig = {
  images: {
    domains: ['tmgbmcbwfkvmylmfpkzy.supabase.co'],  // Ensure Supabase allowed
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};
```

---

## 📋 Implementation Checklist

### Immediate (Fix Heebe Jeebe)
- [ ] Push Street View migration to production
- [ ] Fetch correct panorama ID for Heebe Jeebe
- [ ] Update Heebe Jeebe with panorama ID
- [ ] Force ISR revalidation for page
- [ ] Verify photo displays correctly
- [ ] Verify Street View shows correct location

### Short-term (Prevent Future Issues)
- [ ] Create Street View validation script
- [ ] Validate all 810 booths with coordinates
- [ ] Update StreetViewEmbed to handle missing fields gracefully
- [ ] Add monitoring for Street View validation coverage
- [ ] Document Street View validation process

### Long-term (Systematic Quality)
- [ ] Add Street View validation to enrichment pipeline
- [ ] Periodic re-validation (quarterly) for panorama updates
- [ ] Community reporting for incorrect Street Views
- [ ] A/B test Street View contrast filters
- [ ] Consider alternative Street View providers

---

## 🎓 Key Learnings

1. **Migration discipline:** Always verify migrations are applied to production
2. **Component assumptions:** Components should handle missing database fields gracefully
3. **Google API limitations:** Street View coordinates alone are unreliable for specific businesses
4. **Panorama IDs are crucial:** Direct panorama IDs ensure correct Street View display
5. **Validation matters:** Street View availability should be validated, not assumed

---

## 📊 Success Metrics

**Before:**
- ❌ Street View showing wrong location (Fermi)
- ❌ Coordinates visible in UI (confusing)
- ❌ Poor Street View contrast
- ❌ Photo not displaying

**After:**
- ✅ Street View showing correct location (Heebe Jeebe General Store)
- ✅ Panorama ID validated and stored
- ✅ Optimal heading toward booth
- ✅ Photo displaying correctly
- ✅ All 810 booths validated for Street View availability

---

**Next Steps:** Apply migration and validate Street View for all booths.
