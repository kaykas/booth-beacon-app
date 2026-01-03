# Crawler Fix Instructions

The original crawler running on Supabase Edge Functions was timing out due to execution limits. We have created a robust, local crawler script that runs indefinitely until completion.

## Prerequisites

Ensure you have the following environment variables in your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
FIRECRAWL_API_KEY=...
ANTHROPIC_API_KEY=...
```

## How to Run the Robust Crawler

1. Open your terminal.
2. Run the crawler script:

```bash
# Load environment variables and run
source .env.local && npx tsx scripts/robust-crawler.ts
```

This script will:
1. Fetch all enabled sources from Supabase.
2. Scrape each source using Firecrawl.
3. Extract booth data using Claude 3 Opus.
4. Upsert the data into the `booths` table (avoiding duplicates).
5. Update source status and statistics.

## Troubleshooting Booth Pages

If booth pages are not rendering:
1. Run the crawler to ensure valid data is present.
2. Check `check-database-status.ts` to see if booths exist.
3. Ensure your `.env.local` has the correct `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the frontend to fetch data.
