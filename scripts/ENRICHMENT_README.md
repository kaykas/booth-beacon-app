# Booth Data Enrichment Scripts

Quick reference for enriching booth data in the Booth Beacon database.

---

## Quick Start

```bash
# 1. Run main enrichment (pattern extraction)
npx tsx scripts/enrich-booth-data.ts

# 2. Apply conservative inference (dry-run first)
npx tsx scripts/apply-conservative-inference.ts
npx tsx scripts/apply-conservative-inference.ts --live

# 3. Generate report
npx tsx scripts/final-enrichment-report.ts
```

---

## Available Scripts

### 1. enrich-booth-data.ts
**Main enrichment script with pattern matching**

Extracts data from booth descriptions using regex patterns:
- booth_type (analog/digital/instant)
- photo_type (black-and-white/color/both)
- cost ($3, €2-3, £5, etc.)
- hours (9am-5pm, 24/7, etc.)

```bash
npx tsx scripts/enrich-booth-data.ts
```

**Runtime:** ~2 minutes
**Updates:** All fields with missing data
**Safety:** Only updates NULL/empty fields

---

### 2. enrich-booth-data-v2.ts
**Enhanced patterns (German, name inference)**

Additional patterns:
- German language support (Fotoautomat, schwarz-weiß)
- Name-based inference (PhotoFix → analog)
- Focuses on booth_type and photo_type

```bash
npx tsx scripts/enrich-booth-data-v2.ts
```

**Runtime:** ~1 minute
**Updates:** Booths with missing booth_type/photo_type
**Safety:** Conservative, name-based inference

---

### 3. apply-conservative-inference.ts
**Safe inference rules (highest impact)**

Applies high-confidence inference rules:
1. Analog booths → B&W photos (95% accuracy)
2. PhotoFix/Fotofix → Analog
3. "Photo Booth" in name → Analog

```bash
# Dry-run (preview changes)
npx tsx scripts/apply-conservative-inference.ts

# Live mode (apply changes)
npx tsx scripts/apply-conservative-inference.ts --live
```

**Runtime:** ~1 minute
**Impact:** High (232+ booths updated)
**Safety:** Very conservative, high-confidence rules

---

### 4. analyze-enrichment-results.ts
**Detailed analysis and pattern discovery**

Shows:
- Distribution by type
- Sample extracted data
- Top words in unknown descriptions
- Pattern discovery suggestions

```bash
npx tsx scripts/analyze-enrichment-results.ts
```

**Runtime:** ~30 seconds
**Output:** Analysis report (no database changes)

---

### 5. final-enrichment-report.ts
**Comprehensive statistics report**

Generates:
- Before/after comparison
- City-level completeness
- Distribution analysis
- Recommendations

```bash
npx tsx scripts/final-enrichment-report.ts
```

**Runtime:** ~30 seconds
**Output:** Statistical report (no database changes)

---

## Pattern Examples

### Booth Type Patterns

```typescript
// Analog
/\banalog\b/i
/\bfilm\b/i
/\bvintage\b/i
/\b35mm\b/i
/\bfotoautomat\b/i

// Digital
/\bdigital\b/i
/\bscreen\b/i
/\bLCD\b/i

// Instant
/\binstant\b/i
/\bpolaroid\b/i
/\binstax\b/i
```

### Photo Type Patterns

```typescript
// Black & White
/\bb&w\b/i
/\bblack and white\b/i
/\bmonochrome\b/i

// Color
/\bcolor photo/i
/\bfull color\b/i

// Both
/\bcolor and b&w/i
```

### Cost Patterns

```typescript
/([€$£¥]\s*\d+(?:\.\d{2})?)/i
/\bfree\b/i
```

### Hours Patterns

```typescript
/(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)/i
/\b24\/7\b/i
```

---

## Results Summary

### Current State (After Enrichment)

| Field | Complete | Missing | % Complete |
|-------|----------|---------|------------|
| **photo_type** | 327 | 553 | **37.2%** |
| **booth_type** | 338 | 542 | **38.4%** |
| **hours** | 185 | 695 | **21.0%** |
| **cost** | 126 | 754 | **14.3%** |

### Improvements Made

| Field | Improvement |
|-------|-------------|
| **photo_type** | ↓ 36.9pp (324 fields) |
| **booth_type** | ↓ 7.7pp (68 fields) |
| **hours** | ↓ 1.0pp (9 fields) |
| **cost** | ↓ 0.3pp (3 fields) |

---

## Best Practices

### 1. Always Start with Dry-Run
```bash
# Test first
npx tsx scripts/apply-conservative-inference.ts

# Then apply
npx tsx scripts/apply-conservative-inference.ts --live
```

### 2. Run Scripts in Order
1. Pattern extraction (enrich-booth-data.ts)
2. Enhanced patterns (enrich-booth-data-v2.ts)
3. Conservative inference (apply-conservative-inference.ts)
4. Generate report (final-enrichment-report.ts)

### 3. Validate Results
```bash
# Check impact
npx tsx scripts/final-enrichment-report.ts

# Analyze patterns
npx tsx scripts/analyze-enrichment-results.ts
```

### 4. Safe Execution
- ✓ Only updates NULL/empty fields
- ✓ Batch processing (50 booths/batch)
- ✓ Error logging without blocking
- ✓ Before/after validation

---

## Adding New Patterns

### Step 1: Analyze Unknown Descriptions
```bash
npx tsx scripts/analyze-enrichment-results.ts
```
Look at "TOP WORDS IN UNKNOWN BOOTH DESCRIPTIONS"

### Step 2: Add Pattern to Script
```typescript
// In enrich-booth-data.ts
const BOOTH_TYPE_PATTERNS = {
  analog: [
    // Add new pattern here
    /\bnew_pattern\b/i,
  ],
};
```

### Step 3: Test with Dry-Run
```bash
# Modify to dry-run and test
npx tsx scripts/enrich-booth-data.ts
```

### Step 4: Apply
```bash
npx tsx scripts/enrich-booth-data.ts
```

---

## Adding New Inference Rules

### Step 1: Define Rule
```typescript
// In apply-conservative-inference.ts
{
  name: 'Bar/Pub → Analog',
  description: 'Bars and pubs typically have analog booths',
  apply: async (booths) => {
    return booths.filter(
      (b) => !b.booth_type && /\b(bar|pub)\b/i.test(b.name)
    );
  },
}
```

### Step 2: Test
```bash
npx tsx scripts/apply-conservative-inference.ts
```

### Step 3: Apply
```bash
npx tsx scripts/apply-conservative-inference.ts --live
```

---

## Troubleshooting

### Script Won't Run
```bash
# Check environment
cat .env.local | grep SUPABASE

# Install dependencies
npm install

# Clear cache
rm -rf node_modules/.cache
```

### No Matches Found
```bash
# Check descriptions exist
npx tsx scripts/analyze-enrichment-results.ts

# Review patterns
# May need to add more patterns
```

### Database Connection Error
```bash
# Verify credentials
echo $SUPABASE_SERVICE_ROLE_KEY

# Check .env.local
cat .env.local
```

---

## Future Enhancements

### High Priority
1. **Venue-type inference** (bars → analog, malls → digital)
2. **Google Maps API** for hours
3. **Manual research** for costs

### Medium Priority
4. **Language support** (French, Spanish, Italian)
5. **Location-based patterns** (Berlin → analog)
6. **User contribution integration**

### Low Priority
7. **ML-based classification**
8. **API partnerships**
9. **Continuous monitoring**

---

## Documentation

- **Full Report:** `/docs/DATA_ENRICHMENT_REPORT.md`
- **Summary:** `/docs/ENRICHMENT_COMPLETE.md`
- **This Guide:** `/scripts/ENRICHMENT_README.md`

---

## Questions?

Check documentation or analyze results:
```bash
npx tsx scripts/analyze-enrichment-results.ts
npx tsx scripts/final-enrichment-report.ts
```

---

**Last Updated:** January 3, 2026
**Database:** Supabase (tmgbmcbwfkvmylmfpkzy.supabase.co)
**Total Booths:** 880
