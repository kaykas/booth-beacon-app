# Knowledge Graph Schemas - Quick Reference

Copy-paste code snippets for immediate implementation.

## File Location
```
/Users/jkw/Projects/booth-beacon-app/src/lib/knowledge-graph-schemas.ts
```

## Quick Imports

```typescript
import {
  // Main schema generators
  generatePhotoBoothGlossary,
  generateEnhancedOrganizationSchema,
  generateBoothBeaconOrganizationSchema,
  generatePlaceSchema,
  generateBoothTouristAttractionSchema,

  // Convenience functions
  generateBoothPageSchemas,
  generateHomepageSchemas,

  // Utility
  injectStructuredData,

  // Types
  type StructuredData,
  type OrganizationConfig,
  type PlaceConfig,
} from '@/lib/knowledge-graph-schemas';
```

## Homepage Implementation

```typescript
// In /src/app/page.tsx
import { generateHomepageSchemas, injectStructuredData } from '@/lib/knowledge-graph-schemas';

export default async function HomePage() {
  const schemas = generateHomepageSchemas();

  return (
    <html>
      <head>
        {schemas.map((schema, index) => (
          <script
            key={`schema-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: injectStructuredData(schema) }}
          />
        ))}
      </head>
      <body>
        {/* Your content */}
      </body>
    </html>
  );
}
```

## Booth Detail Page Implementation

```typescript
// In /src/app/booth/[slug]/page.tsx
import { generateBoothPageSchemas, injectStructuredData } from '@/lib/knowledge-graph-schemas';
import { normalizeBooth } from '@/lib/boothViewModel';

export default async function BoothPage({ params }: { params: { slug: string } }) {
  // Fetch booth
  const { data: booth } = await supabase
    .from('booths')
    .select('*')
    .eq('slug', params.slug)
    .single();

  const renderableBooth = normalizeBooth(booth);

  if (!renderableBooth) {
    notFound();
  }

  const schemas = generateBoothPageSchemas(renderableBooth);

  return (
    <html>
      <head>
        {schemas.map((schema, index) => (
          <script
            key={`schema-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: injectStructuredData(schema) }}
          />
        ))}
      </head>
      <body>
        {/* Your booth content */}
      </body>
    </html>
  );
}
```

## Individual Schemas

### Organization Only

```typescript
import { generateBoothBeaconOrganizationSchema, injectStructuredData } from '@/lib/knowledge-graph-schemas';

const orgSchema = generateBoothBeaconOrganizationSchema();

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: injectStructuredData(orgSchema) }}
/>
```

### Glossary Only

```typescript
import { generatePhotoBoothGlossary, injectStructuredData } from '@/lib/knowledge-graph-schemas';

const glossarySchema = generatePhotoBoothGlossary();

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: injectStructuredData(glossarySchema) }}
/>
```

### Place Only

```typescript
import { generatePlaceSchema, injectStructuredData } from '@/lib/knowledge-graph-schemas';

const placeSchema = generatePlaceSchema({ booth });

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: injectStructuredData(placeSchema) }}
/>
```

## With Optional Fields

```typescript
const placeSchema = generatePlaceSchema({
  booth,
  openingHours: 'Mo-Su 09:00-22:00',
  priceRange: '$5-10',
  amenityFeature: [
    { name: 'Film Type', value: 'Kodak Professional' },
    { name: 'Processing Time', value: '90 seconds' },
  ],
});
```

## Testing

### Quick Test Script

```bash
# Build and check for errors
npm run build

# Run type check
npx tsc --noEmit
```

### Browser Console Test

```javascript
// Paste in browser console to view schemas
document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
  console.log(JSON.parse(script.textContent));
});
```

### Online Validators

1. **Google Rich Results Test**
   ```
   https://search.google.com/test/rich-results
   ```

2. **Schema.org Validator**
   ```
   https://validator.schema.org/
   ```

## What Gets Generated

### Homepage (3 schemas)
1. Enhanced Organization (with founder, expertise)
2. Photo Booth Glossary (15 terms)
3. WebSite (with search action)

### Booth Page (2 schemas)
1. Place (location, hours, pricing, ratings)
2. Tourist Attraction (experience, tourist types)

## Schema Sizes

- Organization: ~2KB
- Glossary: ~8KB
- Place: ~3-5KB
- Total Homepage: ~15KB
- Total Booth Page: ~5-8KB

## Export List

```typescript
// Schema Generators
generatePhotoBoothGlossary()                    // Returns: StructuredData
generateEnhancedOrganizationSchema(config)      // Returns: StructuredData
generateBoothBeaconOrganizationSchema()         // Returns: StructuredData
generatePlaceSchema(config)                     // Returns: StructuredData
generateBoothTouristAttractionSchema(booth)     // Returns: StructuredData

// Convenience Functions
generateBoothPageSchemas(booth)                 // Returns: StructuredData[]
generateHomepageSchemas()                       // Returns: StructuredData[]

// Utility
injectStructuredData(schema)                    // Returns: string (JSON)
```

## Common Patterns

### Server Component

```typescript
export default async function Page() {
  const schemas = generateHomepageSchemas();

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: injectStructuredData(schema) }}
        />
      ))}
      <main>{/* content */}</main>
    </>
  );
}
```

### With Next.js Metadata

```typescript
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const schemas = generateHomepageSchemas();

  return {
    title: 'Booth Beacon',
    description: 'Photo booth directory',
    other: {
      'script:ld+json': schemas.map(s => JSON.stringify(s)),
    },
  };
}
```

### Dynamic Generation

```typescript
export default async function BoothPage({ params }) {
  const booth = await fetchBooth(params.slug);
  const normalized = normalizeBooth(booth);

  if (!normalized) return <NotFound />;

  const schemas = generateBoothPageSchemas(normalized);

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: injectStructuredData(s) }}
        />
      ))}
      <BoothDetails booth={normalized} />
    </>
  );
}
```

## Troubleshooting

### Schema Not Showing
```typescript
// Check script tag format
<script type="application/ld+json">  {/* Correct */}
<script type="text/json">            {/* Wrong */}
```

### Invalid JSON
```typescript
// Always use injectStructuredData()
dangerouslySetInnerHTML={{ __html: injectStructuredData(schema) }}  // Correct
dangerouslySetInnerHTML={{ __html: schema }}                        // Wrong
```

### Missing Required Fields
```typescript
// Check booth has required data
const booth = normalizeBooth(rawBooth);  // Normalizes and validates
if (!booth) return null;                  // Handle invalid data
```

## TypeScript Tips

### Type-safe Configuration

```typescript
import type { OrganizationConfig } from '@/lib/knowledge-graph-schemas';

const config: OrganizationConfig = {
  name: 'My Company',
  description: 'Description',
  url: 'https://example.com',
  // TypeScript ensures all required fields present
};
```

### Type Guard for Schemas

```typescript
import type { StructuredData } from '@/lib/knowledge-graph-schemas';

function isValidSchema(data: unknown): data is StructuredData {
  return (
    typeof data === 'object' &&
    data !== null &&
    '@context' in data &&
    '@type' in data
  );
}
```

## Performance Tips

### Cache Schemas

```typescript
// Cache at module level for static schemas
export const cachedHomepageSchemas = generateHomepageSchemas();

// Use in component
export default function HomePage() {
  const schemas = cachedHomepageSchemas;
  // ...
}
```

### Lazy Load

```typescript
// Only generate when needed
const schemas = useMemo(() =>
  booth ? generateBoothPageSchemas(booth) : [],
  [booth]
);
```

## Implementation Checklist

- [ ] Copy code snippets above
- [ ] Add to homepage (`/src/app/page.tsx`)
- [ ] Add to booth pages (`/src/app/booth/[slug]/page.tsx`)
- [ ] Test with Google Rich Results Test
- [ ] Validate with Schema.org validator
- [ ] Check browser console for JSON-LD
- [ ] Deploy to production
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor Search Console for rich results

## Links

- **Full Usage Guide:** `/docs/KNOWLEDGE_GRAPH_USAGE.md`
- **Implementation Summary:** `/docs/KNOWLEDGE_GRAPH_IMPLEMENTATION_SUMMARY.md`
- **AI SEO Playbook:** `~/.claude/AI_SEO_PLAYBOOK.md`

---

**Pro Tip:** Start with homepage implementation first, test thoroughly, then roll out to booth pages.
