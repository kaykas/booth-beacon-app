# Phase 2 Implementation Guide

## Overview

Phase 2 delivers three major improvements to Booth Beacon:

1. **AI-Powered Descriptions** - Engaging, contextual descriptions with rarity detection
2. **Nuclear Option Crawler** - Federated multi-ecosystem crawler targeting 100% authentic operator sources
3. **Google Maps Enrichment** - Hours, phone, ratings, photos from Google Places API

---

## 1. AI Description Generator

**File:** `generate-booth-descriptions.ts`

### What It Does

Generates compelling 2-3 sentence descriptions for booths using Claude AI, with intelligent rarity detection:

- **Rarity Scoring** (0-100):
  - Oldest booths (pre-1960): +30 points
  - Rare models (<5 worldwide): +25 points
  - Only booth in city: +20 points
  - Color film: +15 points

- **Smart Descriptions**:
  - High rarity (30+): Emphasizes urgency ("one of the last")
  - Medium rarity (10-30): Highlights what's special
  - Low rarity: Focuses on experience and location

### Usage

```bash
# Generate descriptions for 50 booths without descriptions
ANTHROPIC_API_KEY=sk-ant-... \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... \
NEXT_PUBLIC_SUPABASE_URL=https://tmgbmcbwfkvmylmfpkzy.supabase.co \
npx tsx generate-booth-descriptions.ts
```

### Cost

- ~$0.002 per description (Claude Sonnet 3.5)
- 50 booths = ~$0.10
- 360 booths = ~$0.72

### Rate Limiting

- 1 request per 2 seconds (30/minute)
- 50 booths takes ~2 minutes

### Example Output

```
📍 Mauerpark (Berlin, Germany)
   Rarity Score: 45/100
   Context: one of only 3 analog photobooths in Berlin and rare color film booth
   Generated: "This rare color film booth has been a Mauerpark weekend institution since 1989. One of only three analog photobooths left in Berlin, it processes genuine silver halide film for €8—no digital tricks, just real chemistry developing before your eyes."
   ✅ Saved
```

---

## 2. Nuclear Option Federated Crawler

**File:** `crawl-federated-nuclear-option.ts`

### The Strategy

Targets three distinct ecosystems where analog booths hide:

#### **Tier 1: The Operators** (100% Authenticity)
Technicians and restorers who maintain the machines:

- A&A Studios (USA Midwest/East)
- Phototronic (Canada West)
- Fotoautomat Wien (Austria)
- Fotoautomat FR/CZ (France/Prague)
- Autofoto (UK/Spain)
- Photoautomat DE (Germany)
- Fotoautomatica (Italy)
- Automatfoto (Sweden)
- Metro Auto Photo (Australia)
- Booth by Bryant (USA Orange County)

**Confidence:** 100% - If they list it, it's analog

#### **Tier 2: The Directories** (Filtered)
Large community sources with mixed content:

- Photobooth.net (The Archive)
- Lomography (Mixed - needs filtering)

**Confidence:** 60-80% - Requires digital booth filtering

#### **Tier 3: The Venue Chains**
Corporate contracts known for analog booths:

- The Hoxton Hotels
- 25hours Hotels

**Confidence:** 90%

### Digital Booth Filtering System

**Red Flags** (auto-reject):
- digital, inkjet, dye-sub, instant print, thermal
- no chemicals, green screen, ipad, tablet, touchscreen

**Green Flags** (confirm analog):
- chemical, film, developing, dip and dunk, silver halide
- photo-me, model 11/14/17, anatol josepho

### Usage

```bash
# Full crawl of all operators + directories (Tier 1 & 2)
FIRECRAWL_API_KEY=fc-cd227b... \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... \
NEXT_PUBLIC_SUPABASE_URL=https://tmgbmcbwfkvmylmfpkzy.supabase.co \
npx tsx crawl-federated-nuclear-option.ts
```

### Expected Results

- **Tier 1 Operators:** 200-400 booths (100% analog)
- **Tier 2 Directories:** 500-1000 booths (filtered to analog)
- **Total:** 700-1400 high-quality booth listings

### Cost Estimation

- Tier 1 (10 scrapes): ~$0.50-1.00
- Tier 2 (deep crawls): ~$10-20 (500-page limit)
- **Total:** ~$10-21 per full run

### Runtime

- Tier 1: ~20 minutes (with 2s delays)
- Tier 2: ~30-60 minutes (depending on crawl depth)
- **Total:** ~50-80 minutes

---

## 3. Google Maps Enrichment

**File:** `enrich-google-maps.ts`

### What It Adds

For each booth:
- ✅ Hours of operation (weekday_text)
- ✅ Phone number (formatted_phone_number)
- ✅ Website URL
- ✅ Google rating (1-5 stars)
- ✅ Review count
- ✅ Up to 5 photos from Google
- ✅ Business operational status

### Usage

```bash
# Enrich 20 booths (default batch size)
GOOGLE_MAPS_API_KEY=AIza... \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... \
NEXT_PUBLIC_SUPABASE_URL=https://tmgbmcbwfkvmylmfpkzy.supabase.co \
npx tsx enrich-google-maps.ts

# Custom batch size (e.g., 100 booths)
npx tsx enrich-google-maps.ts 100
```

### Cost

**Google Places API pricing:**
- Text Search: $32 per 1000 requests = $0.032 per booth
- Place Details: $17 per 1000 requests = $0.017 per booth
- **Total:** ~$0.05 per booth

**Examples:**
- 20 booths: ~$1.00
- 100 booths: ~$5.00
- 360 booths (full database): ~$18.00

### Rate Limiting

- Google allows 50 requests/second
- Script uses 500ms delay (conservative)
- 20 booths takes ~10 seconds

### Process

1. **Find Place** - Uses booth name + address
2. **Get Details** - Fetches hours, phone, rating, photos
3. **Store Photos** - Saves Google photo URLs (no storage needed, direct links)
4. **Update Database** - Saves all enrichment data

---

## Recommended Execution Order

### Phase 2A: Content Improvement (Low Cost)

```bash
# 1. Generate AI descriptions for all booths (~$0.72)
npx tsx generate-booth-descriptions.ts
```

### Phase 2B: Data Expansion (Medium Cost)

```bash
# 2. Run Nuclear Option crawler (~$10-20)
npx tsx crawl-federated-nuclear-option.ts

# Expected: 700-1400 new booths
# Wait: ~50-80 minutes
```

### Phase 2C: Data Enrichment (Higher Cost)

```bash
# 3. Enrich in batches to control costs

# Start with 20 booths to test ($1.00)
npx tsx enrich-google-maps.ts 20

# Then do 100 booths if results look good ($5.00)
npx tsx enrich-google-maps.ts 100

# Finally do remaining booths
npx tsx enrich-google-maps.ts 300
```

---

## Total Costs Summary

| Task | Per Item | 360 Booths | 1000 Booths |
|------|----------|------------|-------------|
| AI Descriptions | $0.002 | $0.72 | $2.00 |
| Nuclear Crawler | One-time | $10-20 | $10-20 |
| Google Enrichment | $0.05 | $18.00 | $50.00 |
| **TOTAL** | | **~$30** | **~$72** |

---

## Environment Variables Required

```bash
# Required for all scripts
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
export NEXT_PUBLIC_SUPABASE_URL=https://tmgbmcbwfkvmylmfpkzy.supabase.co

# For AI descriptions
export ANTHROPIC_API_KEY=sk-ant-api03-...

# For crawlers
export FIRECRAWL_API_KEY=fc-cd227b1042ab42c38f1c03d095d9de0b

# For Google Maps enrichment
export GOOGLE_MAPS_API_KEY=AIza...
```

---

## Success Metrics

### Before Phase 2
- 360 booths
- 39% missing descriptions
- 50% missing coordinates
- 0% with hours/phone/ratings
- Generic, sparse booth pages

### After Phase 2 (All Steps)
- **1000-1400 booths** (2-4x growth)
- **100% have AI descriptions** (engaging, contextual)
- **Global coverage** (USA, Canada, Europe, Australia)
- **80%+ enriched** (hours, phone, ratings, photos)
- Professional, informative booth pages

### Phase 1 + Phase 2 Combined
- Operator info displayed ✅
- Payment methods shown ✅
- Quick stats pills ✅
- Empty states improved ✅
- Source attribution ✅
- AI descriptions ✅
- Hours/phone/ratings ✅
- Google photos ✅

**Result:** Booth Beacon becomes the definitive global source for analog photobooths.

---

## Troubleshooting

### AI Descriptions

**Issue:** Rate limit errors
**Solution:** Script already has 2s delays, but increase if needed

**Issue:** Low-quality descriptions
**Solution:** Check rarity detection logic, adjust prompts

### Nuclear Crawler

**Issue:** Timeout errors (408)
**Solution:** Some sites are slow (photoautomat.de). Script continues despite timeouts

**Issue:** Too many digital booths
**Solution:** Check `DIGITAL_RED_FLAGS` array, add more keywords

### Google Maps Enrichment

**Issue:** Place not found
**Solution:** Script tries venue name + address, then just address. Some booths may not have Google listings

**Issue:** API quota exceeded
**Solution:** Reduce batch size, wait 24 hours for quota reset

---

## Next Steps

1. ✅ Phase 1: UI improvements (completed)
2. ✅ Phase 2: Content & data (scripts created)
3. ⏳ Phase 3: Community features (from redesign plan)
4. ⏳ Phase 4: Advanced features (AI images, machine pages)

---

## Support

- **Firecrawl Docs:** https://docs.firecrawl.dev
- **Google Places API:** https://developers.google.com/maps/documentation/places/web-service
- **Claude API:** https://docs.anthropic.com
- **Supabase Docs:** https://supabase.com/docs

**Project:** https://boothbeacon.org
**Database:** https://tmgbmcbwfkvmylmfpkzy.supabase.co
