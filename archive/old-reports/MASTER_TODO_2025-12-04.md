# Master TODO List - December 4, 2025

## 🚨 Critical Priority: Booth Data Enrichment

### Problem Statement
Booth pages like https://boothbeacon.org/booth/barnone-gilbert have:
- ❌ No images
- ❌ Minimal name (just "Barnone" instead of "Barnone at Beer Barn, Gilbert")
- ❌ No street address (only city/state)
- ❌ Missing phone, website, hours

This affects **hundreds** of booths in the database.

---

## 📋 TODAY'S TASKS (Priority Order)

### Task 1: Create Booth Data Enrichment Script (HIGH PRIORITY)
**File to create:** `enrich-missing-booth-data.ts`

**Purpose:** Systematically fill gaps in booth data using Google Places API

**Algorithm:**
```typescript
1. Query database for booths with missing data:
   - No street address (address IS NULL or address = '')
   - No photos (photos IS NULL or photos = '[]')
   - No phone (phone IS NULL)
   - No website (website IS NULL)

2. For each booth:
   a. Build search query: "{booth.name} {booth.city}, {booth.state}"
   b. Call Google Places API: Text Search
   c. Get top result (if confidence > 0.8)
   d. Extract:
      - Full street address
      - Phone number
      - Website URL
      - Business hours
      - Photos (up to 5)
      - Google rating
      - Price level
   e. Update database

3. Validation:
   - Manual review flag if confidence < 0.8
   - Log all enrichment attempts
   - Track success rate

4. Rate limiting:
   - 10 requests/second (Google limit)
   - Batch processing: 50 booths at a time
```

**Expected Results:**
- 300-500 booths enriched with full addresses
- 200-300 booths get photos from Google
- 100-200 booths get phone/website

**Cost Estimate:** ~$5-10 for Google Places API calls

**Status:** NOT STARTED

---

### Task 2: Fix Database Schema Issues (MEDIUM PRIORITY)

#### 2a. Allow NULL City Temporarily
**Problem:** 36+ booths lost due to NOT NULL constraint

**Solution:**
```sql
-- Migration: allow-null-city.sql
ALTER TABLE booths
ALTER COLUMN city DROP NOT NULL;
```

**Impact:** Saves 36+ booths from being lost

**Status:** NOT STARTED

---

#### 2b. Add Timestamp Normalization Layer
**Problem:** 90+ updates failed due to invalid timestamp formats

**Solution:** Create `normalizeTimestamp()` utility function

```typescript
function normalizeTimestamp(input: string | null): string | null {
  if (!input) return null;

  // Handle "N/A", "Not specified", etc.
  if (['n/a', 'not specified', 'unknown'].includes(input.toLowerCase())) {
    return null;
  }

  // Parse natural language dates
  try {
    const parsed = new Date(input);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  } catch {
    return null;
  }
}
```

**Files to update:**
- `crawl-photobooth-net-improved.ts`
- `crawl-federated-nuclear-option.ts`
- `crawl-all-sources.ts`

**Status:** NOT STARTED

---

### Task 3: Retry Failed Crawler Sources (MEDIUM PRIORITY)

**Failed sources (Firecrawl timeouts):**
1. photoautomat.de (German operator)
2. automatfoto.se (Swedish operator)
3. fotoautomatwien.com (Austrian operator)

**Strategy:** Increase timeout from 30s to 60s

**Expected yield:** 20-30 additional booths

**Status:** NOT STARTED

---

### Task 4: Improve Geocoding Success Rate (MEDIUM PRIORITY)

**Current:** 79/150 success (53%)
**Target:** 120/150 success (80%)

**Improvements:**
1. Better address normalization (remove venue name from address field)
2. Fallback to approximate coordinates (city center if exact address fails)
3. Manual review queue for failed geocodes

**Files to update:**
- `geocode-photobooth-booths.ts`

**Status:** NOT STARTED

---

### Task 5: Generate More AI Descriptions (LOW PRIORITY)

**Current:** 50 descriptions
**Target:** 200+ descriptions

**Approach:**
```bash
ANTHROPIC_API_KEY=<key> \
SUPABASE_SERVICE_ROLE_KEY=<key> \
NEXT_PUBLIC_SUPABASE_URL=<url> \
npx tsx generate-booth-descriptions.ts
```

**Limit:** Process 150 more descriptions

**Cost Estimate:** ~$5-7 for 150 descriptions

**Status:** NOT STARTED

---

### Task 6: Request Sonnet API Access (HIGH PRIORITY)

**Urgency:** Opus deprecates January 5, 2026 (32 days)

**Action:**
1. Contact Anthropic support
2. Request access to `claude-3-5-sonnet-20241022`
3. Update API key if needed
4. Test with `test-anthropic-api.ts`

**Impact:** Future-proofs AI features

**Status:** NOT STARTED

---

### Task 7: Get Unrestricted Google Maps API Key (MEDIUM PRIORITY)

**Current issue:** HTTP referer restrictions prevent server-side use

**Action:**
1. Go to Google Cloud Console
2. Create new API key (or remove restrictions from existing)
3. Enable APIs:
   - Places API
   - Geocoding API
   - Maps Static API (for images)
4. Update environment variables
5. Test with enrichment script

**Impact:** Unlocks full enrichment capabilities

**Status:** NOT STARTED

---

## 📦 Deliverables for Today

### Must Have (P0)
- [ ] `enrich-missing-booth-data.ts` - Booth enrichment script
- [ ] Database schema fix (allow NULL city)
- [ ] Timestamp normalization utility

### Should Have (P1)
- [ ] Retry failed crawler sources (3 operators)
- [ ] Improve geocoding (normalize addresses)
- [ ] Request Sonnet API access

### Nice to Have (P2)
- [ ] Generate 150 more AI descriptions
- [ ] Get unrestricted Google Maps API key
- [ ] Manual review queue for low-confidence geocodes

---

## 🎯 Success Criteria

By end of day, we should have:

1. **Enrichment script operational**
   - At least 100 booths enriched with full addresses
   - Photo coverage increased from 40% to 60%

2. **Database issues resolved**
   - No more NULL city constraint violations
   - No more timestamp parsing errors

3. **Data quality improved**
   - Address completeness: 70% → 85%
   - Photo coverage: 40% → 60%
   - Contact info: 30% → 50%

---

## 🔧 Implementation Plan: Booth Enrichment Script

### File: `enrich-missing-booth-data.ts`

```typescript
/**
 * BOOTH DATA ENRICHMENT SCRIPT
 *
 * Fills gaps in booth data using Google Places API:
 * - Full street addresses
 * - Phone numbers
 * - Websites
 * - Business hours
 * - Photos from Google
 * - Ratings and reviews
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BoothEnrichment {
  booth_id: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  photos?: string[];
  google_rating?: number;
  google_place_id?: string;
  enrichment_confidence: number;
  enriched_at: string;
}

/**
 * Search Google Places for a booth
 */
async function searchGooglePlaces(
  boothName: string,
  city: string,
  state: string
): Promise<any> {
  const query = `${boothName} ${city}, ${state}`;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY!;

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results.length) {
    return null;
  }

  // Return top result (highest confidence)
  return data.results[0];
}

/**
 * Get detailed place information
 */
async function getPlaceDetails(placeId: string): Promise<any> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY!;
  const fields = 'formatted_address,formatted_phone_number,website,opening_hours,photos,rating,price_level';

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    return null;
  }

  return data.result;
}

/**
 * Calculate confidence score for enrichment
 */
function calculateConfidence(
  boothName: string,
  placeName: string,
  city: string,
  placeCity: string
): number {
  let confidence = 0;

  // Name similarity (fuzzy match)
  const boothLower = boothName.toLowerCase();
  const placeLower = placeName.toLowerCase();

  if (placeLower.includes(boothLower) || boothLower.includes(placeLower)) {
    confidence += 50;
  } else {
    // Check for partial word matches
    const boothWords = boothLower.split(/\s+/);
    const placeWords = placeLower.split(/\s+/);
    const matches = boothWords.filter(w => placeWords.includes(w)).length;
    confidence += (matches / boothWords.length) * 30;
  }

  // City match (exact)
  if (city.toLowerCase() === placeCity.toLowerCase()) {
    confidence += 40;
  }

  // Business type indicators
  if (placeLower.includes('bar') || placeLower.includes('cafe') ||
      placeLower.includes('hotel') || placeLower.includes('club')) {
    confidence += 10;
  }

  return Math.min(confidence, 100);
}

/**
 * Enrich a single booth
 */
async function enrichBooth(booth: any): Promise<BoothEnrichment | null> {
  console.log(`\n📍 ${booth.name} (${booth.city}, ${booth.state})`);

  // Search Google Places
  const place = await searchGooglePlaces(booth.name, booth.city, booth.state || '');

  if (!place) {
    console.log(`   ❌ No results found`);
    return null;
  }

  // Calculate confidence
  const confidence = calculateConfidence(
    booth.name,
    place.name,
    booth.city,
    place.formatted_address.split(',').slice(-2)[0].trim()
  );

  console.log(`   Matched: "${place.name}" (Confidence: ${confidence}%)`);

  if (confidence < 70) {
    console.log(`   ⚠️  Low confidence - skipping`);
    return null;
  }

  // Get detailed information
  const details = await getPlaceDetails(place.place_id);

  if (!details) {
    console.log(`   ❌ Failed to get details`);
    return null;
  }

  // Extract photos
  const photos = details.photos?.slice(0, 5).map((photo: any) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
  }) || [];

  // Build enrichment data
  const enrichment: BoothEnrichment = {
    booth_id: booth.id,
    address: details.formatted_address,
    phone: details.formatted_phone_number,
    website: details.website,
    hours: details.opening_hours?.weekday_text?.join('\n'),
    photos: photos.length > 0 ? photos : undefined,
    google_rating: details.rating,
    google_place_id: place.place_id,
    enrichment_confidence: confidence,
    enriched_at: new Date().toISOString()
  };

  console.log(`   ✅ Enriched:`);
  if (enrichment.address) console.log(`      Address: ${enrichment.address}`);
  if (enrichment.phone) console.log(`      Phone: ${enrichment.phone}`);
  if (enrichment.website) console.log(`      Website: ${enrichment.website}`);
  if (enrichment.photos) console.log(`      Photos: ${enrichment.photos.length}`);
  if (enrichment.google_rating) console.log(`      Rating: ${enrichment.google_rating}/5`);

  return enrichment;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 BOOTH DATA ENRICHMENT\n');
  console.log('='.repeat(60));

  const BATCH_SIZE = parseInt(process.argv[2] || '50');
  console.log(`Batch size: ${BATCH_SIZE} booths\n`);

  // Get booths needing enrichment
  const { data: booths, error } = await supabase
    .from('booths')
    .select('*')
    .eq('status', 'active')
    .or('address.is.null,photos.is.null,phone.is.null,website.is.null')
    .limit(BATCH_SIZE);

  if (error) {
    console.error('Error fetching booths:', error);
    return;
  }

  if (!booths || booths.length === 0) {
    console.log('No booths need enrichment!');
    return;
  }

  console.log(`Found ${booths.length} booths needing enrichment\n`);

  let enriched = 0;
  let skipped = 0;
  let errors = 0;

  for (const booth of booths) {
    try {
      const enrichment = await enrichBooth(booth);

      if (!enrichment) {
        skipped++;
        continue;
      }

      // Update database
      const { error: updateError } = await supabase
        .from('booths')
        .update({
          address: enrichment.address || booth.address,
          phone: enrichment.phone || booth.phone,
          website: enrichment.website || booth.website,
          hours: enrichment.hours || booth.hours,
          photos: enrichment.photos || booth.photos,
          google_rating: enrichment.google_rating,
          google_place_id: enrichment.google_place_id,
          enrichment_confidence: enrichment.enrichment_confidence,
          enriched_at: enrichment.enriched_at
        })
        .eq('id', booth.id);

      if (updateError) {
        console.error(`   ❌ Update failed: ${updateError.message}`);
        errors++;
      } else {
        enriched++;
      }

      // Rate limiting: 10 requests per second
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Enriched: ${enriched}`);
  console.log(`⚠️  Skipped: ${skipped} (low confidence)`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(60));
  console.log('\n✨ Done!');
}

main().catch(console.error);
```

**Usage:**
```bash
GOOGLE_MAPS_API_KEY=<key> \
SUPABASE_SERVICE_ROLE_KEY=<key> \
NEXT_PUBLIC_SUPABASE_URL=<url> \
npx tsx enrich-missing-booth-data.ts 50
```

---

## 🗺️ Detailed Roadmap

### Phase 1: Foundation (Today)
- [ ] Booth enrichment script
- [ ] Database schema fixes
- [ ] Timestamp normalization

### Phase 2: Data Quality (This Week)
- [ ] Enrich 500+ booths with Google data
- [ ] Improve geocoding to 80% success rate
- [ ] Generate 200+ AI descriptions
- [ ] Retry failed crawler sources

### Phase 3: Visual Polish (Next Week)
- [ ] Generate AI images for booths without photos
- [ ] Upload images to Supabase Storage
- [ ] Update booth pages with images
- [ ] Add photo gallery component

### Phase 4: Community Features (Week 3-4)
- [ ] User photo uploads
- [ ] Visit verification ("I was here")
- [ ] Comments/reviews system
- [ ] Report incorrect data

---

## 📊 Progress Tracking

Use this checklist throughout the day:

### Morning (9am-12pm)
- [ ] Create `enrich-missing-booth-data.ts`
- [ ] Get unrestricted Google Maps API key
- [ ] Test enrichment on 10 booths
- [ ] Fix database schema (allow NULL city)

### Afternoon (12pm-3pm)
- [ ] Run enrichment on 100 booths
- [ ] Add timestamp normalization to crawlers
- [ ] Retry failed sources with increased timeout
- [ ] Generate 50 more AI descriptions

### Evening (3pm-6pm)
- [ ] Run enrichment on 200 more booths
- [ ] Improve geocoding logic
- [ ] Test all fixes on production data
- [ ] Update documentation

---

## ⚡ Quick Commands Reference

```bash
# Run enrichment (50 booths)
GOOGLE_MAPS_API_KEY=<key> SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> npx tsx enrich-missing-booth-data.ts 50

# Generate AI descriptions (50 more)
ANTHROPIC_API_KEY=<key> SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> npx tsx generate-booth-descriptions.ts

# Retry failed sources
FIRECRAWL_API_KEY=<key> SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> npx tsx retry-failed-sources.ts

# Improve geocoding
SUPABASE_SERVICE_ROLE_KEY=<key> NEXT_PUBLIC_SUPABASE_URL=<url> npx tsx geocode-photobooth-booths.ts

# Test Anthropic API access
ANTHROPIC_API_KEY=<key> npx tsx test-anthropic-api.ts

# Build and deploy
npm run build && git add . && git commit -m "feat: Booth data enrichment pipeline" && git push
```

---

## 🎯 Definition of Done

Today is successful when:

1. ✅ Enrichment script exists and works
2. ✅ At least 100 booths enriched with full addresses
3. ✅ Photo coverage increased by 20%
4. ✅ Database constraint issues fixed
5. ✅ Timestamp parsing errors eliminated
6. ✅ Documentation updated

---

## 🚀 Let's Make It Happen!

**Focus:** Transform sparse booth listings into rich, complete pages that excite users to visit.

**Goal:** By end of day, booth pages should have:
- ✅ Full street addresses (not just city/state)
- ✅ Multiple photos from Google
- ✅ Contact information (phone/website)
- ✅ Business hours
- ✅ Google ratings

**The path is clear. Let's execute.**
