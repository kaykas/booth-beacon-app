# Booth Beacon Crawler Setup Guide
**Date**: 2026-01-03
**Project**: Booth Beacon
**Issue**: Setup async crawler with crawl_sources

---

## Executive Summary

The `crawl_sources` table is **NOT empty** - it contains **81 sources**. The async crawler infrastructure exists but may need sources to be properly enabled.

This guide provides scripts to:
1. Verify the crawler setup
2. Enable sources with configured extractors
3. Test the async crawler
4. Monitor crawl jobs

---

## Quick Start

### 1. Setup and Enable Sources

```bash
cd /Users/jkw/Projects/booth-beacon-app

# Run setup script to check and enable sources
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk" \
node setup-crawler.js
```

This script will:
- ✅ Check if `crawl_jobs` table exists
- ✅ Analyze current source configuration
- ✅ Enable sources that have extractors
- ✅ Show ready-to-crawl sources by tier
- ✅ Provide next steps

### 2. Test Async Crawler

```bash
# Test with Photobooth.net (default)
SUPABASE_SERVICE_ROLE_KEY="your-key" ./test-async-crawler.sh

# Test with specific source
SUPABASE_SERVICE_ROLE_KEY="your-key" ./test-async-crawler.sh "Time Out LA"
```

### 3. Monitor Jobs

```bash
# View recent crawl jobs
SUPABASE_SERVICE_ROLE_KEY="your-key" node -e "
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  supabase.from('crawl_jobs')
    .select('job_id, source_name, status, pages_crawled, booths_found, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
    .then(({data}) => console.table(data));
"
```

---

## Files Created

### Scripts

1. **`setup-crawler.js`** - Main setup and verification script
   - Checks table existence
   - Enables sources with extractors
   - Shows tiered source list
   - Provides next steps

2. **`test-async-crawler.sh`** - Test async crawler with any source
   - Sends async crawl request
   - Shows job ID
   - Provides monitoring commands

3. **`enable-crawl-sources.js`** - Standalone enable script
   - Finds sources with extractors
   - Enables and activates them
   - Shows before/after stats

4. **`analyze-crawl-sources.js`** - Analysis only (no changes)
   - Shows source counts
   - Lists ready sources
   - Identifies disabled sources

### Documentation

5. **`CRAWL_SOURCES_REPORT.md`** - Detailed investigation report
   - Database state analysis
   - Migration history
   - Issues found
   - Solution overview

6. **`check-and-populate-sources.sql`** - SQL queries for manual inspection
   - Check source counts
   - View ready sources
   - List disabled sources

7. **`CRAWLER_SETUP_GUIDE.md`** - This file
   - Quick start guide
   - Troubleshooting
   - Architecture overview

---

## Understanding the Architecture

### Tables

#### `crawl_sources`
Stores configuration for all booth data sources.

Key fields:
- `source_name` - Display name
- `source_url` - URL to crawl
- `extractor_type` - Which extractor function to use
- `enabled` - Whether to include in crawls
- `status` - 'active', 'inactive', etc.
- `priority` - Crawl priority (100 = highest)

**Current state**: 81 sources exist

#### `crawl_jobs`
Tracks async Firecrawl crawl jobs.

Key fields:
- `job_id` - Firecrawl job ID (unique)
- `source_id` - References `crawl_sources`
- `status` - 'pending', 'crawling', 'processing', 'completed', 'failed'
- `pages_crawled` - Progress counter
- `booths_found` - Results counter

**Migration**: `supabase/migrations/20260103_add_crawl_jobs_table.sql`

### Edge Functions

#### `unified-crawler`
Main crawler function that can run in two modes:

1. **Sync mode** (default) - Waits for crawl to complete
2. **Async mode** - Returns immediately with job ID

Location: `supabase/functions/unified-crawler/`

#### `firecrawl-webhook`
Receives webhooks from Firecrawl when async jobs complete.

Processes crawled data and extracts booth information.

### Async Crawler Flow

```
1. Client calls unified-crawler with async=true
   ↓
2. Crawler calls Firecrawl API to start crawl job
   ↓
3. Job ID saved to crawl_jobs table
   ↓
4. Response returned immediately (non-blocking)
   ↓
5. Firecrawl crawls pages in background
   ↓
6. Webhook called when crawl completes
   ↓
7. Webhook processes data and updates booths
   ↓
8. crawl_jobs updated with results
```

---

## Source Tiers

Sources are organized by priority:

### Tier 1 - Gold Standard (Priority 90+)
- **Photobooth.net** - Primary directory (100)
- **Lomography Locations** - Global directory (90)
- **Autophoto** - NYC operator with locator (90)

### Tier 2 - Regional Directories (Priority 70-89)
- Photomatica operators
- European fotoautomat sites
- National directories

### Tier 3 - City Guides (Priority 50-69)
- Time Out articles
- Local blogs
- City-specific guides

### Tier 4 - Community (Priority <50)
- Travel blogs
- Community posts
- Historical articles

---

## Extractors

Each source needs an `extractor_type` that maps to a function in the crawler.

### Available Extractors

Location: `supabase/functions/unified-crawler/`

#### Main Extractors
- `photobooth_net` - Photobooth.net enhanced extractor
- `lomography` - Lomography tipster pages
- `autophoto` - Autophoto.org map
- `flickr_photobooth` - Flickr group photos

#### City Guide Extractors
- `city_guide_la_timeout` - Time Out LA
- `city_guide_chicago_timeout` - Time Out Chicago
- `city_guide_london_*` - London guides
- `city_guide_berlin_*` - Berlin guides
- `city_guide_ny_*` - New York guides

#### European Extractors
- `fotoautomat_berlin` - Berlin operator
- `fotoautomat_fr` - French operator
- `fotoautomat_wien` - Vienna operator
- `photoautomat_de` - German directory

#### Blog Extractors
- `solo_sophie` - Solo Sophie Paris
- `girl_in_florence` - Girl in Florence
- `concrete_playground` - Australian guide
- And many more...

### Adding New Extractors

If a source doesn't have an extractor:

1. Create extractor function in appropriate file:
   - Directory sources → `extractors.ts`
   - City guides → `city-guide-extractors.ts`
   - European → `european-extractors.ts`

2. Add case to switch statement in `extractor-processor.ts`

3. Update `crawl_sources` with new `extractor_type`

---

## Troubleshooting

### Sources Not Crawling

**Check 1**: Is the source enabled and active?
```bash
SUPABASE_SERVICE_ROLE_KEY="key" node setup-crawler.js
```

**Check 2**: Does it have an extractor_type?
```sql
SELECT source_name, extractor_type, enabled, status
FROM crawl_sources
WHERE enabled = true;
```

**Check 3**: Does the extractor exist in the code?
```bash
grep -r "case 'your_extractor_type'" supabase/functions/unified-crawler/
```

### Async Jobs Not Working

**Check 1**: Does crawl_jobs table exist?
```bash
SUPABASE_SERVICE_ROLE_KEY="key" node -e "
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
  supabase.from('crawl_jobs').select('count').then(console.log);
"
```

If not, run migration:
```bash
supabase db push --db-url "postgresql://..."
```

**Check 2**: Is webhook function deployed?
```bash
supabase functions list --project-ref tmgbmcbwfkvmylmfpkzy
```

Should show:
- unified-crawler
- firecrawl-webhook

### Jobs Stuck in 'pending'

Webhooks may not be reaching your function.

**Check webhook URL** in crawl_jobs:
```sql
SELECT job_id, metadata->>'webhook_url' as webhook_url
FROM crawl_jobs
WHERE status = 'pending';
```

Should be: `https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/firecrawl-webhook`

**Manually check job status** via Firecrawl API:
```bash
curl "https://api.firecrawl.dev/v1/crawl/status/{job_id}" \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY"
```

---

## Migration History

### Seed Data
`supabase/migrations/004_seed_crawl_sources.sql` - Original 39 sources

### Fixes
`supabase/migrations/20251128_fix_crawler_sources.sql` - Disabled broken sources, updated URLs

### Async Infrastructure
`supabase/migrations/20260103_add_crawl_jobs_table.sql` - Created crawl_jobs for async tracking

---

## Testing Strategy

### 1. Test Single Source
Start with highest priority source:
```bash
./test-async-crawler.sh "Photobooth.net"
```

### 2. Monitor Job
Watch the crawl_jobs table for updates.

### 3. Check Results
Look for new booths in `booths` table:
```sql
SELECT name, city, source, created_at
FROM booths
WHERE source = 'Photobooth.net'
ORDER BY created_at DESC
LIMIT 10;
```

### 4. Verify Metrics
Check crawler_metrics for success rate:
```sql
SELECT source_name, status, booths_found, booths_added
FROM crawler_metrics
ORDER BY created_at DESC
LIMIT 10;
```

### 5. Scale Up
Once working, crawl multiple sources:
- Tier 1 first (highest value)
- Then Tier 2
- Then city guides

---

## Performance Notes

### Firecrawl Limits
- Async mode prevents timeouts
- Crawls run in background
- Results delivered via webhook

### Rate Limiting
- Respect source site rate limits
- Use `crawl_frequency_days` to avoid over-crawling
- Stagger batch crawls

### Deduplication
- Booths deduplicated by location + name
- Updates existing records if found
- Tracks source in booth record

---

## Next Steps

1. **Run setup script** to enable sources
2. **Test async crawler** with Photobooth.net
3. **Deploy webhook function** if not already deployed
4. **Monitor first job** to completion
5. **Scale to Tier 1** sources
6. **Add monitoring dashboard** for job status
7. **Schedule regular crawls** via cron/scheduled function

---

## Support

### Key Files
- Main crawler: `supabase/functions/unified-crawler/index.ts`
- Async logic: `supabase/functions/unified-crawler/async-crawler.ts`
- Extractors: `supabase/functions/unified-crawler/extractors.ts`
- City guides: `supabase/functions/unified-crawler/city-guide-extractors.ts`

### Environment Variables
Required in Edge Function:
- `FIRECRAWL_API_KEY` - Firecrawl API key
- `ANTHROPIC_API_KEY` - Claude API for enhanced extraction
- `SUPABASE_URL` - Auto-provided
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided

### Database
- Project: `tmgbmcbwfkvmylmfpkzy`
- URL: `https://tmgbmcbwfkvmylmfpkzy.supabase.co`

---

**Last Updated**: 2026-01-03
**Status**: Ready for testing
**Maintainer**: Jascha Kaykas-Wolff
