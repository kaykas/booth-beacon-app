# 🚀 Deploy Async Crawler - Step by Step

**Time Required:** 10 minutes
**Benefit:** Fixes 150-second timeout, enables crawling 100+ pages

---

## Quick 3-Step Deployment

### Step 1: Run Database Migration (2 minutes)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/editor
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

2. **Paste this SQL:**

```sql
-- Create crawl_jobs table for async Firecrawl job tracking
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text UNIQUE NOT NULL,
  source_id uuid NOT NULL REFERENCES crawl_sources(id),
  source_name text NOT NULL,
  source_url text NOT NULL,
  extractor_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  pages_crawled integer DEFAULT 0,
  booths_found integer DEFAULT 0,
  booths_added integer DEFAULT 0,
  booths_updated integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  crawl_duration_ms integer,
  extraction_time_ms integer,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_crawl_jobs_job_id ON crawl_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON crawl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_source_id ON crawl_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_created_at ON crawl_jobs(created_at DESC);

GRANT SELECT, INSERT, UPDATE ON crawl_jobs TO service_role;
GRANT SELECT ON crawl_jobs TO anon, authenticated;
```

3. **Click "Run"**
   - Should see: "Success. No rows returned"

---

### Step 2: Deploy Edge Functions (3 minutes)

#### Option A: Using Supabase CLI (Recommended)

```bash
# Get your access token from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-token-here"

# Deploy webhook handler
supabase functions deploy firecrawl-webhook --project-ref tmgbmcbwfkvmylmfpkzy

# Deploy updated crawler
supabase functions deploy unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy
```

#### Option B: Using Supabase Dashboard

**Deploy firecrawl-webhook:**
1. Go to: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/functions
2. Click "Deploy new function"
3. Name: `firecrawl-webhook`
4. Upload: `supabase/functions/firecrawl-webhook/index.ts`

**Deploy unified-crawler:**
1. Click "Deploy new function"
2. Name: `unified-crawler`
3. Upload: `supabase/functions/unified-crawler/index.ts`
4. Note: This updates the existing function

---

### Step 3: Test Async Crawl (5 minutes)

Run the test script:

```bash
node scripts/test-async-crawl.mjs photobooth.net
```

**Expected Output:**
```
✅ Request completed in 3.2s
🎉 SUCCESS! Async crawl started:
   Job ID: abc123-def456-...
   Status: pending

💡 The crawl is now running in the background.
   No timeout! Can crawl 100+ pages!
```

Then wait 5-10 minutes and check the database:

```sql
-- Check job status
SELECT job_id, status, pages_crawled, booths_added
FROM crawl_jobs
ORDER BY created_at DESC
LIMIT 5;

-- Check new booths
SELECT COUNT(*)
FROM booths
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## That's It!

After these 3 steps:
- ✅ photobooth.net will work (was timing out before)
- ✅ photoautomat.de will work (was timing out before)
- ✅ Can crawl unlimited pages (no 150s timeout)
- ✅ 50-100+ new booths expected from photobooth.net alone

---

## Alternative: Automated Script

If you prefer automation, run:

```bash
bash scripts/deploy-async-crawler.sh
```

This will:
1. Check prerequisites
2. Guide you through migration
3. Deploy both Edge Functions
4. Run test automatically

---

## Verify Deployment

Check that functions are live:

```bash
curl https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler
# Should return 200 OK (or similar response)

curl https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/firecrawl-webhook
# Should return 200 OK (or similar response)
```

---

## Troubleshooting

### "crawl_jobs table not found"
- Run Step 1 again (database migration)
- Verify in Supabase Dashboard → Table Editor

### "Function not deployed"
- Check Supabase Dashboard → Edge Functions
- Verify both functions show as "Active"
- Try redeploying

### "Job stuck in 'pending'"
- Check Firecrawl API key is set
- Verify webhook URL is accessible
- Wait a few more minutes (large sources take time)

---

## Quick Reference

**Supabase Dashboard:**
- SQL Editor: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/editor
- Edge Functions: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/functions
- Table Editor: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/editor

**Test Commands:**
```bash
# Test async mode
node scripts/test-async-crawl.mjs photobooth.net

# Check job status
node scripts/check-crawl-jobs.mjs

# Manual API call
curl -X POST https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source_name": "photobooth.net", "async": true, "force_crawl": true}'
```

---

**Questions?** See `ASYNC_CRAWLER_IMPLEMENTATION.md` for full documentation.
