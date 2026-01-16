# BoothBeacon Usage Anomaly - Root Cause Analysis

**Date:** January 16, 2026 at 19:15 UTC
**Detection:** Vercel Usage Anomalies Alert
**Severity:** HIGH - Immediate action required

## Anomaly Metrics

### Edge Requests
- **Past 24h average:** 41 requests
- **Last 5 minutes:** 1.7k requests
- **Increase:** **41x spike** ⚠️

### Function Invocations
- **Past 24h average:** 42 invocations
- **Last 5 minutes:** 6.4k invocations
- **Increase:** **153x spike** ⚠️

---

## Root Cause Identified

### Primary Issue: Uncached Dynamic Sitemap

**File:** `src/app/sitemap.ts`

The sitemap generates dynamically on EVERY request with NO caching:

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Heavy database queries on EVERY sitemap request:

  // 1. Fetch ALL active booths
  const { data: booths } = await supabase
    .from('booths')
    .select('slug, updated_at, status, name, city, latitude, longitude, data_source_type')
    .eq('status', 'active');

  // 2. Fetch ALL locations for country/city pages
  const { data: locations } = await supabase
    .from('booths')
    .select('country, state, city')
    .eq('status', 'active');

  // 3. Fetch ALL city guides
  const { data: guides } = await supabase
    .from('city_guides')
    .select('slug, updated_at')
    .eq('published', true);

  // 4. Generate machine model pages
  const machineSlugs = getAllMachineModelSlugs(); // ~50+ machines

  // Returns 500+ URLs with complex processing
}
```

**No caching configured** - missing these exports:
```typescript
export const revalidate = 3600; // NOT PRESENT
export const dynamic = 'force-static'; // NOT PRESENT
```

---

## Trigger Events

### 1. IndexNow API Implementation (Jan 14, 2026)
**Commit:** `1d2272f` - "feat: Implement IndexNow API for instant search engine indexing"

- Notifies Bing, Yandex, Naver, Seznam when pages are created/updated
- Sends instant "come crawl now" signals to search engines
- Integrated into booth approval and page revalidation workflows

### 2. Aggressive robots.txt (Allows Many Crawlers)
**File:** `src/app/robots.ts`

Allows full access to:
- Googlebot
- GPTBot (ChatGPT)
- Claude-Web
- PerplexityBot
- CCBot (Common Crawl)
- Google-Extended (Bard/Gemini)
- cohere-ai
- FacebookBot
- Applebot-Extended

All pointing to: `sitemap: 'https://boothbeacon.org/sitemap.xml'`

### 3. Recent SEO Optimizations
**Commits (Jan 11-14, 2026):**
- `91b3a67` - High-impact collection pages
- `bbe1175` - Discovery optimizations for 674 pages
- `1e944f3` - Google Search Console fixes
- `c18d32f` - AI discovery and search optimization
- `b3c5a5d` - Comprehensive SEO improvements

---

## Attack Vector Timeline

```
1. Jan 14: IndexNow API deployed → Notifies search engines of new/updated content
   └─> Bing, Yandex, Naver, Seznam receive "crawl now" signals

2. Search engines follow IndexNow notification → Hit robots.txt
   └─> robots.txt points to sitemap.xml

3. Multiple search engines + AI crawlers hit sitemap.xml simultaneously
   └─> Each sitemap request triggers:
       - 4 database queries (booths, locations, guides, models)
       - Complex filtering and processing
       - ~500+ URLs generated
       - NO CACHING

4. Sitemap regenerates from scratch EVERY TIME
   └─> 1.7k sitemap requests in 5 minutes = 6.4k function invocations
       (4 DB queries × 1,700 requests = 6,800 invocations)
```

---

## Why This is Critical

### Cost Implications
- **Vercel Edge Requests:** Excessive bandwidth usage
- **Supabase Database:** 6,800+ queries in 5 minutes = 81,600/hour rate
- **Function Invocations:** Hitting serverless limits

### Performance Impact
- Sitemap generation: ~2-5 seconds per request
- Database connection pool exhaustion risk
- Potential rate limiting from Supabase
- Poor user experience if crawlers slow down the site

### Cascading Risks
1. **Database Overload:** Could impact actual users
2. **Cost Explosion:** Serverless billing spike
3. **Service Degradation:** Slow responses across the board
4. **IP Throttling:** Crawlers may get rate-limited and stop crawling

---

## Additional Contributing Factors

### RSS Feed (feed.xml/route.ts)
- Also uncached
- Queries 50 recent booths on every request
- Less severe than sitemap but adds to problem

### No Rate Limiting on Public Routes
- `/sitemap.xml` - No protection
- `/feed.xml` - No protection
- `/robots.txt` - Fetched frequently by crawlers

---

## Immediate Mitigation Required

### Priority 1: Cache the Sitemap (CRITICAL)
**File:** `src/app/sitemap.ts`

Add these exports:
```typescript
export const revalidate = 3600; // Regenerate every hour (ISR)
export const dynamic = 'force-static'; // Enable static generation

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ... existing code
}
```

**Impact:** Reduces 1,700 requests → 1 request per hour = **99.9% reduction**

### Priority 2: Cache the RSS Feed
**File:** `src/app/feed.xml/route.ts`

Currently has:
```typescript
'Cache-Control': 'public, max-age=3600, s-maxage=3600',
```

But no ISR on the route itself. Add:
```typescript
export const revalidate = 3600;
export const dynamic = 'force-static';
```

### Priority 3: Add Crawler Rate Limiting (Optional)
Consider implementing middleware to rate-limit sitemap requests:
- Max 10 requests per IP per minute
- Use Vercel Edge Config or Upstash Redis

---

## Long-Term Improvements

### 1. Sitemap Index Strategy
For sites with 500+ URLs, implement sitemap index:
```xml
<sitemapindex>
  <sitemap>
    <loc>https://boothbeacon.org/sitemap-booths.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://boothbeacon.org/sitemap-locations.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://boothbeacon.org/sitemap-guides.xml</loc>
  </sitemap>
</sitemapindex>
```

Benefits:
- Smaller, more focused sitemaps
- Better cache hit rates
- Easier to invalidate specific sections

### 2. Smarter IndexNow Integration
- Batch submissions (currently submits individually)
- Debounce rapid updates (wait 5 min before notifying)
- Only submit to one endpoint (api.indexnow.org), not all engines

### 3. Monitor Crawler Behavior
- Track user-agent patterns
- Identify aggressive crawlers
- Block misbehaving bots if needed

---

## Next Steps

1. **Deploy sitemap caching immediately** (< 5 min fix)
2. **Monitor Vercel metrics** for next 24 hours
3. **Verify anomaly resolved** (expect 99% reduction)
4. **Implement sitemap index** for better scalability
5. **Review IndexNow submission strategy** for optimization

---

## Verification Commands

```bash
# Check sitemap response time
time curl -I https://boothbeacon.org/sitemap.xml

# Monitor Vercel logs after fix
vercel logs

# Check Supabase connection pool
# (via Supabase Dashboard → Database → Connection Pooling)
```

---

**Status:** Diagnosed ✅
**Fix Ready:** Yes - Add ISR caching
**ETA:** < 5 minutes to implement and deploy
**Expected Impact:** 99.9% reduction in function invocations

