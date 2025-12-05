# Test Coverage Analysis - Booth Beacon App

**Date:** December 4, 2025
**Analysis Scope:** Complete codebase test coverage audit
**Test Framework:** Vitest (unit/integration) + Playwright (e2e)

---

## Executive Summary

The Booth Beacon application has **minimal test coverage**. Currently only 3 E2E tests exist covering basic home page functionality, with **zero unit tests** for critical business logic, utility functions, and API routes.

**Current State:**
- **Total Source Files:** 113 files (~12.5K lines of code)
- **Unit/Integration Tests:** 0 files
- **E2E Tests:** 3 test suites (home, booth-detail, admin)
- **Coverage Estimate:** <5% of codebase

---

## Critical Coverage Gaps

### 1. UTILITY FUNCTIONS WITHOUT TESTS (High Priority)

#### Distance Utilities (`/src/lib/distanceUtils.ts` - 103 lines)
**Status:** No tests
**Risk Level:** HIGH - Core feature for location-based booth discovery

**Functions needing tests:**
- `calculateDistance()` - Haversine formula implementation
  - Edge cases: Same coordinates, antipodal points, invalid inputs
  - Accuracy validation: Known distances (e.g., NYC to SF should be ~4,100km)
- `formatDistance()` - Distance formatting
  - Test output format for <1km vs >=1km
  - Rounding behavior
- `sortBoothsByDistance()` - Sorting logic
  - Handling undefined distances
  - Null coordinate handling
- `filterBoothsByRadius()` - Radius filtering
  - Boundary conditions at exact radius limit
  - Missing coordinates handling

**Recommended Tests:** 20-25 test cases

---

#### Booth View Model (`/src/lib/boothViewModel.ts` - 88 lines)
**Status:** No tests
**Risk Level:** CRITICAL - Data transformation for all booth rendering

**Functions needing tests:**
- `normalizeBooth()` - Booth data normalization and validation
  - Required field validation (id, slug, name)
  - Safe type coercion (string, boolean, number, URL)
  - Address/location label formatting
  - URL validation with HTTP pattern matching
  - Default fallback values
  - Status validation against allowed statuses

**Test Scenarios:**
- Valid booth with all fields
- Booth with missing required fields (should return null)
- Booth with mixed data types (string numbers, non-booleans)
- Invalid URLs
- Empty strings vs undefined
- Special characters in addresses

**Recommended Tests:** 30-35 test cases

---

#### Data Quality Scoring (`/src/lib/dataQuality.ts` - 277 lines)
**Status:** No tests
**Risk Level:** CRITICAL - Used for enrichment prioritization and admin dashboards

**Functions needing tests:**
- `calculateQualityScore()` - Core scoring algorithm (0-100)
  - All 11 scoring categories validation
  - Missing fields detection
  - Enrichment priority assignment (critical/high/medium/low/complete)
  - Edge cases: All fields present (100 score), all fields missing (0 score)

- `determineEnrichmentNeeds()` - Enrichment strategy determination
  - Venue data enrichment flags
  - Image generation flags
  - Geocoding flags
  - Missing field breakdown

- `calculateQualityStatistics()` - Aggregate statistics
  - Correct distribution across score ranges
  - Missing field counting
  - Average score calculation
  - Edge case: Empty booth list

**Test Scenarios:**
- Test each field worth correct points (address=10, image=15, etc.)
- Verify enrichment priorities at different score levels
- Test statistics aggregation
- Validate missing field counts

**Recommended Tests:** 40-50 test cases

---

#### Google Maps Utilities (`/src/lib/googleMapsUtils.ts` - 150+ lines)
**Status:** No tests
**Risk Level:** MEDIUM - URL generation for tour maps

**Functions needing tests:**
- `generateCityTourMapUrl()` - Multi-waypoint map URL generation
  - Valid coordinates filtering
  - Waypoint limiting (max 20)
  - URL length handling and fallback
  - Parameter formatting
- `generateCitySearchUrl()` - Fallback city search
- `getMapTitle()` / `getMapDescription()` - Editorial content
  - Dynamic text generation
  - Pluralization handling

**Recommended Tests:** 15-20 test cases

---

#### Location Hierarchy (`/src/lib/locationHierarchy.ts` - TBD)
**Status:** No tests
**Risk Level:** MEDIUM - Location filtering and navigation

**Functions needing tests:**
- Hierarchy traversal
- Location filtering
- Parent/child relationships

**Recommended Tests:** 15-20 test cases

---

#### Other Utilities
- `cache.ts` - Caching logic
- `collections.ts` - Collection operations
- `imageOptimization.ts` - Image processing
- `imageGeneration.ts` - AI image generation (complex async)
- `adminAuth.ts` - Admin authorization checks

**Estimated tests needed:** 50+ test cases across these utilities

---

### 2. API ROUTES WITHOUT TESTS (High Priority)

#### 11 API Route Handlers (~1,904 lines)
**Status:** No tests
**Risk Level:** CRITICAL - Backend logic entry points

**Routes requiring unit tests:**

1. **GET `/api/maps/city/[city]`** - City tour maps
   - Parameter parsing and slug conversion
   - Booth query filtering
   - Error handling (no booths found, query failure)
   - Response formatting
   - Map URL generation

2. **GET `/api/enrichment/images`** - AI image generation (SSE)
   - Batch processing
   - Quality score filtering
   - Image generation flow
   - Error handling at each step
   - Stream event formatting

3. **POST `/api/enrichment/auto`** - Auto enrichment
   - Batch booth processing
   - Multiple enrichment strategies
   - Transaction handling

4. **POST `/api/enrichment/venue`** - Venue data enrichment
   - Third-party API integration
   - Data transformation
   - Error recovery

5. **POST `/api/admin/geocode`** - Geocoding batch operation
   - Admin authorization
   - Progress tracking
   - Batch limits

6. **POST `/api/admin/check-env`** - Environment validation
   - Required environment variable checks
   - API key validation

7. **POST `/api/crawler/route.ts`** - Crawler trigger
   - Job queue management
   - Source selection

8. **POST `/api/crawler/run-source`** - Single source crawler
   - Source-specific extraction
   - Data validation

9. **POST `/api/booths/generate-preview`** - Single preview generation
   - Image generation for single booth
   - Error handling

10. **POST `/api/booths/batch-generate-previews`** - Batch preview generation
    - Parallel processing
    - Rate limiting
    - Failure handling

11. **POST `/api/reextract`** - Data reextraction
    - Selective field updates
    - Conflict resolution

**Test Categories Needed:**
- Input validation and parameter parsing
- Authorization/authentication
- Error responses (400, 403, 404, 500)
- Success path with mock data
- Edge cases (empty data, malformed input)
- External API integration mocking

**Recommended Tests:** 80-100 test cases (8-10 per route)

---

### 3. COMPONENTS WITHOUT TESTS (Medium Priority)

#### Business Logic Components (Not UI primitives)

**Booth Components** (`/src/components/booth/` - 7 components):
1. `BoothCard.tsx` - Booth display card with conditional rendering
   - Image priority (exterior > generated > preview)
   - Status color mapping
   - Bookmark integration
   - Distance formatting

2. `BoothImage.tsx` - Image handling with error states
   - Broken image detection
   - Fallback handling
   - Loading states

3. `BoothMap.tsx` - Map component integration
   - Map initialization
   - Marker rendering
   - Click handling

4. `MapFilters.tsx` - Filter UI with business logic
   - Filter state management
   - Distance radius logic
   - Apply/reset logic

5. `StatusBadge.tsx` - Status rendering
   - Status color mapping
   - Text formatting

6. `CopyAddressButton.tsx` - Address copy with clipboard
   - Clipboard API usage
   - Success/error feedback

**Admin Components** (`/src/components/admin/` - 6+ components):
- `GeocodingPanel.tsx` - Geocoding progress tracking
- `CrawlerHealthDashboard.tsx` - Crawler metrics
- `CrawlJobQueue.tsx` - Job queue display
- `MetricsDashboard.tsx` - Analytics display
- `DatabaseStatusOverview.tsx` - DB connection status

**Other Components:**
- `SearchBar.tsx` - Search with autocomplete
  - Query debouncing
  - Result filtering
  - Keyboard navigation
  - Click-outside handling

- `BookmarkButton.tsx` - Bookmark toggle
  - State management
  - API calls
  - Error handling

- `PhotoUpload.tsx` - Photo upload with validation
  - File validation
  - Upload progress
  - Error handling

- `ShareButton.tsx` - Social sharing
  - Share dialog
  - Copy-to-clipboard
  - URL generation

- `PhotoStrips.tsx` - Photo gallery
  - Image rendering
  - Navigation

**Recommended Tests:** 100-150 test cases

---

### 4. TEST CONFIGURATION IMPROVEMENTS

**Current Issues:**

1. **Vitest Configuration** (`vitest.config.ts`)
   - Missing test include patterns
   - No coverage thresholds
   - No timeout configuration
   - Missing browser option configuration

2. **Setup File** (`tests/setup.ts`)
   - Only imports jest-dom
   - Missing mock setup for:
     - Next.js router
     - Supabase client
     - External APIs (OpenAI, Google Maps)

3. **Test Directories**
   - `/tests/unit/` - Empty (should contain lib tests)
   - `/tests/integration/` - Empty (should contain component/API tests)
   - `/tests/e2e/` - Only 3 basic tests

---

## Recommended Test Plan

### Phase 1: Foundation (Week 1)
**Target: 40-50 tests, establish patterns**

1. Set up test configuration
   - Add mock providers to setup.ts
   - Configure Next.js router mock
   - Setup Supabase mock client
   - Add environment variable defaults

2. Write core utility tests
   - `distanceUtils.ts` (20 tests)
   - `boothViewModel.ts` (25 tests)

3. Create test helpers/factories
   - Mock booth data generator
   - Mock API responses

**Expected time:** 15-20 hours

---

### Phase 2: Critical Utilities (Week 2)
**Target: 80-100 additional tests**

1. Data quality tests (45 tests)
2. Google Maps utility tests (18 tests)
3. Location hierarchy tests (15 tests)
4. Cache and collection tests (22 tests)

**Expected time:** 18-22 hours

---

### Phase 3: API Routes (Week 3-4)
**Target: 80-100 tests**

1. Simple routes first (2-3 tests each)
   - `/api/admin/check-env`
   - `/api/maps/city/[city]`

2. Medium complexity routes (8-10 tests each)
   - Enrichment routes
   - Crawler routes

3. Complex routes (12-15 tests each)
   - Image generation with SSE
   - Batch operations with error handling

**Expected time:** 25-30 hours

**Approach:**
- Mock Supabase responses
- Mock OpenAI/external APIs
- Test both success and error paths
- Validate response formats

---

### Phase 4: Component Tests (Week 5-6)
**Target: 100-150 tests**

1. Business logic components (40 tests)
   - SearchBar (15 tests)
   - BoothCard (12 tests)
   - BookmarkButton (8 tests)
   - PhotoUpload (5 tests)

2. Admin components (40 tests)
   - GeocodingPanel
   - CrawlerHealthDashboard
   - MetricsDashboard

3. E2E test expansion (50+ tests)
   - Search flows
   - Booth detail page interactions
   - Admin panel operations
   - Bookmark functionality
   - Share functionality

**Expected time:** 30-35 hours

---

### Phase 5: Coverage Targets & CI/CD
**Target: >70% coverage**

1. Set coverage thresholds in vitest.config.ts
   - Lines: 70%
   - Functions: 70%
   - Branches: 65%
   - Statements: 70%

2. Add CI/CD test step
   - Run tests in GitHub Actions
   - Generate coverage reports
   - Fail on coverage drops
   - Publish coverage to PR

**Expected time:** 5-8 hours

---

## Implementation Checklist

### Setup
- [ ] Add comprehensive mock setup to `tests/setup.ts`
- [ ] Create `tests/unit` directory structure
- [ ] Create `tests/integration` directory structure
- [ ] Add test factories/builders
- [ ] Update vitest.config.ts with coverage config
- [ ] Create test utilities file

### Utilities (Priority: CRITICAL)
- [ ] Distance utilities tests (20 tests)
- [ ] Booth view model tests (25 tests)
- [ ] Data quality tests (45 tests)
- [ ] Google Maps utilities tests (18 tests)

### APIs (Priority: CRITICAL)
- [ ] Maps API route tests (8 tests)
- [ ] Image enrichment API tests (12 tests)
- [ ] Auto enrichment API tests (10 tests)
- [ ] Venue enrichment API tests (10 tests)
- [ ] Geocoding API tests (8 tests)
- [ ] Crawler APIs tests (15 tests)
- [ ] Booths APIs tests (12 tests)

### Components (Priority: HIGH)
- [ ] SearchBar tests (15 tests)
- [ ] BoothCard tests (12 tests)
- [ ] BookmarkButton tests (8 tests)
- [ ] Admin component tests (40 tests)

### E2E Expansion (Priority: MEDIUM)
- [ ] Search page interactions (15 tests)
- [ ] Booth detail interactions (12 tests)
- [ ] Admin panel flows (15 tests)

### Configuration (Priority: MEDIUM)
- [ ] Set coverage thresholds
- [ ] Add GitHub Actions CI test step
- [ ] Create pre-commit hook for tests

---

## Key Testing Patterns to Establish

### 1. Mock Setup for Each Test File

```typescript
// Example: lib/distanceUtils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance } from '@/lib/distanceUtils';

describe('distanceUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate correct distance between two coordinates', () => {
      // Arrange
      const coord1 = { lat: 40.7128, lng: -74.0060 }; // NYC
      const coord2 = { lat: 34.0522, lng: -118.2437 }; // LA

      // Act
      const distance = calculateDistance(coord1, coord2);

      // Assert
      expect(distance).toBeCloseTo(3944, 0); // ~3944km
    });
  });
});
```

### 2. Component Testing Pattern

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoothCard } from '@/components/booth/BoothCard';
import { mockBooth } from '@/tests/factories';

describe('BoothCard', () => {
  it('should render booth information', () => {
    const booth = mockBooth({ name: 'Test Booth' });
    render(<BoothCard booth={booth} />);

    expect(screen.getByText('Test Booth')).toBeInTheDocument();
  });
});
```

### 3. API Route Testing Pattern

```typescript
import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/maps/city/[city]/route';

describe('/api/maps/city/[city]', () => {
  it('should return map URL for valid city', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      params: { city: 'san-francisco' },
    });

    await GET(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toHaveProperty('mapUrl');
  });
});
```

---

## Coverage Gaps Summary Table

| Category | Files | Lines | Tests | Priority | Est. Tests |
|----------|-------|-------|-------|----------|-----------|
| Distance Utils | 1 | 103 | 0 | CRITICAL | 20 |
| Booth ViewModel | 1 | 88 | 0 | CRITICAL | 25 |
| Data Quality | 1 | 277 | 0 | CRITICAL | 45 |
| Google Maps | 1 | 150+ | 0 | HIGH | 18 |
| Location Hierarchy | 1 | TBD | 0 | HIGH | 18 |
| Other Utilities | 5+ | 400+ | 0 | MEDIUM | 50 |
| API Routes | 11 | 1,904 | 0 | CRITICAL | 90 |
| Business Components | 20+ | 3,000+ | 0 | HIGH | 120 |
| E2E Tests | - | - | 3 | MEDIUM | 40+ |
| **TOTAL** | **~40** | **~6,000+** | **3** | - | **~430** |

---

## Next Steps

1. **Start with Phase 1** - Foundation and core utilities
2. **Create test factories** for consistent mock data
3. **Establish CI/CD** early to catch regressions
4. **Document patterns** as you write tests
5. **Aim for >80% coverage** on critical paths

---

## Resources & References

- **Vitest Documentation:** https://vitest.dev
- **React Testing Library:** https://testing-library.com/react
- **Playwright Documentation:** https://playwright.dev
- **Testing Best Practices:** https://javascript.plainenglish.io/testing-best-practices

