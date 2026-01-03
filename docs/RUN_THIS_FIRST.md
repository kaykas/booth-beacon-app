# 🚀 Run This First - Crawler Setup

Quick commands to get the async crawler working with crawl_sources.

---

## Step 1: Verify and Enable Sources

Copy and paste this command:

```bash
cd /Users/jkw/Projects/booth-beacon-app && \
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk" \
node setup-crawler.js
```

This will:
- ✅ Check if crawl_jobs table exists
- ✅ Show current source status
- ✅ Enable sources with configured extractors
- ✅ Display ready-to-crawl sources by tier
- ✅ Provide next steps

---

## Step 2: Test Async Crawler

Test with the gold standard source (Photobooth.net):

```bash
cd /Users/jkw/Projects/booth-beacon-app && \
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk" \
./test-async-crawler.sh "Photobooth.net"
```

Or test with another source:

```bash
cd /Users/jkw/Projects/booth-beacon-app && \
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk" \
./test-async-crawler.sh "Time Out LA"
```

---

## Step 3: Monitor Crawl Jobs

Check recent jobs:

```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk" \
node -e "
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

## Step 4: Check Results

View newly added booths:

```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk" \
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
supabase.from('booths')
  .select('name, city, country, source, created_at')
  .order('created_at', { ascending: false })
  .limit(20)
  .then(({data}) => {
    console.log('Latest 20 booths:');
    console.table(data);
  });
"
```

---

## What Was Created

### Scripts (Ready to Run)
- ✅ `setup-crawler.js` - Setup and enable sources
- ✅ `test-async-crawler.sh` - Test crawler with any source
- ✅ `enable-crawl-sources.js` - Enable sources only
- ✅ `analyze-crawl-sources.js` - Analyze without changes

### Documentation
- ✅ `CRAWLER_SETUP_GUIDE.md` - Comprehensive guide
- ✅ `CRAWL_SOURCES_REPORT.md` - Investigation findings
- ✅ `RUN_THIS_FIRST.md` - This file (quick start)

### SQL Queries
- ✅ `check-and-populate-sources.sql` - Manual inspection queries

---

## Key Findings

1. **crawl_sources table is NOT empty** - Has 81 sources
2. **Many sources may need enabling** - Script will enable them
3. **Async crawler infrastructure exists** - Ready to use
4. **crawl_jobs table required** - Migration exists: `20260103_add_crawl_jobs_table.sql`

---

## Troubleshooting

### If crawl_jobs table doesn't exist:

Run this migration via Supabase dashboard or CLI:
```bash
supabase db push --db-url "your-connection-string"
```

Or manually in SQL editor:
```sql
-- Run the contents of:
-- supabase/migrations/20260103_add_crawl_jobs_table.sql
```

### If no sources are enabled:

The setup script will enable them automatically. If it fails, run:
```bash
node enable-crawl-sources.js
```

### If webhook isn't working:

Deploy the webhook function:
```bash
supabase functions deploy firecrawl-webhook --project-ref tmgbmcbwfkvmylmfpkzy
```

---

## Expected Output

After Step 1, you should see:
```
✅ crawl_jobs table exists
✅ Ready to crawl: XX sources

TIER 1 - Gold Standard:
  100: Photobooth.net
   90: Lomography Locations
   ...
```

After Step 2, you should see:
```
✅ Crawl job started successfully!
Job ID: xxx-xxx-xxx
```

After Step 3, you should see jobs with status:
- `pending` - Just started
- `crawling` - Firecrawl is crawling
- `processing` - Webhook processing data
- `completed` - Done!

---

## Next Actions

1. Run Step 1 to setup ✅
2. Run Step 2 to test ✅
3. Wait for job to complete (check Step 3)
4. Verify booths added (Step 4)
5. Scale to more sources

---

## Full Documentation

See `CRAWLER_SETUP_GUIDE.md` for:
- Architecture details
- All extractor types
- Troubleshooting guide
- Adding new sources
- Performance tuning

---

**Ready to go! Run Step 1 now.** 🚀
