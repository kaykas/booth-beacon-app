# Crawler Infrastructure Audit

**Date:** 2025-11-30
**Total Sources:** 80 (27 enabled, 53 disabled)
**Total Booths:** 1,090
**Status:** Critical infrastructure issues identified

---

## Critical Infrastructure Issues

### 1. No Crawl Run Logging ⚠️
- **Issue:** `crawler_metrics` table is completely empty
- **Impact:** Zero visibility into crawler runs, success/failure rates, or performance
- **Fix:** Add logging to crawler execution code

### 2. No Raw Data Storage ⚠️
- **Issue:** No table for storing raw HTML/JSON from crawls
- **Impact:** Cannot reprocess data to improve extraction without re-crawling
- **Fix:** Create `crawl_results` table with columns:
  - `id` (uuid)
  - `source_id` (uuid, FK to crawl_sources)
  - `url` (text)
  - `raw_html` (text)
  - `raw_json` (jsonb)
  - `content_hash` (text)
  - `crawled_at` (timestamp)
  - `http_status` (integer)
  - `response_time_ms` (integer)

### 3. No Error Tracking
- **Issue:** No detailed error logs from failed crawls
- **Impact:** Cannot debug extraction failures
- **Fix:** Add error_details column to crawler_metrics

---

## Source-by-Source Audit

### ✅ WORKING SOURCES (4)

#### 1. autophoto.org
- **Status:** ✅ Working
- **Booths Found:** 23
- **Extractor:** autophoto
- **Last Crawl:** 2025-11-30 02:13 AM
- **Issues:** None
- **Recommendation:** Keep enabled, monitor

#### 2. Automatfoto Stockholm
- **Status:** ✅ Working
- **Booths Found:** 16
- **Extractor:** default
- **Last Crawl:** 2025-11-29 08:31 AM
- **Issues:** None
- **Recommendation:** Keep enabled, monitor

#### 3. photobooth.net
- **Status:** ✅ Working (DUPLICATE EXISTS)
- **Booths Found:** 15
- **Extractor:** photobooth_net
- **Last Crawl:** 2025-11-30 02:11 AM
- **Issues:** Duplicate source exists (ID: 774dbbd0-9df7-44b9-b261-50dc0b7c9182)
- **Recommendation:** Keep this one, disable duplicate

#### 4. Fotoautomatica Florence
- **Status:** ✅ Working
- **Booths Found:** 6
- **Extractor:** core
- **Last Crawl:** 2025-11-30 02:36 AM
- **Issues:** None
- **Recommendation:** Keep enabled, monitor

---

### ❌ BROKEN/UNCONFIGURED SOURCES (23)

#### 5. (unnamed) - photoautomat.de
- **ID:** a6eb60de-4c91-43c3-9ee9-f15a608c6f74
- **URL:** http://www.photoautomat.de/standorte.html
- **Extractor:** universal
- **Status:** ❌ Never crawled, 0 booths
- **Issues:** No source_name, universal extractor may not work
- **Recommendation:** Test URL, create custom extractor if needed

#### 6. (unnamed) - boothbybryant.com
- **ID:** 2652b605-0b48-41e9-b529-819278a8462f
- **URL:** https://www.boothbybryant.com
- **Extractor:** universal
- **Status:** ❌ Never crawled, 0 booths
- **Issues:** No source_name, single operator (not a network)
- **Recommendation:** Verify this is a multi-location operator, or disable

#### 7. (unnamed) - fotoautomat.fr
- **ID:** 8e86c918-e190-46fd-825e-092159c9b6ea
- **URL:** http://www.fotoautomat.fr/standorte.html
- **Extractor:** universal
- **Status:** ❌ Never crawled, 0 booths
- **Issues:** No source_name, may need custom extractor
- **Recommendation:** Test URL, create custom extractor

#### 8. (unnamed) - aastudiosinc.com
- **ID:** 06e164b0-8071-4e78-ba36-65802ff43a3f
- **URL:** https://www.aastudiosinc.com/locations
- **Extractor:** universal
- **Status:** ❌ Never crawled, 0 booths
- **Issues:** No source_name, single operator
- **Recommendation:** Verify multi-location, or disable

#### 9. Classic Photo Booth Network
- **ID:** 0d1a2065-c8ee-473b-84a6-f9c04ed705ac
- **URL:** https://classicphotobooth.net/locations-2/
- **Extractor:** universal
- **Status:** ❌ Never crawled, 0 booths
- **Issues:** Universal extractor may not work
- **Recommendation:** Test URL, create custom extractor

#### 10. Louie Despres Photobooth Project
- **ID:** 6d1ffea2-7d4d-4de7-a787-3d0e0693d70e
- **URL:** https://louiedespres.com/photobooth-project
- **Extractor:** universal
- **Status:** ❌ Never crawled, 0 booths
- **Issues:** Photography project, not operator network
- **Recommendation:** Verify data quality, may need custom parser

#### 11. Autofoto - UK/Spain Network
- **ID:** 47fd8906-0fea-4519-bf55-ea12bb98e8d8
- **URL:** https://www.autofoto.org/locations
- **Extractor:** universal
- **Status:** ❌ Never crawled, 0 booths
- **Issues:** May need custom extractor
- **Recommendation:** Test URL, likely needs autofoto extractor

#### 12. Photomatica - West Coast Network
- **ID:** 02ca8203-e441-426d-bb94-d4998253ed09
- **URL:** https://photomatica.com/locations
- **Extractor:** default
- **Status:** ❌ Never crawled, 0 booths
- **Issues:** May need custom extractor
- **Recommendation:** Test URL, create photomatica extractor

#### 13-27. Additional Unnamed/Broken Sources
- Multiple sources with no names
- Multiple sources that have never been crawled
- Several blog/guide sources that may need custom extractors

---

## Duplicate Sources to Remove

1. **Photobooth.net (Duplicate)**
   - ID: 774dbbd0-9df7-44b9-b261-50dc0b7c9182
   - Keep: 087a727c-ea9b-4bc6-b114-e5f88fbe3f21 (15 booths)
   - Remove: This one (5 booths)

2. **Automatfoto Sweden (Duplicate?)**
   - ID: 9f7cd896-1303-46b7-8479-9ebfd3ef42fb (discovery extractor)
   - Keep: 1ae976ca-5f25-447a-b4b8-45165651d3b2 (default extractor, 16 booths)
   - Remove: This one (0 booths)

---

## Action Plan

### Immediate (Phase 1 - Infrastructure)
1. ✅ Create `crawl_results` table for raw data storage
2. ✅ Fix crawler_metrics logging
3. ✅ Add detailed error tracking

### Short Term (Phase 2 - Source Validation)
1. Test all 27 enabled sources manually
2. Create custom extractors for high-value sources
3. Disable/remove duplicate sources
4. Fix unnamed sources

### Medium Term (Phase 3 - Quality)
1. Build source validation dashboard
2. Set up automated health checks
3. Implement source rotation/fallback
4. Add data quality metrics

---

## Success Metrics

- Crawler metrics table has entries for all runs
- 80%+ of enabled sources successfully extract booths
- All sources have proper names
- No duplicate sources
- Raw crawl data stored for reprocessing
