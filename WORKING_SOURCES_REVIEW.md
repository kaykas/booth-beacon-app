# Working Sources - Quick Review

## Sources Currently Extracting Booths (6 total, 78 booths)

### 1. ✅ autophoto.org - 23 booths
- **URL:** https://autophoto.org/booth-locator
- **Extractor:** `autophoto` (custom)
- **Status:** APPROVED
- **Notes:** Needs data enrichment (missing hours, contact info, descriptions)
- **Action:** Keep enabled, add to enrichment queue

---

### 2. 🔍 Find My Film Lab - LA - 18 booths (NEEDS REVIEW)
- **URL:** https://findmyfilmlab.com/photobooths
- **Extractor:** `discovery`
- **Status:** **NEEDS YOUR URL CHECK**
- **Question for user:**
  - Visit the URL - are the locations valid?
  - Are there more than 18 locations shown?
  - Quality of booth data?

---

### 3. ⚠️ Automatfoto - Stockholm - 16 booths (CONFIG ISSUE)
- **URL:** https://automatfoto.se/
- **Extractor:** NULL ❌
- **Status:** **CRITICAL - Has null extractor but somehow extracted 16 booths**
- **Action Required:**
  - Set extractor_type to 'discovery' or custom 'automatfoto'
  - Re-test after fix
- **Question for user:**
  - Visit URL - confirm it has locations
  - Are the 16 booths real/valid?

---

### 4. ✅ photobooth.net - 15 booths (PRIMARY - KEEP)
- **URL:** https://www.photobooth.net/locations/
- **Extractor:** `photobooth_net` (custom)
- **Status:** **KEEP THIS ONE (has MORE booths than duplicate)**
- **Action:** Keep enabled

---

### 5. 🔍 Fotoautomatica Florence - 6 booths (NEEDS REVIEW)
- **URL:** https://www.fotoautomatica.com/
- **Extractor:** `core`
- **Status:** **NEEDS YOUR URL CHECK**
- **Question for user:**
  - Visit the URL - are the 6 locations valid?
  - Are there more locations not being extracted?
  - Should we create custom extractor?

---

### 6. ❌ Photobooth.net - 5 booths (DUPLICATE)
- **URL:** https://www.photobooth.net/locations/ (SAME AS #4)
- **Extractor:** `photobooth_net`
- **Status:** **DISABLE - Duplicate of primary source**
- **Action:** Add to SQL disable list

---

## Quick Actions Needed:

1. **Apply SQL** - Disable duplicate photobooth.net
2. **Fix Automatfoto** - Add extractor_type: 'discovery'
3. **User Review** - Check 3 URLs: Find My Film Lab, Automatfoto, Fotoautomatica
4. **Fotoautomat France** - Retry test (timeout issue)

## Updated Stats:
- Working sources: **5** (after removing duplicate)
- Total booths: **73** (after removing duplicate's 5)
- Success rate: **5/27 enabled = 18.5%**
