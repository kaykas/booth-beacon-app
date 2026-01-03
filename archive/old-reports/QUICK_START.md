# Crawler Improvements - Quick Start Guide

## TL;DR

The crawler was extracting ~120 booths but should extract 400-850. Fixed by:
1. Increasing wait times for JavaScript pages (5s → 15s)
2. Increasing page limits for directories (3 → 100 pages)
3. Fixing source URLs (homepages → location directories)

## Deploy in 3 Steps

### Step 1: Deploy Code (2 minutes)

```bash
cd /Users/jkw/Projects/booth-beacon-app

# Deploy updated crawler
supabase functions deploy unified-crawler
```

**What changed**: Domain config in `index.ts` with better wait times and page limits

### Step 2: Update Database (1 minute)

```bash
# Option A: Use Supabase SQL Editor
# 1. Go to Supabase dashboard → SQL Editor
# 2. Copy contents of fix-sources.sql
# 3. Run

# Option B: Use psql command
# psql <connection-string> < fix-sources.sql
```

**What changed**: Source URLs, batch sizes, disabled duplicates

### Step 3: Test Top Sources (5 minutes)

```bash
# Set your environment
export SUPABASE_URL="https://tmgbmcbwfkvmylmfpkzy.supabase.co"
export SUPABASE_ANON_KEY="<your-anon-key>"

# Test autophoto.org (currently 0 booths, expect 50-100)
curl -X POST "$SUPABASE_URL/functions/v1/unified-crawler" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source_name":"autophoto.org", "force_crawl":true}'

# Test photobooth.net (currently 3 booths, expect 200+)
curl -X POST "$SUPABASE_URL/functions/v1/unified-crawler" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source_name":"Photobooth.net", "force_crawl":true}'
```

## Check Results

### Quick Query

```sql
-- See booth counts by source
SELECT
    source_name,
    COUNT(booths.id) as booth_count
FROM crawl_sources
LEFT JOIN booths ON booths.source_id = crawl_sources.id
WHERE crawl_sources.enabled = true
GROUP BY source_name
ORDER BY booth_count DESC;
```

### Success Indicators

- ✅ autophoto.org has > 20 booths (currently 0)
- ✅ Photobooth.net has > 50 booths (currently 3)
- ✅ Total booths > 300 (currently ~120)
- ✅ No 404 errors in crawler_metrics

## Troubleshooting

**autophoto.org still 0 booths?**
- Check crawler_metrics for error_message
- If still 404, increase waitFor to 20000ms in DOMAIN_CONFIG
- May need to try alternative URL

**photobooth.net < 50 booths?**
- Check pages_crawled in crawler_metrics
- Should be crawling 20-100 pages, not 1-5
- If low page count, Firecrawl may not be following links

**City guides (Time Out, etc.) still 0?**
- Check if raw_content table has cached pages
- If no cache, force re-crawl
- If has cache but 0 booths, check AI extraction logs

## Full Documentation

- **CRAWLER_ANALYSIS.md** - Detailed technical analysis
- **IMPLEMENTATION_SUMMARY.md** - Complete implementation guide
- **fix-sources.sql** - Database update script

## Expected Timeline

- **Immediate** (1 hour): Deploy complete, test crawls running
- **Day 1**: autophoto.org and photobooth.net showing results
- **Week 1**: Total booths > 300
- **Month 1**: Total booths > 500, all sources optimized

## Rollback

If something breaks:

```bash
# Revert code
git revert HEAD
supabase functions deploy unified-crawler

# Revert database
# Run: UPDATE crawl_sources SET pages_per_batch = 3;
```

## Questions?

Check the full analysis in `CRAWLER_ANALYSIS.md` or review crawler logs in Supabase dashboard.
