# Real UX Issues to Fix - Booth Detail Page

**Date:** January 4, 2026
**Status:** Identified by user testing

---

## 🚨 Critical Issues (User Reported)

### Issue #1: Right Sidebar is Cluttered and Confusing
**Problem:**
- "Community Stats" showing all zeros (0 Photos, 0 Reviews, 0 Rating, 0 Saves)
- "Before You Visit" checklist is too verbose (5 bullet points + pro tip)
- Takes up massive vertical space
- Not clear what's actionable vs informational

**Solution:**
- Hide "Community Stats" completely if all values are zero
- Simplify "Before You Visit" to 2-3 essential items only
- Reorder sidebar: Location → Contact → Actions → Tips (collapsed by default)

### Issue #2: Huge White Space in Main Content
**Problem:**
- When booth has no photos, no Street View, no historical notes
- Left column (lg:col-span-2) becomes nearly empty
- Creates ugly gap between hero and discovery section

**Solution:**
- Remove 2-column layout for booths with minimal content
- Use single-column layout and pull "useful" sidebar content up
- Add placeholder content: "Help us improve this listing"

### Issue #3: Discovery Section is Confusing
**Problem:**
- Heading says "Discover More Booths"
- Component then shows "More booths in San Francisco" (duplicate wording)
- Poor typography contrast makes it hard to read
- NearbyBooths and SimilarBooths feel duplicative

**Solution:**
- Use clearer heading: "More Photo Booths in San Francisco"
- Improve typography: larger text, better contrast
- Consolidate: Show either Nearby OR Similar, not both

### Issue #4: Bookmark Button Doesn't Work/Give Feedback
**Problem:**
- User clicks bookmark button
- No visual feedback
- No confirmation it worked
- Button appears multiple times (confusing)

**Solution:**
- Add immediate visual feedback (filled heart, color change)
- Show toast notification: "Saved to your collection!"
- Remove duplicate bookmark buttons, keep only one prominent location

---

## 📋 Detailed Fixes Needed

### Fix 1: Hide Empty Community Stats

**File:** `src/components/BoothStats.tsx`

**Change:**
```typescript
// At end of component, before return:
const hasAnyStats = stats.photoCount > 0 || stats.reviewCount > 0 || stats.bookmarkCount > 0;

if (!hasAnyStats) {
  return null; // Don't render component at all
}
```

### Fix 2: Simplify "Before You Visit" Checklist

**File:** `src/components/booth/VisitChecklist.tsx`

**Changes:**
1. Reduce checklist items from 5 to 3 most essential:
   - Check hours before visiting
   - Bring cash/card info (if known)
   - Call ahead if traveling far

2. Make component collapsed by default: `const [isExpanded, setIsExpanded] = useState(false);`

3. Remove verbose "Pro tip" box at bottom

### Fix 3: Improve Discovery Section Typography

**File:** `src/app/booth/[slug]/page.tsx:896-924`

**Changes:**
1. Change heading from "Discover More Booths" to be location-specific:
   ```typescript
   <h2 className="text-2xl font-bold text-neutral-900">
     More Photo Booths in {city}
   </h2>
   ```

2. Update CityBooths component to NOT repeat city name in heading

3. Show EITHER NearbyBooths OR SimilarBooths, not both side-by-side

### Fix 4: Add Bookmark Feedback

**File:** `src/components/BookmarkButton.tsx`

**Changes:**
1. Add optimistic UI update (immediate visual feedback)
2. Show toast notification on success
3. Animate heart icon on bookmark/unbookmark
4. Use larger, more prominent styling

### Fix 5: Responsive Content Layout

**File:** `src/app/booth/[slug]/page.tsx:708-750`

**Changes:**
1. Detect if booth has minimal content:
   ```typescript
   const hasMinimalContent =
     !booth.photo_exterior_url &&
     !booth.photo_interior_url &&
     !booth.historical_notes &&
     booth.street_view_available === false;
   ```

2. Use conditional layout:
   ```typescript
   <div className={hasMinimalContent ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-3 gap-8"}>
   ```

3. Add "Help Improve This Listing" call-to-action when content is sparse

---

## 🎯 Priority Order

1. **P0 - Critical (Do First):**
   - Fix 1: Hide empty Community Stats (1 line change)
   - Fix 4: Add bookmark feedback (improve trust)

2. **P1 - High (Do Next):**
   - Fix 2: Simplify Visit Checklist (reduce clutter)
   - Fix 3: Improve Discovery section typography

3. **P2 - Medium (Do After):**
   - Fix 5: Responsive content layout (more complex)

---

## 🧪 Testing After Fixes

Test with these booths:
1. **Empty booth** (minimal content): Test that layout doesn't have huge gaps
2. **Thee Parkside** (some content): Test that stats are hidden if zero
3. **Photo Booth Museum** (rich content): Test that full layout still works

---

## 📊 Expected Impact

| Issue | Before | After |
|-------|--------|-------|
| Empty stats boxes | Always shown (0s) | Hidden entirely |
| Visit checklist height | ~400px | ~200px (collapsed) |
| White space gaps | Huge empty column | Single-column compact |
| Discovery readability | Poor contrast | Clear, readable |
| Bookmark feedback | None | Immediate + toast |

---

**Next Step:** Start with P0 fixes (Hide empty stats + Bookmark feedback)
