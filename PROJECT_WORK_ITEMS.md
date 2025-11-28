# Booth Beacon - Complete Project Work Items

**Last Updated**: 2025-11-27
**Status**: Active Development
**Production URL**: https://boothbeacon.org

---

## 🔴 CRITICAL - Connection Error Fix (IN PROGRESS)

### Issue
Crawler finished with connection error on admin page

### Root Cause
EventSource connection timing out or losing connection

### Fix Required
1. Add better error handling for EventSource
2. Implement reconnection logic
3. Add timeout handling (currently 10 minutes)
4. Show partial results even if connection drops

**Priority**: P0 - BLOCKING
**Status**: 🟡 IN PROGRESS
**Assignee**: Claude
**ETA**: Immediate

---

## 🔴 CRITICAL - Deployment Path Issue (IN PROGRESS)

### Issue
Crawler deployment failing - wrong directory structure

### Root Cause
- Crawler code at: `/Users/jkw/Projects/booth-beacon/supabase/functions/`
- App expects at: `/Users/jkw/Projects/booth-beacon-app/supabase/functions/`

### Fix Required
1. Copy unified-crawler to booth-beacon-app
2. Ensure all dependencies are included
3. Re-deploy to Supabase Edge Functions
4. Test end-to-end

**Priority**: P0 - BLOCKING
**Status**: 🟡 IN PROGRESS
**Assignee**: Claude
**ETA**: Immediate

---

## 🟠 HIGH PRIORITY - Admin Dashboard Improvements

### Current Issues
- Poor error messaging
- Connection errors not handled gracefully
- No partial results display
- Missing real-time progress indicators
- No abort/cancel button

### Required Features
1. **Better Error Handling**
   - Graceful connection loss recovery
   - Show partial results on error
   - Retry mechanism
   - Clear error messages

2. **Enhanced UI**
   - Live progress bar with percentage
   - Real-time booth count
   - Source-by-source progress
   - Batch progress visualization
   - Cancel/abort button

3. **Status Dashboard**
   - Last successful crawl timestamps
   - Success/failure rates per source
   - Recent booth additions chart
   - Database statistics

4. **Log Viewer**
   - Filterable logs (info/warn/error)
   - Search functionality
   - Export logs to CSV
   - Auto-refresh

**Priority**: P1 - HIGH
**Status**: 🔴 NOT STARTED
**Dependencies**: Connection error fix
**ETA**: 1-2 days

---

## 🟠 HIGH PRIORITY - Crawler URL Fixes

### Issue
Research agent found ~40-50% of source URLs are broken or incorrect

### Required Actions

#### 1. Disable 9 Broken Sources (P0)
- Photomatica Berlin - Domain doesn't exist
- Photomatica West Coast - Wrong content
- Metro Auto Photo - 404
- Flash Pack - Generic page
- Digital Cosmonaut Berlin - 404
- London World - Wrong content
- Locale Magazine LA - 404
- Airial Travel Brooklyn - 404
- Accidentally Wes Anderson - Deprecated

#### 2. Update 14 Incorrect URLs (P0)
- Time Out LA - Update to correct article URL
- Time Out Chicago - Update to correct article URL
- DesignMyNight London - Update to bars page
- Solo Sophie - Update to photo booth guide
- Misadventures with Andi - Update to correct URL
- Girl in Florence - Update search URL
- DoTheBay - Update to correct guide
- Concrete Playground - Update to bars page
- Japan Experience - Update to purikura guide
- Smithsonian - Update search URL
- Phelt Magazine - Update to correct article
- Aperture Tours - Update to 2017 article
- Block Club Chicago - Update to March 2025 article
- Roxy Hotel NYC - Update to stories page

#### 3. Verify 15 Sources (P1)
Need manual testing of Tier 2-4 sources

**Priority**: P1 - HIGH
**Status**: 🔴 NOT STARTED
**Dependencies**: Crawling strategy analysis (✅ COMPLETE)
**ETA**: 1 day
**Deliverable**: SQL migration file with updates

---

## 🟡 MEDIUM PRIORITY - Database Enhancements

### Completed ✅
- ✅ Booth enhancements (ratings, tags, photos, SEO fields)
- ✅ Completeness scoring
- ✅ Auto-slug generation
- ✅ Raw content storage
- ✅ All 39 crawl sources seeded

### Remaining Work
1. **Booth Page Generation**
   - Dynamic routes for `/booth/[slug]`
   - Rich booth detail pages
   - Photo galleries
   - User reviews/ratings
   - Social sharing

2. **Search & Discovery**
   - Full-text search
   - Filter by city/country/type
   - Map view with clustering
   - "Near me" functionality

3. **Data Quality**
   - Geocoding for missing lat/lng
   - Address normalization
   - Duplicate detection improvements
   - Automated verification

**Priority**: P2 - MEDIUM
**Status**: 🟡 PARTIAL (Schema complete, needs implementation)
**ETA**: 2-3 days

---

## 🟡 MEDIUM PRIORITY - Firecrawl Best Practices

### Issue
Crawler not following Firecrawl documentation best practices

### Required Updates
1. **Implement Recommended Configs**
   - Use `crawlUrl` for multi-page sites (photobooth.net, etc.)
   - Use `scrapeUrl` for single articles
   - Add proper `limit` parameters
   - Configure `waitFor` for JS-heavy sites
   - Use `ignoreSitemap: false` for better discovery

2. **Optimize Batch Processing**
   - Implement proper pagination handling
   - Add retry logic for failed batches
   - Optimize API call frequency
   - Add exponential backoff

3. **Consider MCP Integration**
   - Research Firecrawl MCP server benefits
   - Evaluate if it improves performance
   - Test integration if worthwhile

**Priority**: P2 - MEDIUM
**Status**: 🔴 NOT STARTED
**Dependencies**: Crawling strategy analysis (✅ COMPLETE)
**ETA**: 2 days

---

## 🟢 LOWER PRIORITY - Enhanced Extractors

### Current State
- ✅ 15+ custom extractors for specific sites
- ✅ AI-powered generic extractor as fallback
- ✅ Deduplication engine

### Improvements Needed
1. **Photobooth.net Enhanced Extractor**
   - Multi-page crawling
   - State/country page discovery
   - Machine model extraction
   - Historical data capture

2. **City Guide Extractors**
   - Better address parsing
   - Neighborhood extraction
   - Hours/cost parsing improvements

3. **Operator Site Extractors**
   - Autophoto enhanced extractor
   - Photomatica enhanced extractor
   - Location status tracking

**Priority**: P3 - LOW
**Status**: 🔴 NOT STARTED
**Dependencies**: URL fixes, Firecrawl optimization
**ETA**: 3-5 days

---

## 🟢 LOWER PRIORITY - User Features

### Community Features
1. User accounts & authentication
2. Booth ratings & reviews
3. Photo uploads
4. Favorite booths
5. Visit check-ins
6. User-submitted locations

### Discovery Features
1. Interactive map view
2. Advanced search filters
3. City guide pages
4. "Near me" search
5. Booth recommendations
6. Trip planning

**Priority**: P3 - LOW
**Status**: 🔴 NOT STARTED
**ETA**: 2+ weeks

---

## 📋 Work Items Summary

### By Priority

| Priority | Status | Count | Items |
|----------|--------|-------|-------|
| **P0 - Critical** | 🟡 In Progress | 2 | Connection error fix, Deployment path |
| **P1 - High** | 🔴 Not Started | 2 | Admin dashboard, URL fixes |
| **P2 - Medium** | 🟡 Partial | 2 | Database features, Firecrawl practices |
| **P3 - Low** | 🔴 Not Started | 2 | Enhanced extractors, User features |

### By Status

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Complete | 6 | 25% |
| 🟡 In Progress | 4 | 17% |
| 🔴 Not Started | 14 | 58% |

---

## 🎯 Recommended Execution Order

### Phase 1: Critical Fixes (Today)
1. ✅ Fix deployment path issue
2. ✅ Fix connection error on admin page
3. ✅ Test end-to-end crawling

### Phase 2: Data Quality (Days 1-2)
1. ✅ Update broken source URLs (SQL migration)
2. ✅ Disable non-working sources
3. ✅ Test updated sources
4. ✅ Verify database is populating correctly

### Phase 3: Stability & UX (Days 3-4)
1. ✅ Implement Firecrawl best practices
2. ✅ Improve admin dashboard
3. ✅ Add better error handling
4. ✅ Add progress indicators

### Phase 4: Enhancement (Days 5-7)
1. ✅ Build booth detail pages
2. ✅ Implement search functionality
3. ✅ Add map view
4. ✅ Enhanced extractors

### Phase 5: User Features (Week 2+)
1. ✅ User authentication
2. ✅ Reviews & ratings
3. ✅ Community features

---

## 🔍 Current Active Work

### Claude is Currently Working On:
1. 🟡 **Fixing connection error** - Adding better error handling to admin page EventSource
2. 🟡 **Deployment path** - Moving crawler to correct directory structure
3. 🟡 **Creating this work items list** - ✅ DONE

### Completed Today:
1. ✅ Verified database storage is working
2. ✅ Confirmed raw content saving
3. ✅ Verified booth upsert logic
4. ✅ Completed web crawling strategy analysis (39 sources)
5. ✅ Identified broken URLs and priority fixes

---

## 📊 Key Metrics to Track

### Crawler Health
- [ ] Success rate per source (target: >80%)
- [ ] Average booths per crawl (target: 100+)
- [ ] Crawl completion time (target: <5 min)
- [ ] Error rate (target: <10%)

### Database Growth
- [ ] Total booths (current: TBD, target: 500+)
- [ ] Booths with photos (target: 30%+)
- [ ] Booths with coordinates (target: 70%+)
- [ ] Data completeness score (target: 75+)

### User Experience
- [ ] Admin page load time (target: <2s)
- [ ] Crawler start time (target: <5s)
- [ ] Real-time updates (target: <1s latency)

---

## 🚨 Blockers & Risks

### Current Blockers
1. **Connection error** - Preventing successful crawl completion
2. **Deployment path** - Crawler not deploying correctly
3. **Broken URLs** - 40-50% of sources won't work until fixed

### Risks
1. **Firecrawl API costs** - Need to optimize API usage
2. **Rate limiting** - Some sources may have rate limits
3. **Data quality** - Extracted data needs validation
4. **Duplicate detection** - May create duplicate booth entries

---

## 📝 Notes

### Technical Debt
- [ ] Remove redundant code in extractors
- [ ] Consolidate duplicate functions
- [ ] Add comprehensive error logging
- [ ] Implement automated testing
- [ ] Add monitoring/alerting

### Documentation Needed
- [ ] API documentation
- [ ] Crawler architecture docs
- [ ] Database schema docs
- [ ] Deployment guide
- [ ] Troubleshooting guide

---

**Next Update**: After Phase 1 completion
