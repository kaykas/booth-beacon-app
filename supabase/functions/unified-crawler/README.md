# Unified Crawler Edge Function

A sophisticated web crawler that extracts photo booth location data from multiple sources and stores it in the Supabase database.

## Architecture Overview

The unified-crawler is a Deno-based edge function that:

1. **Fetches** web pages using Firecrawl API
2. **Extracts** booth data using AI-powered extraction (Claude Sonnet 4.5)
3. **Validates** extracted data for quality and completeness
4. **Deduplicates** booths to prevent duplicates
5. **Upserts** data into the Supabase database

## Files Structure

```
unified-crawler/
├── index.ts                    # Main entry point
├── types.ts                    # TypeScript type definitions
├── extractors.ts               # Main extraction logic
├── base-extractor.ts           # Base class for extractors
├── enhanced-extractors.ts      # AI-enhanced extractors
├── ai-extraction-engine.ts     # Claude AI extraction engine
├── validation.ts               # Data validation logic
├── country-validation.ts       # Country name validation
├── deduplication-engine.ts     # Duplicate detection
├── shared-utilities.ts         # Common utility functions
├── crawler-utilities.ts        # Crawler-specific utilities
├── city-guide-extractors.ts    # City guide source extractors
├── european-extractors.ts      # European operator extractors
├── community-extractors.ts     # Community source extractors
├── enrichment.ts               # Data enrichment logic
├── *-specialized.ts            # Site-specific extractors
└── *.test.ts                   # Test files
```

## Required Environment Variables

Set these in your Supabase project settings (or `.env` for local development):

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
FIRECRAWL_API_KEY=<your-firecrawl-api-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
RESEND_API_KEY=<optional-for-email-notifications>
```

## Database Requirements

Run the migration to create required tables:

```bash
supabase db push
```

Or manually run:
```sql
-- Run migrations/20251127_crawler_schema.sql
```

Required tables:
- `crawl_sources` - Source configuration and tracking
- `crawler_metrics` - Performance metrics
- `crawl_logs` - Detailed operation logs
- `booths` - Must have `source_id`, `source_names`, `source_urls` columns

## Deployment

### Deploy to Supabase

```bash
# Deploy the function
supabase functions deploy unified-crawler

# Check deployment status
supabase functions list
```

### Local Development

```bash
# Start local Supabase
supabase start

# Serve the function locally
supabase functions serve unified-crawler --env-file .env.local
```

## API Usage

### Invoke the Crawler

```bash
# Crawl all enabled sources
curl -X POST https://<project>.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json"

# Crawl a specific source
curl -X POST https://<project>.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"source_name": "photobooth.net"}'

# Force crawl (ignore frequency settings)
curl -X POST https://<project>.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"force_crawl": true}'

# Stream progress events (SSE)
curl -X POST https://<project>.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"stream": true}'
```

### Request Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source_name` | string | null | Crawl only this source |
| `force_crawl` | boolean | false | Ignore crawl frequency limits |
| `stream` | boolean | false | Enable SSE progress events |
| `admin_email` | string | null | Email for completion notifications |

### Response Format

```json
{
  "success": true,
  "results": [
    {
      "source_name": "photobooth.net",
      "status": "success",
      "booths_found": 150,
      "booths_added": 45,
      "booths_updated": 20,
      "extraction_time_ms": 5000,
      "crawl_duration_ms": 30000,
      "pages_crawled": 10
    }
  ],
  "summary": {
    "total_sources": 5,
    "total_booths_found": 500,
    "total_booths_added": 100,
    "total_booths_updated": 50
  }
}
```

## Supported Sources

### Tier 1: Global Directories (Priority 100-85)
- photobooth.net - USA comprehensive directory
- photomatica.com - European directory
- photoautomat.de - Germany focused
- photomatic.net - Australia/NZ

### Tier 2: Regional Operators (Priority 70-60)
- autophoto.org - USA operator
- classicphotoboothco.com - USA operator
- fotoautomat-berlin - Berlin operator
- fotoautomat-wien - Vienna operator
- fotoautomatica - Florence operator

### Tier 3: City Guides & Blogs
- Various city-specific guides for Berlin, London, LA, Chicago, NYC, Paris, etc.

## Batch Processing

For large sources, the crawler processes pages in batches:

1. Respects Supabase edge function timeout (150s)
2. Saves progress after each batch
3. Automatically resumes on next run
4. Configurable batch size per source

## Error Handling

- Automatic retry with exponential backoff
- Consecutive failure tracking
- Email notifications on errors (if configured)
- Graceful timeout handling

## Monitoring

Check crawler health in Supabase Dashboard:

```sql
-- Recent crawl activity
SELECT * FROM crawler_metrics
ORDER BY created_at DESC
LIMIT 50;

-- Source health status
SELECT source_name, status, consecutive_failures, last_successful_crawl
FROM crawl_sources
ORDER BY priority DESC;
```

## Testing

```bash
# Run tests locally
deno test supabase/functions/unified-crawler/*.test.ts --allow-env
```
