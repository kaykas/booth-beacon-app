# Photomatica.com Extractor - Data Quality Metrics

## Expected Data Quality Scores

### Museum Pages (LA and SF)

**Coverage:**
- ✅ 100% - Name, Address, City, State, Country
- ✅ 100% - ZIP Code (known addresses)
- ✅ 100% - Booth Type (analog)
- ✅ 100% - Operational Status (active)
- ✅ 90% - Phone Number
- ✅ 80% - Hours of Operation
- ✅ 80% - Description
- ⚠️ 50% - Coordinates (if JSON-LD present)
- ⚠️ 30% - Machine Manufacturer
- ⚠️ 10% - Cost Information

**Expected Booth Count:** 2 (LA + SF museums)

**Quality Score:** 95/100

### Directory Page (Find a Booth Near You)

**Coverage:**
- ✅ 100% - Name, Country
- ✅ 95% - Address, City
- ✅ 90% - State
- ✅ 85% - Coordinates (map data)
- ✅ 80% - Booth Type (analog/digital flag)
- ⚠️ 60% - ZIP Code
- ⚠️ 40% - Description
- ⚠️ 20% - Hours, Cost
- ⚠️ 10% - Machine Details

**Expected Booth Count:** 50-200+ (nationwide directory)

**Quality Score:** 75/100

### Permanent Installations

**Coverage:**
- ✅ 100% - Name, Country
- ✅ 90% - Address, City, State
- ✅ 85% - Operational Status
- ⚠️ 60% - Description
- ⚠️ 50% - Coordinates
- ⚠️ 40% - Booth Type
- ⚠️ 20% - Hours, Cost
- ⚠️ 10% - Machine Details

**Expected Booth Count:** 10-50 (venue partnerships)

**Quality Score:** 70/100

---

## Validation Checklist

### Required Fields (Must Have)
- [ ] Name is not "Unknown" or empty
- [ ] Country is "United States"
- [ ] Source name is "Photomatica.com"
- [ ] Status is valid enum value
- [ ] At least one of: address OR coordinates

### Highly Desired (Should Have)
- [ ] Full street address with number
- [ ] City name present
- [ ] State code is valid 2-letter US state
- [ ] Postal code is valid 5-digit ZIP

### Nice to Have (Could Have)
- [ ] Coordinates (lat/lng) are valid US coordinates
- [ ] Booth type is classified (analog/digital)
- [ ] Description is >20 characters
- [ ] Phone number in valid format
- [ ] Hours information present

### Optional Enrichments
- [ ] Machine model/manufacturer identified
- [ ] Cost information extracted
- [ ] Payment methods specified
- [ ] Photos/images linked

---

## Known Quality Issues

### Museum Pages
- ✅ **High quality**: Verified locations with complete data
- ⚠️ **Missing**: Exact machine models not always specified
- ⚠️ **Missing**: Cost information (admission is free but not stated on all pages)

### Directory Page
- ⚠️ **Variable quality**: Depends on Google Sheets data completeness
- ⚠️ **Missing**: Detailed descriptions for most booths
- ⚠️ **Dynamic data**: May require JavaScript execution to extract

### Permanent Installations
- ⚠️ **Incomplete listings**: Landing page, need state-specific crawls
- ⚠️ **Limited details**: Venue partnerships may lack booth-specific info
- ⚠️ **Temporary booths**: Some may be event-based, not permanent

---

## Recommended Quality Thresholds

### Acceptance Criteria (Per Booth)

**Minimum viable booth:**
- Has name (not "Unknown")
- Has address OR coordinates
- Has country
- Has source URL

**Good quality booth:**
- All minimum criteria PLUS
- Has city and state
- Has booth type classification
- Has operational status

**Excellent quality booth:**
- All good quality criteria PLUS
- Has coordinates
- Has description >50 chars
- Has hours or contact info
- Has machine details

### Rejection Criteria

**Reject if:**
- Name is "Unknown", "Photo Booth", or generic
- No address AND no coordinates
- Country is not "United States"
- Address is clearly invalid (e.g., "N/A", "Unknown")
- Duplicate of existing booth (same name + address)

---

## Deduplication Strategy

### Matching Criteria

**Exact match if:**
1. Same normalized name
2. Same street address (case-insensitive, normalized)
3. Same city and state

**Fuzzy match if:**
1. Name similarity >85% (Levenshtein distance)
2. Coordinates within 100 meters
3. Same state

**Merge strategy:**
- Keep most complete record
- Merge source_names array
- Prefer most recent data
- Preserve all unique fields

### Museum-Specific Rules

LA Museum variants to merge:
- "Photo Booth Museum Los Angeles"
- "Photo Booth Museum LA"
- "Photomatica Museum Los Angeles"
- All at "3827 Sunset Blvd"

SF Museum variants to merge:
- "Photo Booth Museum San Francisco"
- "Photo Booth Museum SF"
- "Photomatica Museum San Francisco"
- All at "2275 Market St"

---

## Monitoring Metrics

### Per-Crawl Metrics

Track these for each crawl session:

```typescript
{
  source_url: string,
  page_type: 'museum' | 'directory' | 'installations',
  booths_extracted: number,
  booths_valid: number,
  booths_rejected: number,
  extraction_time_ms: number,
  errors_count: number,

  // Quality breakdown
  with_coordinates: number,
  with_booth_type: number,
  with_description: number,
  with_hours: number,
  with_phone: number,
  with_machine_details: number,

  // Validation issues
  missing_address: number,
  invalid_state: number,
  generic_names: number,
  duplicates_found: number
}
```

### Aggregate Metrics (All Photomatica Crawls)

```typescript
{
  total_booths: number,
  unique_booths: number,
  avg_quality_score: number,

  // By page type
  museum_booths: 2,
  directory_booths: number,
  installation_booths: number,

  // Geographic coverage
  states_covered: number,
  cities_covered: number,

  // Data completeness
  pct_with_coordinates: number,
  pct_with_booth_type: number,
  pct_with_description: number,

  // Freshness
  last_successful_crawl: timestamp,
  last_update: timestamp,
  consecutive_successes: number
}
```

---

## Sample Expected Output

### LA Museum Booth (Reference Quality)

```json
{
  "name": "Photo Booth Museum Los Angeles",
  "address": "3827 Sunset Blvd Unit A",
  "city": "Los Angeles",
  "state": "CA",
  "postal_code": "90026",
  "country": "United States",
  "latitude": 34.0882,
  "longitude": -118.2728,
  "booth_type": "analog",
  "machine_manufacturer": "Photomatica (restored vintage collection)",
  "is_operational": true,
  "status": "active",
  "phone": "(415) 466-8700",
  "hours": "Mon-Wed 1pm-9pm, Thu 1pm-11pm, Fri-Sat 11am-11pm, Sun 11am-9pm",
  "description": "Free admission museum featuring restored vintage analog photo booths | Rebuilt by hand with stainless steel and marine-grade wood",
  "source_url": "https://www.photomatica.com/photo-booth-museum/los-angeles",
  "source_name": "Photomatica.com"
}
```

**Quality Score: 98/100**
- ✅ All core fields present
- ✅ Coordinates included
- ✅ Rich description
- ✅ Hours formatted
- ⚠️ Missing: Specific machine models

### Directory Booth (Typical Quality)

```json
{
  "name": "The Rookery Bar",
  "address": "123 Main Street",
  "city": "San Francisco",
  "state": "CA",
  "country": "United States",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "booth_type": "analog",
  "is_operational": true,
  "status": "active",
  "source_url": "https://www.photomatica.com/find-a-booth-near-you",
  "source_name": "Photomatica.com"
}
```

**Quality Score: 72/100**
- ✅ Core fields present
- ✅ Coordinates included
- ✅ Booth type classified
- ⚠️ Missing: ZIP, phone, hours, description
- ⚠️ Missing: Machine details

---

## Testing Validation

### Automated Tests

Run these validation checks in tests:

```typescript
function validateBoothQuality(booth: BoothData): ValidationResult {
  const issues: string[] = [];
  let score = 0;

  // Required fields (30 points)
  if (booth.name && booth.name !== 'Unknown') score += 10;
  else issues.push('Missing or invalid name');

  if (booth.address || (booth.latitude && booth.longitude)) score += 10;
  else issues.push('No location data');

  if (booth.country === 'United States') score += 10;
  else issues.push('Invalid country');

  // Important fields (40 points)
  if (booth.city) score += 10;
  if (booth.state && US_STATES.includes(booth.state)) score += 10;
  if (booth.booth_type) score += 10;
  if (booth.is_operational !== undefined) score += 10;

  // Nice to have (30 points)
  if (booth.postal_code) score += 5;
  if (booth.latitude && booth.longitude) score += 10;
  if (booth.description && booth.description.length > 20) score += 10;
  if (booth.phone) score += 5;

  return {
    score,
    passed: score >= 50,
    issues
  };
}
```

### Manual Spot Checks

For each crawl, manually verify:

1. **Museum pages**: Both LA and SF extracted correctly
2. **Directory page**: At least 20 booths extracted
3. **No duplicates**: LA/SF museums don't appear in directory
4. **State codes valid**: All states are 2-letter US codes
5. **Addresses realistic**: Sample 5-10 addresses for plausibility
6. **Coordinates valid**: US coordinates (24°-49°N, 66°-125°W)

---

## Improvement Roadmap

### Phase 1: Data Quality (Weeks 1-2)
- ✅ Implement enhanced extractor
- ⏳ Add validation tests
- ⏳ Monitor initial crawl quality
- ⏳ Fix common parsing issues

### Phase 2: Enrichment (Weeks 3-4)
- ⏳ Add geocoding for missing coordinates
- ⏳ Normalize hours to standard format
- ⏳ Extract photos from museum pages
- ⏳ Enhance machine model detection

### Phase 3: Expansion (Weeks 5-6)
- ⏳ Crawl state-specific installation pages
- ⏳ Parse Google Sheets CSV directly (if accessible)
- ⏳ Add booth photo galleries
- ⏳ Implement change detection

### Phase 4: Maintenance (Ongoing)
- ⏳ Weekly quality monitoring
- ⏳ Monthly full re-crawl
- ⏳ Duplicate detection and merging
- ⏳ User-reported corrections integration

---

## Known Issues & Workarounds

### Issue: Google Sheets CSV Not in HTML

**Problem:** Directory data loaded dynamically from external CSV
**Impact:** May miss most directory booths if HTML doesn't contain data
**Workaround:**
1. Ensure Firecrawl waits for JavaScript (3-5 seconds)
2. If still missing, attempt direct CSV access
3. Fall back to AI extraction of visible booth listings

### Issue: Generic "Restored Vintage" Descriptions

**Problem:** Photomatica doesn't specify exact machine models
**Impact:** machine_model and machine_manufacturer often generic
**Workaround:**
1. Default to "Photomatica (restored vintage)" for museums
2. Accept this as expected for museum booths
3. May need user contributions for specific model info

### Issue: Installation Pages Incomplete

**Problem:** Main page is landing/overview, state pages have details
**Impact:** May extract 0 booths from main permanent-photo-booth page
**Workaround:**
1. Configure crawler to follow state-specific links
2. Add explicit URLs for CA, NY, TX, MA installation pages
3. Use crawlUrl with includePaths for state pages

---

**Report Generated:** 2025-11-27
**Based On:** Enhanced Extractor Implementation
**Purpose:** Data quality validation and monitoring guidelines
