# Master Crawler Strategy
## The Definitive Guide to Building the World's Most Comprehensive Analog Photo Booth Database

**Last Updated:** 2025-11-28
**Status:** Phase 1 Ready for Implementation

---

## Executive Summary

This document consolidates:
- **Master Source List** (Core/Discovery/Blog categorization)
- **Existing Crawler Analysis** (61 sources, 20 enabled)
- **Supply Chain Backdoor** (tracking paper/chemistry consumption)
- **Firecrawl Automation** (AI-powered discovery)
- **Exclusion Strategy** (avoiding false positives)

**Target:** 26-32 high-quality enabled sources (NOT all 61)
**Focus:** Quality over quantity, analog verification, community-trusted sources

---

## Part 1: Master Source List

### Tier Classification

**[CORE]** - Existing established networks (high priority, already crawled)
**[DISCOVERY]** - Hidden gems with verified booths (medium priority)
**[BLOG]** - Community guides with detailed location notes (low priority, manual verification needed)

---

### Europe: The "Fotoautomat" Belt

#### [CORE] Sources - Already Enabled
✅ **Berlin/Leipzig:** http://www.photoautomat.de/standorte.html
- Status: ENABLED (source_id: find in crawl_sources)
- Notes: The absolute standard, 20+ years of history

✅ **Paris/Prague:** http://www.fotoautomat.fr/standorte.html
- Status: ENABLED
- Notes: Restoration team network

❌ **London/Barcelona:** https://www.autofoto.org/locations (Rafael Hortala-Vallve's network)
- Status: **NOT IN DATABASE - NEEDS ADDITION**
- Priority: HIGH (major European network)

❌ **Florence:** https://www.fotoautomatica.com/
- Status: **NOT IN DATABASE - NEEDS ADDITION**
- Priority: HIGH (Italian street booths)

❌ **Vienna:** https://www.fotoautomatwien.com/
- Status: **NOT IN DATABASE - NEEDS ADDITION**
- Priority: MEDIUM (Hotels & Supersense)

#### [DISCOVERY] Sources - Hidden Networks

❌ **Sweden:** https://automatfoto.se/
- Status: **NOT IN DATABASE - NEEDS ADDITION**
- Priority: HIGH (hidden Stockholm network)
- Expected: 10-20 locations

#### [BLOG] Sources - Community Guides

📝 **Berlin Enthusiast:** https://feeistmeinname.de/search/label/Fotoautomat
- Type: German blog tracking specific machine quirks
- Action: Manual verification, extract location data
- Priority: LOW

📝 **Berlin Guide:** https://pheltmagazin.co/photo-booths-of-berlin/
- Type: Detailed location notes in English
- Action: Cross-reference with photoautomat.de
- Priority: LOW

📝 **Florence Guide:** https://girlinflorence.com/2012/01/24/the-perfect-guide-to-the-best-vintage-photo-shoot/
- Type: English guide to Florence street booths
- Action: Verify against fotoautomatica.com
- Priority: LOW

---

### North America: The Restoration Networks

#### [CORE] Sources - Already Enabled

✅ **photobooth.net** - HIGHEST QUALITY SOURCE
- Status: ENABLED (dominant source)
- Notes: 20 years, community-verified, 90%+ accuracy

❌ **NYC/Philly:** https://classicphotobooth.net/locations-2/
- Status: **NOT IN DATABASE - USE .NET, NOT .COM**
- Priority: CRITICAL (major East Coast network)
- Expected: 30-50 locations

❌ **San Francisco/LA:** https://photomatica.com/locations
- Status: **NOT IN DATABASE - NEEDS ADDITION**
- Priority: HIGH (West Coast network)
- Filter: "Vintage" or "Public" booths only
- Expected: 20-40 locations

✅ **Chicago/Midwest:** https://autophoto.org/locations (The "Technicians Project" HQ)
- Status: **VERIFY IF ENABLED**
- Notes: Museum-quality booth tracker

#### [DISCOVERY] Sources - National Networks

❌ **USA Nationwide:** https://louiedespres.com/photobooth-project
- Status: **NOT IN DATABASE - NEEDS ADDITION**
- Priority: HIGH
- Notes: Verified "Dip & Dunk" tracker, updated 2024
- Expected: 40-60 locations

❌ **Los Angeles Map:** https://findmyfilmlab.com/photobooths
- Status: **NOT IN DATABASE - NEEDS ADDITION**
- Priority: MEDIUM
- Notes: Curated map for analog shooters
- Expected: 15-25 LA locations

#### [BLOG] Sources - Regional Guides

📝 **Portland, OR:** https://puddlesphotobooth.com/blog/best-photo-booths-portland
- Type: Definitive list of Model 11s
- Priority: MEDIUM
- Expected: 5-10 verified locations

📝 **San Francisco Guide:** https://dothebay.com/p/strike-a-pose-photo-booths-in-the-bay
- Type: Updates on Musee Mecanique booth
- Priority: LOW
- Cross-reference: photomatica.com

---

### Asia & Oceania: The "Rare Earths"

#### [CORE] Sources

❌ **Australia:** https://metroautophoto.com.au/locations
- Status: **NOT IN DATABASE - NEEDS ADDITION**
- Priority: HIGH
- Notes: Only major network in Southern Hemisphere
- Expected: 15-30 locations

#### [DISCOVERY] Sources

❌ **Seoul, Korea:** https://eternalog-fotobooth.com
- Status: **NOT IN DATABASE - NEEDS ADDITION**
- Priority: MEDIUM
- Notes: Only verified chemical booth in Korea
- Expected: 1-3 locations (rare!)

❌ **Singapore:** Search "Fotoautomat The Projector"
- Status: **NOT IN DATABASE - MANUAL SEARCH NEEDED**
- Priority: LOW
- Location: Golden Mile Tower
- Expected: 1 location

---

## Part 2: Supply Chain Backdoor Strategy

### The Paper Trail

**Problem:** Analog booths need specialized paper and chemistry. Tracking consumption identifies private/unlisted booths.

#### 1. Slavich Paper Tracker

**Source:** https://www.photrio.com/forum/
**Action:** Search for "Slavich paper" group buys or "bulk roll order"
**Rationale:** Private owners often coordinate bulk purchases
**Implementation:**
```
- Add crawl_source: "Photrio - Slavich Paper Discussions"
- Crawler type: FORUM_THREAD_PARSER
- Regex pattern: /slavich.*bulk|group buy.*photo.*paper/i
- Entity extraction: Email addresses, location mentions, quantity orders
```

**Expected Yield:** 5-15 private booth owners per year

#### 2. Chemistry Distribution Network

**Source:** https://photosys.com/ (Photo Systems Inc.)
**Action:** Crawl "Distributors" or "Partners" lists
**Rationale:** B2B suppliers maintain customer directories
**Implementation:**
```
- Add crawl_source: "Photo Systems - Distributor Network"
- Crawler type: B2B_DIRECTORY
- Extract: Business names, locations, contact info
- Filter: Focus on "booth" or "automated" keywords
```

**Expected Yield:** 10-20 commercial/institutional booths

#### 3. Technician Roster

**Source:** https://autophoto.org/exhibitions
**Action:** Scrape contributor names and bios
**Rationale:** These 49 people maintain 90% of world's analog booths
**Implementation:**
```
- Add crawl_source: "Autophoto - Technician Contributors"
- Crawler type: PROFILE_SCRAPER
- Extract: Names, location clues, affiliated venues
- Cross-reference: Match names to other sources
```

**Expected Yield:** 20-30 previously unknown booth locations

---

## Part 3: Firecrawl Automation Strategy

### Step 1: Discovery Search (UGC Content)

**Goal:** Find the "long tail" - blogs, Reddit, social posts about analog booths

**Endpoint:** `/search`
**Query Pattern:**
```json
{
  "query": "site:reddit.com OR site:lemon8-app.com OR site:tiktok.com \"smell of chemicals\" \"photo booth\" OR \"drying time\" \"photo booth\"",
  "limit": 50,
  "scrapeOptions": {
    "formats": ["markdown"],
    "excludeTags": ["nav", "footer", ".ad-slot"]
  }
}
```

**Why "smell of chemicals"?**
Digital booths don't smell. This is the analog verification "smell test."

**Additional Query Patterns:**
```
- "wet strip" photo booth
- "dip and dunk" booth
- "wait for it to dry" photo booth
- "silver gelatin" booth
- "black and white only" photo booth
```

**Implementation:**
```typescript
// Add to unified-crawler
const ANALOG_VERIFICATION_QUERIES = [
  '"smell of chemicals" photo booth',
  '"drying time" photo booth',
  '"wet strip" analog booth',
  '"dip and dunk" photo',
  'site:reddit.com analog photo booth "still wet"'
];

async function discoverUGCContent() {
  for (const query of ANALOG_VERIFICATION_QUERIES) {
    const results = await firecrawl.search({ query, limit: 50 });
    // Pass to LLM for validation
  }
}
```

### Step 2: LLM Validation Prompt

**System Prompt:**
```
You are an Analog Verification Agent. Analyze the text provided.

FILTER FOR ANALOG:
Look for keywords:
- "wet strip" / "still wet" / "drying time"
- "chemical smell" / "developer smell"
- "dip and dunk" / "dip-and-dunk"
- "developing time" / "processing time"
- "silver gelatin" / "black and white only"
- Mentions of specific machines: "Model 11", "Model 14", "Photo-Me", "Photoautomat"

EXCLUDE DIGITAL:
Reject if mentions:
- "touch screen" / "iPad" / "tablet interface"
- "filters" / "GIF" / "Boomerang" / "video mode"
- "color prints" (unless specified as C-41 analog)
- "instant upload" / "QR code" / "share online"

EXTRACT:
1. Location Name
2. Address / City / Country
3. Evidence Quote (e.g., "We had to wait 4 minutes for it to dry.")
4. Source URL
5. Confidence Score (1-10)

OUTPUT FORMAT: JSON
{
  "location_name": "...",
  "address": "...",
  "city": "...",
  "country": "...",
  "evidence_quote": "...",
  "source_url": "...",
  "confidence_score": 8,
  "is_analog": true
}
```

**Implementation:**
```typescript
const VALIDATION_PROMPT = `...`; // Above prompt

async function validateAnalogBooth(content: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4',
    max_tokens: 1000,
    system: VALIDATION_PROMPT,
    messages: [{ role: 'user', content }]
  });

  return JSON.parse(response.content[0].text);
}
```

---

## Part 4: Exclusion List (False Positives)

### Domains to Block

Add these to crawler negative filters:

```sql
INSERT INTO crawl_source_exclusions (domain, reason) VALUES
  ('accidentallywesanderson.com', 'Dead links, no booth data'),
  ('theflashpack.com', 'Digital rental service only'),
  ('simplebooth.com', 'iPad software company, not booths'),
  ('tapsnap.net', 'Digital event rental service'),
  ('photobooth.com', 'Generic domain, low quality data'),
  ('instantprintbooths.com', 'Digital instant print, not analog');
```

### Keywords to Exclude

**Global negative keywords:**
```sql
INSERT INTO negative_keywords (keyword, category) VALUES
  ('Purikura', 'JAPANESE_DIGITAL'),
  ('Life4Cuts', 'KOREAN_DIGITAL'),
  ('Haru Film', 'KOREAN_DIGITAL'),
  ('Magic Mirror', 'EVENT_DIGITAL'),
  ('360 booth', 'EVENT_DIGITAL'),
  ('GIF booth', 'EVENT_DIGITAL'),
  ('iPad photo booth', 'EVENT_DIGITAL'),
  ('touchscreen', 'DIGITAL_INDICATOR'),
  ('instant filters', 'DIGITAL_INDICATOR'),
  ('social sharing', 'DIGITAL_INDICATOR');
```

### Specific Location Blocklist

**Known converted/digital locations:**
```sql
INSERT INTO location_blocklist (name, city, country, reason) VALUES
  ('North Star Pinball', 'Montreal', 'Canada', 'Converted to digital'),
  ('Fifth + Broadway', 'Nashville', 'USA', 'Digital hybrid system'),
  ('Mall of America - Photo Me', 'Minneapolis', 'USA', 'Digital conversion 2023');
```

**Implementation in crawler:**
```typescript
// Before inserting booth, check blocklist
async function isBlocklisted(name: string, city: string) {
  const { data } = await supabase
    .from('location_blocklist')
    .select('*')
    .ilike('name', name)
    .ilike('city', city)
    .limit(1);

  return data && data.length > 0;
}
```

---

## Part 5: Implementation Roadmap

### Phase 1: Critical Missing Core Sources (Week 1)

**Immediate Additions:**
1. ✅ classicphotobooth.net/locations-2/ (NYC/Philly) - **CRITICAL**
2. ✅ photomatica.com/locations (SF/LA) - **CRITICAL**
3. ✅ louiedespres.com/photobooth-project (USA Nationwide) - **HIGH**
4. ✅ autofoto.org/locations (London/Barcelona) - **HIGH**
5. ✅ fotoautomatica.com (Florence) - **HIGH**
6. ✅ automatfoto.se (Sweden) - **HIGH**

**SQL Implementation:**
```sql
-- 1. Classic Photo Booth (NYC/Philly)
INSERT INTO crawl_sources (source_name, source_url, source_type, priority, enabled, notes)
VALUES (
  'Classic Photo Booth Network',
  'https://classicphotobooth.net/locations-2/',
  'DIRECTORY',
  1,
  true,
  'NYC/Philly restoration network - NOTE: Use .net, not .com. Major East Coast network with 30-50 verified booths.'
);

-- 2. Photomatica (SF/LA)
INSERT INTO crawl_sources (source_name, source_url, source_type, priority, enabled, notes)
VALUES (
  'Photomatica - West Coast Network',
  'https://photomatica.com/locations',
  'DIRECTORY',
  1,
  true,
  'San Francisco/LA network. Filter for "Vintage" or "Public" booths only. 20-40 expected locations.'
);

-- 3. Louie Despres Project (USA)
INSERT INTO crawl_sources (source_name, source_url, source_type, priority, enabled, notes)
VALUES (
  'Louie Despres Photobooth Project',
  'https://louiedespres.com/photobooth-project',
  'DIRECTORY',
  1,
  true,
  'Verified "Dip & Dunk" tracker, updated 2024. USA nationwide coverage. 40-60 expected locations.'
);

-- 4. Autofoto (London/Barcelona)
INSERT INTO crawl_sources (source_name, source_url, source_type, priority, enabled, notes)
VALUES (
  'Autofoto - UK/Spain Network',
  'https://www.autofoto.org/locations',
  'DIRECTORY',
  1,
  true,
  'Rafael Hortala-Vallve network covering London/Barcelona. Major European network.'
);

-- 5. Fotoautomatica (Florence)
INSERT INTO crawl_sources (source_name, source_url, source_type, priority, enabled, notes)
VALUES (
  'Fotoautomatica - Florence',
  'https://www.fotoautomatica.com/',
  'DIRECTORY',
  1,
  true,
  'Italian street booths in Florence. High-quality analog booths.'
);

-- 6. Automatfoto (Sweden)
INSERT INTO crawl_sources (source_name, source_url, source_type, priority, enabled, notes)
VALUES (
  'Automatfoto - Stockholm Network',
  'https://automatfoto.se/',
  'DIRECTORY',
  2,
  true,
  'Hidden Stockholm network. 10-20 expected Swedish locations.'
);
```

**Expected Impact:**
- +150-250 verified analog booths
- Geographic coverage: NYC, Philly, SF, LA, London, Barcelona, Florence, Stockholm
- Quality: All sources are restoration networks or curated directories

### Phase 2: Asia-Pacific & Supply Chain (Weeks 2-3)

**Additions:**
1. metroautophoto.com.au (Australia)
2. eternalog-fotobooth.com (Seoul)
3. Photrio forum crawler (Slavich paper trail)
4. Photo Systems distributor network
5. Autophoto technician roster

**Expected Impact:**
- +40-60 booths
- Coverage: Australia, Korea, Singapore
- Supply chain backdoor: +15-35 private/unlisted booths

### Phase 3: UGC Discovery & Validation (Week 4)

**Firecrawl Automation:**
1. Implement discovery search queries
2. Deploy LLM validation pipeline
3. Monitor Reddit/TikTok/Lemon8 for analog mentions
4. Test "smell test" verification accuracy

**Expected Impact:**
- +20-40 booths from social media
- Validation pipeline: 90%+ accuracy
- Ongoing discovery: 5-10 new booths/month

### Phase 4: Exclusion & Cleanup (Week 5)

**Data Quality:**
1. Deploy exclusion list (domains/keywords/locations)
2. Run deduplication against new sources
3. Flag digital conversions in existing database
4. Verify top 100 most-viewed booths still analog

**Expected Impact:**
- Remove 10-20 false positives
- Improve data quality: 95%+ analog verification
- User trust: Clear "Last Verified" dates

---

## Part 6: Success Metrics

### Target Database Stats (3 Months)

**Current State:**
- Total booths: 912
- Geocoded: 28%
- Enabled sources: 20/61 (33%)
- Geographic coverage: Heavy Europe bias

**Target State (Phase 1-4 Complete):**
- Total booths: 1,300-1,500
- Geocoded: 80%+
- Enabled sources: 26-32 (43-52%)
- Geographic coverage: Global (USA 40%, Europe 40%, Asia-Pacific 15%, Other 5%)
- Analog verification: 95%+ accuracy
- Community sources: 3-5 active (Photrio, Reddit, etc.)

### Quality Over Quantity Principles

1. **26-32 enabled sources is OPTIMAL** (not all 61)
2. **photobooth.net remains #1** (20 years of community trust)
3. **No generic blogs/Pinterest** (low signal-to-noise ratio)
4. **Supply chain backdoor** (finds booths that don't advertise)
5. **Analog verification mandatory** (smell test, dip-and-dunk keywords)

---

## Part 7: Crawler Implementation Notes

### New Specialized Extractors Needed

**1. Forum Thread Parser** (for Photrio)
```typescript
async function parseForumThread(url: string) {
  // Extract: post author, date, content
  // Regex: Location mentions, contact info
  // Entity: Email extraction for private owner outreach
}
```

**2. B2B Directory Crawler** (for Photo Systems)
```typescript
async function parseB2BDirectory(url: string) {
  // Extract: Company names, addresses
  // Filter: "booth" or "automated" keywords
  // Validate: Business type (not just paper supplier)
}
```

**3. Profile Scraper** (for Autophoto technicians)
```typescript
async function parseProfilePage(url: string) {
  // Extract: Name, bio, location clues
  // Cross-reference: Match to other booth mentions
  // Enrichment: Find affiliated venues
}
```

### Firecrawl Integration

**Current Implementation:**
- Firecrawl used for some blog/article sources
- AI extraction: Claude Sonnet 4 with custom prompts
- 90-95% accuracy on structured data

**Enhancements Needed:**
```typescript
// Add social media discovery
const SOCIAL_SOURCES = [
  'reddit.com/r/analog',
  'reddit.com/r/photobooth',
  'tiktok.com (requires API key)',
  'lemon8-app.com'
];

// Add validation pipeline
async function validateAnalogWithLLM(content: string) {
  // Use analog verification prompt from Part 3
  // Return confidence score + extracted data
  // Flag uncertain results for manual review
}
```

---

## Part 8: Monitoring & Maintenance

### Weekly Checks

1. **New Source Performance**
   - Booth yield vs. expected
   - Analog verification accuracy
   - Geocoding success rate

2. **Data Quality Alerts**
   - Duplicate detection rate
   - Digital booth false positives
   - User-reported issues

3. **Exclusion List Updates**
   - Monitor for new digital conversions
   - Update blocked domains
   - Refine negative keywords

### Monthly Reviews

1. **Source Health**
   - Which sources still updating?
   - Dead links / site redesigns
   - New sources to add

2. **Geographic Gaps**
   - Underrepresented cities
   - Supply chain opportunities
   - Community source expansion

3. **User Engagement**
   - Most-viewed booth pages
   - User-submitted corrections
   - Community validation feedback

---

## Appendix A: Quick Reference Commands

### Check Current Source Status
```sql
SELECT source_name, enabled, priority, last_crawled_at
FROM crawl_sources
WHERE enabled = true
ORDER BY priority;
```

### Add New Source (Template)
```sql
INSERT INTO crawl_sources (source_name, source_url, source_type, priority, enabled, notes)
VALUES (
  '[Network Name]',
  '[URL]',
  '[DIRECTORY|BLOG|EDITORIAL|FORUM]',
  [1-3],
  true,
  '[Notes about expected yield, quality, special handling]'
);
```

### Check Booth Geographic Coverage
```sql
SELECT country, COUNT(*) as booth_count
FROM booths
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
GROUP BY country
ORDER BY booth_count DESC;
```

### Analog Verification Query
```sql
SELECT name, address, city, country, source_id
FROM booths
WHERE name ILIKE '%digital%'
   OR name ILIKE '%iPad%'
   OR description ILIKE '%touchscreen%'
   OR description ILIKE '%filters%';
-- Manual review these for digital booth false positives
```

---

## Appendix B: Contact Information

### Key Networks & Maintainers

**photobooth.net**
- Contact: [Community forum]
- Role: Primary source, community validation

**Autophoto.org**
- Contact: [Via exhibitions page]
- Role: Technician network, restoration projects

**Photoautomat (Germany)**
- Contact: [Via website]
- Role: European network, Berlin/Leipzig focus

**Classic Photo Booth (USA)**
- Contact: [Via classicphotobooth.net]
- Role: East Coast restoration network

### Supply Chain Contacts

**Photo Systems Inc.**
- Website: photosys.com
- Role: Chemistry distribution

**Photrio Forum**
- Website: photrio.com/forum
- Role: Community discussions, paper group buys

---

**Document Status:** Ready for Implementation
**Next Action:** Deploy Phase 1 SQL scripts, enable 6 critical sources
**Expected Completion:** Phase 1 in 1 week, Full roadmap in 5 weeks
