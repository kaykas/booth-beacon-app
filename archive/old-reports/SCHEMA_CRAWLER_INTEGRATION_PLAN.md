# Schema-Based Crawler Integration Plan

## Overview
Integrate the successful schema-based extraction approach from `crawl-photobooth-net-improved.ts` into the unified-crawler edge function.

## Current State
- **Unified Crawler** (`supabase/functions/unified-crawler/index.ts`):
  - Uses `crawlUrl()` to get HTML/markdown
  - Post-processes with custom extractors
  - Works but less accurate, misses detail pages

- **Improved Crawler** (`crawl-photobooth-net-improved.ts`):
  - Uses `crawlUrl()` with `extract` format and JSON schema
  - Firecrawl's LLM extracts structured data directly
  - Much more accurate, gets rich data from detail pages

## Integration Strategy

### Option A: Replace photobooth.net extractor entirely
**Pros:** Clean, simple, uses proven approach
**Cons:** Big change, need to test thoroughly

### Option B: Add schema extraction as opt-in feature
**Pros:** Backwards compatible, gradual rollout
**Cons:** More code complexity

### Recommendation: Option A (Replace)
The schema-based approach is proven to work better. Replace the existing photobooth.net extractor.

## Implementation Steps

### 1. Add Schema Definitions to Unified Crawler

Create `supabase/functions/unified-crawler/schemas.ts`:
```typescript
export const photoboothNetSchema = {
  type: "object",
  properties: {
    listings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Venue name" },
          location: {
            type: "object",
            properties: {
              address: { type: "string" },
              city: { type: "string" },
              state_or_province: { type: "string" },
              country: { type: "string" },
              coordinates: {
                type: "object",
                properties: {
                  latitude: { type: "number" },
                  longitude: { type: "number" }
                }
              }
            }
          },
          details: {
            type: "object",
            properties: {
              machine_type: { type: "string" },
              cost: { type: "string" },
              photo_count: { type: "number" },
              is_active: { type: "boolean" },
              payment_type: { type: "string" }
            },
            required: ["is_active"]
          },
          last_visit: { type: "string" },
          description: { type: "string" },
          operator: { type: "string" }
        },
        required: ["name", "location", "details"]
      }
    }
  },
  required: ["listings"]
};
```

### 2. Update crawl_sources Table

Add `use_schema_extraction` column:
```sql
ALTER TABLE crawl_sources
ADD COLUMN use_schema_extraction BOOLEAN DEFAULT false;

UPDATE crawl_sources
SET use_schema_extraction = true
WHERE name = 'photobooth.net';
```

### 3. Modify Firecrawl Call in index.ts

Replace current call (line ~798):
```typescript
// OLD
const result = await firecrawl.crawlUrl(source.source_url, {
  limit: pageLimit,
  scrapeOptions: {
    formats: ['markdown', 'html'],
    onlyMainContent: false,
    waitFor: domainConfig.waitFor,
    timeout: domainConfig.timeout,
  },
});

// NEW (when use_schema_extraction = true)
const result = await firecrawl.crawlUrl(source.source_url, {
  limit: pageLimit,
  scrapeOptions: source.use_schema_extraction ? {
    formats: ['extract'],
    extract: {
      schema: getSchemaForSource(source.source_name),
      systemPrompt: getSystemPromptForSource(source.source_name),
    },
    onlyMainContent: false,
    waitFor: domainConfig.waitFor,
    timeout: domainConfig.timeout,
  } : {
    formats: ['markdown', 'html'],
    onlyMainContent: false,
    waitFor: domainConfig.waitFor,
    timeout: domainConfig.timeout,
  },
  includePaths: getIncludePathsForSource(source.source_name),
  excludePaths: getExcludePathsForSource(source.source_name),
});
```

### 4. Add Schema Processing Logic

After getting crawl results:
```typescript
if (source.use_schema_extraction && page.extract) {
  // Process extracted data directly
  const booths = transformExtractedData(page.extract, source.source_name);
  allBooths.push(...booths);
} else {
  // Use existing extractor logic
  const pageResult = await extractFromSource(...);
  allBooths.push(...pageResult.booths);
}
```

### 5. Create Transform Functions

```typescript
function transformExtractedData(extract: any, sourceName: string): BoothData[] {
  if (sourceName === 'photobooth.net') {
    return transformPhotoboothNetExtract(extract);
  }
  return [];
}

function transformPhotoboothNetExtract(extract: any): BoothData[] {
  if (!extract.listings) return [];

  return extract.listings.map((booth: any) => ({
    name: booth.name || 'Unknown Booth',
    address: booth.location?.address || booth.location?.city || booth.name || 'Address Unknown',
    city: booth.location?.city || null,
    state: booth.location?.state_or_province || null,
    country: booth.location?.country || 'USA',
    latitude: booth.location?.coordinates?.latitude || null,
    longitude: booth.location?.coordinates?.longitude || null,
    source_urls: [booth.source_url || ''],
    source_primary: 'photobooth.net',
    status: booth.details?.is_active ? 'active' : 'inactive',
    booth_type: booth.details?.machine_type?.toLowerCase().includes('digital') ? 'digital' : 'analog',
    is_operational: booth.details?.is_active || false,
    description: booth.description || null,
    cost: booth.details?.cost || null,
    machine_model: booth.details?.machine_type || null,
    accepts_cash: true, // Parse from payment_type
    accepts_card: false, // Parse from payment_type
    operator_name: booth.operator || null,
    last_verified: booth.last_visit && booth.last_visit !== 'N/A' ? booth.last_visit : null,
  }));
}
```

## Testing Plan

1. **Local Test**: Test unified crawler with photobooth.net using schema extraction
2. **Verify Data**: Check database for correct booth data
3. **Compare Results**: Old extractor vs new schema extraction
4. **Production Deploy**: Deploy to Supabase edge functions

## Rollout Strategy

1. **Phase 1**: Add code, deploy, but keep `use_schema_extraction = false` for all sources
2. **Phase 2**: Enable for photobooth.net only, test for 24 hours
3. **Phase 3**: Monitor metrics (booths extracted, errors, data quality)
4. **Phase 4**: If successful, add schemas for other sources (autophoto, photomatica, etc.)

## Success Metrics

- **Before**: ~80 booths from photobooth.net with basic data
- **After**: 500+ booths with machine types, costs, active/inactive status
- **Data Quality**: >90% completeness for key fields
- **Error Rate**: <5% extraction failures

## Timeline

- **Today**: Create integration code, test locally
- **Tomorrow**: Deploy to production, enable for photobooth.net
- **Week 1**: Monitor and adjust
- **Week 2**: Add schemas for other sources

## Files to Modify

1. `supabase/functions/unified-crawler/schemas.ts` (NEW)
2. `supabase/functions/unified-crawler/index.ts` (MODIFY)
3. `supabase/migrations/YYYYMMDD_add_schema_extraction.sql` (NEW)

## Notes

- Keep old extractors as fallback
- Log when schema extraction is used vs old method
- Track extraction success rates per source
- Consider adding schema versioning for future updates
