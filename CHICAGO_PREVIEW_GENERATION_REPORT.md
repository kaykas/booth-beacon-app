# Chicago Booth AI Preview Generation Report

**Date:** January 2, 2026
**Task:** Generate AI preview images for 5 Chicago booths without images

---

## Executive Summary

**STATUS: BLOCKED - OpenAI Billing Limit Reached**

The AI preview generation task cannot be completed due to the OpenAI API key having reached its billing hard limit. While the infrastructure and scripts are working correctly, no actual AI-generated images can be created until the OpenAI account billing issue is resolved.

---

## Target Booths

The following 5 Chicago booths were identified as needing AI preview images:

1. **Schubas** (slug: `schubas-chicago-1`)
   - Address: 3159 N. Southport Ave., Chicago, USA

2. **Reckless Records** (slug: `reckless-records-chicago-1`)
   - Address: 1532 N. Milwaukee Ave., Chicago, USA

3. **Quimby's Bookstore** (slug: `quimby-s-bookstore-chicago-1`)
   - Address: 1854 W. North Ave., Chicago, USA

4. **Sheffield's** (slug: `sheffield-s-chicago-1`)
   - Address: 3258 N. Sheffield Ave., Chicago, USA

5. **Charleston** (slug: `charleston-chicago`)
   - Address: 2076 N Hoyne Ave., Chicago, USA

---

## Technical Details

### API Endpoint Available
- **Individual Generation:** `POST /api/booths/generate-preview`
- **Batch Generation:** `POST /api/booths/batch-generate-previews`

### Image Generation Service
- **Primary:** OpenAI DALL-E 3
- **Fallback:** Placeholder SVG (`/placeholder-booth.svg`)
- **Location:** `/Users/jkw/Projects/booth-beacon-app/src/lib/imageGeneration.ts`

### Scripts Created
Two scripts were created for this task:

1. **API-based script:**
   - File: `/Users/jkw/Projects/booth-beacon-app/scripts/generate-chicago-previews.ts`
   - Calls the production API endpoint
   - Suitable for remote execution

2. **Direct script:**
   - File: `/Users/jkw/Projects/booth-beacon-app/scripts/generate-chicago-previews-direct.ts`
   - Directly imports and uses image generation functions
   - Bypasses API layer for faster execution

---

## Issue Encountered

### OpenAI API Billing Limit Reached

**Error Message:**
```
BadRequestError: 400 Billing hard limit has been reached
```

**Error Code:** `billing_hard_limit_reached`

**Impact:**
- DALL-E 3 API calls fail immediately
- No AI images can be generated
- System falls back to placeholder SVG
- Placeholder URLs are relative paths (`/placeholder-booth.svg`) and don't persist to database

**API Response Details:**
```json
{
  "error": {
    "message": "Billing hard limit has been reached",
    "type": "image_generation_user_error",
    "param": null,
    "code": "billing_hard_limit_reached"
  }
}
```

---

## Current Status

All 5 booths still have **NO** `ai_preview_url` in the database:

| Booth | Has Preview | Status |
|-------|-------------|--------|
| Charleston | ❌ | No preview |
| Quimby's Bookstore | ❌ | No preview |
| Reckless Records | ❌ | No preview |
| Schubas | ❌ | No preview |
| Sheffield's | ❌ | No preview |

---

## Resolution Options

### Option 1: Add Credits to OpenAI Account (Recommended)
**Steps:**
1. Log into OpenAI account (organization: `user-dbzr65ezoewpv03b68cpknot`)
2. Navigate to Billing settings
3. Add payment method or increase billing limit
4. Wait for limit to be applied (usually immediate)
5. Re-run the generation script

**Cost Estimate:**
- DALL-E 3 Standard Quality: $0.040 per image
- 5 images = $0.20
- Recommended: Add at least $5-10 for future use

**Command to run after billing is resolved:**
```bash
export NEXT_PUBLIC_SUPABASE_URL="https://tmgbmcbwfkvmylmfpkzy.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTExOTksImV4cCI6MjA3OTc2NzE5OX0.nVAPKx30OTNSaZ92Koeg_gUonm3Zols3FOTvfO5TrrA"
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"
npx tsx scripts/generate-chicago-previews-direct.ts
```

### Option 2: Use Alternative Image Generation Service
**Steps:**
1. Integrate Google Imagen 3 API (API key already available in env)
2. Update `/Users/jkw/Projects/booth-beacon-app/src/lib/imageGeneration.ts`
3. Add Imagen 3 as primary or fallback service
4. Re-run generation script

**Pros:**
- Google Imagen 3 is high quality
- API key already configured

**Cons:**
- Requires code changes
- Additional testing needed
- Different pricing model

### Option 3: Use Stock Photos or Manual Images
**Steps:**
1. Source images from Unsplash, Pexels, or Google Street View
2. Manually upload to Supabase storage
3. Update booth records with image URLs

**Pros:**
- Can be done immediately
- No API costs
- Potentially higher quality/accuracy

**Cons:**
- Manual work required
- Doesn't scale for future booths
- May not have "vintage photo booth" aesthetic

### Option 4: Use Different OpenAI API Key
**Steps:**
1. Create new OpenAI account or use different organization
2. Update `OPENAI_API_KEY` in `.env.local`
3. Re-run generation script

**Pros:**
- Quick solution if alternative key available
- No code changes needed

**Cons:**
- Requires access to another OpenAI account
- Just delays the billing issue

---

## Infrastructure Validation

### ✅ Working Components
- Supabase database connection
- Booth data retrieval by slug
- Image generation library structure
- Upload to Supabase storage
- Database update functions
- Script execution framework

### ❌ Blocked Components
- OpenAI DALL-E 3 API calls
- AI image generation
- Complete workflow execution

---

## Next Steps

### Immediate (Required)
1. **Resolve OpenAI billing issue** by adding credits to account
2. Verify billing limit has been lifted
3. Re-run generation script

### Short-term (Within 1 week)
1. Implement Google Imagen 3 as alternative service
2. Add better error handling for billing failures
3. Create monitoring for API usage/limits

### Long-term (Within 1 month)
1. Set up billing alerts for all AI services
2. Implement image generation queue for cost optimization
3. Consider caching/reusing similar generated images

---

## Files Modified/Created

### Created Files
- `/Users/jkw/Projects/booth-beacon-app/scripts/generate-chicago-previews.ts`
- `/Users/jkw/Projects/booth-beacon-app/scripts/generate-chicago-previews-direct.ts`
- `/Users/jkw/Projects/booth-beacon-app/CHICAGO_PREVIEW_GENERATION_REPORT.md` (this file)

### No Files Modified
All existing code remains unchanged and functional.

---

## API Endpoints Reference

### Generate Preview for Single Booth
```bash
curl -X POST https://boothbeacon.org/api/booths/generate-preview \
  -H "Content-Type: application/json" \
  -d '{"boothId": "BOOTH_ID_HERE"}'
```

### Batch Generate Previews
```bash
curl -X POST https://boothbeacon.org/api/booths/batch-generate-previews \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "dryRun": false}'
```

### Check Batch Status
```bash
curl https://boothbeacon.org/api/booths/batch-generate-previews
```

---

## Contact Information

**OpenAI Account:**
- Organization: `user-dbzr65ezoewpv03b68cpknot`
- Project: `proj_PNiBPt8LGUgZgOjq5IKZ7SZ3`

**Supabase Project:**
- URL: https://tmgbmcbwfkvmylmfpkzy.supabase.co
- Project Ref: `tmgbmcbwfkvmylmfpkzy`

---

## Conclusion

The task infrastructure is complete and working correctly. The only blocker is the OpenAI billing limit. Once resolved, the generation scripts can be executed immediately to create AI preview images for all 5 Chicago booths.

**Estimated Time to Complete:** 2 minutes (after billing is resolved)

**Recommended Action:** Add $5-10 to OpenAI account and re-run the direct generation script.
