# Booth Beacon - Optimization Action Plan

## Summary
Based on comprehensive audit, here are immediate actions to take:

## IMMEDIATE ACTIONS (Do First)

### 1. Deploy to Lovable ⏰ ETA: 30 minutes
**Follow:** `DEPLOY_EVERYTHING_TO_LOVABLE.md`

**Steps:**
1. Tell Lovable to pull latest from GitHub
2. Apply 7 database migrations
3. Deploy Edge Functions
4. Test Collections pages work
5. Test Enhanced Booth pages work

**Expected Result:** All UX improvements live on boothbeacon.org

---

### 2. Optimize Hero Images ⏰ ETA: 15 minutes
**Impact:** 60-70% bundle size reduction (7.4MB → ~1MB)

**Steps:**
```bash
# Install image optimization tool
npm install -D @squoosh/lib

# Convert PNG to WebP (I'll do this for you)
# Move images to public/assets/
# Update Hero.tsx imports
```

**Files to modify:** `src/components/Hero.tsx`

---

### 3. Remove Unused Dependencies ⏰ ETA: 5 minutes
**Impact:** 300KB bundle reduction

```bash
npm uninstall recharts react-day-picker embla-carousel-react input-otp @mendable/firecrawl-js
rm src/components/ui/chart.tsx
rm src/components/ui/calendar.tsx
rm src/components/ui/carousel.tsx
rm src/components/ui/input-otp.tsx
```

---

### 4. Add React.lazy() Code Splitting ⏰ ETA: 10 minutes
**Impact:** 40-50% smaller initial bundle

**File to modify:** `src/App.tsx`
```typescript
import { lazy, Suspense } from "react";

const BoothDetail = lazy(() => import("./pages/BoothDetail"));
const Collections = lazy(() => import("./pages/Collections"));
// etc...
```

---

## NEXT ACTIONS (Week 1)

### 5. Fix BoothDetail Query Optimization
**File:** `src/pages/BoothDetail.tsx` (line 59-63)
Change `select("*")` to specific fields

### 6. Fix Navigation Auth Listener
**File:** `src/components/Navigation.tsx` (lines 16-18)
Wrap in useEffect, add cleanup

### 7. Fix BoothComments N+1 Query
**File:** `src/components/BoothComments.tsx` (lines 32-56)
Use JOIN instead of separate queries

---

## TRACKING PROGRESS

**Bundle Size Goals:**
- Current: ~5MB
- After optimizations: ~1.5-2MB
- Target: <1MB

**Performance Goals:**
- Initial Load: 3-4s faster
- Time to Interactive: 40-50% improvement
- Database queries: 30-40% faster

---

## PRIORITY ORDER

1. ✅ Deploy to Lovable (get UX improvements live)
2. ⏳ Optimize images (biggest impact)
3. ⏳ Remove unused deps (quick win)
4. ⏳ Add code splitting (significant impact)
5. 📋 Database optimizations (ongoing)

**Total ETA for High-Priority Items:** 1-2 hours
