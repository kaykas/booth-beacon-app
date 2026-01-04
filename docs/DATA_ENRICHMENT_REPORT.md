# Booth Beacon Data Enrichment Report

**Date:** January 3, 2026
**Scope:** Automated extraction of missing booth data from existing descriptions

---

## Executive Summary

Successfully enriched the Booth Beacon database by extracting missing data from booth descriptions and other text fields. The enrichment scripts analyzed all 880 booths and populated 163 previously empty fields using pattern matching and keyword extraction.

### Key Achievements

- **59 booth_type fields** populated (69.3% → 62.6% unknown)
- **92 photo_type fields** populated (99.7% → 89.2% unknown)
- **3 cost fields** populated (86.0% → 85.7% missing)
- **9 hours fields** populated (80.0% → 79.0% missing)

---

## Methodology

### Approach

Created TypeScript scripts that:

1. Fetched all 880 booths from Supabase database
2. Combined text from `description`, `machine_model`, `historical_notes`, and `address` fields
3. Applied regex patterns to extract structured data
4. Updated database in batches of 50 booths
5. Only populated fields that were currently NULL/empty

### Pattern Matching Rules

#### Booth Type Extraction

**Analog patterns:**
- Keywords: analog, film, chemical, vintage, classic, 35mm, developing, chemistry, original
- Name patterns: PhotoFix, Fotoautomat, Photo Automat
- Phrases: "automatic photo booth", "photo strip", "chemically developed"

**Digital patterns:**
- Keywords: digital, printer, screen, modern, electronic, LCD, touch screen

**Instant patterns:**
- Keywords: instant, polaroid, fujifilm, instax

#### Photo Type Extraction

**Black & White:**
- Patterns: b&w, black and white, black-and-white, monochrome, grayscale
- German: schwarz-weiß, schwarzweiß

**Color:**
- Patterns: color photo, color print, full color, colored
- German: farbe

**Both:**
- Combined patterns: "color and b&w", "both color and black and white"

#### Cost Extraction

- Currency patterns: $3, €2-3, £5, ¥500
- Context phrases: "costs $3", "price: €2", "$3 per strip"
- Free booths: "free"

#### Hours Extraction

- Time ranges: "9am-5pm", "10:00 - 18:00"
- Day patterns: "Monday: 9-5", "Mon-Fri: 10-6"
- Special: "24/7", "Open 24 hours", "Geöffnet 24/7"

---

## Results

### Overall Statistics

**Total Booths:** 880

### Before Enrichment

| Field | Missing | Percentage |
|-------|---------|------------|
| booth_type | 610 | 69.3% |
| photo_type | 877 | 99.7% |
| cost | 757 | 86.0% |
| hours | 704 | 80.0% |

### After Enrichment

| Field | Missing | Percentage | Improvement |
|-------|---------|------------|-------------|
| booth_type | 551 | 62.6% | ↓ 6.7pp |
| photo_type | 785 | 89.2% | ↓ 10.5pp |
| cost | 754 | 85.7% | ↓ 0.3pp |
| hours | 695 | 79.0% | ↓ 1.0pp |

### Distribution Analysis

**Booth Types:**
- Analog: 327 (37.2%)
- Digital: 2 (0.2%)
- Instant: 0 (0.0%)
- Unknown: 551 (62.6%)

**Photo Types:**
- Black & White: 92 (10.5%)
- Color: 1 (0.1%)
- Both: 2 (0.2%)
- Unknown: 785 (89.2%)

**Cost Data:**
- Present: 126 (14.3%)
- Missing: 754 (85.7%)

**Hours Data:**
- Present: 185 (21.0%)
- Missing: 695 (79.0%)

---

## City-Level Completeness (Top 10)

| City | Total Booths | Type % | Photo % | Cost % | Hours % |
|------|--------------|--------|---------|--------|---------|
| Berlin | 77 | 71% | 13% | 25% | 31% |
| San Francisco | 38 | 82% | 11% | 18% | 24% |
| London | 34 | 68% | 26% | 32% | 29% |
| New York | 40 | 57% | 25% | 33% | 20% |
| Brooklyn | 29 | 52% | 10% | 17% | 10% |
| Los Angeles | 48 | 48% | 13% | 21% | 8% |
| Chicago | 55 | 36% | 13% | 16% | 20% |
| Paris | 26 | 35% | 8% | 23% | 42% |
| Vienna | 16 | 44% | 25% | 6% | 31% |
| Amsterdam | 11 | 36% | 27% | 18% | 9% |

**Key Insights:**
- Berlin and San Francisco have the best booth_type coverage (71-82%)
- New York and London have the best cost data (32-33%)
- Stockholm and Paris have the best hours data (42-50%)

---

## Sample Extractions

### Successful Extractions

1. **Ace Hotel (New York)**
   - Type: analog
   - Cost: $7.50 per strip

2. **ACUD (Berlin)**
   - Type: analog
   - Cost: €2-3 per strip
   - Hours: Geöffnet 24/7

3. **Albert's Schloss (London)**
   - Type: analog
   - Photo: black-and-white
   - Cost: £1
   - Hours: Monday: 10:00 AM – 2:00 AM...

4. **Fotoautomat Berlin**
   - Type: analog (extracted from name pattern)

5. **1212 Santa Monica (Santa Monica)**
   - Type: analog
   - Photo: black-and-white
   - Hours: Monday: 5:00 – 10:00 PM...

---

## Scripts Created

### 1. enrich-booth-data.ts
**Purpose:** Main enrichment script with comprehensive pattern matching

**Features:**
- Extracts all four data types (booth_type, photo_type, cost, hours)
- Batch updates database (50 booths per batch)
- Shows before/after statistics
- Processes all 880 booths

**Run:** `npx tsx scripts/enrich-booth-data.ts`

### 2. enrich-booth-data-v2.ts
**Purpose:** Enhanced patterns based on first-run analysis

**Features:**
- Added name-based inference (PhotoFix, Fotoautomat)
- German language patterns
- Only processes booths with missing data
- Focused on booth_type and photo_type

**Run:** `npx tsx scripts/enrich-booth-data-v2.ts`

### 3. analyze-enrichment-results.ts
**Purpose:** Detailed analysis of enrichment results

**Features:**
- Distribution analysis by type
- Sample extracted data display
- Common words in remaining unknowns
- Pattern discovery for future improvements

**Run:** `npx tsx scripts/analyze-enrichment-results.ts`

### 4. final-enrichment-report.ts
**Purpose:** Comprehensive report generation

**Features:**
- Before/after comparison
- City-level completeness analysis
- Recommendations for further enrichment
- Formatted for stakeholder reporting

**Run:** `npx tsx scripts/final-enrichment-report.ts`

---

## Limitations & Challenges

### What Worked Well

1. **Booth Type Extraction:** 6.7pp improvement
   - Name patterns (Fotoautomat, PhotoFix) very reliable
   - Keyword detection effective for analog booths
   - 37.2% of database now has booth_type data

2. **Photo Type Extraction:** 10.5pp improvement
   - B&W patterns highly successful
   - 10.5% of database now has photo_type data

3. **Hours Extraction:** 1.0pp improvement
   - Successfully extracted structured hours from venue descriptions
   - 21% of database now has hours data

### What Was Challenging

1. **Cost Data:** Only 0.3pp improvement
   - Pricing rarely mentioned in existing descriptions
   - Highly variable format (different currencies, ranges)
   - Only 14.3% of database has cost data

2. **Remaining Unknowns:** 62.6% still missing booth_type
   - Many booths have minimal descriptions
   - Some descriptions in German without clear patterns
   - Distance-only descriptions ("3.44 miles away")

3. **Photo Type Coverage:** Still 89.2% unknown
   - Most descriptions don't mention photo type
   - Could infer "most analog = B&W" but being conservative

---

## Recommendations for Further Enrichment

### 1. Booth Type (62.6% still unknown)

**Strategy: Inference Rules**
- Default analog for booths in bars/venues (based on name patterns)
- Research by city (Berlin booths are predominantly analog)
- Manual review of unclear cases

**Strategy: Bulk Updates**
```sql
-- Example: Update booths with "Bar" or "Pub" in venue name
UPDATE booths
SET booth_type = 'analog'
WHERE booth_type IS NULL
AND (name ILIKE '%bar%' OR name ILIKE '%pub%');
```

**Strategy: User Contributions**
- Add booth_type field to submission form
- Allow users to suggest corrections
- Implement verification workflow

### 2. Photo Type (89.2% still unknown)

**Strategy: Conservative Inference**
- Most analog booths produce B&W photos
- Could bulk update analog → B&W with high confidence
- Flag for verification by users

**Strategy: User Verification**
- Add photo_type to submission form
- Show sample photos if available
- Community verification system

### 3. Cost (85.7% still missing)

**Strategy: Manual Research**
- Visit venue websites for pricing
- Call/email venues for current prices
- Regional pricing patterns

**Strategy: Web Scraping**
- Scrape venue websites for pricing info
- Monitor for price updates
- Validate with users

**Strategy: User Contributions**
- Critical for submission form
- Date-stamped prices (prices change)
- Currency conversion display

### 4. Hours (79.0% still missing)

**Strategy: Google Maps Integration**
- Use Places API to fetch business hours
- Match venue names to Google Places
- Auto-update weekly

**Strategy: Venue Hours Inheritance**
- Many booths follow venue operating hours
- If no specific hours, use venue hours
- Note "booth may have different hours"

---

## Next Steps

### Immediate (High Priority)

1. **Implement Conservative Inference**
   - Update analog booths → B&W photo type (with verification flag)
   - Update venue-based booths → infer from venue type
   - Add data_source field to track inference method

2. **Enhance Submission Form**
   - Add all four fields (booth_type, photo_type, cost, hours)
   - Make cost and hours optional but encouraged
   - Add "last verified" date

3. **Create Verification Workflow**
   - Flag inferred data for user verification
   - Show confidence scores
   - Reward users for verifying data

### Short Term (Next Month)

4. **Google Maps Integration**
   - Fetch business hours via Places API
   - Match booths to Google Place IDs
   - Auto-sync hours weekly

5. **Manual Research Sprint**
   - Research top 50 cities
   - Contact venues for pricing
   - Build pricing database

6. **Pattern Expansion**
   - Add more language patterns (French, Spanish)
   - Location-based patterns
   - Venue-type based inference

### Long Term (Quarter)

7. **User Contribution System**
   - Implement submission approval workflow
   - Build reputation system
   - Add photo upload for verification

8. **API Partnerships**
   - Partner with PhotoBooth.net
   - Integrate with venue directories
   - Cross-reference data sources

9. **ML-Based Enrichment**
   - Train classifier on known booth types
   - Use venue characteristics as features
   - Active learning for uncertain cases

---

## Technical Details

### Database Schema

```typescript
interface Booth {
  id: string;
  name: string;
  description: string | null;
  machine_model: string | null;
  historical_notes: string | null;
  booth_type: 'analog' | 'digital' | 'instant' | null;
  photo_type: 'black-and-white' | 'color' | 'both' | null;
  cost: string | null;
  hours: string | null;
  address: string | null;
}
```

### Batch Update Strategy

```typescript
// Update in batches of 50 to avoid overwhelming database
const BATCH_SIZE = 50;
for (let i = 0; i < results.length; i += BATCH_SIZE) {
  const batch = results.slice(i, i + BATCH_SIZE);
  for (const result of batch) {
    await supabase
      .from('booths')
      .update(updateData)
      .eq('id', result.booth_id);
  }
}
```

### Error Handling

- Conservative extraction (only update when confident)
- Failed updates logged but don't block batch
- Before/after stats validation
- Dry-run mode available

---

## Conclusion

The automated data enrichment successfully populated 163 fields across 880 booths, with the greatest impact on booth_type (59 fields) and photo_type (92 fields). While significant progress was made, 62.6% of booths still lack booth_type data, and 89.2% lack photo_type data.

The next phase should focus on:
1. Conservative inference rules for remaining unknowns
2. User contribution system for verification
3. Google Maps API integration for hours
4. Manual research for cost data

The scripts are reusable and can be run periodically as new booth descriptions are added or improved.

---

## Files & Resources

### Scripts Location
`/Users/jkw/Projects/booth-beacon-app/scripts/`

### Key Scripts
- `enrich-booth-data.ts` - Main enrichment script
- `enrich-booth-data-v2.ts` - Enhanced patterns version
- `analyze-enrichment-results.ts` - Analysis tool
- `final-enrichment-report.ts` - Report generator

### Run All Scripts
```bash
# Main enrichment
npx tsx scripts/enrich-booth-data.ts

# Enhanced patterns
npx tsx scripts/enrich-booth-data-v2.ts

# Analysis
npx tsx scripts/analyze-enrichment-results.ts

# Final report
npx tsx scripts/final-enrichment-report.ts
```

### Database Connection
- URL: `https://tmgbmcbwfkvmylmfpkzy.supabase.co`
- Table: `booths`
- Auth: Uses `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`

---

**Report Generated:** January 3, 2026
**Total Runtime:** ~3 minutes
**Database Queries:** 880 reads, 124 updates (first run) + 6 updates (second run)
