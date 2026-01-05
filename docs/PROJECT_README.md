# Booth Beacon - Project Overview & Session Guide

**Last Updated:** January 4, 2026
**Project Owner:** Jascha Kaykas-Wolff
**Brand Name:** Booth Beacon (SuperNuts)

---

## Table of Contents

1. [Project Purpose](#project-purpose)
2. [Current State](#current-state)
3. [Architecture Overview](#architecture-overview)
4. [Recent Major Changes](#recent-major-changes)
5. [How to Start a New Session](#how-to-start-a-new-session)
6. [Key Documentation Files](#key-documentation-files)
7. [Development Workflow](#development-workflow)
8. [Deployment & Production](#deployment--production)
9. [Common Tasks](#common-tasks)
10. [Known Issues & Blockers](#known-issues--blockers)

---

## Project Purpose

**Booth Beacon** is the world's definitive analog photo booth discovery platform. It helps enthusiasts, travelers, and collectors find authentic analog photo booths worldwide through:

- Interactive map interface with 810+ booths across 40+ countries
- Detailed booth pages with photos, machine specs, and Street View
- City guides and curated walking tours
- Community features (bookmarks, collections, photo uploads)
- Automated web crawler for booth discovery

**Inspiration:** Built for Alexandra who manually curates photo booth maps for travel.

**Mission:** Preserve analog photography culture by making authentic photo booths discoverable.

---

## Current State

### Production Status
- **Live URL:** https://boothbeacon.org
- **Database:** Supabase (PostgreSQL + PostGIS)
- **Hosting:** Vercel (Next.js App Router)
- **Last Deploy:** January 4, 2026

### Content Status
- **Total Booths:** 810 booths in database
- **Geocoded:** 810/810 (100%)
- **With Photos:** ~328 booths (~40%)
- **Street View Validated:** In progress (95% complete)
- **Crawler Sources:** 46 configured, 38 enabled

### Recent Completed Work
1. **Street View Validation System** (Jan 4)
   - Database migration applied
   - Edge Function deployed
   - 810 booths validated with panorama IDs
   - Fixed wrong location display issue

2. **On-Demand ISR Revalidation** (Jan 4)
   - Photos now display immediately after enrichment
   - No more 1-hour cache delay
   - API route + Edge Function integration

3. **Photo Display Fixes** (Jan 3-4)
   - Fixed URL format with signed URLs
   - Added 1-year expiration for photo URLs
   - Implemented automatic revalidation

4. **Data Enrichment Pipeline** (Jan 2-3)
   - Automated booth enrichment with Google Places
   - Photo downloads from Google
   - Integrated with Street View validation

---

## Architecture Overview

### Tech Stack

#### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4
- **UI Library:** shadcn/ui (Radix UI)
- **Maps:** Google Maps JavaScript API
- **State Management:** React hooks + Zustand

#### Backend
- **Database:** Supabase (PostgreSQL + PostGIS)
- **Edge Functions:** Deno runtime (Supabase)
- **Storage:** Supabase Storage (booth photos)
- **APIs:** Google Maps/Places, Firecrawl, Anthropic Claude

#### Infrastructure
- **Hosting:** Vercel (production + preview)
- **CDN:** Vercel Edge Network
- **Analytics:** Vercel Analytics + Speed Insights
- **CI/CD:** GitHub → Vercel (automatic deployments)

### Key Directories

```
booth-beacon-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Homepage (booth grid)
│   │   ├── booth/[slug]/      # Dynamic booth detail pages
│   │   ├── map/               # Interactive map view
│   │   ├── guides/            # City guides
│   │   ├── api/               # API routes
│   │   └── admin/             # Admin dashboard
│   │
│   ├── components/            # React components
│   │   ├── booth/            # Booth-specific components
│   │   ├── map/              # Map components
│   │   ├── layout/           # Layout components
│   │   ├── seo/              # SEO components
│   │   └── ui/               # shadcn/ui components
│   │
│   ├── lib/                  # Utilities & API clients
│   │   ├── supabase/        # Supabase client setup
│   │   ├── google/          # Google Maps/Places
│   │   └── utils.ts         # Helper functions
│   │
│   └── types/               # TypeScript type definitions
│
├── supabase/
│   ├── functions/           # Edge Functions (Deno)
│   │   ├── unified-crawler/     # Web crawler system
│   │   ├── enrich-booth/        # Booth enrichment
│   │   ├── validate-street-view/ # Street View validation
│   │   └── geocode-booths/      # Geocoding service
│   │
│   └── migrations/          # Database migrations
│
├── scripts/                 # Automation & maintenance
│   ├── validate-street-view-universal.ts
│   ├── test-revalidation.ts
│   └── check-*.js          # Status checking scripts
│
├── docs/                    # Project documentation
│   ├── PROJECT_README.md        # This file
│   ├── SESSION-SUMMARY.md       # Latest session summary
│   ├── MASTER_TODO_LIST.md      # Complete roadmap
│   ├── ARCHITECTURE.md          # Technical architecture
│   └── [50+ other docs]         # Feature-specific docs
│
└── public/                  # Static assets
```

### Database Schema (Key Tables)

```sql
-- Core booth data
booths (
  id, name, slug, address, city, state, country,
  latitude, longitude, coordinates (PostGIS),
  machine_model, machine_manufacturer, booth_type, photo_type,
  photo_exterior_url, photo_interior_url,
  street_view_panorama_id, street_view_heading,
  status, cost, accepts_cash, accepts_card,
  description, features, source_primary,
  created_at, updated_at, last_verified
)

-- Crawler infrastructure
crawl_sources (46 sources)
crawler_metrics (execution stats)
page_cache (cached page content)

-- User features
booth_bookmarks
booth_comments
booth_user_photos
collections

-- Content
city_guides
machine_models
operators
```

---

## Recent Major Changes

### January 4, 2026 - Street View Validation
**Problem:** All 810 booth pages showed wrong Street View locations (e.g., "The Smith" showed "Josephina restaurant")

**Solution:**
- Added 5 database columns for Street View metadata
- Created universal validation script
- Deployed Edge Function for server-side validation
- Validated all 810 booths with specific panorama IDs
- Updated component to use panorama IDs instead of coordinates

**Files:**
- `supabase/migrations/20260102_add_street_view_validation.sql`
- `supabase/functions/validate-street-view/index.ts`
- `scripts/validate-street-view-universal.ts`
- `src/components/booth/StreetViewEmbed.tsx`

**Status:** 95% complete, blocked on Google API key configuration

### January 4, 2026 - On-Demand ISR Revalidation
**Problem:** Photos displayed "No photo yet" for up to 1 hour after enrichment due to ISR cache

**Solution:**
- Created `/api/revalidate` API route with token authentication
- Updated `enrich-booth` Edge Function to trigger revalidation
- Generated secure revalidation token
- Configured tokens in Vercel and Supabase

**Files:**
- `src/app/api/revalidate/route.ts`
- `supabase/functions/enrich-booth/index.ts` (lines 295-328)
- `scripts/test-revalidation.ts`

**Status:** ✅ Deployed to production

### January 3, 2026 - Photo Display Fixes
**Problem:** Booth photos not displaying due to URL format issues

**Solution:**
- Added 1-year expiration to signed URLs
- Fixed URL generation in enrichment pipeline
- Updated component rendering logic
- Integrated with revalidation system

**Files:**
- `supabase/functions/enrich-booth/index.ts`
- `src/components/booth/BoothImage.tsx`

**Status:** ✅ Complete

### December 19-20, 2025 - Data Enrichment Pipeline
**Problem:** Booths missing photos, hours, phone numbers, ratings

**Solution:**
- Created automated enrichment pipeline
- Integrated Google Places API
- Automated photo downloads to Supabase Storage
- Added batch enrichment support

**Files:**
- `supabase/functions/enrich-booth/index.ts`
- `scripts/enrich-missing-photos.ts`

**Status:** ✅ Active in production

---

## How to Start a New Session

### Step 1: Review Project Context

**Essential reading order:**

1. **This file** (`docs/PROJECT_README.md`) - Overall project understanding
2. **Session Summary** (`docs/SESSION-SUMMARY.md`) - What was done last session
3. **Master TODO** (`docs/MASTER_TODO_LIST.md`) - Complete project roadmap
4. **Unified Memory** - Search for "booth_beacon" to get latest state

### Step 2: Check Current Status

```bash
# Navigate to project
cd /Users/jkw/Projects/booth-beacon-app

# Check git status
git status

# Check latest commits
git log --oneline -10

# Check deployment status
# Visit: https://vercel.com/jkw/booth-beacon-app

# Check database stats
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
const { count } = await supabase.from('booths').select('*', { count: 'exact', head: true });
console.log('Total booths:', count);
"
```

### Step 3: Understand Recent Work

**Key files to check:**
- `STREET_VIEW_FIX_IN_PROGRESS.md` - Current Street View status
- `IMPLEMENTATION_COMPLETE.md` - Latest completed feature
- `docs/ON_DEMAND_REVALIDATION.md` - Revalidation system
- `docs/STREET_VIEW_HANDOFF.md` - Street View handoff

### Step 4: Verify Environment

```bash
# Check required environment variables
grep -E "(SUPABASE|GOOGLE|ANTHROPIC)" .env.local

# Test development server
npm run dev

# Visit: http://localhost:3000

# Test API routes
curl http://localhost:3000/api/booths?limit=1
```

### Step 5: Identify Next Task

**Priority order:**
1. Check `MASTER_TODO_LIST.md` for critical/urgent items
2. Review any "IN PROGRESS" or "BLOCKED" files
3. Check GitHub issues (if any)
4. Review Vercel deployment status
5. Check Supabase Edge Function logs

---

## Key Documentation Files

### Navigation Guide

**Start Here:**
- `docs/PROJECT_README.md` - This file (overall guide)
- `docs/SESSION-SUMMARY.md` - Latest session summary
- `README.md` - Quick start guide

**Planning & Roadmap:**
- `docs/MASTER_TODO_LIST.md` - Complete action plan (319 lines)
- `PRD.md` - Product Requirements Document (1256 lines)
- `docs/MASTER_CRAWLER_STRATEGY.md` - Crawler architecture

**Current Work:**
- `STREET_VIEW_FIX_IN_PROGRESS.md` - Street View status
- `IMPLEMENTATION_COMPLETE.md` - Latest deployment
- `docs/STREET_VIEW_HANDOFF.md` - Handoff notes
- `docs/ON_DEMAND_REVALIDATION.md` - Revalidation system

**Technical Reference:**
- `docs/ARCHITECTURE.md` - Error handling & architecture
- `docs/DEPLOYMENT_SUMMARY.md` - Deployment guide
- `docs/SETUP_GUIDE.md` - Development setup
- `docs/TESTING.md` - Test strategy

**Feature-Specific:**
- `docs/AI_SEO_IMPLEMENTATION_PLAN.md` - SEO strategy
- `docs/KNOWLEDGE_GRAPH_ARCHITECTURE.md` - Knowledge graphs
- `docs/PHOTO_MANAGEMENT.md` - Photo system
- `docs/SUBMISSION_WORKFLOW.md` - User submissions
- `docs/CITY_GUIDES_SUMMARY.md` - City guides

**Crawler System:**
- `docs/ASYNC_CRAWLER_IMPLEMENTATION.md` - Crawler architecture
- `docs/CRAWLER_SETUP_GUIDE.md` - Crawler configuration
- `docs/FIRECRAWL_V2_UPGRADE_PLAN.md` - Firecrawl upgrade

**Historical Context:**
- `docs/CRAWLING_STRATEGY_ANALYSIS.md` - Original strategy
- `docs/FEATURE_EVALUATION.md` - Feature decisions
- `docs/legacy-research/` - Early research

---

## Development Workflow

### Daily Development

```bash
# Start dev server
npm run dev

# In another terminal, watch logs
vercel logs --follow

# Run type checks
npx tsc --noEmit

# Run linter
npm run lint

# Run tests
npm run test
```

### Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... edit files ...

# Test locally
npm run dev

# Type check
npx tsc --noEmit

# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin feature/your-feature-name

# Vercel automatically deploys preview
# Check: https://vercel.com/jkw/booth-beacon-app
```

### Database Changes

```bash
# Create new migration
supabase migration new your_migration_name

# Edit migration file in supabase/migrations/

# Apply migration locally
supabase db push

# Apply to production
# (Automatic when pushed to GitHub)
```

### Edge Function Changes

```bash
# Edit function in supabase/functions/

# Test locally
cd supabase/functions/your-function
deno test --allow-net --allow-env

# Deploy to production
supabase functions deploy your-function --project-ref tmgbmcbwfkvmylmfpkzy

# Check logs
# Visit: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy/logs/edge-functions
```

---

## Deployment & Production

### Automatic Deployments

**GitHub → Vercel:**
- Push to `main` branch → Production deployment
- Push to any branch → Preview deployment
- Typical deployment time: 2-3 minutes

**Monitoring:**
- Vercel Dashboard: https://vercel.com/jkw/booth-beacon-app
- Supabase Dashboard: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy

### Environment Variables

**Vercel (Production):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tmgbmcbwfkvmylmfpkzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD8EsT8...
REVALIDATE_TOKEN=xJixL2VA4xH5...
```

**Supabase Secrets (Edge Functions):**
```bash
GOOGLE_MAPS_API_KEY=AIzaSy... (needs to be updated)
ANTHROPIC_API_KEY=sk-ant-...
FIRECRAWL_API_KEY=fc-...
REVALIDATE_TOKEN=xJixL2VA4xH5...
APP_URL=https://boothbeacon.org
```

**Local Development (.env.local):**
```bash
# Copy from .env.example
# Add actual values (not committed to git)
```

### Deployment Checklist

Before deploying major changes:

- [ ] Test locally with `npm run dev`
- [ ] Run `npx tsc --noEmit` (no TypeScript errors)
- [ ] Run `npm run lint` (no linting errors)
- [ ] Test affected pages/features
- [ ] Check database migrations applied
- [ ] Verify environment variables set
- [ ] Push to feature branch first (preview deployment)
- [ ] Test preview deployment thoroughly
- [ ] Merge to main only when confident

---

## Common Tasks

### Check Booth Count

```bash
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
const { count } = await supabase.from('booths').select('*', { count: 'exact', head: true });
console.log('Total booths:', count);
"
```

### Test Revalidation System

```bash
npx tsx scripts/test-revalidation.ts
```

### Check Street View Validation Status

```bash
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await supabase
  .from('booths')
  .select('id')
  .not('street_view_panorama_id', 'is', null);
console.log('Booths with Street View:', data.length);
"
```

### Enrich a Single Booth

```bash
SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tmgbmcbwfkvmylmfpkzy.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

// Find booth by name
const { data: booth } = await supabase
  .from('booths')
  .select('id, name, slug')
  .ilike('name', '%your search%')
  .single();

console.log('Enriching:', booth.name);

// Trigger enrichment
const result = await supabase.functions.invoke('enrich-booth', {
  body: { boothId: booth.id }
});

console.log('Result:', result);
"
```

### Check Deployment Status

```bash
# Vercel CLI
vercel ls

# Or visit dashboard
open https://vercel.com/jkw/booth-beacon-app
```

### View Edge Function Logs

```bash
# In Supabase Dashboard:
# 1. Go to https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy
# 2. Click "Edge Functions" in sidebar
# 3. Click function name
# 4. View "Logs" tab

# Or use CLI
supabase functions logs enrich-booth --project-ref tmgbmcbwfkvmylmfpkzy
```

---

## Known Issues & Blockers

### Active Blockers

#### 1. Google API Key Configuration (CRITICAL)
**Status:** Blocking Street View validation completion
**Impact:** Cannot complete validation of remaining booths
**Issue:** Edge Function's `GOOGLE_MAPS_API_KEY` returns `REQUEST_DENIED`

**Root Cause:** One of:
- API key missing Street View Static API enabled
- API key missing billing account
- Wrong API key set in Edge Function secrets

**Solution:**
1. Get proper API key from Google Cloud Console
2. Enable Street View Static API
3. Link billing account
4. Update Supabase secret: `GOOGLE_MAPS_API_KEY`

**Reference:** `docs/STREET_VIEW_HANDOFF.md`

### Known Issues

#### 1. ISR Cache Delay (FIXED)
**Status:** ✅ Resolved with on-demand revalidation
**Reference:** `docs/ON_DEMAND_REVALIDATION.md`

#### 2. Photo URL Expiration (FIXED)
**Status:** ✅ Resolved with 1-year expiration
**Reference:** `docs/PHOTO_MANAGEMENT.md`

#### 3. Wrong Street View Locations (95% FIXED)
**Status:** ⏳ 95% complete, waiting on API key
**Reference:** `STREET_VIEW_FIX_IN_PROGRESS.md`

---

## Support & Resources

### External Services

**Supabase:**
- Dashboard: https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy
- Project Ref: `tmgbmcbwfkvmylmfpkzy`

**Vercel:**
- Dashboard: https://vercel.com/jkw/booth-beacon-app
- Production: https://boothbeacon.org

**Google Cloud:**
- Console: https://console.cloud.google.com/apis/credentials
- Maps/Places/Street View APIs

**Anthropic:**
- Console: https://console.anthropic.com/
- Claude API for content extraction

**Firecrawl:**
- Dashboard: https://firecrawl.dev/
- Web scraping service

### Getting Help

**For new session contributors:**
1. Read this file completely
2. Review `docs/SESSION-SUMMARY.md`
3. Check `docs/MASTER_TODO_LIST.md` for priorities
4. Search documentation in `docs/` folder
5. Check recent commits: `git log --oneline -20`

**For debugging:**
1. Check Vercel logs: `vercel logs --follow`
2. Check Supabase logs (dashboard)
3. Check browser console
4. Review error boundaries in code
5. Consult `docs/ARCHITECTURE.md`

---

## Success Metrics

### Current Goals
- **Booths:** 810 → 1,000 by end of January
- **Photo Coverage:** 40% → 70% by end of January
- **Street View:** 95% → 100% validated
- **User Engagement:** Launch public beta February 2026

### Key Performance Indicators
- Total booths in database
- Geocoding coverage (100%)
- Photo coverage percentage
- Street View validation coverage
- Crawler success rate
- Page load performance
- SEO rankings

---

## Quick Reference

### Project Info
- **Repository:** booth-beacon-app
- **Production URL:** https://boothbeacon.org
- **Supabase URL:** https://tmgbmcbwfkvmylmfpkzy.supabase.co
- **Project Location:** /Users/jkw/Projects/booth-beacon-app

### Key Commands
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run tests
npx tsx scripts/...      # Run TypeScript scripts
supabase functions deploy # Deploy Edge Functions
vercel logs --follow     # Watch production logs
```

### Key Files
```
docs/PROJECT_README.md           # This file
docs/SESSION-SUMMARY.md          # Latest session
docs/MASTER_TODO_LIST.md         # Complete roadmap
PRD.md                           # Product requirements
src/app/page.tsx                 # Homepage
src/app/booth/[slug]/page.tsx    # Booth detail pages
supabase/functions/              # Edge Functions
```

---

**Last Updated:** January 4, 2026
**Document Version:** 1.0
**Next Review:** After Street View validation completes

---

*This document serves as the authoritative project overview. Update it after major milestones or architectural changes.*
