# Photo Management System

## Problem: Google Photo References Expire

**Root Cause:** Google Maps API photo_reference values expire after a few months. When stored as URLs in the database, they eventually return 400 errors and photos disappear.

**Date Discovered:** January 4, 2026
**Impact:** 289 booths had expired photo URLs, showing "No photos available"

## Permanent Solution: Download and Host Photos

Instead of storing temporary Google URLs, we now:

1. **Download** the actual image from Google when enriching/scraping
2. **Upload** to Supabase Storage (`booth-images` bucket)
3. **Store** the permanent Supabase Storage URL in `photo_exterior_url`

### Benefits
- ✅ Photos never expire
- ✅ Faster loading (no Google API calls)
- ✅ Full control over images
- ✅ Reduced API dependency
- ✅ Better caching

### Storage Costs
- Supabase Storage: ~$0.021/GB/month
- 307 photos × ~200KB average = ~60MB = $0.00126/month
- Negligible cost for permanent reliability

## Implementation

### 1. Migration Script

**File:** `scripts/download-and-host-photos.ts`

Migrates existing Google URLs to Supabase Storage:
- Downloads photos from Google (while still valid)
- Uploads to `booth-images/booth-photos/` folder
- Updates `photo_exterior_url` field
- Gracefully handles expired references

**Usage:**
```bash
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/download-and-host-photos.ts
```

### 2. Enrichment Function Updates

**File:** `supabase/functions/enrich-booth/index.ts`

When enriching booths with Google Places data:
1. Get photo_reference from Google Places API
2. Immediately download the actual image
3. Upload to Supabase Storage
4. Store permanent URL instead of temporary reference

### 3. Crawler Updates

**File:** `supabase/functions/unified-crawler/index.ts`

When scraping photos from websites:
1. Download image from source URL
2. Upload to Supabase Storage
3. Store permanent URL

## Photo Fields

### Database Schema

```typescript
photo_exterior_url: string | null;        // Primary exterior photo (prefer Supabase hosted)
photo_interior_url: string | null;        // Interior photo if available
ai_generated_image_url: string | null;    // AI-generated artistic visualization
ai_preview_url: string | null;            // AI preview image (fallback)
google_photos: string[] | null;           // Array of additional Google photos (can be temporary)
```

### Priority Order (BoothImage Component)

1. **photo_exterior_url** - Real community/enriched photo (now permanently hosted)
2. **ai_generated_image_url** - AI-generated visualization
3. **ai_preview_url** - AI preview (Supabase hosted, won't expire)
4. **Placeholder** - Vintage booth illustration

## Supabase Storage Setup

### Bucket: `booth-images`

**Configuration:**
- Public: Yes (for direct browser access)
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp

**Folder Structure:**
```
booth-images/
├── booth-photos/          # Permanent booth exterior/interior photos
│   └── booth-{hash}-exterior.jpg
├── ai-previews/           # AI-generated preview images
│   └── booth-{id}-ai-preview-{timestamp}.png
└── community/             # User-uploaded photos
    └── {booth-id}/{photo-id}.jpg
```

**Storage Policy:**
```sql
-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'booth-images');

-- Allow service role full access
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
USING (auth.role() = 'service_role');
```

## Monitoring & Maintenance

### Check for Google URLs Still in Database

```bash
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

const { count } = await supabase
  .from('booths')
  .select('*', { count: 'exact', head: true })
  .like('photo_exterior_url', '%maps.googleapis.com%');

console.log('Booths still using Google URLs:', count);
if (count > 0) {
  console.log('⚠️  Run migration script to fix');
}
"
```

### Storage Usage

```bash
# Check total storage used
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://tmgbmcbwfkvmylmfpkzy.supabase.co/rest/v1/rpc/get_storage_usage
```

## Prevention Checklist

- [x] Migration script created (`download-and-host-photos.ts`)
- [ ] Update `enrich-booth` function to auto-download photos
- [ ] Update `unified-crawler` to auto-download photos
- [ ] Add integration tests for photo hosting
- [ ] Document in contributor guidelines
- [ ] Add monitoring alert if Google URLs appear

## Historical Context

**Timeline:**
- **Nov 2025:** Booths enriched with Google photo references
- **Jan 4, 2026:** Photo references expired, causing 289 booths to show no photos
- **Jan 4, 2026:** Root cause identified - Google photo_reference expiration
- **Jan 4, 2026:** Permanent solution implemented - download and host ourselves

**Key Learning:** Never trust external temporary URLs for critical user-facing content. Always download and host permanently.

## Related Files

- `scripts/download-and-host-photos.ts` - Migration script
- `scripts/check-missing-photos.ts` - Diagnostic script
- `scripts/update-google-photo-api-keys.ts` - Legacy (no longer needed)
- `src/components/booth/BoothImage.tsx` - Photo display logic
- `supabase/functions/enrich-booth/index.ts` - Enrichment function

## Support

If photos are missing:
1. Check if booth has `photo_exterior_url` in database
2. Check if URL is Google Maps (temporary) or Supabase (permanent)
3. Run migration script if needed
4. Re-enrich booth if photo reference expired
