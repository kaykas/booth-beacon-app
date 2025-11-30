# Booth Beacon Crawler - Extraction Improvement Implementation

## Overview

Successfully analyzed the web crawler's low booth extraction rates and implemented improvements to increase booth discovery from ~120 booths to an expected 400-850 booths.

## Problem Identified

The crawler was extracting far fewer booths than expected due to three critical issues:

1. **Wrong URLs** - Sources pointed to homepages/blogs instead of location directories
2. **Insufficient wait times** - JavaScript-heavy pages weren't fully loading
3. **Low page limits** - Directory sources needed 20-100 pages, but were configured for 1-5 pages

## Root Cause Analysis

### Database Investigation

Analyzed 80 crawl sources and found:
- Most sources had 0 booths extracted despite successful crawls
- Raw content table had only 6 records (very low cache)
- Sources like `autophoto.org` returned 404 errors (JS not loading)
- `photobooth.net` homepage being crawled instead of `/locations/` directory
- `pages_per_batch` set to 3 for most sources (way too low for directories)

### Key Findings

**photobooth.net** (GOLD STANDARD SOURCE):
- Has 800+ booths in database
- Two sources configured: homepage (12 booths) and `/locations/` (3 booths)
- Homepage crawls blog posts with some booth mentions
- `/locations/` page is interactive directory requiring deep link following
- Current config: `pageLimit: 1` - should be 100+

**autophoto.org** (MAJOR US OPERATOR):
- Interactive JavaScript map
- Current `waitFor: 5000ms` insufficient for map to load
- Returns 404 or empty pages
- Needs `waitFor: 15000ms` and `pageLimit: 50`

**City Guides** (Time Out, Block Club):
- Articles with explicit booth lists
- Should extract 10-20 booths each
- Currently 0 booths (extraction failure or not crawled recently)

## Improvements Implemented

### 1. Code Changes

**File**: `/supabase/functions/unified-crawler/index.ts`

Updated `DOMAIN_CONFIG` with optimized settings:

```typescript
const DOMAIN_CONFIG = {
  // GOLD STANDARD: photobooth.net
  'photobooth.net/locations': { pageLimit: 100, timeout: 120000, waitFor: 10000 },
  'photobooth.net': { pageLimit: 5, timeout: 60000, waitFor: 8000 },

  // HIGH VALUE: autophoto.org - JavaScript map
  'autophoto.org': { pageLimit: 50, timeout: 90000, waitFor: 15000 },

  // EUROPEAN OPERATORS
  'photoautomat.de': { pageLimit: 20, timeout: 60000, waitFor: 8000 },
  'fotoautomatica': { pageLimit: 10, timeout: 60000, waitFor: 8000 },
  'automatfoto.se': { pageLimit: 10, timeout: 60000, waitFor: 8000 },

  // DIRECTORIES
  'classicphotobooth.net': { pageLimit: 50, timeout: 60000, waitFor: 8000 },
  'photomatica.com': { pageLimit: 30, timeout: 60000, waitFor: 8000 },
  'lomography.com': { pageLimit: 20, timeout: 45000, waitFor: 8000 },

  // CITY GUIDES
  'timeout.com': { pageLimit: 1, timeout: 30000, waitFor: 6000 },
  'blockclubchicago.org': { pageLimit: 1, timeout: 30000, waitFor: 6000 },

  'default': { pageLimit: 5, timeout: 30000, waitFor: 6000 }
};
```

**Key Changes**:
- Increased `waitFor` from 5s to 15s for JavaScript-heavy sites
- Increased `pageLimit` from 1-3 to 20-100 for directory sites
- Added path-specific configs (e.g., `photobooth.net/locations`)
- Improved `getDomainConfig()` to match URL paths, not just domains

### 2. Database Updates

**File**: `/fix-sources.sql`

SQL script to update crawl_sources table:

**High Priority Fixes**:
- Disable duplicate `photobooth.net` homepage source
- Update `/locations/` source: `pages_per_batch = 100`, `total_pages_target = 1000`
- Update `autophoto.org`: `pages_per_batch = 50`, reset for retry
- Reset city guides for re-crawl (clear failures, reset progress)

**Directory Sources**:
- Classic Photo Booth: `pages_per_batch = 50`
- Photomatica: `pages_per_batch = 30`
- Lomography: `pages_per_batch = 20`
- European operators: `pages_per_batch = 20`

**Cleanup**:
- Disable sources pointing to blog homepages (not location data)
- Disable duplicate sources

### 3. Documentation

Created comprehensive analysis documents:

**`CRAWLER_ANALYSIS.md`**:
- Detailed problem analysis
- Root cause investigation
- Source-by-source breakdown
- Expected results (conservative and optimistic estimates)
- Implementation priority matrix
- Technical architecture details

**`IMPLEMENTATION_SUMMARY.md`** (this file):
- Executive summary
- Changes implemented
- Testing instructions
- Expected outcomes

## Testing Instructions

### 1. Deploy Code Changes

```bash
# Deploy updated crawler function
supabase functions deploy unified-crawler
```

### 2. Apply Database Updates

```bash
# Connect to Supabase and run SQL
psql <your-supabase-connection-string> < fix-sources.sql

# Or use Supabase dashboard SQL editor
```

### 3. Test High-Priority Sources

Test the improved sources manually:

```bash
# Test autophoto.org
curl -X POST https://<your-project>.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"source_name":"autophoto.org", "force_crawl":true}'

# Test photobooth.net/locations
curl -X POST https://<your-project>.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"source_name":"Photobooth.net", "force_crawl":true}'

# Test Time Out LA
curl -X POST https://<your-project>.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"source_name":"Time Out LA", "force_crawl":true}'
```

### 4. Monitor Results

Query database to check extraction improvement:

```sql
-- Check booth counts by source
SELECT
    cs.source_name,
    cs.source_url,
    COUNT(b.id) as booth_count,
    cs.last_crawl_timestamp
FROM crawl_sources cs
LEFT JOIN booths b ON b.source_id = cs.id
WHERE cs.enabled = true
GROUP BY cs.id, cs.source_name, cs.source_url, cs.last_crawl_timestamp
ORDER BY booth_count DESC;

-- Check crawler metrics
SELECT
    source_name,
    status,
    booths_extracted,
    pages_crawled,
    duration_ms,
    created_at
FROM crawler_metrics
ORDER BY created_at DESC
LIMIT 20;

-- Check raw content cache
SELECT
    cs.source_name,
    COUNT(crc.id) as cached_pages,
    MAX(crc.crawled_at) as last_cached
FROM crawl_raw_content crc
JOIN crawl_sources cs ON cs.id = crc.source_id
GROUP BY cs.source_name
ORDER BY cached_pages DESC;
```

### 5. Verify Specific Improvements

**autophoto.org**:
- Before: 0 booths, 404 errors
- Expected: 50-100 booths
- Check: Raw content should show map data, not 404

**photobooth.net/locations**:
- Before: 3 booths (incomplete data)
- Expected: 200-500 booths
- Check: Should extract addresses, cities, coordinates

**Time Out LA / Block Club Chicago**:
- Before: 0 booths
- Expected: 10-20 booths total
- Check: AI should extract booths from article text

## Expected Results

### Conservative Estimates (Phase 1-2)

| Source | Current | Expected | Improvement |
|--------|---------|----------|-------------|
| photobooth.net | 15 | 200-500 | +185-485 |
| autophoto.org | 0 | 50-100 | +50-100 |
| Time Out articles | 10 | 20 | +10 |
| Classic Photo Booth | 0 | 20-40 | +20-40 |
| Other directories | ~20 | 100-200 | +80-180 |
| **TOTAL** | **~120** | **400-850** | **+280-730** |

### Success Metrics

**Immediate** (after first crawl):
- autophoto.org extracts > 20 booths (currently 0)
- photobooth.net/locations extracts > 50 booths (currently 3)
- No more 404 errors in raw_content for autophoto.org

**Short-term** (within 1 week):
- Total booths > 300 (currently ~120)
- All enabled sources have attempted crawl
- Raw content cache > 100 pages (currently 6)

**Medium-term** (within 1 month):
- Total booths > 500
- photobooth.net approaching 200+ booths
- 90% of enabled sources have successful extractions

## Troubleshooting

### If autophoto.org still returns 0 booths

1. Check raw_content for the source - is content being cached?
2. If content is cached, check if it's a 404 or empty page
3. If still 404:
   - Increase `waitFor` to 20000ms
   - Check if site blocks Firecrawl user agent
   - Try alternative URL: `https://autophoto.org/exhibitions`

### If photobooth.net extracts < 50 booths

1. Check `pages_crawled` in crawler_metrics
2. If pages_crawled < 10, Firecrawl may not be following links
3. Consider increasing `total_pages_target` to 2000
4. May need custom link-following logic or different crawl strategy

### If city guides still return 0 booths

1. Check if raw_content exists and contains booth mentions
2. If no raw_content, force a re-crawl
3. If has content but 0 extractions, review AI extraction logs
4. May need to adjust AI prompts for article format

## Next Steps

### Immediate (Do Now)
1. Deploy code changes to production
2. Run SQL script to update database
3. Force re-crawl of top 5 sources
4. Monitor results over 24 hours

### Short-term (This Week)
1. Review extraction results
2. Fine-tune configs based on actual crawl data
3. Add more directory sources
4. Improve AI prompts if needed

### Medium-term (This Month)
1. Implement link-following for multi-page directories
2. Add custom extractors for problematic sources
3. Build monitoring dashboard for crawl health
4. Expand to 100+ active sources

## Files Changed

1. **Code**:
   - `/supabase/functions/unified-crawler/index.ts` - Domain config updates

2. **Database**:
   - `crawl_sources` table - URL fixes, batch sizes, priorities
   - Applied via `/fix-sources.sql`

3. **Documentation**:
   - `/CRAWLER_ANALYSIS.md` - Detailed analysis
   - `/IMPLEMENTATION_SUMMARY.md` - This file
   - `/analyze-crawl-data.ts` - Analysis scripts (for reference)
   - `/query-sources.ts` - Database query scripts (for reference)

## Rollback Plan

If issues arise, rollback is straightforward:

### Revert Code Changes
```bash
git revert <commit-hash>
supabase functions deploy unified-crawler
```

### Revert Database Changes
```sql
-- Reset batch sizes to defaults
UPDATE crawl_sources
SET pages_per_batch = 3
WHERE pages_per_batch > 10;

-- Re-enable disabled sources if needed
UPDATE crawl_sources
SET enabled = true
WHERE notes LIKE '%DISABLED%';
```

## Contact

For questions or issues:
- Review `/CRAWLER_ANALYSIS.md` for detailed technical information
- Check Supabase logs for crawler errors
- Review `crawler_metrics` table for extraction statistics

---

**Implementation Date**: 2025-11-30
**Analyst**: Claude (Sonnet 4.5)
**Status**: Ready for Deployment
