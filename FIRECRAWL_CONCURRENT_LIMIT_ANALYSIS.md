# Firecrawl Concurrent Scraping Limit - Root Cause Analysis

**Date:** January 16, 2026
**Issue:** Hitting Firecrawl concurrent scraping limit
**Status:** Diagnosed - Requires configuration changes

---

## Summary

You're hitting Firecrawl's concurrent scraping limit because multiple scripts trigger async crawl jobs with insufficient delays between them, causing too many simultaneous Firecrawl jobs.

---

## Root Cause

### Database Status
- **Total crawl sources:** 230
- **Enabled sources:** 180
- **Currently crawling:** 0 (as of diagnosis)

### The Problem: Rapid-Fire Async Job Creation

**Scripts that trigger multiple concurrent crawls:**

1. **`scripts/trigger-sf-crawls.ts`** (lines 39-76)
   - Triggers **12 San Francisco sources**
   - Delay between triggers: **2 seconds**
   - All use `action: 'trigger_async_crawl'`
   - Creates 12 Firecrawl async jobs in 24 seconds

2. **`scripts/trigger-priority-90-crawls.ts`** (lines 35-73)
   - Triggers **ALL priority 90+ sources**
   - Delay between triggers: **2.5 seconds**
   - Uses `async_mode: true`
   - Can trigger 10+ sources in rapid succession

3. **`scripts/maintenance/trigger-all-crawlers.ts`** (line 17)
   - Triggers with `action: 'crawl_all'`
   - Processes ALL 180 enabled sources sequentially
   - But each source that uses async mode creates concurrent Firecrawl jobs

### How Async Crawling Works

**From `supabase/functions/unified-crawler/index.ts`:**

```typescript
// Lines 382-424: Async mode starts Firecrawl job and returns immediately
if (source.crawl_mode === 'async' || asyncModeParam) {
  const asyncResult = await startAsyncCrawl({
    sourceId: source.id,
    sourceName: source.source_name,
    sourceUrl: source.source_url,
    pageLimit: pageLimit,
  });

  // Returns immediately - job runs in background
  return {
    success: true,
    message: `Async crawl started for ${source.source_name}`
  };
}
```

**From `supabase/functions/unified-crawler/async-crawler.ts`:**

```typescript
// Lines 38-59: Creates Firecrawl async job via webhook
const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firecrawlApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: sourceUrl,
    limit: pageLimit,
    webhook: webhookUrl,  // Firecrawl will call this when done
  }),
});
```

---

## Why This Causes Concurrent Limit Errors

### Firecrawl Plan Limits (Typical)
- **Starter Plan:** 5 concurrent crawls
- **Growth Plan:** 20 concurrent crawls
- **Enterprise Plan:** Custom limits

### Timeline Example: `trigger-priority-90-crawls.ts`

```
Time    Action                           Concurrent Jobs
-----------------------------------------------------------
0s      Trigger Source 1 (async)         1 active
2.5s    Trigger Source 2 (async)         2 active
5s      Trigger Source 3 (async)         3 active
7.5s    Trigger Source 4 (async)         4 active
10s     Trigger Source 5 (async)         5 active ← Limit reached
12.5s   Trigger Source 6 (async)         6 active ❌ ERROR!
```

**Problem:** With only 2.5-second delays, you can trigger 5+ sources before the first job completes. If your Firecrawl plan allows 5 concurrent crawls, the 6th trigger will fail.

---

## Evidence in Code

### 1. Rapid Trigger Pattern
**File:** `scripts/trigger-priority-90-crawls.ts`

```typescript
for (const source of sources) {
  // Trigger async crawl
  await fetch('...', {
    body: JSON.stringify({
      source_id: source.id,
      force_crawl: true,
      async_mode: true,  // ← Creates background Firecrawl job
    }),
  });

  // Only 2.5 second delay!
  await new Promise(resolve => setTimeout(resolve, 2500));
}
```

### 2. Similar Pattern in SF Crawls
**File:** `scripts/trigger-sf-crawls.ts`

```typescript
for (const source of sources) {
  await triggerCrawl(source.id, source.source_name);  // ← Async job

  // Only 2 second delay!
  await new Promise(resolve => setTimeout(resolve, 2000));
}
```

### 3. Batch Processing is Sequential (Good)
**File:** `supabase/functions/unified-crawler/index.ts:760-1082`

Within a single source, batch processing is sequential:
```typescript
while (currentPage < totalPages && !timeoutReached) {
  batchNumber++;
  // Process batch
  // Update progress
  currentPage += pageLimit;

  // Next batch starts AFTER previous completes ✓
}
```

**But** when multiple sources are triggered in async mode, they ALL create concurrent Firecrawl jobs.

---

## Solutions

### Solution 1: Increase Delay Between Triggers (Quick Fix)

**Modify `trigger-priority-90-crawls.ts` and `trigger-sf-crawls.ts`:**

```typescript
// Before:
await new Promise(resolve => setTimeout(resolve, 2500));

// After (assuming 5 concurrent limit, ~60s avg crawl time):
await new Promise(resolve => setTimeout(resolve, 15000));  // 15 seconds
```

**Calculation:**
- If your Firecrawl plan allows 5 concurrent crawls
- Average crawl time: 60 seconds
- Safe delay: 60s / 5 = 12 seconds minimum
- Recommended: 15 seconds (includes safety margin)

**Implementation:**
```bash
# Edit the scripts
vim scripts/trigger-priority-90-crawls.ts  # Line 67
vim scripts/trigger-sf-crawls.ts           # Line 75
```

---

### Solution 2: Add Concurrency Control (Better)

Create a queue manager that respects Firecrawl limits.

**New file:** `scripts/concurrency-queue.ts`

```typescript
export class CrawlQueue {
  private maxConcurrent: number;
  private currentlyRunning: number = 0;
  private queue: Array<() => Promise<void>> = [];

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  async add(task: () => Promise<void>): Promise<void> {
    if (this.currentlyRunning >= this.maxConcurrent) {
      // Wait for a slot to open
      await new Promise(resolve => {
        this.queue.push(async () => {
          await task();
          resolve(undefined);
        });
      });
    } else {
      this.currentlyRunning++;
      try {
        await task();
      } finally {
        this.currentlyRunning--;
        this.processQueue();
      }
    }
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.currentlyRunning < this.maxConcurrent) {
      const next = this.queue.shift();
      if (next) {
        this.currentlyRunning++;
        next().finally(() => {
          this.currentlyRunning--;
          this.processQueue();
        });
      }
    }
  }
}
```

**Usage in trigger scripts:**
```typescript
import { CrawlQueue } from './concurrency-queue';

const queue = new CrawlQueue(5); // Respect Firecrawl limit

for (const source of sources) {
  await queue.add(async () => {
    await triggerCrawl(source.id, source.source_name);
  });
}
```

**Effort:** ~1-2 hours
**Impact:** Eliminates concurrent limit errors permanently

---

### Solution 3: Check Firecrawl Plan & Upgrade (If Needed)

**Check your current plan:**
```bash
# Contact Firecrawl support or check dashboard at:
# https://firecrawl.dev/dashboard
```

**Plan comparison:**
- **Starter ($25/mo):** 5 concurrent crawls
- **Growth ($125/mo):** 20 concurrent crawls
- **Enterprise:** Custom limits

If you regularly need to crawl 10+ sources simultaneously, upgrading to Growth plan would eliminate this bottleneck.

---

### Solution 4: Use Sync Mode for Small Sources (Alternative)

For sources with few pages, use synchronous mode instead of async.

**Modify source configuration:**
```sql
UPDATE crawl_sources
SET crawl_mode = 'sync'
WHERE total_pages_target < 10;  -- Small sources don't need async
```

**Trade-offs:**
- ✅ Doesn't consume Firecrawl concurrent slots
- ❌ Slower for large sources (blocks Edge Function)
- ✅ Good for sources with 1-5 pages

---

## Recommended Action Plan

### Immediate (Do Now)
1. **Increase delays in trigger scripts to 15 seconds**
   ```bash
   # Edit these files:
   scripts/trigger-priority-90-crawls.ts (line 67)
   scripts/trigger-sf-crawls.ts (line 75)

   # Change to:
   await new Promise(resolve => setTimeout(resolve, 15000));
   ```

2. **Check your Firecrawl plan limits**
   - Visit https://firecrawl.dev/dashboard
   - Note your concurrent crawl limit
   - Adjust delays accordingly: `avg_crawl_time / concurrent_limit`

### Short-term (Next Week)
3. **Implement concurrency queue manager (Solution 2)**
   - Create `scripts/concurrency-queue.ts`
   - Update trigger scripts to use queue
   - Test with 5 concurrent limit

### Long-term (If Scaling)
4. **Consider Firecrawl plan upgrade**
   - If you need to crawl 20+ sources regularly
   - Growth plan ($125/mo) provides 20 concurrent crawls
   - More cost-effective than waiting for sequential processing

---

## Testing the Fix

### Before Fix (Reproduce Issue)
```bash
# This SHOULD hit concurrent limit with current delays
npm run trigger-priority-90-crawls
```

### After Fix (Verify)
```bash
# With 15-second delays, should complete without errors
npm run trigger-priority-90-crawls

# Monitor Firecrawl dashboard to verify concurrent count stays < limit
```

---

## Monitoring

### Watch for concurrent limit errors
```bash
# Check Edge Function logs
supabase functions logs unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy

# Look for errors like:
# "concurrent scraping limit exceeded"
# "too many concurrent requests"
```

### Track crawl success rate
```sql
SELECT
  COUNT(*) as total_crawls,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM crawl_sources
WHERE last_crawl_at > NOW() - INTERVAL '1 day';
```

---

## Key Takeaways

1. **The Issue:** Triggering multiple async crawls too quickly creates concurrent Firecrawl jobs that exceed plan limits

2. **Quick Fix:** Increase delays between triggers to 15+ seconds

3. **Better Solution:** Implement concurrency queue manager

4. **Root Prevention:** Understand your Firecrawl plan limits and design trigger scripts accordingly

5. **No Code Changes Needed in Crawler:** The unified-crawler Edge Function is working correctly - it's the trigger scripts that need adjustment

---

**Status:** Ready to fix - choose solution and implement
**Expected Resolution Time:** < 1 hour for Solution 1, 2-3 hours for Solution 2
**No Breaking Changes:** All fixes are backwards compatible
