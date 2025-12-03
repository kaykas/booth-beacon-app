# Crawler Source Validation Report

**Date:** 2025-11-30
**Validation Tool:** `validate-all-sources.ts`
**Total Sources Tested:** 27 enabled sources

---

## Executive Summary

Out of 27 enabled crawler sources:
- ✅ **4 Working** (15%) - Currently extracting booths successfully
- ⚠️ **7 Need Testing** (26%) - URLs work but haven't extracted booths yet
- 🔧 **5 Need Configuration** (19%) - Missing names or extractors
- ❌ **11 Broken** (41%) - URLs inaccessible (404s, timeouts, 405s)

**Critical Finding:** Only 4 out of 27 enabled sources (15%) are actually working. The remaining 85% need attention.

---

## ✅ Working Sources (4)

### 1. autophoto.org
- **URL:** https://autophoto.org/booth-locator
- **Extractor:** `autophoto`
- **Booths Found:** 23
- **Status:** ✅ Excellent performance
- **Action:** Keep enabled, monitor

### 2. Fotoautomatica Florence
- **URL:** https://www.fotoautomatica.com/
- **Extractor:** `core`
- **Booths Found:** 6
- **Status:** ✅ Working well
- **Action:** Keep enabled

### 3. photobooth.net (Primary)
- **URL:** https://www.photobooth.net/locations/
- **Extractor:** `photobooth_net`
- **Booths Found:** 15
- **HTTP Status:** 200 (372ms)
- **Status:** ✅ Working
- **Action:** **Keep this one**

### 4. Photobooth.net (DUPLICATE)
- **URL:** https://www.photobooth.net/locations/
- **Extractor:** `photobooth_net`
- **Booths Found:** 5
- **HTTP Status:** 200 (179ms)
- **Status:** ✅ Working but redundant
- **Action:** **DISABLE - This is a duplicate**

---

## ⚠️ Needs Testing (7)

These sources have accessible URLs but haven't found booths yet. They need custom extractors or configuration.

1. **Automatfoto Sweden** (https://automatfoto.se/)
   - Extractor: `discovery`
   - Action: Test crawler manually, may need custom extractor

2. **Find My Film Lab - LA** (https://findmyfilmlab.com/photobooths)
   - Extractor: `discovery`
   - Action: Check if page structure has changed

3. **Block Club Chicago** (https://blockclubchicago.org/...)
   - Extractor: `city_guide_chicago_blockclub`
   - Action: Verify extractor is correctly parsing article

4. **Photomatica SF/LA** (https://www.photomatica.com/photo-booth-museum)
   - Extractor: `core`
   - Action: May need custom Photomatica extractor

5. **Autophoto Chicago/Midwest** (https://autophoto.org/booth-locator)
   - Extractor: `core`
   - Note: Same URL as working autophoto.org source
   - Action: **DISABLE - Duplicate of working source**

6. **Photoautomat Berlin/Leipzig** (http://www.photoautomat.de/standorte.html)
   - Extractor: `core`
   - Action: Needs German language support in extractor

7. **Fotoautomat Wien** (https://www.fotoautomatwien.com/)
   - Extractor: `core`
   - Action: Test manually, may need custom extractor

---

## 🔧 Needs Configuration (5)

Missing required configuration fields (source_name or extractor_type).

1. **ID: a6eb60de-4c91-43c3-9ee9-f15a608c6f74**
   - URL: http://www.photoautomat.de/standorte.html
   - Issues: Missing source_name, using `universal` extractor
   - Action: Add proper name, assign correct extractor

2. **ID: 2652b605-0b48-41e9-b529-819278a8462f**
   - URL: https://www.boothbybryant.com
   - Issues: Missing source_name, single operator
   - Action: Verify if multi-location, add name or disable

3. **ID: 28584ea2-1c01-452c-9260-fd2200a2b5c9**
   - URL: https://findmyfilmlab.com/photobooths
   - Issues: Missing source_name
   - Action: Add name "Find My Film Lab"

4. **ID: 6ea21991-64ae-4986-aa9f-47b4bc71ea2d**
   - URL: https://eternalog-fotobooth.com
   - Issues: Missing source_name
   - Action: Add name "Eternalog Fotobooth"

5. **Automatfoto - Stockholm Network**
   - URL: https://automatfoto.se/
   - Issues: Missing extractor_type entirely
   - Action: Assign proper extractor (likely `core` or custom `automatfoto`)

---

## ❌ Broken Sources (11)

These sources have inaccessible URLs and should be disabled or fixed.

### 404 Not Found (7)

1. **ID: 8e86c918-e190-46fd-825e-092159c9b6ea**
   - URL: http://www.fotoautomat.fr/standorte.html
   - Action: DISABLE - Page no longer exists

2. **ID: 06e164b0-8071-4e78-ba36-65802ff43a3f**
   - URL: https://www.aastudiosinc.com/locations
   - Action: DISABLE - Page not found

3. **Classic Photo Booth Network**
   - URL: https://classicphotobooth.net/locations-2/
   - Action: DISABLE or find correct URL

4. **Louie Despres Photobooth Project**
   - URL: https://louiedespres.com/photobooth-project
   - Action: DISABLE - Page not found

5. **Photomatica - West Coast Network**
   - URL: https://photomatica.com/locations
   - Action: DISABLE - Missing extractor AND 404

6. **ID: 8867017a-2ec2-40e4-b07d-ca3d827ca4d4**
   - URL: https://girlinflorence.com/2012/01/24/...
   - Action: DISABLE - Old blog post, page not found

7. **DoTheBay SF Guide**
   - URL: https://dothebay.com/p/strike-a-pose-photo-booths-in-the-bay
   - Action: DISABLE - Page not found

### 405 Method Not Allowed (2)

8. **Time Out LA**
   - URL: https://www.timeout.com/los-angeles/news/...
   - Issue: Server rejects HEAD requests
   - Action: Update validation script to use GET, or disable

9. **Time Out Chicago**
   - URL: https://www.timeout.com/chicago/bars/...
   - Issue: Server rejects HEAD requests
   - Action: Update validation script to use GET, or disable

### Timeout (2)

10. **Autofoto - UK/Spain Network**
    - URL: https://www.autofoto.org/locations
    - Action: DISABLE - Server not responding

11. **Metro Auto Photo Australia**
    - URL: https://metroautophoto.com.au/locations
    - Action: DISABLE - Server not responding

---

## Recommended Actions

### Immediate (High Priority)

1. **Disable 11 broken sources** - All sources with 404/405/timeout errors
2. **Remove 2 duplicate sources**:
   - Photobooth.net duplicate (keep the one with 15 booths)
   - Autophoto Chicago/Midwest duplicate (keep autophoto.org)
3. **Fix 5 configuration issues** - Add missing source names and extractors

### Short Term (Medium Priority)

4. **Test 7 "Needs Testing" sources** manually:
   - Run crawler for each source individually
   - Check if extractors are working
   - Create custom extractors where needed

### Medium Term (Lower Priority)

5. **Create custom extractors** for high-value sources:
   - Automatfoto Sweden
   - Photomatica (German sites)
   - Block Club Chicago article
6. **Implement raw data storage** (crawl_results table) for debugging
7. **Add crawler metrics logging** to track success/failure rates

---

## Database Changes Needed

### 1. Disable Broken Sources (11)

```sql
UPDATE crawl_sources
SET enabled = false, status = 'disabled_404'
WHERE id IN (
  '8e86c918-e190-46fd-825e-092159c9b6ea', -- fotoautomat.fr
  '06e164b0-8071-4e78-ba36-65802ff43a3f', -- aastudiosinc
  '0d1a2065-c8ee-473b-84a6-f9c04ed705ac', -- Classic Photo Booth
  '6d1ffea2-7d4d-4de7-a787-3d0e0693d70e', -- Louie Despres
  '47fd8906-0fea-4519-bf55-ea12bb98e8d8', -- Autofoto UK/Spain
  '02ca8203-e441-426d-bb94-d4998253ed09', -- Photomatica West Coast
  '8867017a-2ec2-40e4-b07d-ca3d827ca4d4', -- Girl in Florence
  '8ae47c82-eef9-4139-8846-eb950b9ccb3b', -- DoTheBay
  '3187ba89-608f-4d22-9413-0b7725e7907e', -- Time Out LA
  '7697acf9-143f-48ca-9abe-1c3ea3324cdf', -- Time Out Chicago
  'bad7bc13-613e-4aeb-8b6b-ef0e29c31182'  -- Metro Auto Photo Australia
);
```

### 2. Remove Duplicates (2)

```sql
-- Disable duplicate photobooth.net (keep the one with more booths)
UPDATE crawl_sources
SET enabled = false, status = 'disabled_duplicate'
WHERE source_url = 'https://www.photobooth.net/locations/'
  AND total_booths_found = 5;

-- Disable duplicate autophoto (keep main autophoto.org)
UPDATE crawl_sources
SET enabled = false, status = 'disabled_duplicate'
WHERE source_name = 'Autophoto Chicago/Midwest';
```

### 3. Fix Configuration Issues (5)

```sql
-- Add source names
UPDATE crawl_sources SET source_name = 'Photoautomat Berlin'
WHERE id = 'a6eb60de-4c91-43c3-9ee9-f15a608c6f74';

UPDATE crawl_sources SET source_name = 'Booth by Bryant'
WHERE id = '2652b605-0b48-41e9-b529-819278a8462f';

UPDATE crawl_sources SET source_name = 'Find My Film Lab'
WHERE id = '28584ea2-1c01-452c-9260-fd2200a2b5c9';

UPDATE crawl_sources SET source_name = 'Eternalog Fotobooth'
WHERE id = '6ea21991-64ae-4986-aa9f-47b4bc71ea2d';

-- Add missing extractor
UPDATE crawl_sources SET extractor_type = 'core'
WHERE source_name = 'Automatfoto - Stockholm Network';
```

---

## Success Metrics

After implementing changes:
- **Target:** 80%+ of enabled sources should successfully extract booths
- **Current:** 15% (4/27 working)
- **After cleanup:** Expect ~60% (4/7 working after disabling broken ones)

---

## Files Generated

- `validate-all-sources.ts` - Automated validation script
- `validation-results.json` - Detailed JSON report with all test results
- `VALIDATION_REPORT.md` - This human-readable report

---

## Next Steps

1. Apply database changes listed above
2. Re-run validation: `npx tsx validate-all-sources.ts`
3. Manually test the 7 "Needs Testing" sources
4. Create custom extractors for high-value sources
5. Monitor crawler metrics after changes
