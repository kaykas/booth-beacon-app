# Phase 4: Featured Snippets Components

Complete documentation for AI/SEO Phase 4 implementation, including FeaturedAnswer, ComparisonTable, and DefinitionList components optimized for Google Featured Snippets.

## Overview

Phase 4 components are designed to maximize visibility in Google's Featured Snippets, answer boxes, and AI search results. Each component includes:

- **Schema.org structured data** for rich snippets
- **Optimal content length** for featured snippets (40-60 words for answers)
- **data-ai attributes** for crawler visibility
- **Vintage amber/orange aesthetic** matching site theme
- **Responsive design** with mobile-first approach
- **Accessibility** (WCAG AA compliant)

## Components

### 1. FeaturedAnswer

**Purpose:** Display direct, concise answers to common questions optimized for featured snippets.

**File:** `src/components/seo/FeaturedAnswer.tsx`

**Key Features:**
- 40-60 word answer optimization with word count validation
- Three display variants: default, compact, prominent
- Schema.org Question/Answer markup
- FeaturedAnswerList component with FAQPage schema
- Visual indicators for optimal snippet length

**Usage:**

```tsx
import { FeaturedAnswer, FeaturedAnswerList } from '@/components/seo/FeaturedAnswer';

// Single prominent answer (hero section)
<FeaturedAnswer
  variant="prominent"
  question="What is an analog photo booth?"
  answer="An analog photo booth is a self-service machine that uses traditional photochemical film and paper to create instant prints. Unlike digital booths, analog booths produce authentic chemical photographs with unique characteristics, grain, and warmth that cannot be replicated digitally."
  details="The chemical development process takes 3-5 minutes and produces 4-6 photos in a classic strip format."
/>

// Compact inline Q&A
<FeaturedAnswer
  variant="compact"
  question="How much do photo booths cost?"
  answer="Most analog photo booths cost between €2-6 per session."
/>

// FAQ list with schema
<FeaturedAnswerList
  title="Frequently Asked Questions"
  items={[
    {
      id: 'q1',
      question: 'How long do photos take?',
      answer: 'Photos typically take 3-5 minutes to develop after your session.',
      details: 'Development time varies by machine type and temperature.'
    }
  ]}
/>
```

**Props:**

```typescript
interface FeaturedAnswerProps {
  question: string;                    // The question being answered
  answer: string;                      // 40-60 words ideal for snippets
  details?: string;                    // Optional elaboration
  relatedQuestions?: string[];         // Related Q&A IDs for schema
  variant?: 'default' | 'compact' | 'prominent';
  className?: string;
  showSchema?: boolean;                // Default: true
  id?: string;                         // For schema linking
}

interface FeaturedAnswerListProps {
  items: Array<{
    id: string;
    question: string;
    answer: string;
    details?: string;
  }>;
  title?: string;                      // Default: "Frequently Asked Questions"
  variant?: 'default' | 'compact' | 'prominent';
  className?: string;
  showFAQSchema?: boolean;             // Default: true (generates FAQPage schema)
}
```

**SEO Impact:**
- Targets Google Featured Snippets answer boxes
- FAQPage schema for "People Also Ask" sections
- Optimal for voice search queries
- Enhanced visibility in AI search results

---

### 2. ComparisonTable

**Purpose:** Feature comparison tables optimized for Google's comparison snippets.

**File:** `src/components/seo/ComparisonTable.tsx`

**Key Features:**
- Responsive design (table on desktop, cards on mobile)
- Visual indicators (✓, ✗, −) for features
- Highlighted recommended options with badges
- Schema.org Table markup
- Support for boolean, string, and numeric values
- Optional feature descriptions with tooltips

**Usage:**

```tsx
import { ComparisonTable } from '@/components/seo/ComparisonTable';

<ComparisonTable
  title="Photo Booth Types Comparison"
  subtitle="Compare features of different photo booth types"
  items={[
    {
      name: "Classic Analog",
      description: "Traditional chemical photo booths",
      recommended: true,
      badge: "Most Authentic",
      features: {
        authentic: true,
        instant: true,
        filters: false,
        cost: "€2-4",
        quality: "Excellent",
        digital: false,
      }
    },
    {
      name: "Digital Booth",
      features: {
        authentic: false,
        instant: true,
        filters: true,
        cost: "€5-8",
        quality: "Good",
        digital: true,
      }
    }
  ]}
  features={[
    {
      key: 'authentic',
      label: 'Authentic Chemical Prints',
      description: 'Uses real photochemical process'
    },
    { key: 'instant', label: 'Instant Results' },
    { key: 'filters', label: 'Digital Filters' },
    { key: 'cost', label: 'Typical Cost' },
    { key: 'quality', label: 'Print Quality' },
    { key: 'digital', label: 'Digital Copy Available' },
  ]}
/>
```

**Props:**

```typescript
interface ComparisonTableProps {
  title: string;
  subtitle?: string;
  items: ComparisonItem[];
  features: ComparisonFeature[];
  className?: string;
  showSchema?: boolean;                // Default: true
  variant?: 'default' | 'compact' | 'cards';
}

interface ComparisonItem {
  name: string;
  description?: string;
  features: Record<string, boolean | string | number>;
  recommended?: boolean;               // Highlights column
  badge?: string;                      // "Most Popular", "Best Value", etc.
}

interface ComparisonFeature {
  key: string;                         // Must match feature keys
  label: string;
  description?: string;                // Tooltip text
}
```

**SEO Impact:**
- Targets comparison featured snippets
- Table schema for structured data
- Mobile-optimized card layout
- Clear visual hierarchy for crawlers

---

### 3. DefinitionList

**Purpose:** Glossary and definition lists optimized for definition snippets.

**File:** `src/components/seo/DefinitionList.tsx`

**Key Features:**
- Semantic HTML (`<dl>`, `<dt>`, `<dd>`)
- Schema.org DefinedTerm and DefinedTermSet markup
- Search/filter functionality for large glossaries
- Alphabetical grouping with letter headers
- Collapsible detailed definitions
- Related terms linking
- Three display variants

**Usage:**

```tsx
import { DefinitionList } from '@/components/seo/DefinitionList';

<DefinitionList
  title="Photo Booth Glossary"
  subtitle="Essential terminology for analog photo booth enthusiasts"
  terms={[
    {
      term: "Analog Photo Booth",
      definition: "A self-service machine that uses traditional photochemical film and paper to create instant prints.",
      details: "Unlike digital booths, analog booths produce authentic chemical photographs with unique grain, tone, and warmth.",
      category: "Booth Types",
      relatedTerms: ["Chemical Process", "Photo Strip"],
      url: "/glossary/analog-photo-booth"
    },
    {
      term: "Photo Strip",
      definition: "A vertical strip of 4-6 photos produced by a photo booth in a single session.",
      category: "Formats"
    }
  ]}
  variant="cards"
  alphabetize={true}
  collapsible={true}
/>
```

**Props:**

```typescript
interface DefinitionListProps {
  title: string;
  subtitle?: string;
  terms: DefinitionTerm[];
  variant?: 'default' | 'cards' | 'compact';
  searchable?: boolean;                // Auto-enabled for 5+ terms
  alphabetize?: boolean;               // Default: true
  collapsible?: boolean;               // Default: false
  className?: string;
  showSchema?: boolean;                // Default: true
}

interface DefinitionTerm {
  term: string;
  definition: string;                  // Concise, 1-2 sentences
  details?: string;                    // Extended explanation
  relatedTerms?: string[];
  url?: string;                        // "Learn more" link
  category?: string;                   // For grouping
}
```

**SEO Impact:**
- Targets definition featured snippets
- DefinedTermSet schema for knowledge graphs
- Semantic HTML structure
- Search functionality for user engagement

---

## Schema Utilities

**File:** `src/lib/schema-utils.ts`

Utility functions for generating Schema.org structured data:

### Available Functions

```typescript
// FAQ Page Schema
generateFAQPageSchema(items: FAQItem[]): object

// HowTo Schema for step-by-step guides
generateHowToSchema({
  name: string,
  description?: string,
  steps: HowToStep[],
  totalTime?: string,      // ISO 8601 (e.g., "PT2H")
  estimatedCost?: { currency: string, value: string },
  supply?: HowToSupply[],
  tool?: HowToSupply[]
}): object

// Article Schema
generateArticleSchema({
  headline: string,
  description: string,
  author: string,
  datePublished: string,   // ISO 8601
  dateModified?: string,
  image?: string,
  url?: string
}): object

// Breadcrumb Schema
generateBreadcrumbSchema(items: BreadcrumbItem[]): object

// Place Schema (for booth locations)
generatePlaceSchema({
  name: string,
  description?: string,
  address: PostalAddress,
  latitude: number,
  longitude: number,
  url?: string,
  image?: string
}): object

// Organization Schema
generateOrganizationSchema({...}): object

// WebSite Schema with search action
generateWebSiteSchema({...}): object
```

### Usage Example

```tsx
import Script from 'next/script';
import { generateHowToSchema, generateBreadcrumbSchema } from '@/lib/schema-utils';

export default function GuidePage() {
  const howToSchema = generateHowToSchema({
    name: "How to Find Photo Booths in Berlin",
    steps: [
      { name: "Start at train stations", text: "Begin at Hauptbahnhof..." },
      { name: "Check neighborhoods", text: "Visit Kreuzberg..." }
    ]
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://boothbeacon.org" },
    { name: "Guides", url: "https://boothbeacon.org/guides" },
    { name: "Berlin", url: "https://boothbeacon.org/guides/berlin" }
  ]);

  return (
    <>
      <Script
        id="howto-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Page content */}
    </>
  );
}
```

---

## Example Guide Page

**File:** `src/app/guides/berlin/page.tsx`

Complete implementation demonstrating all Phase 4 components:

- **HowTo Schema** for step-by-step instructions
- **Article Schema** for the guide content
- **Breadcrumb Schema** for navigation
- **FeaturedAnswer (prominent)** for hero Q&A
- **FeaturedAnswerList** with FAQPage schema
- **ComparisonTable** for booth types
- **DefinitionList** for glossary terms
- **AuthorBio** and **TrustSignals** for E-E-A-T

Visit `/guides/berlin` to see the full implementation.

---

## Best Practices

### Answer Length Optimization

For FeaturedAnswer components:
- **40-60 words** is optimal for featured snippets
- Component validates word count and shows warnings
- Keep answers direct and complete
- Use `details` prop for elaboration

### Schema Implementation

1. **Use one schema per page type:**
   - FAQ pages: FAQPage schema
   - Guides: HowTo + Article schema
   - All pages: Breadcrumb schema

2. **Ensure unique IDs:**
   ```tsx
   <FeaturedAnswer id="unique-q1" ... />
   ```

3. **Test schemas:**
   - [Google Rich Results Test](https://search.google.com/test/rich-results)
   - [Schema.org Validator](https://validator.schema.org/)

### Content Structure

1. **Use semantic HTML:**
   - `<article>` for main content
   - `<section>` for major divisions
   - `<dl>`, `<dt>`, `<dd>` for definitions

2. **Add data-ai attributes:**
   ```tsx
   <div data-ai-section="faq" data-ai-importance="high">
   ```

3. **Include breadcrumbs:**
   - Visual navigation
   - Schema markup
   - Improves crawlability

### Mobile Optimization

All components are mobile-first:
- ComparisonTable converts to cards on mobile
- FeaturedAnswer uses responsive padding
- DefinitionList has optimized touch targets
- Search inputs have large hit areas

---

## Testing Checklist

- [ ] Components render without TypeScript errors
- [ ] Schema validates in Google Rich Results Test
- [ ] Mobile layout displays correctly
- [ ] Search functionality works (DefinitionList)
- [ ] Collapse/expand works (FeaturedAnswer, DefinitionList)
- [ ] Links are accessible and functional
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility

---

## Integration Guide

### Adding to Existing Pages

1. **Import components:**
   ```tsx
   import { FeaturedAnswer } from '@/components/seo/FeaturedAnswer';
   ```

2. **Add schema utilities:**
   ```tsx
   import { generateFAQPageSchema } from '@/lib/schema-utils';
   ```

3. **Create data structures:**
   ```tsx
   const faqItems = [
     { id: 'q1', question: '...', answer: '...' }
   ];
   ```

4. **Render components with schema:**
   ```tsx
   <Script id="faq-schema" type="application/ld+json" ... />
   <FeaturedAnswerList items={faqItems} />
   ```

### Creating New Guide Pages

Use `src/app/guides/berlin/page.tsx` as a template:

1. Copy the Berlin guide structure
2. Update metadata (title, description, keywords)
3. Customize schemas (HowTo steps, FAQ items)
4. Update comparison data
5. Add city-specific glossary terms
6. Test all schemas and components

---

## Performance Considerations

- **Schema size:** Keep schemas focused and relevant
- **Component rendering:** Use `'use client'` directive for interactive features
- **Search optimization:** DefinitionList search is client-side (no server calls)
- **Images:** Add loading="lazy" for below-fold content
- **Code splitting:** Components are tree-shakeable

---

## Support and Resources

- **Implementation Plan:** `docs/AI_SEO_IMPLEMENTATION_PLAN.md`
- **Component Docs:** This file
- **Example Page:** `src/app/guides/berlin/page.tsx`
- **Phase 3 Components:** `src/components/seo/COMPONENT_STRUCTURE.md`
- **Google Guide:** [Featured Snippets](https://developers.google.com/search/docs/appearance/featured-snippets)
- **Schema.org:** [Documentation](https://schema.org/)

---

## Next Steps (Phase 5)

1. Complete schema coverage across all pages
2. Optimize images (WebP, lazy loading)
3. Run Lighthouse audits
4. Monitor featured snippet performance
5. Iterate based on Search Console data

---

**Last Updated:** January 3, 2026
**Phase:** 4 - Featured Snippets
**Status:** Complete
