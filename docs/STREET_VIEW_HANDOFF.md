# Street View Fix - Session Handoff

**Date:** January 4, 2026
**Status:** 95% complete - blocked on Google API key configuration

---

## ✅ What's Been Completed

### 1. Root Cause Identified
- **Problem:** Street View showing wrong locations for all 810 booths
- **Cause:** Database columns for Street View validation didn't exist
- **Impact:** Component fell back to coordinates → Google showed nearest panorama (wrong business)

### 2. Database Migration Applied ✅
- **File:** `supabase/migrations/20260102_add_street_view_validation.sql`
- **Status:** ✅ **APPLIED** - All 5 Street View columns now exist in production
- **Columns added:**
  - `street_view_available` (boolean)
  - `street_view_panorama_id` (text)
  - `street_view_distance_meters` (numeric)
  - `street_view_validated_at` (timestamptz)
  - `street_view_heading` (numeric)

### 3. Universal Validation Script Created ✅
- **File:** `scripts/validate-street-view-universal.ts`
- **Purpose:** Validates Street View for all 810 booths
- **Status:** Ready to run (blocked by API key issue)

### 4. Edge Function Created ✅
- **File:** `supabase/functions/validate-street-view/index.ts`
- **Status:** ✅ **DEPLOYED** to production
- **Purpose:** Server-side validation using Edge Function's API key

### 5. Enrichment Pipeline Updated ✅
- **File:** `supabase/functions/enrich-booth/index.ts`
- **Status:** ✅ **DEPLOYED** - now includes Street View validation
- **Impact:** Future booth enrichments automatically validate Street View

### 6. Documentation Created ✅
- `docs/STREET_VIEW_DIAGNOSIS.md` - Root cause analysis
- `docs/STREET_VIEW_IMPLEMENTATION_GUIDE.md` - Implementation steps
- `docs/PHOTO_MANAGEMENT.md` - Photo expiration fix

---

## ❌ What's Blocking

### Google API Key Configuration

**Problem:** The Edge Function's `GOOGLE_MAPS_API_KEY` secret returns `REQUEST_DENIED` for Street View Metadata API calls.

**Root cause:** One of these:
1. API key doesn't have Street View Static API enabled
2. API key doesn't have billing enabled
3. Wrong API key is set in Edge Function secrets

**Current secret (hashed):** `GGi4yqZiZPDYFF4GaCeO9fxAgSc=`

---

## 🔧 What Needs to Be Done Next

### Step 1: Get Working API Key

**Go to:** https://console.cloud.google.com/apis/credentials

**Requirements:**
- ✅ Has Street View Static API enabled
- ✅ Has billing account linked
- ✅ No IP/referrer restrictions (for server-side use)
- Format: `AIzaSy...` (starts with AIzaSy, ~39 characters)

### Step 2: Update Edge Function Secret

```bash
cd /Users/jkw/Projects/booth-beacon-app

SUPABASE_ACCESS_TOKEN="sbp_14a867610b4ad9f9171b6266d6fb4fae43ed0896" \
supabase secrets set GOOGLE_MAPS_API_KEY="YOUR_ACTUAL_API_KEY" \
--project-ref tmgbmcbwfkvmylmfpkzy
```

### Step 3: Test Validation

```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk" \
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
(async () => {
  const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: booth } = await supabase.from('booths').select('id').ilike('name', '%heebe%jeebe%').single();

  const response = await fetch('https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/validate-street-view', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ boothId: booth.id }),
  });

  const result = await response.json();
  console.log('Test result:', JSON.stringify(result, null, 2));

  if (result.success && result.available && result.panoramaId) {
    console.log('\n✅ SUCCESS! API key working. Ready to run batch validation.');
  } else {
    console.log('\n❌ Still failing. Check API key configuration.');
  }
})();
"
```

### Step 4: Run Universal Validation

Once test passes, run on all 810 booths (~14 minutes):

```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk" \
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
(async () => {
  const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('🚀 Running universal Street View validation on all 810 booths...\n');

  const response = await fetch('https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/validate-street-view', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ batch: true, limit: 810 }),
  });

  const result = await response.json();
  console.log('Summary:', JSON.stringify(result, null, 2));
})();
"
```

---

## 📊 Expected Results

Once API key is fixed and validation runs:
- **~730 booths (90%)** with Street View available
- **~80 booths (10%)** unavailable (remote areas)
- All booths have specific panorama IDs
- No more wrong Street View locations

---

## 🎯 Impact Summary

**Before:**
- ❌ 810 booths using coordinates → wrong Street View
- ❌ "Heebe Jeebe" shows "Fermi"
- ❌ Poor user experience

**After (once API key fixed):**
- ✅ 810 booths validated with panorama IDs
- ✅ Optimal camera heading
- ✅ Automatic validation in enrichment pipeline
- ✅ No more wrong locations

---

## 📁 Key Files

**Scripts:**
- `scripts/validate-street-view-universal.ts` - Standalone validation
- `scripts/check-heebe-streetview.ts` - Diagnostic tool

**Edge Functions:**
- `supabase/functions/validate-street-view/index.ts` - Validation function (deployed)
- `supabase/functions/enrich-booth/index.ts` - Enrichment with Street View (deployed)

**Documentation:**
- `docs/STREET_VIEW_DIAGNOSIS.md` - Root cause
- `docs/STREET_VIEW_IMPLEMENTATION_GUIDE.md` - Full guide
- `docs/PHOTO_MANAGEMENT.md` - Photo fix

**Migrations:**
- `supabase/migrations/20260102_add_street_view_validation.sql` - Applied ✅

---

## 🔑 API Keys Reference

**Client-side key (referrer-restricted):**
- `AIzaSyD8EsT8nSCCtkkShAbRwHg67hrPMXPoeHo`
- Used in: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Works for: Browser-side Maps/Places
- Does NOT work for: Server-side Street View

**Server-side key (needed):**
- Current secret: `GGi4yqZiZPDYFF4GaCeO9fxAgSc=` (hashed)
- Must have: Street View Static API enabled + billing
- Get from: https://console.cloud.google.com/apis/credentials

---

## ⏭️ Next Session Quick Start

1. Open this file: `docs/STREET_VIEW_HANDOFF.md`
2. Get API key from Google Cloud Console
3. Update Edge Function secret (command above)
4. Test validation (command above)
5. Run batch validation on all 810 booths

**Estimated time:** 20 minutes to fix + 14 minutes for validation

---

**Status:** Ready to resume once API key is configured.
