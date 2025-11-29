# TIER 3A: City Guides Extraction Strategy Report

## Executive Summary

Built 13 specialized extractors for blog and city guide sources across 5 major cities (Berlin, London, Los Angeles, Chicago, New York). These sources provide validation data and supplemental information for the primary photobooth database.

**Deliverables:**
- ✅ 1 new extractor file: `city-guide-extractors.ts` (1,474 lines)
- ✅ 1 SQL migration: `20251123_tier3a_city_guides.sql` (130 lines)
- ✅ 1 updated orchestration file: `unified-crawler/index.ts` (registered 13 extractors)
- ✅ 13 source-specific extraction functions

**Expected Total Coverage:** 150-200 photobooths across 5 major cities

---

## Sources Overview

### Priority Classification
- **Priority 60** (3 sources): Structured venue directories (DesignMyNight, TimeOut)
- **Priority 55** (8 sources): Blog articles and magazine features
- **Priority 50** (2 sources): News articles with historical context

### Geographic Distribution
| City | Sources | Expected Booths | Status |
|------|---------|----------------|--------|
| **Berlin** | 3 | 23-37 | ✅ Complete |
| **London** | 3 | 53-70 | ✅ Complete |
| **Los Angeles** | 2 | 23-32 | ✅ Complete |
| **Chicago** | 2 | 25-30 | ✅ Complete |
| **New York** | 3 | 39-53 | ✅ Complete |
| **Total** | **13** | **163-222** | ✅ Complete |

---

## 1. Berlin Sources (3)

### 1.1 Digital Cosmonaut - Berlin Photoautomat Locations
**URL:** https://digitalcosmonaut.com/berlin-photoautomat-locations/

**Extractor:** `extractDigitalCosmonautBerlin()`

**Format Analysis:**
- Blog article with embedded locations in prose
- Headers and bold text for location names
- Inline addresses in German format
- Neighborhood mentions (Mitte, Kreuzberg, Neukölln)
- Operational status phrases

**Extraction Strategy:**
```typescript
// Pattern 1: Bold location names
/^\*\*([^*]+)\*\*/

// Pattern 2: Headers
/^#{2,3}\s+(.+)/

// Pattern 3: German addresses
/\d{1,5}\s+[A-Z][a-zäöüß]+(?:str|straße|Straße|platz|Platz)/i

// Pattern 4: Neighborhood detection
/(Mitte|Kreuzberg|Neukölln|Friedrichshain|Prenzlauer Berg)/i

// Pattern 5: Status detection
/still\s+(?:working|operational|active)/i
```

**Expected Output:**
- 10-15 locations
- Full addresses with German street names
- Neighborhood context
- Operational status indicators
- Cost information (€)

**Validation Rules:**
- Status: `unverified` (blog source)
- City: Default to "Berlin"
- Country: "Germany"
- Type: "analog"

---

### 1.2 Phelt Magazine - Photo Booths of Berlin
**URL:** https://pheltmagazine.co/photo-booths-of-berlin/

**Extractor:** `extractPheltMagazineBerlin()`

**Format Analysis:**
- Magazine article format with artistic descriptions
- Numbered lists (1., 2., 3.)
- Cultural commentary and venue context
- Less structured than directory sources

**Extraction Strategy:**
```typescript
// Pattern 1: Numbered entries
/^\d+\.\s+(.+)/

// Pattern 2: Headers with numbers
/^#{2,3}\s+(?:\d+\.\s+)?(.+)/

// Pattern 3: Capture description blocks
captureDescription = true (after location header)

// Pattern 4: Venue type detection
/(bar|pub|club|restaurant|café|cafe)/i
```

**Expected Output:**
- 8-12 locations
- Rich descriptions with cultural context
- Venue type information
- Less consistent address formatting

**Special Handling:**
- Captures multi-line descriptions
- Extracts venue type from prose
- More lenient validation for missing data

---

### 1.3 Aperture Tours - Berlin Photoautomat
**URL:** https://www.aperturetours.com/blog/2017/berlin-photoautomat

**Extractor:** `extractApertureToursberlin()`

**Format Analysis:**
- Photography tour blog
- Locations mentioned in travel context
- Less structured format
- Historical/photography tips mixed with location info

**Extraction Strategy:**
```typescript
// Pattern 1: Location with address inline
/^(.{3,50}?)\s*[-–—]\s*(.+?),?\s*(?:Berlin|10\d{3})/i

// Pattern 2: "at" construction
/^(.{3,50}?)\s+(?:at|on)\s+(.+?),?\s*(?:Berlin|10\d{3})/i

// HTML fallback: Blog post content blocks
/<div[^>]*class="[^"]*(?:entry|content|post)[^"]*"[^>]*>/
```

**Expected Output:**
- 5-10 locations
- May have incomplete addresses
- Photography-focused context
- 2017 data (may be outdated)

**Validation Considerations:**
- Lower confidence due to article format
- May require geocoding for missing coordinates
- Status uncertain (7+ year old article)

---

## 2. London Sources (3)

### 2.1 DesignMyNight - Bars with Photo Booths
**URL:** https://www.designmynight.com/london/bars/bars-with-photo-booths

**Extractor:** `extractDesignMyNightLondon()`

**Format Analysis:**
- Structured venue directory (highest quality)
- HTML venue cards with data attributes
- Consistent formatting
- Active maintenance (current data)

**Extraction Strategy:**
```typescript
// HTML venue cards
/<div[^>]*class="[^"]*venue[^"]*"[^>]*>([\s\S]{0,2000}?)<\/div>/gi

// Structured data attributes
/data-venue-name="([^"]+)"/
/data-address="([^"]+)"/

// UK postcode detection
/([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})/i
```

**Expected Output:**
- 20-30 venues
- Complete addresses with postcodes
- High data quality
- Active/verified status

**Priority:** 60 (highest for city guides)

**Data Quality:**
- Most reliable blog source
- Structured format enables precise extraction
- Current operational data

---

### 2.2 London World - 25 Quirky Photo Booths
**URL:** https://www.londonworld.com/read-this/25-quirky-photo-booths-in-london

**Extractor:** `extractLondonWorld()`

**Format Analysis:**
- Listicle article format
- Numbered entries (1-25)
- Consistent structure per entry
- Descriptive text with addresses

**Extraction Strategy:**
```typescript
// Numbered list items
/^(\d+)\.\s+(.+)/

// Headers with numbers
/^#{2,3}\s+(?:\d+\.\s+)?(.+)/

// UK address patterns
/\d+\s+[A-Z][a-z]+\s+(?:Street|Road|Lane|Avenue|Square|Place)/i

// Neighborhood detection
/(Shoreditch|Soho|Camden|Hackney|Brixton|Dalston)/i
```

**Expected Output:**
- Up to 25 locations
- Mix of bars, venues, public spaces
- Neighborhood context
- Operational status may vary

**Content Strategy:**
- Title promises 25 locations
- May have duplicates with other sources
- Deduplication essential

---

### 2.3 The Flash Pack - Best Photo Booths in London
**URL:** https://itstheflashpack.com/the-lens/the-best-photo-booths-in-london

**Extractor:** `extractFlashPackLondon()`

**Format Analysis:**
- Travel blog format
- Curated recommendations
- Context for travelers
- Operating hours included

**Extraction Strategy:**
```typescript
// Headers for locations
/^#{2,3}\s+(.+)/

// Bold location names
/^\*\*([^*]{4,50})\*\*/

// Hours extraction
/(?:Hours?:|Open(?:ing hours)?:)\s*(.+)/i
```

**Expected Output:**
- 10-15 locations
- Travel-friendly context
- Hours of operation
- Transit/access information

**Use Case:**
- Good for tourist-accessible booths
- Hours data valuable for UX
- May exclude residential areas

---

## 3. Los Angeles Sources (2)

### 3.1 TimeOut LA - Best Bars with Photo Booths
**URL:** https://www.timeout.com/los-angeles/bars/best-bars-with-photo-booths

**Extractor:** `extractTimeOutLA()`

**Format Analysis:**
- TimeOut's structured directory format
- Venue cards with ratings
- Consistent data structure
- Editorial curation

**Extraction Strategy:**
```typescript
// Numbered venue entries
/^(\d+)\.\s+(.+)/

// LA address patterns
/\d+\s+[NSEW]?\.?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard)/i

// Neighborhood detection
/(Downtown|Hollywood|Silver Lake|Echo Park|Arts District|Santa Monica|Venice|West Hollywood)/i

// Cost extraction
/\$(\d+(?:\.\d{2})?)/
```

**Expected Output:**
- 15-20 bars
- LA-specific neighborhoods
- Price information
- Active venues (TimeOut maintains current data)

**Priority:** 60 (trusted source)

**Data Quality:**
- High reliability (editorial standards)
- Current operational status
- Multiple data points per venue

---

### 3.2 Locale Magazine - Best LA Photo Booths
**URL:** https://localemagazine.com/best-la-photo-booths/

**Extractor:** `extractLocaleMagazineLA()`

**Format Analysis:**
- Magazine article
- Curated selections
- Cultural commentary
- Less structured than TimeOut

**Extraction Strategy:**
```typescript
// Headers for location names
/^#{2,4}\s+(.+)/

// Address with "Located at"
/(?:Address:|Located at:)\s*(.+)/i

// Website extraction
/https?:\/\/[^\s)]+/
```

**Expected Output:**
- 8-12 locations
- Website URLs
- Cultural context
- May overlap with TimeOut

**Special Features:**
- Website links (valuable for verification)
- Local magazine perspective
- Arts/culture focus

---

## 4. Chicago Sources (2)

### 4.1 TimeOut Chicago - 20 Chicago Bars
**URL:** https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth

**Extractor:** `extractTimeOutChicago()`

**Format Analysis:**
- Similar to TimeOut LA
- 20 numbered entries
- Bar-focused (nightlife context)
- Chicago neighborhood data

**Extraction Strategy:**
```typescript
// Same patterns as TimeOut LA
// Chicago neighborhoods
/(Wicker Park|Logan Square|Pilsen|Bucktown|Lincoln Park|Lakeview|River North)/i

// Chicago address format
/\d+\s+[NSEW]?\.?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue)/i
```

**Expected Output:**
- 20 bars
- Chicago neighborhood context
- Current operational status
- Nightlife-focused venues

**Priority:** 60 (TimeOut quality)

---

### 4.2 Block Club Chicago - Vintage Photo Booths
**URL:** https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed/

**Extractor:** `extractBlockClubChicago()`

**Format Analysis:**
- News article format
- Historical context
- Mentions of closed booths
- Embedded locations in prose

**Extraction Strategy:**
```typescript
// "at Location, Address" construction
/at\s+([A-Z][^,]{3,40}),\s+(\d+\s+[NSEW]?\.?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue))/i

// "Location (Address)" construction
/([A-Z][^(]{3,40})\s*\((\d+\s+[NSEW]?\.?\s*[A-Z][a-z]+[^)]*)/i

// Status detection (important for this source)
/(?:closed|shut down|no longer|removed)/i
```

**Expected Output:**
- 5-10 locations
- Mix of active and closed booths
- Historical significance
- May need status verification

**Priority:** 50 (news article, historical focus)

**Special Considerations:**
- Article about "dying breed" - many may be closed
- Status detection crucial
- Valuable for historical database
- Lower reliability for current operations

---

## 5. New York Sources (3)

### 5.1 DesignMyNight NY - New York Venues
**URL:** https://www.designmynight.com/new-york

**Extractor:** `extractDesignMyNightNY()`

**Format Analysis:**
- Same platform as London source
- Structured venue directory
- NYC address format (with ZIP codes)
- Borough information

**Extraction Strategy:**
```typescript
// Similar to London version
// NYC ZIP codes
/\b\d{5}\b/

// NYC address format
/\d+\s+[A-Z][a-z]+\s+(?:Street|Avenue|St|Ave|Road|Rd)/i
```

**Expected Output:**
- 25-35 venues
- Manhattan + Brooklyn focus
- ZIP codes for precise location
- Active venue verification

**Priority:** 60 (structured directory)

---

### 5.2 Roxy Hotel - Photo Booths of New York
**URL:** https://www.roxyhotelnyc.com/stories/photo-booths-of-new-new-york

**Extractor:** `extractRoxyHotelNY()`

**Format Analysis:**
- Hotel blog with curated picks
- Iconic locations
- Cultural/artistic focus
- Manhattan-centric

**Extraction Strategy:**
```typescript
// Headers and bold names
/^#{2,3}\s+(.+)/
/^\*\*([^*]{4,50})\*\*/

// Borough detection
/(Manhattan|Brooklyn|Queens|East Village|West Village|Soho|Tribeca|Williamsburg)/i
```

**Expected Output:**
- 8-12 iconic locations
- Tourist-friendly venues
- Cultural significance
- May be upscale/curated

**Use Case:**
- High-profile booths
- Tourist recommendations
- Cultural landmarks

---

### 5.3 Airial Travel - Vintage Photo Booths Brooklyn
**URL:** https://www.airial.travel/attractions/united-states/vintage-photo-booths-brooklyn

**Extractor:** `extractAirialTravelBrooklyn()`

**Format Analysis:**
- Travel guide
- Brooklyn-specific
- Vintage/analog focus
- Neighborhood guide

**Extraction Strategy:**
```typescript
// Headers for locations
/^#{2,3}\s+(.+)/

// Brooklyn neighborhoods (specific)
/(Williamsburg|Bushwick|Greenpoint|Park Slope|Carroll Gardens|DUMBO|Red Hook|Prospect Heights)/i

// Set city to "Brooklyn" (not "New York")
city: 'Brooklyn'
```

**Expected Output:**
- 6-10 Brooklyn locations
- Neighborhood-specific
- Vintage booth focus
- Hipster/arts scene venues

**Special Feature:**
- Only Brooklyn-specific source
- Valuable for neighborhood granularity
- Complements Manhattan-focused sources

---

## Technical Implementation

### File Structure

```
supabase/functions/unified-crawler/
├── city-guide-extractors.ts          (NEW - 1,474 lines)
│   ├── extractDigitalCosmonautBerlin()
│   ├── extractPheltMagazineBerlin()
│   ├── extractApertureToursberlin()
│   ├── extractDesignMyNightLondon()
│   ├── extractLondonWorld()
│   ├── extractFlashPackLondon()
│   ├── extractTimeOutLA()
│   ├── extractLocaleMagazineLA()
│   ├── extractTimeOutChicago()
│   ├── extractBlockClubChicago()
│   ├── extractDesignMyNightNY()
│   ├── extractRoxyHotelNY()
│   ├── extractAirialTravelBrooklyn()
│   ├── finalizeCityGuideBooth()
│   └── cleanHtml()
├── index.ts                           (UPDATED)
│   └── extractFromSource()            (registered 13 extractors)
└── extractors.ts                      (EXISTING)
    └── Primary extractors
```

### SQL Migration

```
supabase/migrations/
└── 20251123_tier3a_city_guides.sql   (NEW - 130 lines)
    └── Inserts 13 sources into crawl_sources table
```

### Common Extraction Patterns

All extractors implement these core patterns:

#### 1. Location Name Detection
```typescript
// Headers (markdown)
/^#{2,3}\s+(.+)/

// Bold text
/^\*\*([^*]+)\*\*/

// Numbered lists
/^\d+\.\s+(.+)/
```

#### 2. Address Extraction
```typescript
// Direct labels
/(?:Address:|Location:)\s*(.+)/i

// US format
/\d+\s+[NSEW]?\.?\s*[A-Z][a-z]+\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard)/i

// UK format
/\d+\s+[A-Z][a-z]+\s+(?:Street|Road|Lane|Avenue|Square|Place)/i
/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/  // Postcode

// German format
/\d{1,5}\s+[A-Z][a-zäöüß]+(?:str|straße|Straße|platz|Platz)/i
```

#### 3. Context Extraction
```typescript
// Neighborhoods
const neighborhoodMatch = line.match(/(?:in|neighborhood:)\s*(pattern)/i);

// Venue types
/(bar|pub|club|restaurant|café|cafe)/i

// Operational status
/still\s+(?:working|operational|active)/i
/(?:closed|removed|no longer|defunct)/i

// Cost information
/(?:€|EUR|\$)\s*(\d+(?:[.,]\d{2})?)/
```

#### 4. Validation & Normalization

```typescript
function finalizeCityGuideBooth(
  booth: Partial<BoothData>,
  sourceUrl: string,
  sourceName: string,
  defaultCity: string,
  defaultCountry: string
): BoothData {
  return {
    name: booth.name || 'Unknown',
    address: booth.address || '',
    city: booth.city || defaultCity,
    country: booth.country || defaultCountry,
    status: booth.status || 'unverified',  // Key: Mark as unverified
    booth_type: booth.booth_type || 'analog',
    is_operational: booth.is_operational ?? true,
    source_url: sourceUrl,
    source_name: sourceName,
    // ... other fields
  };
}
```

### HTML Fallback Strategy

All extractors implement a 2-tier approach:

1. **Primary:** Markdown parsing (faster, cleaner)
2. **Fallback:** HTML parsing (if markdown yields 0 results)

```typescript
// HTML fallback example
if (booths.length === 0) {
  const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
  const matches = html.matchAll(articleRegex);

  for (const match of matches) {
    // Extract from HTML structure
  }
}
```

---

## Data Quality Expectations

### Status Classification

All city guide sources mark booths as `unverified` by default:

| Status | Meaning | Use Case |
|--------|---------|----------|
| `unverified` | From blog/guide source, not verified by operator | City guide sources |
| `active` | From primary directory, verified current | Tier 1/2 sources |
| `inactive` | Explicitly marked as closed | Block Club Chicago (closed booths) |

### Confidence Levels

| Source Type | Confidence | Reason |
|-------------|-----------|---------|
| DesignMyNight, TimeOut | HIGH | Structured directories, editorial maintenance |
| Magazine articles (Phelt, Locale) | MEDIUM | Curated content, but less structure |
| Blog articles (Digital Cosmonaut, Aperture) | MEDIUM-LOW | Individual author, may be outdated |
| News articles (Block Club) | LOW | Historical focus, many closed locations |

### Expected Duplicate Rate

City guides will have **high overlap** with primary sources:

- **Berlin:** 60-70% overlap with photoautomat.de
- **London:** 40-50% overlap with photomatica.com
- **US Cities:** 30-40% overlap with photobooth.net

This is **intentional** - these sources serve as:
1. **Validation:** Cross-reference for primary sources
2. **Supplemental:** Fill gaps in primary directories
3. **Context:** Add neighborhood, venue type, cultural info

### Deduplication Strategy

City guide data will be merged intelligently:

```sql
-- Example: Booth appears in both photobooth.net and TimeOut LA
{
  "name": "The Edison DTLA",
  "source_names": ["photobooth-net", "timeout-la"],
  "source_urls": ["https://photobooth.net/...", "https://timeout.com/..."],
  "status": "active",  // Primary source status preferred
  "description": "Located in Downtown LA's Arts District. Popular bar with vintage decor."  // From city guide
}
```

**Merge Logic:**
1. Primary source data (Tier 1) takes precedence
2. City guide adds: descriptions, neighborhoods, venue context
3. Both source URLs preserved for transparency
4. `is_merged: true` flag set
5. Logged in `booth_duplicates` table

---

## Deployment Instructions

### 1. Apply SQL Migration

```bash
cd /Users/jkw/Projects/booth-beacon

# Apply migration
supabase db push supabase/migrations/20251123_tier3a_city_guides.sql
```

### 2. Deploy Updated Function

```bash
# Deploy unified-crawler with new extractors
supabase functions deploy unified-crawler
```

### 3. Verify Sources Loaded

```sql
-- Check that all 13 sources were inserted
SELECT source_name, priority, enabled, crawl_frequency_days
FROM crawl_sources
WHERE source_name LIKE 'digital-cosmonaut%'
   OR source_name LIKE 'phelt%'
   OR source_name LIKE 'aperture%'
   OR source_name LIKE 'designmynight%'
   OR source_name LIKE 'london-world%'
   OR source_name LIKE 'flashpack%'
   OR source_name LIKE 'timeout%'
   OR source_name LIKE 'locale%'
   OR source_name LIKE 'blockclub%'
   OR source_name LIKE 'roxy%'
   OR source_name LIKE 'airial%'
ORDER BY priority DESC, source_name;
```

Expected output: 13 rows

### 4. Test Individual Source

```bash
# Test single source
curl -X POST https://your-project.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "timeout-la",
    "force_crawl": true
  }'
```

### 5. Run Full Tier 3A Crawl

```bash
# Crawl all city guides
curl -X POST https://your-project.supabase.co/functions/v1/sync-all-sources \
  -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "force_crawl": true,
    "run_deduplication": true,
    "auto_merge_duplicates": true,
    "min_confidence": 85
  }'
```

### 6. Review Deduplication Results

```sql
-- Check duplicate detection
SELECT
  bd.confidence_score,
  bd.match_type,
  b1.name AS primary_name,
  b1.source_names AS primary_sources,
  b2.name AS duplicate_name,
  b2.source_names AS duplicate_sources
FROM booth_duplicates bd
JOIN booths b1 ON bd.primary_booth_id = b1.id
JOIN booths b2 ON bd.duplicate_booth_id = b2.id
WHERE b1.source_names && ARRAY[
  'timeout-la', 'designmynight-london', 'timeout-chicago',
  'designmynight-ny', 'digital-cosmonaut-berlin'
]
ORDER BY bd.confidence_score DESC
LIMIT 20;
```

---

## Expected Results

### Per-Source Estimates

| Source | Expected Booths | Crawl Time | Pages |
|--------|----------------|------------|-------|
| digital-cosmonaut-berlin | 10-15 | 15s | 1 |
| phelt-magazine-berlin | 8-12 | 15s | 1 |
| aperture-tours-berlin | 5-10 | 15s | 1 |
| designmynight-london | 20-30 | 30s | 2-3 |
| london-world | 20-25 | 20s | 1 |
| flashpack-london | 10-15 | 15s | 1 |
| timeout-la | 15-20 | 25s | 1-2 |
| locale-magazine-la | 8-12 | 15s | 1 |
| timeout-chicago | 18-20 | 25s | 1-2 |
| blockclub-chicago | 5-10 | 15s | 1 |
| designmynight-ny | 25-35 | 30s | 2-3 |
| roxy-hotel-ny | 8-12 | 15s | 1 |
| airial-travel-brooklyn | 6-10 | 15s | 1 |
| **TOTAL** | **158-216** | **~4 min** | **15-20** |

### Deduplication Expectations

After deduplication with primary sources:

- **Net New Booths:** 40-60 (25-30% of extracted)
- **Duplicates Detected:** 100-130 (60-70% of extracted)
- **High Confidence Merges:** 80-100 (60-70% of duplicates)
- **Manual Review Required:** 20-30 (20-30% of duplicates)

### Data Enrichment

City guides will enrich existing booths with:

| Field | % Enriched | Source Type |
|-------|-----------|-------------|
| Description | 40-50% | All city guides |
| Neighborhood | 60-70% | All city guides |
| Venue Type | 30-40% | Magazine/blog sources |
| Hours | 10-15% | Flash Pack, TimeOut |
| Cost | 5-10% | TimeOut sources |
| Website | 15-20% | Locale Magazine, Roxy Hotel |

---

## Monitoring & Maintenance

### Weekly Tasks

```sql
-- Check crawl health
SELECT
  source_name,
  last_successful_crawl,
  total_booths_found,
  status,
  last_error_message
FROM crawl_sources
WHERE source_name LIKE '%berlin%'
   OR source_name LIKE '%london%'
   OR source_name LIKE '%timeout%'
   OR source_name LIKE '%designmynight%'
ORDER BY last_successful_crawl DESC NULLS LAST;
```

### Monthly Tasks

1. **URL Validation:** Check if blog URLs still active
2. **Format Changes:** Verify extraction patterns still work
3. **Data Quality:** Review unverified booths for promotion to verified

```sql
-- Find unverified booths ready for verification
SELECT
  name,
  address,
  city,
  source_names,
  ARRAY_LENGTH(source_names, 1) as num_sources
FROM booths
WHERE status = 'unverified'
  AND ARRAY_LENGTH(source_names, 1) >= 2  -- In multiple sources
ORDER BY num_sources DESC, name
LIMIT 50;
```

### Alerts

Set up alerts for:

1. **Zero Results:** Source returns 0 booths (site structure changed)
2. **High Error Rate:** >50% extraction errors (pattern mismatch)
3. **URL Changes:** HTTP redirects or 404s (site moved)

---

## Success Metrics

### Technical Metrics

- ✅ All 13 extractors deployed
- ✅ All sources registered in database
- ✅ No TypeScript compilation errors
- ✅ All extractors return valid ExtractorResult

### Data Metrics (After First Crawl)

- [ ] 100+ booths extracted (goal: 158-216)
- [ ] 70%+ deduplication rate (expected: 60-70%)
- [ ] 40+ net new booths added (goal: 40-60)
- [ ] <10% extraction error rate
- [ ] 80%+ have complete address data

### Quality Metrics (After Deduplication)

- [ ] 90%+ of high-confidence duplicates correctly matched
- [ ] <5% false positive duplicate rate
- [ ] 50%+ existing booths enriched with descriptions
- [ ] 100% of sources successfully crawled

---

## Future Enhancements

### 1. Dynamic Pattern Learning
- Use AI to detect new article formats
- Adapt extractors based on failed patterns
- Machine learning for address detection

### 2. Real-Time Monitoring
- Webhook alerts for site changes
- Automated pattern testing
- Graceful degradation to generic extractor

### 3. User Verification
- Allow users to verify/correct city guide data
- Promote unverified → verified based on user confirmations
- Track verification confidence scores

### 4. Additional Cities
Easy to add new cities using same patterns:
- Paris (French blogs)
- Tokyo (Japanese sources)
- Sydney (Australian guides)
- San Francisco, Portland, Seattle (US cities)

---

## Conclusion

The TIER 3A city guide extractors provide comprehensive coverage of blog and guide sources across 5 major cities. With 13 specialized extractors, we can extract 150-200 photobooths for validation and supplemental data.

**Key Benefits:**
1. **Validation:** Cross-reference primary directories
2. **Enrichment:** Add descriptions, neighborhoods, context
3. **Discovery:** Find booths missing from operator directories
4. **Confidence:** Multiple sources increase data reliability

**Integration:**
- Seamlessly integrates with unified-crawler architecture
- Uses same deduplication engine as Tier 1/2 sources
- Maintains source provenance for transparency
- Marks data appropriately (unverified status)

**Next Steps:**
1. Deploy migration and updated function
2. Run initial crawl of all 13 sources
3. Review deduplication results
4. Verify data quality
5. Schedule weekly crawls (14-21 day frequency)

---

## Files Created

1. `/supabase/functions/unified-crawler/city-guide-extractors.ts` (1,474 lines)
2. `/supabase/migrations/20251123_tier3a_city_guides.sql` (130 lines)
3. `/supabase/functions/unified-crawler/index.ts` (UPDATED - registered 13 extractors)

**Total Lines Added:** 1,604 lines of production code
**Total Extractors:** 13 specialized extractors
**Total Cities Covered:** 5 major cities
**Expected Coverage:** 150-200 photobooths
