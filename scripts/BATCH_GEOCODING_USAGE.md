# Batch Geocoding Fix Script

## Overview

The `fix-geocoding-batch.ts` script re-geocodes booths in batch mode with the following capabilities:

1. **Intelligent Address Validation**
   - Checks if address is complete (has street number, not just business name)
   - Stores old coordinates as backup
   - Validates address before geocoding

2. **Multi-Provider Geocoding**
   - Google Maps API (if available)
   - Nominatim/OpenStreetMap (free, always available)
   - City centroid fallback

3. **Confidence Tracking**
   - HIGH: Rooftop-level accuracy (Google) or high importance (Nominatim)
   - MEDIUM: Address-level accuracy
   - LOW: City-level or approximate results (flagged for manual review)

4. **Rate Limiting**
   - Respects Nominatim's 1 request/second limit
   - Exponential backoff on failures
   - Safe for large batch operations

5. **Comprehensive Reporting**
   - JSON report with full details
   - Flagged low-confidence results for manual review
   - Failed geocoding list for manual correction

## Usage

### Prerequisites

Set environment variables:
```bash
source <(grep SUPABASE_SERVICE_ROLE_KEY .env.local)
source <(grep GOOGLE_MAPS_API_KEY_BACKEND .env.local) || source <(grep GOOGLE_MAPS_API_KEY .env.local)
export NEXT_PUBLIC_SUPABASE_URL="https://tmgbmcbwfkvmylmfpkzy.supabase.co"
```

### Process Specific Booth IDs from CSV

```bash
npx ts-node scripts/fix-geocoding-batch.ts --csv audit_results.csv
```

CSV format (single column):
```csv
booth_id
id1
id2
id3
```

### Process Specific Booth IDs Directly

```bash
npx ts-node scripts/fix-geocoding-batch.ts --booth-ids "id1,id2,id3"
```

### Process All Booths

```bash
npx ts-node scripts/fix-geocoding-batch.ts --all
```

## Output

### Console Output
- Real-time progress for each booth
- Confidence level and provider
- Coordinates for verification
- Low-confidence and failed booths highlighted

### JSON Report
Saved as: `scripts/geocoding-report-YYYY-MM-DD.json`

Structure:
```json
{
  "timestamp": "2025-12-08T00:00:00Z",
  "summary": {
    "total": 10,
    "successful": 7,
    "lowConfidence": 2,
    "failed": 1,
    "successRate": "70.0%"
  },
  "updates": [
    {
      "boothId": "id1",
      "boothName": "Booth Name",
      "oldLatitude": 38.123,
      "oldLongitude": -122.456,
      "newLatitude": 38.124,
      "newLongitude": -122.455,
      "confidence": "high",
      "provider": "google",
      "addressWasIncomplete": false,
      "status": "success"
    }
  ]
}
```

## Workflow Example

### 1. Get Audit Results from Audit Agent
The audit agent provides a CSV of problematic booth IDs.

### 2. Run Batch Geocoding
```bash
source <(grep SUPABASE_SERVICE_ROLE_KEY .env.local)
export NEXT_PUBLIC_SUPABASE_URL="https://tmgbmcbwfkvmylmfpkzy.supabase.co"

npx ts-node scripts/fix-geocoding-batch.ts --csv audit_results.csv
```

### 3. Review Report
- Check the generated JSON report
- Manually verify low-confidence results
- Correct any failed addresses in the database

### 4. Verify in Production
- Check the map view to ensure booths appear correctly
- Verify Street View coordinates match

## Address Completion Logic

An address is considered **complete** if it:
- Contains at least one digit (street number)
- Is NOT just the business name
- Has at least 5 characters

Examples:

**Complete Addresses:**
- "46 Kentucky St"
- "123 Main Street"
- "456 Park Ave, Building A"

**Incomplete Addresses (will trigger address lookup):**
- "Booth Beacon"
- "Photo Booth Store"
- "Main Street" (no number)
- "" (empty)

## Geocoding Cascade

For each booth:

1. **If address is complete:**
   - Try Google Maps API (if key available)
   - Try Nominatim/OSM
   - Fall back to city centroid

2. **If address is incomplete:**
   - Attempt to fetch from address lookup
   - If successful: geocode with full address
   - If failed: use city centroid fallback

## Manual Review

### Low-Confidence Results
Check these against Google Maps/Street View:
- Visit booth's Google Maps listing
- Verify coordinates match actual location
- Update manually if needed

Example verification:
```
⚠️ Heebe Jeebe General Store
→ 38.2333537, -122.6408153 (google)
https://www.google.com/maps/@38.2333537,-122.6408153,19z
```

### Failed Geocoding
These require manual address correction:
1. Search for the booth online
2. Find correct address
3. Update database manually or via script
4. Re-run geocoding

## Performance Notes

- Processing time: ~1.2 seconds per booth (due to Nominatim rate limit)
- 100 booths ≈ 2 minutes
- 1000 booths ≈ 20 minutes
- Script can be interrupted and resumed (uses booth IDs as checkpoints)

## Troubleshooting

### "Missing SUPABASE_SERVICE_ROLE_KEY"
```bash
source <(grep SUPABASE_SERVICE_ROLE_KEY .env.local)
```

### "Cannot find module @supabase/supabase-js"
Run from project root directory:
```bash
cd /Users/jkw/Projects/booth-beacon-app
npx ts-node scripts/fix-geocoding-batch.ts ...
```

### Google Maps API errors
- Verify `GOOGLE_MAPS_API_KEY_BACKEND` is set
- Check API quota in Google Cloud Console
- Script will continue with Nominatim if Google fails

### Rate limit errors from Nominatim
- Script implements automatic backoff
- Do not reduce sleep time below 1100ms
- Consider running in smaller batches

## Integration with Audit Agent

The audit agent provides CSV of problematic booths:
```bash
npx ts-node scripts/fix-geocoding-batch.ts --csv audit_results.csv
```

After fixing:
1. Capture geocoding report
2. Pass back to audit agent for verification
3. Update master TODO list with results
4. Deploy changes to production

## Database Schema

The script updates these columns:
- `latitude` - New latitude
- `longitude` - New longitude
- `geocoded_at` - When geocoding occurred
- `geocode_provider` - Which service was used
- `geocode_confidence` - Confidence level
- `previous_latitude` - Old latitude (backup)
- `previous_longitude` - Old longitude (backup)
- `updated_at` - Update timestamp

Note: `previous_latitude` and `previous_longitude` columns must exist for backup functionality.
If they don't exist, update will still work without storing backups.
