# Crawler Execution Guide

## Overview
This guide provides instructions for executing crawler operations to extract new booths from top priority sources.

## Prerequisites

1. **Edge Function Deployed**: Verify the `unified-crawler` Edge Function is deployed to Supabase
2. **Environment Variables**: Ensure `.env.local` contains `SUPABASE_SERVICE_ROLE_KEY`
3. **Dependencies**: Run `npm install` if needed

## Quick Start

### Execute Full Crawler Operation

```bash
tsx execute-crawler-operations.ts
```

This single command will:
- ✅ Check Edge Function deployment status
- ✅ Query `crawl_sources` table for top 5 priority sources
- ✅ Trigger crawls with 30-second stagger to avoid rate limits
- ✅ Monitor `crawler_metrics` for extraction results
- ✅ Generate comprehensive report

## Top 5 Priority Sources

The script targets these high-value sources:

1. **photobooth.net** - Gold standard directory (100+ booths expected)
2. **lomography.com** - Community photo booth directory
3. **photomatica.com** - West coast photo booth listings
4. **autophoto.org** - European analog booth map
5. **photoautomat.de** - German photo booth operator

## Expected Results

Based on crawler configuration:

| Source | Expected Booths | Extraction Method |
|--------|----------------|-------------------|
| photobooth.net | 50-100+ | Enhanced AI extraction |
| lomography.com | 20-30 | Directory extraction |
| photomatica.com | 15-25 | Operator extraction |
| autophoto.org | 30-50 | JavaScript map parsing |
| photoautomat.de | 10-20 | European operator extraction |

**Total Expected**: 125-225 new booths

## Execution Flow

### Step 1: Deployment Check
```
📋 STEP 1: Check Edge Function Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verifies: GET https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler

✅ Edge Function is deployed and responding
   Status: 200
```

If not deployed:
```bash
supabase functions deploy unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy
```

### Step 2: Query Sources
```
📊 STEP 2: Query crawl_sources Table
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Queries: crawl_sources WHERE enabled = true ORDER BY priority DESC

✅ Found 38 enabled sources

Top 5 Priority Sources:
─────────────────────────────────────────

1. photobooth.net
   URL: https://photobooth.net/locations
   Priority: 100
   Type: photobooth_net
   Last Crawl: 2025-01-01T12:34:56.789Z
```

### Step 3: Trigger Crawls
```
🎯 STEP 3: Trigger Crawls (30-second stagger)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 [1/5] Triggering crawl: photobooth.net
   Timestamp: 2025-01-02T10:15:30.123Z
   ✅ Success (45000ms)
   Booths found: 87
   Booths added: 82

⏳ Waiting 30s before next crawl...

🚀 [2/5] Triggering crawl: lomography.com
   ...
```

### Step 4: Check Metrics
```
📈 STEP 4: Check crawler_metrics Table
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Queries: crawler_metrics WHERE started_at >= NOW() - INTERVAL '1 hour'

✅ Found 12 crawl metrics in last hour

Recent Crawl Metrics:
─────────────────────────────────────────

1. photobooth.net
   Status: success
   Booths extracted: 87
   Pages crawled: 15
   Duration: 45000ms
   Started: 1/2/2025, 10:15:30 AM
```

### Step 5: Final Report
```
📊 STEP 5: Final Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══════════════════════════════════════════
           CRAWLER EXECUTION REPORT
═══════════════════════════════════════════

📊 EXECUTION SUMMARY
─────────────────────────────────────────
Crawls executed:        5
Successful:             5 (100.0%)
Failed:                 0
Average duration:       38000ms

📈 EXTRACTION RESULTS
─────────────────────────────────────────
New booths extracted:   167
Total booths in DB:     1079

✅ SUCCESSFUL CRAWLS
─────────────────────────────────────────
• photobooth.net
  Booths found: 87
  Duration: 45000ms

• lomography.com
  Booths found: 24
  Duration: 32000ms

• photomatica.com
  Booths found: 19
  Duration: 28000ms

• autophoto.org
  Booths found: 31
  Duration: 52000ms

• photoautomat.de
  Booths found: 6
  Duration: 23000ms

📊 CRAWLER HEALTH METRICS
─────────────────────────────────────────
Recent metrics logged:  12
Successful operations:  10
Error operations:       2

═══════════════════════════════════════════
           END OF REPORT
═══════════════════════════════════════════

✅ Crawler operations completed successfully!
```

## Monitoring During Execution

### Real-time Logs
Watch the script output for:
- ✅ Success indicators
- ❌ Error messages
- ⏳ Stagger delays
- 📊 Extraction counts

### Rate Limit Protection
- 30-second delay between crawls
- Prevents overwhelming external sites
- Respects Firecrawl API limits
- Allows database operations to complete

### Error Handling
Common errors and solutions:

#### 1. Rate Limit Errors
```
❌ HTTP 429: Too Many Requests
```
**Solution**: Increase `STAGGER_DELAY_MS` in script (e.g., 60000 for 1 minute)

#### 2. Timeout Errors
```
❌ Function timeout approaching
```
**Solution**: Normal for large crawls. Script saves progress and will resume on next run.

#### 3. Deployment Error
```
❌ Edge Function NOT deployed
```
**Solution**: Run deployment command:
```bash
supabase functions deploy unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy
```

## Advanced Usage

### Test Single Source
Modify `TOP_SOURCES` array in script:
```typescript
const TOP_SOURCES = [
  'photobooth.net'  // Test one source only
];
```

### Change Stagger Delay
```typescript
const STAGGER_DELAY_MS = 60000; // 60 seconds instead of 30
```

### Force Re-crawl
The script uses `force_crawl: true` to bypass frequency checks and re-crawl sources immediately.

## Database Queries

### Check Booth Count
```sql
SELECT COUNT(*) FROM booths;
```

### Check Recent Crawls
```sql
SELECT
  source_name,
  status,
  booths_extracted,
  pages_crawled,
  started_at
FROM crawler_metrics
WHERE started_at >= NOW() - INTERVAL '1 hour'
ORDER BY started_at DESC;
```

### Check Top Sources
```sql
SELECT
  source_name,
  priority,
  enabled,
  last_crawl_timestamp,
  total_booths_found
FROM crawl_sources
WHERE enabled = true
ORDER BY priority DESC
LIMIT 10;
```

## Verification Checklist

After execution, verify:

- [ ] All 5 crawls completed successfully
- [ ] New booths appear in database
- [ ] `crawler_metrics` shows success entries
- [ ] No rate limit errors encountered
- [ ] Success rate > 80%
- [ ] Total booth count increased

## Troubleshooting

### No Booths Extracted
1. Check extractor type in `crawl_sources`
2. Verify source URL is accessible
3. Check Firecrawl API key is valid
4. Review `crawler_metrics` error messages

### Partial Extraction
1. Normal for large sites (batched processing)
2. Check `last_batch_page` in `crawl_sources`
3. Re-run script to continue from checkpoint

### Connection Errors
1. Verify Supabase service key in `.env.local`
2. Check network connectivity
3. Verify project ref: `tmgbmcbwfkvmylmfpkzy`

## Next Steps

After successful execution:

1. **Geocode New Booths**
   ```bash
   bash scripts/geocode-all-batches.sh
   ```

2. **Verify Data Quality**
   ```bash
   node scripts/check-missing-coordinates.js
   ```

3. **Check Frontend**
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

4. **Generate Booth Art** (Optional)
   ```bash
   tsx batch-generate-booth-images.ts
   ```

## Success Metrics

Target goals:
- ✅ 100+ new booths extracted
- ✅ 80%+ success rate
- ✅ <10% extraction errors
- ✅ All top 5 sources complete

---

**Last Updated**: January 2, 2026
**Script Location**: `/Users/jkw/Projects/booth-beacon-app/execute-crawler-operations.ts`
**Project**: Booth Beacon - Analog Photo Booth Directory
