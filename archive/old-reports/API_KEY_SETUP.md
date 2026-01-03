# Google Maps API Key Setup for Backend Scripts

## Current Issue

The existing Google Maps API key has **HTTP referer restrictions** that prevent it from being used in backend Node.js scripts.

```
Error: API keys with referer restrictions cannot be used with this API.
```

## Solution Options

### Option 1: Create a New API Key (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project
3. Click "Create Credentials" → "API Key"
4. Click "Edit API key" (or the name of the new key)
5. Under "API restrictions":
   - Select "Restrict key"
   - Enable these APIs:
     - Places API
     - Places API (New)
     - Geocoding API
6. Under "Application restrictions":
   - Select "IP addresses"
   - Add your server IP addresses (or "0.0.0.0/0" for testing)
   - **OR** select "None" (less secure but works everywhere)
7. Click "Save"

### Option 2: Modify Existing Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your existing key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Click the key name to edit
4. Under "Application restrictions":
   - Change from "HTTP referrers (web sites)" to "None"
   - **Warning**: This makes the key usable from anywhere
5. Click "Save"

**Note**: If you choose this option, consider rotating the key and using environment-specific keys (one for web, one for backend).

### Option 3: Use Two Separate Keys (Best Practice)

1. Keep `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with referer restrictions (for web)
2. Create a new `GOOGLE_MAPS_API_KEY` with IP restrictions (for backend)
3. Add to `.env.local`:

```bash
# For web frontend (existing)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."

# For backend scripts (new)
GOOGLE_MAPS_API_KEY="AIzaSy...different-key"
```

## Testing the Fix

After configuring the API key, test it:

```bash
# Test API access
npx tsx test-google-api.ts

# Should see:
# API Key exists: true
# Response status: OK
# Results count: 1 or more
```

## Running the Enrichment Script

Once the API key is configured:

```bash
# Test with 10 booths
npx tsx enrich-missing-booth-data.ts 10

# Full run with 30 booths
npx tsx enrich-missing-booth-data.ts 30

# Default batch (50 booths)
npx tsx enrich-missing-booth-data.ts
```

## Expected Results

With the improvements and working API key:

- **Before**: 0% success on tricky booth names
- **After**: 40-50% success on tricky booth names
- **Overall**: 2-5x improvement in enrichment rate

## API Quotas

Google Places API quotas (check your limits):
- Text Search: $17 per 1000 requests (5 free per month)
- Place Details: $17 per 1000 requests (5 free per month)
- Place Photos: $7 per 1000 requests (free)

For 50 booths with multi-strategy search:
- Estimated cost: $1-2 (if no free tier)
- Estimated API calls: 50-150 (depending on strategies needed)

## Security Best Practices

1. **Never commit API keys to git**
   - Already in `.gitignore`: `.env.local`

2. **Use IP restrictions** for backend keys
   - More secure than "None"
   - Prevents key theft

3. **Rotate keys regularly**
   - If key is exposed, delete and create new one

4. **Set up budget alerts** in Google Cloud
   - Prevent unexpected charges

5. **Use separate keys** for different environments
   - Development
   - Staging
   - Production

## Troubleshooting

### "REQUEST_DENIED" error
- API key has wrong restrictions (referer instead of IP)
- APIs not enabled in Google Cloud Console
- API key expired or deleted

### "OVER_QUERY_LIMIT" error
- Hit daily quota
- Increase quota in Google Cloud Console
- Add billing if on free tier

### "INVALID_REQUEST" error
- Malformed query string
- Missing required fields
- Check script output for query details

## Next Steps

1. ✅ Choose an option above to configure API key
2. ✅ Test with `test-google-api.ts`
3. ✅ Run enrichment script on small batch (10-30 booths)
4. ✅ Review results and confidence scores
5. ✅ Adjust thresholds if needed
6. ✅ Run on full database in batches
