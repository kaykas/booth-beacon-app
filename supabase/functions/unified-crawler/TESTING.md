# Unified Crawler Test Suite

## Overview

This test suite provides comprehensive coverage for critical crawler functions using Deno's built-in test framework.

## Test Files Created

### 1. `extractors.test.ts`
Tests for extraction utility functions:
- ✅ **cleanHtml**: Removes HTML tags, script tags, style tags, decodes entities
- ✅ **Coordinate extraction**: Validates lat/long parsing from text
- ✅ **Phone number extraction**: Tests various US phone formats
- ✅ **Address parsing**: Street address and city/state/ZIP patterns
- ✅ **Booth finalization**: Default values, required fields
- ✅ **Deduplication logic**: Name/address-based duplicate detection
- ✅ **Operational status**: Active/inactive booth detection
- ✅ **URL extraction**: Website link parsing

**Total Tests**: 26 test cases

### 2. `crawler-utilities.test.ts`
Tests for utility functions:
- ✅ **Content hashing (SHA-256)**: Deterministic hash generation
- ✅ **normalizeName**: Whitespace trimming, case normalization
- ✅ **Retry logic**: Exponential backoff, max attempts, delay caps
- ✅ **Validation metrics**: Tracking pass/fail rates, failure reasons
- ✅ **URL processing**: Duplicate detection, tracking

**Total Tests**: 30 test cases

### 3. `validation.test.ts`
Tests for booth validation:
- ✅ **validateBooth**: Accepts valid booths, rejects invalid
- ✅ **Country normalization**: US/USA/United States variants
- ✅ **Country inference**: Infer country from city names
- ✅ **HTML tag detection**: Prevents script injection
- ✅ **Length validation**: Name/address max lengths
- ✅ **Corrupted data detection**: HTML, URLs, encoded strings

**Total Tests**: 40 test cases

### 4. `specialized-extractors.test.ts`
Tests for specialized extractors:
- ✅ **photobooth-net-specialized**: Directory parsing, link extraction
- ✅ **autophoto-specialized**: Location extraction, address parsing
- ✅ **Mock fixtures**: HTML/markdown test data
- ✅ **Regex patterns**: Street addresses, city/state/ZIP, links
- ✅ **Integration tests**: End-to-end extractor validation
- ✅ **Error handling**: Empty input, malformed data

**Total Tests**: 35 test cases

## Running the Tests

### Prerequisites

Install Deno if not already installed:

```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# Using Homebrew (macOS)
brew install deno
```

### Run All Tests

```bash
cd /Users/jkw/Projects/booth-beacon/supabase/functions/unified-crawler

# Run all test files
deno test --allow-all

# Run specific test file
deno test extractors.test.ts --allow-all
deno test crawler-utilities.test.ts --allow-all
deno test validation.test.ts --allow-all
deno test specialized-extractors.test.ts --allow-all
```

### Run Tests with Coverage

```bash
# Generate coverage report
deno test --coverage=coverage --allow-all

# View coverage report
deno coverage coverage
```

### Run Tests in Watch Mode

```bash
# Automatically re-run tests on file changes
deno test --watch --allow-all
```

### Run Specific Test Cases

```bash
# Run tests matching a pattern
deno test --filter "cleanHtml" --allow-all

# Run tests from specific file with filter
deno test extractors.test.ts --filter "coordinate" --allow-all
```

## Test Coverage Summary

| Module | Test Cases | Coverage Focus |
|--------|-----------|----------------|
| **Extractors** | 26 | HTML cleaning, parsing, extraction utilities |
| **Crawler Utilities** | 30 | Hashing, retry logic, metrics tracking |
| **Validation** | 40 | Country validation, booth validation, data integrity |
| **Specialized Extractors** | 35 | Site-specific parsing, regex patterns, fixtures |
| **TOTAL** | **131** | Comprehensive crawler function coverage |

## Test Categories

### Unit Tests
- Individual function testing
- Input/output validation
- Edge case handling
- Error condition testing

### Integration Tests
- End-to-end extractor workflows
- Multi-step processing validation
- Data transformation pipelines

### Regression Tests
- Country normalization fixes
- HTML tag prevention
- Duplicate detection
- Data corruption prevention

## Key Testing Patterns

### 1. SHA-256 Content Hashing
```typescript
Deno.test("hashContent generates SHA-256 hash", async () => {
  const content = "test content";
  const hash = await hashContent(content);
  assertEquals(hash.length, 64); // SHA-256 = 64 hex chars
});
```

### 2. Retry with Exponential Backoff
```typescript
Deno.test("retryWithBackoff retries on failure", async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 2) throw new Error("temporary failure");
    return "success";
  };

  const result = await retryWithBackoff(fn, { maxAttempts: 3 });
  assertEquals(attempts, 2);
});
```

### 3. Country Validation & Normalization
```typescript
Deno.test("validateCountry accepts USA variant", () => {
  const result = validateCountry("USA");
  assertEquals(result.isValid, true);
  assertEquals(result.standardizedCountry, "United States");
});
```

### 4. Mock Fixtures for Specialized Extractors
```typescript
const PHOTOBOOTH_NET_MOCK_MARKDOWN = `
### United States
#### New York
[Grand Central Terminal](browse.php?ddState=36&locationID=101), New York
`;

Deno.test("parseMarkdownStructure extracts booth links", () => {
  const links = parseMarkdownStructure(PHOTOBOOTH_NET_MOCK_MARKDOWN);
  assertEquals(links.length, 1);
  assertEquals(links[0].name, "Grand Central Terminal");
});
```

## Common Test Scenarios

### Testing HTML Cleaning
- Script tag removal
- Style tag removal
- HTML entity decoding
- Whitespace normalization

### Testing Validation
- Required field checks
- Country name standardization
- HTML injection prevention
- Length constraints
- Data corruption detection

### Testing Extraction
- Coordinate parsing (lat/long)
- Phone number formats
- Address patterns
- City/State/ZIP parsing
- URL extraction

### Testing Metrics
- Pass/fail tracking
- Failure reason categorization
- Validation rate calculation
- Zero-division handling

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Crawler Functions

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      - name: Run tests
        run: |
          cd supabase/functions/unified-crawler
          deno test --allow-all --coverage=coverage
      - name: Generate coverage
        run: deno coverage coverage
```

## Troubleshooting

### Issue: "command not found: deno"
**Solution**: Install Deno using one of the methods in Prerequisites section

### Issue: "Permission denied"
**Solution**: Add `--allow-all` flag or specific permissions:
```bash
deno test --allow-read --allow-write --allow-net --allow-env
```

### Issue: "Module not found"
**Solution**: Ensure you're in the correct directory:
```bash
cd /Users/jkw/Projects/booth-beacon/supabase/functions/unified-crawler
```

### Issue: Tests timing out
**Solution**: Increase timeout for specific tests:
```typescript
Deno.test({
  name: "slow test",
  fn: async () => { /* ... */ },
  sanitizeOps: false,
  sanitizeResources: false,
});
```

## Next Steps

### Expand Test Coverage
1. Add tests for `deduplication-engine.ts`
2. Add tests for `enrichment.ts`
3. Add tests for AI extraction functions
4. Add tests for database operations (with mocking)

### Performance Testing
1. Benchmark extraction speed
2. Test with large datasets
3. Memory usage profiling
4. Concurrent extraction testing

### Integration Testing
1. End-to-end crawler workflows
2. Database integration tests
3. API endpoint testing
4. Error recovery scenarios

## Contributing

When adding new tests:
1. Follow existing test naming conventions
2. Include descriptive test names
3. Test both success and failure cases
4. Add edge case coverage
5. Update this README with new test counts

## References

- [Deno Testing Documentation](https://deno.land/manual/testing)
- [Deno Standard Library - Testing](https://deno.land/std/testing)
- [Test Coverage Best Practices](https://deno.land/manual/testing/coverage)
