# Booth Detail Page - Data Quality Analysis

## Current Data Completeness (289 photobooth.net booths)

| Field | Coverage | Status |
|-------|----------|--------|
| Machine Model | 176 (61%) | ✅ Good |
| Cost | 176 (61%) | ✅ Good |
| Description | 176 (61%) | ✅ Good |
| Coordinates | 144 (50%) | ⚠️ Needs geocoding |
| Hours | 0 (0%) | ❌ Missing |
| Phone | 0 (0%) | ❌ Missing |
| Website | 0 (0%) | ❌ Missing |
| Google Rating | 0 (0%) | ❌ Missing |
| AI Images | 0 (0%) | ❌ Missing |

---

## What's Currently Displayed on Booth Pages

### ✅ Currently Showing
1. **Name** - Always present
2. **Location** (city, state, country) - Always present
3. **Status Badge** (active/inactive) - Always present
4. **Description** - When available (61%)
5. **Machine Model** - When available (61%)
6. **Cost** - When available (61%)
7. **Hours** - When available (0% - never shows)
8. **Google Rating** - When available (0% - never shows)
9. **Map** - When coordinates available (50%)
10. **Directions Button** - When coordinates available (50%)
11. **Bookmark & Share** - Always present
12. **AI-Generated Image** - Fallback when no photo (0%)

### ❌ Have Data But Not Displaying Prominently
1. **Operator Name** - We have it (from `operator_name` field) but not showing
2. **Payment Methods** - We have accepts_cash/accepts_card but not showing
3. **Active/Inactive Status** - We have status + is_operational but only showing badge

### ❌ Missing Data Entirely
1. **Hours of Operation** - photobooth.net doesn't provide this
2. **Phone Number** - photobooth.net doesn't provide this
3. **Website** - photobooth.net doesn't provide this
4. **Instagram** - photobooth.net doesn't provide this
5. **Google Ratings** - Not enriched yet
6. **Photos** - No real photos, AI images not generated yet

---

## Recommendations for Improvement

### 🔥 Quick Wins (Can Do Now)

#### 1. Display Operator Information
```tsx
// Add to booth detail page
{booth.operator_name && (
  <div className="flex justify-between">
    <span className="text-neutral-600">Operator</span>
    <span className="font-medium">{booth.operator_name}</span>
  </div>
)}
```

#### 2. Display Payment Methods
```tsx
{(booth.accepts_cash || booth.accepts_card) && (
  <div className="flex justify-between">
    <span className="text-neutral-600">Payment</span>
    <span className="font-medium">
      {booth.accepts_cash && booth.accepts_card ? 'Cash & Card' :
       booth.accepts_cash ? 'Cash Only' :
       booth.accepts_card ? 'Card Only' : 'Unknown'}
    </span>
  </div>
)}
```

#### 3. Better "No Data" States
Show helpful messages when data is missing:
```tsx
{!booth.hours && (
  <div className="text-sm text-neutral-500 italic">
    Hours not available - check venue hours
  </div>
)}
```

#### 4. Source Attribution
```tsx
<div className="text-xs text-neutral-500">
  Data from {booth.source_primary}
  {booth.last_verified && ` · Last verified ${formatDate(booth.last_verified)}`}
</div>
```

### 🚀 Medium Effort (Implement Enrichment)

#### 5. Google Maps Enrichment (Design Ready!)
You already have `ENRICHMENT-DESIGN.md` - this will add:
- ✅ Hours of operation
- ✅ Phone number
- ✅ Website
- ✅ Google ratings (with star display)
- ✅ Google photos (5 per booth)
- ✅ Business status (operational/closed)

**Cost:** ~$0.05 per booth, ~$15 for all 289 booths

#### 6. AI Image Generation
Generate hero images for booths without photos using:
- Stable Diffusion or DALL-E
- Prompt: "Analog photo booth in [city], [description style]"
- Already have `ai_generated_image_url` field in schema

---

## Page Layout Improvements

### Current Issues
1. **Empty Space** - When data is missing, sections look sparse
2. **No Visual Hierarchy** - All data fields look equally important
3. **Missing Call-to-Action** - What should user do next?
4. **No Social Proof** - No ratings, reviews, or visit counts

### Recommended Layout Changes

#### Option A: Card-Based Layout
```
┌─────────────────────────────────────┐
│  HERO IMAGE (AI-generated fallback) │
├─────────────────────────────────────┤
│  Name + Status Badge                │
│  ★★★★☆ 4.5 (120 reviews) [Google]  │
│  📍 Location + Map Preview           │
├─────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  │
│  │  Essential  │  │   Visit Info │  │
│  │  - Cost     │  │   - Hours    │  │
│  │  - Machine  │  │   - Phone    │  │
│  │  - Operator │  │   - Website  │  │
│  └─────────────┘  └──────────────┘  │
├─────────────────────────────────────┤
│  Description + Photos Gallery       │
├─────────────────────────────────────┤
│  [ Get Directions ] [ Save ]        │
└─────────────────────────────────────┘
```

#### Option B: Sidebar Layout (Current)
Enhance existing layout with:
- **Sticky sidebar** on desktop
- **Collapsible sections** on mobile
- **Visual indicators** for missing data
- **CTAs** at top and bottom

---

## Data Quality Priority Matrix

### Priority 1: Critical Missing Data
1. **Coordinates** (50% coverage) → Run geocoding
2. **Machine/Cost** (61% coverage) → Improve schema extraction
3. **Status accuracy** (Need verification system)

### Priority 2: High Value Additions
1. **Google Enrichment** → Hours, phone, ratings, photos
2. **AI Images** → Visual appeal for every booth
3. **Operator info display** → Already have data, just show it

### Priority 3: Nice to Have
1. **User photos** → Community uploads
2. **Check-ins** → Social proof
3. **Reviews** → User-generated content
4. **Instagram feed** → If booth has account

---

## Actionable Next Steps

### This Week
1. ✅ **Display operator names** (5 min fix)
2. ✅ **Display payment methods** (5 min fix)
3. ✅ **Add source attribution** (10 min fix)
4. ⚠️ **Fix empty states** (30 min fix)

### Next 2 Weeks
1. 🚀 **Implement Google Maps enrichment** (2-3 days)
   - Deploy edge function
   - Enrich top 100 booths first
   - Monitor costs and quality
2. 🎨 **Generate AI images** (1-2 days)
   - Set up Stable Diffusion or DALL-E API
   - Generate for booths without photos
   - Store in Supabase storage

### Next Month
1. 📊 **Add analytics** - Track which fields users engage with
2. 🎯 **A/B test layouts** - Test card vs sidebar
3. 💬 **Add community features** - Photos, check-ins, reviews

---

## Example: Before vs After

### BEFORE (Current)
```
Flinders Street Station II
Melbourne, Victoria
Status: Active

Machine: B&W
Cost: $4.00

[Description text...]

[ Get Directions ] [ Save ]
```

### AFTER (With Enrichment + Display Improvements)
```
Flinders Street Station II  [ACTIVE ✓]
★★★★☆ 4.5 (120 Google reviews)
Melbourne, Victoria · photobooth.net

──────────────────────────
VISIT INFO
🕒 Hours: Mon-Fri 7am-7pm
💵 Cost: $4.00 (Cash & Card)
📞 Phone: +61 3 9610 2030
🌐 Website: [link]

MACHINE DETAILS
Model: B&W Analog
Operator: Victoria Jarvis
Photos: 4 per strip

LOCATION
[Mini map preview]
Flinders Street Station
123 Flinders St, Melbourne VIC 3000

[ 🧭 Get Directions ] [ ❤️ Save ] [ 📤 Share ]

──────────────────────────
[Photo gallery - Google + AI images]

[Description text...]

──────────────────────────
Last verified: 2 weeks ago
Report an issue | Suggest edit
```

---

## Summary

**Current State:** Decent data coverage (61%) but poor display
**Main Issues:**
1. Not showing all available data (operator, payment)
2. No enrichment data (hours, phone, ratings, photos)
3. Poor empty states
4. No visual appeal (missing images)

**Quick Wins:** Display hidden data fields (30 min work)
**High Impact:** Google enrichment + AI images (1 week work)
**Expected Result:** Professional, informative booth pages with 90%+ data coverage
