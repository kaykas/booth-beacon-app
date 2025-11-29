# Master TODO List: Booth Beacon Complete Action Plan

**Date:** November 28, 2025 (REVISED based on codebase audit)
**Purpose:** Comprehensive execution plan reflecting ACTUAL project state
**Priority Order:** Deploy fixes → Run existing systems → UX enhancements → New features

**MAJOR REVISION**: Audit revealed crawler is FULLY BUILT (56 files, 500KB code) and 912 booths already exist. Focus shifted from "building" to "deploying and using" existing infrastructure.

---

## 🚨 CRITICAL - FIX NOW (TODAY)

### 1. Deploy Current Code Fixes to Production
**Status:** ✅ Code complete, awaiting deployment
**Why:** All fixes (TypeScript, homepage, booth URLs, map centering) aren't live
**Impact:** HIGH - Users seeing old version without our improvements
- [ ] Commit all current changes
- [ ] Push to GitHub (triggers automatic Vercel deployment)
- [ ] Verify deployment succeeded on Vercel dashboard
- [ ] Test on production:
  - [ ] Homepage shows all 912 booths (not limited to 4)
  - [ ] Map centers on USA (Kansas), not NYC
  - [ ] Booth detail pages work with SEO slugs (`/booth/joes-bar-brooklyn`)
  - [ ] Location filter badges navigate to map correctly
  - [ ] All 912 booths visible on map

### 2. Complete Geocoding (IN PROGRESS)
**Status:** ⏳ 248/912 booths geocoded (27.2%) - automated script running
**Why:** 664 booths still missing coordinates for map display
**Impact:** HIGH - 72.8% of booths can't show on map
- [x] ✅ Geocoding Edge Function deployed
- [x] ✅ Automated batch script running (bash ID: 712a3a)
- [ ] Monitor progress to completion (664 remaining)
- [ ] Verify success rate stays above 95%
- [ ] Check for any stuck/failed booths
**Expected:** Complete within 12-15 hours

### 3. Verify Updated Source URLs Work
**Status:** ✅ URLs updated in database, needs testing
**Why:** We fixed 5 broken source URLs - need to verify crawler can extract from them
**Impact:** MEDIUM - Validates our source URL fixes
- [ ] Trigger test crawl for updated sources:
  - [ ] Time Out LA (new URL)
  - [ ] Locale Magazine LA (new URL)
  - [ ] Time Out Chicago (new URL)
  - [ ] Block Club Chicago (new source)
- [ ] Verify booths extracted successfully
- [ ] Document extraction success rates

---

## 🔥 HIGH PRIORITY - RUN EXISTING SYSTEMS (THIS WEEK)

### Phase 1: Trigger Bulk Crawls (Days 1-2)

**REALITY CHECK**: Crawler is FULLY BUILT with 56 files (~500KB code). It's ready to use, not build.

#### Run Crawls for All Enabled Sources
**Status:** ✅ Infrastructure complete, ready to execute
**Files:**
- Main crawler: `supabase/functions/unified-crawler/index.ts` (1,524 lines)
- Enhanced extractors: 84KB
- AI extraction engine: 20KB
- Deduplication: 18KB
- Validation: 25KB

**Tasks:**
- [ ] **Deploy unified-crawler Edge Function** (if not already deployed)
- [ ] **Trigger crawls for 38 enabled sources** - Stagger to avoid rate limits
- [ ] **Monitor first wave** - Watch real-time extraction
- [ ] **Check extraction success rates** - Target >90% success
- [ ] **Debug any failures** - Adjust configs as needed
- [ ] **Goal: Extract 100+ new booths** - Within 48 hours

#### Test Top Priority Sources
- [ ] **photobooth.net** - Largest directory (potentially 100+ booths)
- [ ] **lomography.com** - Global community site
- [ ] **photomatica.com** - Equipment supplier with booth locations
- [ ] **autophoto.org** - Classic booth enthusiast site
- [ ] **photoautomat.de** - German booth network

#### Monitor and Optimize
- [ ] **Check crawler_metrics table** - View execution logs
- [ ] **Analyze extraction patterns** - What works best
- [ ] **Optimize Firecrawl settings** - Per-source configurations
- [ ] **Document success patterns** - For future source additions

### Phase 2: Automated Crawl Scheduling (Days 3-5)

#### Create Scheduler Infrastructure
- [ ] **Crawl scheduler Edge Function** - Auto-schedule based on source frequency
- [ ] **Set up cron trigger** - GitHub Actions or Supabase cron
- [ ] **Job queue processor** - Handle queued crawls
- [ ] **Retry logic** - Auto-retry failed extractions
- [ ] **Rate limit handling** - Respect Firecrawl quotas

#### Monitoring & Alerts
- [ ] **Email alerts** - Notify on extraction failures
- [ ] **Slack webhooks** - Real-time notifications
- [ ] **Daily digest** - Crawler stats summary
- [ ] **Weekly report** - Booth growth trends

### Phase 3: Data Quality Improvements (Days 6-7)

#### Database Optimization
- [ ] **Add indexes** - booths(city, country, status, created_at)
- [ ] **Full-text search** - On name, address, description
- [ ] **Verify deduplication works** - 18KB system exists, ensure it's active
- [ ] **Data quality constraints** - Validate field formats

#### Review Workflow Setup
- [ ] **Booth review queue** - For crawler-extracted booths
- [ ] **Confidence scoring** - Sort by extraction quality
- [ ] **Quick approve/reject UI** - One-click moderation
- [ ] **Batch operations** - Approve multiple at once

---

## 💎 USER EXPERIENCE - CRITICAL IMPROVEMENTS (THIS WEEK)

### Map Experience Enhancements
**Current:** Map works but needs performance and UX improvements
- [ ] **Fix marker clustering** - Handle 900+ markers efficiently
- [ ] **Lazy load markers** - Only render viewport markers
- [ ] **Smooth animations** - Better zoom/pan transitions
- [ ] **Rich info windows** - Photos, ratings, quick details
- [ ] **List view toggle** - Map + sidebar list option
- [ ] **Advanced filtering UI** - By type, status, machine model
- [ ] **Search integration** - Auto-zoom to searched location
- [ ] **"Near me" improvements** - Better geolocation UX

### Booth Detail Page Improvements
**Current:** Pages work with SEO slugs, need enhancements
- [ ] **Image gallery** - Swipeable full-screen viewer
- [ ] **Sample strip showcase** - Vertical photo strip display
- [ ] **Community photos section** - User-submitted images
- [ ] **Reviews & ratings** - 5-star system with comments
- [ ] **Visit tracking** - "Have you been here?" feature
- [ ] **Social sharing** - Better OG tags, Twitter cards
- [ ] **Related booths** - "Nearby" and "Similar" recommendations
- [ ] **Operator profiles** - Link to operator's other booths

### Submit Form UX Overhaul
**Current:** Basic form works, needs progressive enhancement
- [ ] **Progressive form** - Step 1: Location → Step 2: Details → Step 3: Photos
- [ ] **Address autocomplete** - Google Places API integration
- [ ] **GPS location button** - "Use my location"
- [ ] **Photo upload** - Drag-and-drop with preview
- [ ] **Machine database** - Dropdown of known models
- [ ] **Preview before submit** - Show formatted booth card
- [ ] **Duplicate detection** - Warn if similar booth exists
- [ ] **Save draft feature** - Resume incomplete submissions

### Homepage & Discovery
**Current:** Shows all 912 booths, needs curation features
- [ ] **Featured booths carousel** - Highlight interesting locations
- [ ] **City guides section** - "Best booths in [City]" landing pages
- [ ] **Recently added** - Show newest discoveries
- [ ] **Most popular** - Track views, show trending booths
- [ ] **Curated collections** - "Best Of" lists
- [ ] **Search improvements** - Fuzzy search, autocomplete suggestions

---

## 💝 USER FEATURES - INSPIRED BY ALEXANDRA (WEEK 2)

**Background:** Alexandra manually curates photo booth maps for travel. Enable ALL users to create and share collections.

### Personal Booth Collections
- [ ] **Create custom lists** - "My Berlin Trip", "Best NYC Booths", etc.
- [ ] **Save booths to lists** - Heart/bookmark button
- [ ] **Organize by city/trip** - Group by destination
- [ ] **Add personal notes** - "Cash only", "Great lighting"
- [ ] **Custom icons/tags** - Emoji markers (like Alexandra's cute icons)
- [ ] **Collection visibility** - Public, unlisted, or private

### Sharing & Social Features
- [ ] **Share collection links** - Unique URL per collection
- [ ] **Google Maps export** - Generate shareable map with all booths
- [ ] **Social media cards** - Rich preview for Twitter, Facebook
- [ ] **Embed collections** - Iframe code for blogs
- [ ] **Follow collectors** - See others' public collections
- [ ] **Collection discovery** - "Featured Collections", "Trending"

### Trip Planning Tools
- [ ] **Multi-city itinerary** - Plan routes through multiple cities
- [ ] **Route optimization** - Best order to visit booths
- [ ] **Location-based discovery** - "Near me" while traveling
- [ ] **Visit tracking** - Check off visited booths
- [ ] **Travel journal** - Add your own photos from visits
- [ ] **Calendar export** - Add booth visits to Google Calendar

### City Guides (Like Alexandra Creates)
- [ ] **Curated city pages** - "Best Booths in Berlin"
- [ ] **Neighborhood guides** - "Kreuzberg Photo Booths"
- [ ] **Booth density heatmaps** - Visualize concentrations
- [ ] **"Alexandra's Picks"** - Featured by the inspiration herself
- [ ] **Community guides** - User-submitted city tours
- [ ] **Seasonal guides** - "Summer 2025 European Booth Tour"

---

## 🛠️ BACKEND ADMIN TOOLS (WEEK 3)

### Source Management Dashboard
- [ ] **Source quality metrics** - Success rates per source
- [ ] **Enable/disable sources** - Toggle sources on/off
- [ ] **Source testing utility** - Dry-run mode for new sources
- [ ] **Error analysis** - Common failure patterns
- [ ] **URL validator** - Test URLs before adding

### Data Quality Tools
- [ ] **Find incomplete booths** - Missing required fields
- [ ] **Duplicate detection UI** - Review potential duplicates
- [ ] **Geocoding validator** - Fix incorrect coordinates
- [ ] **Bulk editing** - Fix common issues across multiple booths
- [ ] **CSV import/export** - Batch operations

### Performance Dashboard
- [ ] **Real-time crawler status** - Live execution monitoring
- [ ] **Historical trends** - Booth growth over time
- [ ] **Source leaderboard** - Best performing sources
- [ ] **Cost tracking** - Firecrawl + Claude API costs
- [ ] **Quality metrics** - Extraction success rates

---

## 🏗️ INFRASTRUCTURE & SCALABILITY (ONGOING)

### Database Enhancements
- [ ] **RLS policies** - Secure access controls
- [ ] **Backup strategy** - Daily automated backups
- [ ] **Performance indexes** - Optimize slow queries
- [ ] **Query optimization** - Review slow queries
- [ ] **Connection pooling** - If needed at scale

### API & Integration
- [ ] **Public API** - RESTful API for booth data
- [ ] **API documentation** - OpenAPI/Swagger docs
- [ ] **Rate limiting** - Protect against abuse
- [ ] **Webhooks** - Notify on new booth additions
- [ ] **GraphQL endpoint** - Flexible querying (future)

### DevOps & Monitoring
- [ ] **Error tracking** - Sentry for frontend errors
- [ ] **Performance monitoring** - Vercel Analytics, Web Vitals
- [ ] **Uptime monitoring** - Alert on downtime
- [ ] **Log aggregation** - Structured logging
- [ ] **Load testing** - Test with 10k+ booths

### Content & SEO
- [x] ✅ **SEO-friendly URLs** - Slugs implemented (`/booth/joes-bar-brooklyn`)
- [x] ✅ **Sitemap generation** - Dynamic sitemap exists
- [ ] **City landing pages** - SEO pages for each city
- [ ] **Schema markup** - Rich snippets for Google
- [ ] **Meta tags optimization** - Better OG tags
- [ ] **Blog/content** - Photo booth guides, history, tips

---

## 📊 REVISED SUCCESS METRICS & GOALS

### Week 1 (Current Week) - REVISED
**Reality:** Already have 912 booths, not 3. Focus on deployment and geocoding.
- [x] ✅ **TypeScript errors fixed** - 90% reduction (156→15)
- [x] ✅ **ESLint warnings fixed** - 73% reduction (307→84)
- [x] ✅ **Homepage displays all booths** - Removed limit, shows 912
- [x] ✅ **Booth URLs use SEO slugs** - Converted across 6 files
- [x] ✅ **Map centers on USA** - Changed from NYC
- [x] ✅ **Geocoding infrastructure ready** - Edge Function deployed
- [ ] **Deploy fixes to production** - Commit and push ⚠️ HIGH PRIORITY
- [ ] **Complete geocoding** - 664/912 remaining (72.8%)
- [ ] **Trigger bulk crawls** - Run for 38 sources
- [ ] **Extract 100+ new booths** - From crawler runs

### Week 2
- [ ] **Geocoding 100% complete** - All 912 booths on map
- [ ] **1,000+ booths total** - From crawler extractions (88 new)
- [ ] **10+ sources actively crawling** - Automated scheduling
- [ ] **Map clustering working** - Smooth with 1,000+ markers
- [ ] **Submit form enhanced** - Progressive form, autocomplete
- [ ] **Booth review workflow** - Admin can approve/reject

### Week 3
- [ ] **1,500+ booths** - Continued extraction (500 new)
- [ ] **20+ sources active** - Majority of sources producing
- [ ] **Admin dashboard complete** - Source management, analytics
- [ ] **User collections MVP** - Create, save, share lists
- [ ] **Performance optimized** - Fast load with 1,500+ booths
- [ ] **Monitoring active** - Alerts, digests, reports

### Month 1
- [ ] **3,000+ booths** - Target from all 38 sources
- [ ] **All 38 sources operational** - Automated crawling
- [ ] **City guides launched** - Top 10 cities curated
- [ ] **Public API available** - Developer access
- [ ] **SEO optimizations complete** - Ranking for key terms
- [ ] **Community features live** - Collections, sharing, reviews

---

## 🎯 IMMEDIATE NEXT ACTIONS (RIGHT NOW)

### TODAY:
1. ✅ **Audit master list** - COMPLETE (this file)
2. **Deploy to production** - Commit all fixes, push to GitHub
3. **Monitor geocoding** - Check progress (currently 27.2% complete)
4. **Test one crawler source** - Verify extraction pipeline works

### THIS WEEK:
5. **Trigger bulk crawls** - All 38 enabled sources
6. **Monitor extraction rates** - Debug any failures
7. **Implement map clustering** - Handle 900+ markers
8. **Create admin review workflow** - Basic approve/reject UI

---

## ✅ COMPLETED TASKS (Audit Findings)

### Infrastructure (FULLY BUILT)
- ✅ **Crawler implementation** - 56 files, 500KB code in `supabase/functions/unified-crawler/`
- ✅ **AI extraction engine** - 20KB, multi-pass extraction (`ai-extraction-engine.ts`)
- ✅ **Deduplication system** - 18KB, fuzzy matching (`deduplication-engine.ts`)
- ✅ **Validation system** - 25KB, comprehensive checks (`validation.ts`)
- ✅ **Enhanced extractors** - 84KB specialized extraction logic
- ✅ **European extractors** - 23KB for European sites
- ✅ **City guide extractors** - 44KB for guide sites
- ✅ **Test coverage** - Multiple test files exist

### Data
- ✅ **912 booths in database** - NOT "only 3 test booths" as previously stated
- ✅ **46 crawler sources configured** - 38 enabled
- ✅ **Database schema complete** - All tables exist and functional
- ✅ **248 booths geocoded** - 27.2% complete, script running

### Frontend
- ✅ **Booth detail pages** - SEO-friendly slugs implemented
- ✅ **Homepage functional** - Shows all booths (limit removed)
- ✅ **Map component** - Working, shows all geocoded booths
- ✅ **Search functionality** - Basic search operational
- ✅ **TypeScript fixes** - 90% of errors resolved
- ✅ **ESLint cleanup** - 73% of issues resolved

---

## 🔍 KEY INSIGHTS FROM AUDIT

1. **Infrastructure is built, not "TODO"** - Crawler exists with 56 files
2. **912 booths exist** - Not 3 as previously stated
3. **Focus should be on USING existing systems** - Not building them
4. **Geocoding is critical** - 72.8% of booths can't display on map yet
5. **Deployment is urgent** - All fixes ready but not live
6. **Crawler just needs to be triggered** - It's ready to extract thousands of booths

---

## 🔗 RELATED DOCUMENTATION

- `MASTER_LIST_AUDIT_NOV28.md` - Detailed audit findings
- `SESSION-SUMMARY.md` - Latest session progress
- `.claude/CLAUDE.md` - Project instructions for Claude
- `supabase/functions/unified-crawler/` - Complete crawler implementation
- `scripts/geocode-all-batches.sh` - Automated geocoding
- `src/app/booth/[slug]/page.tsx` - Booth detail pages
- `src/components/booth/BoothMap.tsx` - Map component

---

**Last Updated:** November 28, 2025 (MAJOR REVISION after codebase audit)
**Status:** Master list now reflects ACTUAL project state
**Next Review:** After deployment and bulk crawl completion
**Owner:** Jascha Kaykas-Wolff (with Claude as strategic partner)
