# Booth Beacon - Unified Crawler System

A comprehensive multi-source photobooth database crawler with intelligent deduplication, built for Booth Beacon using Firecrawl API.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Deduplication Algorithm](#deduplication-algorithm)
- [Adding New Sources](#adding-new-sources)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The Unified Crawler System aggregates photobooth data from multiple global sources into a single, deduplicated database. It uses Firecrawl for robust web scraping, source-specific extractors for optimal data quality, and fuzzy matching algorithms for intelligent duplicate detection.

### Supported Sources

1. **photobooth.net** (USA) - Primary comprehensive directory
2. **photomatica.com** (Europe) - Detailed machine information
3. **photoautomat.de** (Germany) - Berlin and nationwide
4. **photomatic.net** (Australia/NZ) - Australia and New Zealand focused

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    sync-all-sources                         │
│                   (Orchestration Layer)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   unified-   │ │ deduplicate- │ │  Statistics  │
│   crawler    │ │   booths     │ │  Generator   │
└──────┬───────┘ └──────┬───────┘ └──────────────┘
       │                │
       ▼                ▼
┌──────────────┐ ┌──────────────┐
│  Firecrawl   │ │  Fuzzy Match │
│     API      │ │  Algorithm   │
└──────┬───────┘ └──────┬───────┘
       │                │
       ▼                ▼
┌──────────────────────────────┐
│      Supabase Database       │
│  - booths                    │
│  - crawl_sources             │
│  - booth_duplicates          │
└──────────────────────────────┘
```

## Features

### Multi-Source Crawling
- **Firecrawl Integration**: Uses Firecrawl's batch crawling API for efficient, reliable scraping
- **Source-Specific Extractors**: Custom parsers optimized for each website's structure
- **Incremental Crawling**: Only re-crawls sources based on configurable frequency
- **Checkpointing**: Resume from last successful page if interrupted
- **Rate Limiting**: Adaptive throttling to respect API limits

### Intelligent Deduplication
- **Fuzzy Matching**: Levenshtein distance algorithm for name matching (85%+ threshold)
- **Geographic Proximity**: Haversine distance calculation for coordinate-based matching
- **Confidence Scoring**:
  - 100% = Exact match
  - 90%+ = High confidence (auto-merge)
  - 80-90% = Probable (auto-merge or flag)
  - <80% = Manual review required
- **Multi-Source Tracking**: Preserves all source URLs when merging duplicates
- **Smart Merging**: Combines data from all sources, preferring most complete records

### Data Quality
- **Validation Pipeline**: Rejects records with HTML tags, concatenated data, or missing required fields
- **Normalization**: Consistent formatting of names, addresses, and locations
- **Geocoding**: Automatic coordinate lookup for booths without lat/lng
- **Provenance Tracking**: Records which source(s) contributed each booth

## Database Schema

### crawl_sources

Tracks external sources for booth data:

```sql
CREATE TABLE crawl_sources (
  id UUID PRIMARY KEY,
  source_name TEXT UNIQUE NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  country_focus TEXT,
  extractor_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,
  crawl_frequency_days INTEGER DEFAULT 7,
  last_crawl_timestamp TIMESTAMP,
  last_successful_crawl TIMESTAMP,
  total_booths_found INTEGER DEFAULT 0,
  total_booths_added INTEGER DEFAULT 0,
  total_booths_updated INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  consecutive_failures INTEGER DEFAULT 0,
  last_error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### booth_duplicates

Tracks duplicate booth entries:

```sql
CREATE TABLE booth_duplicates (
  id UUID PRIMARY KEY,
  primary_booth_id UUID NOT NULL REFERENCES booths(id),
  duplicate_booth_id UUID NOT NULL REFERENCES booths(id),
  confidence_score NUMERIC(5,2) NOT NULL,
  match_type TEXT NOT NULL, -- 'exact', 'high_confidence', 'probable', 'manual_review'
  name_similarity NUMERIC(5,2),
  location_similarity NUMERIC(5,2),
  distance_meters NUMERIC(10,2),
  merge_status TEXT DEFAULT 'pending', -- 'pending', 'merged', 'rejected', 'manual_review'
  merged_at TIMESTAMP,
  primary_sources TEXT[],
  duplicate_sources TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Extended booths table

New fields for source tracking:

```sql
ALTER TABLE booths ADD COLUMN source_names TEXT[] DEFAULT '{}';
ALTER TABLE booths ADD COLUMN source_urls TEXT[] DEFAULT '{}';
ALTER TABLE booths ADD COLUMN is_merged BOOLEAN DEFAULT false;
ALTER TABLE booths ADD COLUMN merged_from_ids UUID[] DEFAULT '{}';
```

## Installation

### 1. Run Database Migrations

```bash
# Navigate to project root
cd /Users/jkw/Projects/booth-beacon

# Apply migrations (in order)
supabase db push supabase/migrations/20251123_crawl_sources_table.sql
supabase db push supabase/migrations/20251123_booth_duplicates_table.sql
```

### 2. Deploy Supabase Functions

```bash
# Deploy unified crawler
supabase functions deploy unified-crawler

# Deploy deduplication function
supabase functions deploy deduplicate-booths

# Deploy orchestration function
supabase functions deploy sync-all-sources
```

### 3. Set Environment Variables

```bash
# In Supabase Dashboard > Project Settings > Functions
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
LOVABLE_API_KEY=your_lovable_api_key_here  # For AI-powered extraction fallback
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here  # For geocoding
```

## Configuration

### Crawl Sources Configuration

Sources are configured in the `crawl_sources` table. Default sources are seeded automatically.

To add/modify sources:

```sql
-- Add new source
INSERT INTO crawl_sources (
  source_name,
  source_url,
  source_type,
  country_focus,
  extractor_type,
  priority,
  crawl_frequency_days
) VALUES (
  'my-new-source',
  'https://example.com/booths',
  'directory',
  'France',
  'my_extractor',
  75,
  7
);

-- Update source priority
UPDATE crawl_sources
SET priority = 95
WHERE source_name = 'photomatica.com';

-- Disable source temporarily
UPDATE crawl_sources
SET enabled = false
WHERE source_name = 'photomatic.net';
```

### Crawl Frequency

Default: 7 days. Adjust per source:

```sql
UPDATE crawl_sources
SET crawl_frequency_days = 14
WHERE source_name = 'photobooth.net';
```

## Usage

### Run Full Sync (Recommended)

Crawls all sources, deduplicates, and generates statistics:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/sync-all-sources \
  -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "force_crawl": false,
    "run_deduplication": true,
    "auto_merge_duplicates": true,
    "min_confidence": 85,
    "send_report": true
  }'
```

### Run Crawler Only

```bash
curl -X POST https://your-project.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "force_crawl": true
  }'
```

### Crawl Specific Source

```bash
curl -X POST https://your-project.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "photomatica.com",
    "force_crawl": true
  }'
```

### Run Deduplication Only

```bash
curl -X POST https://your-project.supabase.co/functions/v1/deduplicate-booths \
  -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "country_filter": "Germany",
    "min_confidence": 80,
    "auto_merge": true,
    "batch_size": 100
  }'
```

### Manual Duplicate Review

View duplicates requiring manual review:

```sql
SELECT * FROM duplicate_review_queue
ORDER BY confidence_score DESC
LIMIT 20;
```

Approve a merge:

```sql
UPDATE booth_duplicates
SET merge_status = 'merged', merged_at = NOW()
WHERE id = 'duplicate-id-here';
```

Reject a duplicate:

```sql
UPDATE booth_duplicates
SET merge_status = 'rejected'
WHERE id = 'duplicate-id-here';
```

## Deduplication Algorithm

### Confidence Scoring Formula

```
confidence_score = (name_similarity × 0.5) + (location_similarity × 0.3) + (distance_score × 0.2)
```

### Match Types

1. **Exact Match (100%)**:
   - Same normalized name + same address + same city
   - Confidence ≥ 95% AND name similarity ≥ 90%

2. **High Confidence (90%+)**:
   - Name similarity ≥ 85% + same city + same country
   - Confidence ≥ 90% AND name similarity ≥ 85%

3. **Probable (80-90%)**:
   - Name similarity ≥ 75% + same city OR nearby coordinates (<1km)
   - Confidence ≥ 80% AND name similarity ≥ 75%

4. **Manual Review (<80%)**:
   - Name similarity ≥ 70% + same city
   - Flagged for human review

### Levenshtein Distance

Used for fuzzy string matching:

```typescript
function levenshteinSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  return ((maxLength - distance) / maxLength) * 100;
}
```

### Geographic Distance

Haversine formula for coordinate-based matching:

```typescript
function haversineDistance(lat1, lon1, lat2, lon2): number {
  // Returns distance in meters
  // <100m = high match, <500m = probable, <1km = possible
}
```

### Distance Scoring

- **<100m**: 30 points
- **<500m**: 20 points
- **<1000m**: 10 points
- **<5000m**: 5 points
- **≥5000m**: 0 points

## Adding New Sources

### Step 1: Add Source Extractor

Create extractor in `/supabase/functions/unified-crawler/extractors.ts`:

```typescript
export async function extractMyNewSource(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    // Parse HTML or markdown
    const lines = markdown.split('\n');

    for (const line of lines) {
      // Extract booth data using patterns specific to this source
      const match = line.match(/your-pattern-here/);
      if (match) {
        booths.push({
          name: match[1],
          address: match[2],
          city: match[3],
          country: 'France',
          source_url: sourceUrl,
          source_name: 'my-new-source',
          status: 'active',
          booth_type: 'analog',
          is_operational: true,
        });
      }
    }
  } catch (error) {
    errors.push(`Extraction error: ${error}`);
  }

  return {
    booths,
    errors,
    metadata: {
      pages_processed: 1,
      total_found: booths.length,
      extraction_time_ms: Date.now() - startTime,
    },
  };
}
```

### Step 2: Register Extractor

Add to `extractFromSource()` function in `/supabase/functions/unified-crawler/index.ts`:

```typescript
async function extractFromSource(...): Promise<ExtractorResult> {
  switch (extractorType) {
    case 'photomatica':
      return extractPhotomatica(html, markdown, sourceUrl);
    case 'my_new_source':  // Add this
      return extractMyNewSource(html, markdown, sourceUrl);
    default:
      return extractGeneric(html, markdown, sourceUrl, sourceName, lovableApiKey);
  }
}
```

### Step 3: Add Source to Database

```sql
INSERT INTO crawl_sources (
  source_name,
  source_url,
  source_type,
  country_focus,
  extractor_type,
  priority,
  notes
) VALUES (
  'my-new-source',
  'https://example.com/booths',
  'directory',
  'France',
  'my_new_source',
  75,
  'French photobooth directory'
);
```

### Step 4: Test Extraction

```bash
curl -X POST https://your-project.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "my-new-source",
    "force_crawl": true
  }'
```

## Deployment

### Scheduled Crawls (Recommended)

Set up weekly crawls using Supabase Cron or external scheduler:

```sql
-- Example: Use Supabase Edge Functions with pg_cron
SELECT cron.schedule(
  'weekly-booth-sync',
  '0 2 * * 0',  -- Sunday 2 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/sync-all-sources',
    headers := '{"Authorization": "Bearer YOUR_KEY"}'::jsonb,
    body := '{"force_crawl": false, "run_deduplication": true}'::jsonb
  );
  $$
);
```

### Manual Deployment

```bash
# Deploy all functions
supabase functions deploy unified-crawler
supabase functions deploy deduplicate-booths
supabase functions deploy sync-all-sources

# Or deploy individually with custom options
supabase functions deploy unified-crawler --no-verify-jwt
```

### Environment Setup

Required environment variables:

```bash
# Firecrawl API (required)
FIRECRAWL_API_KEY=fc-xxx

# Lovable AI API (for generic extraction fallback)
LOVABLE_API_KEY=lovable-xxx

# Google Maps API (for geocoding)
GOOGLE_MAPS_API_KEY=AIza-xxx

# Supabase (auto-configured)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Troubleshooting

### Crawler Issues

**Problem**: Source returns 0 booths

```sql
-- Check source status
SELECT * FROM crawl_sources WHERE source_name = 'problem-source';

-- Check error logs
SELECT last_error_message, last_error_timestamp
FROM crawl_sources
WHERE source_name = 'problem-source';

-- Force crawl with debug
curl -X POST .../unified-crawler \
  -d '{"source_name": "problem-source", "force_crawl": true}'
```

**Problem**: Firecrawl rate limit exceeded

- Check Firecrawl dashboard for usage
- Adjust `batch_size` and add delays between requests
- Upgrade Firecrawl plan if needed

### Deduplication Issues

**Problem**: Too many false positives

```sql
-- Increase minimum confidence threshold
curl -X POST .../deduplicate-booths \
  -d '{"min_confidence": 90, "auto_merge": false}'
```

**Problem**: Missing obvious duplicates

```sql
-- Lower confidence threshold and review manually
curl -X POST .../deduplicate-booths \
  -d '{"min_confidence": 75, "auto_merge": false}'

-- Review results
SELECT * FROM duplicate_review_queue LIMIT 50;
```

### Database Issues

**Problem**: Migration conflicts

```bash
# Reset migrations (CAUTION: destroys data)
supabase db reset

# Or apply specific migration
supabase migration up 20251123_crawl_sources_table.sql
```

**Problem**: Performance degradation

```sql
-- Rebuild indexes
REINDEX TABLE booths;
REINDEX TABLE crawl_sources;
REINDEX TABLE booth_duplicates;

-- Analyze tables
ANALYZE booths;
ANALYZE crawl_sources;
ANALYZE booth_duplicates;
```

## Sample Crawl Output

```json
{
  "success": true,
  "summary": {
    "total_booths_found": 487,
    "total_booths_added": 52,
    "total_booths_updated": 435,
    "sources_processed": 4
  },
  "results": [
    {
      "source_name": "photobooth.net",
      "status": "success",
      "booths_found": 312,
      "booths_added": 28,
      "booths_updated": 284,
      "extraction_time_ms": 8423,
      "crawl_duration_ms": 45231,
      "pages_crawled": 15
    },
    {
      "source_name": "photomatica.com",
      "status": "success",
      "booths_found": 89,
      "booths_added": 12,
      "booths_updated": 77,
      "extraction_time_ms": 3214,
      "crawl_duration_ms": 18765,
      "pages_crawled": 6
    },
    {
      "source_name": "photoautomat.de",
      "status": "success",
      "booths_found": 56,
      "booths_added": 8,
      "booths_updated": 48,
      "extraction_time_ms": 1876,
      "crawl_duration_ms": 12354,
      "pages_crawled": 4
    },
    {
      "source_name": "photomatic.net",
      "status": "success",
      "booths_found": 30,
      "booths_added": 4,
      "booths_updated": 26,
      "extraction_time_ms": 1123,
      "crawl_duration_ms": 8976,
      "pages_crawled": 2
    }
  ]
}
```

## Performance Metrics

### Expected Performance

- **Crawl Speed**: 50-100 booths per minute (depending on source)
- **Deduplication**: 1000 booths analyzed per second
- **Memory Usage**: <512MB per function invocation
- **Database Growth**: ~1KB per booth record

### Optimization Tips

1. **Batch Processing**: Process booths in batches of 50-100
2. **Rate Limiting**: Add 50ms delay between database writes
3. **Indexing**: Ensure GIN indexes on `source_names` field
4. **Caching**: Cache source configurations in memory

## Support

For issues or questions:
- Review logs in Supabase Dashboard > Functions > Logs
- Check crawl_sources table for error messages
- Review duplicate_review_queue for manual intervention needs

## License

This system is part of Booth Beacon and follows the same license.
