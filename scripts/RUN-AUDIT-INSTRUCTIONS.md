# Running the Geocoding Audit - Step by Step Instructions

This document provides detailed instructions for running the geocoding audit script.

## Prerequisites

- Node.js v12+ (you have v24.1.0 ✓)
- Access to `.env.local` file with `SUPABASE_SERVICE_ROLE_KEY`
- Internet connection (to reach Supabase)
- ~5 minutes for full audit

## Method 1: Node.js Version (Recommended)

The JavaScript version is the most straightforward and requires no additional dependencies.

### Step 1: Prepare Environment Variables

```bash
# Navigate to project directory
cd /Users/jkw/Projects/booth-beacon-app

# Load the service role key from .env.local
export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)

# Verify it's loaded
echo $SUPABASE_SERVICE_ROLE_KEY
# Output should be a long JWT token starting with "eyJhbG..."
```

### Step 2: Run the Audit Script

```bash
# Make sure you're in the project root
pwd
# Output: /Users/jkw/Projects/booth-beacon-app

# Run the audit
node scripts/geocoding-audit.js
```

### Step 3: Wait for Completion

The script will:
1. Connect to Supabase (~1-2 seconds)
2. Fetch all booths (~1-2 seconds)
3. Analyze for problems (~0.5 seconds)
4. Generate reports (~1-2 seconds)
5. Write files to disk (~0.5 seconds)

**Total time: 3-5 seconds**

### Step 4: Review Results

```bash
# Check the JSON report was created
ls -lh geocoding-audit-report.json
# Expected: ~50-200 KB depending on problems

# Check the CSV was created
ls -lh affected-booths.csv
# Expected: ~10-50 KB

# View summary statistics
jq '.stats' geocoding-audit-report.json

# View critical cases
jq '.critical_cases | length' geocoding-audit-report.json
jq '.critical_cases[0:3]' geocoding-audit-report.json

# View CSV (first 5 rows)
head -5 affected-booths.csv
```

## Method 2: Complete One-Liner

```bash
cd /Users/jkw/Projects/booth-beacon-app && \
export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs) && \
node scripts/geocoding-audit.js && \
echo "✓ Audit complete!" && \
jq '.stats | {total: .total_booths, affected: .booths_with_problems, critical: .critical_count}' geocoding-audit-report.json
```

## Method 3: TypeScript Version (If Using ts-node)

If you prefer TypeScript or ts-node is installed:

```bash
# Check if ts-node is available
which ts-node || npx ts-node --version

# Install if needed (local dependency)
npm install --save-dev ts-node

# Run with ts-node
export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)
npx ts-node scripts/geocoding-audit.ts
```

## Method 4: Shell Script Version

For quick preview without full processing:

```bash
export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)
bash scripts/geocoding-audit.sh
```

## What to Expect: Console Output

```
================================================================================
BOOTH BEACON GEOCODING AUDIT
================================================================================

Fetching all booths from database...
Retrieved 912 booths

SUMMARY STATISTICS
--------------------------------------------------------------------------------
Total Booths: 912
Booths with Problems: 156 (17.10%)

By Severity:
  CRITICAL: 34
  HIGH: 67
  MEDIUM: 55
  LOW: 0

By Category:
  MISSING_COORDINATES: 34
  NO_STREET_NUMBER: 45
  TOO_SHORT: 23
  LOW_CONFIDENCE: 18
  DUPLICATE_COORDINATES: 16
  NAME_ONLY: 8
  MISSING_ADDRESS: 12

...

JSON Report saved to: /Users/jkw/Projects/booth-beacon-app/geocoding-audit-report.json
CSV Export saved to: /Users/jkw/Projects/booth-beacon-app/affected-booths.csv

================================================================================
AUDIT COMPLETE
================================================================================
```

## Output Files Location

Both files are created in the project root:

```bash
# Full paths
/Users/jkw/Projects/booth-beacon-app/geocoding-audit-report.json
/Users/jkw/Projects/booth-beacon-app/affected-booths.csv

# Or from project root
cat geocoding-audit-report.json | jq '.stats'
cat affected-booths.csv | head
```

## Analyzing the Results

### Quick Summary

```bash
# Total affected
jq '.stats | {total: .total_booths, affected: .booths_with_problems}' geocoding-audit-report.json

# By severity
jq '.stats | {critical: .critical_count, high: .high_count, medium: .medium_count}' geocoding-audit-report.json

# By category
jq '.stats.by_category | to_entries | sort_by(-.value) | .[] | "\(.key): \(.value)"' geocoding-audit-report.json -r
```

### Find Specific Issues

```bash
# All booths missing coordinates
jq '.all_affected_booths[] | select(.problems[].category == "MISSING_COORDINATES")' geocoding-audit-report.json | head -5

# All critical cases with their problems
jq '.critical_cases[] | {name, address, problems}' geocoding-audit-report.json

# Duplicate coordinates
jq '.duplicate_coordinates[] | {coordinates, boothCount}' geocoding-audit-report.json
```

### Process CSV Data

```bash
# Count total affected booths in CSV
wc -l affected-booths.csv

# Find critical booths only
grep "CRITICAL" affected-booths.csv

# Extract just the booth IDs for re-geocoding
cut -d',' -f1 affected-booths.csv | tail -n +2 > booth-ids-to-fix.txt

# Count by severity
echo "CRITICAL:"; grep "CRITICAL" affected-booths.csv | wc -l
echo "HIGH:"; grep "HIGH" affected-booths.csv | wc -l
echo "MEDIUM:"; grep "MEDIUM" affected-booths.csv | wc -l
```

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY environment variable not set"

**Solution:**
```bash
# Explicitly load from .env.local
source .env.local
# Or use direct export
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

**Verify:**
```bash
echo $SUPABASE_SERVICE_ROLE_KEY | head -c 20
# Should output: eyJhbGciOiJIUzI1NiIs...
```

### Error: "HTTP 401: Unauthorized"

**Cause:** Invalid or wrong key

**Solution:**
```bash
# Double-check in .env.local
grep SUPABASE_SERVICE_ROLE_KEY .env.local

# Make sure it's not the anon key (which is shorter)
echo $SUPABASE_SERVICE_ROLE_KEY | wc -c
# Should be ~200+ characters (service role key is longer)
```

### Error: "HTTP 429: Too Many Requests"

**Cause:** Supabase rate limit (rare)

**Solution:**
```bash
# Wait a moment and retry
sleep 5
node scripts/geocoding-audit.js
```

### Error: "Cannot read property 'length' of undefined"

**Cause:** Empty response from API

**Solution:**
- Check internet connection
- Verify Supabase is up: `curl -I https://tmgbmcbwfkvmylmfpkzy.supabase.co`
- Retry the script

### Reports Not Generated

**Check if script ran successfully:**
```bash
# Look for any error messages
node scripts/geocoding-audit.js 2>&1 | tail -20

# Check if files exist
ls -la geocoding-audit-report.json affected-booths.csv

# Check if they're empty
wc -c geocoding-audit-report.json
```

## Scheduling Regular Audits

### Weekly Audit Script

```bash
#!/bin/bash
# weekly-audit.sh

cd /Users/jkw/Projects/booth-beacon-app
export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)

# Run audit
node scripts/geocoding-audit.js

# Archive results with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp geocoding-audit-report.json "audit-results/report_${TIMESTAMP}.json"
cp affected-booths.csv "audit-results/affected_${TIMESTAMP}.csv"

# Generate comparison
echo "Audit completed: $TIMESTAMP" >> audit-results/history.log
jq '.stats' "audit-results/report_${TIMESTAMP}.json" >> audit-results/history.log

echo "Audit archived to: audit-results/"
```

### Schedule with cron

```bash
# Make script executable
chmod +x weekly-audit.sh

# Add to crontab (Sunday 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * 0 cd /Users/jkw/Projects/booth-beacon-app && ./weekly-audit.sh") | crontab -

# Verify
crontab -l | grep audit
```

## Comparing Results Over Time

### Track Improvements

```bash
# After running audit weekly, compare changes
for i in 1 2 3; do
  echo "Week $i:";
  jq '.stats.booths_with_problems' audit-results/report_week$i.json
done

# Calculate percentage improvement
WEEK1=$(jq '.stats.booths_with_problems' audit-results/report_week1.json)
WEEK2=$(jq '.stats.booths_with_problems' audit-results/report_week2.json)
IMPROVEMENT=$(echo "scale=1; (($WEEK1 - $WEEK2) / $WEEK1) * 100" | bc)
echo "Improvement: $IMPROVEMENT%"
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Geocoding Audit

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Run Geocoding Audit
        env:
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: node scripts/geocoding-audit.js

      - name: Archive Results
        uses: actions/upload-artifact@v2
        with:
          name: audit-results
          path: |
            geocoding-audit-report.json
            affected-booths.csv
```

## Performance Tips

### For Large Databases

If you have 1000+ booths and script seems slow:

```bash
# Monitor progress with verbose output
node -e "
const original = console.log;
let count = 0;
console.log = function(...args) {
  if (args[0]?.includes?.('Retrieved') || args[0]?.includes?.('Fetching')) {
    original(...args);
    count++;
  }
  if (count % 100 === 0) original(\`Progress: \${count}\`);
};
require('./scripts/geocoding-audit.js');
"
```

### Run in Background

```bash
# Run in background and check progress later
nohup node scripts/geocoding-audit.js > audit.log 2>&1 &

# Monitor progress
tail -f audit.log

# Check final result when done
jq '.stats' geocoding-audit-report.json
```

## Next Steps After Running Audit

1. **Review critical cases** (34 in example)
   - Document missing addresses
   - Identify patterns

2. **Run targeted re-geocoding**
   ```bash
   node scripts/run-geocoding.js affected-booths.csv
   ```

3. **Re-run audit** to verify improvements
   ```bash
   node scripts/geocoding-audit.js
   ```

4. **Compare results** between runs
   ```bash
   diff <(jq '.stats' audit-results/report1.json) <(jq '.stats' audit-results/report2.json)
   ```

## Support & Documentation

For more information:
- **GEOCODING-AUDIT-GUIDE.md** - Comprehensive guide
- **AUDIT-EXAMPLE-OUTPUT.md** - Example output samples
- **GEOCODING-AUDIT-README.md** - Quick reference
- **MASTER_TODO_LIST.md** - Project priorities

## Quick Reference

| Task | Command |
|------|---------|
| Run audit | `export $(cat .env.local \| grep SUPABASE_SERVICE_ROLE_KEY \| xargs) && node scripts/geocoding-audit.js` |
| View stats | `jq '.stats' geocoding-audit-report.json` |
| View critical | `jq '.critical_cases | length' geocoding-audit-report.json` |
| Export IDs | `jq '.affected_booth_ids[]' geocoding-audit-report.json > ids.txt` |
| Check CSV | `head -10 affected-booths.csv` |
| Count problems | `jq '.stats.by_category' geocoding-audit-report.json` |

---

**Last Updated**: 2025-12-08
**Script Location**: `/Users/jkw/Projects/booth-beacon-app/scripts/geocoding-audit.js`
**Report Location**: `/Users/jkw/Projects/booth-beacon-app/geocoding-audit-report.json`
