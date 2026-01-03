# Crawl Sources Investigation Report
Date: 2026-01-03

## Summary

The `crawl_sources` table is **NOT empty** - it contains **81 records**. However, many sources may not be properly configured for crawling.

## Key Findings

### Database State
- **Total sources**: 81 records
- **Seed data file exists**: `/Users/jkw/Projects/booth-beacon-app/supabase/migrations/004_seed_crawl_sources.sql` (39 sources)
- **Schema evolved**: The table has many additional columns beyond the seed migration

### Sample Data Structure
Sources have these key fields:
- `source_name`: Display name
- `source_url`: URL to crawl
- `extractor_type`: Identifies which extractor function to use (e.g., `photobooth_net`, `lomography`)
- `enabled`: Boolean flag
- `status`: 'active', 'inactive', etc.
- `priority`: Crawl priority (100 = highest)
- `crawl_frequency_days`: How often to crawl

### Requirements for Crawling
For a source to be crawled by the async crawler, it needs:
1. `enabled = true`
2. `status = 'active'`
3. `extractor_type` must be set and match a case in the crawler switch statement

### Known Extractor Types
The unified crawler supports these extractor types:
- `photobooth_net` - Gold standard source
- `lomography` - Lomography directory
- `photomatica` - Photomatica Berlin
- `photoautomat_de` - German photoautomat
- `autophoto` - Autophoto.org
- `flickr_photobooth` - Flickr group
- And many city guide extractors (`city_guide_berlin_*`, `city_guide_la_*`, etc.)

## Issues Found

### 1. Migration Conflicts
The seed data file (004) was applied, but later migration files modified the sources:
- `/Users/jkw/Projects/booth-beacon-app/supabase/migrations/20251128_fix_crawler_sources.sql`
  - Disabled several sources (Photomatica Berlin, Digital Cosmonaut Berlin, etc.)
  - Updated URLs for working sources
  - Marked broken sources as inactive

### 2. Duplicate/Conflicting Data
The table has 81 sources but the seed file only defines 39. This suggests:
- Additional sources were added manually or via other migrations
- Some sources may be duplicates with different configurations
- Schema changes added new columns with default values

## Solution

Run the provided script to:
1. Analyze which sources have `extractor_type` configured
2. Enable sources that should be active
3. Display the final list of ready-to-crawl sources

## Scripts Created

### 1. Analysis Script
**File**: `/Users/jkw/Projects/booth-beacon-app/analyze-crawl-sources.js`

Run with:
```bash
SUPABASE_SERVICE_ROLE_KEY="your-key" node analyze-crawl-sources.js
```

### 2. Enable Sources Script
**File**: `/Users/jkw/Projects/booth-beacon-app/enable-crawl-sources.js`

Run with:
```bash
SUPABASE_SERVICE_ROLE_KEY="your-key" node enable-crawl-sources.js
```

This will:
- Find all sources with `extractor_type` set
- Enable them if they're disabled
- Set status to 'active'
- Show summary of ready sources

### 3. SQL Query Script
**File**: `/Users/jkw/Projects/booth-beacon-app/check-and-populate-sources.sql`

Run via psql or Supabase SQL editor to view current state.

## Recommended Actions

1. **Run the enable script first**:
   ```bash
   cd /Users/jkw/Projects/booth-beacon-app
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk" node enable-crawl-sources.js
   ```

2. **Review the output** to see which sources are ready

3. **Test the crawler** with a specific source:
   ```bash
   curl -X POST "https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler" \
     -H "Authorization: Bearer YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"source_name": "Photobooth.net", "force_crawl": true}'
   ```

4. **Check for sources that need extractors** - Some sources may exist but lack extractor implementations

## Priority Sources to Enable

Based on the seed data, these are TIER 1 sources (priority 80+):
- **Photobooth.net** (priority: 100) - Main directory
- **Lomography Locations** (priority: 90) - Global directory
- **Flickr Photobooth Group** (priority: 85) - Community photos
- **Photomatica Berlin** (priority: 80) - German operator (may be disabled)
- **Photomatica West Coast** (priority: 80) - US operator
- **Photomatic** (priority: 75) - Australian operator
- **Photoautomat DE** (priority: 75) - German directory
- **Classic Photo Booth Co** (priority: 75) - US locations
- **Autophoto** (priority: 70+) - NYC operator

## Next Steps

1. Run the enable script (provided above)
2. Check async crawler configuration to ensure it queries enabled sources
3. Test crawl a few sources to verify extractors work
4. Monitor crawler_metrics table for results
5. Add any missing extractor implementations as needed

## Files Reference

All files are in: `/Users/jkw/Projects/booth-beacon-app/`

- Migration: `supabase/migrations/004_seed_crawl_sources.sql`
- Fix migration: `supabase/migrations/20251128_fix_crawler_sources.sql`
- Crawler: `supabase/functions/unified-crawler/index.ts`
- Scripts created:
  - `analyze-crawl-sources.js`
  - `enable-crawl-sources.js`
  - `check-and-populate-sources.sql`
