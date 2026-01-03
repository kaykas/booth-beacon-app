# Booth Image Generation Plan

**Date:** January 3, 2026
**Status:** IN PROGRESS

## Current Situation

### Image Coverage Statistics
- **Total Booths:** 1,214
- **With Images:** 940 (77.4%)
- **Without Images:** 274 (22.6%)

### Breakdown by Type
- **AI Preview Images:** 939 booths (77.3%)
- **Scraped Photos:** 200 booths (16.5%)
- **Full AI-Generated Images:** 0 booths (0%)

## Problem

**274 booths have NO images at all**, which creates a poor user experience on booth detail pages.

## Solution Strategy

### Phase 1: Immediate AI Image Generation ⏳ IN PROGRESS

**Goal:** Generate AI images for all 274 booths without any images

**Script:** `batch-generate-booth-images.ts`

**Process:**
1. Uses OpenAI DALL-E 3 API
2. Generates vintage photobooth aesthetic images
3. Creates location-specific street view style images
4. Uploads to Supabase storage
5. Updates booth record with `ai_preview_url`

**Cost Estimate:**
- Price per image: $0.04
- Total booths: 274
- **Estimated cost: $10.96**

**Execution:**
```bash
# Batch 1: 50 booths (RUNNING NOW)
OPENAI_API_KEY=xxx npx tsx batch-generate-booth-images.ts 50

# Batch 2: 50 booths
OPENAI_API_KEY=xxx npx tsx batch-generate-booth-images.ts 50

# Batch 3: 50 booths
OPENAI_API_KEY=xxx npx tsx batch-generate-booth-images.ts 50

# Batch 4: 50 booths
OPENAI_API_KEY=xxx npx tsx batch-generate-booth-images.ts 50

# Batch 5: 50 booths
OPENAI_API_KEY=xxx npx tsx batch-generate-booth-images.ts 50

# Batch 6: 24 booths (remaining)
OPENAI_API_KEY=xxx npx tsx batch-generate-booth-images.ts 24
```

**Rate Limits:**
- DALL-E 3: ~50 images per minute
- Batches should run safely with built-in delays

### Phase 2: Enhanced Photo Scraping (NEXT)

**Goal:** Extract real photos from source websites during crawling

**Current State:**
- Crawler extracts booth data via Firecrawl API
- BoothData type includes `photos?: string[]` field
- Photos are extracted but need systematic storage

**Tasks:**
1. ✅ Verify extractors capture photo URLs
2. ⏳ Ensure photos are stored in `photo_exterior_url` field
3. ⏳ Add fallback to download and upload to Supabase storage
4. ⏳ Update crawler to prioritize real photos over AI images

**Priority:** Real photos > AI images when available

### Phase 3: Continuous Maintenance (ONGOING)

**Goal:** Keep all booths with images automatically

**Automation Options:**
1. **Scheduled Job:** Run batch generation weekly for new booths
2. **On-Insert Trigger:** Generate image automatically when booth is created
3. **Crawler Enhancement:** Extract photos during initial scrape

**Recommended:** Crawler enhancement + weekly cleanup job

## Technical Details

### Image Storage Structure

**Supabase Storage Bucket:** `booth-images`

**Paths:**
- AI Previews: `/ai-previews/booth-{id}-ai-preview-{timestamp}.png`
- Scraped Photos: `/exterior-photos/booth-{id}-exterior-{timestamp}.jpg`
- User Photos: `/user-photos/booth-{id}-user-{photo-id}.jpg`

### Database Fields

```typescript
interface Booth {
  // AI-generated images
  ai_preview_url?: string;
  ai_preview_generated_at?: Date;
  ai_generated_image_url?: string;
  ai_image_prompt?: string;
  ai_image_generated_at?: Date;

  // Scraped/real photos
  photo_exterior_url?: string;
  photo_interior_url?: string;
  photo_sample_strips?: string[];
}
```

### Image Generation Prompt

```typescript
function constructPrompt(booth: BoothData): string {
  const location = booth.address
    ? `street view of ${booth.address}, ${booth.city}, ${booth.country}`
    : `iconic street view of ${booth.city}, ${booth.country}`;

  return `${location}. Style: Vintage photo booth strip aesthetic.
    Warm, slightly faded nostalgic look, similar to old film photography
    from the 1960s-1980s. Soft edges, slight vignetting, warm color tones.
    This is a LOCATION VIEW, not a photo booth machine.`;
}
```

## Progress Tracking

### Batch 1 (50 booths)
- Status: ⏳ IN PROGRESS
- Started: 2026-01-03 06:30 UTC
- Expected completion: 5-10 minutes

### Batch 2 (50 booths)
- Status: ⏳ PENDING
- Run after Batch 1 completes

### Batch 3 (50 booths)
- Status: ⏳ PENDING

### Batch 4 (50 booths)
- Status: ⏳ PENDING

### Batch 5 (50 booths)
- Status: ⏳ PENDING

### Batch 6 (24 booths)
- Status: ⏳ PENDING

## Success Metrics

**Target:** 100% of booths have at least one image

**Before:**
- 77.4% coverage (940/1214)
- 274 booths with no images

**After Phase 1:**
- 100% coverage (1214/1214)
- 0 booths with no images

**After Phase 2:**
- Higher quality real photos for more booths
- Reduced reliance on AI-generated images

## Cost Analysis

### Phase 1 (Immediate AI Generation)
- Booths needing images: 274
- Cost per image: $0.04
- **Total: $10.96**

### Phase 2 (Photo Scraping)
- Firecrawl API: Already paid ($free tier or existing plan)
- Supabase storage: Included in current plan
- **Total: $0 additional cost**

### Ongoing Maintenance
- Estimated new booths per month: ~100
- AI generation cost: ~$4/month
- **Sustainable recurring cost**

## Next Steps

1. ✅ Start Batch 1 (50 booths) - RUNNING
2. ⏳ Monitor Batch 1 completion
3. ⏳ Run Batches 2-6 sequentially
4. ⏳ Verify all 274 booths now have images
5. ⏳ Update crawler to extract real photos
6. ⏳ Set up weekly maintenance job

## Files Modified/Created

- `/batch-generate-booth-images.ts` - Main image generation script (existing)
- `/IMAGE_GENERATION_PLAN.md` - This document (new)
- `/supabase/functions/unified-crawler/index.ts` - To be enhanced with photo extraction

## Related Issues

- [x] Map info window persistence
- [x] Street View visibility improvements
- [x] Petaluma location page fix
- [ ] State field population (1,018 booths need states)
- [ ] Image generation for all booths (in progress)
- [ ] Photo scraping enhancement

---

**Status:** Batch 1 running, expected 100% image coverage within 1 hour.
