# Geocoding Deployment & Execution Guide

## Quick Start

This guide will help you deploy the geocoding service and process all 909 booths missing coordinates.

### Current Status
- Total booths: **912**
- Missing coordinates: **909** (99.7%)
- Estimated time: **~15 minutes** (909 seconds at 1 req/sec)

---

## Step 1: Deploy the Edge Function

The geocoding Edge Function is **NOT CURRENTLY DEPLOYED**. You must deploy it first.

### Easiest Method: Supabase Dashboard

1. Open: https://app.supabase.com/project/tmgbmcbwfkvmylmfpkzy/functions
2. Click **"New Edge Function"** or **"Deploy new function"**
3. Enter function name: `geocode-booths`
4. Copy the entire contents of: `supabase/functions/geocode-booths/index.ts`
5. Paste into the code editor
6. Click **"Deploy"**
7. Wait for deployment to complete

### Alternative: CLI Deployment

If you prefer using the command line:

```bash
# Get your access token from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN=<your-token-here>

# Deploy the function
supabase functions deploy geocode-booths \
  --project-ref tmgbmcbwfkvmylmfpkzy \
  --no-verify-jwt
```

---

## Step 2: Verify Deployment

After deploying, test that it works:

```bash
./scripts/quick-deploy-test.sh
```

You should see:
```
✓ Function is deployed and working!
```

If you see a 404 error, the function is not deployed yet. Return to Step 1.

---

## Step 3: Run Geocoding

Once the function is deployed, you have several options:

### Option A: Geocode Everything (Recommended)

Process all 909 booths in batches of 100:

```bash
./scripts/geocode-all-batches.sh
```

This will:
- Automatically process in batches
- Show progress for each booth
- Stop when all booths are geocoded
- Take approximately 15-20 minutes

### Option B: Manual Single Batch

Process 100 booths at a time:

```bash
export SUPABASE_SERVICE_ROLE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)
node scripts/run-geocoding.js
```

Run this command 9-10 times until all booths are geocoded.

### Option C: Dry Run First (Test)

Test with 1 booth without saving:

```bash
export SUPABASE_SERVICE_ROLE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)
# Edit scripts/run-geocoding.js: change BATCH_SIZE to 1
node scripts/run-geocoding.js --dry-run
```

---

## Step 4: Monitor Progress

Check status at any time:

```bash
export SUPABASE_SERVICE_ROLE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)
node scripts/check-missing-coordinates.js
```

Example output:
```
Total booths: 912
Missing coordinates: 100
With coordinates: 812
Completion: 89.0%
```

---

## Step 5: Verify Completion

After geocoding completes, verify all booths have coordinates:

```bash
node scripts/check-missing-coordinates.js
```

Expected output:
```
Total booths: 912
Missing coordinates: 0
With coordinates: 912
Completion: 100.0%

All booths have coordinates!
```

---

## What to Expect

### During Geocoding

You'll see real-time output like:

```
================================================================================
Booth Beacon - Geocoding Service
================================================================================
Function URL: https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/geocode-booths
Batch size: 100
Dry run: false
================================================================================

Status: 200

[START] Starting geocoding process (limit: 100, dry_run: false)...

[PROGRESS] Found 909 booths missing coordinates

  ✓ Photo Booth Express [1/909]
    → 40.712800, -74.006000
  ✓ Smile Snap Booth [2/909]
    → 34.052200, -118.243700
  ✓ Party Pics Photo Booth [3/909]
    → 41.878100, -87.629800
  ...

[COMPLETE] Geocoding complete: 98 successful, 2 errors

Summary:
  Total booths: 100
  Successful: 98
  Errors: 2
  Skipped: 0
```

### Success Rate

- Expected: **95-98%** success rate
- Some addresses may fail if:
  - Address is incomplete or invalid
  - Location not found in OpenStreetMap
  - Special characters in address

### Time Estimates

- **Single booth:** 1 second
- **100 booths:** ~1-2 minutes
- **909 booths:** ~15-20 minutes total

---

## Troubleshooting

### "Function NOT deployed (404 Not Found)"

The Edge Function is not deployed. Go back to **Step 1**.

### "SUPABASE_SERVICE_ROLE_KEY not set"

Your `.env.local` file is missing or not being read. Check that:
1. File exists: `ls -la .env.local`
2. Contains the key: `cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY`

### "Rate limit exceeded"

Nominatim rate limit (1 req/sec) is exceeded. The script already respects this, but if you see this error:
- Wait 5 minutes
- Run the script again

### "No coordinates found for booth"

Some booths may have invalid addresses. These will be skipped. You can:
1. Fix the address in the database
2. Re-run geocoding for those specific booths

### Script hangs or times out

If the script appears to hang:
1. Press Ctrl+C to stop
2. Run `node scripts/check-missing-coordinates.js` to see progress
3. Run geocoding again - it will only process remaining booths

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/functions/geocode-booths/index.ts` | Edge Function (deploy this) |
| `scripts/run-geocoding.js` | Client script to trigger geocoding |
| `scripts/geocode-all-batches.sh` | Automatic batch processing |
| `scripts/check-missing-coordinates.js` | Check status |
| `scripts/quick-deploy-test.sh` | Test if function is deployed |
| `scripts/deploy-geocode-function.sh` | Helper for CLI deployment |
| `scripts/GEOCODING-README.md` | Technical details |
| `scripts/DEPLOYMENT-GUIDE.md` | This file |

---

## After Completion

Once all 909 booths are geocoded:

1. Verify completion: `node scripts/check-missing-coordinates.js`
2. Check a few booths in the database to ensure coordinates look correct
3. Test the map view on your website to see the booths
4. Celebrate! 🎉

---

## Technical Details

- **Geocoding Service:** OpenStreetMap Nominatim
- **Rate Limit:** 1 request per second (strictly enforced)
- **API:** Free, no API key required
- **Accuracy:** Street-level geocoding
- **User-Agent:** `BoothBeacon/1.0`

For more technical details, see `scripts/GEOCODING-README.md`.
