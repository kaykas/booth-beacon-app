# Comprehensive Geocoding Audit Guide

## Overview

This guide explains the geocoding audit system designed to identify all booths with geocoding problems in the Booth Beacon database. With 10-20% of booths having coordinate issues, this audit is critical for data quality.

## Quick Start

```bash
# Step 1: Load environment variables
export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)

# Step 2: Run the audit
node scripts/geocoding-audit.js

# Step 3: Check results
cat geocoding-audit-report.json | jq '.stats'
```

## Script Files

### 1. `scripts/geocoding-audit.js` (Recommended)
- **Language**: Node.js (JavaScript)
- **No dependencies**: Uses built-in `https` module only
- **Features**:
  - Full audit with all categories
  - JSON report generation
  - CSV export for re-geocoding
  - Duplicate detection
  - Real-time console output
- **Runtime**: ~5 seconds

### 2. `scripts/geocoding-audit.ts`
- **Language**: TypeScript
- **Usage**: `npx ts-node scripts/geocoding-audit.ts`
- **Same features** as JavaScript version
- **Better type safety** for development
- **Requires ts-node** (optional dependency)

### 3. `scripts/geocoding-audit.sh`
- **Language**: Bash/Shell
- **No dependencies**: Uses curl and jq
- **Quick preview** of audit results
- **Simpler** but less detailed output
- **Good for**: Quick status checks

## Problem Categories

The audit identifies **7 distinct problem categories**:

### CRITICAL Severity

#### 1. Missing Address
- **Definition**: Address column is NULL or empty string
- **Impact**: Cannot geocode without address
- **Count**: Often 1-5% of database
- **Action**: Manual research or data entry required
- **Example**:
  ```json
  {
    "category": "MISSING_ADDRESS",
    "severity": "CRITICAL",
    "description": "Address is NULL or empty"
  }
  ```

#### 2. Missing Coordinates
- **Definition**: Latitude or longitude is NULL
- **Impact**: Cannot display on map
- **Count**: Usually 10-15% of database
- **Action**: Re-geocode using address
- **Example**:
  ```json
  {
    "category": "MISSING_COORDINATES",
    "severity": "CRITICAL",
    "description": "Latitude: NULL, Longitude: OK"
  }
  ```

### HIGH Severity

#### 3. No Street Number
- **Definition**: Address contains no digits
- **Impact**: Likely incomplete or vague address
- **Count**: Often 5-10% of problematic booths
- **Pattern**: Missing house number, zip code
- **Example**: "Main Street" instead of "123 Main Street"
- **Action**: Manual review and correction

#### 4. Business Name Only
- **Definition**: Address field equals the booth name
- **Impact**: Not a valid address, cannot geocode
- **Count**: Usually 2-5% of problematic booths
- **Example**:
  - Name: "The Photo Booth Co"
  - Address: "The Photo Booth Co" ← WRONG
- **Action**: Replace with actual street address

### MEDIUM Severity

#### 5. Incomplete Address
- **Definition**: Address string is less than 10 characters
- **Impact**: Likely missing city/state/zip
- **Count**: Often 3-8% of problematic booths
- **Example**: "123 Main St" (missing city/state)
- **Action**: Append missing address components

#### 6. Low Confidence Geocoding
- **Definition**: `geocode_confidence` = 'low'
- **Impact**: Coordinates may be inaccurate
- **Count**: Depends on geocoding source
- **Action**: Re-geocode with better source
- **Sources**: Nominatim vs Google Maps API

#### 7. Duplicate Coordinates
- **Definition**: Multiple booths at exact same lat/lng
- **Impact**: May indicate duplicate entries or clustered venues
- **Count**: Varies by geography (cities have more)
- **Action**: Verify if legitimate or merge duplicates
- **Example**:
  ```json
  {
    "coordinates": "40.7128,-74.0060",
    "boothCount": 3,
    "booths": [
      {"id": "uuid1", "name": "Booth A", "address": "..."},
      {"id": "uuid2", "name": "Booth B", "address": "..."},
      {"id": "uuid3", "name": "Booth C", "address": "..."}
    ]
  }
  ```

## Output Files

### 1. geocoding-audit-report.json

Complete audit report with full details:

```json
{
  "generated_at": "2025-12-08T12:34:56Z",
  "stats": {
    "total_booths": 912,
    "booths_with_problems": 156,
    "percentage_affected": "17.10",
    "critical_count": 34,
    "high_count": 67,
    "medium_count": 55,
    "by_category": {
      "MISSING_ADDRESS": 12,
      "NO_STREET_NUMBER": 45,
      "NAME_ONLY": 8,
      "TOO_SHORT": 23,
      "MISSING_COORDINATES": 34,
      "LOW_CONFIDENCE": 18,
      "DUPLICATE_COORDINATES": 16
    },
    "duplicate_coordinate_sets": 8,
    "booths_at_duplicate_coordinates": 16
  },
  "critical_cases": [...],
  "high_cases": [...],
  "duplicate_coordinates": [...],
  "all_affected_booths": [...],
  "affected_booth_ids": ["uuid1", "uuid2", "uuid3", ...]
}
```

### 2. affected-booths.csv

Tab-separated CSV for bulk processing:

```csv
booth_id,booth_name,address,city,country,latitude,longitude,geocode_confidence,geocode_provider,severity,problem_categories
"550e8400-e29b-41d4-a716-446655440000","The Photo Booth Co","The Photo Booth Co","New York","USA",,,"unknown","unknown","HIGH","NAME_ONLY; NO_STREET_NUMBER"
"550e8400-e29b-41d4-a716-446655440001","Snap Studio","","New York","USA",,,"unknown","unknown","CRITICAL","MISSING_ADDRESS; MISSING_COORDINATES"
```

**CSV Columns:**
- `booth_id`: UUID for database lookups
- `booth_name`: Display name
- `address`: Current address (problem indicator)
- `city`, `country`: Location info
- `latitude`, `longitude`: Current coordinates (empty if missing)
- `geocode_confidence`: Quality indicator
- `geocode_provider`: Source (google, nominatim, etc)
- `severity`: CRITICAL/HIGH/MEDIUM/LOW
- `problem_categories`: Semicolon-separated list of issues

## Interpreting Results

### Example Audit Results

```
SUMMARY STATISTICS
================================================================================
Total Booths: 912
Booths with Problems: 156 (17.10%)

By Severity:
  CRITICAL: 34
  HIGH: 67
  MEDIUM: 55

By Category:
  MISSING_COORDINATES: 34
  NO_STREET_NUMBER: 45
  TOO_SHORT: 23
  LOW_CONFIDENCE: 18
  DUPLICATE_COORDINATES: 16
  NAME_ONLY: 8
  MISSING_ADDRESS: 12
```

### What This Means

1. **912 total booths** - Database size
2. **156 with problems (17.1%)** - Aligns with expected 10-20%
3. **34 critical** - Must fix for map functionality
4. **67 high** - Should fix for data quality
5. **55 medium** - Could improve
6. **NO_STREET_NUMBER (45)** - Most common issue
7. **MISSING_COORDINATES (34)** - Most blocking issue

### Priority Matrix

```
Priority  Count  Effort    Impact       Action
=========================================================
CRITICAL   34    High      Blocking     Immediate
HIGH       67    Medium    Degrading    Week 1
MEDIUM     55    Low       Cosmetic     Week 2-3
LOW         0    Very Low  Minimal      Backlog
```

## Fixing Geocoding Issues

### 1. For Missing Coordinates

**Process:**
1. Export booth ID and address from CSV
2. Use Nominatim or Google Maps Geocoding API
3. Get lat/lng
4. Update database

**Example:**
```sql
UPDATE booths
SET latitude = 40.7128, longitude = -74.0060,
    geocode_confidence = 'high', geocode_provider = 'nominatim'
WHERE id = 'booth-uuid'
  AND latitude IS NULL;
```

### 2. For Missing/Incomplete Address

**Data Research:**
1. Use booth name to search online
2. Check Google Maps for phone/address
3. Verify with operator if possible
4. Update address field

**Example:**
```sql
UPDATE booths
SET address = '123 Main Street, New York, NY 10001'
WHERE id = 'booth-uuid'
  AND (address IS NULL OR address = '');
```

### 3. For Name-Only Addresses

**Pattern:**
- Name: "Time Machine Photo Booth"
- Address (WRONG): "Time Machine Photo Booth"
- Address (RIGHT): "456 Park Avenue, Denver, CO 80202"

**Fix:**
```sql
UPDATE booths
SET address = (SELECT DISTINCT venue_address FROM external_source WHERE vendor_id = booth_id)
WHERE address = name;
```

### 4. For Duplicate Coordinates

**Options:**

A) **Verify they're different booths**
```sql
SELECT * FROM booths
WHERE latitude = 40.7128 AND longitude = -74.0060;
-- Review each booth's details
```

B) **Consolidate if duplicate**
```sql
-- Merge booth 2 into booth 1
DELETE FROM booths WHERE id = 'booth-2-uuid';
-- Or mark as duplicate
UPDATE booths SET status = 'duplicate' WHERE id = 'booth-2-uuid';
```

### 5. For Low Confidence Geocodes

**Re-geocode with better service:**
```bash
# Use Google Maps API instead of Nominatim
node scripts/run-geocoding.js --use-google --boost-confidence-threshold

# Or re-geocode specific booths
node scripts/run-geocoding.js affected-booths.csv --force-redo
```

## Batch Operations

### Export Only Critical Issues

```bash
node -e "
const fs = require('fs');
const report = JSON.parse(fs.readFileSync('geocoding-audit-report.json'));
const critical = report.critical_cases.map(b => b.id).join('\n');
fs.writeFileSync('critical-booths.txt', critical);
console.log('Exported', critical.split('\n').length, 'critical booth IDs');
"
```

### Create Re-geocoding Queue

```bash
jq -r '.affected_booth_ids[]' geocoding-audit-report.json > re-geocode-queue.txt
wc -l re-geocode-queue.txt  # Count how many
```

### Update Confidence Levels in Bulk

```sql
-- Update low confidence to medium after manual review
UPDATE booths
SET geocode_confidence = 'medium'
WHERE id = ANY($1::uuid[])
  AND geocode_confidence = 'low';
-- Pass array of booth IDs as parameter
```

## Integration with Other Scripts

### Use with run-geocoding.js

```bash
# 1. Generate audit
export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)
node scripts/geocoding-audit.js

# 2. Run geocoding on affected booths
node scripts/run-geocoding.js affected-booths.csv

# 3. Re-run audit to verify
node scripts/geocoding-audit.js

# 4. Compare reports
diff <(jq '.stats' geocoding-audit-report-1.json) <(jq '.stats' geocoding-audit-report-2.json)
```

### Use with check-missing-coordinates.js

```bash
# Quick status
node scripts/check-missing-coordinates.js

# Get detailed audit
node scripts/geocoding-audit.js

# Focus on only missing coordinates
jq '.all_affected_booths[] | select(.problems[].category == "MISSING_COORDINATES")' geocoding-audit-report.json | head -20
```

## Troubleshooting

### Issue: "Cannot find module 'https'"

- Using very old Node.js version
- Solution: Update to Node 12+ (you have 24.1.0, so OK)

### Issue: "HTTP 401: Unauthorized"

- Service role key is wrong or expired
- Solution: Check `.env.local` has correct key

### Issue: "HTTP 429: Too Many Requests"

- Rate limited by Supabase
- Solution: Wait a few seconds, retry

### Issue: "CSV file has wrong encoding"

- Solution: Re-save as UTF-8 in your editor
- Or: `iconv -f UTF-8 -t UTF-8 affected-booths.csv > fixed.csv`

### Issue: "jq command not found"

- Shell script needs jq
- Solution: `brew install jq` or use Node.js version instead

## Performance Benchmarks

```
Operation           Time      Notes
==========================================
Fetch all booths    1-2s      API request
Analyze problems    0.5s      In-memory processing
Generate reports    1-2s      JSON serialization
Write CSV           0.5s      File I/O
Total               3-5s      Typical runtime
```

Memory usage: ~50-100 MB for 900 booths

## Database Impact

- **Read-only** operation (no data modified)
- Uses Supabase REST API with limit=10000
- Respects row-level security (RLS)
- No performance impact on database

## Security Considerations

### What the Script Does

- Reads: booth names, addresses, coordinates, metadata
- Creates: local JSON and CSV files
- Does NOT modify: database
- Does NOT upload: data anywhere

### What You Should Do

- Keep `.env.local` confidential (not in git)
- Don't commit generated reports to git if they contain sensitive data
- Delete old reports if they contain deprecated information
- Review audit results before sharing

### File Permissions

```bash
# Make script executable
chmod +x scripts/geocoding-audit.js

# Output files are readable by owner only
chmod 600 geocoding-audit-report.json affected-booths.csv
```

## Quality Metrics

### Target Goals (Week 1)

- [ ] 100% of critical issues resolved
- [ ] 95%+ of booths with valid addresses
- [ ] 90%+ of booths with coordinates
- [ ] <5% duplicate coordinates (legitimate multi-unit venues)
- [ ] <10% low confidence geocodes

### Tracking Progress

```bash
# Run weekly audit
for week in {1..4}; do
  node scripts/geocoding-audit.js > audit-week-$week.json
  jq '.stats' audit-week-$week.json
done

# Compare improvements
echo "Week 1:"; jq '.stats.booths_with_problems' audit-week-1.json
echo "Week 2:"; jq '.stats.booths_with_problems' audit-week-2.json
echo "Improvement:"; echo "$(jq '.stats.booths_with_problems' audit-week-1.json) - $(jq '.stats.booths_with_problems' audit-week-2.json)" | bc
```

## Documentation

- **This file**: Comprehensive guide
- **GEOCODING-AUDIT-README.md**: Quick reference
- **scripts/**: Actual audit scripts
- **MASTER_TODO_LIST.md**: Project priorities
- **supabase/migrations/**: Database schema

## Support

If you need help:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review example output in this guide
3. Check the script's inline comments
4. Review MASTER_TODO_LIST.md for context

## Related Audit Scripts

- **check-missing-coordinates.js** - Quick status check
- **run-geocoding.js** - Batch geocoding processor
- **geocode-all-batches.sh** - Automated geocoding workflow
- **verify-seed-setup.sh** - Verify crawler setup

---

**Last Updated**: 2025-12-08
**Script Version**: 1.0
**Database Version**: PostgreSQL 15+
**Node Version**: 12.0+ (you have 24.1.0)
