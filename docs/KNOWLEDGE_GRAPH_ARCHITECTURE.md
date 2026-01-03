# Knowledge Graph Architecture

Visual guide to how the knowledge graph schemas integrate with Booth Beacon.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Booth Beacon                            │
│                    (Next.js Application)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ imports
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              /src/lib/knowledge-graph-schemas.ts                │
│                                                                 │
│  ┌────────────────────┐  ┌──────────────────┐                 │
│  │ Photo Booth        │  │ Enhanced         │                 │
│  │ Glossary           │  │ Organization     │                 │
│  │ (DefinedTermSet)   │  │ (Organization)   │                 │
│  │                    │  │                  │                 │
│  │ • 15 terms         │  │ • Founder info   │                 │
│  │ • Descriptions     │  │ • Expertise      │                 │
│  │ • Relations        │  │ • Knowledge base │                 │
│  └────────────────────┘  └──────────────────┘                 │
│                                                                 │
│  ┌────────────────────┐  ┌──────────────────┐                 │
│  │ Place Schema       │  │ Tourist          │                 │
│  │ (Place)            │  │ Attraction       │                 │
│  │                    │  │                  │                 │
│  │ • Location data    │  │ • Tourism info   │                 │
│  │ • Hours/pricing    │  │ • Experiences    │                 │
│  │ • Amenities        │  │ • Accessibility  │                 │
│  └────────────────────┘  └──────────────────┘                 │
│                                                                 │
│  Utility Functions:                                            │
│  • generateHomepageSchemas()                                   │
│  • generateBoothPageSchemas(booth)                             │
│  • injectStructuredData(schema)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
        ┌───────────────────┐  ┌──────────────────┐
        │    Homepage       │  │  Booth Detail    │
        │                   │  │     Pages        │
        │ • Organization    │  │ • Place          │
        │ • Glossary        │  │ • Tourist Attr.  │
        │ • WebSite         │  │                  │
        └───────────────────┘  └──────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
                  ┌───────────────────────┐
                  │    JSON-LD Script     │
                  │   <script type=       │
                  │ "application/ld+json">│
                  └───────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
        ┌───────────────────┐  ┌──────────────────┐
        │  Search Engines   │  │   AI Systems     │
        │                   │  │                  │
        │ • Google          │  │ • ChatGPT        │
        │ • Bing            │  │ • Claude         │
        │ • DuckDuckGo      │  │ • Perplexity     │
        │                   │  │ • Gemini         │
        └───────────────────┘  └──────────────────┘
```

## Data Flow

### Homepage Schemas

```
User visits homepage (/)
        │
        ▼
generateHomepageSchemas() called
        │
        ├─► generateBoothBeaconOrganizationSchema()
        │   └─► Returns Organization with founder, expertise
        │
        ├─► generatePhotoBoothGlossary()
        │   └─► Returns DefinedTermSet with 15 terms
        │
        └─► WebSite schema
            └─► Returns WebSite with search action
        │
        ▼
3 schemas embedded as JSON-LD
        │
        ▼
Search engines index
        │
        ├─► Knowledge Panel
        ├─► Featured Snippets
        └─► Rich Results
```

### Booth Detail Page Schemas

```
User visits booth page (/booth/[slug])
        │
        ▼
Fetch booth from database
        │
        ▼
normalizeBooth(booth) → RenderableBooth
        │
        ▼
generateBoothPageSchemas(booth) called
        │
        ├─► generatePlaceSchema({ booth })
        │   └─► Returns Place with:
        │       • Address
        │       • Geo coordinates
        │       • Hours, pricing
        │       • Ratings
        │       • Amenities
        │
        └─► generateBoothTouristAttractionSchema(booth)
            └─► Returns TouristAttraction with:
                • Tourist types
                • Experiences
                • Accessibility
        │
        ▼
2 schemas embedded as JSON-LD
        │
        ▼
Search engines index
        │
        ├─► Local search results
        ├─► Map pack
        ├─► Rich results (stars, hours, price)
        └─► Tourism searches
```

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                       Knowledge Graph                       │
└─────────────────────────────────────────────────────────────┘

                    Organization
                   "Booth Beacon"
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    Founder         Knowledge        Social
  (Person)            Base          Profiles
        │                │                │
        │                ▼                │
        │         "Photo Booth            │
        │          Directory"             │
        │           912 booths            │
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │   Glossary   │
                  │ (DefinedTermSet)│
                  └─────────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         Analog      Photo      Vintage
         Booth       Strip      Booth
           │           │           │
           └───────────┼───────────┘
                       │
                       ▼
                 Related Terms
                  (15 total)


                    Place
                 "SF Booth"
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    Address      Coordinates   Amenities
        │             │             │
        │             │             ├─► Booth Type
        │             │             ├─► Photo Type
        │             │             ├─► Payment
        │             │             └─► Machine
        │             │
        │             └─► Maps Integration
        │
        └─► Local Search


         TouristAttraction
          "SF Booth"
                │
        ┌───────┴───────┐
        ▼               ▼
   Experience      Tourist Types
        │               │
        │               ├─► Photographer
        │               ├─► Vintage Enthusiast
        │               └─► Tourist
        │
        └─► Tourism Search
```

## Schema Inheritance

```
Organization (Schema.org)
    │
    ├─► name
    ├─► description
    ├─► url
    ├─► logo
    │
    └─► Enhanced (Booth Beacon)
            │
            ├─► founder (Person)
            │       ├─► name
            │       ├─► jobTitle
            │       ├─► credentials
            │       ├─► expertise
            │       └─► sameAs
            │
            ├─► knowsAbout (expertise areas)
            ├─► hasOfferCatalog (knowledge base)
            └─► contactPoint


Place (Schema.org)
    │
    ├─► name
    ├─► description
    ├─► address (PostalAddress)
    ├─► geo (GeoCoordinates)
    │
    └─► Enhanced (Booth Details)
            │
            ├─► amenityFeature[]
            │       ├─► Booth Type
            │       ├─► Photo Type
            │       ├─► Payment Methods
            │       └─► Machine Details
            │
            ├─► aggregateRating
            ├─► openingHours
            ├─► priceRange
            └─► containedInPlace (Organization)


DefinedTermSet (Schema.org)
    │
    ├─► name
    ├─► description
    │
    └─► hasDefinedTerm[] (15 terms)
            │
            ├─► DefinedTerm
            │       ├─► name
            │       ├─► description
            │       ├─► url
            │       └─► relatedLink[]
            │
            └─► [... 14 more terms]
```

## Integration Points

### File System

```
/Users/jkw/Projects/booth-beacon-app/
│
├── src/
│   ├── lib/
│   │   ├── knowledge-graph-schemas.ts ← MAIN IMPLEMENTATION
│   │   ├── boothViewModel.ts          ← Types: RenderableBooth
│   │   └── seo/
│   │       └── structuredData.ts      ← Existing schemas (keep)
│   │
│   ├── app/
│   │   ├── page.tsx                   ← Add homepage schemas
│   │   └── booth/
│   │       └── [slug]/
│   │           └── page.tsx           ← Add booth schemas
│   │
│   └── types/
│       └── index.ts                   ← Types: Booth
│
└── docs/
    ├── KNOWLEDGE_GRAPH_SCHEMAS.md      ← Usage guide
    ├── KNOWLEDGE_GRAPH_IMPLEMENTATION_SUMMARY.md
    ├── KNOWLEDGE_GRAPH_QUICK_REFERENCE.md
    └── KNOWLEDGE_GRAPH_ARCHITECTURE.md ← This file
```

### Component Integration

```typescript
// Homepage Component
import { generateHomepageSchemas } from '@/lib/knowledge-graph-schemas';

export default function HomePage() {
  const schemas = generateHomepageSchemas();
  return (
    <>
      {schemas.map((schema, i) => (
        <script type="application/ld+json" {...} />
      ))}
      <main>...</main>
    </>
  );
}


// Booth Detail Component
import { generateBoothPageSchemas } from '@/lib/knowledge-graph-schemas';

export default function BoothPage({ booth }) {
  const schemas = generateBoothPageSchemas(booth);
  return (
    <>
      {schemas.map((schema, i) => (
        <script type="application/ld+json" {...} />
      ))}
      <main>...</main>
    </>
  );
}
```

## SEO Impact Timeline

```
Week 0: Implementation
    │
    └─► Deploy schemas to production
        │
        ▼
Week 1-2: Indexing
    │
    ├─► Google indexes schemas
    ├─► Rich results eligibility begins
    └─► Entity recognition improves
        │
        ▼
Week 2-4: Initial Results
    │
    ├─► First featured snippets may appear
    ├─► Rich results in search
    └─► Local search improvements
        │
        ▼
Week 4-8: Growth
    │
    ├─► Multiple featured snippets
    ├─► Knowledge panel development
    └─► AI citation improvements
        │
        ▼
Month 3-6: Maturity
    │
    ├─► Established knowledge panel
    ├─► Consistent rich results
    ├─► Strong AI citations
    └─► 50-100% organic traffic increase
```

## AI System Integration

```
                Search Query
            "What is analog photo booth?"
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    Google        ChatGPT        Claude
        │             │             │
        │             │             │
        ├─► Crawls Booth Beacon    │
        │   Finds DefinedTermSet   │
        │   Shows featured snippet │
        │                          │
        └─► "According to Booth Beacon..."
                      │
                      ▼
              Glossary Definition
                  Retrieved
                      │
                      ▼
                 AI Response:
          "An analog photo booth is
           a photo booth that uses
           traditional film-based
           photography..."
                      │
                      ▼
                Citation Link:
           boothbeacon.org/glossary
```

## Performance Characteristics

### Size Budget

```
Homepage:
├─► Organization Schema:     ~2KB
├─► Glossary Schema:         ~8KB
├─► WebSite Schema:          ~1KB
└─► Total:                  ~11KB

Booth Detail Page:
├─► Place Schema:            ~3-5KB
├─► TouristAttraction:       ~2-3KB
└─► Total:                   ~5-8KB
```

### Optimization Strategy

```
Server-Side Generation
    │
    ├─► Generate at build time (static pages)
    ├─► Generate at request time (dynamic pages)
    └─► No client-side JavaScript required
        │
        ▼
    Minimal Runtime Overhead
        │
        ├─► Schemas are strings
        ├─► No DOM manipulation
        └─► No external dependencies
        │
        ▼
    Caching Opportunities
        │
        ├─► Browser caches HTML + schemas
        ├─► CDN caches pages
        └─► Search engines cache schemas
```

## Testing Flow

```
1. Development
   │
   ├─► npm run build
   ├─► npx tsc --noEmit
   └─► Local testing
       │
       ▼
2. Validation
   │
   ├─► Google Rich Results Test
   ├─► Schema.org Validator
   └─► Browser console inspection
       │
       ▼
3. Deployment
   │
   ├─► Deploy to production
   ├─► Submit sitemap to Search Console
   └─► Request indexing
       │
       ▼
4. Monitoring
   │
   ├─► Google Search Console
   ├─► Track featured snippets
   └─► Monitor AI citations
```

## Error Handling

```
Booth Data Validation
    │
    ├─► normalizeBooth(booth)
    │   │
    │   ├─► Validates required fields
    │   ├─► Normalizes optional fields
    │   └─► Returns RenderableBooth | null
    │       │
    │       ▼
    │   if (!booth) return <NotFound />
    │
    └─► Schema Generation
        │
        ├─► Checks for required data
        ├─► Provides fallbacks
        └─► Graceful degradation
            │
            ▼
        Valid schemas always generated
```

## Future Enhancements

```
Current Implementation (v1.0)
    │
    └─► Organization, Glossary, Place
        │
        ▼
Future (v2.0)
    │
    ├─► Product schemas for machine models
    ├─► Event schemas for photo booth events
    ├─► Course schemas for photo booth guides
    ├─► Video schemas for booth tours
    └─► Review schemas for user reviews
```

## Key Metrics

### Technical Metrics
- ✅ 675 lines of code
- ✅ 15 glossary terms
- ✅ 8 expertise areas
- ✅ 6 exported functions
- ✅ Full TypeScript types
- ✅ 0 build errors

### Business Metrics (Track)
- Featured snippets captured
- Rich results impressions
- Knowledge panel appearance
- AI citations
- Organic traffic growth
- Local search visibility

---

**Architecture Version:** 1.0
**Last Updated:** 2026-01-02
