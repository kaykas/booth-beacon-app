# Booth Beacon: Technical Architecture Review Request

## Context: What We're Building

**Booth Beacon** is the world's ultimate directory of classic analog photo booths—a love letter to the increasingly rare machines that produce chemical-developed photo strips. Built for travelers and analog photography enthusiasts who want to find authentic photo booth experiences worldwide.

**The Vision**: Replace manual Google Maps curation with an automated, AI-powered discovery platform that crawls the web, extracts booth locations, geocodes them accurately, and presents them on an interactive map with rich metadata.

**Current State**:
- 1,000 booths in database (556 have geocoding issues - 55.6%)
- 46 crawler source configurations (38 enabled and operational)
- Live production deployment at Vercel
- Active data quality improvement cycle (Dec 8, 2025)

---

## System Architecture Overview

### Tech Stack

**Frontend:**
- Next.js 14 (App Router) with React 19.2
- TypeScript (strict mode)
- Tailwind CSS v4
- Deployed on Vercel with edge caching
- Interactive map using Leaflet (react-leaflet)
- Image optimization: AVIF/WebP with 1-year cache TTL

**Backend:**
- Supabase (PostgreSQL 15) - hosted database
- Supabase Edge Functions (Deno runtime)
- Row-level security (RLS) policies
- Service role for admin operations
- Anonymous read access for public data

**APIs & Services:**
- Firecrawl API: Web scraping and HTML-to-markdown conversion
- Claude AI (Anthropic): Structured data extraction from HTML
- OpenStreetMap Nominatim: Free geocoding (1 req/sec rate limit)
- Google Maps API (optional): Higher-quality geocoding fallback
- DALL-E 3 (OpenAI): AI-generated booth preview images

**Deployment:**
- Frontend: Vercel (auto-deploy from main branch)
- Edge Functions: Supabase (manual deploy via CLI)
- Database: Supabase managed PostgreSQL
- File Storage: Supabase Storage buckets

---

## Request for CTO Feedback

As a CTO with expertise in **data acquisition, geospatial systems, data quality, scalable architectures, and API design**, please provide feedback on:

### 1. Architecture Feedback & Improvements
- Is the separation of concerns (crawler → validator → deduplicator → saver) appropriate?
- Should we split the monolithic `unified-crawler` into microservices?
- Are there architectural patterns we're missing?
- How would you structure this at 100K+ booths?

### 2. Geocoding System Optimization
- The 4-layer validation approach—overkill or appropriate?
- How would you handle the 1 req/sec rate limit at scale?
- Multi-provider cascade strategy—how to implement cost-effectively?
- Distance validation thresholds (50m/200m/500m)—are these reasonable?
- How to detect and handle duplicate coordinates better?

### 3. Crawler Efficiency Recommendations
- 46 sources, 38 enabled—how to prioritize?
- Claude AI for extraction—too expensive at scale?
- How to reduce extraction failure rate (currently ~11%)?
- Firecrawl API vs custom Playwright scraping?
- How to handle dynamic JavaScript-rendered content?

### 4. Data Quality Enhancement Strategies
- Quality score algorithm—what's missing?
- How to incentivize community data correction?
- Automated data enrichment strategies?
- Machine learning for address parsing/correction?
- How to maintain data freshness (booths close, move)?

### 5. Scalability Considerations
- Database schema—ready for 100K booths?
- Index strategy—what are we missing?
- ISR vs SSG vs SSR—which for booth detail pages?
- Image hosting—Supabase Storage vs external CDN?
- How to handle 1M+ requests/month?

### 6. Concerns & Red Flags
- Security vulnerabilities you see?
- Performance bottlenecks we haven't identified?
- Technical debt accumulating?
- Maintainability issues?
- Cost concerns at scale?

---

**Thank you for your time and expertise!** Any architectural guidance, performance optimization tips, or red flags you spot would be incredibly valuable as we scale Booth Beacon from 1K to 10K+ booths.

---

## Complete Technical Details

[See full technical specification in the complete document]
