# Phase 4 Components - Quick Reference

## What's New

Phase 4 adds three featured snippet components optimized for Google search:

1. **FeaturedAnswer** - Q&A optimized for answer boxes
2. **ComparisonTable** - Feature comparison tables
3. **DefinitionList** - Glossary and definitions

## Quick Import

```tsx
// Components
import { FeaturedAnswer, FeaturedAnswerList } from '@/components/seo/FeaturedAnswer';
import { ComparisonTable } from '@/components/seo/ComparisonTable';
import { DefinitionList } from '@/components/seo/DefinitionList';

// Schema utilities
import {
  generateFAQPageSchema,
  generateHowToSchema,
  generateBreadcrumbSchema,
  generateArticleSchema
} from '@/lib/schema-utils';
```

## When to Use Each Component

### FeaturedAnswer
Use when you want to answer a specific question directly:
- FAQ sections
- Guide introductions
- Help documentation
- Product information

**Best for:** Google answer boxes, voice search, "People Also Ask"

### ComparisonTable
Use when comparing features, products, or options:
- Booth type comparisons
- Pricing tiers
- Feature availability
- Product specifications

**Best for:** Google comparison snippets, decision-making

### DefinitionList
Use for terminology and glossary content:
- Technical terms
- Industry jargon
- Key concepts
- Educational content

**Best for:** Google definition snippets, knowledge panels

## 30-Second Examples

### 1. Add an FAQ Section

```tsx
import { FeaturedAnswerList } from '@/components/seo/FeaturedAnswer';

<FeaturedAnswerList
  items={[
    {
      id: 'q1',
      question: 'Your question here?',
      answer: 'Your 40-60 word answer here.'
    }
  ]}
/>
```

### 2. Add a Comparison

```tsx
import { ComparisonTable } from '@/components/seo/ComparisonTable';

<ComparisonTable
  title="Compare Options"
  items={[{ name: "Option A", features: { feature1: true } }]}
  features={[{ key: 'feature1', label: 'Feature 1' }]}
/>
```

### 3. Add a Glossary

```tsx
import { DefinitionList } from '@/components/seo/DefinitionList';

<DefinitionList
  title="Key Terms"
  terms={[
    { term: "Term", definition: "Definition here." }
  ]}
/>
```

## Complete Example

See `/src/app/guides/berlin/page.tsx` for a full implementation using all Phase 4 components.

## Documentation

- **Complete Docs:** `PHASE4_COMPONENTS.md`
- **Quick Start:** `PHASE4_QUICKSTART.md`
- **Implementation Summary:** `/PHASE4_IMPLEMENTATION_COMPLETE.md`

## Schema Utilities

Generate structured data in seconds:

```tsx
import Script from 'next/script';
import { generateHowToSchema } from '@/lib/schema-utils';

const schema = generateHowToSchema({
  name: "How to...",
  steps: [
    { name: "Step 1", text: "Do this..." }
  ]
});

<Script
  id="howto-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
/>
```

## Build Status

✅ All components build successfully
✅ Zero TypeScript errors
✅ Production-ready

## Testing

```bash
# Build test
npm run build

# Development
npm run dev
# Visit: http://localhost:3000/guides/berlin

# Schema validation
# https://search.google.com/test/rich-results
# https://validator.schema.org/
```

## Support

Questions? Check the full documentation:
- `PHASE4_COMPONENTS.md` - Complete guide
- `PHASE4_QUICKSTART.md` - 5-minute start
- `docs/AI_SEO_IMPLEMENTATION_PLAN.md` - Overall strategy
