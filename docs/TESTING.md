# Testing Guide

## Overview

This project implements a comprehensive three-tier testing strategy:

1. **Unit Tests** - Test individual functions and components in isolation
2. **Integration Tests** - Test feature workflows with sample data
3. **End-to-End Tests** - Test critical user journeys through the UI

## Quick Start

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm test                    # Vitest unit tests
npm run test:deno          # Deno crawler tests
npm run test:e2e           # Playwright E2E tests

# Development mode
npm run test:watch         # Unit tests in watch mode
npm run test:ui            # Interactive Vitest UI
npm run test:e2e:ui        # Interactive Playwright UI
```

## Test Coverage

### Current Test Suite

#### Unit Tests (Deno - Crawler Functions)
- **validation.test.ts** - Basic validation tests
- **validation.comprehensive.test.ts** - 80+ comprehensive validation tests
  - SQL injection detection
  - HTML tag stripping
  - Coordinate validation (latitude/longitude)
  - URL validation
  - Phone number validation
  - Booth data validation
  - Security tests

- **deduplication-engine.test.ts** - 50+ deduplication tests
  - Levenshtein distance algorithm
  - Name similarity scoring
  - Geocoding and distance calculation
  - Source priority resolution
  - Booth comparison logic
  - Merge strategies
  - Full deduplication workflow

#### Integration Tests (Deno - Extractors)
- **extractors.test.ts** - Basic extractor tests
- **extractors.integration.test.ts** - Integration tests with sample HTML
  - HTML parsing and cleaning
  - Coordinate extraction
  - Phone number extraction
  - URL extraction
  - Operational status detection
  - Multi-booth extraction
  - Malicious data sanitization

- **specialized-extractors.test.ts** - Tests for specialized extractors

#### End-to-End Tests (Playwright)
- **home.test.ts** - Home page functionality
  - Page loads correctly
  - Search functionality
  - Navigation elements
  - Mobile responsiveness

- **booth-detail.test.ts** - Booth detail pages
  - Detail page loads
  - Information display
  - Map integration
  - Error handling

- **admin.test.ts** - Admin dashboard
  - Data table display
  - Filtering functionality
  - Statistics display
  - Responsive layout

## Test Structure

```
booth-beacon-app/
├── tests/
│   ├── setup.ts                    # Vitest configuration
│   ├── README.md                   # Test documentation
│   ├── unit/                       # Unit tests (future)
│   ├── integration/                # Integration tests (future)
│   └── e2e/                        # Playwright E2E tests
│       ├── home.test.ts
│       ├── booth-detail.test.ts
│       └── admin.test.ts
│
├── supabase/functions/unified-crawler/
│   ├── validation.test.ts
│   ├── validation.comprehensive.test.ts
│   ├── deduplication-engine.test.ts
│   ├── extractors.test.ts
│   ├── extractors.integration.test.ts
│   └── specialized-extractors.test.ts
│
├── vitest.config.ts                # Vitest configuration
├── playwright.config.ts            # Playwright configuration
└── .github/workflows/test.yml      # CI/CD pipeline
```

## Running Tests

### Unit Tests (Vitest)

For Next.js application code:

```bash
npm test                   # Run once
npm run test:watch         # Watch mode
npm run test:ui            # Interactive UI
npm run test:coverage      # With coverage report
```

Coverage thresholds: 80% lines, functions, branches, statements

### Deno Tests (Crawler)

For Supabase Edge Functions:

```bash
npm run test:deno          # Run all Deno tests
npm run test:deno:watch    # Watch mode
```

Or directly:
```bash
cd supabase/functions/unified-crawler
deno test --allow-net --allow-env
```

### E2E Tests (Playwright)

```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Interactive UI with time-travel
npm run test:e2e:debug     # Debug mode (step-through)
```

Generate report:
```bash
npx playwright show-report
```

### All Tests

```bash
npm run test:all           # Run all test suites sequentially
npm run test:ci            # CI mode (with coverage)
```

## Test Coverage Report

After running tests with coverage:

```bash
npm run test:coverage
open coverage/index.html
```

Coverage reports include:
- Line coverage
- Function coverage
- Branch coverage
- Statement coverage
- Detailed file-by-file breakdown

## Writing Tests

### Deno Test Example

```typescript
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { myFunction } from "./my-module.ts";

Deno.test("should do something", () => {
  const result = myFunction("input");
  assertEquals(result, "expected output");
});
```

### Vitest Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { myComponent } from '@/components/my-component';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const result = myComponent();
    expect(result).toBeTruthy();
  });
});
```

### Playwright Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should navigate to page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Expected Title/);
});
```

## CI/CD Integration

Tests run automatically on GitHub Actions:

- **On Push** - Full test suite runs on main/develop branches
- **On Pull Request** - Full test suite + build verification
- **Nightly** - Scheduled comprehensive test run at 2 AM UTC

### CI Jobs

1. **unit-tests** - Vitest tests with coverage
2. **deno-tests** - Crawler function tests
3. **e2e-tests** - Playwright browser tests
4. **lint** - ESLint and TypeScript checks
5. **build** - Next.js build verification
6. **test-summary** - Aggregate results

### Required Secrets

Configure in GitHub repository settings:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
CODECOV_TOKEN (optional)
VERCEL_TOKEN (optional)
VERCEL_ORG_ID (optional)
VERCEL_PROJECT_ID (optional)
```

## Debugging

### Vitest

```bash
# Interactive UI
npm run test:ui

# Debug specific test
npm test -- --reporter=verbose validation

# Run single test file
npm test tests/unit/my-test.test.ts
```

### Playwright

```bash
# Debug mode (step through)
npm run test:e2e:debug

# UI mode (time-travel debugging)
npm run test:e2e:ui

# Headed mode (see browser)
npx playwright test --headed

# Specific test
npx playwright test home.test.ts
```

### Deno

```bash
# Verbose output
deno test --allow-net --allow-env -- --verbose

# Filter tests
deno test --allow-net --allow-env --filter "validation"

# Watch mode
deno test --allow-net --allow-env --watch
```

## Best Practices

1. **Write Descriptive Test Names** - Test names should explain what is being tested
2. **Follow AAA Pattern** - Arrange, Act, Assert
3. **One Assertion Per Test** - Focus on single behavior
4. **Mock External Dependencies** - Keep tests fast and reliable
5. **Test Edge Cases** - Include error conditions
6. **Keep Tests Independent** - No test interdependencies
7. **Use Test Fixtures** - Reuse common test data
8. **Clean Up Resources** - Always clean up after tests

## Performance Targets

- Unit tests: < 10 seconds
- Integration tests: < 30 seconds
- E2E tests: < 2 minutes
- Full suite: < 5 minutes

## Troubleshooting

### Tests Failing Locally

1. Clear caches:
   ```bash
   rm -rf .vitest coverage node_modules/.cache
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Update Playwright:
   ```bash
   npx playwright install --with-deps
   ```

### Timeout Issues

Increase timeouts in configuration:

**vitest.config.ts**:
```typescript
test: {
  testTimeout: 30000, // 30 seconds
}
```

**playwright.config.ts**:
```typescript
timeout: 60000, // 60 seconds
```

### Flaky Tests

1. Add explicit waits
2. Use stable selectors
3. Mock time-dependent operations
4. Increase retry count in CI

## Future Enhancements

- [ ] Component tests for React components
- [ ] Visual regression testing
- [ ] Performance testing
- [ ] Load testing for crawler
- [ ] Mutation testing
- [ ] Contract testing for APIs
- [ ] Snapshot testing

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Deno Testing Guide](https://deno.land/manual/testing)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://testingjavascript.com/)
