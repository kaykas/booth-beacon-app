# Geocoding Audit Script

This audit script identifies all booths with geocoding problems in the database.

## Features

The audit script analyzes booths and identifies:

1. **Missing Address** (CRITICAL) - Address is NULL or empty
2. **No Street Number** (HIGH) - Address contains no digits (likely incomplete)
3. **Business Name Only** (HIGH) - Address is the same as the booth name
4. **Incomplete Address** (MEDIUM) - Address is too short (< 10 characters)
5. **Missing Coordinates** (CRITICAL) - Latitude or longitude is NULL
6. **Low Confidence Geocoding** (MEDIUM) - Geocode confidence is "low"
7. **Duplicate Coordinates** (MEDIUM) - Multiple booths at exact same coordinates

## Output

The script generates:

1. **geocoding-audit-report.json** - Detailed JSON report with:
   - Summary statistics
   - Count by category
   - Top 20 critical cases
   - Top 20 high priority cases
   - All duplicate coordinate issues
   - Complete list of all affected booths

2. **affected-booths.csv** - CSV export for re-geocoding:
   - All affected booth IDs
   - Complete address and location info
   - Current coordinates
   - Geocoding confidence levels
   - Problem categories

## Running the Script

### Option 1: Node.js (Recommended)

```bash
# Load environment variables
export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)

# Run the audit
node scripts/geocoding-audit.js
```

### Option 2: Using ts-node (TypeScript)

```bash
# Install ts-node locally if needed
npm install -D ts-node

# Load environment variables
export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)

# Run the audit
npx ts-node scripts/geocoding-audit.ts
```

### Option 3: Direct Database Query (Manual)

If you prefer to run the analysis directly against the database:

```sql
-- Count total booths
SELECT COUNT(*) as total_booths FROM booths;

-- Find booths missing address
SELECT id, name, address FROM booths
WHERE address IS NULL OR address = ''
LIMIT 20;

-- Find booths with no coordinates
SELECT id, name, address, latitude, longitude FROM booths
WHERE latitude IS NULL OR longitude IS NULL
LIMIT 20;

-- Find booths at duplicate coordinates
SELECT latitude, longitude, COUNT(*) as booth_count
FROM booths
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
GROUP BY latitude, longitude
HAVING COUNT(*) > 1
ORDER BY booth_count DESC
LIMIT 20;

-- Find low confidence geocodes
SELECT id, name, address, geocode_confidence, geocode_provider
FROM booths
WHERE geocode_confidence = 'low'
LIMIT 20;
```

## Understanding the Results

### Summary Statistics

- **Total Booths**: Total number of booths in the database
- **Booths with Problems**: Count and percentage of affected booths
- **By Severity**: Breakdown of CRITICAL, HIGH, MEDIUM, LOW
- **By Category**: Count of each problem type
- **Duplicate Coordinates**: Number of coordinate sets and booths affected

### Severity Levels

- **CRITICAL**: Must fix before these booths can be used on maps
  - Missing coordinates
  - Missing address entirely

- **HIGH**: Should fix for better data quality
  - No street number in address
  - Address same as business name
  - Invalid formatting

- **MEDIUM**: Could improve
  - Address too short
  - Low confidence geocoding
  - Duplicate coordinates

- **LOW**: Minor issues

### Next Steps

1. **Review the JSON report** for detailed analysis of each booth
2. **Export the CSV** for bulk re-geocoding operations
3. **Focus on CRITICAL cases first** - these prevent map display
4. **Consider re-geocoding** booths with incomplete addresses
5. **Consolidate duplicates** - merge booths at same coordinates
6. **Update geocoding confidence** after re-geocoding

## Re-geocoding Workflow

After running the audit:

1. Export the CSV file with affected booths
2. Use the Nominatim or Google Maps API to re-geocode
3. Update the database with corrected coordinates
4. Run the audit again to verify improvements

Example re-geocoding command:

```bash
# For booths with missing coordinates
node scripts/run-geocoding.js affected-booths.csv

# Or use the batch geocoding script
bash scripts/geocode-all-batches.sh
```

## CSV Format

The affected-booths.csv contains:

```
booth_id,booth_name,address,city,country,latitude,longitude,geocode_confidence,geocode_provider,severity,problem_categories
"UUID","Name","Address","City","Country",40.1234,-74.5678,"confidence_level","provider","SEVERITY","CATEGORY1; CATEGORY2"
```

## Troubleshooting

### Environment Variable Not Set

```bash
# Make sure SUPABASE_SERVICE_ROLE_KEY is exported
export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)

# Verify it's set
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Connection Issues

- Verify your internet connection
- Check Supabase is accessible: `curl https://tmgbmcbwfkvmylmfpkzy.supabase.co`
- Ensure the service role key is correct and not expired

### File Permission Issues

```bash
# Make script executable
chmod +x scripts/geocoding-audit.js

# Or just use node directly
node scripts/geocoding-audit.js
```

## Performance

- Fetches all ~900 booths from database (typically < 2 seconds)
- Analyzes for problems (< 1 second)
- Generates reports and CSV (< 1 second)
- Total runtime: Usually under 5 seconds

## Security Notes

- The script uses the Supabase Service Role Key
- Sensitive environment variables are only in .env.local (not committed to git)
- Output reports contain booth coordinates and details
- Treat reports as sensitive information

## Related Scripts

- **run-geocoding.js** - Geocode booths using Nominatim API
- **check-missing-coordinates.js** - Quick status check
- **geocode-all-batches.sh** - Batch geocoding workflow

## Support

For issues or questions, refer to:
- MASTER_TODO_LIST.md for project priorities
- /supabase/migrations/ for database schema
- src/types/index.ts for TypeScript types
