# Booth Beacon: Research & Action Plan

**Date:** November 28, 2025
**Critical Problem:** Only 3 booths in database despite 39+ configured crawl sources

---

## Current State Analysis

### What We Have
- ✅ 39+ crawl sources configured (Tier 1-3 priorities)
- ✅ AI extraction engine with comprehensive schema
- ✅ Firecrawl integration for web scraping
- ✅ Admin dashboard for crawler management
- ✅ Manual booth submission form
- ✅ Interactive map infrastructure (Google Maps)
- ✅ Timeout fixes deployed (60s with 90s buffer)

### Critical Gap
**❌ ONLY 3 BOOTHS IN DATABASE**

This indicates the extraction pipeline is failing to:
1. Successfully crawl target websites
2. Extract booth data from crawled content
3. Transform raw data into structured booth records
4. Save validated booths to database

---

## Root Cause Research Questions

### 1. Crawler Execution
- [ ] Are crawls actually running?
- [ ] Are they completing or timing out?
- [ ] What does raw_content_storage table show?
- [ ] Are Firecrawl API calls succeeding?

### 2. Data Extraction
- [ ] Is AI extraction finding booths in raw content?
- [ ] Are extractors matched correctly to sources?
- [ ] Is the extraction schema too strict?
- [ ] Are we losing data in transformation?

### 3. Data Validation
- [ ] Are booths being rejected due to validation?
- [ ] What fields are most commonly missing?
- [ ] Are geocoding failures blocking inserts?
- [ ] Are duplicate detection rules too aggressive?

### 4. Source Quality
- [ ] Which sources have the most booth-dense pages?
- [ ] Are we crawling the right URLs?
- [ ] Do sources require JS rendering?
- [ ] Are anti-scraping measures blocking us?

---

## Research Tasks (Do These First)

### Phase 1: Diagnostic Deep Dive

**Task 1.1: Check Raw Content Storage**
```sql
-- How much content have we actually crawled?
SELECT
  source_id,
  COUNT(*) as pages_crawled,
  AVG(LENGTH(content)) as avg_content_length
FROM raw_content_storage
GROUP BY source_id
ORDER BY pages_crawled DESC;
```

**Task 1.2: Check Crawler Metrics**
```sql
-- What's actually happening in crawls?
SELECT
  source_name,
  status,
  COUNT(*) as crawl_count,
  AVG(pages_crawled) as avg_pages,
  AVG(booths_extracted) as avg_booths_found,
  SUM(booths_extracted) as total_booths_found
FROM crawler_metrics
WHERE completed_at > NOW() - INTERVAL '30 days'
GROUP BY source_name, status
ORDER BY total_booths_found DESC;
```

**Task 1.3: Examine Extraction Logs**
- Check crawler_metrics for extraction_time_ms
- Look for patterns in successful vs failed extractions
- Identify which extractor types work best

**Task 1.4: Test Single Source End-to-End**
- Pick highest-priority source (photobooth.net)
- Manually trigger crawl via admin dashboard
- Watch real-time logs
- Document exactly where pipeline fails

---

## Action Plan: Fix Data Pipeline

### Priority 1: Get Booths Flowing (Week 1)

#### TODO List 1: Fix Immediate Extraction Issues

- [ ] **Audit extractor mapping**
  - Verify each source has correct extractor_type in database
  - Check extractor routing in index.ts matches database
  - Test that extractors can actually be invoked

- [ ] **Loosen validation rules**
  - Make latitude/longitude optional (geocode later)
  - Allow partial addresses (city + country minimum)
  - Accept booths with minimal data
  - Add "confidence_score" field instead of rejecting

- [ ] **Test top 3 sources manually**
  - Photobooth.net
  - Lomography
  - Digital Cosmonaut Berlin
  - Document what data each actually provides

- [ ] **Add detailed extraction logging**
  - Log raw HTML/markdown snippets
  - Log AI prompts and responses
  - Log validation failures with reasons
  - Save rejected booths to review table

- [ ] **Create extraction health dashboard**
  - Show extraction success rate by source
  - Display common rejection reasons
  - List top failing extractors
  - Track booths/page yield over time

#### TODO List 2: Improve Firecrawl Integration

- [ ] **Optimize Firecrawl settings per source**
  - Adjust waitFor times for JS-heavy sites
  - Test onlyMainContent true vs false
  - Experiment with different scrapeOptions
  - Document best config per source type

- [ ] **Implement Firecrawl result caching**
  - Cache successful crawls for 7 days
  - Reuse cached HTML for extraction testing
  - Reduce API costs during development

- [ ] **Add Firecrawl error handling**
  - Retry with different settings on failure
  - Fall back to simpler extraction if AI fails
  - Queue sources for manual review

- [ ] **Create Firecrawl testing utility**
  - CLI tool to test any URL
  - Shows raw HTML/markdown output
  - Simulates extraction pipeline
  - Helps debug new sources

#### TODO List 3: Enhance AI Extraction

- [ ] **Multi-pass extraction strategy**
  - Pass 1: Find all potential booth mentions
  - Pass 2: Extract detailed info for each
  - Pass 3: Validate and dedupe
  - Save intermediate results

- [ ] **Add extraction confidence scoring**
  - AI rates confidence 0-100 for each field
  - Flag low-confidence booths for review
  - Learn from manually corrected booths

- [ ] **Create booth review workflow**
  - Admin page to review extracted booths
  - Approve/reject/edit before publish
  - Feeds back into extraction prompts
  - Builds training dataset

- [ ] **Implement fallback extractors**
  - If AI extraction fails, try regex patterns
  - If structured data missing, extract from text
  - Better to have partial data than nothing

---

### Priority 2: Alexandra's Workflow & UX (Week 2)

#### TODO List 4: Admin Workflow Enhancements

- [ ] **Booth Review Queue**
  - List of extracted booths pending approval
  - Side-by-side: raw data vs structured
  - Quick approve/reject buttons
  - Batch operations for common patterns
  - Search and filter by confidence score

- [ ] **Source Quality Dashboard**
  - Which sources produce most booths?
  - Which have highest approval rates?
  - Time-series of booth extraction over time
  - Recommend sources to enable/disable

- [ ] **Manual Booth Entry Wizard**
  - Step-by-step form (location → details → photos)
  - Address autocomplete with geocoding
  - Suggest similar existing booths (dedupe)
  - Preview on map before saving

- [ ] **Batch Operations**
  - Import CSV of booths
  - Bulk edit (e.g., fix country names)
  - Bulk approve from trusted sources
  - Bulk geocoding for missing coordinates

- [ ] **Data Quality Tools**
  - Find booths with missing fields
  - Detect potential duplicates
  - Validate addresses via Google Maps API
  - Flag booths needing updates

#### TODO List 5: Interactive Map Improvements

- [ ] **Map Clustering & Performance**
  - Implement proper marker clustering
  - Lazy load markers on zoom/pan
  - Show booth count per cluster
  - Smooth zoom animations

- [ ] **Advanced Filtering**
  - Filter by booth type (analog/digital)
  - Filter by operational status
  - Filter by machine model
  - Date added range filter
  - "Near me" geolocation filter

- [ ] **Booth Details Enhancement**
  - Richer booth cards with photos
  - "Get Directions" Google Maps link
  - User reviews/ratings (future)
  - "Report Issue" button
  - Social sharing buttons

- [ ] **Map Interactions**
  - Click to select booth → zoom & highlight
  - Hover preview (tooltip with basic info)
  - List view toggle (map + sidebar list)
  - Save favorites (local storage/account)

- [ ] **Search & Discovery**
  - Search by city name → auto-zoom
  - Search by booth name
  - "Explore [City]" pages with static lists
  - Curated "Best Of" collections

#### TODO List 6: Submit Form UX Improvements

- [ ] **Progressive Enhancement**
  - Step 1: Location (required)
  - Step 2: Basic details (semi-required)
  - Step 3: Photos & extras (optional)
  - Show progress bar

- [ ] **Smart Helpers**
  - "Find my location" GPS button
  - Address autocomplete
  - Detect country from IP
  - Suggest machine model from description

- [ ] **Validation Feedback**
  - Real-time validation messages
  - Show which fields still needed
  - Explain why each field matters
  - Allow "save draft" for later

- [ ] **After Submission**
  - Show submitted booth on map preview
  - "Add Another" quick button
  - Email confirmation with booth link
  - Estimated review time

---

### Priority 3: Technical Infrastructure (Week 3)

#### TODO List 7: Database & Performance

- [ ] **Add Missing Indexes**
  - booths(city, country)
  - booths(latitude, longitude)
  - booths(created_at DESC)
  - booths(status)
  - full-text search on name, address

- [ ] **Implement Booth Deduplication**
  - Fuzzy name matching
  - Geospatial distance checking
  - Merge duplicate booth records
  - Track merged booth history

- [ ] **Data Quality Checks**
  - CONSTRAINT: latitude/longitude valid ranges
  - CONSTRAINT: reasonable address formats
  - CHECK: required fields not empty
  - Automated data cleanup jobs

- [ ] **Performance Optimization**
  - Cache popular map queries
  - Precompute booth counts by city
  - Optimize map data payload
  - Enable Cloudflare caching

#### TODO List 8: Monitoring & Observability

- [ ] **Crawler Health Alerts**
  - Email if no booths extracted in 24h
  - Slack webhook for crawler failures
  - Daily digest of crawler stats
  - Weekly booth growth report

- [ ] **User Analytics**
  - Track most viewed cities
  - Monitor search queries
  - Measure submit form completion rate
  - Identify popular booth types

- [ ] **Error Tracking**
  - Sentry for frontend errors
  - Structured logging for crawler
  - Alert on API rate limits
  - Monitor Supabase usage

---

## Questions for Decision Making

### Immediate Decisions Needed

1. **Data Quality vs Quantity?**
   - Should we accept partial booth data to get numbers up?
   - Or maintain strict quality until extraction improves?
   - **Recommendation:** Start permissive, tighten later

2. **Manual vs Automated?**
   - Focus on fixing automated crawling first?
   - Or build manual submission workflow for quick wins?
   - **Recommendation:** Parallel - 70% automated, 30% manual tools

3. **Which Sources First?**
   - Focus on 3-5 highest-yield sources?
   - Or try to get all 39 working at basic level?
   - **Recommendation:** Top 5 perfect, then broaden

4. **Extraction Strategy?**
   - Keep AI-powered extraction?
   - Add regex fallbacks for known patterns?
   - Hybrid approach?
   - **Recommendation:** Hybrid - AI primary, regex backup

5. **Review Workflow?**
   - Auto-approve booths from trusted sources?
   - Or human review everything initially?
   - **Recommendation:** Auto-approve high-confidence, review low

### UX Priority Questions

1. **Map vs List View?**
   - Is map the primary interface?
   - Do we need robust list view?
   - **Current:** Map primary, list secondary

2. **Search Focus?**
   - City-based search most important?
   - Or booth name search?
   - **Recommendation:** City search primary

3. **Mobile Experience?**
   - Mobile-first map design?
   - Separate mobile UI?
   - **Recommendation:** Responsive, mobile-optimized

---

## Success Metrics

### Week 1 Goals
- [ ] 100+ booths in database (from 3)
- [ ] 5+ sources successfully extracting
- [ ] <10% extraction failure rate
- [ ] Extraction logging in place

### Week 2 Goals
- [ ] 500+ booths in database
- [ ] Booth review workflow functional
- [ ] Map clustering implemented
- [ ] Submit form improvements deployed

### Week 3 Goals
- [ ] 1000+ booths in database
- [ ] 20+ sources active and extracting
- [ ] Admin dashboard complete
- [ ] Performance optimization done

---

## Next Steps

1. **Run diagnostic queries** to understand current state
2. **Test single source end-to-end** to find exact failure point
3. **Fix immediate blockers** preventing booth extraction
4. **Build booth review workflow** for Alexandra
5. **Iterate on extraction** based on real data

---

## Open Questions for Team

- What's the target number of booths for launch?
- Which cities/countries are priority?
- What's the quality bar for "publishable" booth?
- How much manual curation is acceptable?
- What's the budget for Firecrawl API calls?

