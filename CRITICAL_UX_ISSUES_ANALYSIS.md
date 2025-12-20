# Critical UX Issues Analysis - Cat Cafe Ragdoll Booth

**Date:** December 20, 2025
**Test URL:** http://localhost:3000/booth/cat-cafe-ragdoll-osaka
**Status:** 🚨 Multiple critical data quality and UX issues identified

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### 1. **False Photo Metadata Displayed as Booth Description**

**Problem:**
- Description shows: "Photographer: jimmie, Uploaded: 2018-03-14, Camera: Canon AV-1, Film: Lomography Color Negative 35 mm ISO 400..."
- This is metadata about a PHOTO posted on Lomography, NOT information about the booth itself
- Crawler mistakenly extracted photo metadata instead of booth information

**Root Cause:**
- Lomography pages show photo galleries with detailed EXIF data
- Our crawler extracted the photo metadata and put it in the `description` field
- The page displays this description verbatim without validation

**Impact:** HIGH - Confuses users, makes site look unprofessional, provides no useful booth information

**Location in Code:**
- Database: `booths.description` field contains bad data
- Display: `src/app/booth/[slug]/page.tsx:515-518`

---

### 2. **Incorrect Operator Information**

**Problem:**
- Shows "Operator: jimmie"
- "jimmie" is the photographer who uploaded a photo to Lomography, NOT the booth operator

**Root Cause:**
- Crawler extracted photographer name from Lomography and stored it as `operator_name`
- Same data quality issue as #1

**Impact:** MEDIUM - Incorrect attribution, potentially embarrassing if "jimmie" sees this

**Location in Code:**
- Database: `booths.operator_name = "jimmie"`
- Display: `src/app/booth/[slug]/page.tsx:544-548`

---

### 3. **Inaccurate Operational Status**

**Problem:**
- Badge says "✓ Currently Operational"
- Database shows `status: "active"` and `is_operational: true`
- But data is from 2018 (7 years old) with no recent verification
- Likely the booth is closed/removed

**Root Cause:**
- Crawler sets all booths to `active` and `is_operational: true` by default
- No verification process for old data
- `last_verified: 2025-12-03` is crawler timestamp, not actual human verification

**Impact:** HIGH - Users may waste time traveling to closed locations

**Location in Code:**
- Database: `booths.status`, `booths.is_operational`, `booths.last_verified`
- Display: Quick info pills show green "Currently Operational" badge

---

### 4. **Street View Showing Wrong Location**

**Problem:**
- Street View points to alleyway/construction zone, not booth location
- Looks unprofessional and confusing

**Root Cause:**
- Address is just "Osaka" (city name only)
- Geocoding returned coordinates for city center: (34.667726, 135.5036458)
- No actual booth address available
- Street View uses these city-center coordinates

**Impact:** HIGH - Misleading users, poor user experience

**Location in Code:**
- Database: `booths.address = "Osaka"`, coordinates are city center
- Display: `src/app/booth/[slug]/page.tsx:636-644` - StreetViewEmbed component

---

### 5. **"Booths Nearby" Section Failing to Load**

**Problem:**
- Section shows loading state or error
- Console shows error: "Error fetching booths nearby"

**Root Cause:**
- Only 1 booth exists in Japan (this one)
- CityBooths component filters by city="Osaka", country="Japan", excludes current booth
- Results in 0 booths found
- Component may be showing error state instead of gracefully hiding

**Impact:** MEDIUM - Broken UI element, looks incomplete

**Location in Code:**
- Component: `src/components/booth/CityBooths.tsx`
- Query filters return 0 results

---

### 6. **Irrelevant "Other Booths You May Like" Recommendations**

**Problem:**
- Showing booths from: India, Austria, Atlanta (USA), Chicago (USA)
- User is viewing a booth in Osaka, Japan
- No geographic relevance

**Root Cause:**
- NearbyBooths or SimilarBooths component has fallback logic
- When no nearby booths found, falls back to showing recent/random booths globally
- No geographic filtering in fallback

**Impact:** MEDIUM - Poor recommendations, breaks user context

**Location in Code:**
- Components: `src/components/booth/NearbyBooths.tsx` or `src/components/booth/SimilarBooths.tsx`
- Fallback query showing global results

---

### 7. **Low Text Contrast / Readability Issues**

**Problem:**
- Some text is hard to read
- Vintage color palette may have insufficient contrast ratios
- Affects accessibility (WCAG guidelines)

**Root Cause:**
- Amber/orange vintage colors on light backgrounds
- May not meet WCAG AA contrast ratio (4.5:1 for normal text)

**Impact:** MEDIUM - Accessibility issue, user frustration

**Location in Code:**
- `src/app/globals.css` - Vintage color variables
- Various text elements using vintage colors

---

### 8. **AI Image Spacing Inconsistency**

**Problem:**
- AI preview image has different spacing than rest of page
- Looks visually inconsistent

**Root Cause:**
- Photo strip borders applied to AI images may have different padding/margins
- Or different aspect ratio handling

**Impact:** LOW - Visual polish issue

**Location in Code:**
- `src/components/booth/BoothImage.tsx` - Photo strip border styling
- CSS: `.photo-strip-border` and `.ai-image-sepia` classes

---

## 📊 DATA QUALITY STATS

**Current Booth Data:**
```json
{
  "name": "Cat Cafe \"Ragdoll\"",
  "address": "Osaka",
  "city": "Osaka",
  "country": "Japan",
  "status": "active",
  "is_operational": true,
  "operator_name": "jimmie",
  "description": "Photographer: jimmie, Uploaded: 2018-03-14, Camera: Canon AV-1, Film: Lomography Color Negative 35 mm ISO 400...",
  "source_primary": "Lomography",
  "last_verified": "2025-12-03T03:05:06.536+00:00",
  "created_at": "2025-12-03T03:05:18.21366+00:00"
}
```

**Data Quality Score:** 2/10 ⚠️

**Issues:**
- ❌ No street address (only city name)
- ❌ Description contains photo metadata, not booth info
- ❌ Operator name is photographer, not operator
- ❌ Status likely incorrect (7-year-old data)
- ❌ No real photos (only AI generated)
- ❌ No hours, cost, payment info
- ✅ Has coordinates (but for city center, not exact location)
- ✅ Has AI preview image

---

## 🎯 RECOMMENDED FIXES

### Priority 1: Critical Data Quality (This Week)

#### 1.1 Fix Description Field Parsing
**Action:** Clean up descriptions that contain photo metadata

```sql
-- Identify booths with photo metadata in description
SELECT id, name, description
FROM booths
WHERE description LIKE '%Photographer:%'
   OR description LIKE '%Camera:%'
   OR description LIKE '%Film:%'
   OR description LIKE '%Uploaded:%';

-- Option A: Clear bad descriptions
UPDATE booths
SET description = NULL
WHERE description LIKE '%Photographer:%';

-- Option B: Extract useful info (city, location) and discard metadata
-- Would need custom script to parse and restructure
```

**Estimated:** 50-100 booths affected

#### 1.2 Fix Operator Name Field
**Action:** Clear incorrect operator names

```sql
-- Clear operator names from photo metadata
UPDATE booths
SET operator_name = NULL
WHERE source_primary = 'Lomography'
  AND operator_name IS NOT NULL;
```

#### 1.3 Add Data Quality Flags
**Action:** Mark booths with unverified/old data

```sql
-- Add flag for unverified booths
ALTER TABLE booths ADD COLUMN needs_verification BOOLEAN DEFAULT FALSE;

-- Flag old data as needing verification
UPDATE booths
SET needs_verification = TRUE,
    status = 'unverified'
WHERE source_primary = 'Lomography'
  AND last_verified < NOW() - INTERVAL '1 year';
```

#### 1.4 Update Quick Info Pills Logic
**Action:** Don't show "Currently Operational" for unverified/old data

```typescript
// src/app/booth/[slug]/page.tsx
// Change logic to check verification date
{booth.status === 'active' && booth.is_operational && !booth.needs_verification && (
  <span className="bg-green-500 text-white px-3 py-1.5 text-sm font-medium rounded-md">
    ✓ Currently Operational
  </span>
)}

// Add "Unverified" badge for old data
{booth.needs_verification && (
  <span className="bg-amber-500 text-white px-3 py-1.5 text-sm font-medium rounded-md">
    ⚠️ Needs Verification
  </span>
)}
```

---

### Priority 2: UX Improvements (This Week)

#### 2.1 Hide Empty Sections Gracefully
**Action:** Don't show "Booths Nearby" if 0 results

```typescript
// src/components/booth/CityBooths.tsx
// Add early return if no booths found
if (!loading && booths.length === 0) {
  return null; // Don't render anything
}
```

#### 2.2 Improve Recommendations Logic
**Action:** Show country-based recommendations as fallback, not global

```typescript
// When no city matches, show country matches
// When no country matches, show region matches (Asia, Europe, etc.)
// Only show global as last resort
```

#### 2.3 Fix Street View for Vague Addresses
**Action:** Don't show Street View when address is just city name

```typescript
// src/app/booth/[slug]/page.tsx
// Only show Street View if we have a proper address
{hasValidLocation &&
 booth.latitude &&
 booth.longitude &&
 booth.address &&
 booth.address !== booth.city && // Not just city name
 (
  <div>
    <h2 className="text-xl font-semibold mb-4">Street View</h2>
    <StreetViewEmbed ... />
  </div>
)}
```

#### 2.4 Improve Contrast for Accessibility
**Action:** Test and adjust color values for WCAG AA compliance

```css
/* src/app/globals.css */
/* Darken text colors for better contrast */
--color-vintage-text: hsl(30 30% 25%); /* Darker text */
--color-vintage-text-secondary: hsl(30 20% 40%); /* Darker secondary */

/* Ensure badges have sufficient contrast */
.badge-operational {
  background: hsl(142 76% 36%); /* Darker green */
  color: white;
}
```

---

### Priority 3: Crawler Improvements (Next Sprint)

#### 3.1 Enhance Lomography Extraction
**Action:** Update extractor to distinguish photo metadata from booth info

```typescript
// In unified-crawler extractor for Lomography
// Separate photo metadata from booth information
// Store photo data in booth_photos table, not description field
```

#### 3.2 Add Verification Workflow
**Action:** Create review queue for crawler-extracted booths

- Admin dashboard showing booths needing review
- Quick approve/reject/edit interface
- Confidence scoring based on data completeness
- Community verification system (users can report issues)

---

## 🔍 TESTING CHECKLIST

After implementing fixes:

- [ ] Verify description field shows useful booth info or nothing
- [ ] Confirm operator field is cleared for Lomography booths
- [ ] Check status badges reflect verification state accurately
- [ ] Test Street View only shows for proper addresses
- [ ] Verify "Booths Nearby" hides when 0 results
- [ ] Test recommendations show geographically relevant booths
- [ ] Run accessibility audit (Lighthouse, axe DevTools)
- [ ] Check text contrast ratios meet WCAG AA standards
- [ ] Verify image spacing is consistent across all booth types

---

## 📈 IMPACT ASSESSMENT

**Affected Booths:**
- Lomography source: ~50-100 booths (estimate)
- All booths with city-only addresses: ~300 booths (estimate)
- Booths in countries with <5 locations: ~150 booths (estimate)

**User Impact:**
- Current state: Users may waste time traveling to closed/wrong locations
- After fixes: Clear indication of data uncertainty, better recommendations

**Business Impact:**
- Current: Low trust in data accuracy
- After fixes: Improved credibility, better user experience

---

## 🎯 SUCCESS METRICS

**Before Fixes:**
- Data quality score: 2/10 for this booth
- User confusion: High (misleading info)
- Bounce rate: Likely high for poor-data booths

**After Fixes:**
- Data quality score: 6/10 (honest about limitations)
- User trust: Higher (clear verification status)
- Bounce rate: Lower (accurate expectations)

---

## 💡 LONG-TERM RECOMMENDATIONS

1. **Community Verification System**
   - Allow users to verify booth status
   - Add photos from visits
   - Report closures/changes
   - Gamify with points/badges

2. **Data Quality Dashboard**
   - Show completeness scores
   - Flag low-quality data
   - Track verification progress
   - Prioritize high-traffic booths

3. **Smart Recommendations**
   - Use collaborative filtering
   - Consider user's saved booths
   - Show booths on user's travel routes
   - Seasonal recommendations (summer cities, etc.)

4. **Address Verification Service**
   - Validate addresses before display
   - Use Google Places API to verify
   - Fallback to city-level coordinates
   - Show confidence level to users

---

**Analysis Date:** December 20, 2025
**Next Review:** After Priority 1 fixes implemented
**Document Owner:** Claude Code + User Review
