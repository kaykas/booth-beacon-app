# Knowledge Graph Schemas Usage Guide

This guide shows how to use the knowledge graph schemas from `/src/lib/knowledge-graph-schemas.ts` to enhance SEO and AI discovery.

## Overview

The knowledge graph schemas provide three main schema types:

1. **DefinedTermSet** - Photo booth terminology glossary
2. **Enhanced Organization** - Organization with founder/expertise signals
3. **Place Schema** - Individual booth locations with geo data

## Installation

The schemas are already created at:
```
/Users/jkw/Projects/booth-beacon-app/src/lib/knowledge-graph-schemas.ts
```

## Quick Start

### Homepage Implementation

Add to `/src/app/page.tsx`:

```typescript
import { generateHomepageSchemas, injectStructuredData } from '@/lib/knowledge-graph-schemas';

export default async function HomePage() {
  const schemas = generateHomepageSchemas();

  return (
    <>
      {/* Add schemas to <head> */}
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: injectStructuredData(schema) }}
        />
      ))}

      {/* Your existing homepage content */}
      <main>
        {/* ... */}
      </main>
    </>
  );
}
```

### Booth Detail Page Implementation

Add to `/src/app/booth/[slug]/page.tsx`:

```typescript
import { generateBoothPageSchemas, injectStructuredData } from '@/lib/knowledge-graph-schemas';
import { normalizeBooth } from '@/lib/boothViewModel';

export default async function BoothPage({ params }: { params: { slug: string } }) {
  // Fetch booth data
  const booth = await fetchBoothBySlug(params.slug);
  const renderableBooth = normalizeBooth(booth);

  if (!renderableBooth) {
    return <NotFound />;
  }

  // Generate schemas for this booth
  const schemas = generateBoothPageSchemas(renderableBooth);

  return (
    <>
      {/* Add schemas to <head> */}
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: injectStructuredData(schema) }}
        />
      ))}

      {/* Your existing booth detail content */}
      <main>
        {/* ... */}
      </main>
    </>
  );
}
```

## Individual Schema Examples

### 1. Photo Booth Glossary

The glossary schema helps AI systems understand photo booth terminology:

```typescript
import { generatePhotoBoothGlossary, injectStructuredData } from '@/lib/knowledge-graph-schemas';

// In a glossary page or homepage
const glossarySchema = generatePhotoBoothGlossary();

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: injectStructuredData(glossarySchema) }}
/>
```

**What it includes:**
- Analog photo booth
- Photochemical process
- Photo strip
- Vintage booth
- Film processing
- Black and white photography
- Photo paper
- Chemical booth
- Instant photo booth
- Machine model
- Booth operator
- Photo booth curtain
- Coin-operated booth
- Booth restoration
- Photomaton

Each term includes:
- Name and description
- URL for the term
- Related terms/concepts

### 2. Enhanced Organization Schema

Shows expertise and founder information:

```typescript
import { generateBoothBeaconOrganizationSchema, injectStructuredData } from '@/lib/knowledge-graph-schemas';

// In homepage or about page
const orgSchema = generateBoothBeaconOrganizationSchema();

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: injectStructuredData(orgSchema) }}
/>
```

**What it includes:**
- Organization name, description, URL
- Founder information with credentials
- Areas of expertise
- Knowledge base reference
- Social media profiles
- Contact information

**E-E-A-T Benefits:**
- Experience: Founder's expertise and credentials
- Expertise: Listed specializations
- Authoritativeness: Knowledge base reference
- Trust: Contact information and social profiles

### 3. Place Schema for Individual Booths

Creates rich location data for each booth:

```typescript
import { generatePlaceSchema, injectStructuredData } from '@/lib/knowledge-graph-schemas';
import { normalizeBooth } from '@/lib/boothViewModel';

const booth = normalizeBooth(boothData);

const placeSchema = generatePlaceSchema({
  booth,
  openingHours: 'Mo-Su 09:00-22:00', // Optional
  priceRange: '$5-10', // Optional
  amenityFeature: [ // Optional custom features
    {
      name: 'Film Type',
      value: 'Kodak Professional',
    },
  ],
});

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: injectStructuredData(placeSchema) }}
/>
```

**What it includes:**
- Booth name, description, URL
- Full address with postal code
- Geo coordinates (latitude/longitude)
- Contact information (phone, website)
- Opening hours and pricing
- Aggregate ratings (from Google)
- Amenity features:
  - Booth type (analog, chemical, digital, instant)
  - Photo type (black-and-white, color, both)
  - Payment methods (cash, card)
  - Machine model and manufacturer
  - Machine year
- Parent organization link
- Public access status
- Last verification date

### 4. Tourist Attraction Schema

Promotes booths as photography destinations:

```typescript
import { generateBoothTouristAttractionSchema, injectStructuredData } from '@/lib/knowledge-graph-schemas';

const touristSchema = generateBoothTouristAttractionSchema(booth);

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: injectStructuredData(touristSchema) }}
/>
```

**What it includes:**
- All Place schema fields
- Tourist types (Photographer, Vintage Enthusiast, etc.)
- Accessibility information
- Experience description

## Advanced Usage

### Custom Organization Schema

Create a custom organization schema:

```typescript
import { generateEnhancedOrganizationSchema, injectStructuredData } from '@/lib/knowledge-graph-schemas';

const customOrgSchema = generateEnhancedOrganizationSchema({
  name: 'My Photo Booth Company',
  description: 'Vintage photo booth operator in San Francisco',
  url: 'https://example.com',
  logo: 'https://example.com/logo.png',
  foundingDate: '2020',
  founder: {
    name: 'Jane Doe',
    jobTitle: 'Founder & Chief Photo Enthusiast',
    credentials: [
      'Bachelor of Fine Arts in Photography',
      'Certified Photo Booth Technician',
    ],
    expertise: [
      'Analog Photography',
      'Photo Booth Restoration',
      'Film Processing',
    ],
    bio: '15+ years experience in analog photography and vintage machine restoration.',
    sameAs: [
      'https://twitter.com/janedoe',
      'https://linkedin.com/in/janedoe',
    ],
  },
  expertise: [
    'Photo Booth Operations',
    'Event Photography',
    'Vintage Machine Maintenance',
  ],
  knowledgeBase: {
    name: 'Photo Booth Gallery',
    description: 'Collection of restored vintage photo booths',
    url: 'https://example.com/booths',
  },
  sameAs: [
    'https://instagram.com/mycompany',
    'https://facebook.com/mycompany',
  ],
  contactPoint: {
    contactType: 'Customer Service',
    email: 'hello@example.com',
    telephone: '+1-555-123-4567',
  },
});

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: injectStructuredData(customOrgSchema) }}
/>
```

### Custom Place Schema with Extra Features

```typescript
import { generatePlaceSchema, injectStructuredData } from '@/lib/knowledge-graph-schemas';

const placeSchema = generatePlaceSchema({
  booth,
  openingHours: 'Mo-Fr 10:00-18:00, Sa 10:00-20:00, Su 12:00-18:00',
  priceRange: '$8',
  amenityFeature: [
    {
      name: 'Film Stock',
      value: 'Kodak Professional BW400CN',
    },
    {
      name: 'Processing Time',
      value: '90 seconds',
    },
    {
      name: 'Vintage Year',
      value: 1962,
    },
    {
      name: 'Recently Restored',
      value: true,
    },
    {
      name: 'Wheelchair Accessible',
      value: true,
    },
  ],
});
```

## Integration with Next.js Metadata API

For Next.js 13+ with App Router:

```typescript
import { Metadata } from 'next';
import { generateBoothPageSchemas } from '@/lib/knowledge-graph-schemas';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const booth = await fetchBoothBySlug(params.slug);
  const renderableBooth = normalizeBooth(booth);

  if (!renderableBooth) {
    return {};
  }

  const schemas = generateBoothPageSchemas(renderableBooth);

  return {
    title: `${renderableBooth.name} - Analog Photo Booth`,
    description: renderableBooth.description || `Analog photo booth in ${renderableBooth.city}`,
    // Add schemas to the page
    other: {
      'script:ld+json': schemas.map((schema) => JSON.stringify(schema)),
    },
  };
}
```

## Testing & Validation

### 1. Google Rich Results Test

Test your structured data:
1. Go to https://search.google.com/test/rich-results
2. Enter your page URL or paste HTML
3. Check for errors/warnings

### 2. Schema.org Validator

Validate schema syntax:
1. Go to https://validator.schema.org/
2. Paste your JSON-LD or URL
3. Review validation results

### 3. Manual Inspection

View schemas in browser:
```javascript
// In browser console
document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
  console.log(JSON.parse(script.textContent));
});
```

## Benefits for SEO & AI

### 1. Featured Snippets

The glossary helps Google understand terminology and may lead to featured snippet captures.

### 2. Knowledge Panel

Enhanced Organization schema can contribute to Google Knowledge Panel information.

### 3. Local Search

Place schemas with geo coordinates improve local search visibility.

### 4. AI Citation

Clear terminology and entity relationships help AI models (ChatGPT, Claude, Perplexity) cite your site accurately.

### 5. Rich Results

Schemas enable rich results in search:
- Star ratings
- Location information
- Opening hours
- Price information

## Performance Considerations

### Size Impact

Each schema adds ~2-5KB to page size. The complete homepage implementation adds ~15KB total.

**Recommendation:** This is acceptable for the SEO benefits.

### Caching

Schemas are static and can be cached:
```typescript
// Cache schemas at build time
export const schemas = generateHomepageSchemas();
```

### Server-Side Generation

Generate schemas server-side to avoid client bundle size:
```typescript
// In server component
const schemas = generateHomepageSchemas();
// Render directly in HTML
```

## Migration Path

### Phase 1: Homepage (Week 1)
- [ ] Add `generateHomepageSchemas()` to homepage
- [ ] Test with Google Rich Results Test
- [ ] Validate with Schema.org validator

### Phase 2: Booth Detail Pages (Week 1-2)
- [ ] Add `generateBoothPageSchemas()` to booth detail pages
- [ ] Test sample pages
- [ ] Monitor Google Search Console

### Phase 3: City/Location Pages (Week 2-3)
- [ ] Add Collection/Place schemas to city pages
- [ ] Enhance with tourist destination schemas
- [ ] Test local search visibility

### Phase 4: Monitoring (Ongoing)
- [ ] Track featured snippet captures
- [ ] Monitor rich result performance
- [ ] Watch for AI citations
- [ ] Review Google Search Console reports

## Troubleshooting

### Schema Not Appearing

Check that:
1. Script tag has `type="application/ld+json"`
2. JSON is valid (use JSON.stringify)
3. Script is in `<head>` or `<body>`

### Validation Errors

Common issues:
1. Missing required fields (name, url, description)
2. Invalid URL format (must start with http/https)
3. Invalid date format (use ISO 8601)
4. Invalid enum values (check Schema.org docs)

### Not Showing in Search

Wait time:
- Initial indexing: 1-2 weeks
- Rich results: 2-4 weeks
- Knowledge panel: 1-3 months

Accelerate:
1. Submit sitemap to Google Search Console
2. Request indexing for priority pages
3. Build backlinks to important pages

## Additional Resources

- [Schema.org Documentation](https://schema.org/)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [AI SEO Playbook](~/.claude/AI_SEO_PLAYBOOK.md)
- [Booth Beacon SEO Summary](./SEO_SUMMARY.md)

## Questions?

For issues or questions about the knowledge graph schemas:
1. Check this documentation
2. Review the AI SEO Playbook
3. Test with validators
4. Consult Schema.org documentation

---

**Last Updated:** 2026-01-02
**Version:** 1.0
