# Street View Validation System - Implementation Guide

**Status:** ✅ IMPLEMENTED - Ready for Testing
**Date:** January 2, 2026
**Reference:** `/Users/jkw/Projects/booth-beacon-app/docs/STREET_VIEW_VALIDATION_PLAN.md`

---

## Overview

This document describes the complete implementation of the Street View validation system for Booth Beacon. The system validates Google Street View availability for each booth location and provides accurate distance information to users.

---

## What Was Implemented

### 1. Database Schema ✅

**File:** `/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20260102_add_street_view_validation.sql`

Added 5 new columns to the `booths` table:

```sql
- street_view_available (boolean)      -- Is Street View within 50m?
- street_view_panorama_id (text)       -- Google panorama ID
- street_view_distance_meters (numeric) -- Distance to panorama
- street_view_validated_at (timestamptz) -- When validated
- street_view_heading (numeric)        -- Optimal camera heading
```

**Indexes created:**
- `idx_booths_street_view_available` - For querying validated booths
- `idx_booths_street_view_validation_needed` - For finding booths needing validation

### 2. Validation API ✅

**File:** `/Users/jkw/Projects/booth-beacon-app/src/app/api/street-view/validate/route.ts`

**Endpoints:**

#### POST `/api/street-view/validate`
Validates Street View availability for a booth.

**Request:**
```json
{
  "boothId": "uuid",
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

**Response:**
```json
{
  "success": true,
  "boothId": "uuid",
  "validation": {
    "available": true,
    "panoramaId": "CAoSLEFGMVFpcE5...",
    "distanceMeters": 12.5,
    "heading": 245.3,
    "location": {
      "lat": 37.7749,
      "lng": -122.4194
    }
  }
}
```

#### GET `/api/street-view/validate?boothId=uuid`
Check validation status for a booth.

**Key Features:**
- Uses Google Street View Metadata API
- Calculates distance using Haversine formula
- Calculates optimal camera heading
- Stores results in database automatically
- 50-meter radius search
- Prefers outdoor panoramas

### 3. Batch Validation Script ✅

**File:** `/Users/jkw/Projects/booth-beacon-app/scripts/validate-street-views.js`

Validates all booths with coordinates.

**Features:**
- Progress bar with live statistics
- Rate limiting (10 req/sec default)
- Resume capability (skip validated)
- Batch size limiting
- Dry run mode
- Error tracking and reporting

**Usage:**
```bash
# Validate all booths
SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/validate-street-views.js

# Dry run test
SUPABASE_SERVICE_ROLE_KEY=xxx DRY_RUN=true node scripts/validate-street-views.js

# Resume from previous run
SUPABASE_SERVICE_ROLE_KEY=xxx RESUME=true node scripts/validate-street-views.js

# Validate first 10 booths only
SUPABASE_SERVICE_ROLE_KEY=xxx BATCH_SIZE=10 node scripts/validate-street-views.js

# Adjust rate limit (requests per second)
SUPABASE_SERVICE_ROLE_KEY=xxx RATE_LIMIT=5 node scripts/validate-street-views.js
```

### 4. Enhanced StreetViewEmbed Component ✅

**File:** `/Users/jkw/Projects/booth-beacon-app/src/components/booth/StreetViewEmbed.tsx`

**New Props:**
```typescript
interface StreetViewEmbedProps {
  latitude: number;
  longitude: number;
  boothName: string;
  boothId?: string;                           // NEW
  streetViewAvailable?: boolean | null;       // NEW
  streetViewPanoramaId?: string | null;       // NEW
  streetViewDistanceMeters?: number | null;   // NEW
  streetViewHeading?: number | null;          // NEW
  heading?: number;
  pitch?: number;
  fov?: number;
}
```

**Key Features:**
1. **Validation Check:** Shows unavailable message if validated as unavailable
2. **Distance Warning:** Shows alert if panorama >25m away
3. **Panorama ID:** Uses panorama ID when available (more reliable)
4. **Optimal Heading:** Uses calculated heading for better view
5. **Distance Display:** Shows distance in footer
6. **Report Button:** Allows users to report incorrect locations

**UI Improvements:**
- Yellow warning alert for distant Street Views
- Distance indicator in footer
- "Report Issue" button
- Better error handling

### 5. Updated Booth Detail Page ✅

**File:** `/Users/jkw/Projects/booth-beacon-app/src/app/booth/[slug]/page.tsx`

**Changes:**
```typescript
// Old condition (line 747)
{hasValidLocation && booth.latitude && booth.longitude && ...}

// New condition (line 747-753)
{hasValidLocation &&
 booth.latitude &&
 booth.longitude &&
 booth.street_view_available !== false && ( // Only hide if explicitly unavailable
  <StreetViewEmbed
    latitude={booth.latitude}
    longitude={booth.longitude}
    boothName={booth.name}
    boothId={booth.id}
    streetViewAvailable={booth.street_view_available}
    streetViewPanoramaId={booth.street_view_panorama_id}
    streetViewDistanceMeters={booth.street_view_distance_meters}
    streetViewHeading={booth.street_view_heading}
  />
)}
```

**Behavior:**
- Shows Street View if validated as available
- Shows Street View if not yet validated (null)
- Hides Street View if validated as unavailable (false)
- Passes all validation data to component

### 6. Updated TypeScript Types ✅

**File:** `/Users/jkw/Projects/booth-beacon-app/src/types/index.ts`

Added to `Booth` interface:
```typescript
// Street View validation
street_view_available?: boolean | null;
street_view_panorama_id?: string | null;
street_view_distance_meters?: number | null;
street_view_validated_at?: string | null;
street_view_heading?: number | null;
```

---

## How to Deploy

### Step 1: Apply Database Migration

**Option A: Using Supabase CLI (Recommended)**
```bash
cd /Users/jkw/Projects/booth-beacon-app
supabase db push
```

**Option B: Using psql**
```bash
cat supabase/migrations/20260102_add_street_view_validation.sql | \
  PGPASSWORD="your-password" psql "postgresql://postgres.tmgbmcbwfkvmylmfpkzy:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

**Option C: Using Node.js script**
```bash
SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/apply-street-view-migration.js
```

**Verify migration:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'booths'
AND column_name LIKE 'street_view%';
```

### Step 2: Test API Endpoint

```bash
# Start dev server
npm run dev

# Test validation API
curl -X POST http://localhost:3000/api/street-view/validate \
  -H "Content-Type: application/json" \
  -d '{
    "boothId": "your-booth-id",
    "latitude": 37.7749,
    "longitude": -122.4194
  }'
```

### Step 3: Run Validation on Sample Booths

```bash
# Test with dry run first
SUPABASE_SERVICE_ROLE_KEY=xxx DRY_RUN=true BATCH_SIZE=10 node scripts/validate-street-views.js

# Validate 10 real booths
SUPABASE_SERVICE_ROLE_KEY=xxx BATCH_SIZE=10 node scripts/validate-street-views.js
```

### Step 4: Deploy to Production

```bash
# Deploy frontend (Vercel auto-deploys on git push)
git add .
git commit -m "Add Street View validation system"
git push origin main

# Wait for Vercel deployment to complete
# Then run validation on production
APP_URL=https://boothbeacon.com \
SUPABASE_SERVICE_ROLE_KEY=xxx \
node scripts/validate-street-views.js
```

### Step 5: Run Full Validation

```bash
# Validate all booths (no BATCH_SIZE limit)
SUPABASE_SERVICE_ROLE_KEY=xxx \
RATE_LIMIT=10 \
node scripts/validate-street-views.js
```

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] Database migration applied successfully
- [ ] New columns exist in booths table
- [ ] Indexes created successfully
- [ ] API endpoint returns correct validation data
- [ ] API handles invalid coordinates gracefully
- [ ] API updates database correctly

### Component Testing

- [ ] StreetViewEmbed shows distance warning when >25m
- [ ] StreetViewEmbed uses panorama ID when available
- [ ] StreetViewEmbed shows unavailable message when validated false
- [ ] Report Issue button works
- [ ] Distance display shows in footer

### Booth Page Testing

- [ ] Street View hidden when validated as unavailable
- [ ] Street View shown when not validated (null)
- [ ] Street View shown when validated as available
- [ ] All props passed correctly to component

### Batch Validation Testing

- [ ] Dry run mode works without updating database
- [ ] Resume mode skips already-validated booths
- [ ] Rate limiting prevents API errors
- [ ] Progress bar updates correctly
- [ ] Error handling works for invalid coordinates
- [ ] Final statistics accurate

---

## Cost Analysis

### Google Maps API Costs

**Street View Metadata API:**
- Cost: $7 per 1,000 requests
- First validation: 912 booths × $7/1000 = ~$6.38
- Quarterly re-validation: ~$25.52/year

**Total estimated annual cost:** ~$32

**Note:** This is negligible compared to the value of accurate Street View data.

---

## Monitoring & Maintenance

### Validation Status Query

```sql
-- Check validation coverage
SELECT
  COUNT(*) as total_booths,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coordinates,
  COUNT(street_view_validated_at) as validated,
  COUNT(CASE WHEN street_view_available = true THEN 1 END) as available,
  COUNT(CASE WHEN street_view_available = false THEN 1 END) as unavailable,
  ROUND(COUNT(street_view_validated_at)::numeric / NULLIF(COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END), 0) * 100, 2) as validation_percentage
FROM booths;
```

### Re-validation Schedule

**Recommended:** Quarterly (every 3 months)

```bash
# Add to cron job
0 0 1 */3 * cd /path/to/project && SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/validate-street-views.js
```

### Validation Metrics Dashboard

```sql
-- Get validation statistics
SELECT
  DATE_TRUNC('day', street_view_validated_at) as validation_date,
  COUNT(*) as validated_count,
  COUNT(CASE WHEN street_view_available = true THEN 1 END) as available_count,
  ROUND(AVG(street_view_distance_meters), 2) as avg_distance_meters
FROM booths
WHERE street_view_validated_at IS NOT NULL
GROUP BY DATE_TRUNC('day', street_view_validated_at)
ORDER BY validation_date DESC
LIMIT 30;
```

---

## Troubleshooting

### API Returns 500 Error

**Possible causes:**
1. Missing Google Maps API key
2. Invalid coordinates
3. Database connection issues

**Solution:**
```bash
# Check API keys
echo $GOOGLE_MAPS_API_KEY_BACKEND
echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Test with curl
curl -X POST http://localhost:3000/api/street-view/validate \
  -H "Content-Type: application/json" \
  -d '{"boothId":"test","latitude":37.7749,"longitude":-122.4194}'
```

### Validation Script Fails

**Possible causes:**
1. Missing SUPABASE_SERVICE_ROLE_KEY
2. API endpoint not running
3. Rate limit exceeded

**Solution:**
```bash
# Check environment
echo $SUPABASE_SERVICE_ROLE_KEY

# Test API endpoint
curl http://localhost:3000/api/street-view/validate

# Reduce rate limit
RATE_LIMIT=5 node scripts/validate-street-views.js
```

### Street View Not Showing

**Possible causes:**
1. Validated as unavailable
2. Missing coordinates
3. Invalid address

**Solution:**
```sql
-- Check booth validation status
SELECT
  name,
  latitude,
  longitude,
  street_view_available,
  street_view_distance_meters,
  street_view_validated_at
FROM booths
WHERE slug = 'your-booth-slug';
```

---

## Future Enhancements

### Phase 6: User Feedback System (Not Implemented)

**Planned features:**
- Report incorrect Street View button (placeholder exists)
- Admin notification system
- Re-validation queue
- User-submitted corrections

**Implementation file:** TBD

### Potential Improvements

1. **Static Image Preview:** Use Street View Static API for faster loading
2. **Batch API Calls:** Validate multiple booths per API call
3. **Caching:** Cache validation results in Redis
4. **Webhooks:** Automatic re-validation on booth updates
5. **Analytics:** Track Street View usage and accuracy

---

## Files Created/Modified

### New Files ✅
1. `/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20260102_add_street_view_validation.sql`
2. `/Users/jkw/Projects/booth-beacon-app/src/app/api/street-view/validate/route.ts`
3. `/Users/jkw/Projects/booth-beacon-app/scripts/validate-street-views.js`
4. `/Users/jkw/Projects/booth-beacon-app/scripts/apply-street-view-migration.js`
5. `/Users/jkw/Projects/booth-beacon-app/docs/STREET_VIEW_VALIDATION_IMPLEMENTATION.md`

### Modified Files ✅
1. `/Users/jkw/Projects/booth-beacon-app/src/types/index.ts` - Added Street View fields
2. `/Users/jkw/Projects/booth-beacon-app/src/components/booth/StreetViewEmbed.tsx` - Enhanced with validation
3. `/Users/jkw/Projects/booth-beacon-app/src/app/booth/[slug]/page.tsx` - Added validation check

---

## Success Metrics

### Immediate Goals (Week 1)
- [ ] Database schema deployed ✅ (Ready)
- [ ] Validation API functional ✅ (Ready)
- [ ] 100 booths validated manually

### Short-term Goals (Week 2-4)
- [ ] All 912 booths validated
- [ ] Street View only shown when validated
- [ ] Distance warnings displayed accurately
- [ ] Zero false-positive Street Views

### Long-term Goals (Month 2-3)
- [ ] User report system active
- [ ] Re-validation on schedule (quarterly)
- [ ] 95%+ accuracy on Street View locations
- [ ] User trust restored

---

## Support & Questions

**Implementation by:** Claude Sonnet 4.5
**Date:** January 2, 2026
**Reference Plan:** `/Users/jkw/Projects/booth-beacon-app/docs/STREET_VIEW_VALIDATION_PLAN.md`

For questions or issues, refer to:
1. Implementation plan document
2. Google Maps API documentation
3. Supabase documentation
4. This implementation guide

---

**STATUS: READY FOR DEPLOYMENT** ✅
