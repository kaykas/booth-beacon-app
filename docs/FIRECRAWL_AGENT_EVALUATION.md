# Firecrawl Agent Evaluation for Booth Beacon
**Date:** December 19, 2025
**Evaluator:** Claude AI
**Purpose:** Assess how Firecrawl's new Agent feature can improve Booth Beacon's crawler performance

---

## Executive Summary

Firecrawl's new `/agent` endpoint represents a **paradigm shift** from URL-specific crawling to intent-based data gathering. For Booth Beacon, this could:

- **Reduce complexity** by 70%+ (eliminate 46+ custom extractors)
- **Improve data quality** through autonomous navigation and verification
- **Enable new sources** that are currently too complex to crawl
- **Scale data collection** from 912 booths to 5,000+ booths with less maintenance

**Recommendation:** Implement Firecrawl Agent as the **primary crawler**, keeping legacy extractors as fallbacks.

---

## 1. Current Architecture Analysis

### 1.1 Existing System Overview

**File:** `/Users/jkw/Projects/booth-beacon-app/supabase/functions/unified-crawler/index.ts:1427`

**Current Approach:**
- **46 crawler sources** configured (38 enabled)
- **3 crawler scripts** (unified-crawler, master-crawler, universal-crawler)
- **Custom extractors** for each source type:
  - 13 city guide extractors
  - 7 European operator extractors
  - 5 directory extractors
  - 8 blog/community extractors
  - Multiple enhanced AI extractors

**Workflow:**
```
1. Firecrawl scrapeUrl() OR crawlUrl() → HTML/Markdown
2. Source-specific extractor function → Structured data
3. Custom validation logic → Clean data
4. Database upsert → Storage
```

### 1.2 Current Challenges

#### Challenge 1: Maintenance Burden
- **Problem:** Each source requires custom extractor logic
- **Impact:** 1,427 lines in `index.ts` + separate extractor files
- **Example:** `city-guide-extractors.ts`, `european-extractors.ts`, `enhanced-extractors.ts`

#### Challenge 2: Limited Discovery
- **Problem:** Must know exact URLs upfront
- **Impact:** Missing booths on multi-page sites, paginated directories, and sites with dynamic navigation
- **Evidence:** `DOMAIN_CONFIG` (line 240-265) shows manual configuration needed for each domain

#### Challenge 3: Batch Processing Complexity
- **Problem:** Manual batch loop with timeout management (lines 736-1027)
- **Impact:** Function timeouts, incomplete crawls, progress tracking overhead
- **Code:** 300+ lines dedicated to batch orchestration

#### Challenge 4: Site-Specific Issues
- **Problem:** JavaScript-heavy maps (autophoto.org needs 15s wait time - line 246)
- **Impact:** Unreliable extraction from dynamic content
- **Workaround:** Manual `waitFor` configuration per domain

#### Challenge 5: Pagination Handling
- **Problem:** Each source needs custom pagination logic
- **Impact:** Deep directories like photobooth.net require 100-page crawls with manual progress tracking
- **Evidence:** Lines 711-1027 show complex batch processing system

---

## 2. Firecrawl Agent Capabilities

### 2.1 Core Features

**Source:** [Firecrawl Agent Documentation](https://docs.firecrawl.dev/features/agent)

#### Natural Language Prompts
```typescript
// CURRENT: Complex configuration
const config = getDomainConfig(url);
await firecrawl.crawlUrl(url, {
  limit: config.pageLimit,
  waitFor: config.waitFor,
  timeout: config.timeout
});

// WITH AGENT: Simple prompt
await firecrawl.agent({
  prompt: "Find all analog photo booth locations on this site including name, address, city, and hours"
});
```

#### Autonomous Navigation
- Clicks through menus and dropdowns
- Handles authentication flows
- Manages pagination automatically
- Explores multi-step processes

#### Built-in Search
- No starting URL required (optional)
- Searches the web for relevant sources
- Cross-references information across sites

#### Structured Output
- Pydantic (Python) or Zod (TypeScript) schemas
- Type-safe extraction
- Consistent data format

### 2.2 Key Advantages Over Current System

| Feature | Current System | With Agent |
|---------|---------------|------------|
| **URL Discovery** | Manual configuration | Autonomous search |
| **Navigation** | Fixed crawl limits | Intelligent navigation |
| **Pagination** | Manual batch loops | Automatic handling |
| **Extraction** | Custom extractors per source | Universal prompt |
| **Maintenance** | 1,427+ lines of code | Single prompt + schema |
| **New Sources** | Hours to implement | Minutes to add |

---

## 3. Gap Analysis & Opportunities

### 3.1 Where Agent Excels vs. Current System

#### Opportunity 1: Directory Sites with Deep Nesting
**Sources:** photobooth.net, autophoto.org, classicphotobooth.net

**Current Challenge:**
- photobooth.net requires 100-page crawl limit (line 242)
- Manual batch progress tracking (lines 729-1027)
- Timeout management complexity

**Agent Solution:**
```typescript
await firecrawl.agent({
  prompt: `Find ALL photo booth locations on photobooth.net including:
    - Venue name
    - Full address
    - City and state
    - Operating hours
    - Machine type`,
  schema: boothSchema
});
```
**Impact:** Eliminates 300+ lines of batch management code

#### Opportunity 2: JavaScript-Heavy Interactive Maps
**Sources:** autophoto.org (requires 15s wait - line 246)

**Current Challenge:**
- Must wait for JavaScript rendering
- Map markers may load asynchronously
- Easy to miss dynamically loaded content

**Agent Solution:**
- Agent automatically waits for content
- Interacts with map controls
- Extracts all visible markers

**Impact:** More complete data extraction from interactive sites

#### Opportunity 3: Multi-Source Cross-Referencing
**New Capability:** Not currently possible

**Agent Advantage:**
```typescript
await firecrawl.agent({
  prompt: `Find photo booths in Berlin by:
    1. Searching for "photo booth Berlin" on Google
    2. Checking fotomaton-berlin.de, fotoautomat-berlin.de
    3. Cross-reference locations from Berlin city guides
    4. Extract unique locations with verified addresses`
});
```
**Impact:** Discover booths from sources not in our database

#### Opportunity 4: City Guide Article Extraction
**Sources:** 12 city guide sources (timeout.com, blockclub, etc.)

**Current Challenge:**
- Each has different HTML structure
- Custom extractor needed per site (lines 1309-1327)
- Updates break extractors

**Agent Solution:**
```typescript
await firecrawl.agent({
  prompt: `From this city guide article, extract ALL photo booth locations mentioned.
    Include context like "inside the lobby" or "next to the bar"`,
  url: cityGuideUrl
});
```
**Impact:** Universal extractor for ALL city guides (eliminate 12+ custom extractors)

#### Opportunity 5: European Operator Networks
**Sources:** fotoautomat-wien.at, photoautomat.de, fotoautomatica.se

**Current Challenge:**
- Each operator has different site structure
- Some use maps, some use lists
- Language variations (German, Swedish, French)

**Agent Solution:**
- Handles multilingual sites automatically
- Navigates different UI patterns
- Extracts regardless of layout

**Impact:** More reliable international data collection

---

## 4. Specific Improvement Recommendations

### 4.1 Immediate Wins (Week 1)

#### Recommendation 1: Replace Universal Crawler with Agent
**File to Replace:** `scripts/maintenance/universal-crawler.ts:1-190`

**Current Code:** 190 lines with custom extraction logic
**New Code:** ~50 lines with Agent

**Implementation:**
```typescript
// New: universal-agent-crawler.ts
import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';

const boothSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string(),
  hours: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  machine_type: z.string().optional(),
  cost: z.string().optional()
});

async function crawlSourceWithAgent(sourceName: string, sourceUrl: string) {
  const result = await firecrawl.agent({
    prompt: `Find ALL analog photo booth locations from this source.
      Extract complete information including:
      - Exact venue name
      - Full street address
      - City and country
      - Operating hours (if available)
      - Cost per photo strip (if available)
      - Machine manufacturer or model (if mentioned)

      IMPORTANT:
      - Only extract analog/chemical photo booths (not digital/iPad booths)
      - Include booths even if some information is missing
      - For directories, extract ALL listed locations
      - For articles, extract ALL booths mentioned in text`,
    url: sourceUrl,
    schema: boothSchema
  });

  return result;
}
```

**Expected Impact:**
- ✅ Reduce code from 190 lines → 50 lines (73% reduction)
- ✅ Eliminate custom extraction logic per source
- ✅ Handle pagination automatically
- ✅ More complete data extraction

#### Recommendation 2: Simplify Unified Crawler Batch Logic
**File to Modify:** `supabase/functions/unified-crawler/index.ts:736-1027`

**Current:** 291 lines of batch management
**With Agent:** Eliminate batch loops entirely

**Benefit:**
- No more timeout management
- No progress tracking overhead
- Agent handles continuation automatically

#### Recommendation 3: Test Agent on High-Value Sources First
**Priority Sources:**
1. **photobooth.net** - Gold standard directory (100+ pages)
2. **autophoto.org** - JavaScript map (currently problematic)
3. **City guides** - 12 sources with different structures

**Test Script:**
```bash
# Create test-agent-crawler.ts
FIRECRAWL_API_KEY=xxx npx tsx scripts/test-agent-crawler.ts
```

### 4.2 Medium-Term Improvements (Week 2-4)

#### Recommendation 4: Hybrid Approach - Agent + Legacy Fallback
**Strategy:** Try Agent first, fall back to custom extractor on failure

```typescript
async function crawlSource(source) {
  try {
    // Try Agent first
    return await crawlWithAgent(source);
  } catch (error) {
    console.log(`Agent failed for ${source.name}, using legacy extractor`);
    return await crawlWithLegacyExtractor(source);
  }
}
```

**Benefits:**
- Risk mitigation
- Gradual migration
- Compare data quality

#### Recommendation 5: Enable Discovery of Unknown Sources
**New Capability:** Find sources we don't know about

```typescript
await firecrawl.agent({
  prompt: `Find photo booth directory websites, operator websites,
    and city guides that list analog photo booth locations in [CITY].
    Return website URLs with descriptions of what booths they list.`
});
```

**Impact:** Expand from 46 sources to potentially 100+ sources

#### Recommendation 6: Implement Quality Verification
**Use Agent for Data Validation:**

```typescript
await firecrawl.agent({
  prompt: `Verify this photo booth is still operational by checking:
    1. Venue website (if available)
    2. Recent reviews or social media mentions
    3. Business hours and contact information
    Return: status (operational/closed/unknown) with confidence score`,
  url: booth.website
});
```

**Impact:** Keep database current with minimal manual verification

### 4.3 Long-Term Enhancements (Month 2+)

#### Recommendation 7: User-Submitted Source Processing
**Feature:** Allow users to submit URLs, Agent extracts automatically

```typescript
// User submits: "https://cool-bar-chicago.com"
await firecrawl.agent({
  prompt: `Check if this venue has an analog photo booth.
    If yes, extract all details. If no, return null.`,
  url: userSubmittedUrl
});
```

**Impact:** Crowdsourced data collection at scale

#### Recommendation 8: Competitive Intelligence
**Feature:** Monitor competitor directories

```typescript
await firecrawl.agent({
  prompt: `Compare our photo booth listings with competitor site [URL].
    Find booths they have that we don't. Return differences.`
});
```

**Impact:** Ensure Booth Beacon is most comprehensive directory

#### Recommendation 9: Content Enrichment
**Feature:** Enhance existing booth data

```typescript
await firecrawl.agent({
  prompt: `Find reviews, photos, and recent social media posts about
    this photo booth: ${booth.name} at ${booth.address}`,
  schema: enrichmentSchema
});
```

**Impact:** Richer content, better user experience

---

## 5. Implementation Strategy

### Phase 1: Proof of Concept (Days 1-3)
```bash
# Create minimal test
✅ Day 1: Set up Agent API access
✅ Day 2: Test on 3 sources (directory, blog, operator)
✅ Day 3: Compare results with current extractors
```

### Phase 2: Pilot (Week 1)
```bash
✅ Replace universal-crawler.ts with agent version
✅ Test on 10 high-priority sources
✅ Measure: extraction rate, data quality, API cost
```

### Phase 3: Gradual Rollout (Week 2-3)
```bash
✅ Deploy hybrid Agent + legacy system
✅ Monitor error rates and data quality
✅ Migrate sources incrementally
```

### Phase 4: Full Migration (Week 4+)
```bash
✅ Deprecate custom extractors
✅ Simplify unified-crawler to Agent-only
✅ Clean up 1,000+ lines of extractor code
```

---

## 6. Expected Impact

### 6.1 Code Complexity Reduction

| Component | Current | With Agent | Reduction |
|-----------|---------|------------|-----------|
| Unified crawler | 1,427 lines | ~400 lines | 72% |
| Custom extractors | 500+ lines | 0 lines | 100% |
| Batch management | 291 lines | 0 lines | 100% |
| Domain configs | 50 lines | 0 lines | 100% |
| **TOTAL** | **~2,268 lines** | **~400 lines** | **82%** |

### 6.2 Data Quality Improvements

**Current State (912 booths):**
- 27.2% geocoded (248 booths)
- Many missing fields (hours, cost, photos)
- Single-source verification

**Expected with Agent:**
- 90%+ field completion (Agent finds more details)
- Cross-source verification (higher confidence)
- 5,000+ booths (better discovery)

### 6.3 Maintenance Savings

**Current:** 2-3 hours per new source (custom extractor + testing)
**With Agent:** 10 minutes per source (prompt + schema)

**ROI:** 90% time savings on new source onboarding

### 6.4 API Cost Analysis

**Current Cost:**
- Firecrawl crawl: ~$0.01 per page
- Anthropic Claude: ~$0.02 per extraction
- 46 sources × 10 pages avg = $13.80 per full crawl

**Agent Cost (Estimated):**
- Agent endpoint: ~$0.05 per request (higher but autonomous)
- 46 sources × 1 request = $2.30 per full crawl
- **83% cost reduction** (fewer API calls, no batch loops)

**Note:** Agent costs may vary based on complexity, but eliminate multiple separate API calls

---

## 7. Risks & Mitigations

### Risk 1: Agent in Research Preview
**Mitigation:** Hybrid approach with legacy fallback

### Risk 2: Unknown API Limits
**Mitigation:** Start with small source subset, monitor rate limits

### Risk 3: Different Data Format
**Mitigation:** Schema validation, data mapping layer

### Risk 4: Cost Uncertainty
**Mitigation:** Track costs per source, set budget alerts

---

## 8. Next Steps

### Immediate Actions

1. **Update Firecrawl SDK**
   ```bash
   npm install @mendable/firecrawl-js@latest
   ```
   Current: v4.7.0 → Latest (check for Agent support)

2. **Create Test Script**
   ```bash
   # Create: scripts/test-agent-crawler.ts
   # Test on 3 sources: photobooth.net, timeout.com, fotoautomat-berlin.de
   ```

3. **Define Booth Schema**
   ```typescript
   // Use Zod for type-safe schema
   import { z } from 'zod';

   const boothSchema = z.object({
     name: z.string(),
     address: z.string(),
     city: z.string(),
     country: z.string(),
     // ... (see recommendation 1)
   });
   ```

4. **Run Comparison Test**
   ```bash
   # Compare Agent vs. Current extractor
   # Metrics: booths found, field completion, time taken
   ```

### Decision Points

- **Go/No-Go after POC:** If Agent finds 80%+ of booths current system finds → Proceed
- **Hybrid vs. Full Migration:** If Agent reliability >95% → Full migration, else hybrid
- **Cost Threshold:** If per-source cost <$0.10 → Scale to all sources

---

## 9. Conclusion

Firecrawl Agent represents a **transformational upgrade** for Booth Beacon's crawler infrastructure:

✅ **Simplicity:** 82% code reduction
✅ **Capability:** Autonomous navigation, pagination, search
✅ **Scalability:** Add sources in minutes vs. hours
✅ **Quality:** More complete data through intelligent extraction
✅ **Cost:** Lower API costs through consolidated requests

**Recommendation: PROCEED** with phased implementation starting with POC on 3 high-value sources.

**Success Metric:** If Agent extracts 80%+ of current booths with better field completion, proceed to pilot rollout.

---

## 10. References

- [Firecrawl Agent Documentation](https://docs.firecrawl.dev/features/agent)
- [Introducing /agent Blog Post](https://www.firecrawl.dev/blog/introducing-agent)
- [Firecrawl Main Site](https://www.firecrawl.dev/)
- Booth Beacon Current Crawler: `/supabase/functions/unified-crawler/index.ts`

---

**Document Status:** ✅ Complete
**Next Review:** After POC completion
**Owner:** Jascha Kaykas-Wolff
