# Booth Beacon - Source URLs for Schema Analysis

## ✅ IMPLEMENTATION STATUS: COMPLETE

**File:** `crawl-all-sources.ts`
**Strategy:** Smart routing based on Firecrawl expert recommendations
**Date:** December 2, 2025

### Smart Routing Strategy Implemented

Based on expert guidance, we're using two different approaches:

1. **`scrapeUrl()` for Single-Page Sites (10 sources)**
   - Fast, efficient, cost-effective
   - Perfect for operator portfolios that list all booths on one page
   - ~10x cheaper than crawling

2. **`crawlUrl()` for Complex Multi-Page Sites (1 source)**
   - Navigates through multiple pages
   - Uses includePaths/excludePaths to avoid irrelevant pages
   - Only for sites where booths are spread across many URLs

## Instructions for AI/Google Analysis
For each URL below, create a Firecrawl schema (similar to the photobooth.net example) that extracts:
- Booth/venue name
- Full address (street, city, state, country)
- Coordinates (if available)
- Machine type (analog/digital, B&W/color, model)
- Cost per strip
- Operational status (active/inactive)
- Hours of operation
- Payment methods
- Operator/owner information
- Description/notes
- Any other relevant metadata

## 15 Enabled Sources

### Priority 100 (Tier 1 - Most Important)

1. **photobooth.net**
   - URL: `http://www.photobooth.net/locations/browse.php?ddState=0`
   - Type: Major directory
   - Notes: Already has schema-based extraction implemented ✅

2. **Fotoautomatica Florence**
   - URL: `https://www.fotoautomatica.com/`
   - Type: European operator
   - Expected booths: 10-20

3. **Fotoautomat Wien**
   - URL: `https://www.fotoautomatwien.com/`
   - Type: Austrian operator
   - Expected booths: 5-10

4. **Photoautomat Berlin/Leipzig**
   - URL: `http://www.photoautomat.de/standorte.html`
   - Type: German operator
   - Expected booths: 20-30

### Priority 90 (Tier 2 - High Value)

5. **autophoto.org**
   - URL: `https://autophoto.org/booth-locator`
   - Type: NYC operator with interactive map
   - Expected booths: 20-30
   - Notes: JavaScript-heavy, may need special handling

### Priority 80 (Tier 2)

6. **Photomatica SF/LA**
   - URL: `https://www.photomatica.com/find-a-booth-near-you`
   - Type: West Coast operator
   - Expected booths: 10-20

### Priority 50 (Tier 3 - Medium Value)

7. **Automatfoto Sweden**
   - URL: `https://automatfoto.se/`
   - Type: Swedish operator
   - Expected booths: 5-10

8. **Photo Illusion**
   - URL: `https://www.photoillusion.com/`
   - Type: Operator
   - Expected booths: 5-10

9. **Find My Film Lab - LA**
   - URL: `https://findmyfilmlab.com/photobooths`
   - Type: Directory/community site
   - Expected booths: 10-20

### Priority 2 (Tier 4 - Lower Priority)

10. **Automatfoto Stockholm**
    - URL: `https://automatfoto.se/`
    - Type: Swedish operator (duplicate?)
    - Expected booths: 5-10

11. **Find My Film Lab LA**
    - URL: `https://findmyfilmlab.com/photobooths`
    - Type: Directory (duplicate?)
    - Expected booths: 10-20

12. **Eternalog Seoul**
    - URL: `https://eternalog-fotobooth.com`
    - Type: Korean operator
    - Expected booths: 3-5

### Priority 1 (Tier 5 - Lowest Priority)

13. **Booth by Bryant**
    - URL: `https://www.boothbybryant.com`
    - Type: Orange County operator
    - Expected booths: 5-10

14. **Photoautomat Germany**
    - URL: `http://www.photoautomat.de/standorte.html`
    - Type: German operator (duplicate?)
    - Expected booths: 20-30

15. **Fotoautomat France/Czechia**
    - URL: `https://fotoautomat.fr/en/our-adresses/`
    - Type: French operator
    - Expected booths: 10-20

---

## Total Expected Booths from All Sources
- **Minimum:** 150-200 booths
- **Realistic:** 250-350 booths
- **Optimistic:** 400-500 booths

## Copy-Paste URLs Only (for quick analysis)

```
http://www.photobooth.net/locations/browse.php?ddState=0
https://www.fotoautomatica.com/
https://www.fotoautomatwien.com/
http://www.photoautomat.de/standorte.html
https://autophoto.org/booth-locator
https://www.photomatica.com/find-a-booth-near-you
https://automatfoto.se/
https://www.photoillusion.com/
https://findmyfilmlab.com/photobooths
https://automatfoto.se/
https://findmyfilmlab.com/photobooths
https://eternalog-fotobooth.com
https://www.boothbybryant.com
http://www.photoautomat.de/standorte.html
https://fotoautomat.fr/en/our-adresses/
```

## Example Schema Format (from photobooth.net)

```typescript
const schema = {
  type: "object",
  properties: {
    listings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Venue name" },
          location: {
            type: "object",
            properties: {
              address: { type: "string" },
              city: { type: "string" },
              state_or_province: { type: "string" },
              country: { type: "string" },
              coordinates: {
                type: "object",
                properties: {
                  latitude: { type: "number" },
                  longitude: { type: "number" }
                }
              }
            }
          },
          details: {
            type: "object",
            properties: {
              machine_type: { type: "string" },
              cost: { type: "string" },
              photo_count: { type: "number" },
              is_active: { type: "boolean" },
              payment_type: { type: "string" }
            },
            required: ["is_active"]
          },
          last_visit: { type: "string" },
          description: { type: "string" },
          operator: { type: "string" }
        },
        required: ["name", "location", "details"]
      }
    }
  },
  required: ["listings"]
};
```
