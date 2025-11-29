# TIER 3A: USA City Guides - Quick Reference

## Overview
Built 13 specialized extractors for blog and city guide sources across 5 major US cities (Berlin, London, LA, Chicago, NYC).

## Files Created
- ✅ `/supabase/functions/unified-crawler/city-guide-extractors.ts` (1,474 lines)
- ✅ `/supabase/migrations/20251123_tier3a_city_guides.sql` (130 lines)
- ✅ `/supabase/functions/unified-crawler/index.ts` (UPDATED - registered 13 extractors)
- ✅ `/TIER3A_CITY_GUIDES_EXTRACTION_REPORT.md` (comprehensive documentation)

## Sources by City

### Berlin (3 sources)
| Source | URL | Extractor | Priority | Expected |
|--------|-----|-----------|----------|----------|
| Digital Cosmonaut | digitalcosmonaut.com/berlin-photoautomat-locations | `extractDigitalCosmonautBerlin()` | 55 | 10-15 |
| Phelt Magazine | pheltmagazine.co/photo-booths-of-berlin | `extractPheltMagazineBerlin()` | 55 | 8-12 |
| Aperture Tours | aperturetours.com/blog/2017/berlin-photoautomat | `extractApertureToursberlin()` | 55 | 5-10 |

### London (3 sources)
| Source | URL | Extractor | Priority | Expected |
|--------|-----|-----------|----------|----------|
| DesignMyNight | designmynight.com/london/bars/bars-with-photo-booths | `extractDesignMyNightLondon()` | 60 | 20-30 |
| London World | londonworld.com/read-this/25-quirky-photo-booths-in-london | `extractLondonWorld()` | 55 | 20-25 |
| Flash Pack | itstheflashpack.com/the-lens/the-best-photo-booths-in-london | `extractFlashPackLondon()` | 55 | 10-15 |

### Los Angeles (2 sources)
| Source | URL | Extractor | Priority | Expected |
|--------|-----|-----------|----------|----------|
| TimeOut LA | timeout.com/los-angeles/bars/best-bars-with-photo-booths | `extractTimeOutLA()` | 60 | 15-20 |
| Locale Magazine | localemagazine.com/best-la-photo-booths | `extractLocaleMagazineLA()` | 55 | 8-12 |

### Chicago (2 sources)
| Source | URL | Extractor | Priority | Expected |
|--------|-----|-----------|----------|----------|
| TimeOut Chicago | timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth | `extractTimeOutChicago()` | 60 | 18-20 |
| Block Club Chicago | blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed | `extractBlockClubChicago()` | 50 | 5-10 |

### New York (3 sources)
| Source | URL | Extractor | Priority | Expected |
|--------|-----|-----------|----------|----------|
| DesignMyNight NY | designmynight.com/new-york | `extractDesignMyNightNY()` | 60 | 25-35 |
| Roxy Hotel | roxyhotelnyc.com/stories/photo-booths-of-new-new-york | `extractRoxyHotelNY()` | 55 | 8-12 |
| Airial Travel | airial.travel/attractions/united-states/vintage-photo-booths-brooklyn | `extractAirialTravelBrooklyn()` | 55 | 6-10 |

## Total Coverage
- **13 sources**
- **5 cities**
- **158-216 expected booths**
- **~4 minute crawl time**

## Deployment

### 1. Apply Migration
```bash
supabase db push supabase/migrations/20251123_tier3a_city_guides.sql
```

### 2. Deploy Function
```bash
supabase functions deploy unified-crawler
```

### 3. Test Single Source
```bash
curl -X POST https://your-project.supabase.co/functions/v1/unified-crawler \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source_name": "timeout-la", "force_crawl": true}'
```

### 4. Run Full Crawl
```bash
curl -X POST https://your-project.supabase.co/functions/v1/sync-all-sources \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"force_crawl": true, "run_deduplication": true, "auto_merge_duplicates": true}'
```

## Key Features

### Extraction Strategies
- **Markdown parsing:** Headers, bold text, numbered lists
- **Address detection:** US, UK, German formats
- **Context extraction:** Neighborhoods, venue types, hours
- **Status detection:** Active/closed, operational state
- **HTML fallback:** If markdown extraction fails

### Data Quality
- All booths marked as `status: 'unverified'` (blog sources)
- City/country defaults per source
- Validation: name, address, country required
- Deduplication with primary sources expected

### Expected Deduplication
- **60-70% overlap** with Tier 1/2 sources
- **Net new booths:** 40-60
- **High confidence merges:** 80-100
- **Manual review:** 20-30

## Extractor Types (for SQL)
```sql
-- Use these in crawl_sources.extractor_type
city_guide_berlin_digitalcosmonaut
city_guide_berlin_phelt
city_guide_berlin_aperture
city_guide_london_designmynight
city_guide_london_world
city_guide_london_flashpack
city_guide_la_timeout
city_guide_la_locale
city_guide_chicago_timeout
city_guide_chicago_blockclub
city_guide_ny_designmynight
city_guide_ny_roxy
city_guide_ny_airial
```

## Success Metrics
- [ ] 100+ booths extracted
- [ ] 70%+ deduplication rate
- [ ] 40+ net new booths
- [ ] <10% extraction error rate
- [ ] 80%+ complete address data

## Next Steps
1. Deploy migration + function
2. Run test crawl on single source
3. Review extraction quality
4. Run full crawl with deduplication
5. Review duplicate matches
6. Schedule weekly crawls (14-day frequency)

## Documentation
- **Full report:** `/TIER3A_CITY_GUIDES_EXTRACTION_REPORT.md`
- **Code:** `/supabase/functions/unified-crawler/city-guide-extractors.ts`
- **Migration:** `/supabase/migrations/20251123_tier3a_city_guides.sql`
