# Batch Generate Booth Images

This script generates AI images for booths that don't have exterior photos using the `generate-booth-art` Edge Function.

## Overview

The script performs the following steps:

1. **Query Database**: Finds all active booths without `photo_exterior_url` and without `ai_preview_url`
2. **Batch Processing**: Processes booths in batches of 5 with 5-second delays between batches
3. **Error Handling**: Retries failed requests up to 3 times with exponential backoff
4. **Statistics Reporting**: Provides detailed statistics on completion

## Prerequisites

- Node.js and npm installed
- Environment variables configured in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL` (defaults to production URL)
  - `SUPABASE_SERVICE_ROLE_KEY` (required)

## Usage

### Using npm script (recommended)

```bash
npm run batch:generate-images
```

### Using npx directly

```bash
npx tsx batch-generate-booth-images.ts
```

### Using tsx directly (if installed globally)

```bash
tsx batch-generate-booth-images.ts
```

### With environment variables inline

```bash
SUPABASE_SERVICE_ROLE_KEY=your-key-here npm run batch:generate-images
```

### Dry run mode (test without calling API)

```bash
DRY_RUN=true npm run batch:generate-images
```

This will query the database and simulate the batch processing without actually calling the OpenAI API or updating any records. Perfect for testing!

## Configuration

You can modify these constants in the script:

```typescript
const BATCH_SIZE = 5;                // Number of booths per batch
const DELAY_BETWEEN_BATCHES = 5000;  // Milliseconds between batches
const MAX_RETRIES = 3;               // Number of retry attempts
const DRY_RUN = process.env.DRY_RUN === 'true'; // Enable dry run mode
```

### Environment Variables

- `DRY_RUN`: Set to `true` to test without making API calls

## Output

The script provides detailed console output:

```
🎨 Booth Beacon - Batch Image Generator
======================================================================

🔍 Querying database for booths without images...

📊 Found 15 booths without images:

   1. Photo Booth at Central Station (Berlin, Germany)
   2. Vintage Photo Booth (Paris, France)
   ...

🚀 Starting batch processing:
   Total booths: 15
   Batch size: 5
   Total batches: 3
   Delay between batches: 5000ms

======================================================================
📦 Processing batch 1/3 (5 booths)
======================================================================

📤 Calling Edge Function for 5 booths...
✅ Success: booth-id-1
   Image URL: https://...
✅ Success: booth-id-2
   Image URL: https://...
...

======================================================================
📊 FINAL STATISTICS
======================================================================

Total booths found:       15
Total booths processed:   15
✅ Successful:            14
❌ Failed:                1

Success rate: 93.3%
```

## Error Handling

The script includes comprehensive error handling:

- **Database Errors**: Caught and reported immediately
- **API Errors**: Retried up to 3 times with exponential backoff
- **Individual Failures**: Logged but don't stop processing
- **Fatal Errors**: Stop execution and exit with code 1

## Edge Function

The script calls the `generate-booth-art` Edge Function at:
```
https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/generate-booth-art
```

### Expected Payload

```json
{
  "booth_ids": ["booth-id-1", "booth-id-2", ...]
}
```

### Expected Response

```json
{
  "success": true,
  "processed": 5,
  "results": [
    {
      "booth_id": "booth-id-1",
      "success": true,
      "image_url": "https://...",
      "prompt": "Artistic watercolor illustration..."
    },
    ...
  ]
}
```

## Database Schema

The script queries booths with:
- `photo_exterior_url IS NULL`
- `ai_preview_url IS NULL` (or `ai_generated_image_url IS NULL` depending on schema)
- `status = 'active'`

The Edge Function updates:
- `ai_generated_image_url` (or `ai_preview_url`)
- `ai_image_prompt`
- `ai_image_generated_at`
- `updated_at`

## Rate Limiting

To avoid overwhelming the OpenAI API and Edge Function:
- Processes 5 booths per batch
- Waits 5 seconds between batches
- Implements retry logic with exponential backoff

## Monitoring

Watch for these indicators in the output:

- ✅ = Success
- ❌ = Failed
- 🔄 = Retrying
- ⏳ = Waiting between batches

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY is not set"

Make sure your `.env.local` file contains:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### "No booths found that need AI-generated images"

All active booths either have:
- An exterior photo (`photo_exterior_url`)
- An AI-generated preview (`ai_preview_url`)

### "Edge Function returned 500"

Check the Edge Function logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select `generate-booth-art`
3. View Logs tab

### "Failed to download generated image"

The OpenAI DALL-E 3 API may be experiencing issues. The script will retry automatically.

## Best Practices

1. **Test First**: Run with a small dataset first to verify everything works
2. **Monitor Logs**: Keep an eye on the console output for errors
3. **Check Results**: Verify generated images in the database after completion
4. **Rate Limits**: Adjust batch size and delays based on your API limits
5. **Cost Awareness**: DALL-E 3 API calls cost money - verify counts before running

## Exit Codes

- `0`: Success (all booths processed successfully)
- `1`: Partial or complete failure (check error output)

## Cost Estimation

- DALL-E 3 (1792x1024, standard quality): ~$0.080 per image
- 100 booths: ~$8.00
- 1000 booths: ~$80.00

Always verify current OpenAI pricing before running at scale.
