# Deploy Webhook Fix

## Changes Made

**File:** `supabase/functions/firecrawl-webhook/index.ts`

**Fix:** Updated `handleCrawlCompleted()` function to fetch page data from Firecrawl API instead of expecting it in the webhook payload.

### What Changed

The Firecrawl v1 API webhooks do NOT include page data in the payload. They only send:
- Event type (`crawl.completed`)
- Job ID
- Status

The page data must be fetched separately via:
```
GET https://api.firecrawl.dev/v1/crawl/{jobId}
```

### Code Changes

Before:
```typescript
async function handleCrawlCompleted(supabase: any, job: any, payload: FirecrawlWebhookPayload) {
  // Expected payload.data to contain pages (IT DOESN'T!)
  if (payload.data && payload.data.length > 0) {
    // Process pages...
  } else {
    // Error: no pages
  }
}
```

After:
```typescript
async function handleCrawlCompleted(supabase: any, job: any, payload: FirecrawlWebhookPayload) {
  // FETCH pages from Firecrawl API
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY")!;
  const firecrawlResponse = await fetch(
    `https://api.firecrawl.dev/v1/crawl/${payload.id}`,
    {
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`
      }
    }
  );

  const crawlData = await firecrawlResponse.json();
  const pages = crawlData.data || [];

  // Now process pages...
}
```

---

## Deployment Steps

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/functions
2. Click on `firecrawl-webhook` function
3. Click "Deploy new version"
4. Upload the updated file or paste the code
5. Deploy

### Option 2: Via Supabase CLI

First, login:
```bash
supabase login
```

Then deploy:
```bash
supabase functions deploy firecrawl-webhook --project-ref tmgbmcbwfkvmylmfpkzy --no-verify-jwt
```

### Option 3: Via GitHub Action (if configured)

Push to main branch - should auto-deploy via CI/CD.

---

## Testing After Deployment

Run the end-to-end test:

```bash
node scripts/test-async-e2e.mjs
```

**Expected result:**
```
✅ JOB COMPLETED!
   Pages crawled: 1
   Booths found: 1 (or more)
   Booths added: 1 (or more)
   Booths updated: 0

🎊 SUCCESS! Booths were extracted and saved!
```

---

## Verification

Check that the webhook function has been updated:

```bash
# Get function logs
supabase functions logs firecrawl-webhook --project-ref tmgbmcbwfkvmylmfpkzy --tail

# Should see:
# "📡 Fetching pages from Firecrawl API..."
# "📊 Fetched X pages from Firecrawl"
```

Check database:

```sql
SELECT
  job_id,
  status,
  pages_crawled,
  booths_found,
  booths_added,
  error_message
FROM crawl_jobs
ORDER BY created_at DESC
LIMIT 5;
```

---

## Rollback (if needed)

If the fix causes issues, rollback by reverting the webhook code to expect `payload.data`:

```bash
git checkout HEAD~1 supabase/functions/firecrawl-webhook/index.ts
supabase functions deploy firecrawl-webhook --project-ref tmgbmcbwfkvmylmfpkzy
```

---

## Impact

This fix will:
- ✅ Allow the async crawler to successfully retrieve pages from Firecrawl
- ✅ Enable booth extraction and saving
- ✅ Make the entire async crawler system functional end-to-end
- ✅ Support crawls of 100+ pages without timeout issues

**This is the final piece** needed to make the async crawler fully operational.
