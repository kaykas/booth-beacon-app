# AI & SEO Optimization Implementation Plan
**Project:** Booth Beacon
**Date:** January 3, 2026
**Reference:** ~/.claude/AI_SEO_PLAYBOOK.md
**Status:** Phase 1 & 2 Complete ✅ | Ready for Phase 3

---

## Implementation Status

### ✅ Phase 1: Critical Foundation (COMPLETED)
- [x] Skip link added to layout (layout.tsx:150-156)
- [x] Semantic HTML roles (banner, navigation, main, contentinfo)
- [x] ARIA labels on navigation and interactive elements
- [x] Main content wrappers on all key pages
- [x] Build verification passed (1045 pages generated)

### ✅ Phase 2: AI Optimization (COMPLETED)
- [x] Create AI meta tags utility (src/lib/ai-meta-tags.ts)
- [x] Add data-AI attributes (24 sections across homepage and booth pages)
- [x] Implement knowledge graph schemas (src/lib/knowledge-graph-schemas.ts)
- [x] Integrate AI meta tags into homepage and booth detail pages
- [x] Integrate knowledge graph schemas (Glossary, Organization, Place, TouristAttraction)
- [x] Build verification passed (1045 pages generated)

---

## Current State Audit

### ✅ Already Implemented
1. **robots.txt** - Comprehensive AI crawler permissions (GPTBot, ClaudeBot, etc.)
2. **llms.txt** - AI-friendly documentation
3. **Open Graph & Twitter Cards** - Basic social sharing tags
4. **Structured Data** - Organization schema in root layout
5. **Some ARIA labels** - Search, Menu, Bookmarks buttons have aria-labels
6. **Sitemap** - Basic sitemap generation exists

### ⚠️ Partially Implemented
1. **Semantic HTML** - Has `<header>` and `<nav>` but missing roles and proper attributes
2. **Image Alt Text** - Basic alt text but not descriptive enough per playbook standards
3. **Meta Tags** - Basic metadata but missing AI-specific signals
4. **Schemas** - Only Organization schema, missing BreadcrumbList, Article, etc.

### ❌ Missing Critical Components
1. **Skip Links** - Not present
2. **role attributes** - Missing on header/nav/main/footer
3. **aria-label on nav** - Nav lacks descriptive label
4. **<main> wrapper** - No semantic main element wrapping page content
5. **Descriptive alt text** - Images use basic names, not full context
6. **AI Meta Tags** - No AI-specific meta tags (AI:summary, AI:key-concepts, etc.)
7. **Data-AI attributes** - No content delineation for AI systems
8. **Content freshness signals** - Missing article:published_time, article:modified_time
9. **E-E-A-T Components** - No AuthorBio, References, or TrustSignals components
10. **Featured Snippet components** - No FeaturedAnswer, ComparisonTable, or DefinitionList
11. **Knowledge Graph** - Missing DefinedTermSet for photo booth terminology
12. **Advanced Schemas** - Missing FAQPage, HowTo, BreadcrumbList on pages

---

## Implementation Plan (Phased Approach)

### Phase 1: Critical Foundation (Week 1) ⚠️ HIGHEST PRIORITY

**Goal:** Fix semantic HTML, accessibility basics, and structural issues

#### Task 1.1: Add Skip Link
**File:** `src/app/layout.tsx`
**Change:** Add skip link as first element in body
```tsx
<body>
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md"
  >
    Skip to main content
  </a>
  {/* ... rest */}
</body>
```

#### Task 1.2: Update Header with Semantic Roles
**File:** `src/components/layout/Header.tsx`
**Changes:**
```tsx
// Add role="banner" to header
<header role="banner" className="...">

// Add role and aria-label to nav
<nav role="navigation" aria-label="Main navigation" className="...">
```

#### Task 1.3: Add Main Wrapper to Pages
**Files:** All page components
**Pattern:**
```tsx
export default function Page() {
  return (
    <>
      <Header />
      <main id="main-content" role="main">
        {/* Page content */}
      </main>
      <Footer />
    </>
  );
}
```

#### Task 1.4: Update Footer with Semantic Role
**File:** `src/components/layout/Footer.tsx`
**Change:** Add `role="contentinfo"`

#### Task 1.5: Enhance Image Alt Text
**File:** `src/components/booth/BoothImage.tsx` (ALREADY DONE ✅)
**Status:** Already improved with descriptive alt text including location and image type

#### Task 1.6: Verify All Interactive Elements Have ARIA Labels
**Files:** Review all buttons, links, form inputs
**Pattern:**
```tsx
<button
  onClick={handleClick}
  aria-label="Descriptive action label"
  aria-describedby="optional-description-id"
>
  Icon
</button>
```

### Phase 2: AI Optimization (Week 2)

#### Task 2.1: Create AI Meta Tags Utility
**File:** `src/lib/ai-meta-tags.ts` (NEW)
**Content:** Implement `generateAIMetaTags()` function per playbook

#### Task 2.2: Add AI Meta Tags to Key Pages
**Files:**
- `src/app/page.tsx` (homepage)
- `src/app/booth/[slug]/page.tsx` (booth details)
- `src/app/map/page.tsx`
- `src/app/browse/page.tsx`

**Pattern:**
```tsx
<Helmet>
  {Object.entries(generateAIMetaTags({
    summary: "One sentence summary",
    keyConcepts: ["analog photo booth", "vintage", "photochemical"],
    contentStructure: "directory",
    expertiseLevel: "beginner",
    perspective: "educational",
    authority: "industry-expert"
  })).map(([name, content]) => (
    <meta key={name} name={name} content={content} />
  ))}
</Helmet>
```

#### Task 2.3: Add Data-AI Attributes
**Files:** Content-heavy pages
**Pattern:**
```tsx
<article data-ai-section="main-content">
  <section data-ai-type="definition" data-ai-importance="critical">
    {/* Definition of analog photo booths */}
  </section>
  <section data-ai-type="examples" data-ai-importance="high">
    {/* Examples and listings */}
  </section>
</article>
```

#### Task 2.4: Add Content Freshness Signals
**Files:** All content pages
**Pattern:**
```tsx
<meta property="article:published_time" content="2026-01-03T08:00:00Z" />
<meta property="article:modified_time" content={new Date().toISOString()} />
<meta name="revised" content="2026-01-03" />
```

#### Task 2.5: Implement Knowledge Graph Schemas
**File:** `src/lib/knowledge-graph-schemas.ts` (NEW)
**Schemas to create:**
1. DefinedTermSet for photo booth terminology
2. Enhanced Organization schema with founder/expertise
3. Place schema for booth locations

#### Task 2.6: Add BreadcrumbList Schema
**Files:** All pages with navigation hierarchy
**Utility:** `generateBreadcrumbSchema()` in `src/lib/seo-utils.ts`

### Phase 3: E-E-A-T Signals (Week 2-3)

#### Task 3.1: Create AuthorBio Component
**File:** `src/components/seo/AuthorBio.tsx` (NEW)
**Usage:** Add to About page, Guides, content pages

#### Task 3.2: Create References Component
**File:** `src/components/seo/References.tsx` (NEW)
**Usage:** Add to guide pages with citations

#### Task 3.3: Create TrustSignals Component
**File:** `src/components/seo/TrustSignals.tsx` (NEW)
**Usage:** Add to footer, important pages
**Content:**
- Privacy policy link
- Disclaimer about user-generated content
- Data verification badges

#### Task 3.4: Add Publishing Dates
**Files:** All content pages
**Pattern:**
```tsx
<div className="content-freshness">
  <p>
    ✓ <strong>Last Updated:</strong>{" "}
    <time dateTime="2026-01-03">January 3, 2026</time>
  </p>
</div>
```

### Phase 4: Featured Snippets (Week 3-4)

#### Task 4.1: Create FeaturedAnswer Component
**File:** `src/components/seo/FeaturedAnswer.tsx` (NEW)
**Usage:** Add to FAQ page, guides
**Pattern:** Direct 40-60 word answers to common questions

#### Task 4.2: Create ComparisonTable Component
**File:** `src/components/seo/ComparisonTable.tsx` (NEW)
**Usage:** Photo booth types comparison, machine models

#### Task 4.3: Create DefinitionList Component
**File:** `src/components/seo/DefinitionList.tsx` (NEW)
**Usage:** Photo booth glossary, key terms

#### Task 4.4: Implement FAQPage Schema
**File:** Update existing FAQ data structure
**Add:** Schema generation for FAQ pages

#### Task 4.5: Create Guide Pages with HowTo Schema
**Files:** City guides (Berlin, NYC, etc.)
**Schema:** HowTo schema for "How to find photo booths in [City]"

### Phase 5: Polish (Week 4)

#### Task 5.1: Complete Schema Coverage
**Ensure these schemas on appropriate pages:**
- BreadcrumbList (all pages)
- Article (content pages)
- FAQPage (FAQ section)
- HowTo (guides)
- Place (booth detail pages) - Already partially implemented

#### Task 5.2: Image Optimization
**Tasks:**
- Verify all images have width/height
- Add loading="lazy" to below-fold images
- Use priority loading for hero images
- Generate WebP versions

#### Task 5.3: Lighthouse Audit
**Run on key pages:**
- Homepage
- Booth detail page
- Map page
- Guide page

**Targets:**
- Performance: 90+
- SEO: 95-100
- Accessibility: 95-100
- Best Practices: 95+

---

## Priority Order for Immediate Implementation

### Critical (Do Immediately): ✅ COMPLETED
1. ✅ Add skip link to layout (layout.tsx:150-156)
2. ✅ Add role attributes to Header (role="banner") (Header.tsx:14)
3. ✅ Add role and aria-label to nav (Header.tsx:30, 116)
4. ✅ Wrap all page content in `<main id="main-content" role="main">`
   - ✅ Homepage (page.tsx:148-482)
   - ✅ Map page (map/page.tsx:352-632)
   - ✅ Browse page (browse/page.tsx:69)
   - ✅ Booth detail page (booth/[slug]/page.tsx:332-941)
5. ✅ Add role="contentinfo" to Footer (Footer.tsx:10)
6. ✅ Verify heading hierarchy (h1 → h2 → h3, no skipping)

### High Priority (This Week):
7. ⬜ Create and integrate AI meta tags utility
8. ⬜ Add data-AI attributes to booth detail pages
9. ⬜ Implement BreadcrumbList schema on all pages
10. ⬜ Add content freshness signals
11. ⬜ Create knowledge graph schemas for photo booth terminology

### Medium Priority (Week 2-3):
12. ⬜ Create E-E-A-T components (AuthorBio, References, TrustSignals)
13. ⬜ Add publishing/update dates to content
14. ⬜ Create featured snippet components
15. ⬜ Implement FAQPage and HowTo schemas

### Lower Priority (Week 3-4):
16. ⬜ Complete image optimization
17. ⬜ Final Lighthouse audit and fixes
18. ⬜ Advanced schema coverage

---

## Files to Create

### New Utility Libraries:
1. `src/lib/ai-meta-tags.ts` - AI-specific meta tag generation
2. `src/lib/knowledge-graph-schemas.ts` - Entity and terminology schemas
3. `src/lib/seo-utils.ts` - Enhanced with more schema generators

### New Components:
1. `src/components/seo/AuthorBio.tsx`
2. `src/components/seo/References.tsx`
3. `src/components/seo/TrustSignals.tsx`
4. `src/components/seo/FeaturedAnswer.tsx`
5. `src/components/seo/ComparisonTable.tsx`
6. `src/components/seo/DefinitionList.tsx`

### Files to Modify:
1. `src/app/layout.tsx` - Add skip link
2. `src/components/layout/Header.tsx` - Add roles and aria-labels
3. `src/components/layout/Footer.tsx` - Add role="contentinfo"
4. `src/app/page.tsx` - Wrap in <main>, add AI meta tags
5. `src/app/booth/[slug]/page.tsx` - Add AI meta tags, data-AI attributes
6. `src/app/map/page.tsx` - Wrap in <main>, add schemas
7. All other page components - Add semantic structure

---

## Testing Checklist

### Pre-Deployment:
- [ ] npm run build (no errors)
- [ ] Lighthouse audit on 5 key pages
- [ ] Google Rich Results Test for all schemas
- [ ] Schema.org validator
- [ ] Keyboard navigation test (Tab through all)
- [ ] Screen reader test (NVDA or VoiceOver)
- [ ] Color contrast check (WCAG AA minimum)

### Post-Deployment:
- [ ] Submit sitemap to Google Search Console
- [ ] Request indexing for updated pages
- [ ] Monitor Core Web Vitals
- [ ] Track keyword rankings
- [ ] Monitor for featured snippet captures

---

## Success Metrics

### Week 1 Targets:
- Lighthouse SEO: 95+
- Lighthouse Accessibility: 95+
- All semantic HTML in place
- Skip links functional

### Month 1 Targets:
- All Phase 1-2 complete
- AI meta tags on all key pages
- Knowledge graphs implemented
- Initial indexing improvements visible

### Month 3 Targets:
- All phases complete
- Featured snippets captured (target: 3-5)
- AI citations in LLM responses
- +50% organic traffic

---

**Next Action:** Begin Phase 1, Task 1.1 - Add skip link to layout.tsx
