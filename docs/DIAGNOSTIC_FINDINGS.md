# Diagnostic Findings: Why Only 3 Booths Exist

**Date:** November 28, 2025
**Investigation:** Root cause analysis for "only 3 booths in database"
**Status:** 🔴 CRITICAL - Crawler has never executed

---

## Executive Summary

After running comprehensive diagnostic queries, we discovered that **the automated crawler has never been run**. All infrastructure exists and is properly configured, but there have been zero crawl executions since deployment.

This explains why we only have 3 booths - they were manually seeded test data, not extracted from sources.

---

## Diagnostic Query Results

### Query 1: Raw Content Storage
**Result:** ❌ Table does not exist
**Implication:** The raw_content_storage table was never created. This table stores crawled HTML/markdown for reprocessing.

### Query 2: Crawler Metrics (Last 30 Days)
**Result:** ❌ Zero records
**Implication:** No crawls have been executed. The metrics table exists but is completely empty.

### Query 3: Current Booth Inventory
**Result:** ✅ 3 booths (manually seeded)
```
- Photo Booth at U-Bahn Warschauer Straße in Berlin, Germany (active)
- Camden Market Photo Booth in London, UK (active)
- Times Square Photo Booth in New York, USA (active)
```
**Implication:** These are test booths, not extracted from crawl sources.

### Query 4: Crawl Sources Configuration
**Result:** ✅ 46 total sources, 38 enabled
**Key Finding:** ALL sources show `Last crawled: Never`

**Top Priority Sources (Never Crawled):**
1. photobooth.net (priority: 100)
2. Photobooth.net (priority: 100)
3. photomatica.com (priority: 90)
4. Autophoto (priority: 90)
5. photoautomat.de (priority: 85)

### Query 5: Crawl Job Queue
**Result:** ❌ Zero jobs in queue
**Implication:** No scheduled or pending crawl jobs exist.

---

## Infrastructure Status

### ✅ What Exists and Works
1. **Database Schema**
   - `booths` table (3 manual records)
   - `crawl_sources` table (46 configured sources)
   - `crawler_metrics` table (empty but exists)
   - `crawl_job_queue` table (empty but exists)

2. **Deployed Code**
   - Unified crawler Edge Function deployed to Supabase
   - Admin dashboard components migrated and functional
   - Job queue UI ready for use
   - Performance tracking UI implemented

3. **Configuration**
   - 38 enabled crawl sources with priorities
   - Extractor types mapped correctly
   - Timeout fixes deployed (60s with 90s buffer)

### ❌ What's Missing or Broken
1. **raw_content_storage table** - Not created in migrations
2. **Crawl execution** - No mechanism triggering crawls
3. **Scheduler/Cron** - No automatic crawl scheduling
4. **Initial crawl run** - Never manually triggered

---

## Root Cause Analysis

### Why No Crawls Have Run

**Primary Hypothesis:** No trigger mechanism exists to start crawls automatically.

**Possible Reasons:**
1. **No cron job configured** - Edge Functions don't auto-execute
2. **No manual trigger** - Admin hasn't used job queue UI to schedule crawls
3. **Missing scheduler** - No system to create jobs based on crawl_frequency_days
4. **Deployment issue** - Edge Function might not be properly accessible

### Why This Wasn't Detected Earlier
1. Admin dashboard shows "healthy" state when no data exists
2. No monitoring/alerting configured
3. No "zero state" warnings in UI
4. Success rate metrics don't flag "never run" condition

---

## Immediate Action Plan

### Phase 1: Manual Test Crawl (Next 30 minutes)

**Objective:** Verify the crawler works end-to-end by manually triggering a single source.

**Steps:**
1. ✅ Open admin dashboard at `/admin`
2. ✅ Add a crawl job for highest-priority source:
   - Source: `photobooth.net`
   - Priority: 100
   - Force crawl: true
3. ✅ Monitor job execution in real-time
4. ✅ Check results:
   - Did Firecrawl retrieve content?
   - Did AI extraction find booths?
   - Were booths saved to database?
   - Did metrics update correctly?

**Success Criteria:**
- Job completes with status "completed"
- At least 1 booth extracted and saved
- crawler_metrics has 1 new record
- Performance metrics show time breakdown

**Failure Scenarios to Investigate:**
- Timeout errors → Reduce pages_per_batch
- Firecrawl API errors → Check API key and rate limits
- Extraction errors → Review AI prompt and schema
- Validation errors → Check booth validation rules
- Database errors → Check RLS policies and permissions

---

### Phase 2: Create Missing Infrastructure (1-2 hours)

**Task 2.1: Create raw_content_storage Table**
```sql
-- Migration: 007_raw_content_storage.sql
CREATE TABLE IF NOT EXISTS public.raw_content_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES crawl_sources(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT,
  content_type TEXT DEFAULT 'html',
  content_hash TEXT,
  metadata JSONB,
  crawled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_raw_content_source ON raw_content_storage(source_id);
CREATE INDEX idx_raw_content_hash ON raw_content_storage(content_hash);
CREATE INDEX idx_raw_content_crawled_at ON raw_content_storage(crawled_at DESC);
```

**Task 2.2: Create Crawl Scheduler**

Option A: Supabase pg_cron Extension
```sql
-- Schedule hourly crawl check
SELECT cron.schedule(
  'hourly-crawl-scheduler',
  '0 * * * *', -- Every hour
  $$
    -- Logic to create crawl_job_queue entries for sources
    -- that haven't been crawled within their crawl_frequency_days
  $$
);
```

Option B: Edge Function with Cron Trigger (Recommended)
- Create `/supabase/functions/crawl-scheduler/index.ts`
- Triggered via GitHub Actions or external cron service
- Queries crawl_sources for stale sources
- Creates jobs in crawl_job_queue

**Task 2.3: Add "First Run" Onboarding**

Update admin dashboard to show:
```typescript
if (totalCrawls === 0) {
  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>No crawls have been run yet</AlertTitle>
      <AlertDescription>
        Click "Add Job" to schedule your first crawl and start populating the database.
        We recommend starting with photobooth.net (our highest-priority source).
      </AlertDescription>
      <Button onClick={() => scheduleFirstCrawl()}>
        Schedule First Crawl
      </Button>
    </Alert>
  );
}
```

---

### Phase 3: Scale Up Extraction (2-4 hours)

Once manual test confirms the pipeline works:

**Task 3.1: Bulk Schedule Initial Crawls**
- Create script to schedule jobs for all 38 enabled sources
- Stagger execution to avoid rate limits
- Start with top 10 priority sources

**Task 3.2: Monitor and Iterate**
- Watch first 5-10 crawls complete
- Identify sources with failures
- Adjust extractor logic for failing sources
- Document successful extraction patterns

**Task 3.3: Implement Monitoring**
- Add email/Slack alerts for crawler failures
- Set up daily digest of crawler stats
- Create "zero booths extracted" alert

---

## Expected Outcomes

### After Phase 1 (Manual Test)
- ✅ 1 crawl completed
- ✅ 5-20 new booths in database
- ✅ Confirmation that pipeline works end-to-end
- ✅ Performance metrics baseline

### After Phase 2 (Infrastructure)
- ✅ Automatic scheduling enabled
- ✅ Raw content storage working
- ✅ Clear UI for "first run" experience

### After Phase 3 (Scale Up)
- ✅ 100+ booths from multiple sources
- ✅ Identified which sources work best
- ✅ Documented extraction patterns
- ✅ Monitoring and alerts active

---

## Key Insights from Diagnostics

1. **Infrastructure is solid** - Database schema, Edge Function, admin UI all exist and are properly configured

2. **No execution history** - This is a "cold start" problem, not a broken pipeline problem

3. **Configuration looks good** - 38 enabled sources with correct extractors and priorities

4. **Missing automation** - No scheduler to trigger crawls automatically

5. **Need initial seed** - Requires manual trigger to kickstart the system

---

## Recommended Next Steps

1. **RIGHT NOW:** Manually trigger test crawl for photobooth.net via admin dashboard
2. **If successful:** Schedule jobs for top 10 priority sources
3. **If failures:** Debug specific failure mode (API, extraction, validation, or database)
4. **Once working:** Create scheduler Edge Function
5. **Then:** Monitor and iterate on extraction quality

---

## Questions Answered

**Q: Why do we only have 3 booths?**
A: Because the crawler has never been executed. The 3 booths are manually seeded test data.

**Q: Is the crawler broken?**
A: Unknown - it's never been run. Manual test will determine if pipeline works.

**Q: Are the 38 configured sources wrong?**
A: Configuration appears correct, but won't know until we crawl them.

**Q: What's the fastest path to 100+ booths?**
A: Manually trigger crawls for top 10 sources via admin dashboard, monitor results, fix any failures.

**Q: Do we need to rebuild the crawler?**
A: Probably not - infrastructure looks solid. Just need to execute it.

---

## Files Referenced

- `/Users/jkw/Projects/booth-beacon-app/supabase/functions/unified-crawler/index.ts` - Crawler implementation
- `/Users/jkw/Projects/booth-beacon-app/src/components/admin/CrawlJobQueue.tsx` - Job scheduling UI
- `/Users/jkw/Projects/booth-beacon-app/src/components/admin/CrawlerHealthDashboard.tsx` - Health monitoring UI
- `/Users/jkw/Projects/booth-beacon-app/src/components/admin/CrawlPerformanceBreakdown.tsx` - Performance metrics UI

---

**Next Action:** Open `/admin` dashboard and manually trigger first crawl for `photobooth.net`.
