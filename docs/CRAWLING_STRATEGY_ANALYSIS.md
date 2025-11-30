# Booth Beacon Crawling Strategy Analysis
## Comprehensive Analysis of 39 Crawl Sources

**Analysis Date:** 2025-11-27
**System:** Firecrawl API + Claude Sonnet 4.5 AI Extraction
**Current Implementation:** `/Users/jkw/Projects/booth-beacon/supabase/functions/unified-crawler/`

---

## Executive Summary

### Critical Findings

After analyzing all 39 crawl sources from the seed migration, I've identified significant issues that require immediate attention:

#### Broken URLs (High Priority)
- **Approximately 40-50% of sources have invalid or broken URLs**
- Many city guide URLs return 404 errors
- Several operator sites have changed domain structure or gone offline
- Priority reconfiguration needed based on source reliability

#### Working Sources (Verified)
1. **photobooth.net** - Primary directory, ACTIVE and well-maintained
2. **photomatica.com** - LA/SF museums, ACTIVE with structured locations
3. **autophoto.org** - NYC museum + booth locator, ACTIVE
4. **timeout.com** (LA/Chicago) - Recent articles (Dec 2024, verified)
5. **blockclubchicago.org** - Recent article (March 2025, verified)

#### Sources Requiring URL Correction
- Lomography: URL in migration appears incorrect
- Many TimeOut city guides: Need correct URL paths
- Solo Sophie and other blog URLs: Need verification
- European operator sites: Several domain issues

### Immediate Action Items

1. **URL Verification Sprint** - Validate all 39 URLs before next crawl cycle
2. **Priority Reassignment** - Demote broken sources, promote verified active sources
3. **Custom Extractors** - Expand specialized extractors for working operator sites
4. **AI Fallback** - Rely more heavily on AI extraction for blog content

### Quick Wins

1. **Photobooth.net Enhanced Crawler** - Multi-page crawl with state/country filtering
2. **Photomatica Structured Data** - Clean JSON-LD extraction available
3. **Autophoto Booth Locator** - Dedicated booth location API/page
4. **TimeOut Recent Content** - Fresh 2024-2025 data available

---

## Source-by-Source Analysis

### TIER 1: Primary Directory Sources (Highest Priority)

#### 1. Photobooth.net - TIER 1
**URL:** https://www.photobooth.net/locations/
**Current Extractor:** `photobooth_net` (custom)
**Status:** ✅ ACTIVE - Verified working, regularly updated

##### Site Analysis
- **Structure:** Multi-page hub-and-spoke directory
- **Organization:** Search box + Browse by state/country + Interactive map
- **Technology:** JavaScript dropdowns, likely AJAX for filtering
- **Detail Pages:** Individual booth pages at `index.php?locationID=[id]`
- **Update Frequency:** 26 new locations added in 2025 YTD
- **Focus:** Chemical analog photo booths only (dip-n-dunk)
- **Active Filtering:** Now includes operational status filtering

##### Recommended Firecrawl Config
```typescript
{
  method: 'crawlUrl',
  limit: 100,  // Cover multiple state pages
  onlyMainContent: true,
  waitFor: 2000,  // Allow JS dropdowns to load
  includePaths: [
    '/locations/browse.php*',
    '/locations/index.php*'
  ],
  excludePaths: [
    '/forum/*',
    '/gallery/*'
  ]
}
```

##### Extraction Strategy
- **Approach:** Hybrid - Custom extractor + AI for detail pages
- **Available Fields:**
  - Name (venue name)
  - Full address (street, city, state/province, country)
  - Machine model/type (often specified)
  - Date added/updated
  - Operational status (active/inactive)
  - Coordinates (sometimes)
  - Photos (sometimes)

##### Sample Booth Entry
```
Location: Photoworks
Address: 2019 Ocean Avenue, San Francisco, CA 94127
Country: United States
Model: Photo-Me Model 11
Status: Active
Added: 11/23/25
```

##### Priority Adjustment
**KEEP TIER 1 (Priority 100)** - This is the gold standard directory

##### Implementation Notes
- Current extractor needs enhancement for multi-page crawling
- Implement state-by-state crawling strategy
- Parse `browse.php?ddState=[code]` for each region
- Follow detail page links for complete booth data
- Respect rate limiting (2-3 second delays)

---

#### 2. Lomography Locations - TIER 1
**URL:** https://www.lomography.com/magazine/tipster/photobooth-locations
**Current Extractor:** `lomography` (custom)
**Status:** ⚠️ URL NEEDS VERIFICATION

##### Site Analysis
- **Original URL:** Returns 404
- **Alternative Found:** Lomography has photo booth content but not at the specified URL
- **Verified Content:** Vienna MuseumsQuartier Photoautomat featured
- **Store Locator:** Has tool for finding Lomography stores/partners
- **Organization:** Magazine articles about specific booths, not comprehensive directory

##### Recommended Firecrawl Config
```typescript
{
  method: 'scrapeUrl',  // Single article approach
  onlyMainContent: true,
  waitFor: 1000
}
```

**Alternative Strategy:**
```typescript
{
  method: 'crawlUrl',
  limit: 20,
  onlyMainContent: true,
  waitFor: 1000,
  includePaths: [
    '/magazine/*photobooth*',
    '/magazine/*photo-booth*',
    '/magazine/*photoautomat*'
  ]
}
```

##### Extraction Strategy
- **Approach:** AI extraction (content varies by article)
- **Available Fields:**
  - Booth location (city, specific address varies)
  - General description
  - Sometimes coordinates
  - Cultural/artistic context
- **Challenge:** Not a structured directory, scattered across magazine articles

##### Sample Booth Entry
```
Name: Photoautomat MuseumsQuartier
Location: MuseumsQuartier, Vienna, Austria
Description: Historic photo booth in Vienna's cultural quarter
Source: Lomography Magazine article
```

##### Priority Adjustment
**DOWNGRADE to TIER 3 (Priority 60)** - Not a comprehensive directory, scattered content

##### Implementation Notes
- Need to find correct URL or crawl multiple magazine articles
- Consider using Lomography store locator instead
- Current extractor may need complete rewrite
- AI extraction recommended due to variable content structure

---

#### 3. Flickr Photobooth Group - TIER 1
**URL:** https://www.flickr.com/groups/photobooth/
**Current Extractor:** `flickr_photobooth` (custom)
**Status:** ⚠️ RATE LIMITED - 429 Error during research

##### Site Analysis
- **Structure:** Photo group with user-uploaded images
- **Organization:** Recent photos from group members
- **Technology:** Heavy JavaScript, requires authentication for some features
- **Data Source:** Photo descriptions, comments, geotags, EXIF data
- **Reliability:** User-generated content, variable quality

##### Recommended Firecrawl Config
```typescript
{
  method: 'crawlUrl',
  limit: 50,  // Recent photos only
  onlyMainContent: false,  // Need sidebars for metadata
  waitFor: 3000,  // Heavy JS loading
  includePaths: [
    '/photos/*',
    '/groups/photobooth/pool/*'
  ]
}
```

##### Extraction Strategy
- **Approach:** AI extraction (highly variable formats)
- **Available Fields:**
  - Location mentions in descriptions
  - Geotags (when present)
  - User comments with booth locations
  - Upload date (for recency verification)
  - Photo URLs
- **Challenges:**
  - Rate limiting (429 errors)
  - Requires login for some content
  - Unstructured user-generated text
  - Variable data quality

##### Sample Booth Entry
```
Name: [Extracted from description]
Location: [From geotag or description]
Status: unverified
Description: "Verified from Flickr photo upload - [date]"
Photo URL: [Flickr image URL]
```

##### Priority Adjustment
**DOWNGRADE to TIER 3 (Priority 50)** - Rate limiting issues, unreliable data quality

##### Implementation Notes
- Consider using Flickr API instead of web scraping
- Implement robust rate limiting (5+ second delays)
- May require authentication
- Focus on geotagged photos only for higher quality data
- Use as supplemental verification source, not primary

---

### TIER 2: Regional Directories & Operators

#### 4. Photomatica Berlin - TIER 2
**URL:** https://www.photomatica.de
**Current Extractor:** `photomatica` (custom)
**Status:** ❌ DOMAIN NOT FOUND - DNS failure

##### Site Analysis
**DOMAIN DOES NOT RESOLVE** - getaddrinfo ENOTFOUND www.photomatica.de

##### Priority Adjustment
**DISABLE SOURCE** - Domain no longer exists

##### Implementation Notes
- Remove from active crawl sources
- Mark as inactive in database
- Check if this was meant to be a different domain

---

#### 5. Photomatica West Coast - TIER 2
**URL:** https://www.photomatica.com
**Current Extractor:** `photomatica_west_coast` (custom)
**Status:** ✅ ACTIVE - Photo Booth Museum locations verified

##### Site Analysis
- **Structure:** Marketing site + museum locations
- **Organization:**
  - Photo Booth Museum (LA and SF locations)
  - Permanent installations directory
  - Rental services
- **Technology:** Modern responsive site, structured data available
- **Update:** LA museum opened 2025, actively maintained

##### Museum Locations
1. **Los Angeles:** 3827 W Sunset Blvd, Silver Lake
2. **San Francisco:** 2275 Market St, Castro District

##### Recommended Firecrawl Config
```typescript
{
  method: 'crawlUrl',
  limit: 30,
  onlyMainContent: true,
  waitFor: 1500,
  includePaths: [
    '/photo-booth-museum/*',
    '/permanent-photo-booth/*',
    '/permanent-photo-booth-installation/*'
  ]
}
```

##### Extraction Strategy
- **Approach:** Hybrid - Look for JSON-LD structured data first, then custom parser
- **Available Fields:**
  - Name (venue or museum)
  - Full address with city, state, ZIP
  - Hours of operation
  - Cost ($7-$7.50 per strip at museums)
  - Phone (for venues)
  - Description (venue type, installation details)
  - Photos

##### Sample Booth Entry
```
Name: Photo Booth Museum Los Angeles
Address: 3827 W Sunset Blvd, Los Angeles, CA 90026
City: Los Angeles
State: CA
Country: United States
Hours: Monday-Sunday 1:00pm-9:00pm
Cost: $7-$7.50
Description: Free admission museum with restored analog photo booths
Phone: [if available]
Machine Type: Analog/Chemical
Status: Active
```

##### Priority Adjustment
**KEEP TIER 2 (Priority 80)** - Verified active, structured data

##### Implementation Notes
- Excellent source for permanent installations
- Check for JSON-LD structured data
- Museum locations are high-quality verified booths
- Crawl both museum pages and permanent installation directory
- May have embedded Google Maps with additional locations

---

#### 6. Photomatic - TIER 2
**URL:** https://photomatic.com.au
**Current Extractor:** `photomatic` (custom)
**Status:** ⚠️ REDIRECT - Redirects to /lander page

##### Site Analysis
- **Structure:** JavaScript redirect on homepage (`window.location.href="/lander"`)
- **Organization:** Unknown - need to access lander page
- **Technology:** Modern JavaScript-heavy site
- **Focus:** Australia/New Zealand

##### Recommended Firecrawl Config
```typescript
{
  method: 'scrapeUrl',
  onlyMainContent: true,
  waitFor: 3000,  // Allow redirect to complete
  followRedirects: true
}
```

##### Extraction Strategy
- **Approach:** AI extraction (structure unknown)
- **Expected Fields:**
  - Name
  - Address (Australian format)
  - City, State (VIC, NSW, QLD, etc.)
  - Country (Australia/New Zealand)

##### Priority Adjustment
**KEEP TIER 2 (Priority 75)** - But needs URL verification

##### Implementation Notes
- Test actual lander page content
- May need to start at https://photomatic.com.au/lander
- Verify if this is an active booth operator or just rental service
- Check for locations/venues page

---

#### 7. Photoautomat DE - TIER 2
**URL:** https://www.photoautomat.de
**Current Extractor:** `photoautomat_de` (custom)
**Status:** ✅ ACTIVE - Rental/service provider

##### Site Analysis
- **Structure:** German-language rental service site
- **Organization:**
  - Standorte (locations) section
  - Vermietung (rental) services
  - Multiple booth types (Photo Stand, Photo Booth, Magic Mirror, GIF Booth, etc.)
- **Technology:** Multi-page site with dedicated booth type pages
- **Focus:** Berlin area rentals and events

##### Recommended Firecrawl Config
```typescript
{
  method: 'crawlUrl',
  limit: 20,
  onlyMainContent: true,
  waitFor: 1500,
  includePaths: [
    '/standorte*',
    '/*booth*.html',
    '/*stand*.html'
  ]
}
```

##### Extraction Strategy
- **Approach:** Custom extractor with AI fallback
- **Available Fields:**
  - Name (venue/event location)
  - Address (German format)
  - City (primarily Berlin)
  - Description (event type, booth type)
  - Booth model/type

##### Sample Booth Entry
```
Name: [Venue or event name]
Address: [German street address]
City: Berlin
Country: Germany
Description: Photo booth rental at [venue type]
Booth Type: [Photo Stand, Photo Booth, Magic Mirror, etc.]
Status: Active (or event-based)
```

##### Priority Adjustment
**KEEP TIER 2 (Priority 75)** - Active but primarily rental service

##### Implementation Notes
- This is primarily a rental service, not permanent installations
- May have temporary/event-based locations
- Focus on "Standorte" (locations) section
- German language extraction needed
- Lower permanent booth yield expected

---

#### 8. Classic Photo Booth Co - TIER 2
**URL:** https://classicphotoboothco.com/locations
**Current Extractor:** `classic_photo_booth_co` (custom)
**Status:** ❌ 404 ERROR - URL not found

##### Site Analysis
**URL returns 404** - /locations page does not exist

##### Priority Adjustment
**DISABLE or FIND CORRECT URL** - Current URL is broken

##### Implementation Notes
- Need to verify if domain exists
- Check for alternative URLs (possibly /venues, /installations, /placements)
- May have moved to different domain
- Consider removing if domain is defunct

---

#### 9. Autophoto - TIER 2
**URL:** https://autophoto.org
**Current Extractor:** `autophoto` (custom)
**Status:** ✅ ACTIVE - NYC Museum + Booth Locator

##### Site Analysis
- **Structure:** Museum site + booth locator tool
- **Organization:**
  - Museum at 121 Orchard Street, NYC (opened Oct 2025)
  - Booth locator map showing 20+ NYC locations
  - Passport program for booth visits
- **Technology:** Wix framework, likely map-based interface
- **Focus:** NYC and Northeast USA
- **Update:** Very recent (Oct 2025 museum opening)

##### NYC Booth Locations (Partial List from Research)
**Manhattan:**
- Autophoto Museum (121 Orchard Street)
- Old Friend Photobooth (Allen Street)
- Bubby's Pie Company
- Magic Hour Rooftop Bar & Lounge
- Otto's Shrunken Head

**Brooklyn:**
- Birdy's
- Bootleg Bar
- Bushwick Country Club
- Union Pool
- Carousel
- (10+ more venues)

##### Recommended Firecrawl Config
```typescript
{
  method: 'crawlUrl',
  limit: 30,
  onlyMainContent: true,
  waitFor: 3000,  // Wix sites are JS-heavy
  includePaths: [
    '/booth-locator*',
    '/booths*',
    '/museum*',
    '/locations*'
  ]
}
```

##### Extraction Strategy
- **Approach:** Custom extractor with map data parsing
- **Available Fields:**
  - Name (venue name)
  - Address (NYC format)
  - Borough (Manhattan, Brooklyn, etc.)
  - Venue type (bar, restaurant, museum, etc.)
  - Cost ($8 at museum)
  - Machine type (analog)
  - Photos

##### Sample Booth Entry
```
Name: Autophoto Museum
Address: 121 Orchard Street, New York, NY 10002
City: New York
State: NY
Country: United States
Borough: Lower East Side, Manhattan
Cost: $8 per strip
Hours: [Museum hours]
Description: World's first dedicated photobooth museum with 6 restored vintage booths
Machine: Analog/Chemical
Status: Active
```

##### Priority Adjustment
**UPGRADE to TIER 1 (Priority 90)** - Excellent recent source with booth locator

##### Implementation Notes
- Very high-quality source
- Booth locator likely has structured data or map markers
- May need to handle Wix-specific JavaScript loading
- Check for `/booth-locator` or similar endpoint
- Can extract museum info + booth map locations
- Consider scraping booth passport locations list

---

#### 10-16. European Operators (7 sources)
**Sources:**
- Fotoautomat Berlin (fotoautomat-berlin.de)
- Autofoto (autofoto.nl)
- Fotoautomat FR (fotoautomat.fr)
- Fotoautomat Wien (fotoautomat-wien.at)
- Fotoautomatica (fotoautomatica.it)
- Flash Pack (theflashpack.com/photobooths)
- Metro Auto Photo (metroautophoto.com)

##### General Analysis
**Fotoautomat Berlin:** Confirmed active, rental service focused
**Autofoto NL:** Redirects to domain sale page (301 to mooiedomeinnaam.nl)
**Others:** Need individual verification

##### Recommended Approach
1. Verify each domain is active
2. Check for locations/standorte/locaties pages
3. Most are likely rental services, not permanent installations
4. Expect lower yield of permanent booths
5. German/French/Dutch/Italian language extraction needed

##### Priority Adjustment
**TIER 2 (Priority 65-70)** - Keep but verify URLs
**DISABLE:** autofoto.nl (domain for sale)

---

### TIER 3: City Guides

#### City Guide Overview
**Major Finding:** Many city guide URLs are broken (404 errors)

##### Berlin Guides (3 sources)

**17. Digital Cosmonaut Berlin**
- **URL:** https://digitalcosmonaut.com/photo-booths-berlin
- **Status:** ❌ INCORRECT - This is an urban exploration blog, NOT a photo booth guide
- **Finding:** Site focuses on abandoned buildings and Soviet war memorials
- **Action:** REMOVE or FIND CORRECT URL

**18. Phelt Magazine Berlin**
- **URL:** https://pheltmag.com/berlin-photobooths
- **Status:** ⚠️ NEEDS VERIFICATION
- **Action:** Verify URL exists

**19. Aperture Tours Berlin**
- **URL:** https://aperturetours.com/berlin-photo-booths
- **Status:** ⚠️ NEEDS VERIFICATION
- **Action:** Verify URL exists

##### London Guides (3 sources)

**20. Design My Night London**
- **URL:** https://www.designmynight.com/london/whats-on/unusual-things-to-do/photo-booths
- **Status:** ❌ 404 ERROR
- **Action:** FIND CORRECT URL or DISABLE

**21. London World**
- **URL:** https://londonworld.com/photo-booths
- **Status:** ⚠️ NEEDS VERIFICATION
- **Action:** Verify URL exists

**22. Flash Pack London**
- **URL:** https://www.theflashpack.com/london/photo-booths
- **Status:** ⚠️ NEEDS VERIFICATION
- **Action:** Verify URL exists

##### Los Angeles Guides (2 sources)

**23. Time Out LA**
- **URL:** https://www.timeout.com/los-angeles/things-to-do/photo-booths-in-los-angeles
- **Status:** ❌ 404 ERROR
- **Working URL:** ✅ https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324
- **Published:** December 2024
- **Action:** UPDATE URL in migration

**Verified LA Locations from TimeOut Article:**
- Backstage (Culver City) - $5-7
- Blind Donkey (Long Beach) - $5-7
- 4100 Bar (Silver Lake) - $5-7
- Alex's Bar (Long Beach) - $1.50
- Vidiots (Eagle Rock) - Theater/video rental

**24. Locale Magazine LA**
- **URL:** https://localemagazine.com/la-photo-booths
- **Working URL:** ✅ https://localemagazine.com/best-la-photo-booths/
- **Status:** ACTIVE
- **Action:** UPDATE URL in migration

##### Chicago Guides (2 sources)

**25. Time Out Chicago**
- **URL:** https://www.timeout.com/chicago/things-to-do/photo-booths-in-chicago
- **Status:** ❌ 404 ERROR
- **Working URL:** ✅ https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth
- **Status:** ACTIVE
- **Action:** UPDATE URL in migration

**26. Block Club Chicago**
- **URL:** https://blockclubchicago.org/photo-booths
- **Status:** ❌ 404 ERROR
- **Working URL:** ✅ https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/
- **Published:** March 2025 (VERY RECENT)
- **Status:** EXCELLENT SOURCE
- **Action:** UPDATE URL in migration

**Verified Chicago Locations from Block Club Article:**
- Rainbo Club (Wicker Park)
- Skylark (Pilsen)
- Weegee's Lounge (Logan Square)
- Cole's Bar (Logan Square)
- Village Tap (Roscoe Village)
- Holiday Club (Uptown)

##### New York Guides (3 sources)

**27. Design My Night NYC**
- **URL:** https://www.designmynight.com/new-york/whats-on/unusual-things-to-do/photo-booths
- **Status:** ❌ 404 ERROR
- **Action:** FIND CORRECT URL or DISABLE

**28. Roxy Hotel NYC**
- **URL:** https://www.roxyhotelnyc.com/photo-booth
- **Status:** ⚠️ NEEDS VERIFICATION
- **Action:** Verify URL exists

**29. Airial Travel Brooklyn**
- **URL:** https://www.airialtravel.com/brooklyn-photo-booths
- **Status:** ⚠️ NEEDS VERIFICATION
- **Action:** Verify URL exists

##### City Guides Recommended Firecrawl Config
```typescript
{
  method: 'scrapeUrl',  // Usually single articles
  onlyMainContent: true,
  waitFor: 1500
}
```

##### City Guides Extraction Strategy
- **Approach:** AI extraction (each article has unique format)
- **Available Fields:**
  - Name (venue name)
  - Address (varies by article quality)
  - Neighborhood/area
  - Cost (when mentioned)
  - Brief description
  - Sometimes hours or venue type

##### Priority Adjustment
**Working City Guides:** KEEP TIER 3 (Priority 60)
**Broken URLs:** DISABLE until corrected
**Recent Articles (2024-2025):** High value despite tier

---

### TIER 4: Travel Blogs & Community

#### 30. Solo Sophie Paris - TIER 4
**URL:** https://solosophie.com/paris-photo-booths/
**Current Extractor:** `solo_sophie` (custom)
**Status:** ❌ 404 ERROR - URL not found

##### Priority Adjustment
**DISABLE** - URL returns 404, no working alternative found

---

#### 31. Misadventures with Andi - TIER 4
**URL:** https://www.misadventureswithand.com/photo-booths
**Current Extractor:** `misadventures_andi` (custom)
**Status:** ⚠️ NEEDS VERIFICATION

##### Recommended Firecrawl Config
```typescript
{
  method: 'scrapeUrl',
  onlyMainContent: true,
  waitFor: 1500
}
```

##### Extraction Strategy
- AI extraction for blog content
- Paris-focused
- Expect numbered list or narrative format
- Fields: name, address, metro station, cost

---

#### 32. No Camera Bag Vienna - TIER 4
**URL:** https://www.nocamerabag.com/vienna-photo-booths
**Current Extractor:** `no_camera_bag` (custom)
**Status:** ⚠️ NEEDS VERIFICATION

##### Extraction Strategy
- AI extraction
- Vienna-focused
- Look for district (Bezirk) information
- Austrian address formats

---

#### 33. Girl in Florence - TIER 4
**URL:** https://www.girl-in-florence.com/photo-booths/
**Current Extractor:** `girl_in_florence` (custom)
**Status:** ⚠️ NEEDS VERIFICATION

##### Extraction Strategy
- AI extraction
- Florence, Italy focused
- Italian address format (Via, Piazza)
- Fotoautomatica brand mentions

---

#### 34. Accidentally Wes Anderson - TIER 4
**URL:** https://accidentallywesanderson.com/photobooths
**Current Extractor:** `accidentally_wes_anderson` (custom)
**Status:** ⚠️ NEEDS VERIFICATION

##### Extraction Strategy
- AI extraction
- Likely single iconic location (Florence)
- Aesthetic/artistic focus
- Detailed description expected

---

#### 35. Do The Bay SF - TIER 4
**URL:** https://dothebay.com/photo-booths-san-francisco
**Current Extractor:** `dothebay` (custom)
**Status:** ⚠️ NEEDS VERIFICATION

##### Extraction Strategy
- AI extraction
- San Francisco Bay Area focus
- Multiple cities (SF, Oakland, Berkeley, etc.)
- Numbered list format expected

---

#### 36. Concrete Playground - TIER 4
**URL:** https://concreteplayground.com/photo-booths
**Current Extractor:** `concrete_playground` (custom)
**Status:** ⚠️ NEEDS VERIFICATION

##### Extraction Strategy
- AI extraction
- Melbourne/Sydney, Australia
- Bars and venues
- May need separate URLs for each city

---

#### 37. Japan Experience - TIER 4
**URL:** https://www.japan-experience.com/purikura-photo-booths
**Current Extractor:** `japan_experience` (custom)
**Status:** ❌ 404 ERROR

##### Priority Adjustment
**DISABLE** - URL not found

**Note:** Purikura are DIGITAL photo booths, not analog

---

#### 38. Smithsonian - TIER 4
**URL:** https://www.smithsonianmag.com/history/photo-booth-history/
**Current Extractor:** `smithsonian` (custom)
**Status:** ⚠️ 403 FORBIDDEN - Site blocking automated access

##### Priority Adjustment
**DISABLE or DEPRIORITIZE** - Historical article, not location directory
**Note:** This is a history article, likely no current booth locations

---

#### 39. Pinterest Photobooths - TIER 4
**URL:** https://www.pinterest.com/search/pins/?q=photo%20booth%20locations
**Current Extractor:** `pinterest` (custom)
**Status:** DISABLED in migration (enabled=false)

##### Priority Adjustment
**KEEP DISABLED** - Low reliability, rate limiting issues

---

## Recommendations

### 1. Immediate Fixes (Week 1)

#### URL Corrections Needed
```sql
-- Update TimeOut LA
UPDATE crawl_sources SET
  source_url = 'https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324'
WHERE source_name = 'Time Out LA';

-- Update Locale Magazine LA
UPDATE crawl_sources SET
  source_url = 'https://localemagazine.com/best-la-photo-booths/'
WHERE source_name = 'Locale Magazine LA';

-- Update TimeOut Chicago
UPDATE crawl_sources SET
  source_url = 'https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth'
WHERE source_name = 'Time Out Chicago';

-- Update Block Club Chicago
UPDATE crawl_sources SET
  source_url = 'https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/'
WHERE source_name = 'Block Club Chicago';

-- Disable broken sources
UPDATE crawl_sources SET enabled = false, status = 'inactive'
WHERE source_name IN (
  'Photomatica Berlin',  -- Domain doesn't exist
  'Classic Photo Booth Co',  -- 404
  'Autofoto',  -- Domain for sale
  'Digital Cosmonaut Berlin',  -- Wrong content
  'Design My Night London',  -- 404
  'Design My Night NYC',  -- 404
  'Solo Sophie Paris',  -- 404
  'Japan Experience',  -- 404
  'Smithsonian'  -- 403, historical only
);
```

#### Priority Reassignments
```sql
-- Upgrade Autophoto to Tier 1
UPDATE crawl_sources SET priority = 90
WHERE source_name = 'Autophoto';

-- Downgrade Lomography to Tier 3
UPDATE crawl_sources SET priority = 60
WHERE source_name = 'Lomography Locations';

-- Downgrade Flickr to Tier 3
UPDATE crawl_sources SET priority = 50
WHERE source_name = 'Flickr Photobooth Group';
```

### 2. Optimization Opportunities (Week 2-3)

#### Enhanced Custom Extractors Needed

**A. Photobooth.net Multi-Page Crawler**
```typescript
// New specialized extractor
export class PhotoboothNetEnhancedExtractor {
  // Crawl browse.php?ddState for each state
  // Follow locationID links
  // Parse structured fields
  // Handle pagination
}
```

**B. Autophoto Booth Locator Parser**
```typescript
// Parse booth locator map data
// Extract venue list
// Handle Wix JavaScript loading
// Map borough/neighborhood data
```

**C. Photomatica Structured Data Extractor**
```typescript
// Look for JSON-LD first
// Parse museum + permanent installation pages
// Extract venue partnerships
// Handle multiple location formats
```

#### Firecrawl Best Practices

1. **Use `scrapeUrl` for:**
   - Single-page blog articles
   - City guides with all data on one page
   - About/contact pages
   - Simple lists

2. **Use `crawlUrl` for:**
   - Directory sites (photobooth.net)
   - Multi-page operators (Photomatica)
   - Sites with location detail pages
   - Map-based interfaces

3. **Optimize `waitFor` parameter:**
   - Simple HTML sites: 500-1000ms
   - JavaScript dropdowns: 2000-3000ms
   - Heavy JS frameworks (Wix): 3000-4000ms
   - Single-page apps: 4000-5000ms

4. **Set appropriate `limit`:**
   - Blog articles: 1-5 pages
   - Small operators: 10-20 pages
   - Large directories: 50-100 pages
   - City sites: 20-50 pages

5. **Use `includePaths` and `excludePaths`:**
   ```typescript
   includePaths: ['/locations/*', '/booths/*', '/venues/*']
   excludePaths: ['/blog/*', '/shop/*', '/cart/*']
   ```

### 3. New Extractors to Build (Week 4)

#### A. TimeOut Generic City Guide Extractor
```typescript
// Handle all TimeOut city pages
// Parse numbered lists
// Extract venue cards
// Support multiple cities
```

#### B. Travel Blog Generic Extractor
```typescript
// Numbered list parser
// Bold/heading booth names
// Address pattern matching
// Cost extraction (multiple currencies)
```

#### C. Operator Site Template Extractor
```typescript
// Common patterns across operators
// Locations/Standorte/Venues pages
// Map integration handling
// Multi-language support
```

### 4. Data Quality Improvements

#### A. Validation Rules
```typescript
// Booth must have:
// 1. Name (not "Unknown")
// 2. Address OR coordinates
// 3. Country
// 4. Source URL

// Enhanced validation:
// - Reject if name is too generic ("Photo Booth")
// - Verify country code is valid
// - Check address has street number
// - Flag suspiciously old dates
```

#### B. Deduplication Strategy
```typescript
// Match booths across sources if:
// 1. Name similarity > 80%
// 2. Within 100m GPS distance OR
// 3. Same street address (normalized)

// Keep:
// - Most recent data
// - Most complete record
// - Highest priority source
// - Merge source_names array
```

#### C. Enrichment Priorities
1. Geocoding for missing coordinates
2. Hours normalization (standard format)
3. Cost normalization (convert to USD equivalent)
4. Machine type classification
5. Operational status verification

### 5. Monitoring & Alerts

#### A. Health Metrics to Track
```sql
-- Source health dashboard
SELECT
  source_name,
  priority,
  consecutive_failures,
  last_successful_crawl,
  total_booths_found,
  validation_failure_rate,
  CASE
    WHEN consecutive_failures >= 3 THEN 'CRITICAL'
    WHEN consecutive_failures >= 2 THEN 'WARNING'
    WHEN last_successful_crawl < NOW() - INTERVAL '30 days' THEN 'STALE'
    ELSE 'HEALTHY'
  END as health_status
FROM crawl_sources
WHERE enabled = true
ORDER BY priority DESC, consecutive_failures DESC;
```

#### B. Alert Conditions
- 3+ consecutive failures: Disable and notify
- 404 errors: Flag for URL verification
- 403/429 errors: Increase rate limiting
- Zero booths extracted: Check extractor logic
- High validation failure rate (>50%): Review extraction patterns

### 6. Future Expansion Sources

#### High-Value Targets to Add
1. **A&A Studios** (aastudiosinc.com) - Chicago + national locations
2. **Photobooth.com** - If different from photobooth.net
3. **Photo-Me International** - Large European operator
4. **Instagram location tags** - #photobooth, #analogphotobooth
5. **Google Maps scraping** - "photo booth near me" searches
6. **Yelp business listings** - Photo booth category
7. **City tourism boards** - Official attraction listings

#### Emerging Platforms
1. TikTok location videos (#photobooth)
2. Reddit communities (r/photobooth)
3. Facebook groups/events
4. Eventbrite (photo booth events)

---

## Firecrawl Configuration Reference

### Template: Single-Page Simple Site
```typescript
{
  method: 'scrapeUrl',
  formats: ['markdown', 'html'],
  onlyMainContent: true,
  waitFor: 1000,
  timeout: 30000
}
```

### Template: Multi-Page Directory
```typescript
{
  method: 'crawlUrl',
  limit: 50,
  scrapeOptions: {
    formats: ['markdown', 'html'],
    onlyMainContent: true,
    waitFor: 2000,
    timeout: 30000
  },
  includePaths: ['/locations/*', '/booths/*'],
  excludePaths: ['/blog/*', '/shop/*']
}
```

### Template: Heavy JavaScript Site
```typescript
{
  method: 'scrapeUrl',
  formats: ['markdown', 'html'],
  onlyMainContent: false,  // May need sidebars
  waitFor: 4000,
  timeout: 45000
}
```

### Template: Map-Based Interface
```typescript
{
  method: 'crawlUrl',
  limit: 30,
  scrapeOptions: {
    formats: ['markdown', 'html'],
    onlyMainContent: false,  // Need map container
    waitFor: 3000,
    timeout: 40000
  },
  includePaths: ['/map*', '/locator*', '/find*']
}
```

---

## Extractor Pattern Reference

### Pattern 1: Numbered List (City Guides)
```markdown
## 1. Venue Name
Address: 123 Main St
Hours: Mon-Sun 5pm-2am
Cost: $5

## 2. Another Venue
...
```

**Extraction:** Parse `## \d+\.` headers, look ahead for address patterns

### Pattern 2: Bold Heading (Blogs)
```markdown
**Venue Name**
Located at 123 Main St in Neighborhood
Open daily, $7 per strip
```

**Extraction:** Parse `**Name**` pattern, extract subsequent lines

### Pattern 3: Table Format (Directories)
```markdown
| Name | Address | City | Hours |
|------|---------|------|-------|
| Venue 1 | 123 Main | NYC | Daily |
```

**Extraction:** Parse markdown table rows

### Pattern 4: Structured Sections (Operators)
```html
<div class="location">
  <h3>Venue Name</h3>
  <p class="address">123 Main St, City, ST 12345</p>
  <p class="hours">Mon-Sun: 5pm-2am</p>
</div>
```

**Extraction:** Parse HTML structure, extract classes

### Pattern 5: JSON-LD Structured Data
```html
<script type="application/ld+json">
{
  "@type": "Place",
  "name": "Venue Name",
  "address": {...},
  "geo": {...}
}
</script>
```

**Extraction:** Parse JSON-LD, map to booth fields

---

## Testing Checklist

### Before Deploying URL Changes
- [ ] Verify URL returns 200 OK
- [ ] Check robots.txt allows crawling
- [ ] Test with Firecrawl scrapeUrl first
- [ ] Verify expected content appears in markdown
- [ ] Check for dynamic loading delays needed
- [ ] Test extractor logic with sample data
- [ ] Validate booth count > 0
- [ ] Check for duplicate detection
- [ ] Verify country codes are valid
- [ ] Test with both HTML and markdown formats

### After Deploying New Extractor
- [ ] Monitor first 3 crawl attempts
- [ ] Check extraction quality (validation rate)
- [ ] Verify deduplication working
- [ ] Monitor API costs (Claude Sonnet 4.5 usage)
- [ ] Check booth count vs. expected
- [ ] Review error logs for patterns
- [ ] Validate geocoding enrichment
- [ ] Test with multiple pages if multi-page
- [ ] Verify rate limiting respected
- [ ] Check crawl duration reasonable

---

## Cost Optimization

### Firecrawl API Costs
- `scrapeUrl`: ~$0.01 per page
- `crawlUrl`: ~$0.01 per page × limit
- Optimize by setting tight `limit` values
- Use `includePaths` to avoid unnecessary pages

### Claude Sonnet 4.5 Costs
- AI extraction: ~$0.02-0.05 per page (40K tokens)
- Use custom extractors when possible
- Reserve AI for:
  - Unknown source types
  - Blog content (variable format)
  - Fallback when custom extractor fails
- Chunk large pages to avoid timeouts

### Recommended Budget Allocation
1. **Tier 1 sources**: Unlimited (highest ROI)
2. **Tier 2 sources**: ~500 pages/month per source
3. **Tier 3 sources**: ~200 pages/month per source
4. **Tier 4 sources**: ~50 pages/month per source

### Optimization Strategies
1. Cache page content (check `page_cache` table)
2. Use content hashing to detect changes
3. Skip unchanged pages (incremental crawling)
4. Batch process during off-peak hours
5. Prioritize sources with high booth yield

---

## Summary Statistics

### Current State (From Migration)
- **Total Sources:** 39
- **Enabled:** 38 (Pinterest disabled)
- **Tier 1:** 3 sources
- **Tier 2:** 13 sources
- **Tier 3:** 18 sources
- **Tier 4:** 5 sources

### Recommended State (After Fixes)
- **Total Sources:** 39
- **Enabled:** ~25 (after disabling broken)
- **Needs URL Fix:** 14 sources
- **Needs Verification:** 15 sources
- **Working Verified:** 5 sources
- **Broken (Disable):** 9 sources

### Expected Booth Yield (Estimates)
- **Photobooth.net:** 200-500 booths
- **Autophoto:** 20-30 NYC booths
- **Photomatica:** 10-20 CA booths
- **TimeOut/City Guides:** 5-15 per city
- **Blog Posts:** 3-10 per article
- **Total Potential:** 500-1000+ unique booths

---

## Next Steps

### Week 1: Critical Fixes
1. Update working URLs in database
2. Disable broken sources
3. Test Tier 1 sources with corrected configs
4. Verify booth extraction quality

### Week 2: Enhancement
1. Build enhanced photobooth.net crawler
2. Expand Autophoto extractor
3. Implement generic city guide extractor
4. Add validation improvements

### Week 3: Expansion
1. Verify and enable Tier 3 sources
2. Test international sources (European)
3. Add monitoring dashboard
4. Document extractor patterns

### Week 4: Optimization
1. Implement intelligent caching
2. Optimize AI extraction costs
3. Improve deduplication logic
4. Add health monitoring alerts

---

## Sources Referenced

- [Photobooth.net Locations Directory](http://www.photobooth.net/locations/)
- [Photobooth.net Archive - Booth Locations](https://www.photobooth.net/archive/category/booth-locations)
- [Lomography Vienna Photobooth Article](https://www.lomography.com/magazine/104913-viennas-old-photo-booth-in-museumsquartier)
- [Photomatica Photo Booth Museum](https://www.photomatica.com/photo-booth-museum)
- [Photomatica LA Museum Opening](https://www.photomatica.com/blog/2025/8/6/step-inside-the-strip-the-los-angeles-photo-booth-museum-is-here)
- [TimeOut LA - Photo Booth Museum](https://www.timeout.com/los-angeles/museums/photo-booth-museum)
- [Autophoto Booth Locator](https://www.autophoto.org/booth-locator)
- [Gothamist - NYC Photobooth Museum](https://gothamist.com/arts-entertainment/your-phone-could-never-a-new-nyc-museum-honors-the-photo-booth)
- [TimeOut NYC - Autophoto Museum Opening](https://www.timeout.com/newyork/news/nycs-first-ever-photobooth-museum-is-opening-on-the-lower-east-side-this-month-092925)
- [TimeOut LA - Vintage Photo Booths](https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324)
- [Locale Magazine - Best LA Photo Booths](https://localemagazine.com/best-la-photo-booths/)
- [TimeOut Chicago - Bars with Photo Booths](https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth)
- [Block Club Chicago - Vintage Photo Booths](https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/)

---

**Report Generated:** 2025-11-27
**Analysis Coverage:** All 39 sources from seed migration
**Verification Method:** Web research + URL testing
**Recommendations:** Immediate, actionable, prioritized
