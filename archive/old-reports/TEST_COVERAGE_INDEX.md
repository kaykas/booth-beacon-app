# Test Coverage Analysis - Index & Navigation

**Generated:** December 4, 2025
**Status:** Complete Analysis with Implementation Guides
**Framework:** Vitest (unit/integration) + Playwright (e2e)

---

## Overview

This directory now contains a **comprehensive test coverage analysis** of the Booth Beacon application. The analysis identifies critical gaps, provides specific recommendations, and includes ready-to-implement test code examples.

**Current State:**
- **113 source files** | **~12.5K lines of code** | **3 E2E tests** | **<5% coverage**
- **0 unit tests** | **0 integration tests** | **Significant coverage gaps**

---

## Documents in This Analysis

### 1. [QUICK_TEST_REFERENCE.md](./QUICK_TEST_REFERENCE.md) 📋
**Start here if you have 10 minutes**

Quick reference guide covering:
- Coverage gaps at a glance (table format)
- Test counts needed by category
- 5 most critical tests to write
- One-week sprint plan
- Common pitfalls to avoid
- Quick wins (easy 10-15 tests)

**Best for:** Quick overview, prioritization, sprint planning

---

### 2. [TEST_COVERAGE_ANALYSIS.md](./TEST_COVERAGE_ANALYSIS.md) 📊
**Read this for detailed analysis**

Comprehensive coverage audit including:
- Executive summary with metrics
- Critical coverage gaps for all components
- Detailed breakdown of 40+ untested components
- Risk levels and impact assessment
- Phase-by-phase implementation plan (Phases 1-5)
- Test configuration improvements needed
- Coverage gaps summary table
- Success metrics and next steps

**Sections:**
1. Executive Summary
2. Critical Coverage Gaps
   - Utility Functions (6 files analyzed)
   - API Routes (11 routes analyzed)
   - Components (20+ components analyzed)
   - Test Configuration Issues
3. Recommended Test Plan (5 phases)
4. Implementation Checklist
5. Key Testing Patterns
6. Coverage Gaps Summary Table

**Best for:** Understanding the full scope, detailed planning, stakeholder reports

---

### 3. [TEST_IMPLEMENTATION_GUIDE.md](./TEST_IMPLEMENTATION_GUIDE.md) 💻
**Use this for actual implementation**

Step-by-step implementation guide with real code:
- **Part 1:** Setup & Configuration
  - Update vitest.config.ts
  - Enhance tests/setup.ts
  - Create test factories
- **Part 2:** Testing Utilities (CRITICAL)
  - Distance Utils (20 tests)
  - Booth View Model (25 tests)
  - Data Quality Scoring (50+ tests)
  - Google Maps Utils (15+ tests)
- **Part 3:** API Route Testing
  - Example: Maps API route with 8+ tests
- **Part 4:** Component Testing
  - Example: SearchBar component with 15+ tests
- **Running Tests** - Commands and expected output

**Code Examples:**
- 3 complete test files (distanceUtils, boothViewModel, dataQuality)
- Mock setup and factories
- API route testing patterns
- Component testing patterns

**Best for:** Writing tests, copying code examples, establishing patterns

---

## Coverage Gap Summary

### By Severity

#### 🔴 CRITICAL (Blocks deployment)
- **Utility Functions:** 160 tests needed
  - Distance calculations, data transformation, scoring
- **API Routes:** 90 tests needed
  - All 11 backend endpoints untested
- **Data Quality:** 45 tests needed
  - Drives enrichment and admin features

#### 🟠 HIGH (Production risk)
- **Google Maps Utils:** 18 tests
- **Components:** 120 tests
- **Location Hierarchy:** 15 tests

#### 🟡 MEDIUM (Technical debt)
- **E2E Tests:** 40+ new tests
- **Test Configuration:** Thresholds not set

### By Category

| Category | Files | Lines | Tests | Est. Time |
|----------|-------|-------|-------|-----------|
| Distance Utils | 1 | 103 | 20 | 3h |
| Booth ViewModel | 1 | 88 | 25 | 4h |
| Data Quality | 1 | 277 | 45 | 6h |
| Google Maps Utils | 1 | 150+ | 18 | 3h |
| Location Hierarchy | 1 | TBD | 15 | 2h |
| Other Utilities | 5+ | 400+ | 50 | 8h |
| API Routes (11) | 11 | 1,904 | 90 | 15h |
| Components (20+) | 20+ | 3,000+ | 120 | 20h |
| E2E Expansion | - | - | 40+ | 8h |
| **TOTAL** | **40+** | **~6,000** | **~430** | **60-70h** |

---

## Implementation Timeline

### Week 1: Foundation
- **Time:** 15-20 hours
- **Output:** 50 tests
- **Tasks:**
  1. Setup and configuration
  2. Create factories and mocks
  3. Write distance utils tests (20 tests)
  4. Write booth view model tests (25 tests)
  5. Establish test patterns

### Week 2: Core Utilities
- **Time:** 18-22 hours
- **Output:** 100 additional tests
- **Tasks:**
  1. Data quality tests (45 tests)
  2. Google Maps tests (18 tests)
  3. Location hierarchy tests (15 tests)
  4. Other utilities tests (22 tests)

### Weeks 3-4: API Routes
- **Time:** 25-30 hours
- **Output:** 90 tests
- **Tasks:**
  1. Simple routes (2-3 tests each): 20 tests
  2. Medium routes (8-10 tests each): 30 tests
  3. Complex routes (12-15 tests each): 40 tests
  4. Mock setup for Supabase/OpenAI

### Weeks 5-6: Components & Finalization
- **Time:** 30-35 hours
- **Output:** 160+ tests
- **Tasks:**
  1. SearchBar and core components (40 tests)
  2. Admin components (40 tests)
  3. E2E test expansion (50+ tests)
  4. Coverage configuration
  5. CI/CD integration

**Total Timeline:** 6 weeks, 50-60 total hours

---

## Top Priority Tests

### Tier 1: Write These First (18 hours)
1. **Distance Utils** (20 tests, 3h)
   - Core to location features
   - Pure functions, easy to test
2. **Booth View Model** (25 tests, 4h)
   - Data corruption risk
   - Every booth page depends on it
3. **Data Quality** (45 tests, 6h)
   - Drives admin features
   - Complex logic needs validation
4. **Maps API Route** (8 tests, 2h)
   - Public API endpoint
   - User-facing feature
5. **SearchBar Component** (15 tests, 3h)
   - Core interaction
   - Hard to debug manually

### Tier 2: Quick Wins (2 hours)
- formatDistance() - 5 tests
- cn() utility - 3 tests
- URL validation - 4 tests
- Status badge - 3 tests

### Tier 3: Most of the Work
- Remaining 8 API routes (70 tests)
- Remaining components (80 tests)
- E2E test expansion (50+ tests)

---

## How to Use These Documents

### Scenario 1: "I have 10 minutes"
→ Read **QUICK_TEST_REFERENCE.md**
- Get the essential gaps
- Understand priorities
- See 1-week plan

### Scenario 2: "I need to brief leadership"
→ Read **TEST_COVERAGE_ANALYSIS.md**
- Executive summary
- Risk assessment
- Implementation timeline
- Metrics and success criteria

### Scenario 3: "I want to start writing tests"
→ Start with **TEST_IMPLEMENTATION_GUIDE.md**
- Part 1: Setup instructions (follow in order)
- Part 2: Copy-paste real test code
- Part 4: Establish patterns
- Run the examples

### Scenario 4: "I need to prioritize work"
→ Combine all three:
1. **QUICK_TEST_REFERENCE.md** - What to do
2. **TEST_COVERAGE_ANALYSIS.md** - Why it matters
3. **TEST_IMPLEMENTATION_GUIDE.md** - How to do it

---

## Critical Components Analyzed

### Utilities (13 files, 3,563 lines)
- ✗ distanceUtils.ts (103 lines)
- ✗ boothViewModel.ts (88 lines)
- ✗ dataQuality.ts (277 lines)
- ✗ googleMapsUtils.ts (150+ lines)
- ✗ locationHierarchy.ts
- ✗ imageGeneration.ts
- ✗ imageOptimization.ts
- ✗ cache.ts
- ✗ collections.ts
- ✗ adminAuth.ts
- ✗ geocoding.ts
- ✗ googleMapsLoader.ts
- ✗ transformers/booth-transformer.ts

### API Routes (11 files, 1,904 lines)
- ✗ /api/maps/city/[city]
- ✗ /api/enrichment/images
- ✗ /api/enrichment/auto
- ✗ /api/enrichment/venue
- ✗ /api/admin/geocode
- ✗ /api/admin/check-env
- ✗ /api/crawler/route
- ✗ /api/crawler/run-source
- ✗ /api/booths/generate-preview
- ✗ /api/booths/batch-generate-previews
- ✗ /api/reextract

### Business Components (20+ files, 3,000+ lines)
- ✗ SearchBar.tsx (complex debouncing, state)
- ✗ BoothCard.tsx (conditional rendering, logic)
- ✗ BookmarkButton.tsx (state management)
- ✗ PhotoUpload.tsx (async, validation)
- ✗ ShareButton.tsx (clipboard API)
- ✗ GeocodingPanel.tsx (progress tracking)
- ✗ CrawlerHealthDashboard.tsx (metrics)
- ✗ CrawlJobQueue.tsx (queue display)
- ✗ MetricsDashboard.tsx (analytics)
- And more...

### E2E Tests (3 tests)
- ✓ Home page basic smoke test
- ✓ Booth detail page basic smoke test
- ✓ Admin page basic smoke test
- ✗ Need: Search flows, interactions, edge cases

---

## Test Configuration Currently Missing

### vitest.config.ts
- [ ] Coverage thresholds (lines, functions, branches)
- [ ] Proper include/exclude patterns
- [ ] Browser configuration options
- [ ] Timeout settings

### tests/setup.ts
- [ ] Next.js router mocks
- [ ] Supabase client mock
- [ ] External API mocks (OpenAI, Google Maps)
- [ ] Environment variable defaults
- [ ] Global test utilities

### Test Directories
- [ ] `/tests/unit/` - Empty (needs lib tests)
- [ ] `/tests/integration/` - Empty (needs component/API tests)
- [ ] `/tests/factories/` - Missing (needs mock data generators)

---

## Running the Analysis

The three documents are self-contained but reference each other:

```
START HERE: QUICK_TEST_REFERENCE.md (10 min read)
    ↓
NEED MORE DETAILS: TEST_COVERAGE_ANALYSIS.md (30 min read)
    ↓
READY TO CODE: TEST_IMPLEMENTATION_GUIDE.md (follow steps)
    ↓
UPDATE CONFIG: vitest.config.ts + tests/setup.ts
    ↓
WRITE TESTS: Use code examples from guide
    ↓
RUN TESTS: npm run test:watch
    ↓
CHECK COVERAGE: npm run test:coverage
```

---

## Key Takeaways

1. **Critical gaps exist** in core utilities and API routes
2. **Data corruption risk** if distance/booth normalization fails
3. **Production features untested** - image generation, enrichment, geocoding
4. **Low effort high reward** - start with utilities
5. **6-week plan** gets to >70% coverage
6. **50-60 hours total** well-invested time
7. **Real code examples provided** - no need to write from scratch
8. **Patterns documented** - consistent testing approach

---

## Next Steps

### Immediate (Today)
1. Read QUICK_TEST_REFERENCE.md (10 min)
2. Share TEST_COVERAGE_ANALYSIS.md with team
3. Review TEST_IMPLEMENTATION_GUIDE.md code examples

### This Week
1. Set up vitest configuration
2. Create tests/factories/index.ts
3. Write first 20 tests (distanceUtils)
4. Establish test patterns

### Next Week
1. Continue with utilities
2. Add CI/CD test step
3. Track coverage progress

---

## Questions Answered in These Docs

**"What should we test first?"**
→ Read Tier 1 in QUICK_TEST_REFERENCE.md

**"How bad is the coverage gap?"**
→ See Coverage Gap Summary above

**"How long will this take?"**
→ 60-70 hours over 6 weeks (see Implementation Timeline)

**"Where do I start writing tests?"**
→ Follow Part 1 & 2 of TEST_IMPLEMENTATION_GUIDE.md

**"What are common mistakes to avoid?"**
→ See "Common Pitfalls" in QUICK_TEST_REFERENCE.md

**"Which tests have the highest impact?"**
→ See "Top Priority Tests" above

---

## Files Created

- ✓ TEST_COVERAGE_INDEX.md (this file)
- ✓ QUICK_TEST_REFERENCE.md
- ✓ TEST_COVERAGE_ANALYSIS.md
- ✓ TEST_IMPLEMENTATION_GUIDE.md

**Total Documentation:** 1,900+ lines, 49KB

---

## Recommendation

**Start today with QUICK_TEST_REFERENCE.md**, then share this analysis with your team. The first week of implementation (Phase 1) will establish the foundation and patterns needed for rapid test development in subsequent weeks.

