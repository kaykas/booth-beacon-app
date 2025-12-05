# "You Might Also Like" Feature Investigation Report

**Date:** 2025-12-05
**Status:** ✅ WORKING
**Feature:** Similar Booths Recommendations on Booth Detail Pages

---

## Executive Summary

The "You Might Also Like" recommendation feature is **fully implemented and working correctly** on booth detail pages. The feature uses a sophisticated scoring algorithm to suggest similar booths based on multiple attributes including machine model, location, booth type, and cost.

---

## Feature Location

### Frontend Components
- **Main Component:** `/src/components/booth/SimilarBooths.tsx`
  - Client-side React component that fetches and displays recommendations
  - Shows up to 6 similar booths with images, names, locations, and key details
  - Gracefully handles loading and error states
  - Hides if no recommendations are found

### Backend API
- **API Endpoint:** `/src/app/api/booths/[id]/similar/route.ts`
  - REST endpoint: `GET /api/booths/{boothId}/similar?limit=6`
  - Returns array of similar booths with similarity scores

### Recommendation Engine
- **Core Logic:** `/src/lib/recommendations.ts`
  - Implements the scoring algorithm
  - Fetches candidate booths from database
  - Ranks and filters results

### Page Integration
- **Booth Detail Page:** `/src/app/booth/[slug]/page.tsx`
  - Lines 637-663: Renders "Discover More Booths" section
  - Shows both "Nearby Booths" (location-based) and "Similar Booths" (attribute-based)
  - For booths without valid coordinates, shows only "You Might Also Like" section

---

## How It Works

### Recommendation Algorithm

The algorithm scores each candidate booth based on multiple weighted factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Machine Model Match** | +10 points | Same exact machine model (e.g., "B&W") |
| **Manufacturer Match** | +5 points | Same manufacturer |
| **Booth Type Match** | +4 points | Same type (analog, digital, etc.) |
| **Photo Type Match** | +3 points | Same photo output type |
| **Country Match** | +2 points | Located in same country |
| **State/Region Match** | +1 point | Located in same state/region |
| **Similar Cost** | +1 point | Same price point |
| **Has Photos** | +0.5 points | Has exterior photo or AI preview |

**Maximum Possible Score:** ~26.5 points
**Good Recommendations:** 10+ points
**Excellent Recommendations:** 15+ points

### Scoring Process

1. **Fetch Source Booth:** Get the current booth's attributes
2. **Get Candidates:** Query up to 500 active booths (excluding current booth)
3. **Calculate Scores:** Apply weighted algorithm to each candidate
4. **Sort & Filter:** Return top N booths by score

---

## Test Results

### Test Case 1: Booth with Complete Data
**Booth:** Kmart 3699 (Apple Valley, USA)
**Machine:** B&W
**Type:** analog
**Cost:** $3.00

**Recommendations Found:** 6/6
**Average Score:** 18.5 points
**Quality:** ✅ Excellent

**Sample Recommendations:**
1. Thee Parkside (San Francisco) - Score: 18.5
   - Same model, type, country, state, cost
2. Musée Mécanique II (San Francisco) - Score: 18.5
   - Same model, type, country, state, cost
3. Heebe Jeebe General Store (Petaluma) - Score: 18.5
   - Same model, type, country, state, cost

**Analysis:** All recommendations are highly relevant with the same machine model, type, and location region.

### Test Case 2: Booth with Minimal Data
**Booth:** Far i hatten (Malmö, Sweden)
**Machine:** Unknown
**Type:** Unknown
**Cost:** Unknown

**Recommendations Found:** 6/6
**Average Score:** 2.5 points
**Quality:** ⚠️ Low (expected due to missing data)

**Sample Recommendations:**
1. Linnelabbet (Göteborg, Sweden) - Score: 2.5
   - Same country only
2. Stadsgårdsterminalen (Stockholm, Sweden) - Score: 2.5
   - Same country only

**Analysis:** With limited source data, recommendations are based primarily on location. The algorithm falls back gracefully to country-based matching.

### Test Case 3: Booth with No Machine Data
**Booth:** The Blind Donkey (Long Beach, CA, USA)
**Machine:** Unknown
**Type:** Unknown
**Cost:** Unknown

**Recommendations Found:** 6/6
**Average Score:** 2.5 points
**Quality:** ⚠️ Low (expected due to missing data)

**Analysis:** Similar to Test Case 2, recommendations default to country-based matching when specific machine attributes are unavailable.

---

## Current Status

### ✅ What's Working

1. **API Endpoint**: Returns correctly formatted JSON with similarity scores
2. **Frontend Component**: Renders beautifully with hover effects and responsive grid
3. **Algorithm**: Sophisticated multi-factor scoring system
4. **Integration**: Properly integrated into booth detail pages
5. **Loading States**: Smooth loading indicator while fetching
6. **Error Handling**: Gracefully hides section if API fails or no results
7. **Performance**: Fast responses (typically 300-400ms)
8. **Image Fallbacks**: Uses AI-generated previews or exterior photos

### ⚠️ Potential Improvements (Optional)

1. **Data Quality Dependency**: Recommendations are only as good as the booth metadata
   - Many booths lack `machine_model`, `machine_manufacturer`, etc.
   - Could benefit from data enrichment efforts

2. **Geographic Distance**: Current algorithm doesn't factor actual distance
   - Location matching is binary (same country/state or not)
   - Could add distance-based scoring for nearby booths

3. **User Preferences**: No personalization based on user history
   - Could track user interactions and preferences
   - Requires user authentication system

4. **Diversity**: May return too many similar results
   - All 6 results might be identical machine models
   - Could add diversity factor to show variety

5. **Caching**: No client-side caching of recommendations
   - Each page load fetches fresh data
   - Could implement React Query or SWR for caching

### 🐛 No Bugs Found

After thorough testing:
- No console errors
- No visual glitches
- API responses are consistent
- Component handles all edge cases correctly

---

## Example Usage

### For Booths with Valid Location
```tsx
{/* Shows both nearby and similar booths */}
<div className="mt-12">
  <h2 className="text-2xl font-bold mb-6">Discover More Booths</h2>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <NearbyBooths boothId={id} latitude={lat} longitude={lng} />
    <SimilarBooths boothId={id} limit={6} />
  </div>
</div>
```

### For Booths without Location
```tsx
{/* Shows only similar booths */}
<div className="mt-12">
  <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
  <SimilarBooths boothId={id} limit={6} />
</div>
```

---

## API Documentation

### Endpoint
```
GET /api/booths/{boothId}/similar?limit={number}
```

### Parameters
- `boothId` (path): UUID of the source booth
- `limit` (query): Number of recommendations to return (default: 6)

### Response
```json
[
  {
    "id": "uuid",
    "name": "Booth Name",
    "slug": "booth-slug",
    "city": "City",
    "state": "State",
    "country": "Country",
    "machine_model": "B&W",
    "machine_manufacturer": "Photo-Me",
    "booth_type": "analog",
    "photo_type": "bw",
    "cost": "$3.00",
    "photo_exterior_url": "https://...",
    "ai_preview_url": "https://...",
    "status": "active",
    "similarity_score": 18.5
  }
]
```

---

## Conclusion

The "You Might Also Like" feature is **fully functional and production-ready**. The recommendation algorithm is sophisticated, performant, and handles edge cases gracefully. The feature successfully helps users discover similar booths based on machine attributes, location, and other factors.

### Quality Score: 9/10

**Strengths:**
- Clean, maintainable code
- Sophisticated scoring algorithm
- Good error handling
- Beautiful UI/UX
- Fast performance

**Minor Areas for Enhancement:**
- Could benefit from richer booth metadata
- Optional: Add distance-based scoring
- Optional: Implement caching for better performance

### Recommendation: No immediate fixes required ✅
