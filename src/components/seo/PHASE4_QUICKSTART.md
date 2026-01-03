# Phase 4 Quick Start Guide

Get started with Featured Snippets components in 5 minutes.

## Installation

All Phase 4 components are already installed in `src/components/seo/`.

## Quick Examples

### 1. Add a Featured Answer (2 minutes)

```tsx
import { FeaturedAnswer } from '@/components/seo/FeaturedAnswer';

export default function MyPage() {
  return (
    <FeaturedAnswer
      variant="prominent"
      question="What is an analog photo booth?"
      answer="An analog photo booth is a self-service machine that uses traditional photochemical film and paper to create instant prints, producing authentic chemical photographs with unique grain and warmth."
    />
  );
}
```

### 2. Add an FAQ Section (3 minutes)

```tsx
import { FeaturedAnswerList } from '@/components/seo/FeaturedAnswer';

const faqItems = [
  {
    id: 'q1',
    question: 'How much do photo booths cost?',
    answer: 'Most analog photo booths cost between €2-6 per session, producing 4-6 photos in a strip format.'
  },
  {
    id: 'q2',
    question: 'How long do photos take?',
    answer: 'Photos typically take 3-5 minutes to develop after your session.'
  }
];

export default function FAQPage() {
  return <FeaturedAnswerList items={faqItems} />;
}
```

### 3. Add a Comparison Table (5 minutes)

```tsx
import { ComparisonTable } from '@/components/seo/ComparisonTable';

export default function ComparisonPage() {
  return (
    <ComparisonTable
      title="Photo Booth Types"
      items={[
        {
          name: "Analog",
          recommended: true,
          badge: "Most Authentic",
          features: {
            authentic: true,
            cost: "€2-4",
            quality: "Excellent"
          }
        },
        {
          name: "Digital",
          features: {
            authentic: false,
            cost: "€5-8",
            quality: "Good"
          }
        }
      ]}
      features={[
        { key: 'authentic', label: 'Authentic Prints' },
        { key: 'cost', label: 'Cost' },
        { key: 'quality', label: 'Quality' }
      ]}
    />
  );
}
```

### 4. Add a Glossary (5 minutes)

```tsx
import { DefinitionList } from '@/components/seo/DefinitionList';

export default function GlossaryPage() {
  return (
    <DefinitionList
      title="Photo Booth Glossary"
      terms={[
        {
          term: "Photo Strip",
          definition: "A vertical strip of 4-6 photos produced in a single session."
        },
        {
          term: "Chemical Process",
          definition: "Traditional photographic development using chemical reactions."
        }
      ]}
      variant="cards"
    />
  );
}
```

## Add Schema Markup

```tsx
import Script from 'next/script';
import { generateHowToSchema, generateBreadcrumbSchema } from '@/lib/schema-utils';

export default function GuidePage() {
  const howToSchema = generateHowToSchema({
    name: "How to Find Photo Booths",
    steps: [
      { name: "Check train stations", text: "Start at major stations..." },
      { name: "Visit neighborhoods", text: "Explore local areas..." }
    ]
  });

  return (
    <>
      <Script
        id="howto-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      {/* Your content */}
    </>
  );
}
```

## Complete Example

See `src/app/guides/berlin/page.tsx` for a complete guide page using all Phase 4 components.

## Testing

1. **Build test:**
   ```bash
   npm run build
   ```

2. **Rich results test:**
   Visit [Google Rich Results Test](https://search.google.com/test/rich-results)

3. **Schema validation:**
   Visit [Schema.org Validator](https://validator.schema.org/)

## Common Issues

### TypeScript Errors

If you see TypeScript errors, ensure you have the latest types:
```bash
npm install --save-dev @types/react @types/node
```

### Schema Not Showing

Make sure you're using `Script` from `next/script`:
```tsx
import Script from 'next/script';
```

### Missing Icons

Install lucide-react if not already installed:
```bash
npm install lucide-react
```

## Full Documentation

See `PHASE4_COMPONENTS.md` for complete documentation.

## Support

- Implementation Plan: `docs/AI_SEO_IMPLEMENTATION_PLAN.md`
- Phase 3 Components: `src/components/seo/COMPONENT_STRUCTURE.md`
- Example: `src/app/guides/berlin/page.tsx`
