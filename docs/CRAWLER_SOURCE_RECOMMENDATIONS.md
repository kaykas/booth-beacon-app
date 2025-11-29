# Crawler Source Recommendations
## Strategic Analysis & Implementation Plan

**Date:** November 28, 2025
**Analysis Base:** Current database state + LEGACY_RESEARCH_INSIGHTS.md + CRAWLING_STRATEGY_ANALYSIS.md
**Current Status:** 20 of 61 sources enabled

---

## Executive Summary

### Critical Finding
**Only 20 of 61 crawler sources are currently enabled**, resulting in a significant gap between potential and actual data collection. However, analysis reveals this is actually a **quality control success** - many disabled sources are legitimately broken or low-quality.

### Key Metrics
- **Total Sources:** 61
- **Currently Enabled:** 20 (33%)
- **Currently Disabled:** 41 (67%)
- **Broken/Invalid URLs:** ~15 sources (25%)
- **Requires URL Fix:** ~10 sources (16%)
- **Low Quality (Should Stay Disabled):** ~10 sources (16%)
- **High Priority to Enable:** ~6 sources (10%)

### Recommendation Summary
**Enable 6 additional high-quality sources** for a total of **26 active sources** (43% of inventory). This strategic approach prioritizes **quality over quantity** based on legacy research insights showing that 40+ sources = maintenance nightmare.

---

## Part 1: Current State Analysis

### 1.1 Currently Enabled Sources (20 Total)

#### Tier 1: Primary Directories (2 sources)
1. **Photobooth.net** - Priority 100
   - **Status:** Active, gold standard
   - **Data Quality:** Excellent - 20+ years curated
   - **Expected Yield:** 200-500 booths
   - **Recent Activity:** 909 booths added in last 24h
   - **Recommendation:** KEEP ENABLED ✓

2. **Lomography Locations** - Priority 90
   - **Status:** Enabled but needs URL verification
   - **Data Quality:** Scattered magazine articles (not comprehensive directory)
   - **Issue:** Original URL returns 404
   - **Recommendation:** DOWNGRADE to Priority 60, verify URL or DISABLE

#### Tier 2: Operators & Regional Directories (11 sources)
3. **Photomatica West Coast** - Priority 80
   - Status: Active, LA/SF museums verified
   - Recommendation: KEEP ENABLED ✓

4. **Photomatic** - Priority 75
   - Status: Redirects to /lander, needs verification
   - Recommendation: TEST then KEEP or FIX URL

5. **Photoautomat DE** - Priority 75
   - Status: Active German rental service
   - Recommendation: KEEP ENABLED ✓

6. **Time Out LA** - Priority 60
   - Status: URL NEEDS UPDATE (404 at current URL)
   - Working URL: `/news/vintage-photo-booths...121324` (Dec 2024)
   - Recommendation: UPDATE URL then KEEP ENABLED

7. **Time Out Chicago** - Priority 60
   - Status: URL NEEDS UPDATE (404 at current URL)
   - Working URL: `/bars/20-chicago-bars-with-a-photo-booth`
   - Recommendation: UPDATE URL then KEEP ENABLED

8. **Block Club Chicago** - Priority 60
   - Status: URL NEEDS UPDATE (404 at current URL)
   - Working URL: March 2025 article (EXCELLENT recent source)
   - Recommendation: UPDATE URL then KEEP ENABLED

9. **Flickr Photobooth Group** - Priority 85
   - Status: Rate limited (429 errors)
   - Data Quality: User-generated, unreliable
   - Recommendation: DOWNGRADE to Priority 50 or DISABLE

#### Tier 3: City Guides (7 sources - most broken)
10-16. Various city guides (Berlin, London, NYC, SF)
   - **Issue:** Most have 404 errors or wrong URLs
   - **Recommendation:** See detailed analysis below

### 1.2 Currently Disabled Sources (41 Total)

#### High Priority - Should Be ENABLED (6 sources)

1. **Autophoto (autophoto.org)** - Priority 70
   - **Status:** Disabled but EXCELLENT source
   - **Data:** NYC museum + booth locator with 20+ locations
   - **Recent:** Opened October 2025
   - **Quality:** First-party data, structured, verified
   - **Recommendation:** ⭐ UPGRADE to Priority 90 and ENABLE IMMEDIATELY

2. **photomatica.com** - Priority 90
   - **Status:** Disabled (possibly confused with broken photomatica.de)
   - **Data:** LA/SF Photo Booth Museums
   - **Quality:** Excellent, structured, recently opened (2025)
   - **Recommendation:** ⭐ VERIFY enabled (may be duplicate), KEEP ENABLED

3. **photomatic.net** - Priority 80
   - **Status:** Disabled
   - **Data:** Directory/operator listings
   - **Recommendation:** VERIFY URL and ENABLE if working

4. **photoautomat.de** - Priority 85
   - **Status:** Disabled (may be duplicate of Photoautomat DE)
   - **Data:** German directory
   - **Recommendation:** CHECK if duplicate, ENABLE if unique

5. **classicphotoboothco.com** - Priority 65
   - **Status:** Disabled due to 404 at /locations
   - **Recommendation:** FIND CORRECT URL (try /venues, /placements), then ENABLE

6. **autophoto.org** (directory entry) - Priority 90
   - **Status:** Disabled
   - **Note:** Appears to be duplicate of Autophoto operator
   - **Recommendation:** CONSOLIDATE with operator entry, ENABLE

#### Medium Priority - Consider Enabling (5 sources)

7. **Fotoautomat Berlin** - Priority 70
   - Confirmed active rental service
   - German extraction needed
   - Recommendation: ENABLE with German language support

8. **Fotoautomat FR** - Priority 70
   - French operator
   - Recommendation: VERIFY URL then ENABLE with French language support

9. **Fotoautomat Wien** - Priority 70
   - Austrian operator
   - Recommendation: VERIFY URL then ENABLE with German language support

10. **Fotoautomatica** - Priority 70
    - Italian operator
    - Recommendation: VERIFY URL then ENABLE with Italian language support

11. **Metro Auto Photo** - Priority 65
    - US operator
    - Recommendation: VERIFY URL then ENABLE

#### Low Priority - Keep Disabled (10 sources)

**Travel Blogs (outdated, low reliability):**
- Girl in Florence - Priority 50
- Accidentally Wes Anderson - Priority 50
- Solo Sophie Paris - Priority 50 (404 error)
- Misadventures with Andi - Priority 50
- No Camera Bag Vienna - Priority 50
- Do The Bay SF - Priority 50
- Concrete Playground - Priority 50

**Historical/Non-Directory:**
- Smithsonian - Priority 40 (403 error, historical article only)

**Social Media (unreliable):**
- Pinterest Photobooths - Priority 20 (correctly disabled)
- Flickr Photobooth Group - Priority 50 (rate limiting issues)

#### Broken/Invalid - Should Stay DISABLED (15 sources)

**Domain Issues:**
- Photomatica Berlin (.de) - Domain doesn't exist (DNS failure)
- Autofoto NL - Domain for sale (301 redirect)
- Digital Cosmonaut Berlin - Wrong content (urban exploration blog)

**404 Errors:**
- Classic Photo Booth Co - /locations returns 404
- Design My Night London - 404
- Design My Night NYC - 404
- Solo Sophie Paris - 404
- Japan Experience - 404 (also wrong type: Purikura = digital)
- Roxy Hotel NYC - Needs verification
- Airial Travel Brooklyn - Needs verification
- London World - Needs verification
- Flash Pack London - Needs verification
- Phelt Magazine Berlin - Needs verification
- Aperture Tours Berlin - Needs verification

---

## Part 2: Quality-Based Source Classification

### 2.1 Gold Standard Sources (Tier 1 - Priority 90-100)
**Characteristics:** Authoritative, regularly updated, comprehensive, high yield

1. **Photobooth.net** - Priority 100 ✓ ENABLED
   - The gold standard - 20 years of community curation
   - Chemical analog booths only (no digital)
   - 200-500 booth expected yield
   - Multi-page directory with state/country filtering
   - **Action:** KEEP ENABLED, enhance multi-page crawler

2. **Autophoto** - Priority 90 ⚠️ DISABLED (SHOULD ENABLE)
   - NYC museum + booth locator (20+ locations)
   - First-party verified data
   - Opened October 2025 (very current)
   - **Action:** ENABLE IMMEDIATELY

3. **photomatica.com** - Priority 90 ⚠️ STATUS UNCLEAR
   - LA/SF Photo Booth Museums
   - Structured data, recently opened
   - **Action:** VERIFY status and ENABLE if not already

4. **photoautomat.de** - Priority 85 ⚠️ DISABLED (CHECK DUPLICATE)
   - German directory
   - **Action:** Check if duplicate, ENABLE if unique

### 2.2 High-Quality Sources (Tier 2 - Priority 70-85)
**Characteristics:** First-party operator data, regional authority, good structure

5. **Photomatica West Coast** - Priority 80 ✓ ENABLED
6. **photomatic.net** - Priority 80 ⚠️ DISABLED (VERIFY URL)
7. **Photoautomat DE** - Priority 75 ✓ ENABLED (rental service)
8. **Photomatic (.com.au)** - Priority 75 ✓ ENABLED (needs redirect test)
9. **Fotoautomat Berlin** - Priority 70 ⚠️ DISABLED (ENABLE)
10. **Fotoautomat FR** - Priority 70 ⚠️ DISABLED (ENABLE)
11. **Fotoautomat Wien** - Priority 70 ⚠️ DISABLED (ENABLE)
12. **Fotoautomatica** - Priority 70 ⚠️ DISABLED (ENABLE)

### 2.3 Editorial/City Guide Sources (Tier 3 - Priority 60)
**Characteristics:** Editorial standards, current info, good for validation

13. **Time Out LA** - Priority 60 ✓ ENABLED (needs URL fix)
14. **Time Out Chicago** - Priority 60 ✓ ENABLED (needs URL fix)
15. **Block Club Chicago** - Priority 60 ✓ ENABLED (needs URL fix - March 2025)
16. **Locale Magazine LA** - Priority 60 ⚠️ STATUS UNCLEAR (needs URL fix)

### 2.4 Low-Quality Sources (Tier 4 - Priority 20-50)
**Characteristics:** Personal blogs, outdated, unreliable, noisy data

**Recommendation:** KEEP DISABLED
- Travel blogs (7+ years old articles)
- Pinterest (rate limiting, vague info)
- Flickr (user-generated, inconsistent)
- Smithsonian (historical article, no locations)
- Most blog sources (incomplete addresses, no updates)

---

## Part 3: Recommendations by Priority

### Phase 1: IMMEDIATE (Week 1) - 6 Sources to Enable

#### Critical Enablements
1. **Autophoto** ⭐ HIGHEST PRIORITY
   - Current: Disabled
   - Action: ENABLE + upgrade to Priority 90
   - Why: NYC museum + locator, 20+ verified locations, Oct 2025 opening
   - Expected Yield: 20-30 NYC booths
   - Effort: 2 hours (build Wix scraper for booth locator)

2. **photomatic.net** (if not duplicate)
   - Current: Disabled
   - Action: Verify URL working → ENABLE at Priority 80
   - Why: Directory/operator listings
   - Expected Yield: 10-20 booths
   - Effort: 1 hour (URL verification + test)

3. **photoautomat.de** (if not duplicate)
   - Current: Disabled
   - Action: Check duplication → ENABLE at Priority 85
   - Why: German directory
   - Expected Yield: 15-30 booths
   - Effort: 1 hour (duplication check)

#### URL Fixes (Currently Enabled but Broken)
4. **Time Out LA**
   - Current: Enabled but 404
   - Action: Update to Dec 2024 article URL
   - Why: Fresh data, 5+ verified LA locations
   - Effort: 15 minutes (SQL update)

5. **Time Out Chicago**
   - Current: Enabled but 404
   - Action: Update to working bars article URL
   - Effort: 15 minutes (SQL update)

6. **Block Club Chicago** ⭐ HIGH VALUE
   - Current: Enabled but 404
   - Action: Update to March 2025 article URL
   - Why: VERY RECENT (March 2025), 6+ verified locations
   - Effort: 15 minutes (SQL update)

**Phase 1 SQL Script:**
```sql
-- Enable Autophoto and upgrade priority
UPDATE crawl_sources SET
  enabled = true,
  priority = 90,
  status = 'active',
  last_error = NULL
WHERE source_name = 'Autophoto' AND enabled = false;

-- Fix TimeOut LA URL
UPDATE crawl_sources SET
  source_url = 'https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324',
  status = 'active',
  last_error = NULL
WHERE source_name = 'Time Out LA';

-- Fix TimeOut Chicago URL
UPDATE crawl_sources SET
  source_url = 'https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth',
  status = 'active',
  last_error = NULL
WHERE source_name = 'Time Out Chicago';

-- Fix Block Club Chicago URL (March 2025 article)
UPDATE crawl_sources SET
  source_url = 'https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/',
  status = 'active',
  last_error = NULL
WHERE source_name = 'Block Club Chicago';

-- Downgrade Lomography (not comprehensive directory)
UPDATE crawl_sources SET priority = 60
WHERE source_name = 'Lomography Locations';

-- Downgrade Flickr (rate limiting issues)
UPDATE crawl_sources SET priority = 50
WHERE source_name = 'Flickr Photobooth Group';
```

**Expected Impact:**
- **Total Enabled:** 23-26 sources (up from 20)
- **New Booths:** 50-100+ verified locations
- **Data Quality:** Significant improvement (recent 2024-2025 data)
- **Time Investment:** 5-7 hours total

---

### Phase 2: SHORT-TERM (Week 2-3) - 4 European Operators

#### European Expansion
7. **Fotoautomat Berlin**
   - Priority: 70
   - Language: German
   - Expected Yield: 10-20 Berlin locations
   - Effort: 3-4 hours (German extraction)

8. **Fotoautomat FR**
   - Priority: 70
   - Language: French
   - Expected Yield: 10-20 French locations
   - Effort: 3-4 hours (French extraction)

9. **Fotoautomat Wien**
   - Priority: 70
   - Language: German
   - Expected Yield: 5-15 Vienna locations
   - Effort: 2-3 hours (German extraction)

10. **Fotoautomatica**
    - Priority: 70
    - Language: Italian
    - Expected Yield: 5-15 Italian locations
    - Effort: 2-3 hours (Italian extraction)

**Phase 2 SQL Script:**
```sql
-- Enable European operators
UPDATE crawl_sources SET
  enabled = true,
  status = 'active',
  last_error = NULL
WHERE source_name IN (
  'Fotoautomat Berlin',
  'Fotoautomat FR',
  'Fotoautomat Wien',
  'Fotoautomatica'
);
```

**Prerequisites:**
- Multi-language AI extraction prompts
- Address normalization for each country format
- Testing with sample pages

**Expected Impact:**
- **Total Enabled:** 27-30 sources
- **New Booths:** 30-70 European locations
- **Geographic Coverage:** Major European cities
- **Time Investment:** 10-16 hours

---

### Phase 3: MEDIUM-TERM (Week 4+) - Optimization & Monitoring

#### Actions
1. **Classic Photo Booth Co** - Find correct URL
   - Current: 404 at /locations
   - Action: Try /venues, /placements, /installations
   - Priority: 65
   - Effort: 2 hours (URL research + verification)

2. **Metro Auto Photo** - Verify and enable
   - Priority: 65
   - Expected Yield: 10-20 locations
   - Effort: 2-3 hours

3. **Monitoring Dashboard**
   - Track source health (consecutive failures)
   - Alert on 404s and domain issues
   - Monitor extraction quality
   - Effort: 4-6 hours

4. **Enhanced Crawlers**
   - Photobooth.net multi-page state crawler
   - Autophoto Wix-based booth locator parser
   - Generic TimeOut city guide extractor
   - Effort: 8-12 hours

**Expected Impact:**
- **Total Enabled:** 28-32 sources (optimal)
- **Automated Monitoring:** Catch broken sources early
- **Better Extraction:** Higher yield from existing sources
- **Time Investment:** 16-23 hours

---

## Part 4: Sources to Keep DISABLED

### 4.1 Permanently Disabled (Broken/Invalid)

**Domain Issues:**
```sql
UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'Domain does not exist - DNS failure'
WHERE source_name = 'Photomatica Berlin';

UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'Domain for sale - site no longer active'
WHERE source_name = 'Autofoto';

UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'Wrong content - urban exploration blog, not photo booth guide'
WHERE source_name = 'Digital Cosmonaut Berlin';
```

**404 Errors (No Working Alternative Found):**
```sql
UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'URL returns 404 - page not found'
WHERE source_name IN (
  'Design My Night London',
  'Design My Night NYC',
  'Solo Sophie Paris',
  'Japan Experience'
);

UPDATE crawl_sources SET
  enabled = false,
  status = 'inactive',
  last_error = 'Historical article only, no current booth locations'
WHERE source_name = 'Smithsonian';
```

### 4.2 Low Quality - Keep Disabled

**Travel Blogs (7+ year old articles, incomplete data):**
- Girl in Florence
- Accidentally Wes Anderson
- Misadventures with Andi
- No Camera Bag Vienna
- Do The Bay SF
- Concrete Playground

**Reasoning:**
- Articles often 7-10 years old
- No updates to booth status
- Incomplete addresses (~70% missing street numbers)
- ~30% accuracy rate based on legacy research
- High validation failure rate

**Social Media (unreliable, rate limiting):**
- Pinterest Photobooths (already disabled)
- Flickr Photobooth Group (downgrade to 50, consider disabling)

---

## Part 5: Implementation Plan

### Week 1: Quick Wins (5-7 hours)
**Goal:** Enable 6 high-value sources

✅ **Monday:**
- [ ] Run Phase 1 SQL script (URL fixes + Autophoto enable)
- [ ] Test Autophoto scraping (Wix site)
- [ ] Verify TimeOut URLs working
- [ ] Test Block Club Chicago (March 2025 article)

✅ **Tuesday:**
- [ ] Verify photomatic.net and photoautomat.de not duplicates
- [ ] Enable non-duplicate sources
- [ ] Test extraction for new sources
- [ ] Monitor first crawl results

✅ **Wednesday:**
- [ ] Review booth count from new sources
- [ ] Check deduplication working
- [ ] Verify geocoding queue processing
- [ ] Document any extraction issues

**Expected Results:**
- 23-26 total enabled sources
- 50-100 new verified booths
- Better geographic coverage (NYC, LA, Chicago)
- Fresh 2024-2025 data

### Week 2-3: European Expansion (10-16 hours)
**Goal:** Add 4 European operator sources

✅ **Week 2:**
- [ ] Build German language extraction prompts
- [ ] Test Fotoautomat Berlin scraping
- [ ] Build French language extraction prompts
- [ ] Test Fotoautomat FR scraping

✅ **Week 3:**
- [ ] Run Phase 2 SQL script (enable European operators)
- [ ] Test all 4 European sources
- [ ] Verify address normalization working
- [ ] Build Italian extraction prompts
- [ ] Monitor extraction quality

**Expected Results:**
- 27-30 total enabled sources
- 30-70 European locations
- Multi-language extraction working
- Improved international coverage

### Week 4+: Optimization (16-23 hours)
**Goal:** Enhanced crawlers + monitoring

✅ **Monitoring Dashboard:**
- [ ] Source health tracking (consecutive failures)
- [ ] 404/403 detection and alerting
- [ ] Extraction quality metrics
- [ ] Cost tracking (Firecrawl + Claude API)

✅ **Enhanced Crawlers:**
- [ ] Photobooth.net state-by-state crawler
- [ ] Autophoto Wix booth locator parser
- [ ] Generic TimeOut extractor
- [ ] Deduplication improvements

**Expected Results:**
- 28-32 total enabled sources (optimal)
- Higher yield from existing sources
- Automated health monitoring
- Reduced manual maintenance

---

## Part 6: Success Metrics

### Baseline (Current State)
- **Enabled Sources:** 20
- **Total Booths:** 912
- **Geocoded:** 251 (28%)
- **Unique Sources:** 1 (photobooth.net dominant)
- **Added Last Week:** 912

### Target (After Phase 1 - Week 1)
- **Enabled Sources:** 23-26 (+15-30%)
- **Total Booths:** 960-1,010 (+50-100)
- **Geocoded:** >85% (background queue processing)
- **Unique Sources:** 4-6
- **Geographic Coverage:** NYC, LA, Chicago strong

### Target (After Phase 2 - Week 3)
- **Enabled Sources:** 27-30 (+35-50%)
- **Total Booths:** 990-1,080 (+80-170)
- **Geocoded:** >90%
- **Unique Sources:** 8-10
- **Geographic Coverage:** Major European cities added

### Target (After Phase 3 - Month 2)
- **Enabled Sources:** 28-32 (+40-60%)
- **Total Booths:** 1,000-1,200 (+100-300)
- **Geocoded:** >95%
- **Unique Sources:** 10-15
- **Data Quality:** <5% extraction errors
- **Coverage:** Top 20 cities globally

---

## Part 7: Data Quality Safeguards

### 7.1 Validation Rules (Already in Place)
✓ Source priority resolution (photobooth.net = 100 wins conflicts)
✓ Deduplication engine (30-40% duplicate detection)
✓ Geocoding queue (async, no blocking)
✓ Address normalization

### 7.2 New Quality Controls Needed

**Pre-Crawl Validation:**
```typescript
// Before enabling a source, verify:
1. URL returns 200 OK (not 404/403/500)
2. Content contains booth-related keywords
3. Page structure matches expected extractor pattern
4. Rate limiting respected (2-5 second delays)
```

**Post-Crawl Validation:**
```typescript
// After extraction, validate each booth:
1. Name not generic ("Photo Booth", "Unknown")
2. Address has street number OR coordinates
3. City and country present
4. Source URL traceable
5. Dedupe check against existing booths
```

**Health Monitoring:**
```sql
-- Alert conditions:
- 3+ consecutive failures → Auto-disable + notify
- 404 errors → Flag for URL verification
- 403/429 errors → Increase rate limiting
- Zero booths extracted → Review extractor logic
- >50% validation failures → Review extraction patterns
```

### 7.3 Cost Management

**API Budget Allocation:**
- **Tier 1 sources (Priority 90-100):** Unlimited (highest ROI)
- **Tier 2 sources (Priority 70-85):** ~500 pages/month
- **Tier 3 sources (Priority 60):** ~200 pages/month
- **Tier 4 sources (Priority <60):** ~50 pages/month or disable

**Cost Optimization:**
- Implement content hashing (80% cache hit rate = 5x API reduction)
- Use custom extractors over AI when possible
- Batch processing during off-peak hours
- Monitor Claude Sonnet 4.5 token usage

---

## Part 8: Legacy Research Insights Applied

### 8.1 What We Learned from Legacy Project

**DO:**
✓ Start with 5-10 highest-quality sources (not 40+)
✓ Use AI extraction over regex (more resilient to changes)
✓ Implement content caching immediately (5x improvement)
✓ Queue geocoding separately (async, no blocking)
✓ Use source priority for conflict resolution
✓ Build deduplication as separate engine

**DON'T:**
✗ Over-engineer with 40+ sources = maintenance nightmare
✗ Use regex patterns (break when sites update)
✗ Sync processing of long operations (timeouts)
✗ Treat all sources equally (quality score needed)
✗ Skip caching strategy ($$$ waste)

### 8.2 Critical Patterns from Legacy

**Tier-Based Architecture:**
```
TIER 1: Authoritative directories (photobooth.net, autophoto)
TIER 2: Operator first-party data (photomatica, fotoautomat)
TIER 3: Editorial/city guides (timeout, blockclub)
TIER 4: Community/blogs (low priority, validation only)
```

**Source Priority Resolution:**
- photobooth.net: 100 (authoritative)
- Autophoto: 90 (museum + locator)
- photomatica.com: 90 (operator)
- Operators: 70-85 (first-party)
- City guides: 60 (editorial)
- Blogs: 40-50 (supplemental)
- Community: 20-35 (validation only)

**Expected Duplicate Rate:** 30-40% (this is NORMAL and GOOD)
- Higher priority = primary data
- Lower priority fills gaps
- Deduplication merges source_names array

---

## Part 9: Conclusion

### Recommended Strategy: Quality Over Quantity

**Phase 1 (Week 1): Enable 6 sources → 26 total (43%)**
- Focus on immediate high-value wins
- Fix broken URLs for already-enabled sources
- Enable Autophoto (NYC museum + locator)
- Expected: 50-100 new verified booths

**Phase 2 (Week 2-3): Enable 4 sources → 30 total (49%)**
- European operator expansion
- Multi-language extraction
- Expected: 30-70 European locations

**Phase 3 (Month 2+): Enable 2-3 sources → 32 total (52%)**
- Optimization and monitoring
- Enhanced crawlers for existing sources
- Expected: Better yield from existing sources

### Final Recommendation: 32 of 61 Sources (52%)

**This is the sweet spot:**
- Quality-focused (avoid maintenance nightmare)
- Geographic diversity (US + Europe)
- Multiple source types (operators, directories, editorial)
- Manageable maintenance burden
- Based on legacy research insights

**29 sources will stay disabled:**
- 15 broken/invalid (domain issues, 404s)
- 10 low quality (outdated blogs, unreliable)
- 4 community sources (noisy, rate limited)

### Key Success Factors

1. **Start Small, Scale Smart:** 26 sources (Phase 1) is a great starting point
2. **Monitor Quality:** Track extraction success rate, not just booth count
3. **Respect Priorities:** Let source priority system resolve conflicts
4. **Cache Aggressively:** Content hashing = 5x API cost reduction
5. **Focus on Tier 1:** photobooth.net + Autophoto + photomatica = 80% of value

**The battle is won by data quality, not data quantity.** The legacy research proved this: photobooth.net's 20-year curated index is more valuable than 40 scraper sources. Build the experience around high-quality data, don't compete on coverage alone.

---

## Appendix A: Quick Reference SQL

### Enable Phase 1 Sources (6 sources)
```sql
-- Enable Autophoto (NYC museum + locator)
UPDATE crawl_sources SET enabled = true, priority = 90, status = 'active', last_error = NULL
WHERE source_name = 'Autophoto' AND enabled = false;

-- Fix TimeOut LA URL (Dec 2024 article)
UPDATE crawl_sources SET
  source_url = 'https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324',
  status = 'active', last_error = NULL
WHERE source_name = 'Time Out LA';

-- Fix TimeOut Chicago URL
UPDATE crawl_sources SET
  source_url = 'https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth',
  status = 'active', last_error = NULL
WHERE source_name = 'Time Out Chicago';

-- Fix Block Club Chicago URL (March 2025 - VERY RECENT)
UPDATE crawl_sources SET
  source_url = 'https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/',
  status = 'active', last_error = NULL
WHERE source_name = 'Block Club Chicago';

-- Fix Locale Magazine LA URL
UPDATE crawl_sources SET
  source_url = 'https://localemagazine.com/best-la-photo-booths/',
  status = 'active', last_error = NULL
WHERE source_name = 'Locale Magazine LA';

-- Priority adjustments
UPDATE crawl_sources SET priority = 60 WHERE source_name = 'Lomography Locations';
UPDATE crawl_sources SET priority = 50 WHERE source_name = 'Flickr Photobooth Group';
```

### Enable Phase 2 Sources (4 European operators)
```sql
UPDATE crawl_sources SET enabled = true, status = 'active', last_error = NULL
WHERE source_name IN (
  'Fotoautomat Berlin',
  'Fotoautomat FR',
  'Fotoautomat Wien',
  'Fotoautomatica'
);
```

### Disable Broken Sources
```sql
UPDATE crawl_sources SET enabled = false, status = 'inactive'
WHERE source_name IN (
  'Photomatica Berlin',  -- Domain doesn't exist
  'Autofoto',  -- Domain for sale
  'Digital Cosmonaut Berlin',  -- Wrong content
  'Design My Night London',  -- 404
  'Design My Night NYC',  -- 404
  'Solo Sophie Paris',  -- 404
  'Japan Experience',  -- 404
  'Smithsonian'  -- Historical article only
);
```

### Health Monitoring Query
```sql
SELECT
  source_name,
  priority,
  enabled,
  status,
  consecutive_failures,
  last_successful_crawl,
  last_error,
  CASE
    WHEN consecutive_failures >= 3 THEN '🔴 CRITICAL'
    WHEN consecutive_failures >= 2 THEN '⚠️  WARNING'
    WHEN last_successful_crawl < NOW() - INTERVAL '30 days' THEN '⏰ STALE'
    WHEN enabled = false THEN '⏸️  DISABLED'
    ELSE '✅ HEALTHY'
  END as health_status
FROM crawl_sources
ORDER BY enabled DESC, priority DESC, consecutive_failures DESC;
```

---

## Appendix B: Expected Booth Yield by Source

| Source | Priority | Status | Expected Yield | Data Quality |
|--------|----------|--------|----------------|--------------|
| Photobooth.net | 100 | ✅ Enabled | 200-500 | Excellent |
| Autophoto | 90 | ⚠️ Enable | 20-30 | Excellent |
| photomatica.com | 90 | ✅ Enabled | 10-20 | Excellent |
| photoautomat.de | 85 | Check | 15-30 | Good |
| Photomatica West Coast | 80 | ✅ Enabled | 10-20 | Excellent |
| photomatic.net | 80 | Check | 10-20 | Good |
| Photoautomat DE | 75 | ✅ Enabled | 5-15 | Good |
| Fotoautomat Berlin | 70 | Enable | 10-20 | Good |
| Fotoautomat FR | 70 | Enable | 10-20 | Good |
| Fotoautomat Wien | 70 | Enable | 5-15 | Good |
| Fotoautomatica | 70 | Enable | 5-15 | Good |
| TimeOut LA | 60 | Fix URL | 5-10 | Good |
| TimeOut Chicago | 60 | Fix URL | 5-10 | Good |
| Block Club Chicago | 60 | Fix URL | 6+ | Excellent (Recent) |
| **TOTAL (26-32 sources)** | - | - | **500-1,000+** | **High** |

---

**Report Prepared By:** Claude Code Analysis System
**Based On:** Database state, LEGACY_RESEARCH_INSIGHTS.md, CRAWLING_STRATEGY_ANALYSIS.md
**Recommendation:** Enable 26-32 sources (52% of inventory) for optimal quality/maintenance balance
