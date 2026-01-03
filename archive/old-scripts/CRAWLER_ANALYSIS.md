# Web Crawler Booth Extraction Analysis

## Executive Summary

The crawler is extracting far fewer booths than expected from source websites. After analyzing the database, cached content, and source URLs, I've identified **three critical issues** causing low extraction rates:

1. **Wrong URLs**: Many sources point to homepages/blogs instead of actual location directories
2. **JavaScript-heavy pages**: Dynamic content not fully loaded before extraction
3. **Multi-page directories**: Crawler not following pagination or individual booth links

## Database Analysis

### Current State
- **80 crawl sources** configured
- **20+ enabled sources**
- **Only ~120 total booths** extracted across all sources
- **Most sources have 0 booths** despite being crawled

### Sources with Low/Zero Extraction

| Source | URL | Booths | Issue |
|--------|-----|--------|-------|
| autophoto.org | https://autophoto.org/booth-locator | 0 | JavaScript map, content not loading |
| photobooth.net (main) | https://www.photobooth.net/ | 12 | Points to blog homepage, not directory |
| Photobooth.net (locations) | https://www.photobooth.net/locations/ | 3 | Interactive directory, needs link following |
| Time Out LA | https://www.timeout.com/... | 0 | Article page, but AI should extract |
| Block Club Chicago | https://blockclubchicago.org/... | 0 | Article page, AI should extract |
| Classic Photo Booth | https://classicphotobooth.net/locations-2/ | 0 | Needs crawling or dynamic content |
| Lomography | https://www.lomography.com/... | 0 | Community/user-submitted content |
| Autofoto | https://www.autofoto.org/locations | 0 | Directory page structure |

### Sources Working Well

| Source | Booths | Why it works |
|--------|--------|--------------|
| Photoautomat Berlin/Leipzig | 33 | Simple HTML table with addresses |
| Find My Film Lab - LA | 18 | Well-structured page |
| Automatfoto Stockholm | 16 | Clear HTML structure |
| Time Out Chicago | 10 | Article with clear booth mentions |
| photobooth.net (homepage) | 12 | Blog posts with booth mentions |

## Root Causes

### 1. URL Configuration Issues

**Problem**: Sources configured with wrong URLs

Examples:
- `photobooth.net` → `https://www.photobooth.net/` (homepage/blog)
  - Should be: https://www.photobooth.net/locations/ (but this is an interactive directory)
  - Real fix: Need to crawl individual booth pages like `/locations/index.php?locationID=XXX`

- `autophoto.org` → `https://autophoto.org/booth-locator`
  - This IS the right URL, but it's a JavaScript map
  - Content loads dynamically via API
  - Firecrawl's `waitFor` setting might be too short

**Impact**: Crawler fetches pages with no booth data

**Solution**: Update source URLs + increase wait times for JavaScript pages

### 2. JavaScript/Dynamic Content

**Problem**: Pages use React/Vue/maps that load data via API after page load

Affected sources:
- autophoto.org (interactive map)
- photobooth.net (search/filter interface)
- Many modern directories

Current crawler settings:
```typescript
waitFor: domainConfig.waitFor, // 5000-8000ms
timeout: domainConfig.timeout,  // 30000-60000ms
```

**Issue**: Wait time may be insufficient for heavy JavaScript sites

**Evidence**: autophoto.org returns "404 page not found" in raw content, suggesting the crawler hit a routing error or the page didn't fully load

**Solution**:
- Increase `waitFor` to 10000-15000ms for known JS-heavy sites
- Add domain-specific configs for problematic sources
- Consider using Firecrawl's `actions` parameter to interact with page (click buttons, etc.)

### 3. Multi-Page Directories Not Fully Crawled

**Problem**: Directory sites like photobooth.net have:
- Index/listing page (few details)
- Individual booth pages (full details)

Current behavior:
- Crawler fetches index page only
- Doesn't follow links to individual booth pages
- Extracts partial data only

Example: `photobooth.net/locations/` shows 3 booths with no addresses because:
- Index page lists booth names only
- Full data on `/locations/index.php?locationID=XXX` pages
- Crawler `pages_per_batch: 3` too low
- Needs link following, not just multi-page crawl

**Solution**:
- Increase `pages_per_batch` for directory sources
- Ensure Firecrawl is configured to follow internal links
- May need to use `crawlUrl` with proper link-following config

### 4. AI Extraction Effectiveness

**Current AI System**: Uses Claude Sonnet 4.5 with structured extraction

**Strengths**:
- Good at extracting from article text (Time Out Chicago: 10 booths)
- Handles unstructured content well
- Can extract from blog posts

**Weaknesses Observed**:
- Returns 0 booths from some clearly booth-rich content
- May need prompt improvements for certain formats
- Chunking strategy (50k chars) might split booth data

**Key Finding**: The AI extraction is GOOD, but it's being fed the WRONG content
- photobooth.net homepage: blog posts, some booth mentions → 12 booths
- photobooth.net/locations/: directory index, no addresses → 3 partial booths
- autophoto.org: 404/empty page → 0 booths

## Specific Source Fixes

### High Priority Fixes

#### 1. photobooth.net (GOLD STANDARD SOURCE)
**Current**: Crawls homepage blog
**Issue**: Blog != directory
**Fix Options**:
A. Change URL to crawl from map: https://www.photobooth.net/locations/
B. Increase pages_per_batch to 50+ to follow individual booth links
C. Add custom scraping logic to extract booth IDs from index and fetch each page

**Recommended**: Option B + C - crawl the locations page deeply with link following

#### 2. autophoto.org (MAJOR US SOURCE)
**Current**: 404 errors / empty page
**Issue**: JavaScript map not loading, or crawler hitting routing error
**Fix**:
A. Increase waitFor to 15000ms
B. Add `onlyMainContent: false` (already set)
C. Check if site blocks bots - may need custom headers
D. Alternative: Scrape the exhibitions page which has simpler HTML

**Recommended**: Test with longer wait times first, then consider exhibitions page fallback

#### 3. City Guide Articles (Time Out LA, Block Club Chicago)
**Current**: 0 booths despite being articles about booths
**Issue**: Not crawled recently, or AI extraction failing
**Fix**:
A. Verify raw content exists and contains booth data
B. If no raw content: trigger new crawl
C. If has content: review AI extraction results
D. May need to adjust AI prompts for article formats

**Recommended**: Force re-crawl with current AI extractor

#### 4. Lomography / Community Sources
**Current**: 0 booths
**Issue**: User-generated content, complex page structures
**Fix**:
A. Manual inspection of page structure
B. Custom extractor or prompt tuning
C. May need to crawl magazine articles, not main directory

**Recommended**: Lower priority - complex source

## Recommended Action Plan

### Phase 1: Quick Wins (1-2 hours)
1. **Fix autophoto.org** - increase waitFor to 15000ms, test crawl
2. **Force re-crawl** Time Out LA, Block Club Chicago to verify AI extraction
3. **Update photobooth.net** - set pages_per_batch to 100 for /locations/ source
4. **Disable duplicate sources** - keep best URL for each site

### Phase 2: Configuration Updates (2-3 hours)
1. **Domain-specific configs** - add to DOMAIN_CONFIG:
   ```typescript
   'autophoto.org': { pageLimit: 50, timeout: 90000, waitFor: 15000 },
   'photobooth.net/locations': { pageLimit: 100, timeout: 120000, waitFor: 10000 },
   'classicphotobooth.net': { pageLimit: 50, timeout: 60000, waitFor: 8000 },
   ```

2. **Update source URLs** - fix wrong URLs in database:
   - Verify each enabled source points to actual location data
   - Disable homepage/blog URLs unless they contain booth mentions

3. **Adjust batch sizes** - directory sources need 20-100 pages, not 3

### Phase 3: Advanced Improvements (3-5 hours)
1. **Link following logic** - ensure Firecrawl follows internal booth links
2. **Custom extractors** for problematic sources (photobooth.net, autophoto.org)
3. **AI prompt tuning** for zero-extraction cases
4. **Retry failed sources** with new configs

### Phase 4: Testing & Validation
1. **Test crawls** on fixed sources
2. **Compare booth counts** before/after
3. **Validate data quality** - check addresses, coordinates
4. **Monitor extraction rates**

## Expected Results

### Conservative Estimates (after Phase 1-2)

| Source | Current | Expected | Reasoning |
|--------|---------|----------|-----------|
| photobooth.net | 12+3=15 | 200-500 | Has 800+ booths in directory |
| autophoto.org | 0 | 50-100 | Major US operator |
| Time Out LA/Chicago | 0/10 | 10/10 | Articles with booth lists |
| Classic Photo Booth | 0 | 20-40 | East coast operator |
| Other directories | ~20 | 100-200 | Various improvements |

**Total Expected**: 400-850 booths (vs current ~120)

### Optimistic Estimates (after Phase 3-4)

With link following and custom extractors:
- photobooth.net: 500-800 booths
- autophoto.org: 100-150 booths
- Other sources: 200-300 booths

**Total Possible**: 800-1250 booths

## Implementation Priority Matrix

| Fix | Impact | Effort | Priority |
|-----|--------|--------|----------|
| Fix autophoto.org waitFor | High | Low | **P0** |
| Update photobooth.net pages_per_batch | High | Low | **P0** |
| Re-crawl city guides | Medium | Low | **P1** |
| Domain-specific configs | High | Medium | **P1** |
| URL audits/fixes | Medium | Medium | **P2** |
| Link following logic | High | High | **P2** |
| Custom extractors | Medium | High | **P3** |

## Technical Details

### Current Crawler Architecture

**Stack**:
- Firecrawl API for fetching/rendering pages
- Claude Sonnet 4.5 for AI extraction
- Supabase for data storage

**Flow**:
1. Fetch page with Firecrawl (respects `waitFor`, `timeout`)
2. Store raw HTML/markdown in `crawl_raw_content`
3. Extract booths with AI (Claude)
4. Validate and deduplicate
5. Upsert into `booths` table

**Current Config** (index.ts:238-245):
```typescript
const DOMAIN_CONFIG = {
  'photobooth.net': { pageLimit: 1, timeout: 60000, waitFor: 8000 },
  'fotoautomat-wien.at': { pageLimit: 1, timeout: 60000, waitFor: 8000 },
  'autophoto.org': { pageLimit: 2, timeout: 45000, waitFor: 5000 },
  'lomography.com': { pageLimit: 2, timeout: 45000, waitFor: 5000 },
  'default': { pageLimit: 3, timeout: 30000, waitFor: 6000 }
};
```

### Firecrawl Configuration

**Current scrapeOptions** (index.ts:1014-1019):
```typescript
{
  formats: ['markdown', 'html'],
  onlyMainContent: false,
  waitFor: 6000,
  timeout: 30000,
}
```

**Current crawlUrl options** (index.ts:761-769):
```typescript
{
  limit: pageLimit,
  scrapeOptions: {
    formats: ['markdown', 'html'],
    onlyMainContent: false,
    waitFor: domainConfig.waitFor,
    timeout: domainConfig.timeout,
  },
}
```

**Missing options** that could help:
- `includePaths`: Specify paths to follow (e.g., "/locations/*")
- `excludePaths`: Avoid crawling irrelevant pages
- `maxDepth`: Control link depth
- `allowBackwardCrawling`: Follow links to earlier pages
- `allowExternalContentLinks`: Follow offsite links if needed

## Next Steps

1. **Review this analysis** with the team
2. **Prioritize fixes** based on impact/effort
3. **Implement Phase 1** quick wins
4. **Test and measure** results
5. **Iterate** based on data

## Files Modified

To implement these fixes, you'll need to edit:
- `/supabase/functions/unified-crawler/index.ts` - domain configs, wait times
- Database: `crawl_sources` table - update URLs, batch sizes
- `/supabase/functions/unified-crawler/ai-extraction-engine.ts` - prompt tuning (if needed)

## Contact for Questions

Generated: 2025-11-30
Analyst: Claude (Sonnet 4.5)
