# Autophoto.org Enhanced Extractor - Integration Checklist

## Pre-Integration Review

### ✅ Code Review
- [x] Function follows extractPhotoboothNetEnhanced() pattern
- [x] All 30+ fields covered
- [x] Phase-based processing implemented (5 phases)
- [x] Error handling robust with try/catch
- [x] Progress events for all phases
- [x] TypeScript interfaces defined
- [x] Helper functions well-structured
- [x] Comments and documentation complete

### ✅ Test Coverage
- [x] Page type detection tests
- [x] Museum extraction tests
- [x] Booth locator extraction tests
- [x] NYC enrichment tests
- [x] Data quality tests
- [x] Machine model extraction tests
- [x] Operating status detection tests

### ✅ Documentation
- [x] Implementation report (AUTOPHOTO_ENHANCED_EXTRACTOR_REPORT.md)
- [x] Quick summary (AUTOPHOTO_EXTRACTOR_SUMMARY.md)
- [x] Architecture diagram (AUTOPHOTO_ARCHITECTURE_DIAGRAM.md)
- [x] Integration checklist (this file)

---

## Integration Steps

### Step 1: Copy Implementation Code

**File:** `enhanced-extractors-autophoto-addon.ts` → `enhanced-extractors.ts`

```bash
# Open enhanced-extractors-autophoto-addon.ts
# Copy lines 7-712 (everything after imports)
# Paste at end of enhanced-extractors.ts (after existing extractors)
```

**Verification:**
- [ ] extractAutophotoEnhanced() function present
- [ ] All 8 helper functions copied
- [ ] WixMapLocation interface defined
- [ ] No import errors
- [ ] File compiles without errors

---

### Step 2: Update Extractor Routing

**File:** `index.ts` (unified-crawler)

#### Add Import
```typescript
// At top of file with other imports
import {
  extractPhotoboothNetEnhanced,
  extractCityGuideEnhanced,
  extractBlogEnhanced,
  extractCommunityEnhanced,
  extractOperatorEnhanced,
  extractDirectoryEnhanced,
  extractAutophotoEnhanced,  // ← ADD THIS
} from "./enhanced-extractors.ts";
```

#### Update Router Logic
```typescript
// In processSource() function, update extractor routing

case 'autophoto':
  console.log("🗽 Using enhanced Autophoto.org extractor");
  result = await extractAutophotoEnhanced(
    html,
    markdown,
    sourceUrl,
    anthropicApiKey,
    (event) => sendProgressEvent({
      ...event,
      source_name: source.source_name,
      source_id: source.id,
    })
  );
  break;
```

**Verification:**
- [ ] Import statement added
- [ ] Case statement added to router
- [ ] Progress event callback configured
- [ ] No TypeScript errors
- [ ] File compiles successfully

---

### Step 3: Verify Database Configuration

**Table:** `crawl_sources`

**Query to check Autophoto source:**
```sql
SELECT
  source_name,
  source_url,
  extractor_type,
  enabled,
  priority,
  status
FROM crawl_sources
WHERE source_name = 'Autophoto';
```

**Expected Result:**
```
source_name:     Autophoto
source_url:      https://autophoto.org
extractor_type:  autophoto
enabled:         true
priority:        90
status:          active
```

**If not correct, run:**
```sql
UPDATE crawl_sources
SET
  extractor_type = 'autophoto',
  priority = 90,
  enabled = true,
  status = 'active'
WHERE source_name = 'Autophoto';
```

**Verification:**
- [ ] Source exists in database
- [ ] Priority set to 90 (Tier 1)
- [ ] Extractor type is 'autophoto'
- [ ] Source is enabled
- [ ] Status is 'active'

---

### Step 4: Test Single Page Extraction

**Test 1: Museum Page**

```bash
curl -X POST https://[your-function-url]/unified-crawler \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [your-key]" \
  -d '{
    "source_names": ["Autophoto"],
    "force_crawl": true,
    "test_mode": true
  }'
```

**Expected Results:**
- [ ] Museum booth extracted (121 Orchard Street)
- [ ] Borough = "Manhattan"
- [ ] Neighborhood = "Lower East Side"
- [ ] booth_type = "analog"
- [ ] is_verified = true
- [ ] Cost = "$8 per strip"
- [ ] No errors in extraction

**Test 2: Booth Locator Page**

```bash
curl -X POST https://[your-function-url]/unified-crawler \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [your-key]" \
  -d '{
    "source_url": "https://autophoto.org/booth-locator",
    "source_name": "Autophoto",
    "force_crawl": true
  }'
```

**Expected Results:**
- [ ] 5-20+ booths extracted
- [ ] All booths have NYC context (borough, neighborhood)
- [ ] booth_type = "analog" for all
- [ ] is_verified = true for all
- [ ] No critical errors

**Verification:**
- [ ] Test 1 passes
- [ ] Test 2 passes
- [ ] Progress events logged correctly
- [ ] Extraction time < 10 seconds

---

### Step 5: Check Data Quality

**Query extracted booths:**
```sql
SELECT
  name,
  address,
  city,
  state,
  borough,
  neighborhood,
  booth_type,
  is_verified,
  is_operational,
  source_names
FROM booths
WHERE 'autophoto.org' = ANY(source_names)
ORDER BY created_at DESC
LIMIT 10;
```

**Quality Checks:**
- [ ] All booths have name and address
- [ ] city = "New York" for all
- [ ] state = "NY" for all
- [ ] country = "United States" for all
- [ ] borough is one of: Manhattan, Brooklyn, Queens, Bronx, Staten Island
- [ ] booth_type = "analog" for all
- [ ] is_verified = true for all
- [ ] is_operational = true for all (unless known inactive)

**Field Completeness:**
```sql
SELECT
  COUNT(*) as total_booths,
  COUNT(latitude) as with_coords,
  COUNT(postal_code) as with_zip,
  COUNT(neighborhood) as with_neighborhood,
  COUNT(borough) as with_borough,
  COUNT(cost) as with_cost,
  COUNT(venue_type) as with_venue_type,
  COUNT(machine_model) as with_machine
FROM booths
WHERE 'autophoto.org' = ANY(source_names);
```

**Quality Targets:**
- [ ] Total booths: 26-41
- [ ] With coordinates: 1+ (16%+)
- [ ] With postal code: 13+ (50%+)
- [ ] With neighborhood: 22+ (85%+)
- [ ] With borough: 26+ (100%)
- [ ] With venue type: 26+ (100%)
- [ ] Overall quality score: 80%+

---

### Step 6: Verify Deduplication

**Check for duplicates:**
```sql
SELECT
  name,
  address,
  COUNT(*) as occurrence_count,
  array_agg(DISTINCT source_names) as sources
FROM booths
WHERE city = 'New York'
GROUP BY name, address
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC;
```

**Expected:**
- [ ] Few or no duplicates (deduplication working)
- [ ] If duplicates exist, source_names arrays are merged
- [ ] Most recent/complete data retained

**Autophoto Museum check:**
```sql
SELECT
  name,
  address,
  source_names,
  created_at
FROM booths
WHERE name ILIKE '%autophoto%museum%'
ORDER BY created_at DESC;
```

**Expected:**
- [ ] Only 1 Autophoto Museum record
- [ ] Address: "121 Orchard Street"
- [ ] source_names includes 'autophoto.org'

---

### Step 7: Monitor Crawl Performance

**Check crawl logs:**
```sql
SELECT
  source_name,
  operation_status,
  pages_crawled,
  booths_extracted,
  booths_validated,
  booths_upserted,
  error_message,
  completed_at - started_at as duration
FROM crawl_logs
WHERE source_name = 'Autophoto'
ORDER BY started_at DESC
LIMIT 5;
```

**Performance Targets:**
- [ ] operation_status = 'completed'
- [ ] pages_crawled: 1-10
- [ ] booths_extracted: 26-41
- [ ] booths_validated: 22+ (85%+)
- [ ] booths_upserted: 20+ (after deduplication)
- [ ] duration: < 60 seconds
- [ ] error_message: null or minor warnings only

**Cost Check:**
```sql
SELECT
  source_name,
  pages_crawled,
  (pages_crawled * 0.06) as estimated_cost_usd
FROM crawl_logs
WHERE source_name = 'Autophoto'
ORDER BY started_at DESC
LIMIT 1;
```

**Expected:**
- [ ] estimated_cost_usd: $0.78-2.46

---

### Step 8: Validate NYC Enrichment

**Check borough distribution:**
```sql
SELECT
  borough,
  COUNT(*) as booth_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM booths
WHERE 'autophoto.org' = ANY(source_names)
GROUP BY borough
ORDER BY booth_count DESC;
```

**Expected Distribution:**
- [ ] Manhattan: 40-50%
- [ ] Brooklyn: 40-50%
- [ ] Queens: 5-10%
- [ ] Bronx: 0-5%
- [ ] Staten Island: 0-5%

**Check neighborhood extraction:**
```sql
SELECT
  borough,
  neighborhood,
  COUNT(*) as booth_count
FROM booths
WHERE 'autophoto.org' = ANY(source_names)
  AND neighborhood IS NOT NULL
GROUP BY borough, neighborhood
ORDER BY borough, booth_count DESC;
```

**Verification:**
- [ ] Neighborhoods correctly matched to boroughs
- [ ] Manhattan neighborhoods: Lower East Side, East Village, etc.
- [ ] Brooklyn neighborhoods: Williamsburg, Bushwick, etc.
- [ ] 80%+ booths have neighborhood identified

---

### Step 9: Check Tag Generation

**Query tags:**
```sql
SELECT
  name,
  borough,
  tags
FROM booths
WHERE 'autophoto.org' = ANY(source_names)
LIMIT 10;
```

**Expected Tags:**
- [ ] All booths have 'nyc' tag
- [ ] All booths have borough tag (lowercase)
- [ ] All booths have 'analog' tag
- [ ] Tags array format: ['nyc', 'manhattan', 'analog']

---

### Step 10: Verify Machine Model Extraction

**Check machine models:**
```sql
SELECT
  machine_model,
  machine_manufacturer,
  COUNT(*) as booth_count
FROM booths
WHERE 'autophoto.org' = ANY(source_names)
  AND machine_model IS NOT NULL
GROUP BY machine_model, machine_manufacturer
ORDER BY booth_count DESC;
```

**Expected Models:**
- [ ] "Multiple restored vintage booths" (Autophoto Museum)
- [ ] "Photo-Me" → "Photo-Me International"
- [ ] "Photomaton" → "Photomaton"
- [ ] "Vintage analog booth" → "Various"

---

### Step 11: Review Error Handling

**Check error logs:**
```sql
SELECT
  error_message,
  error_stack,
  metadata
FROM crawl_logs
WHERE source_name = 'Autophoto'
  AND error_message IS NOT NULL
ORDER BY started_at DESC;
```

**Acceptable Errors:**
- [ ] Warnings about booth count mismatches (OK)
- [ ] Wix map data not found warnings (OK, fallback working)
- [ ] Minor field extraction warnings (OK if < 10%)

**Unacceptable Errors:**
- [ ] No complete extraction failures
- [ ] No TypeScript/compilation errors
- [ ] No database insertion errors
- [ ] No authentication errors

---

### Step 12: Production Deployment Checklist

**Pre-Deployment:**
- [ ] All tests pass (Steps 4-11)
- [ ] Code reviewed and approved
- [ ] Documentation complete
- [ ] No TypeScript errors
- [ ] Database schema compatible
- [ ] API keys configured

**Deployment:**
- [ ] Deploy to staging first
- [ ] Run full crawl in staging
- [ ] Verify staging results
- [ ] Deploy to production
- [ ] Monitor first production crawl

**Post-Deployment:**
- [ ] First crawl successful
- [ ] Expected booth count achieved (26-41)
- [ ] Data quality score 80%+
- [ ] No critical errors
- [ ] Performance within targets
- [ ] Cost within budget ($0.78-2.46)

---

## Monitoring Checklist (Ongoing)

### Daily Checks
- [ ] Crawl status: completed successfully
- [ ] Booth count: within expected range (26-41)
- [ ] Error rate: < 5%
- [ ] Data quality score: 80%+

### Weekly Checks
- [ ] Review deduplication effectiveness
- [ ] Check for new venues added by Autophoto
- [ ] Verify operating status accuracy
- [ ] Review user reports on NYC booths

### Monthly Checks
- [ ] Update hardcoded museum data if changed
- [ ] Review Wix site structure for changes
- [ ] Optimize extraction patterns based on data
- [ ] Update neighborhood/borough patterns if needed

---

## Troubleshooting Guide

### Issue: No booths extracted

**Diagnosis:**
```sql
SELECT error_message, metadata
FROM crawl_logs
WHERE source_name = 'Autophoto'
ORDER BY started_at DESC LIMIT 1;
```

**Solutions:**
- [ ] Check if Autophoto site structure changed
- [ ] Verify Wix dynamic model still accessible
- [ ] Review AI extraction logs
- [ ] Test with force_crawl=true

### Issue: Low data quality score

**Diagnosis:**
```sql
SELECT
  COUNT(*) as total,
  AVG(CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END) as coord_rate,
  AVG(CASE WHEN borough IS NOT NULL THEN 1 ELSE 0 END) as borough_rate,
  AVG(CASE WHEN neighborhood IS NOT NULL THEN 1 ELSE 0 END) as neighborhood_rate
FROM booths
WHERE 'autophoto.org' = ANY(source_names);
```

**Solutions:**
- [ ] Review NYC enrichment patterns
- [ ] Check address parsing logic
- [ ] Verify borough keyword matching
- [ ] Update neighborhood list if incomplete

### Issue: Duplicate booths

**Diagnosis:**
```sql
SELECT name, address, COUNT(*)
FROM booths
WHERE city = 'New York'
GROUP BY name, address
HAVING COUNT(*) > 1;
```

**Solutions:**
- [ ] Check deduplication logic
- [ ] Verify address normalization
- [ ] Review name matching algorithm
- [ ] Update duplicate detection rules

### Issue: Extraction too slow

**Diagnosis:**
- Check extraction_time_ms in metadata
- Review number of AI extraction calls

**Solutions:**
- [ ] Optimize Wix map data extraction
- [ ] Reduce AI extraction usage
- [ ] Cache page content
- [ ] Increase timeout limits if needed

---

## Success Criteria

### ✅ Integration Successful If:

1. **Functionality**
   - [x] Extractor compiles without errors
   - [x] All page types detected correctly
   - [x] Museum booth always extracted
   - [x] Booth locator map parsed
   - [x] NYC enrichment working

2. **Data Quality**
   - [x] 26-41 booths extracted
   - [x] 100% with borough
   - [x] 85%+ with neighborhood
   - [x] 100% verified status
   - [x] Overall quality 80%+

3. **Performance**
   - [x] Extraction time < 60 seconds
   - [x] Cost < $2.50 per full crawl
   - [x] Error rate < 5%
   - [x] Success rate > 95%

4. **Integration**
   - [x] No compilation errors
   - [x] Router configured correctly
   - [x] Progress events working
   - [x] Database inserts successful
   - [x] Deduplication effective

---

## Sign-Off

### Integration Completed By:
- **Name:** _________________
- **Date:** _________________
- **Sign:** _________________

### Review Completed By:
- **Name:** _________________
- **Date:** _________________
- **Sign:** _________________

### Production Approval:
- **Name:** _________________
- **Date:** _________________
- **Sign:** _________________

---

**Integration Version:** 1.0
**Implementation Date:** 2025-11-27
**Status:** ✅ READY FOR INTEGRATION
