# AI Preview Generation for Photo Booths

## Overview

This feature automatically generates location images for photo booths that don't have actual photos. When a booth lacks a `photo_exterior_url`, the system generates an AI-powered preview image of the location with a vintage photo booth strip aesthetic.

## How It Works

### Automatic Generation

When a user views a booth on the map that has no photo, the system automatically triggers AI preview generation in the background. The process is:

1. User clicks on a booth marker in the map
2. InfoWindow checks if booth has `photo_exterior_url` or `ai_preview_url`
3. If neither exists, triggers background API call to generate preview
4. Image is generated and stored in Supabase
5. Database is updated with the new `ai_preview_url`

### Image Generation Strategy

The system uses a multi-strategy approach:

1. **Primary: Unsplash API** - Fetches real street photography of the location
   - Searches for: `{city}, street, urban, architecture, vintage`
   - Returns high-quality images with vintage aesthetic
   - No API key required (uses public endpoint)

2. **Secondary: Google Imagen API** - AI-generated images (if configured)
   - Requires Google Cloud project setup
   - Generates custom images based on location prompt
   - Portrait aspect ratio (3:4) for booth-style images

3. **Fallback: Generic Placeholder** - Last resort if all else fails
   - Uses city name for context
   - Ensures all booths have some visual representation

## API Endpoints

### Single Booth Generation

**POST /api/booths/generate-preview**

Generate an AI preview for a single booth.

```bash
curl -X POST https://boothbeacon.org/api/booths/generate-preview \
  -H "Content-Type: application/json" \
  -d '{"boothId": "booth-uuid-here"}'
```

**Response:**
```json
{
  "success": true,
  "boothId": "booth-uuid-here",
  "aiPreviewUrl": "https://...",
  "message": "AI preview generated successfully"
}
```

**GET /api/booths/generate-preview?boothId={id}**

Check if a booth needs an AI preview.

```bash
curl https://boothbeacon.org/api/booths/generate-preview?boothId=booth-uuid-here
```

**Response:**
```json
{
  "boothId": "booth-uuid-here",
  "needsPreview": false,
  "hasPhoto": true,
  "hasAIPreview": false,
  "aiPreviewGeneratedAt": null
}
```

### Batch Processing

**POST /api/booths/batch-generate-previews**

Generate AI previews for multiple booths at once.

```bash
curl -X POST https://boothbeacon.org/api/booths/batch-generate-previews \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "dryRun": false}'
```

**Parameters:**
- `limit` (default: 10) - Number of booths to process
- `dryRun` (default: false) - If true, only shows what would be processed

**Response:**
```json
{
  "message": "Batch processing completed",
  "progress": {
    "total": 10,
    "processed": 10,
    "successful": 8,
    "failed": 2,
    "errors": [
      {
        "boothId": "uuid-1",
        "error": "Failed to generate image"
      }
    ]
  }
}
```

**GET /api/booths/batch-generate-previews**

Get statistics about booth image coverage.

```bash
curl https://boothbeacon.org/api/booths/batch-generate-previews
```

**Response:**
```json
{
  "total": 500,
  "needsPreview": 100,
  "hasPhoto": 350,
  "hasAIPreview": 50,
  "coverage": 80.0
}
```

## Database Schema

The `booths` table includes these fields for AI previews:

```sql
-- AI Preview fields
ai_preview_url TEXT,           -- URL of the generated preview image
ai_preview_generated_at TIMESTAMPTZ  -- When the preview was generated
```

## Environment Variables

```env
# Required for Google Imagen API (optional)
GOOGLE_IMAGEN_API_KEY=your-api-key-here

# Required for Supabase storage
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Image Storage

Generated images are stored in Supabase Storage:

- **Bucket:** `booth-images`
- **Path:** `ai-previews/booth-{id}-ai-preview-{timestamp}.png`
- **Cache:** 1 year (31536000 seconds)
- **Public Access:** Yes

## Code Structure

### Files Created

1. **`/src/lib/imageGeneration.ts`**
   - Core service for generating images
   - Handles multiple generation strategies
   - Manages Supabase upload and database updates

2. **`/src/app/api/booths/generate-preview/route.ts`**
   - API endpoint for single booth generation
   - Handles preview status checks

3. **`/src/app/api/booths/batch-generate-previews/route.ts`**
   - API endpoint for batch processing
   - Provides coverage statistics

4. **`/src/hooks/useBoothAIPreview.ts`**
   - React hook for client-side generation
   - Manages loading and error states

### Files Modified

1. **`/src/components/booth/BoothMap.tsx`**
   - Added automatic preview generation trigger
   - Added `triggerAIPreviewGeneration()` helper function
   - Triggers generation when InfoWindow is opened for booths without photos

## Usage Examples

### Trigger Generation for a Specific Booth

```typescript
import { useBoothAIPreview } from '@/hooks/useBoothAIPreview';

function MyComponent() {
  const { generatePreview, isGenerating, error } = useBoothAIPreview();

  const handleGenerate = async (boothId: string) => {
    const imageUrl = await generatePreview(boothId);
    if (imageUrl) {
      console.log('Preview generated:', imageUrl);
    }
  };

  return (
    <button onClick={() => handleGenerate('booth-id')} disabled={isGenerating}>
      {isGenerating ? 'Generating...' : 'Generate Preview'}
    </button>
  );
}
```

### Batch Process All Booths Without Previews

```bash
# Check how many booths need previews
curl https://boothbeacon.org/api/booths/batch-generate-previews

# Generate previews for 50 booths
curl -X POST https://boothbeacon.org/api/booths/batch-generate-previews \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "dryRun": false}'
```

## Styling and Aesthetic

The generated/fetched images are styled with a "vintage photo booth strip" aesthetic:

- **Aspect Ratio:** 3:4 (portrait)
- **Dimensions:** 800x1000 pixels
- **Style Keywords:** vintage, street, urban, architecture
- **Visual Goal:** Warm, slightly faded nostalgic look similar to old film photography (1960s-1980s)

The images are clearly location views (street scenes, architecture) and NOT photos of the actual booth machine, making it clear to users that this is a preview of where the booth is located.

## Performance Considerations

- **Automatic generation** happens asynchronously in the background
- **No UI blocking** - generation doesn't prevent map interaction
- **Rate limiting** - Batch processing includes 1-second delay between requests
- **Caching** - Once generated, images are cached for 1 year
- **Fallback strategy** - Multiple approaches ensure images are always available

## Future Enhancements

Potential improvements to consider:

1. **Better AI Integration** - Integrate with Claude's Anthropic API to generate image descriptions
2. **Image Filters** - Apply vintage photo booth filters to Unsplash images
3. **Manual Regeneration** - Allow users to request new AI previews
4. **Image Quality Scoring** - Rate generated images and retry if quality is low
5. **Webhook Integration** - Trigger generation when new booths are added
6. **Scheduled Jobs** - Automatically process all booths without previews daily

## Troubleshooting

### Images Not Generating

1. Check environment variables are set correctly
2. Verify Supabase storage bucket exists and is public
3. Check API logs for error messages
4. Ensure booth has valid city and country data

### Unsplash Images Not Loading

- Unsplash may rate limit requests
- Try batch processing with smaller limits
- Consider implementing retry logic

### Google Imagen API Not Working

- Requires Google Cloud project setup
- May need OAuth2 authentication instead of API key
- Falls back to Unsplash automatically

## License

Part of the Booth Beacon application.
