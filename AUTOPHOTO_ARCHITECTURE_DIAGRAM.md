# Autophoto.org Enhanced Extractor - Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                   extractAutophotoEnhanced()                         │
│                   Entry Point & Orchestrator                          │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │   PHASE 1: DETECTION        │
         │   detectAutophotoPageType() │
         └──────────┬──────────────────┘
                    │
         ┌──────────┴──────────────────────────────┐
         │  Analyze URL, HTML, Markdown            │
         │  - Check for "booth-locator" in URL     │
         │  - Look for "121 Orchard Street"        │
         │  - Detect "venue:" patterns             │
         │  - Identify homepage                    │
         └──────────┬──────────────────────────────┘
                    │
                    ▼
    ┌───────────────┴────────────────────────┐
    │       Page Type Detected               │
    └───┬────────┬────────┬────────┬────────┘
        │        │        │        │
        ▼        ▼        ▼        ▼
   ┌─────┐  ┌────────┐ ┌───────┐ ┌─────┐
   │booth│  │museum  │ │venue_ │ │other│
   │_loc │  │        │ │detail │ │     │
   └──┬──┘  └───┬────┘ └───┬───┘ └──┬──┘
      │         │          │         │
      └─────────┴──────────┴─────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │   PHASE 2: EXTRACTION   │
         └──────────┬──────────────┘
                    │
    ┌───────────────┴────────────────────┐
    │                                    │
    ▼                                    ▼
┌────────────────────────┐    ┌──────────────────────┐
│ Booth Locator Page     │    │ Museum Page          │
│ extractAutophoto       │    │ extractAutophoto     │
│ BoothLocator()         │    │ Museum()             │
├────────────────────────┤    ├──────────────────────┤
│ 1. Try Wix map data    │    │ 1. Return hardcoded  │
│    extractWixMapData() │    │    museum booth      │
│ 2. Parse JSON-LD       │    │    {                 │
│ 3. Find coordinates    │    │      name: "Autophoto│
│ 4. Extract venue list  │    │      address: "121..." │
│ 5. Fallback to AI      │    │      verified: true  │
│                        │    │    }                 │
│ Output: 5-20+ booths   │    │ 2. AI extract extras │
└────────────────────────┘    │                      │
                              │ Output: 1+ booths    │
    ┌──────────────────┐      └──────────────────────┘
    │ Venue Detail     │
    │ extractAutophoto │              ┌────────────┐
    │ Venue()          │              │ Unknown    │
    ├──────────────────┤              │ Fallback   │
    │ 1. AI extraction │              │ extractWith│
    │ 2. Single booth  │              │ AI()       │
    │                  │              └────────────┘
    │ Output: 1 booth  │
    └──────────────────┘
                    │
                    └──────────┬────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ PHASE 3: VALIDATION  │
                    │ enhanceAutophotoBooth│
                    │ () for each booth    │
                    └──────────┬───────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              ▼                                 ▼
    ┌──────────────────┐           ┌────────────────────┐
    │ Set Defaults     │           │ Extract Machine    │
    │ - booth_type:    │           │ Models             │
    │   'analog'       │           │ - Photo-Me →       │
    │ - country: 'US'  │           │   Photo-Me Intl    │
    │ - state: 'NY'    │           │ - Photomaton →     │
    │ - city: 'NYC'    │           │   Photomaton       │
    │ - verified: true │           │ - Vintage →        │
    └──────────────────┘           │   Various          │
                                   └────────────────────┘
              │                                 │
              └────────────┬────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ PHASE 4: ENRICHMENT  │
                │ enrichNYCContext()   │
                │ for each booth       │
                └──────────┬───────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌───────────────────┐            ┌────────────────────┐
│ Borough Detection │            │ Neighborhood       │
│                   │            │ Extraction         │
│ Manhattan:        │            │                    │
│  - Lower East Side│            │ From address:      │
│  - East Village   │            │  "123 Main St,     │
│  - Tribeca        │            │   Lower East Side" │
│  - Chelsea...     │            │                    │
│                   │            │ Patterns:          │
│ Brooklyn:         │            │  - Match keywords  │
│  - Williamsburg   │            │  - Extract from    │
│  - Bushwick       │            │    venue context   │
│  - Park Slope...  │            └────────────────────┘
│                   │
│ Queens, Bronx,    │            ┌────────────────────┐
│ Staten Island     │            │ Tag Generation     │
└───────────────────┘            │                    │
                                 │ tags = [           │
        │                        │   'nyc',           │
        └────────────────────────┤   'manhattan',     │
                                 │   'analog'         │
                                 │ ]                  │
                                 └────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ PHASE 5: RESULTS     │
                └──────────┬───────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Return Result   │
                  │ {               │
                  │   booths: [...],│
                  │   errors: [...],│
                  │   metadata: {   │
                  │     pages: n,   │
                  │     found: n,   │
                  │     time: ms    │
                  │   }             │
                  │ }               │
                  └─────────────────┘


═══════════════════════════════════════════════════════════════════════
                        PROGRESS EVENTS
═══════════════════════════════════════════════════════════════════════

Phase 1: Detection
  ↓
  onProgress({ type: 'autophoto_phase', phase: 'detection' })

Phase 2: Extraction
  ↓
  onProgress({ type: 'autophoto_phase', phase: 'map_extraction' })
  or
  onProgress({ type: 'autophoto_phase', phase: 'museum_extraction' })
  or
  onProgress({ type: 'autophoto_phase', phase: 'venue_extraction' })

Phase 3: Validation
  ↓
  onProgress({ type: 'autophoto_phase', phase: 'validation' })

Phase 4: Enrichment
  ↓
  onProgress({ type: 'autophoto_phase', phase: 'enrichment' })

Phase 5: Complete
  ↓
  onProgress({
    type: 'autophoto_complete',
    booths_extracted: n,
    errors_count: n,
    extraction_time_ms: n
  })


═══════════════════════════════════════════════════════════════════════
                      DATA FLOW DIAGRAM
═══════════════════════════════════════════════════════════════════════

INPUT                     PROCESSING                     OUTPUT
─────                     ──────────                     ──────

HTML                                                     BoothData[]
Markdown         →→→  detectPageType()       →→→       {
sourceUrl                                                 name,
                          ↓                               address,
                                                          city: "New York",
                     extractBooths()                      state: "NY",
                                                          borough,
                          ↓                               neighborhood,
                                                          booth_type: "analog",
                     validateBooths()                     machine_model,
                                                          is_verified: true,
                          ↓                               tags: ['nyc']
                                                        }
                     enrichNYCContext()

                          ↓

                     ExtractorResult
                     {
                       booths: [...],
                       errors: [...],
                       metadata: {...}
                     }


═══════════════════════════════════════════════════════════════════════
                        HELPER FUNCTIONS
═══════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│ extractWixMapData(html)                                      │
├──────────────────────────────────────────────────────────────┤
│ Input:  HTML string from Wix page                           │
│ Process:                                                     │
│   1. Look for window.dynamicModel in <script>               │
│   2. Parse JSON-LD structured data                          │
│   3. Extract lat/lng patterns from JavaScript               │
│   4. Filter NYC coordinate bounds                           │
│ Output: WixMapLocation[] { name, address, lat, lng }        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ enhanceAutophotoMarkdown(markdown, html)                    │
├──────────────────────────────────────────────────────────────┤
│ Input:  Markdown content                                    │
│ Process:                                                     │
│   1. Add header: "# NYC Photo Booth Locations"             │
│   2. Enhance venue names: "**Venue: NAME** (NYC...)"       │
│   3. Label addresses: "Address: 123 Main St"               │
│   4. Preserve existing structure                            │
│ Output: Enhanced markdown with NYC context                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ enhanceAutophotoBooth(booth, sourceUrl)                     │
├──────────────────────────────────────────────────────────────┤
│ Input:  Raw booth data                                      │
│ Process:                                                     │
│   1. Set booth_type = 'analog' (default)                   │
│   2. Set location defaults (NYC, NY, US)                   │
│   3. Extract machine models from description               │
│   4. Parse cost from description ($8)                      │
│   5. Set is_verified = true                                │
│   6. Set photo_type = '4-strip'                            │
│ Output: Enhanced booth with Autophoto defaults             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ enrichNYCContext(booth)                                      │
├──────────────────────────────────────────────────────────────┤
│ Input:  Validated booth data                                │
│ Process:                                                     │
│   1. Match address/neighborhood to borough                  │
│      - Manhattan neighborhoods: 30+ patterns               │
│      - Brooklyn neighborhoods: 15+ patterns                │
│      - Queens, Bronx, Staten Island                        │
│   2. Extract ZIP code: /\b(\d{5})\b/                       │
│   3. Generate tags: ['nyc', borough, 'analog']             │
│ Output: Booth with borough, neighborhood, tags             │
└──────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════
                      ERROR HANDLING FLOW
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│ Try: Main Extraction Logic                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: Detection                                         │
│    └─→ If fails: Continue with 'unknown' page type         │
│                                                              │
│  Phase 2: Extraction                                        │
│    ├─→ Try specialized extractor                           │
│    └─→ If fails: Fallback to extractWithAI()               │
│                                                              │
│    extractAutophotoBoothLocator()                           │
│      ├─→ Try extractWixMapData()                           │
│      │     └─→ If empty: Use AI extraction                 │
│      └─→ If fails: Return errors                           │
│                                                              │
│    extractAutophotoMuseum()                                 │
│      ├─→ Always returns hardcoded museum booth             │
│      └─→ + AI extraction for extras                        │
│                                                              │
│  Phase 3-5: Always execute                                  │
│    └─→ Validation, enrichment, results                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                     Catch: Error
                          │
                          ▼
              ┌─────────────────────┐
              │ Error Recovery      │
              ├─────────────────────┤
              │ 1. Log error        │
              │ 2. Add to errors[]  │
              │ 3. Return:          │
              │    {                │
              │      booths: [],    │
              │      errors: [...]  │
              │    }                │
              └─────────────────────┘


═══════════════════════════════════════════════════════════════════════
                    INTEGRATION POINTS
═══════════════════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────────────┐
│ Crawler Index (index.ts)                                      │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Extractor Router │
                    └─────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────┐   ┌──────────────┐
       │photobooth│    │ autophoto│   │    other     │
       │   .net   │    │   .org   │   │  extractors  │
       └──────────┘    └──────────┘   └──────────────┘
              │               │               │
              │               ▼               │
              │    extractAutophoto          │
              │    Enhanced()                │
              │               │               │
              └───────────────┴───────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ AI Extraction    │
                    │ Engine           │
                    │ (Claude Sonnet)  │
                    └─────────┬────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Validation &     │
                    │ Deduplication    │
                    └─────────┬────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Supabase Insert  │
                    │ (booths table)   │
                    └──────────────────┘


═══════════════════════════════════════════════════════════════════════
                      FIELD MAPPING
═══════════════════════════════════════════════════════════════════════

Source Data                   →  Booth Field
─────────────                    ────────────

Venue name                    →  name
Street address                →  address
"New York" (default)          →  city
"NY" (default)                →  state
ZIP from address              →  postal_code
"United States" (default)     →  country

Map coordinates               →  latitude, longitude
Address keyword match         →  borough
Address/context               →  neighborhood

Description patterns          →  machine_model
Model keywords                →  machine_manufacturer
"analog" (default)            →  booth_type
"4-strip" (default)           →  photo_type
"black_and_white,color"       →  photo_format

Price patterns ($8)           →  cost
Hours patterns                →  hours
Venue context                 →  venue_type
Article text                  →  description

true (default)                →  is_verified
Current date                  →  last_verified_date
true (default)                →  is_operational
"active" (default)            →  status

Generated                     →  tags ['nyc', borough, 'analog']


═══════════════════════════════════════════════════════════════════════
                    QUALITY GATES
═══════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────┐
│ Validation Rules                                           │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Required Fields:                                          │
│    ✓ name must not be empty or "Unknown"                  │
│    ✓ address OR (latitude AND longitude)                  │
│    ✓ city must be present                                 │
│    ✓ country must be present                              │
│                                                             │
│  NYC-Specific:                                             │
│    ✓ state = "NY"                                         │
│    ✓ city = "New York"                                    │
│    ✓ borough must be one of 5                             │
│    ✓ postal_code matches NYC ZIP (100xx-114xx)            │
│                                                             │
│  Data Quality:                                             │
│    ✓ booth_type = "analog" (Autophoto specialization)     │
│    ✓ is_verified = true (recent source)                   │
│    ✓ source_name = "autophoto.org"                        │
│                                                             │
└────────────────────────────────────────────────────────────┘

Pass Rate Target: 85%+
Quality Score: 80%+
```

**Architecture Version:** 1.0
**Implementation Date:** 2025-11-27
**Pattern Reference:** extractPhotoboothNetEnhanced()
