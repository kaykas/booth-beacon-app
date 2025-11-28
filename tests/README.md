# Testing Infrastructure

This project has comprehensive testing infrastructure covering unit tests, integration tests, and end-to-end tests.

## Test Structure

```
tests/
├── setup.ts                 # Vitest setup and global test configuration
├── unit/                    # Unit tests for utilities and components
├── integration/             # Integration tests for complex features
└── e2e/                     # End-to-end tests with Playwright
    ├── home.test.ts
    ├── booth-detail.test.ts
    └── admin.test.ts

supabase/functions/unified-crawler/
├── validation.test.ts                    # Basic validation tests
├── validation.comprehensive.test.ts       # Comprehensive validation tests
├── deduplication-engine.test.ts          # Deduplication logic tests
├── extractors.test.ts                    # Basic extractor tests
├── extractors.integration.test.ts        # Integration tests with sample data
└── specialized-extractors.test.ts        # Specialized extractor tests
```

## Running Tests

### All Tests
```bash
npm run test:all          # Run all test suites
npm run test:ci           # Run all tests with coverage (for CI)
```

### Unit Tests (Vitest)
```bash
npm test                  # Run unit tests once
npm run test:watch        # Run in watch mode
npm run test:ui           # Open Vitest UI
npm run test:coverage     # Run with coverage report
```

### Deno Tests (Crawler/Extractors)
```bash
npm run test:deno         # Run Deno tests once
npm run test:deno:watch   # Run in watch mode
```

Or directly with Deno:
```bash
cd supabase/functions/unified-crawler
deno test --allow-net --allow-env
```

### End-to-End Tests (Playwright)
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Open Playwright UI
npm run test:e2e:debug    # Run in debug mode
```

## Test Coverage

Coverage reports are generated in the `coverage/` directory.

To view the HTML coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

### Coverage Thresholds

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

## Writing Tests

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should render correctly', () => {
    // Test implementation
    expect(true).toBe(true);
  });
});
```

### Deno Tests

```typescript
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

Deno.test("my function works", () => {
  const result = myFunction();
  assertEquals(result, expectedValue);
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('page loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Expected Title/);
});
```

## Test Organization

### Unit Tests
- Test individual functions and utilities
- Mock external dependencies
- Fast execution
- High coverage

### Integration Tests
- Test feature workflows
- Use real implementations where possible
- Mock external APIs (Supabase, etc.)
- Test error handling

### E2E Tests
- Test critical user paths
- Run against real application
- Test across browsers
- Validate UI/UX

## CI/CD Integration

Tests run automatically on:
- Every push to main branch
- Every pull request
- Scheduled nightly runs

See `.github/workflows/test.yml` for CI configuration.

## Debugging Tests

### Vitest
```bash
npm run test:ui           # Interactive UI
npm run test:watch        # Watch mode with hot reload
```

### Playwright
```bash
npm run test:e2e:debug    # Step-by-step debugging
npm run test:e2e:ui       # Interactive UI with time travel
```

### Deno
```bash
deno test --inspect-brk --allow-net --allow-env
```

## Common Issues

### Tests Failing Locally

1. **Clear test cache**:
   ```bash
   rm -rf .vitest coverage
   npm run test:coverage
   ```

2. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Update Playwright browsers**:
   ```bash
   npx playwright install
   ```

### Deno Tests Not Running

Ensure Deno is installed:
```bash
curl -fsSL https://deno.land/install.sh | sh
```

### E2E Tests Timing Out

Increase timeout in `playwright.config.ts`:
```typescript
timeout: 60000, // Increase to 60 seconds
```

## Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests clearly
3. **One Assertion Per Test**: Focus on a single behavior
4. **Mock External Dependencies**: Keep tests fast and reliable
5. **Clean Up**: Always clean up resources after tests
6. **Test Edge Cases**: Include error handling tests
7. **Avoid Test Interdependence**: Each test should be independent

## Test Data

Test fixtures and sample data are located in:
- `tests/fixtures/` - Shared test data
- Test files themselves for simple test cases

## Performance

Target test execution times:
- Unit tests: < 10 seconds total
- Integration tests: < 30 seconds total
- E2E tests: < 2 minutes total
- Full suite: < 5 minutes total

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Deno Testing](https://deno.land/manual/testing)
- [Testing Library](https://testing-library.com/)
