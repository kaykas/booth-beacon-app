# Street View Validation System - Implementation Plan

**Problem Identified:** January 2, 2026
**Status:** Design Phase

---

## The Problem

### Current Implementation Issues

1. **No Real Validation** (StreetViewEmbed.tsx:29-38)
   - Component has a fake validation that just waits 1 second
   - Comment explicitly states: "This is a basic check. In production, you'd want to use Google's API"
   - Always assumes Street View is available

2. **Google Maps Embed API Limitation** (line 42)
   ```typescript
   const streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=${key}&location=${latitude},${longitude}&heading=${heading}&pitch=${pitch}&fov=${fov}`;
   ```
   - Embed API automatically shows the **nearest** Street View panorama
   - Could be blocks or miles away from actual booth
   - No way to know how far away the panorama is
   - No feedback when exact location unavailable

3. **Conditional Display Logic** (booth/[slug]/page.tsx:747-752)
   ```typescript
   {hasValidLocation &&
    booth.latitude &&
    booth.longitude &&
    booth.address &&
    booth.address !== booth.city &&
    booth.address.length > 10 && (
   ```
   - Only filters out city-level addresses
   - Doesn't validate Street View actually exists
   - Shows component even when Street View is miles away

### User Impact
- **Trust Issues**: Users see Street View that doesn't match booth location
- **Navigation Problems**: Users might navigate to wrong location
- **Confusion**: No indication when Street View is approximate vs. exact

---

## Solution Architecture

### Phase 1: Database Schema
Add validation fields to `booths` table:

```sql
ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_available BOOLEAN DEFAULT NULL;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_panorama_id TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_distance_meters NUMERIC(10, 2);
ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_validated_at TIMESTAMPTZ;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS street_view_heading NUMERIC(5, 2);

-- Index for querying validated booths
CREATE INDEX IF NOT EXISTS idx_booths_street_view_available
  ON booths(street_view_available)
  WHERE street_view_available IS NOT NULL;
```

**Field Descriptions:**
- `street_view_available` - Boolean: Is Street View within acceptable radius?
- `street_view_panorama_id` - Text: Google's unique panorama ID
- `street_view_distance_meters` - Numeric: Distance from booth to panorama
- `street_view_validated_at` - Timestamp: When validation was performed
- `street_view_heading` - Numeric: Optimal camera heading toward booth

### Phase 2: Validation Service
Create API route: `/api/street-view/validate`

**Technology:** Google Maps JavaScript API (not Embed API)
**Method:** `google.maps.StreetViewService().getPanorama()`

**Implementation:**
```typescript
// API Route: src/app/api/street-view/validate/route.ts

import { StreetViewService, StreetViewStatus } from '@googlemaps/google-maps-services-js';

interface ValidationRequest {
  boothId: string;
  latitude: number;
  longitude: number;
}

interface ValidationResult {
  available: boolean;
  panoramaId?: string;
  distanceMeters?: number;
  heading?: number;
  location?: { lat: number; lng: number };
}

export async function POST(request: Request) {
  const { boothId, latitude, longitude } = await request.json();

  // Use Google Maps StreetViewService
  const result = await validateStreetView(latitude, longitude);

  // Store result in database
  await supabase
    .from('booths')
    .update({
      street_view_available: result.available,
      street_view_panorama_id: result.panoramaId,
      street_view_distance_meters: result.distanceMeters,
      street_view_heading: result.heading,
      street_view_validated_at: new Date().toISOString(),
    })
    .eq('id', boothId);

  return Response.json(result);
}

async function validateStreetView(
  lat: number,
  lng: number
): Promise<ValidationResult> {
  const MAX_DISTANCE_METERS = 50; // Maximum acceptable distance

  // Use Google Street View Service
  // getPanorama searches within default 50m radius
  const response = await streetViewService.getPanorama({
    location: { lat, lng },
    radius: MAX_DISTANCE_METERS,
    source: 'outdoor', // Prefer outdoor panoramas
  });

  if (response.status === StreetViewStatus.OK) {
    const panoLocation = response.data.location;
    const distance = calculateDistance(
      lat, lng,
      panoLocation.latLng.lat,
      panoLocation.latLng.lng
    );

    // Calculate optimal heading from panorama toward booth
    const heading = calculateHeading(
      panoLocation.latLng.lat,
      panoLocation.latLng.lng,
      lat,
      lng
    );

    return {
      available: distance <= MAX_DISTANCE_METERS,
      panoramaId: response.data.pano,
      distanceMeters: distance,
      heading: heading,
      location: panoLocation.latLng,
    };
  }

  return { available: false };
}
```

### Phase 3: Batch Validation Script
Create script to validate all existing booths:

```bash
# scripts/validate-street-views.sh

#!/bin/bash

# Validate Street View for all booths with coordinates
SUPABASE_URL="https://tmgbmcbwfkvmylmfpkzy.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="xxx"

node scripts/validate-street-views.js
```

```typescript
// scripts/validate-street-views.js

// Fetch all booths with coordinates but no validation
// Call validation API for each booth
// Rate limit: 1 request per 100ms (Google's limit)
// Progress tracking with resume capability
```

### Phase 4: Enhanced Component
Update `StreetViewEmbed.tsx`:

**Key Changes:**
1. Check `street_view_available` before rendering
2. Use `street_view_panorama_id` if available (more reliable)
3. Show distance warning if panorama is far
4. Add "Report Incorrect Location" button
5. Show map marker overlay indicating booth location

```typescript
export function StreetViewEmbed({
  latitude,
  longitude,
  boothName,
  streetViewAvailable,
  streetViewPanoramaId,
  streetViewDistanceMeters,
  streetViewHeading,
}) {
  // Don't render if validation failed
  if (streetViewAvailable === false) {
    return <StreetViewUnavailable />;
  }

  // Show warning if panorama is far from booth
  const showDistanceWarning = streetViewDistanceMeters > 25;

  // Use panorama ID if available (more reliable than coordinates)
  const streetViewUrl = streetViewPanoramaId
    ? `https://www.google.com/maps/embed/v1/streetview?key=${key}&pano=${streetViewPanoramaId}&heading=${streetViewHeading}`
    : `https://www.google.com/maps/embed/v1/streetview?key=${key}&location=${latitude},${longitude}`;

  return (
    <Card>
      {showDistanceWarning && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Street View is approximately {Math.round(streetViewDistanceMeters)}m
            from the booth location. View may not be exact.
          </AlertDescription>
        </Alert>
      )}

      <iframe src={streetViewUrl} ... />

      <div className="p-4">
        <Button variant="ghost" onClick={handleReportIssue}>
          <Flag className="w-4 h-4 mr-2" />
          Report Incorrect Location
        </Button>
      </div>
    </Card>
  );
}
```

### Phase 5: Conditional Display
Update booth detail page to check validation:

```typescript
// src/app/booth/[slug]/page.tsx

{/* Street View - Only show if validated and available */}
{booth.street_view_available &&
 booth.latitude &&
 booth.longitude && (
  <div>
    <h2 className="text-xl font-semibold mb-4">Street View</h2>
    <StreetViewEmbed
      latitude={booth.latitude}
      longitude={booth.longitude}
      boothName={booth.name}
      streetViewAvailable={booth.street_view_available}
      streetViewPanoramaId={booth.street_view_panorama_id}
      streetViewDistanceMeters={booth.street_view_distance_meters}
      streetViewHeading={booth.street_view_heading}
    />
  </div>
)}
```

### Phase 6: User Feedback System
Add report mechanism for incorrect Street Views:

**API Route:** `/api/street-view/report-issue`

**Stores:**
- Booth ID
- User report type (wrong location, outdated, other)
- User comments
- Timestamp

**Action:**
- Invalidates current validation
- Queues booth for re-validation
- Notifies admin

---

## Implementation Phases

### ✅ Phase 0: Analysis (COMPLETED)
- [x] Review current implementation
- [x] Identify root causes
- [x] Design solution architecture

### 🔄 Phase 1: Database Schema (Next)
- [ ] Create migration file
- [ ] Add validation columns to booths table
- [ ] Add indexes for performance
- [ ] Test migration locally
- [ ] Deploy to production

### ⏳ Phase 2: Validation Service
- [ ] Create API route `/api/street-view/validate`
- [ ] Implement Google Street View Service integration
- [ ] Add distance calculation utilities
- [ ] Add heading calculation utilities
- [ ] Test with sample coordinates
- [ ] Add error handling and retries

### ⏳ Phase 3: Batch Validation
- [ ] Create validation script
- [ ] Add progress tracking
- [ ] Add resume capability (for rate limits)
- [ ] Test on 10 booths
- [ ] Run on all 1000 booths
- [ ] Monitor and fix errors

### ⏳ Phase 4: Component Updates
- [ ] Update StreetViewEmbed component
- [ ] Add distance warning UI
- [ ] Add report button
- [ ] Update booth detail page
- [ ] Test with validated data
- [ ] Deploy to production

### ⏳ Phase 5: User Feedback
- [ ] Create report issue API
- [ ] Add UI for reporting
- [ ] Set up admin notifications
- [ ] Create re-validation queue
- [ ] Monitor user reports

---

## Success Metrics

### Immediate (Week 1)
- [ ] Database schema deployed
- [ ] Validation API functional
- [ ] 100 booths validated manually

### Short-term (Week 2-4)
- [ ] All 1000 booths validated
- [ ] Street View only shown when validated
- [ ] Distance warnings displayed accurately
- [ ] Zero false-positive Street Views

### Long-term (Month 2-3)
- [ ] User report system active
- [ ] Re-validation on schedule (quarterly)
- [ ] 95%+ accuracy on Street View locations
- [ ] User trust restored

---

## Technical Considerations

### Google Maps API Costs
- **Street View Service**: $7 per 1,000 requests
- **1000 booths validation**: ~$7 one-time
- **Quarterly re-validation**: ~$28/year
- **Acceptable cost** for accuracy improvement

### Rate Limits
- Google Maps: 100 requests/second (per API key)
- Implement 10 req/sec to be safe
- 1000 booths = ~2 minutes to validate all

### Performance
- Validation happens server-side (not client)
- Results cached in database
- No impact on page load times
- Re-validate quarterly or on-demand

### Alternative: Street View Static API
For even better performance, could use Static API:
- Generates static image of Street View
- Can detect if image is placeholder (no coverage)
- Faster than iframe embed
- Lower cost ($2 per 1,000)

---

## Open Questions

1. **Acceptable distance threshold?**
   - Current plan: 50 meters
   - Could be adjusted based on urban vs. rural areas

2. **Re-validation frequency?**
   - Current plan: Quarterly
   - Could be triggered by user reports
   - Could be tied to booth updates

3. **Show approximate Street View with warning?**
   - Option A: Hide Street View if >50m away
   - Option B: Show with prominent warning if 50-200m away
   - Option C: Always show with distance indicator

4. **Fallback for no Street View?**
   - Show static map?
   - Show user-submitted photos?
   - Show Google Maps satellite view?

---

## Next Steps

**Recommended Priority:**
1. ✅ Create this implementation plan (DONE)
2. 🔄 Create database migration
3. 🔄 Implement validation API
4. 🔄 Test validation on 10 sample booths
5. 🔄 Update StreetViewEmbed component
6. 🔄 Run batch validation
7. 🔄 Deploy and monitor

**Decision Needed:**
- Distance threshold (50m recommended)
- Show approximate views with warning? (Yes recommended)
- Re-validation frequency (Quarterly recommended)

---

**Author:** Claude Sonnet 4.5
**Date:** January 2, 2026
**Status:** Ready for Implementation
