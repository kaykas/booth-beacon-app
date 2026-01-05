# 🚀 Street View Fix - IN PROGRESS

**Started:** January 4, 2026
**Status:** ⏳ Running validation on all 810 booths
**Progress:** ~56/810 booths (7% complete after 1 minute)
**ETA:** ~12 minutes remaining

---

## ✅ What's Happening Right Now

The universal Street View validation script is running in the background:

```
🔄 Validating: Deerfoot Mall
   ✅ Panorama found: 2TLxbQnpYkqFizbbFfDVdA
   📏 Distance: 5m
   🧭 Heading: 156°

🔄 Validating: Cat Cafe "Ragdoll"
   ✅ Panorama found: CAoSF0NJSE0wb2dLRUlDQWdJQ3V1Y2Zxc0FF
   📏 Distance: 4m
   🧭 Heading: 79°

🔄 Validating: Little Anthony's Diner
   ✅ Panorama found: CAoSF0NJSE0wb2dLRUlDQWdJRE1zTWVYd2dF
   📏 Distance: 8m
   🧭 Heading: 206°
```

**What each booth gets:**
1. ✅ **Panorama ID** - Specific Google panorama reference
2. 📏 **Distance** - How far panorama is from booth (meters)
3. 🧭 **Heading** - Optimal camera angle toward booth entrance
4. ✅ **Validated timestamp** - When validation occurred

---

## 🎯 What This Fixes

### Before (BROKEN)
Every booth page used raw coordinates:
```typescript
streetViewUrl = `...&location=${lat},${lng}...`
// Google picks NEAREST panorama → Often wrong business ❌
```

**Example:**
- "The Smith Lincoln Center" page showed "Josephina restaurant" ❌
- User confusion and lost trust
- Affects ALL 810 booth pages

### After (FIXED)
Every booth page will use specific panorama ID:
```typescript
streetViewUrl = `...&pano=${panoramaId}&heading=${heading}...`
// Google shows EXACT panorama we validated → Correct business ✅
```

**Example:**
- "The Smith Lincoln Center" will show "The Smith" ✅
- Accurate location visualization
- Optimal camera heading toward entrance

---

## 📊 Expected Results

### Success Rate Estimate
Based on test runs:
- ✅ **~730 booths (90%)** - Will have Street View available
- ⚠️ **~80 booths (10%)** - No Street View (remote areas)
- ❌ **~0 booths** - API failures (rate limit = 1/sec)

### Database Impact
After completion, 810 booth records will have:
```sql
UPDATE booths SET
  street_view_available = true/false,
  street_view_panorama_id = 'CAoSL...',
  street_view_distance_meters = 12.5,
  street_view_heading = 145,
  street_view_validated_at = NOW()
WHERE id = '...';
```

---

## 🔍 Monitoring Progress

### Check Progress
```bash
# Count completed validations
grep -c "✅ Panorama found" /tmp/street-view-validation.log

# Watch live (last 20 lines)
tail -20 /tmp/street-view-validation.log

# Full log
cat /tmp/street-view-validation.log
```

### Estimated Timeline
```
Minute 0: Start (810 booths queued)
Minute 1: ~60 booths validated (7%)
Minute 5: ~300 booths validated (37%)
Minute 10: ~600 booths validated (74%)
Minute 13: ~810 booths validated (100%) ✅
```

---

## ⚡ What Happens After Validation

### 1. Database Updated ✅
All 810 booth records now have panorama IDs stored

### 2. Component Uses New Data ✅
`StreetViewEmbed.tsx` already has logic to use panorama IDs:
```typescript
const streetViewUrl = streetViewPanoramaId
  ? `...&pano=${streetViewPanoramaId}...` // ← Uses validated ID
  : `...&location=${lat},${lng}...`;      // ← Old fallback
```

### 3. ISR Cache Revalidates
Next.js pages revalidate every 1 hour:
- Pages visited AFTER validation → Show correct Street View ✅
- Pages still cached → Revalidate within 1 hour
- Hard refresh (Cmd+Shift+R) → See immediately

### 4. Future Enrichments Auto-Validate
`enrich-booth` Edge Function now includes Street View validation:
- Any newly enriched booth → Automatically validated
- No manual validation needed going forward

---

## 🧪 Testing After Completion

### Test The Smith (Your Example)
```bash
# Visit the page
open https://boothbeacon.org/booth/the-smith-lincoln-center-new-york

# Check database
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data } = await supabase
  .from('booths')
  .select('street_view_panorama_id, street_view_heading')
  .eq('slug', 'the-smith-lincoln-center-new-york')
  .single();

console.log('Panorama ID:', data.street_view_panorama_id);
console.log('Heading:', data.street_view_heading);
"
```

**Expected:**
- Panorama ID exists (not NULL)
- Heading is set (e.g., 145°)
- Street View shows The Smith, not Josephina ✅

### Random Sample Test
```bash
# Check 10 random booths
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: booths } = await supabase
  .from('booths')
  .select('name, slug, street_view_available, street_view_panorama_id')
  .not('street_view_panorama_id', 'is', null)
  .limit(10);

console.log('Sample validated booths:');
booths.forEach(b => {
  console.log(\`  ✅ \${b.name} - Panorama: \${b.street_view_panorama_id.substring(0, 12)}...\`);
});
"
```

---

## 📈 Success Metrics

### Validation Coverage
- **Target:** 810 booths validated (100%)
- **Expected availability:** ~730 booths (90%)
- **Expected unavailability:** ~80 booths (10% - remote areas)

### User Experience
- ✅ Street Views show correct business locations
- ✅ No more "wrong restaurant" confusion
- ✅ Optimal camera heading toward entrance
- ✅ Distance warnings for panoramas >25m away

### Technical
- ✅ Every booth has `street_view_validated_at` timestamp
- ✅ Component logic already implemented
- ✅ Future enrichments auto-validate
- ✅ Rate limit respected (1 req/sec)

---

## 🐛 Known Issues

### Some Booths May Show "Unavailable"
**Reason:** No Street View coverage within 50m
**Affected:** ~10% of booths (rural areas, new developments)
**Display:** Component shows "Street View Not Available" message
**Workaround:** "Open in Google Maps" button still works

### ISR Cache Delay
**Issue:** Cached pages won't update until next revalidation
**Timeline:** Pages revalidate every 1 hour automatically
**Workaround:** Hard refresh (Cmd+Shift+R) shows fresh data
**Solution:** On-demand revalidation (already implemented!)

---

## 🔄 Future Maintenance

### Re-Validation Schedule
Google updates Street View imagery over time. Re-validate quarterly:

```bash
# Every 3 months
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/validate-street-view-universal.ts
```

### Monitoring
Track validation status:
```sql
-- Coverage report
SELECT
  COUNT(*) as total_booths,
  COUNT(*) FILTER (WHERE street_view_validated_at IS NOT NULL) as validated,
  COUNT(*) FILTER (WHERE street_view_available = true) as available,
  COUNT(*) FILTER (WHERE street_view_available = false) as unavailable
FROM booths
WHERE latitude IS NOT NULL;
```

---

## 📁 Related Files

**Validation:**
- `scripts/validate-street-view-universal.ts` - Main validation script
- `scripts/fix-all-street-views.sh` - Automated fix wrapper

**Component:**
- `src/components/booth/StreetViewEmbed.tsx` - Uses validated data

**Edge Function:**
- `supabase/functions/validate-street-view/index.ts` - Server-side validation
- `supabase/functions/enrich-booth/index.ts` - Auto-validation on enrichment

**Documentation:**
- `docs/STREET_VIEW_HANDOFF.md` - Technical handoff
- `docs/STREET_VIEW_IMPLEMENTATION_GUIDE.md` - Implementation guide
- `URGENT_STREET_VIEW_FIX.md` - Action plan

---

## ⏰ Status Updates

**Current:** ⏳ In progress (~7% complete)
**ETA:** ~12 minutes remaining
**Next update:** Check progress in 5 minutes

**Command to monitor:**
```bash
watch -n 10 'grep -c "✅ Panorama found" /tmp/street-view-validation.log'
```

---

**Last Updated:** January 4, 2026
**Process:** Running in background (task ID: b57b0aa)
**Log:** `/tmp/street-view-validation.log`
