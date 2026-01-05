# Places API Cost Analysis & Reduction Plan

**Date:** January 4, 2026
**Analyzed by:** Claude AI
**Status:** 🚨 URGENT - High costs identified

---

## 📊 Current Usage & Costs

### Cost Breakdown (Last 24 Hours)
```
Total Enrichments: 289 booths in 24 hours
Cost per Enrichment: $0.056

  Text Search API:  $0.032 (57% of cost)
  Place Details API: $0.017 (30% of cost)
  Photo API:        $0.007 (13% of cost)

Total Cost (24hr): $16.18
Monthly Projection: $486
Annual Projection: ~$5,904
```

### API Call Breakdown Per Enrichment
Each booth enrichment makes **3 Places API calls**:

1. **Text Search** (`scripts/enrich-booth/index.ts:92`)
   - Finds Place ID from name + coordinates
   - Cost: $0.032 per call
   - **Optimization opportunity: Cache Place IDs**

2. **Place Details** (`scripts/enrich-booth/index.ts:119`)
   - Fetches phone, website, hours, rating, photos
   - Cost: $0.017 per call
   - **Optimization opportunity: Reduce fields requested**

3. **Photo Download** (`scripts/enrich-booth/index.ts:146`)
   - Downloads primary photo
   - Cost: $0.007 per call
   - **Optimization opportunity: Skip if photo exists**

---

## 🔍 Root Cause Analysis

### Why 289 Enrichments in 24 Hours?

**Finding:** 180 enabled crawler sources triggered batch enrichments

**Evidence:**
- `crawl_sources` table shows 180 enabled sources
- Each successful crawl triggers enrichment on new/updated booths
- Recent crawler runs processed hundreds of booths

**The Problem:**
The 7-day skip window prevents re-enrichment, BUT:
- New booth discoveries trigger immediate enrichment
- Crawler updates existing booths → enrichment check
- 180 active sources = high discovery rate

---

## 💡 Cost Reduction Recommendations

### 1. 🎯 Cache Place IDs (High Priority)
**Savings: ~$9,248/year (57% reduction)**

**Problem:** Every enrichment calls Text Search API to find Place ID, even for booths we've already enriched.

**Solution:**
```typescript
// supabase/functions/enrich-booth/index.ts

// BEFORE (Lines 88-105):
const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(booth.name)}&location=${booth.latitude},${booth.longitude}&radius=100&key=${googleApiKey}`;
const textSearchResponse = await fetch(textSearchUrl);
const textSearchData = await textSearchResponse.json();

// AFTER (Proposed):
let placeId = booth.google_place_id; // Check if we already have it

if (!placeId) {
  // Only call Text Search if we don't have Place ID
  const textSearchUrl = `...`;
  const textSearchResponse = await fetch(textSearchUrl);
  const textSearchData = await textSearchResponse.json();
  placeId = textSearchData.results[0].place_id;
} else {
  console.log(`[${boothId}] Using cached Place ID: ${placeId}`);
}
```

**Impact:**
- First enrichment: $0.056 (all 3 APIs)
- Re-enrichments: $0.024 (skip Text Search)
- **Saves $0.032 per re-enrichment**

---

### 2. 📉 Reduce Place Details Fields (Medium Priority)
**Savings: ~$2,574/year (30% reduction on Details API)**

**Problem:** Fetching ALL fields from Place Details API, but only using a few.

**Current Code (Line 119):**
```typescript
const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googleApiKey}`;
```

**Optimized Code:**
```typescript
// Only request fields we actually use
const fields = [
  'formatted_phone_number',
  'international_phone_number',
  'website',
  'opening_hours',
  'rating',
  'photos'
].join(',');

const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${googleApiKey}`;
```

**Impact:**
- Reduces Place Details cost by ~50%
- **Saves $0.0085 per enrichment**

---

### 3. 📸 Skip Photo Download If Exists (Medium Priority)
**Savings: ~$2,023/year (13% reduction)**

**Problem:** Re-downloading photos on every enrichment.

**Solution:**
```typescript
// Check if booth already has a photo
if (booth.photo_exterior_url && !forcePhotoRefresh) {
  console.log(`[${boothId}] Photo already exists, skipping download`);
  permanentPhotoUrl = booth.photo_exterior_url;
} else {
  // Download photo logic...
}
```

**Impact:**
- **Saves $0.007 per enrichment** (when photo exists)
- Reduces Supabase storage usage

---

### 4. ⏱️ Increase Skip Window (Low Priority)
**Savings: ~$2,952/year (reduces re-enrichment frequency)**

**Current:** 7-day skip window (`enrich-booth/index.ts:58-71`)

**Recommendation:** Increase to 30 days

**Reasoning:**
- Phone numbers, hours, ratings rarely change
- 7 days is too frequent for static business data
- Photos are permanent once downloaded

**Code Change:**
```typescript
// Line 69-70
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
// Change to:
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

if (booth.enriched_at && new Date(booth.enriched_at) > thirtyDaysAgo) {
  // Skip enrichment
}
```

**Impact:**
- Reduces re-enrichment frequency by 75%
- **Saves ~$12 per month**

---

### 5. 🚦 Daily Enrichment Quota (High Priority)
**Savings: Prevents runaway costs**

**Problem:** No rate limiting = unlimited costs if crawlers go wild.

**Solution:** Add daily quota check:
```typescript
// At start of enrichBooth function
const today = new Date().toISOString().split('T')[0];
const { count: todayCount } = await supabase
  .from('booths')
  .select('*', { count: 'exact', head: true })
  .gte('enriched_at', `${today}T00:00:00Z`);

const DAILY_QUOTA = 200; // Max 200 enrichments/day
if (todayCount >= DAILY_QUOTA) {
  console.log(`Daily quota reached (${todayCount}/${DAILY_QUOTA})`);
  return { success: false, error: 'Daily quota exceeded' };
}
```

**Impact:**
- Caps daily cost at $11.20
- Prevents unexpected billing spikes
- **Maximum monthly cost: $336**

---

### 6. 🔍 Reduce Active Crawler Sources (Medium Priority)
**Savings: Reduces discovery rate**

**Current:** 180 enabled sources

**Recommendation:** Disable low-quality or duplicate sources

**Action Plan:**
1. Query `crawl_sources` to identify low-performing sources:
   ```sql
   SELECT name, source_type, last_successful_crawl
   FROM crawl_sources
   WHERE enabled = true
   ORDER BY last_successful_crawl DESC NULLS LAST;
   ```

2. Disable sources that:
   - Haven't crawled successfully in 30+ days
   - Extract duplicate data
   - Have high failure rates

**Target:** Reduce to 50-75 high-quality sources

**Impact:**
- Reduces new booth discovery rate by ~60%
- **Saves ~$6,000/year**

---

## 📋 Implementation Priority

### Phase 1: Immediate (Today)
1. ✅ **Add daily quota** (5 min implementation)
   - Prevents runaway costs immediately
   - File: `supabase/functions/enrich-booth/index.ts`
   - Lines: 50-60 (add quota check)

2. ✅ **Cache Place IDs** (15 min implementation)
   - Biggest cost savings (57%)
   - File: `supabase/functions/enrich-booth/index.ts`
   - Lines: 88-105 (add caching logic)

### Phase 2: Short-term (This Week)
3. ✅ **Reduce Place Details fields** (10 min)
   - 30% reduction on Details API
   - File: `supabase/functions/enrich-booth/index.ts`
   - Line: 119

4. ✅ **Skip photo re-downloads** (15 min)
   - 13% cost reduction
   - File: `supabase/functions/enrich-booth/index.ts`
   - Lines: 146-175

5. ✅ **Increase skip window to 30 days** (5 min)
   - Reduces re-enrichment frequency
   - File: `supabase/functions/enrich-booth/index.ts`
   - Lines: 69-70

### Phase 3: Medium-term (Next 2 Weeks)
6. ✅ **Audit and disable low-quality sources**
   - Manual review required
   - Target: Reduce from 180 to 50-75 sources

---

## 💰 Expected Savings

| Optimization | Annual Savings | Implementation Time |
|--------------|----------------|---------------------|
| Cache Place IDs | $9,248 (57%) | 15 minutes |
| Reduce Details fields | $2,574 (30% of Details) | 10 minutes |
| Skip photo downloads | $2,023 (13%) | 15 minutes |
| 30-day skip window | $2,952 (reduces frequency) | 5 minutes |
| Daily quota (200/day) | Caps at $336/month | 5 minutes |
| Reduce crawler sources | $6,000 (reduces discovery) | 2 hours review |

**Total Potential Savings: ~$22,797/year (90% reduction)**

**Current Projected Cost:** $5,904/year
**Optimized Cost:** ~$700/year

---

## 🎯 Recommended Action Plan

### Step 1: Stop the bleeding (TODAY)
Run the implementation script:
```bash
# Apply Phase 1 optimizations
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/apply-places-api-optimizations.ts
```

This will:
1. Add daily quota (200 enrichments/day max)
2. Implement Place ID caching
3. Deploy updated Edge Function

**Expected impact:** Caps costs at $11.20/day ($336/month)

### Step 2: Optimize enrichment logic (THIS WEEK)
Apply Phase 2 optimizations:
- Reduce Place Details fields
- Skip unnecessary photo downloads
- Increase skip window to 30 days

**Expected impact:** Reduces per-enrichment cost from $0.056 to $0.024 (57% savings)

### Step 3: Audit crawler sources (NEXT 2 WEEKS)
Review and disable low-quality sources to reduce discovery rate.

**Expected impact:** Reduces enrichment volume by 60%

---

## 📊 Monitoring

### Track Daily Enrichment Counts
```sql
SELECT
  DATE(enriched_at) as date,
  COUNT(*) as enrichments,
  COUNT(*) * 0.056 as estimated_cost_usd
FROM booths
WHERE enriched_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(enriched_at)
ORDER BY date DESC;
```

### Alert Thresholds
- 🟢 Normal: <100 enrichments/day ($5.60/day)
- 🟡 Warning: 100-200 enrichments/day ($5.60-$11.20/day)
- 🔴 Critical: >200 enrichments/day (triggers quota)

---

## ✅ Next Steps

1. **User Decision:** Approve Phase 1 implementation?
   - Add daily quota (200 enrichments/day)
   - Implement Place ID caching
   - Deploy immediately

2. **Review crawler sources:**
   - Run audit query to identify low-performers
   - Decide which sources to keep/disable

3. **Monitor results:**
   - Track daily enrichment counts
   - Verify cost reduction

---

**Questions?**
- Should we implement all Phase 1 optimizations immediately?
- What daily quota limit feels right? (Current recommendation: 200/day)
- Should we audit crawler sources now or wait?
