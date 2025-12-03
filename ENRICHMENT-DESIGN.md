# Booth Enrichment System Design

## Overview
Enrich booth pages with real-time business data from Google Maps/Places API including hours, contact info, ratings, and photos.

---

## Current Booth Schema (src/lib/supabase/types.ts:19)

### Already Exists
- `hours: string | null` - Operating hours (line 58)
- `description: string | null` - Booth description (line 64)
- `website: string | null` - NOT in Booth (only in Operator line 85)

### Missing Fields Needed for Enrichment
```typescript
// Contact & Social
phone: string | null
email: string | null
website: string | null           // Booth-specific website
instagram: string | null         // Booth-specific Instagram

// Google Maps Integration
google_place_id: string | null
google_rating: number | null     // 1.0-5.0
google_user_ratings_total: number | null
google_photos: string[] | null   // Array of Google photo URLs
google_enriched_at: string | null // Timestamp of last enrichment
google_business_status: string | null // 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'

// Additional Google Data
google_formatted_address: string | null  // Google's standardized address
google_phone: string | null              // Google's formatted phone number
google_website: string | null            // Website from Google listing
google_opening_hours: any | null         // Structured opening hours from Google
```

---

## Architecture

### 1. Database Schema Changes

**New Table: `booth_enrichments`**
Tracks enrichment status and history separately from core booth data.

```sql
CREATE TABLE booth_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,

  -- Google enrichment status
  google_attempted_at TIMESTAMP,
  google_enriched_at TIMESTAMP,
  google_error TEXT,
  google_place_id TEXT,

  -- Enrichment data (JSONB for flexibility)
  google_data JSONB,

  -- Meta
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT booth_enrichments_booth_id_key UNIQUE (booth_id)
);

CREATE INDEX idx_booth_enrichments_booth_id ON booth_enrichments(booth_id);
CREATE INDEX idx_booth_enrichments_place_id ON booth_enrichments(google_place_id);
CREATE INDEX idx_booth_enrichments_attempted ON booth_enrichments(google_attempted_at);
```

**Booth Table Updates**
Add denormalized fields to booths table for fast page loads:

```sql
ALTER TABLE booths ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1);
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_user_ratings_total INTEGER;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_photos TEXT[];
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_enriched_at TIMESTAMP;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS google_business_status TEXT;

CREATE INDEX idx_booths_google_place_id ON booths(google_place_id);
CREATE INDEX idx_booths_google_enriched ON booths(google_enriched_at);
CREATE INDEX idx_booths_google_rating ON booths(google_rating);
```

---

### 2. Google Maps API Integration

**Required API: Places API (New)**
- Text Search: Find places by booth name + location
- Place Details: Get detailed info including hours, contact, photos, reviews
- Pricing: $17 per 1,000 Place Details requests

**Flow:**
1. **Text Search** to find Place ID
   - Query: `"[booth_name]" photo booth near [address]`
   - Returns: place_id, name, formatted_address
   - Cost: $0.032 per request

2. **Place Details** to get enrichment data
   - Input: place_id
   - Fields: name, formatted_address, formatted_phone_number, website, opening_hours, rating, user_ratings_total, photos, business_status, url
   - Cost: $0.017 per request
   - **Total per booth: ~$0.049**

---

### 3. Enrichment Strategy

**Priority Tiers:**
1. **High Priority (Enrich First)**
   - Active booths with coordinates
   - Booths with >100 views in last 30 days
   - Recently added booths (< 7 days old)

2. **Medium Priority**
   - Active booths without recent enrichment (> 90 days)
   - Booths with missing critical data (no hours, no phone)

3. **Low Priority**
   - Inactive/closed booths
   - Booths with recent failed enrichment attempts

**Rate Limiting:**
- 100 enrichments per hour max
- 1,000 enrichments per day max
- Retry failed enrichments after 7 days

---

### 4. Supabase Edge Function: `enrich-booth`

```typescript
// supabase/functions/enrich-booth/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface EnrichmentRequest {
  boothId?: string;        // Single booth
  batch?: boolean;         // Batch mode (processes priority queue)
  limit?: number;          // Max booths to process in batch
}

async function enrichBooth(boothId: string, supabase: any, googleApiKey: string) {
  // 1. Get booth data
  const { data: booth } = await supabase
    .from('booths')
    .select('*')
    .eq('id', boothId)
    .single();

  if (!booth) throw new Error('Booth not found');

  // 2. Check if recently enriched (skip if < 90 days)
  if (booth.google_enriched_at) {
    const lastEnriched = new Date(booth.google_enriched_at);
    const daysSince = (Date.now() - lastEnriched.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 90) {
      return { skipped: true, reason: 'Recently enriched' };
    }
  }

  // 3. Record attempt
  await supabase
    .from('booth_enrichments')
    .upsert({
      booth_id: boothId,
      google_attempted_at: new Date().toISOString(),
    });

  try {
    // 4. Text Search - Find Place ID
    const searchQuery = `"${booth.name}" photo booth near ${booth.address}, ${booth.city}`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleApiKey}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' || searchData.results.length === 0) {
      throw new Error(`No Google Place found: ${searchData.status}`);
    }

    const placeId = searchData.results[0].place_id;

    // 5. Place Details - Get enrichment data
    const fields = [
      'name',
      'formatted_address',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'opening_hours',
      'rating',
      'user_ratings_total',
      'photos',
      'business_status',
      'url'
    ].join(',');

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${googleApiKey}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK') {
      throw new Error(`Place Details failed: ${detailsData.status}`);
    }

    const place = detailsData.result;

    // 6. Extract photo URLs (max 5)
    const photoUrls = place.photos?.slice(0, 5).map((photo: any) =>
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${googleApiKey}`
    ) || [];

    // 7. Update booth with enrichment data
    await supabase
      .from('booths')
      .update({
        phone: place.formatted_phone_number || place.international_phone_number,
        website: place.website,
        google_place_id: placeId,
        google_rating: place.rating,
        google_user_ratings_total: place.user_ratings_total,
        google_photos: photoUrls,
        google_enriched_at: new Date().toISOString(),
        google_business_status: place.business_status,
        hours: place.opening_hours?.weekday_text?.join('\n') || booth.hours, // Don't overwrite if Google has no hours
        updated_at: new Date().toISOString(),
      })
      .eq('id', boothId);

    // 8. Store full enrichment data
    await supabase
      .from('booth_enrichments')
      .update({
        google_enriched_at: new Date().toISOString(),
        google_place_id: placeId,
        google_data: place,
        google_error: null,
      })
      .eq('booth_id', boothId);

    return {
      success: true,
      boothId,
      placeId,
      enriched: {
        phone: !!place.formatted_phone_number,
        website: !!place.website,
        rating: !!place.rating,
        photos: photoUrls.length,
        hours: !!place.opening_hours,
      },
    };

  } catch (error: any) {
    // Record error
    await supabase
      .from('booth_enrichments')
      .update({
        google_error: error.message,
      })
      .eq('booth_id', boothId);

    return {
      success: false,
      boothId,
      error: error.message,
    };
  }
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')!;

  const body: EnrichmentRequest = await req.json();

  if (body.boothId) {
    // Single booth enrichment
    const result = await enrichBooth(body.boothId, supabase, googleApiKey);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (body.batch) {
    // Batch enrichment - process priority queue
    const limit = body.limit || 100;

    // Get booths needing enrichment (priority order)
    const { data: booths } = await supabase
      .from('booths')
      .select('id, name')
      .eq('status', 'active')
      .not('latitude', 'is', null)
      .or('google_enriched_at.is.null,google_enriched_at.lt.' + new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    const results = [];
    for (const booth of booths || []) {
      const result = await enrichBooth(booth.id, supabase, googleApiKey);
      results.push(result);

      // Rate limit: 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return new Response(JSON.stringify({
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Missing boothId or batch parameter' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

### 5. Frontend Integration

**Booth Page Display (src/app/booth/[id]/page.tsx)**

```typescript
// Show enriched data on booth pages

{booth.google_rating && (
  <div className="flex items-center gap-2">
    <span className="text-yellow-500">★</span>
    <span className="font-semibold">{booth.google_rating.toFixed(1)}</span>
    <span className="text-gray-600">({booth.google_user_ratings_total} reviews)</span>
  </div>
)}

{booth.phone && (
  <a href={`tel:${booth.phone}`} className="flex items-center gap-2 hover:underline">
    <Phone className="w-4 h-4" />
    {booth.phone}
  </a>
)}

{booth.website && (
  <a href={booth.website} target="_blank" rel="noopener" className="flex items-center gap-2 hover:underline">
    <Globe className="w-4 h-4" />
    Visit Website
  </a>
)}

{booth.instagram && (
  <a href={`https://instagram.com/${booth.instagram}`} target="_blank" rel="noopener">
    <Instagram className="w-4 h-4" />
    @{booth.instagram}
  </a>
)}

{booth.google_photos && booth.google_photos.length > 0 && (
  <div className="grid grid-cols-3 gap-2 mt-4">
    {booth.google_photos.map((url, i) => (
      <img key={i} src={url} alt={`${booth.name} photo ${i+1}`} className="rounded-lg" />
    ))}
  </div>
)}
```

**Admin Panel - Enrichment Dashboard**

```typescript
// src/app/admin/enrichments/page.tsx

- Show enrichment stats (total enriched, pending, failed)
- Trigger manual enrichment for single booth
- Trigger batch enrichment
- View enrichment history and errors
- Re-enrich stale booths (>90 days)
```

---

### 6. Automation

**Supabase Cron Job**
Run batch enrichment daily:

```sql
-- supabase/migrations/YYYYMMDD_enrichment_cron.sql

SELECT cron.schedule(
  'daily-booth-enrichment',
  '0 2 * * *', -- 2 AM UTC daily
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_ID].supabase.co/functions/v1/enrich-booth',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb,
    body := '{"batch": true, "limit": 100}'::jsonb
  ) AS request_id;
  $$
);
```

---

## Cost Estimation

### Google Maps API Costs
- **Text Search**: $0.032 per request
- **Place Details**: $0.017 per request (with selected fields)
- **Photo**: $0.007 per photo (up to 5 per booth)
- **Total per booth**: ~$0.084

### Monthly Costs (1,000 booths)
- Initial enrichment: $84
- Re-enrichment (90-day cycle): ~$28/month
- **Total: ~$28-50/month for 1,000 booths**

### API Rate Limits
- 100 requests per second (Text Search + Place Details combined)
- Daily limit: Based on billing account (default 1,000/day, increase as needed)

---

## Implementation Phases

### Phase 1: Database Setup (Week 1)
- [ ] Create migration for new fields
- [ ] Create booth_enrichments table
- [ ] Add indexes
- [ ] Update TypeScript types

### Phase 2: Edge Function (Week 1-2)
- [ ] Implement enrich-booth edge function
- [ ] Add Google Maps API integration
- [ ] Test single booth enrichment
- [ ] Test batch enrichment
- [ ] Add error handling and retry logic

### Phase 3: Frontend Display (Week 2)
- [ ] Update booth page to show enriched data
- [ ] Add Google rating display
- [ ] Add contact info display
- [ ] Add Google photos gallery
- [ ] Add "View on Google Maps" link

### Phase 4: Admin Dashboard (Week 3)
- [ ] Create enrichment stats dashboard
- [ ] Add manual trigger buttons
- [ ] Add enrichment history viewer
- [ ] Add error log viewer

### Phase 5: Automation (Week 3-4)
- [ ] Set up Supabase cron job
- [ ] Implement priority queue
- [ ] Add monitoring and alerts
- [ ] Test full enrichment cycle

---

## Success Metrics

- **Coverage**: % of active booths with enrichment data
- **Accuracy**: % of successful enrichments (target: >80%)
- **Freshness**: Average days since last enrichment (target: <90 days)
- **User Engagement**: Click-through rate on contact info/website
- **Cost**: Monthly API costs per 1,000 booths (target: <$50)

---

## Future Enhancements

1. **Instagram Integration**: Scrape/API for booth Instagram posts
2. **Real-time Hours**: Live operational status from Google
3. **Review Display**: Show recent Google reviews on booth pages
4. **Verification Badge**: Mark booths with verified Google listings
5. **Auto-update**: Webhook from Google when place details change
6. **Yelp Integration**: Additional reviews and photos
7. **Social Proof**: User-submitted photos vs Google photos comparison
