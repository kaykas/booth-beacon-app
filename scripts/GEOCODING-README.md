# Geocoding Booth Coordinates

This directory contains scripts to geocode booth addresses and add latitude/longitude coordinates to the database.

## Current Status

- **Total booths:** 912
- **Missing coordinates:** 909 (99.7%)
- **Geocoding service:** OpenStreetMap Nominatim (free, no API key required)
- **Rate limit:** 1 request per second (Nominatim policy)

## Overview

The geocoding process consists of:

1. **Edge Function** (`supabase/functions/geocode-booths/index.ts`)
   - Deployed to Supabase Edge Functions
   - Queries booths missing coordinates
   - Uses Nominatim API to geocode addresses
   - Respects rate limits (1 req/sec)
   - Streams progress via Server-Sent Events

2. **Client Script** (`scripts/run-geocoding.js`)
   - Triggers the Edge Function
   - Displays real-time progress
   - Handles errors gracefully
   - Can process in batches

3. **Verification Script** (`scripts/check-missing-coordinates.js`)
   - Checks how many booths are missing coordinates
   - Shows completion percentage

## Step-by-Step Instructions

### Step 1: Deploy the Edge Function

The `geocode-booths` Edge Function must be deployed to Supabase first.

#### Option A: Deploy via Supabase Dashboard (Easiest)

1. Go to: https://app.supabase.com/project/tmgbmcbwfkvmylmfpkzy/functions
2. Click "New Edge Function"
3. Name: `geocode-booths`
4. Copy the entire contents of `supabase/functions/geocode-booths/index.ts`
5. Paste into the code editor
6. Click "Deploy"

#### Option B: Deploy via CLI

First, get your access token:
1. Go to: https://supabase.com/dashboard/account/tokens
2. Generate a new access token
3. Copy the token

Then deploy:

```bash
export SUPABASE_ACCESS_TOKEN=<your-access-token>
supabase functions deploy geocode-booths --project-ref tmgbmcbwfkvmylmfpkzy --no-verify-jwt
```

Or use the provided script:

```bash
export SUPABASE_ACCESS_TOKEN=<your-access-token>
./scripts/deploy-geocode-function.sh
```

#### Option C: Deploy via CLI Login

```bash
supabase login
supabase functions deploy geocode-booths --project-ref tmgbmcbwfkvmylmfpkzy --no-verify-jwt
```

### Step 2: Verify Deployment

Test that the function is deployed:

```bash
curl -i -X POST https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/geocode-booths \
  -H "Authorization: Bearer $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{"limit": 1, "dry_run": true}'
```

You should see a `200 OK` response with streaming events.

### Step 3: Check Current Status

See how many booths need geocoding:

```bash
export SUPABASE_SERVICE_ROLE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)
node scripts/check-missing-coordinates.js
```

### Step 4: Run Geocoding

#### Dry Run (Test First)

Test with 10 booths without saving changes:

```bash
export SUPABASE_SERVICE_ROLE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)
node scripts/run-geocoding.js --dry-run
```

#### Production Run

Geocode all 909 missing booths:

```bash
export SUPABASE_SERVICE_ROLE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)
node scripts/run-geocoding.js
```

**Estimated time:** 909 booths × 1 second/booth = ~15 minutes

The script will:
- Show real-time progress
- Display coordinates for each booth
- Handle errors gracefully
- Show final statistics

#### Batch Processing

To process in smaller batches, edit `scripts/run-geocoding.js` and change `BATCH_SIZE`:

```javascript
const BATCH_SIZE = 50; // Process 50 at a time
```

Then run multiple times until all booths are geocoded.

### Step 5: Verify Results

Check the new status:

```bash
export SUPABASE_SERVICE_ROLE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)
node scripts/check-missing-coordinates.js
```

You should see:
```
Total booths: 912
Missing coordinates: 0
With coordinates: 912
Completion: 100.0%
```

## Troubleshooting

### Function Not Found (404)

The Edge Function is not deployed. Follow Step 1 above.

### Rate Limit Errors

If you see rate limit errors from Nominatim:
- The script already respects the 1 req/sec limit
- Wait a few minutes and try again
- Use smaller batch sizes

### No Coordinates Found

Some addresses may not be found by Nominatim:
- Check the booth's address in the database
- Verify it's a complete address (street, city, country)
- Some addresses may need manual correction

### Service Role Key Not Found

Make sure your `.env.local` file contains:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## API Details

### Edge Function Endpoint

```
POST https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/geocode-booths
```

### Request Body

```json
{
  "limit": 100,      // Max booths to process (default: 50)
  "dry_run": false   // If true, don't save changes (default: false)
}
```

### Response Format

Server-Sent Events stream:

```
data: {"type":"start","message":"Starting geocoding process..."}

data: {"type":"progress","message":"Found 909 booths missing coordinates","data":{"total":909}}

data: {"type":"booth_geocoded","message":"✓ Photo Booth Name","data":{"booth_id":"...","latitude":40.7128,"longitude":-74.0060,...}}

data: {"type":"complete","message":"Geocoding complete: 900 successful, 9 errors","data":{...}}
```

## Files

- `supabase/functions/geocode-booths/index.ts` - Edge Function code
- `scripts/run-geocoding.js` - Client script to run geocoding
- `scripts/check-missing-coordinates.js` - Verification script
- `scripts/deploy-geocode-function.sh` - Automated deployment script
- `scripts/manual-deploy-instructions.md` - Detailed deployment guide
- `scripts/GEOCODING-README.md` - This file

## Notes

- Nominatim is free but requires attribution
- Rate limit: 1 request per second (strictly enforced)
- User-Agent: `BoothBeacon/1.0` (identifies our app)
- Service: https://nominatim.openstreetmap.org
- Alternative paid services: Google Maps Geocoding API, Mapbox
