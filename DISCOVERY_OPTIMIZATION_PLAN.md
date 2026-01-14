# Discovery Optimization Plan
**Goal:** Get all 674 "Discovered - Not Indexed" pages indexed by Google

## Problem Analysis
- **674 booth pages** discovered but not indexed
- Pages have valid slugs and content
- Issue: Low priority in Google's crawl budget

## Root Causes
1. **Insufficient internal linking** - Booth pages aren't linked from enough places
2. **Crawl budget limitation** - Google prioritizing other pages first
3. **Missing category/collection pages** - No grouping structure
4. **No "new content" signals** - Google doesn't see updates

## Solutions (Priority Order)

### 1. ✅ **Already Implemented**
- [x] WebSite schema with SearchAction
- [x] Sitemap with all pages
- [x] AI meta tags
- [x] Structured data (LocalBusiness, BreadcrumbList)
- [x] Open Graph tags

### 2. 🚀 **High Impact - Do Now**

#### A. Enhance Sitemap Priorities
```typescript
// Boost recently updated booths
priority: booth.updated_at > oneWeekAgo ? 0.9 : 0.7
changeFrequency: 'daily' for new booths, 'weekly' for older
```

#### B. Add Collection Pages
Create category pages that group booths:
- `/collections/vintage-machines` - By machine type
- `/collections/recently-verified` - New additions
- `/collections/popular-cities` - Top locations
- `/collections/ace-hotels` - By chain/operator
Each collection page links to 20-50 booth pages

#### C. Expand "Recently Added" Section
Currently showing 4-8 booths. Increase to:
- Homepage: Show 12 recently updated booths
- Add "/recent" page with 100 most recent booths
- Update daily to signal freshness

#### D. Add "Featured Booths" Rotation
- Rotate 20 different booths daily on homepage
- Ensures every booth gets homepage exposure over time
- Signals to Google these pages are important

### 3. 📈 **Medium Impact - This Week**

#### E. Enhanced Internal Linking
Add sections to every booth page:
- "Nearby Booths" (already exists, expand from 6 to 12)
- "Similar Machines" (link to booths with same machine model)
- "Other Booths in [City]" (link to city page + related booths)
- "Booths in [Country]" (link to 5-10 random country booths)

#### F. Create Index Pages
- `/browse/all` - Paginated list of ALL booths (50 per page)
- `/browse/by-city` - Alphabetical city index
- `/browse/by-country` - Country index
- `/browse/by-machine` - Machine type index

#### G. Add "Random Booth" Feature
- `/booth/random` - Redirects to random booth
- Add "Discover Random Booth" button to header
- Generates internal links to random pages

### 4. ⚡ **Instant Discovery - IndexNow**

#### H. Implement IndexNow API
```typescript
// Notify search engines immediately when:
// - New booth added
// - Booth updated
// - New review added

POST to IndexNow API (Bing, Yandex instant indexing)
```

### 5. 🎯 **Manual Submission**

#### I. Submit Priority URLs to Google
Use Google Search Console "Request Indexing" for:
- Top 10 cities' booth collections
- 50 most complete booth pages
- All collection pages

### 6. 📊 **Monitoring**

#### J. Track Progress
- Weekly: Check "Discovered - Not Indexed" count
- Goal: Reduce from 674 to <100 in 30 days
- Goal: <50 in 60 days
- Goal: <20 in 90 days

## Implementation Timeline

### Week 1 (Now)
- [x] Fix sitemap exclusions (DONE)
- [x] Fix canonical URLs (DONE)
- [ ] Enhance sitemap priorities
- [ ] Create 3 collection pages
- [ ] Expand "Recently Added" to 12 booths
- [ ] Add "/recent" page

### Week 2
- [ ] Create index pages (/browse/all, /browse/by-city)
- [ ] Implement IndexNow API
- [ ] Submit 50 priority URLs to Google manually
- [ ] Add "Random Booth" feature

### Week 3
- [ ] Expand internal linking on booth pages
- [ ] Create operator collection pages (Ace Hotels, etc.)
- [ ] Add daily featured booths rotation
- [ ] Monitor indexing progress

### Week 4
- [ ] Create remaining collection pages
- [ ] Optimize images with structured ImageObject
- [ ] Add more FAQ pages for long-tail keywords
- [ ] Final testing and monitoring

## Expected Results

### 30 Days
- **Indexed pages**: +200 (from 674 to 474 not indexed)
- **Organic traffic**: +50%
- **Featured snippets**: 2-3 captured

### 60 Days
- **Indexed pages**: +400 (from 674 to 274 not indexed)
- **Organic traffic**: +100%
- **Top 10 rankings**: 10-15 keywords

### 90 Days
- **Indexed pages**: +600 (from 674 to <75 not indexed)
- **Organic traffic**: +150-200%
- **Featured snippets**: 5-8 captured
- **AI citations**: Appearing in ChatGPT/Claude responses

## Key Metrics to Track
1. "Discovered - Not Indexed" count (weekly)
2. Total indexed pages (weekly)
3. Organic impressions (daily)
4. Organic clicks (daily)
5. Average position for target keywords (weekly)
6. Featured snippet captures (weekly)

---

**Priority:** Start with Week 1 tasks immediately for maximum impact.
