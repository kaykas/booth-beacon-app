# Master TODO List: Booth Beacon Complete Action Plan

**Date:** November 28, 2025
**Purpose:** Comprehensive execution plan combining all research, diagnostic findings, and UX improvements
**Priority Order:** Critical bugs → Data pipeline → UX enhancements → Infrastructure

---

## 🚨 CRITICAL - FIX NOW (TODAY)

### 1. Deploy Current Code to Vercel
**Why:** Booth detail pages and images exist in code but aren't live
**Impact:** High - Users seeing broken experience right now
- [ ] Commit all current changes (booth detail page, images, etc.)
- [ ] Push to GitHub to trigger Vercel deployment
- [ ] Verify deployment succeeded on Vercel dashboard
- [ ] Test booth popup images on production site
- [ ] Test booth detail page links work
- [ ] Verify images load correctly

### 2. Verify Image URLs in Database
**Why:** Images may not be displaying due to bad URLs
- [ ] Query booths table for image URL patterns
- [ ] Check if photo_exterior_url fields are populated
- [ ] Check if ai_preview_url fields exist
- [ ] Test placeholder image path `/placeholder-booth.jpg` exists
- [ ] Add placeholder image if missing

### 3. Trigger First Crawl to Get Real Booths
**Why:** Only 3 test booths exist, need real data
- [ ] Complete test crawl for photobooth.net (in progress)
- [ ] Verify booths extracted successfully
- [ ] Check that images are extracted from sources
- [ ] Validate booth detail pages work with crawled data

---

## 🔥 HIGH PRIORITY - DATA PIPELINE (THIS WEEK)

### Phase 1: Make Crawler Work End-to-End (Days 1-2)

#### Fix Immediate Extraction Issues
- [ ] **Test photobooth.net crawl** - Monitor first real crawl execution
- [ ] **Analyze crawl results** - Check what booths were found
- [ ] **Fix extraction failures** - Debug any errors in AI extraction
- [ ] **Loosen validation rules** - Make lat/lng optional, accept partial data
- [ ] **Add extraction logging** - Log AI prompts, responses, rejections
- [ ] **Test top 5 sources** - Manually crawl and verify each works
  - [ ] photobooth.net
  - [ ] lomography.com
  - [ ] photomatica.com
  - [ ] autophoto.org
  - [ ] photoautomat.de

#### Create Missing Infrastructure
- [ ] **Create raw_content_storage table** - Store crawled HTML for reprocessing
- [ ] **Fix crawler_metrics schema** - Add missing columns (pages_crawled, etc.)
- [ ] **Add confidence scoring** - Track extraction quality
- [ ] **Create booth review queue** - For Alexandra to approve/reject

#### Improve Firecrawl Integration
- [ ] **Optimize per-source settings** - Different configs for different site types
- [ ] **Implement caching** - Cache successful crawls for 7 days
- [ ] **Better error handling** - Retry with fallback strategies
- [ ] **Create testing utility** - CLI tool to test any URL

### Phase 2: Scale Up Extraction (Days 3-5)

#### Automated Crawl Scheduling
- [ ] **Create crawl scheduler Edge Function** - Auto-schedule based on frequency
- [ ] **Set up cron trigger** - GitHub Actions or external cron
- [ ] **Add job queue processor** - Process queued jobs automatically
- [ ] **Implement retry logic** - Auto-retry failed crawls

#### Bulk Initial Crawls
- [ ] **Schedule all 38 enabled sources** - Stagger to avoid rate limits
- [ ] **Monitor first wave** - Watch crawls execute in real-time
- [ ] **Document success patterns** - What extractors work best
- [ ] **Fix failing sources** - Debug and adjust configs
- [ ] **Target: 100+ booths extracted** - Within first 48 hours

#### AI Extraction Enhancements
- [ ] **Multi-pass extraction** - Find mentions → Extract details → Validate
- [ ] **Fallback extractors** - Regex patterns if AI fails
- [ ] **Training data collection** - Save corrections for future improvements
- [ ] **Cost optimization** - Use Haiku for simple extractions

### Phase 3: Data Quality & Monitoring (Days 6-7)

#### Monitoring & Alerts
- [ ] **Email alerts** - Notify if no booths extracted in 24h
- [ ] **Slack webhooks** - Real-time crawler failure notifications
- [ ] **Daily digest** - Summary of crawler stats
- [ ] **Weekly report** - Booth growth trends

#### Database Optimization
- [ ] **Add indexes** - booths(city, country, status, created_at)
- [ ] **Full-text search** - On name, address fields
- [ ] **Deduplication system** - Fuzzy matching + geospatial distance
- [ ] **Data quality constraints** - Validate lat/lng ranges, required fields

---

## 💎 USER EXPERIENCE - CRITICAL IMPROVEMENTS (THIS WEEK)

### Map Experience Enhancements
- [ ] **Fix marker clustering** - Ensure clustering works with 100+ markers
- [ ] **Lazy load markers** - Only load markers in viewport
- [ ] **Smooth animations** - Zoom/pan transitions
- [ ] **Better popups** - Rich info windows with photos
- [ ] **List view toggle** - Map + sidebar list view option
- [ ] **Advanced filtering UI** - Filter by type, status, machine model
- [ ] **Search by city** - Auto-zoom to searched city
- [ ] **"Near me" improvements** - Better geolocation handling

### Booth Detail Page Improvements
- [ ] **Image gallery** - Swipeable full-screen gallery
- [ ] **Sample strip showcase** - Vertical photo strip display
- [ ] **Community photos** - User-submitted photos section
- [ ] **Reviews & ratings** - 5-star rating system
- [ ] **Visit checklist** - "Have you visited?" tracking
- [ ] **Social sharing** - Better OG tags, Twitter cards
- [ ] **Related booths** - "Nearby" and "Similar" recommendations
- [ ] **Operator page** - Link to operator's other booths

### Submit Form UX Overhaul
- [ ] **Progressive form** - Step 1: Location → Step 2: Details → Step 3: Photos
- [ ] **Address autocomplete** - Google Places API integration
- [ ] **GPS location** - "Find my location" button
- [ ] **Photo upload** - Drag-and-drop multiple photos
- [ ] **Machine database** - Dropdown of known machine models
- [ ] **Preview before submit** - Show what booth will look like
- [ ] **Duplicate detection** - Warn if booth might already exist
- [ ] **Save draft** - Allow incomplete submissions

### Homepage & Discovery
- [ ] **Featured booths carousel** - Highlight interesting booths
- [ ] **City guides** - "Best booths in [City]" landing pages
- [ ] **Recently added** - Show newest booths
- [ ] **Most popular** - Track views, show trending
- [ ] **Collections** - Curated "Best Of" lists
- [ ] **Search improvements** - Fuzzy search, suggestions

---

## 💝 USER FEATURES - INSPIRED BY ALEXANDRA'S WORKFLOW (THIS WEEK)

**Background:** Alexandra manually researches analog photo booths, curates them by city, adds personality with cute icons on Google Maps, and shares these maps for trips. We want to enable all users to create and share their own curated booth collections.

### Personal Booth Collections
- [ ] **Create custom lists** - "My Berlin Trip", "Best NYC Booths", etc.
- [ ] **Save booths to lists** - Heart/bookmark button on booth cards
- [ ] **Organize by city/trip** - Group booths by destination
- [ ] **Add personal notes** - "Cash only", "Great lighting", "Cheap!"
- [ ] **Custom icons/tags** - Emoji or icon per booth (like Alexandra's cute icons)
- [ ] **Collection visibility** - Public, unlisted, or private

### Sharing & Social Features
- [ ] **Share collection links** - Unique URL per collection
- [ ] **Google Maps export** - Generate shareable Google Maps link with all booths
- [ ] **Social media sharing** - Rich preview cards for collections
- [ ] **Embed collections** - Iframe embed code for blogs/websites
- [ ] **Follow other collectors** - See others' public collections
- [ ] **Collection discovery** - "Featured Collections", "Trending This Week"

### Trip Planning Tools
- [ ] **Multi-city itinerary** - Plan route through multiple cities
- [ ] **Map route optimization** - Best order to visit booths
- [ ] **"Near me" while traveling** - Location-based booth discovery
- [ ] **Visit tracking** - Check off visited booths
- [ ] **Travel journal** - Add photos from your booth visits
- [ ] **Export to calendar** - Add booth visits to Google Calendar

### City Guides (Like Alexandra Creates)
- [ ] **Curated city landing pages** - "Best Booths in Berlin"
- [ ] **Neighborhood guides** - "Kreuzberg Photo Booths"
- [ ] **Booth density maps** - Heatmap of booth locations
- [ ] **"Alexandra's Picks"** - Featured collections by the inspiration herself
- [ ] **Community guides** - User-submitted city guides
- [ ] **Seasonal guides** - "Summer 2025 European Booth Tour"

---

## 🛠️ BACKEND ADMIN TOOLS - SITE MAINTENANCE (NEXT WEEK)

**Note:** These are operational tools for maintaining data quality and system health. Not related to Alexandra or user-facing features.

### Booth Review Workflow (For Moderation)
- [ ] **Booth review queue** - List pending approvals from crawler/submissions
- [ ] **Side-by-side comparison** - Raw data vs structured
- [ ] **Quick approve/reject** - One-click actions
- [ ] **Batch operations** - Approve multiple at once
- [ ] **Edit before approve** - Fix data inline
- [ ] **Confidence scoring** - Sort by extraction quality

### Source Management Dashboard
- [ ] **Source quality metrics** - Which sources produce best booths
- [ ] **Approval rates** - Track quality per source
- [ ] **Enable/disable sources** - Toggle sources on/off
- [ ] **Source testing** - Dry-run mode for new sources
- [ ] **Error analysis** - Common failure patterns

### Data Quality Tools
- [ ] **Find incomplete booths** - Missing required fields
- [ ] **Duplicate detection** - Find potential duplicates
- [ ] **Geocoding validator** - Fix incorrect coordinates
- [ ] **Bulk geocoding** - Add coordinates to missing booths
- [ ] **Bulk editing** - Fix common issues across multiple booths
- [ ] **CSV import** - Import booths from spreadsheet
- [ ] **Data export** - Export for backup/analysis

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
- [ ] **Partitioning** - For very large tables
- [ ] **Read replicas** - If performance degrades

### API & Integration
- [ ] **Public API** - Allow third parties to access booth data
- [ ] **Webhooks** - Notify on new booths added
- [ ] **GraphQL endpoint** - For flexible querying
- [ ] **Rate limiting** - Protect against abuse

### DevOps & Monitoring
- [ ] **Error tracking** - Sentry for frontend errors
- [ ] **Performance monitoring** - Vercel Analytics
- [ ] **Uptime monitoring** - UptimeRobot or similar
- [ ] **Log aggregation** - Structured logging system
- [ ] **Load testing** - Test with 10k+ booths

### Content & SEO
- [ ] **City landing pages** - SEO-optimized pages for each city
- [ ] **Sitemap generation** - Dynamic sitemap for all booths
- [ ] **Schema markup** - Rich snippets for Google
- [ ] **Meta tags optimization** - Better OG tags for sharing
- [ ] **Blog/content** - Photo booth guides, history, tips

---

## 📊 SUCCESS METRICS & GOALS

### Week 1 (Current Week)
- [ ] 100+ booths in database (from 3)
- [ ] 5+ sources successfully extracting
- [ ] <10% extraction failure rate
- [ ] All UX critical bugs fixed
- [ ] Booth detail pages fully functional

### Week 2
- [ ] 500+ booths in database
- [ ] 15+ sources active
- [ ] Booth review workflow operational
- [ ] Map clustering working smoothly
- [ ] Submit form improvements deployed

### Week 3
- [ ] 1,000+ booths in database
- [ ] 25+ sources active
- [ ] Admin dashboard complete
- [ ] Performance optimized
- [ ] Monitoring and alerts active

### Month 1
- [ ] 5,000+ booths
- [ ] All 38 sources operational
- [ ] Public API available
- [ ] SEO optimizations complete
- [ ] Community features launched

---

## 🎯 IMMEDIATE NEXT ACTIONS (RIGHT NOW)

1. **Check test crawl results** - See if photobooth.net crawl succeeded
2. **Commit and push code** - Deploy booth detail pages and image fixes
3. **Create raw_content_storage migration** - Essential for reprocessing
4. **Schedule bulk crawls** - Get top 10 sources running
5. **Fix any extraction failures** - Debug and resolve blockers

---

## 📝 RESEARCH COMPLETED

- ✅ Diagnostic queries revealed crawler never run
- ✅ Database schema analysis complete
- ✅ UX code review shows pages exist but not deployed
- ✅ Root cause identified: Infrastructure ready but not executing
- ✅ Comprehensive extraction improvement plan created
- ✅ Admin workflow requirements documented

---

## 🔗 RELATED DOCUMENTATION

- `/docs/DIAGNOSTIC_FINDINGS.md` - Root cause analysis
- `/docs/RESEARCH_AND_PLAN.md` - Original research document
- `/docs/ADMIN_CRAWLER_WORKFLOW.md` - Admin workflow guide
- `/supabase/functions/unified-crawler/` - Crawler implementation
- `/src/app/booth/[id]/page.tsx` - Booth detail page
- `/src/components/booth/BoothMap.tsx` - Map with image popups

---

**Last Updated:** November 28, 2025
**Next Review:** Daily standup - track progress on critical tasks
**Owner:** Jascha Kaykas-Wolff (with Claude as strategic partner)
