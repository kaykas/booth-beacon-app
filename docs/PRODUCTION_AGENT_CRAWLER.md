# Production Agent Crawler Documentation

## Overview

The Production Agent Crawler is a production-ready implementation of Firecrawl Agent for Booth Beacon, designed to replace custom extractors for city guides and similar sources.

## Features

✅ **Rate Limiting**: 10-second delays between requests
✅ **Automatic Retry**: Up to 2 retries on transient failures
✅ **Error Handling**: Graceful failure with fallback support
✅ **Database Integration**: Automatic upsert with deduplication
✅ **Metrics Logging**: Tracks performance and errors
✅ **Progress Tracking**: Real-time console output
✅ **Dry Run Mode**: Test without making changes

## Usage

### Run All City Guides

```bash
FIRECRAWL_API_KEY=xxx \
SUPABASE_SERVICE_ROLE_KEY=xxx \
NEXT_PUBLIC_SUPABASE_URL=xxx \
npx tsx scripts/production-agent-crawler.ts
```

### Dry Run (Test Without Saving)

```bash
npx tsx scripts/production-agent-crawler.ts --dry-run
```

### Run Specific Sources

```bash
# By source names (comma-separated)
npx tsx scripts/production-agent-crawler.ts --sources "Time Out Chicago,Time Out LA"

# By source type
npx tsx scripts/production-agent-crawler.ts --type city_guide_chicago_timeout
```

## Configuration

### Delays & Retries

```typescript
const DELAY_BETWEEN_REQUESTS_MS = 10000; // 10 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 30000; // 30 seconds
```

### Agent-Enabled Sources

Currently enabled for all city guide sources:
- Berlin (3 sources)
- London (3 sources)
- Los Angeles (2 sources)
- Chicago (2 sources)
- New York (3 sources)

To enable for additional sources, add to `AGENT_ENABLED_TYPES` array.

## Output

### Console Output

```
🚀 PRODUCTION AGENT CRAWLER
=======================================

[1/10] Time Out Chicago
================================================================================
🔍 Processing: Time Out Chicago
📍 URL: https://www.timeout.com/chicago/...
🏷️  Type: city_guide_chicago_timeout
================================================================================

   📡 Calling Agent for: Time Out Chicago
   ✅ Agent found 7 booths in 74.2s
   💳 Credits used: 261

   💾 Saving 7 booths to database...

   ✅ SUCCESS
      Found: 7
      Added: 5
      Updated: 2
      Time: 74.2s
      Credits: 261

⏳ Waiting 10s before next request...
```

### Final Summary

```
================================================================================
📊 CRAWL SUMMARY
================================================================================

Total sources: 10
Successful: 9
Failed: 1
Success rate: 90.0%

Total booths found: 98
Booths added: 67
Booths updated: 31
Total credits used: 2,456

Average extraction time: 87.3s

❌ Failed Sources:
  - Aperture Tours Berlin: Agent job not found
```

## Database Integration

### Booth Upsert Logic

1. **Deduplication**: Matches by normalized name + city
2. **Update Existing**: Appends source URLs if booth already exists
3. **Insert New**: Creates new booth with SEO-friendly slug
4. **Source Tracking**: Records all sources that found each booth

### Metrics Logging

Logs to `crawler_metrics` table:
- Source name and ID
- Extraction time
- Booths found/added/updated
- Credits used
- Error messages
- Success/failure status

## Error Handling

### Retry Logic

```typescript
// Retries transient errors up to 2 times
// Does NOT retry 404 or auth errors
try {
  return await extractWithAgent(...);
} catch (error) {
  if (attempt < maxRetries && !is404OrAuth(error)) {
    await sleep(30000);
    retry();
  }
}
```

### Fallback Strategy

Currently: Fails gracefully, logs error, continues to next source

Future: Can add fallback to custom extractors for failed sources

## Performance

### Based on 13-Source Test

| Metric | Value |
|--------|-------|
| Success Rate | 76.9% |
| Avg Time/Source | 99.7s |
| Booths/Source | 11.9 avg |
| Field Completion | 98.1% |
| Credits/Source | ~130 avg |

### Cost Estimation

**Per City Guide Run (13 sources):**
- Credits: ~1,700
- Estimated cost: $17 (at $0.01/credit)
- Time: ~20 minutes

**Monthly (assuming 4 runs/month):**
- Total credits: ~6,800
- Estimated cost: $68/month
- Better data quality than current system

## Monitoring

### Check Crawler Metrics

```sql
SELECT
  source_name,
  status,
  booths_extracted,
  duration_ms / 1000 as duration_sec,
  started_at
FROM crawler_metrics
WHERE started_at > NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;
```

### Check Source Status

```sql
SELECT
  source_name,
  extractor_type,
  last_successful_crawl,
  consecutive_failures,
  total_booths_found,
  status
FROM crawl_sources
WHERE extractor_type LIKE 'city_guide%'
ORDER BY last_successful_crawl DESC NULLS LAST;
```

## Troubleshooting

### "Agent job not found"

**Cause**: Agent took too long and job expired
**Solution**: Retry manually, may need to break large sites into smaller chunks

### "Unexpected error" from Firecrawl

**Cause**: Firecrawl API issue (rate limit, service error)
**Solution**: Wait 1-2 minutes and retry, or check Firecrawl status

### Rate Limiting

**Symptoms**: Multiple consecutive failures
**Solution**: Increase `DELAY_BETWEEN_REQUESTS_MS` to 15-20 seconds

### Low Credits

**Symptoms**: "Insufficient credits" error
**Solution**: Add credits to Firecrawl account

## Next Steps

### Phase 1: Production Deployment (This Week)
1. ✅ Run production crawler on all city guides
2. ✅ Monitor for 24-48 hours
3. ✅ Verify data quality in database
4. ✅ Compare with existing booth data

### Phase 2: Replace Custom Extractors (Next Week)
1. Update unified-crawler to call production crawler
2. Remove custom city guide extractors
3. Clean up 1,000+ lines of extractor code
4. Deploy to production

### Phase 3: Expand to More Sources (Week 3-4)
1. Test Agent on blog sources
2. Test Agent on European operators
3. Add more sources to `AGENT_ENABLED_TYPES`
4. Monitor costs and performance

## Support

- **Documentation**: `/docs/FIRECRAWL_AGENT_EVALUATION.md`
- **Test Results**: `/docs/cityguide-test-results.json`
- **POC Summary**: `/docs/AGENT_POC_RESULTS_SUMMARY.md`

## Version History

- **v1.0.0** (2025-12-20): Initial production release
  - City guide support
  - Rate limiting
  - Auto-retry
  - Database integration
  - Metrics logging
