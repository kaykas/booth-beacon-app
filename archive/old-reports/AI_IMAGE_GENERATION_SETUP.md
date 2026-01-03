# AI Image Generation Setup - OpenAI DALL-E 3

## Summary of Changes

The image generation system has been updated to use **OpenAI DALL-E 3** instead of Google Imagen API.

### Files Modified

1. **`src/lib/imageGeneration.ts`**
   - Replaced Google Imagen API with OpenAI DALL-E 3
   - Updated function `callImagenAPI()` to `callDallEAPI()`
   - Implemented `tryDallEAPI()` function using the OpenAI SDK
   - Maintains the same vintage photo booth aesthetic in prompts
   - Gracefully falls back to placeholder if API fails or key is missing

2. **`package.json`**
   - Added `openai` dependency (version determined by npm)

3. **`.env.example`**
   - Added `OPENAI_API_KEY` to the environment variables template

## What Still Needs to Be Done

### 1. Add OpenAI API Key to Environment

You need to add your OpenAI API key to your `.env.local` file:

```bash
# Add this line to .env.local
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**How to get an OpenAI API key:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and add it to `.env.local`

### 2. Update Vercel Environment Variables (if deployed)

If your app is deployed on Vercel, you need to add the `OPENAI_API_KEY` to your Vercel environment variables:

```bash
# Using Vercel CLI
vercel env add OPENAI_API_KEY

# Or via Vercel Dashboard:
# 1. Go to your project settings
# 2. Navigate to Environment Variables
# 3. Add OPENAI_API_KEY with your key value
# 4. Select the environments (Production, Preview, Development)
```

### 3. Test the Implementation

Once you've added the API key, you can test the image generation:

**Option A: Test via API endpoint**
```bash
curl -X POST http://localhost:3000/api/booths/generate-preview \
  -H "Content-Type: application/json" \
  -d '{"boothId": "your-booth-id-here"}'
```

**Option B: Test directly (create a test script)**
```typescript
// test-image-generation.ts
import { generateLocationImage } from './src/lib/imageGeneration';

async function test() {
  const result = await generateLocationImage({
    city: 'Paris',
    country: 'France',
    address: '123 Rue de Rivoli',
    boothName: 'Photomaton Louvre'
  });

  console.log('Result:', result);
}

test();
```

Then run: `npx tsx test-image-generation.ts`

## How It Works Now

1. **Image Generation Flow:**
   - When a booth popup is opened and no photo exists
   - The API calls `generateLocationImage()` with booth details
   - The system constructs a prompt with vintage photo booth aesthetics
   - DALL-E 3 generates a 1024x1024 image (standard quality)
   - The image URL is returned (OpenAI hosts it temporarily)
   - The image is fetched and uploaded to Supabase storage
   - The booth record is updated with the `ai_preview_url`

2. **Prompt Style:**
   ```
   "street view of [address], [city], [country].
   Style: Vintage photo booth strip aesthetic.
   The image should have a warm, slightly faded nostalgic look,
   similar to old film photography from the 1960s-1980s.
   Soft edges, slight vignetting, and warm color tones.
   This is a LOCATION VIEW, not a photo booth machine."
   ```

3. **Error Handling:**
   - If OPENAI_API_KEY is not set: Falls back to placeholder
   - If DALL-E 3 API fails: Falls back to placeholder
   - If upload to Supabase fails: Error is logged and returned
   - Graceful degradation ensures the app never breaks

## API Endpoints

### Single Booth Generation
**POST** `/api/booths/generate-preview`
```json
{
  "boothId": "booth-id-here"
}
```

### Batch Generation
**POST** `/api/booths/batch-generate-previews`
```json
{
  "limit": 10,
  "dryRun": false
}
```

### Check Status
**GET** `/api/booths/batch-generate-previews`
Returns statistics on how many booths need AI previews

## Cost Considerations

**DALL-E 3 Pricing (as of December 2024):**
- Standard quality 1024x1024: $0.040 per image
- HD quality 1024x1024: $0.080 per image

Current implementation uses **standard quality** to minimize costs.

For 100 booths: ~$4.00
For 1000 booths: ~$40.00

## Benefits of DALL-E 3 Over Google Imagen

1. **Reliability:** More stable API with better error messages
2. **Quality:** Excellent at understanding style prompts (vintage aesthetic)
3. **Documentation:** Better documented and more examples available
4. **Support:** More widely used with active community support
5. **Pricing:** Transparent and predictable pricing

## Next Steps

1. Add `OPENAI_API_KEY` to `.env.local` (see instructions above)
2. Restart your development server: `npm run dev`
3. Test image generation on a booth without a photo
4. Deploy to Vercel with environment variable set
5. Consider running batch generation for existing booths:
   ```bash
   curl -X POST https://your-domain.com/api/booths/batch-generate-previews \
     -H "Content-Type: application/json" \
     -d '{"limit": 50, "dryRun": false}'
   ```

## Troubleshooting

**Problem:** Images still showing placeholders
- Check that `OPENAI_API_KEY` is set in environment
- Check browser console and server logs for error messages
- Verify API key is valid at https://platform.openai.com/api-keys

**Problem:** API rate limits
- DALL-E 3 has rate limits (default: 5 images/minute on free tier)
- Use batch endpoint with small `limit` values
- Add delays between requests (already implemented: 1s delay)

**Problem:** Build fails
- Run `npm install` to ensure `openai` package is installed
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

## Files Reference

- **Implementation:** `/Users/jkw/Projects/booth-beacon-app/src/lib/imageGeneration.ts`
- **API Routes:**
  - `/Users/jkw/Projects/booth-beacon-app/src/app/api/booths/generate-preview/route.ts`
  - `/Users/jkw/Projects/booth-beacon-app/src/app/api/booths/batch-generate-previews/route.ts`
- **Environment:** `/Users/jkw/Projects/booth-beacon-app/.env.local`
