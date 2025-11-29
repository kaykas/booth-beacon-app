# Booth Beacon Project Instructions

## 🎯 Project Overview
**Booth Beacon** is the world's ultimate directory of classic analog photo booths.
**Inspiration:** Built for Alexandra who manually curates photo booth maps for travel.
**Mission:** Help analog photo booth enthusiasts discover and share authentic machines worldwide.

---

## 🚨 CRITICAL: Always Start Here

### Step 1: Check Unified Memory
```
Search unified memory for "booth_beacon" to get latest project state
```

### Step 2: Read Master TODO List
**Location:** `/Users/jkw/Projects/booth-beacon-app/docs/MASTER_TODO_LIST.md`

**THIS IS THE AUTHORITATIVE SOURCE FOR ALL PROJECT PRIORITIES**
- 319 lines covering all tasks from critical bugs to long-term features
- ALWAYS read this file at the start of every session
- Do not work from session-specific priorities alone
- Reference this when planning any work

### Step 3: Check Recent Progress
**Location:** `/Users/jkw/Projects/booth-beacon-app/SESSION-SUMMARY.md`
- Contains latest session's completed tasks
- Shows what's been done recently
- Provides context for current state

---

## 📊 Current Project State (as of Nov 28, 2025)

- **Database:** 912 booths total
- **Geocoded:** 248 booths have coordinates (27.2% complete)
- **Sources:** 46 crawler sources configured, 38 enabled
- **Tech Stack:** Next.js 14, Supabase, Firecrawl, Claude AI
- **Goal:** 100+ booths with complete data in first week

---

## 🛠️ Tech Stack & Architecture

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Maps:** Leaflet with react-leaflet

### Backend
- **Database:** Supabase (PostgreSQL)
- **Edge Functions:** Deno runtime on Supabase
- **Crawler:** Firecrawl API + Claude AI for extraction
- **Geocoding:** OpenStreetMap Nominatim API

### Key Directories
```
/Users/jkw/Projects/booth-beacon-app/
├── docs/MASTER_TODO_LIST.md       ← MASTER LIST
├── SESSION-SUMMARY.md              ← Recent progress
├── src/app/                        ← Next.js app
│   ├── page.tsx                    ← Homepage
│   ├── booth/[slug]/page.tsx       ← Booth detail pages
│   └── map/page.tsx                ← Map view
├── src/components/                 ← React components
│   ├── booth/                      ← Booth-specific components
│   └── layout/                     ← Layout components
├── supabase/
│   ├── functions/
│   │   ├── unified-crawler/        ← Crawler Edge Function
│   │   └── geocode-booths/         ← Geocoding Edge Function
│   └── migrations/                 ← Database migrations
└── scripts/
    ├── geocode-all-batches.sh      ← Automated geocoding
    ├── run-geocoding.js            ← Geocoding client
    └── check-missing-coordinates.js ← Status checker
```

---

## 💡 Working Principles (IMPORTANT!)

### 1. Always Provide Copy-Pasteable Code
- User prefers running commands themselves
- Provide complete, ready-to-use code snippets
- Include full file paths
- Don't use placeholders or "add this here" instructions

### 2. Run Commands Yourself When Appropriate
- For deployment, geocoding, database operations
- User has explicitly stated: "you need to run things"
- Don't tell user to run commands - just run them
- Show output and results

### 3. Reference Master TODO List Before Any Work
- Check master list priorities first
- Understand where task fits in overall plan
- Don't create one-off solutions disconnected from roadmap

### 4. Track Progress in Multiple Places
- Update SESSION-SUMMARY.md with completed tasks
- Update unified memory with significant milestones
- Mark items complete in master TODO list
- Use TodoWrite tool for session tracking

---

## 📂 Important Files & Their Purpose

### Documentation
- `docs/MASTER_TODO_LIST.md` - Complete project roadmap
- `SESSION-SUMMARY.md` - Latest session progress
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation notes
- `CRAWLER_RESULTS_SUMMARY.md` - Crawler performance data

### Configuration
- `.env.local` - Local environment variables (not in git)
- `next.config.mjs` - Next.js configuration
- `supabase/config.toml` - Supabase project config
- `tsconfig.json` - TypeScript configuration

### Key Source Files
- `src/app/page.tsx:24` - Homepage booth display (removed limit)
- `src/app/booth/[slug]/page.tsx` - Booth detail pages (SEO URLs)
- `src/components/booth/BoothMap.tsx:196-202` - Map centering
- `src/types/index.ts` - TypeScript type definitions

### Scripts
- `scripts/geocode-all-batches.sh` - Automated batch geocoding
- `scripts/run-geocoding.js` - Geocoding client with SSE
- `scripts/check-missing-coordinates.js` - Status verification

---

## 🚀 Common Tasks & Commands

### Development
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run lint             # Run ESLint
npx tsc --noEmit        # Type check without building
```

### Database Operations
```bash
# Run migration
supabase db push

# Reset database (careful!)
supabase db reset

# Query database
psql postgresql://[connection-string]
```

### Geocoding
```bash
# Check status
SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/check-missing-coordinates.js

# Run batch geocoding
SUPABASE_SERVICE_ROLE_KEY=xxx bash scripts/geocode-all-batches.sh
```

### Deployment
```bash
# Deploy Edge Function
supabase functions deploy unified-crawler --project-ref tmgbmcbwfkvmylmfpkzy

# Vercel deployment happens automatically on git push to main
```

---

## 🎨 Design Philosophy

### UI/UX Principles
1. **Analog aesthetic** - Warm colors, photo strip motifs, film grain
2. **Photo-first** - Always show booth images when available
3. **Mobile-friendly** - Most users will be on phones while traveling
4. **Fast loading** - Optimize images, lazy load, use ISR

### Code Principles
1. **Type safety** - Strict TypeScript, no `any` types
2. **Component reuse** - DRY principle for UI components
3. **Server-first** - Use RSC and Server Actions where possible
4. **Error handling** - Always handle errors gracefully

---

## ⚠️ Common Pitfalls to Avoid

1. **Don't create new files unnecessarily** - Always prefer editing existing files
2. **Don't add features not in master list** - Stick to documented priorities
3. **Don't use UUIDs in URLs** - Always use SEO-friendly slugs
4. **Don't skip geocoding** - Coordinates are critical for map functionality
5. **Don't ignore TypeScript errors** - Fix them immediately
6. **Don't forget rate limits** - Respect Nominatim 1 req/sec limit

---

## 🔐 Environment Variables

Required in `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tmgbmcbwfkvmylmfpkzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# APIs
ANTHROPIC_API_KEY=xxx
FIRECRAWL_API_KEY=xxx

# Optional
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
```

---

## 📞 Quick Reference

### Database Tables
- `booths` - Main booth data (912 rows)
- `crawl_sources` - Crawler source configurations (46 rows)
- `crawler_metrics` - Crawl execution stats
- `booth_photos` - User-submitted photos
- `booth_reviews` - User reviews and ratings

### Key API Endpoints
- `/api/booths` - Booth CRUD operations
- Supabase Edge Functions:
  - `/functions/v1/unified-crawler` - Web crawler
  - `/functions/v1/geocode-booths` - Geocoding service

### External Services
- **Firecrawl:** Web scraping and content extraction
- **Claude AI:** Structured data extraction from HTML
- **Nominatim:** Free geocoding (1 req/sec limit)
- **Vercel:** Frontend hosting and deployments

---

## 🎯 Week 1 Success Metrics (From Master List)

- [ ] 100+ booths in database with complete data
- [ ] 5+ sources successfully extracting
- [ ] <10% extraction failure rate
- [ ] All UX critical bugs fixed
- [ ] Booth detail pages fully functional

---

## 📝 Remember

1. **Master TODO List is the source of truth**
2. **Always provide copy-pasteable code**
3. **Run commands yourself when appropriate**
4. **Check unified memory at session start**
5. **Update progress in multiple places**

---

**Last Updated:** November 28, 2025
**Project Owner:** Jascha Kaykas-Wolff
**Strategic Partner:** Claude AI
