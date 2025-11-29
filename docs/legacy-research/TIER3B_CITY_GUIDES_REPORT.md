# TIER 3B: EUROPE/PACIFIC CITY GUIDES - Implementation Report

## Executive Summary

Successfully implemented 9 specialized extractors for international city guides covering Paris, Vienna, Florence, San Francisco, Melbourne/Sydney, and Tokyo. These extractors handle travel blogs, venue guides, and cultural content with multi-language support and international address normalization.

**Status:** ✅ COMPLETE
**Date:** November 23, 2025
**Priority:** MEDIUM (50)
**Total Sources:** 10 (9 extractors + 1 search-based)

---

## Overview

TIER 3B focuses on city-specific travel guides and cultural content that mention photo booths as aesthetic attractions or venue amenities. Unlike operator directories, these sources provide:
- Cultural and aesthetic context
- Travel-oriented descriptions
- Multi-language content
- Informal/narrative formats
- Search-based discovery

---

## Implemented Extractors

### 1. PARIS EXTRACTORS

#### 1.1 Solo Sophie Extractor
**Source:** https://www.solosophie.com/vintage-photo-booth-paris/
**Type:** Travel blog
**Language:** English
**Format:** Article with headers and descriptions

**Features:**
- Extracts Paris arrondissement addresses (75001-75020)
- Parses metro station information
- Handles French street types (Rue, Avenue, Boulevard, Place)
- Extracts cost in euros (€)
- Captures aesthetic/cultural descriptions

**Example Output:**
```typescript
{
  name: "Le Comptoir Général",
  address: "80 Rue des Récollets, 75010",
  city: "Paris",
  country: "France",
  postal_code: "75010",
  booth_type: "analog",
  cost: "€4",
  description: "Metro: Gare de l'Est",
  source_name: "Solo Sophie",
  status: "unverified"
}
```

**Extraction Patterns:**
```markdown
## Le Comptoir Général
Address: 80 Rue des Récollets, 75010
Metro: Gare de l'Est
Cost: €4
A hidden gem in the 10th arrondissement...
```

---

#### 1.2 Misadventures with Andi Extractor
**Source:** https://misadventureswithandi.com/foto-automat-paris/
**Type:** Detailed travel guide
**Language:** English
**Format:** Numbered list with detailed descriptions

**Features:**
- Numbered location parsing
- Metro/station integration
- Coordinate extraction
- Comprehensive address handling
- Cultural context capture

**Example Output:**
```typescript
{
  name: "Foto Automat - Marais",
  address: "15 Rue du Temple, 75004",
  city: "Paris",
  country: "France",
  latitude: 48.8566,
  longitude: 2.3522,
  booth_type: "analog",
  description: "Metro: Hôtel de Ville (Line 1, 11)",
  source_name: "Misadventures with Andi",
  status: "unverified"
}
```

**Extraction Patterns:**
```markdown
1. **Foto Automat - Marais**
   Address: 15 Rue du Temple, 75004
   Metro: Hôtel de Ville (Line 1, 11)
   Coordinates: 48.8566, 2.3522
```

---

### 2. VIENNA EXTRACTOR

#### 2.1 No Camera Bag Extractor
**Source:** https://nocamerabag.com/blog/photo-spots-vienna
**Type:** Photography guide (search-based)
**Language:** English
**Format:** Mixed content, contextual search

**Features:**
- Search-based booth discovery
- German address parsing (Straße, Gasse, Platz, Ring)
- District to postal code conversion (1.-23. Bezirk → 1010-1230)
- Context extraction from surrounding content
- Header-based location naming

**Example Output:**
```typescript
{
  name: "Naschmarkt Fotoautomat",
  address: "Wienzeile 38, 1060",
  city: "Vienna",
  postal_code: "1060",
  country: "Austria",
  booth_type: "analog",
  description: "Vintage photo booth near the famous Naschmarkt...",
  source_name: "No Camera Bag",
  status: "unverified"
}
```

**Address Normalization:**
```typescript
// Input: "wienzeile 38, 6. Bezirk"
// Output: "Wienzeile 38, 1060"
// District → Postal: 6 → 1060
```

---

### 3. FLORENCE EXTRACTORS

#### 3.1 Girl in Florence Extractor
**Source:** https://girlinflorence.com/?s=Fotoautomatica
**Type:** Local blog (search results)
**Language:** English/Italian mix
**Format:** Search results with article snippets

**Features:**
- Search result parsing
- Italian address formats (Via, Piazza, Viale, Borgo)
- Deduplication (multiple mentions)
- Context extraction
- Cost parsing in euros

**Example Output:**
```typescript
{
  name: "Fotoautomatica Florence",
  address: "Via Nazionale 82r",
  city: "Florence",
  country: "Italy",
  booth_type: "analog",
  cost: "€4",
  description: "The iconic vintage booth featured in countless films...",
  source_name: "Girl in Florence",
  status: "unverified"
}
```

---

#### 3.2 Accidentally Wes Anderson Extractor
**Source:** https://accidentallywesanderson.com/places/fotoautomatica/
**Type:** Aesthetic guide (single feature)
**Language:** English
**Format:** Single page feature

**Features:**
- Canonical location data
- Aesthetic/cultural description
- Coordinate extraction
- Hours parsing
- Visual context

**Example Output:**
```typescript
{
  name: "Fotoautomatica",
  address: "Via Nazionale 82r",
  city: "Florence",
  country: "Italy",
  latitude: 43.7772,
  longitude: 11.2560,
  booth_type: "analog",
  cost: "€4",
  hours: "Daily 10:00-20:00",
  description: "Iconic vintage photo booth featured on Accidentally Wes Anderson for its distinctive aesthetic",
  source_name: "Accidentally Wes Anderson",
  status: "unverified"
}
```

---

### 4. SAN FRANCISCO EXTRACTOR

#### 4.1 DoTheBay Extractor
**Source:** https://dothebay.com/p/photo-booths-in-the-bay
**Type:** Local guide/newsletter
**Language:** English
**Format:** Curated list article

**Features:**
- Bay Area city detection (SF, Oakland, Berkeley, San Jose)
- Neighborhood extraction (Mission, SOMA, etc.)
- ZIP code parsing (94xxx)
- Venue type classification
- Cost extraction

**Example Output:**
```typescript
{
  name: "The Alley",
  address: "3325 Grand Ave, Oakland",
  city: "Oakland",
  state: "CA",
  postal_code: "94610",
  country: "United States",
  booth_type: "analog",
  cost: "$4",
  description: "Located in Grand Lake District",
  source_name: "DoTheBay",
  status: "unverified"
}
```

**City Detection:**
```typescript
// Supported cities: San Francisco, Oakland, Berkeley, San Jose,
// Palo Alto, Daly City, South San Francisco, Sausalito, Mill Valley
// Default: San Francisco
```

---

### 5. AUSTRALIA EXTRACTORS

#### 5.1 Concrete Playground Extractor
**Source:** https://concreteplayground.com/melbourne/bars
**Source:** https://concreteplayground.com/sydney/bars
**Type:** Venue guide (search-based)
**Language:** English (Australian)
**Format:** Bar/venue listings

**Features:**
- URL-based city detection (Melbourne/Sydney)
- Australian address parsing
- Suburb extraction
- State assignment (VIC/NSW)
- Venue context capture

**Example Output (Melbourne):**
```typescript
{
  name: "Bar Americano",
  address: "20 Presgrave Pl, Fitzroy",
  city: "Fitzroy",
  state: "VIC",
  country: "Australia",
  booth_type: "analog",
  description: "Vintage photo booth in this retro-style bar...",
  source_name: "Concrete Playground",
  status: "unverified"
}
```

**Example Output (Sydney):**
```typescript
{
  name: "The Doss House",
  address: "77 George St, The Rocks",
  city: "The Rocks",
  state: "NSW",
  country: "Australia",
  booth_type: "analog",
  description: "Classic photo booth in historic venue...",
  source_name: "Concrete Playground",
  status: "unverified"
}
```

---

### 6. TOKYO EXTRACTOR

#### 6.1 Japan Experience Extractor
**Source:** https://www.japan-experience.com/all-about-japan/tokyo/attractions-excursions/purikura-tokyo
**Type:** Tourism guide
**Language:** English
**Format:** Attraction guide

**Features:**
- Japanese ward/ku parsing (Shibuya-ku, Shinjuku-ku)
- Station-based location (crucial in Tokyo)
- Building/mall name extraction
- Cost in yen (¥)
- **Digital booth classification** (Purikura)

**Example Output:**
```typescript
{
  name: "Purikura no Mecca",
  address: "Shibuya-ku",
  city: "Tokyo",
  country: "Japan",
  booth_type: "digital", // Note: Purikura are digital, not analog
  cost: "¥400",
  description: "Near Shibuya Station - Located in Shibuya 109 Building",
  source_name: "Japan Experience",
  status: "unverified"
}
```

**Tokyo-Specific Parsing:**
- Ward notation: Shibuya-ku, Shinjuku-ku, Minato-ku
- Station names: Essential for navigation
- Building context: Malls and towers are key landmarks

---

### 7. HISTORICAL EXTRACTOR

#### 7.1 Smithsonian Magazine Extractor
**Source:** https://www.smithsonianmag.com/search/?q=photo+booth+history
**Type:** Educational magazine (search-based)
**Language:** English
**Format:** Long-form articles

**Features:**
- Historical context extraction
- Museum location parsing
- Circa date capture (1920s-present)
- Operational status (typically non-operational/historical)
- Educational context

**Example Output:**
```typescript
{
  name: "Smithsonian National Museum of American History - Historic Photo Booth",
  address: "Washington, D.C.",
  city: "Washington",
  state: "DC",
  country: "United States",
  booth_type: "analog",
  is_operational: false,
  description: "Historical booth mentioned in Smithsonian Magazine (circa 1925): Original Anatol Josepho photomaton on display...",
  source_name: "Smithsonian Magazine",
  status: "unverified"
}
```

---

## International Address Normalization

### Paris Address Normalization
```typescript
function normalizeParisAddress(address: string): string {
  // Input: "80 rue des récollets, 75010"
  // Output: "80 Rue des Récollets, 75010"

  // Capitalizes street types: rue → Rue, avenue → Avenue
  // Preserves postal codes: 75001-75020
}
```

### Vienna Address Normalization
```typescript
function normalizeViennaAddress(address: string): string {
  // Input: "WIENZEILE 38"
  // Output: "Wienzeile 38"

  // Handles: straße, strasse, gasse, platz, ring, weg
  // Converts district to postal: 6. Bezirk → 1060
}
```

### Florence Address Normalization
```typescript
function normalizeFlorenceAddress(address: string): string {
  // Input: "via nazionale 82r"
  // Output: "Via Nazionale 82r"

  // Capitalizes: via, piazza, viale, borgo, lungarno
  // Preserves "r" suffix (rosso = red numbering)
}
```

---

## Database Migration

**File:** `/supabase/migrations/20251123_tier3b_city_guides.sql`

**Sources Added:**
1. Solo Sophie - Paris Vintage Photo Booths
2. Misadventures with Andi - Foto Automat Paris
3. No Camera Bag - Vienna Photo Spots
4. Girl in Florence - Fotoautomatica
5. Accidentally Wes Anderson - Fotoautomatica
6. DoTheBay - Photo Booths in the Bay
7. Concrete Playground - Melbourne Bars
8. Concrete Playground - Sydney Bars
9. Japan Experience - Purikura Tokyo
10. Smithsonian Magazine - Photo Booth History

**Configuration:**
- **Priority:** 50 (MEDIUM)
- **Status:** All enabled by default
- **Crawl Frequency:** 14-90 days depending on update frequency
- **Crawl Type:** Single-page scraping (not multi-page)

---

## Technical Implementation

### File Structure
```
supabase/functions/unified-crawler/
├── city-guide-extractors.ts       # New file with all 9 extractors
├── extractors.ts                   # Existing extractors
└── index.ts                        # Updated with routing
```

### Routing Implementation
```typescript
// In index.ts - extractFromSource()
switch (extractorType) {
  // TIER 3B: Europe/Pacific City Guides
  case 'solo_sophie':
    return extractSoloSophie(html, markdown, sourceUrl);
  case 'misadventures_andi':
    return extractMisadventuresAndi(html, markdown, sourceUrl);
  case 'no_camera_bag':
    return extractNoCameraBag(html, markdown, sourceUrl);
  case 'girl_in_florence':
    return extractGirlInFlorence(html, markdown, sourceUrl);
  case 'accidentally_wes_anderson':
    return extractAccidentallyWesAnderson(html, markdown, sourceUrl);
  case 'dothebay':
    return extractDoTheBay(html, markdown, sourceUrl);
  case 'concrete_playground':
    return extractConcretePlayground(html, markdown, sourceUrl);
  case 'japan_experience':
    return extractJapanExperience(html, markdown, sourceUrl);
  case 'smithsonian':
    return extractSmithsonian(html, markdown, sourceUrl);
  default:
    return extractGeneric(html, markdown, sourceUrl, sourceName, lovableApiKey);
}
```

---

## Extraction Patterns by Format

### Blog Article Format (Solo Sophie, Misadventures with Andi)
```markdown
## Location Name
Address: Street Address
Metro: Station Name
Cost: €X
Description paragraph...
```

### Search Results (No Camera Bag, Girl in Florence, Smithsonian)
- Contextual extraction from surrounding content
- Header-based location naming
- Search keyword matching
- Deduplication required

### Single Feature Page (Accidentally Wes Anderson)
- Complete location data on one page
- Rich aesthetic/cultural context
- Canonical source for specific booths

### List Article (DoTheBay)
```markdown
1. **Location Name**
   Address details
   Neighborhood info
   Cost info
```

### Venue Guide (Concrete Playground)
```markdown
## Bar Name
Booth mentioned in description
Address details
```

### Tourism Guide (Japan Experience)
```markdown
## Location Name
Ward/Station info
Building/Complex name
Cost in yen
```

---

## Expected Yield by Source

| Source | City | Expected Booths | Confidence |
|--------|------|----------------|------------|
| Solo Sophie | Paris | 5-10 | Medium |
| Misadventures Andi | Paris | 8-15 | High |
| No Camera Bag | Vienna | 2-5 | Low |
| Girl in Florence | Florence | 1-3 | Medium |
| Accidentally Wes Anderson | Florence | 1 | High |
| DoTheBay | SF Bay Area | 10-15 | High |
| Concrete Playground (MEL) | Melbourne | 3-8 | Medium |
| Concrete Playground (SYD) | Sydney | 3-8 | Medium |
| Japan Experience | Tokyo | 5-10 | Medium |
| Smithsonian | Various USA | 3-8 | Low |

**Total Expected:** 45-85 international booth locations

---

## Data Quality Considerations

### Strengths
- Cultural and aesthetic context
- Travel-oriented descriptions useful for users
- Multi-language coverage
- Local insider knowledge
- Aesthetic validation (AWA)

### Limitations
- **Unverified status:** All marked as "unverified"
- May include closed/temporary locations
- Informal address formats
- Potential outdated information
- Search-based sources have lower precision

### Validation Strategy
1. Mark all as `status: "unverified"`
2. Cross-reference with operator sources when possible
3. User reports for validation
4. Periodic re-crawling (14-30 day intervals)
5. Geocoding validation for addresses

---

## Multi-Language Support

### Languages Handled
- **English:** All sources
- **French:** Paris address parsing
- **German:** Vienna address parsing
- **Italian:** Florence address parsing
- **Japanese:** Tokyo ward/station names

### Character Set Support
- UTF-8 for all international characters
- Diacritics: é, è, à, ö, ü, ß
- Special formats: "r" suffix in Florence addresses

---

## Testing Recommendations

### Unit Tests Needed
```typescript
describe('Paris Address Normalization', () => {
  it('should capitalize rue', () => {
    expect(normalizeParisAddress('80 rue des récollets'))
      .toBe('80 Rue des Récollets');
  });

  it('should preserve postal codes', () => {
    expect(normalizeParisAddress('15 Rue du Temple, 75004'))
      .toContain('75004');
  });
});

describe('Vienna District Conversion', () => {
  it('should convert district to postal code', () => {
    expect(districtToPostalCode(6)).toBe('1060');
    expect(districtToPostalCode(1)).toBe('1010');
  });
});

describe('Tokyo Station Parsing', () => {
  it('should extract station names', () => {
    const result = extractStationName('Near Shibuya Station');
    expect(result).toBe('Shibuya Station');
  });
});
```

### Integration Tests
1. Test each extractor with sample HTML/Markdown
2. Validate address normalization across languages
3. Test deduplication logic
4. Verify coordinate extraction
5. Test fallback to generic extractor

---

## Performance Considerations

### Single-Page Scraping
- All TIER 3B sources use single-page scraping
- Faster than multi-page crawling
- Lower resource usage
- Suitable for blog/article format

### Crawl Frequency
- **High-priority:** 14 days (active guides)
- **Medium-priority:** 21-30 days (stable content)
- **Low-priority:** 90 days (historical content)

### Rate Limiting
- 50ms delay between booth database operations
- Firecrawl API respects source robots.txt
- 5 second page wait time for dynamic content

---

## Future Enhancements

### Geocoding Integration
```typescript
// Add geocoding for addresses without coordinates
if (!booth.latitude && booth.address) {
  const coords = await geocodeAddress(booth.address, booth.city, booth.country);
  booth.latitude = coords.lat;
  booth.longitude = coords.lng;
}
```

### Image Extraction
```typescript
// Extract booth photos from guide images
if (html.includes('photo-booth-image')) {
  const imgUrls = extractBoothImages(html);
  booth.photos = imgUrls;
}
```

### Sentiment Analysis
```typescript
// Analyze descriptions for operational status hints
const sentiment = analyzeDescription(booth.description);
if (sentiment.includes('closed', 'removed', 'gone')) {
  booth.is_operational = false;
}
```

### Cross-Reference Validation
```typescript
// Match city guide booths with operator sources
const operatorMatch = await findOperatorMatch(booth);
if (operatorMatch) {
  booth.status = 'active'; // Upgrade from unverified
  booth.source_names.push(operatorMatch.source);
}
```

---

## Usage Examples

### Crawl Specific Source
```bash
curl -X POST https://your-project.supabase.co/functions/v1/unified-crawler \
  -H "Content-Type: application/json" \
  -d '{"source_name": "Solo Sophie - Paris Vintage Photo Booths"}'
```

### Crawl All TIER 3B
```bash
# Query sources with priority = 50
curl -X POST https://your-project.supabase.co/functions/v1/unified-crawler \
  -H "Content-Type: application/json" \
  -d '{"priority_filter": 50}'
```

### Force Re-crawl
```bash
curl -X POST https://your-project.supabase.co/functions/v1/unified-crawler \
  -H "Content-Type: application/json" \
  -d '{"force_crawl": true, "source_name": "DoTheBay - Photo Booths in the Bay"}'
```

---

## Monitoring and Maintenance

### Success Metrics
- Booths found per source
- Extraction time
- Error rates
- Deduplication effectiveness
- Address normalization accuracy

### Error Handling
- All extractors use try-catch with error arrays
- Errors logged to `ExtractorResult.errors`
- Partial success supported (some booths extracted despite errors)
- Consecutive failure tracking in database

### Maintenance Schedule
1. **Weekly:** Review error logs
2. **Bi-weekly:** Check for source format changes
3. **Monthly:** Validate random sample of extracted data
4. **Quarterly:** Update address normalization rules
5. **Annually:** Review and update source list

---

## Conclusion

TIER 3B implementation successfully adds 10 international city guide sources with 9 specialized extractors covering:
- ✅ Multi-language support (English, French, German, Italian, Japanese)
- ✅ International address normalization
- ✅ Cultural and aesthetic context extraction
- ✅ Search-based discovery for indirect sources
- ✅ Digital booth classification (Purikura)
- ✅ Historical booth tracking
- ✅ 45-85 expected booth locations across Europe, Pacific, and North America

**Next Steps:**
1. Deploy migration to seed database
2. Run initial crawl of all sources
3. Monitor extraction success rates
4. Implement geocoding for addresses without coordinates
5. Set up automated re-crawling schedule
6. Begin user validation feedback loop

**Files Created:**
- `/supabase/functions/unified-crawler/city-guide-extractors.ts` (40KB)
- `/supabase/migrations/20251123_tier3b_city_guides.sql` (5KB)
- `/docs/TIER_3B_CITY_GUIDES_REPORT.md` (this file)

**Status:** ✅ Ready for deployment and testing
