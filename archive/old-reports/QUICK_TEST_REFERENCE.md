# Quick Test Reference - Booth Beacon

A quick-lookup guide for the test coverage analysis and implementation recommendations.

---

## Critical Gaps at a Glance

| Component | Lines | Tests | Priority | Impact |
|-----------|-------|-------|----------|--------|
| **distanceUtils.ts** | 103 | 0 | 🔴 CRITICAL | Distance sorting & filtering broken silently |
| **boothViewModel.ts** | 88 | 0 | 🔴 CRITICAL | Data corruption in booth rendering |
| **dataQuality.ts** | 277 | 0 | 🔴 CRITICAL | Enrichment logic failures |
| **googleMapsUtils.ts** | 150+ | 0 | 🟠 HIGH | Map URLs fail silently |
| **API Routes (11)** | 1,904 | 0 | 🔴 CRITICAL | Backend endpoints untested |
| **Components (20+)** | 3,000+ | 0 | 🟡 MEDIUM | UI broken, hard to debug |
| **E2E Tests** | - | 3 | 🟡 MEDIUM | Basic coverage only |

---

## Test Counts Needed

```
Utilities (Core):        160 tests
API Routes:              90 tests
Components:             120 tests
E2E Expansion:           40 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                  410 tests
Target Time:           50-60 hours
```

---

## The 5 Most Critical Tests to Write First

### 1. Distance Utils (20 tests, ~3 hours)
**Why:** Breaks silently if wrong. Users get wrong locations.
```typescript
// Key tests:
- calculateDistance(nyc, sf) ≈ 4100km ✓
- formatDistance(0.5) = "500 m" ✓
- sortByDistance handles nulls ✓
- filterByRadius edge cases ✓
```

### 2. Booth View Model (25 tests, ~4 hours)
**Why:** All booth pages depend on this. Corrupts data.
```typescript
// Key tests:
- normalizeBooth returns null if missing required fields ✓
- URL validation (rejects bad URLs) ✓
- Status validation ✓
- Safe type coercion ✓
```

### 3. Data Quality (45 tests, ~6 hours)
**Why:** Drives admin features & enrichment priorities.
```typescript
// Key tests:
- Score calculation (0-100) ✓
- All fields award correct points ✓
- Priority assignment ✓
- Statistics aggregation ✓
```

### 4. Maps API Route (8 tests, ~2 hours)
**Why:** Public API, users depend on it.
```typescript
// Key tests:
- Valid city → map URL ✓
- No booths → 404 ✓
- Database error → 500 ✓
- Slug conversion ✓
```

### 5. SearchBar Component (15 tests, ~3 hours)
**Why:** Core user interaction, hard to debug manually.
```typescript
// Key tests:
- Debouncing works ✓
- Results display ✓
- Click-outside closes ✓
- Navigation works ✓
```

**Total: ~18 hours for critical path**

---

## One-Week Sprint Plan

### Day 1: Setup (2-3 hours)
```bash
# 1. Update vitest.config.ts
# 2. Enhance tests/setup.ts with mocks
# 3. Create tests/factories/index.ts
# 4. Create test directory structure
# Commands:
mkdir -p tests/{unit,integration}
```

### Day 2-3: Core Utilities (8-10 hours)
```bash
# Write tests for:
# - distanceUtils.ts (20 tests)
# - boothViewModel.ts (25 tests)
npm run test:watch
```

### Day 4: Data Quality (6-8 hours)
```bash
# Write tests for:
# - dataQuality.ts (45 tests)
```

### Day 5: APIs & Components (6-8 hours)
```bash
# Quick wins:
# - Maps API route (8 tests)
# - SearchBar component (15 tests)
# - BoothCard component (12 tests)
```

### Results After Week 1:
- 125+ tests
- 15-20% coverage
- Foundation established
- Clear patterns documented

---

## Most Common Test Patterns in This Codebase

### Pattern 1: Pure Functions (Utilities)
```typescript
import { describe, it, expect } from 'vitest';
import { functionName } from '@/lib/file';

describe('functionName', () => {
  it('should handle basic case', () => {
    const result = functionName(input);
    expect(result).toBe(expected);
  });
});
```

### Pattern 2: Mocking (Components with Hooks)
```typescript
import { render, screen } from '@testing-library/react';
import { Component } from '@/components/Component';
import { mockRouter } from '@/tests/mocks';

describe('Component', () => {
  it('should render', () => {
    render(<Component />);
    expect(screen.getByText('text')).toBeInTheDocument();
  });
});
```

### Pattern 3: Async (API Routes)
```typescript
import { GET } from './route';

describe('/api/endpoint', () => {
  it('should return 200', async () => {
    const response = await GET(req, { params });
    expect(response.status).toBe(200);
  });
});
```

---

## File Structure After Implementation

```
booth-beacon-app/
├── tests/
│   ├── setup.ts (UPDATED with mocks)
│   ├── factories/
│   │   └── index.ts (NEW)
│   ├── unit/
│   │   ├── distanceUtils.test.ts (NEW)
│   │   ├── boothViewModel.test.ts (NEW)
│   │   ├── dataQuality.test.ts (NEW)
│   │   └── [more utilities]
│   ├── integration/
│   │   ├── api/
│   │   │   ├── maps-city.test.ts (NEW)
│   │   │   ├── enrichment-images.test.ts (NEW)
│   │   │   └── [more API routes]
│   │   └── components/
│   │       ├── SearchBar.test.tsx (NEW)
│   │       ├── BoothCard.test.tsx (NEW)
│   │       └── [more components]
│   └── e2e/
│       └── [existing + new tests]
├── vitest.config.ts (UPDATED)
└── playwright.config.ts
```

---

## Coverage Thresholds to Set

```typescript
// In vitest.config.ts coverage section:
{
  lines: 70,          // 70% of lines executed
  functions: 70,      // 70% of functions executed
  branches: 65,       // 65% of branches executed
  statements: 70,     // 70% of statements executed
}
```

---

## Red Flags: What to Watch For

### 🚩 Utility Functions
- No tests for Haversine distance formula = geo queries will be wrong
- No tests for booth normalization = page crashes or corrupted data
- No tests for data quality scoring = admin panel shows garbage

### 🚩 API Routes
- No input validation tests = injection attacks possible
- No error handling tests = crashes on edge cases
- No auth tests = unauthorized access possible

### 🚩 Components
- No interaction tests = broken UX discovered by users
- No edge case tests = null errors in console
- No integration tests = works in isolation, breaks in app

---

## When to Write Tests

### Write BEFORE Code:
- When fixing a bug (write test that fails, then fix)
- When adding complex logic (TDD for 10+ line functions)

### Write ALONGSIDE Code:
- When building new features (maintain coverage)
- When refactoring (ensure behavior doesn't change)

### Write AFTER Code:
- For existing untested code (coverage drive)
- For utilities and business logic

---

## Common Pitfalls to Avoid

### ❌ Don't:
```typescript
// ❌ Testing implementation, not behavior
expect(functionCall.wasCalledWith(arg)).toBe(true);

// ❌ Skipping edge cases
it('should work', () => {
  expect(fn(goodInput)).toBe(result);
  // Missing: null, undefined, empty, wrong type...
});

// ❌ Testing UI framework instead of your code
it('should render without crashing', () => {
  render(<Component />);
  // This tests React, not your code
});
```

### ✅ Do:
```typescript
// ✅ Test behavior/output
const result = calculateDistance(coord1, coord2);
expect(result).toBeCloseTo(expectedDistance, 0);

// ✅ Include edge cases
expect(fn(null)).toThrow();
expect(fn(undefined)).toThrow();
expect(fn({})).toThrow();

// ✅ Test your specific logic
const normalized = normalizeBooth(badData);
expect(normalized).toBe(null); // Your validation logic
```

---

## Quick Wins (Easy 10-15 Tests)

These are functions that are easy to test and have high impact:

1. **formatDistance()** - 5 tests, ~30 mins
2. **cn() utility** - 3 tests, ~20 mins
3. **URL validation in boothViewModel** - 4 tests, ~30 mins
4. **Status badge formatting** - 3 tests, ~20 mins

**Total: 15 tests in ~2 hours**

---

## Resources

- **Vitest Docs:** https://vitest.dev/guide/
- **React Testing Library:** https://testing-library.com/docs/react-testing-library/intro
- **Playwright:** https://playwright.dev/docs/intro
- **Testing Best Practices:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

## Success Metrics

| Milestone | Target | Timeline |
|-----------|--------|----------|
| Phase 1 Utilities | 50 tests | Week 1 |
| All Utilities | 160 tests | Week 2 |
| API Routes | 90 tests | Week 3-4 |
| Components | 120 tests | Week 5 |
| Coverage Goal | >70% | Week 6 |

---

## Get Started NOW

```bash
# 1. Copy test templates from TEST_IMPLEMENTATION_GUIDE.md
# 2. Update tests/setup.ts with mocks
# 3. Create tests/factories/index.ts
# 4. Write first test: distanceUtils.test.ts
# 5. Run: npm run test:watch
# 6. Celebrate! 🎉

# Track progress:
npm run test:coverage  # See what % you've covered
```

