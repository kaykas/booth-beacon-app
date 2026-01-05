# Booth Beacon - Quick Start Guide

**Last Updated:** January 4, 2026

---

## New Session? Start Here

### 1. Essential Context (5 minutes)

Read these files in order:

1. **`docs/PROJECT_README.md`** - Project overview, architecture, current state
2. **`docs/SESSION-SUMMARY.md`** - What happened last session
3. **`docs/MASTER_TODO_LIST.md`** (first 50 lines) - Current priorities

### 2. Check Project Status (2 minutes)

```bash
# Navigate to project
cd /Users/jkw/Projects/booth-beacon-app

# Check git status
git status
git log --oneline -5

# Check if dev server works
npm run dev
# Visit: http://localhost:3000
```

### 3. Understand Current State (3 minutes)

**Key Metrics:**
- 810 booths in database
- 100% geocoded
- 40% with photos
- 90% Street View validated

**Active Work:**
- ✅ On-demand revalidation (complete)
- ✅ Photo display fixes (complete)
- ⏳ Street View validation (95% complete, blocked on API key)

**One Active Blocker:**
- Google API key needs configuration for Street View validation

---

## Project Structure (Quick Reference)

```
booth-beacon-app/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx           # Homepage
│   │   ├── booth/[slug]/      # Booth pages
│   │   ├── map/               # Map view
│   │   └── api/               # API routes
│   ├── components/            # React components
│   └── lib/                   # Utilities
│
├── supabase/
│   ├── functions/            # Edge Functions (Deno)
│   └── migrations/           # Database migrations
│
├── scripts/                  # Automation scripts
└── docs/                     # Documentation
```

---

## Common Commands

### Development
```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run test             # Run tests
npx tsc --noEmit        # Type check
```

### Database
```bash
# Check booth count
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
const { count } = await supabase.from('booths').select('*', { count: 'exact', head: true });
console.log('Total booths:', count);
"
```

### Edge Functions
```bash
# Deploy Edge Function
supabase functions deploy FUNCTION_NAME --project-ref tmgbmcbwfkvmylmfpkzy

# View logs
# Visit: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/logs/edge-functions
```

### Deployment
```bash
# Push to GitHub (triggers Vercel deployment)
git add .
git commit -m "Description"
git push origin main

# Check deployment
open https://vercel.com/jkw/booth-beacon-app
```

---

## Current Priorities

### This Week (URGENT)

1. **Fix Google API Key** (20 minutes)
   - Get proper API key from Google Cloud Console
   - Enable Street View Static API
   - Update Supabase secret
   - Complete Street View validation
   - **Reference:** `docs/STREET_VIEW_HANDOFF.md`

2. **Verify Production Status** (10 minutes)
   - Test revalidation system
   - Check photo display
   - Verify Street View (after API key fix)

### Next Week

3. **Data Enrichment** (ongoing)
   - Add more booths (810 → 1000)
   - Improve photo coverage (40% → 70%)

4. **SEO Implementation**
   - Review `docs/AI_SEO_IMPLEMENTATION_PLAN.md`
   - Implement knowledge graphs

---

## Key URLs

**Production:**
- Live Site: https://boothbeacon.org
- Vercel Dashboard: https://vercel.com/jkw/booth-beacon-app

**Supabase:**
- Dashboard: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy
- Project Ref: `tmgbmcbwfkvmylmfpkzy`

**Google Cloud:**
- Console: https://console.cloud.google.com/apis/credentials

---

## Environment Variables

**Required in `.env.local`:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tmgbmcbwfkvmylmfpkzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD8EsT8...
```

**Check with:**
```bash
grep -E "(SUPABASE|GOOGLE)" .env.local
```

---

## Troubleshooting

### Dev server won't start
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node version (should be 18+)
node --version
```

### TypeScript errors
```bash
# Check for errors
npx tsc --noEmit

# Common fixes:
# 1. Restart TypeScript server in editor
# 2. Delete .next folder: rm -rf .next
# 3. Rebuild: npm run build
```

### Supabase connection errors
```bash
# Verify environment variables
grep SUPABASE .env.local

# Test connection
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await supabase.from('booths').select('count');
console.log(data ? 'Connected!' : 'Error:', error);
"
```

---

## Documentation Guide

**Start with these:**
- `docs/PROJECT_README.md` - Complete overview
- `docs/SESSION-SUMMARY.md` - Latest session
- `docs/QUICK_START.md` - This file

**For specific features:**
- `docs/ON_DEMAND_REVALIDATION.md` - Revalidation system
- `docs/STREET_VIEW_HANDOFF.md` - Street View status
- `docs/PHOTO_MANAGEMENT.md` - Photo system
- `docs/ARCHITECTURE.md` - Technical details

**Planning:**
- `docs/MASTER_TODO_LIST.md` - Complete roadmap
- `PRD.md` - Product requirements

**All docs:** Browse `docs/` folder (100+ files)

---

## Testing

### Test revalidation system
```bash
npx tsx scripts/test-revalidation.ts
```

### Test Street View validation (after API key fix)
```bash
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: booth } = await supabase
  .from('booths')
  .select('id')
  .ilike('name', '%heebe%jeebe%')
  .single();

const response = await fetch('https://tmgbmcbwfkvmylmfpkzy.supabase.co/functions/v1/validate-street-view', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  body: JSON.stringify({ boothId: booth.id }),
});

const result = await response.json();
console.log('Result:', JSON.stringify(result, null, 2));
"
```

---

## Need Help?

1. **Check documentation:** Start with `docs/PROJECT_README.md`
2. **Search docs folder:** `grep -r "your search" docs/`
3. **Check git history:** `git log --oneline --grep="keyword"`
4. **Review recent commits:** `git log --oneline -20`
5. **Check Vercel logs:** `vercel logs --follow`

---

## Quick Wins (If You Have 30 Minutes)

### Option 1: Fix Google API Key
- Follow `docs/STREET_VIEW_HANDOFF.md`
- Update Supabase secret
- Run Street View validation
- **Impact:** Fixes wrong Street View locations for 810 booths

### Option 2: Add New Booths
- Find booth source (e.g., city guide website)
- Add to crawler sources
- Run extraction
- **Impact:** Grows database toward 1000 booth goal

### Option 3: Test & Document
- Run test suite: `npm run test`
- Test revalidation: `npx tsx scripts/test-revalidation.ts`
- Document any issues found
- **Impact:** Improves system reliability

---

**Remember:**
- Read `docs/PROJECT_README.md` first
- Check `docs/SESSION-SUMMARY.md` for latest status
- Consult `docs/MASTER_TODO_LIST.md` for priorities
- Update documentation after changes

---

**Last Updated:** January 4, 2026
**Quick Start Version:** 1.0
