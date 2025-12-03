# MASTER CRAWL PLAN
**Date Created:** 2025-01-30
**Last Updated:** 2025-01-30 @ 20:10 PST
**Status:** In Progress (1/27 reviewed)

## Overview

This document tracks the **one-by-one review** of all 27 enabled crawler sources. Each source will be:
1. **URL Verified** - Tested for accessibility
2. **User Reviewed** - Manually inspected by user for quality
3. **Extractor Optimized** - Configured with the best extractor
4. **Test Crawled** - Verified to extract booths correctly
5. **Approved** - Marked as production-ready

---

## Progress Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Reviewed & Approved | 0 | 0% |
| 🔄 In Review | 1 | 4% |
| ⏳ Pending Review | 26 | 96% |
| ❌ To Be Disabled | 11 | - |

---

## Sources In Review (1)

### 1. Fotoautomat France
- **ID:** `8e86c918-e190-46fd-825e-092159c9b6ea`
- **Original URL:** http://www.fotoautomat.fr/standorte.html (404)
- **Updated URL:** https://fotoautomat.fr/en/our-adresses/
- **User Feedback:** User found working URL with locations and photos
- **Extractor:** `discovery`
- **Status:** 🔄 Testing crawler now
- **Next Step:** Review test results and approve/adjust

---

## Working Sources - Needs Review (3)

These sources are currently extracting booths but need review for optimization.

### 2. autophoto.org
- **ID:** TBD
- **URL:** https://autophoto.org/booth-locator
- **Extractor:** `autophoto`
- **Booths Found:** 23
- **Status:** ⏳ Pending review
- **Notes:** Currently working, needs review for completeness

### 3. Fotoautomatica Florence
- **ID:** TBD
- **URL:** https://www.fotoautomatica.com/
- **Extractor:** `core`
- **Booths Found:** 6
- **Status:** ⏳ Pending review
- **Notes:** Currently working, needs review for completeness

### 4. photobooth.net (Primary)
- **ID:** TBD
- **URL:** https://www.photobooth.net/locations/
- **Extractor:** `photobooth_net`
- **Booths Found:** 15
- **Status:** ⏳ Pending review
- **Notes:** Currently working, has a duplicate that will be disabled

---

## Needs Testing Sources (7)

These sources have accessible URLs but haven't extracted booths yet.

### 5. Automatfoto Sweden
- **URL:** https://automatfoto.se/
- **Extractor:** `discovery`
- **Status:** ⏳ Pending review
- **Notes:** URL works, may need custom extractor

### 6. Find My Film Lab - LA
- **URL:** https://findmyfilmlab.com/photobooths
- **Extractor:** `discovery`
- **Status:** ⏳ Pending review
- **Notes:** Need to check if page structure has changed

### 7. Block Club Chicago
- **URL:** https://blockclubchicago.org/...
- **Extractor:** `city_guide_chicago_blockclub`
- **Status:** ⏳ Pending review
- **Notes:** Verify extractor is correctly parsing article

### 8. Photomatica SF/LA
- **URL:** https://www.photomatica.com/photo-booth-museum
- **Extractor:** `core`
- **Status:** ⏳ Pending review
- **Notes:** May need custom Photomatica extractor

###9. Autophoto Chicago/Midwest (DUPLICATE)
- **URL:** https://autophoto.org/booth-locator
- **Extractor:** `core`
- **Status:** ⏳ To be disabled (duplicate)
- **Notes:** Same URL as autophoto.org source

### 10. Photoautomat Berlin/Leipzig
- **URL:** http://www.photoautomat.de/standorte.html
- **Extractor:** `core`
- **Status:** ⏳ Pending review
- **Notes:** Needs German language support in extractor

### 11. Fotoautomat Wien
- **URL:** https://www.fotoautomatwien.com/
- **Extractor:** `core`
- **Status:** ⏳ Pending review
- **Notes:** Test manually, may need custom extractor

---

## Configuration Issues (5)

Missing source names or extractors.

### 12. Photoautomat Berlin (Unnamed)
- **ID:** `a6eb60de-4c91-43c3-9ee9-f15a608c6f74`
- **URL:** http://www.photoautomat.de/standorte.html
- **Issues:** Missing source_name
- **Status:** ⏳ SQL fix prepared
- **Action:** Add name "Photoautomat Berlin"

### 13. Booth by Bryant (Unnamed)
- **ID:** `2652b605-0b48-41e9-b529-819278a8462f`
- **URL:** https://www.boothbybryant.com
- **Issues:** Missing source_name, single operator
- **Status:** ⏳ SQL fix prepared
- **Action:** Verify if multi-location, add name or disable

### 14. Find My Film Lab (Unnamed)
- **ID:** `28584ea2-1c01-452c-9260-fd2200a2b5c9`
- **URL:** https://findmyfilmlab.com/photobooths
- **Issues:** Missing source_name
- **Status:** ⏳ SQL fix prepared
- **Action:** Add name "Find My Film Lab"

### 15. Eternalog Fotobooth (Unnamed)
- **ID:** `6ea21991-64ae-4986-aa9f-47b4bc71ea2d`
- **URL:** https://eternalog-fotobooth.com
- **Issues:** Missing source_name
- **Status:** ⏳ SQL fix prepared
- **Action:** Add name "Eternalog Fotobooth"

### 16. Automatfoto - Stockholm Network
- **URL:** https://automatfoto.se/
- **Issues:** Missing extractor_type
- **Status:** ⏳ SQL fix prepared
- **Action:** Assign extractor `core`

---

## Broken Sources - To Be Disabled (11)

These sources have inaccessible URLs and will be disabled.

### 17. fotoautomat.fr (FIXED)
- **ID:** `8e86c918-e190-46fd-825e-092159c9b6ea`
- **Original URL:** http://www.fotoautomat.fr/standorte.html
- **Status:** ✅ FIXED - URL updated to https://fotoautomat.fr/en/our-adresses/
- **Notes:** User found working alternative

### 18. aastudiosinc (404)
- **ID:** `06e164b0-8071-4e78-ba36-65802ff43a3f`
- **URL:** https://www.aastudiosinc.com/locations
- **Status:** ❌ To be disabled
- **Reason:** HTTP 404 - Page not found

### 19. Classic Photo Booth Network (404)
- **ID:** `0d1a2065-c8ee-473b-84a6-f9c04ed705ac`
- **URL:** https://classicphotobooth.net/locations-2/
- **Status:** ❌ To be disabled
- **Reason:** HTTP 404 - Page not found

### 20. Louie Despres Photobooth Project (404)
- **ID:** `6d1ffea2-7d4d-4de7-a787-3d0e0693d70e`
- **URL:** https://louiedespres.com/photobooth-project
- **Status:** ❌ To be disabled
- **Reason:** HTTP 404 - Page not found

### 21. Autofoto - UK/Spain Network (Timeout)
- **ID:** `47fd8906-0fea-4519-bf55-ea12bb98e8d8`
- **URL:** https://www.autofoto.org/locations
- **Status:** ❌ To be disabled
- **Reason:** Server not responding

### 22. Photomatica - West Coast Network (404)
- **ID:** `02ca8203-e441-426d-bb94-d4998253ed09`
- **URL:** https://photomatica.com/locations
- **Status:** ❌ To be disabled
- **Reason:** HTTP 404 AND missing extractor

### 23. Girl in Florence (404)
- **ID:** `8867017a-2ec2-40e4-b07d-ca3d827ca4d4`
- **URL:** https://girlinflorence.com/2012/01/24/...
- **Status:** ❌ To be disabled
- **Reason:** HTTP 404 - Old blog post

### 24. DoTheBay SF Guide (404)
- **ID:** `8ae47c82-eef9-4139-8846-eb950b9ccb3b`
- **URL:** https://dothebay.com/p/strike-a-pose-photo-booths-in-the-bay
- **Status:** ❌ To be disabled
- **Reason:** HTTP 404 - Page not found

### 25. Time Out LA (405)
- **ID:** `3187ba89-608f-4d22-9413-0b7725e7907e`
- **URL:** https://www.timeout.com/los-angeles/news/...
- **Status:** ❌ To be disabled
- **Reason:** HTTP 405 - Server rejects HEAD requests

### 26. Time Out Chicago (405)
- **ID:** `7697acf9-143f-48ca-9abe-1c3ea3324cdf`
- **URL:** https://www.timeout.com/chicago/bars/...
- **Status:** ❌ To be disabled
- **Reason:** HTTP 405 - Server rejects HEAD requests

### 27. Metro Auto Photo Australia (Timeout)
- **ID:** `bad7bc13-613e-4aeb-8b6b-ef0e29c31182`
- **URL:** https://metroautophoto.com.au/locations
- **Status:** ❌ To be disabled
- **Reason:** Server not responding

---

## Duplicate Sources - To Be Disabled (2)

### Photobooth.net Duplicate
- **URL:** https://www.photobooth.net/locations/
- **Booths Found:** 5
- **Status:** ⏳ To be disabled
- **Reason:** Duplicate of primary photobooth.net source (which has 15 booths)

### Autophoto Chicago/Midwest Duplicate
- **Source Name:** Autophoto Chicago/Midwest
- **URL:** https://autophoto.org/booth-locator
- **Status:** ⏳ To be disabled
- **Reason:** Duplicate of main autophoto.org source

---

## SQL Fixes Prepared

All fixes are ready in `apply-all-fixes.sql`:

1. ✅ Create `crawl_results` table for raw data storage
2. ✅ Disable 11 broken sources
3. ✅ Remove 2 duplicate sources
4. ✅ Fix 5 configuration issues (add names/extractors)

**To Apply:** Copy SQL from `apply-all-fixes.sql` and run in Supabase SQL Editor

---

## Review Process

For each source, we will:

1. **User Review** - You inspect the URL and provide feedback
2. **URL Update** - I update the URL if needed
3. **Extractor Configuration** - I assign the optimal extractor type
4. **Test Crawl** - I run a test crawl and show you results
5. **Approve/Iterate** - You approve or request changes
6. **Document** - I update this file with final status

---

## Next Steps

1. ✅ Finish Fotoautomat France test (in progress)
2. Review test results with user
3. Apply SQL fixes (migration + disable broken/duplicates)
4. Continue one-by-one review of remaining 26 sources
5. Update this document after each source is reviewed

---

## Files Created

- `apply-all-fixes.sql` - All SQL fixes ready to apply
- `validate-all-sources.ts` - Automated validation tool
- `VALIDATION_REPORT.md` - Initial validation findings
- `MASTER_CRAWL_PLAN.md` - This file (master tracking document)
