# Validation System Implementation Summary

## Files Created

### 1. validation.ts (1,100+ lines)
**Location:** `/Users/jkw/Projects/booth-beacon/supabase/functions/unified-crawler/validation.ts`

Comprehensive validation module with:

#### Custom Error Classes
- `CrawlerError` - Base error class with error codes, context, and timestamps
- `CrawlError` - For crawling failures (network, timeouts, API)
- `ValidationError` - For validation failures with field tracking
- `ExtractionError` - For data extraction failures
- `TimeoutError` - For timeout-specific errors with duration tracking

#### Error Codes (30+ codes)
- **1xxx** - Crawl errors (timeout, network, rate limit, etc.)
- **2xxx** - Validation errors (missing fields, invalid format, injection attempts)
- **3xxx** - Extraction errors (no data, parse errors, AI failures)
- **4xxx** - API errors (Firecrawl, Anthropic, invalid responses)
- **5xxx** - Database errors (connection, query, upsert)

#### Security Validators
- `detectSQLInjection()` - Detects SQL injection patterns
- `hasHTMLTags()` - Detects HTML/script tags
- `stripHTMLTags()` - Removes HTML tags safely
- `sanitizeText()` - Combines SQL and HTML checks

**SQL Injection Patterns Detected:**
- SQL keywords (SELECT, INSERT, UPDATE, DELETE, DROP, etc.)
- Comment markers (--, /*, */)
- Stored procedure calls (xp_, sp_)
- Boolean logic injection (OR 1=1, AND 1=1)

#### Format Validators
- `validateLatitude()` - Validates lat (-90 to 90)
- `validateLongitude()` - Validates lng (-180 to 180)
- `validateCoordinates()` - Validates both together
- `validateURL()` - Validates HTTP/HTTPS URLs
- `validatePhoneNumber()` - Validates international phone format (7-15 digits)

#### API Response Validators
- `validateFirecrawlCrawlResponse()` - Validates multi-page crawl responses
- `validateFirecrawlScrapeResponse()` - Validates single-page scrape responses
- `validateAnthropicResponse()` - Validates AI extraction responses

**Firecrawl Validation:**
- Checks for `success` boolean
- Validates `data` array structure
- Ensures pages have `html` or `markdown`
- Validates error messages

**Anthropic Validation:**
- Checks required fields (id, type, role, content, model)
- Validates content block structure
- Checks tool_use format (id, name, input)
- Validates usage tokens

#### Booth Data Validators
- `validateBoothData()` - Comprehensive single booth validation
- `validateBoothBatch()` - Efficient batch validation

**Validates:**
- Required fields (name, address, country, source_url, status)
- Field length limits (name: 200, address: 300, description: 2000)
- Text sanitization (SQL injection, HTML tags)
- Coordinate ranges
- URL format (website, source_url, photos)
- Phone number format
- Status enum (active/inactive/unverified)

#### Error Formatting
- `formatValidationErrors()` - Formats errors for logging
- `getErrorSummary()` - Groups errors by code

---

### 2. VALIDATION_GUIDE.md (600+ lines)
**Location:** `/Users/jkw/Projects/booth-beacon/supabase/functions/unified-crawler/VALIDATION_GUIDE.md`

Comprehensive documentation with:
- Error class usage examples
- Error code reference
- Security validator examples
- Format validator examples
- API response validator examples
- Booth validation examples
- Example error messages
- Integration examples
- Best practices
- Testing examples
- Troubleshooting guide

---

## Changes to Existing Files

### index.ts Updates

#### 1. Added Imports (Lines 114-128)
```typescript
import {
  validateFirecrawlCrawlResponse,
  validateFirecrawlScrapeResponse,
  validateAnthropicResponse,
  validateBoothData,
  validateBoothBatch,
  CrawlError,
  ValidationError,
  ExtractionError,
  TimeoutError,
  ErrorCode,
  formatValidationErrors,
  getErrorSummary,
} from "./validation.ts";
```

#### 2. Enhanced Error Response (Lines 294-329)
- Improved error handling in main catch block
- Returns structured error with error_code and context
- Detects custom error types (CrawlerError, ValidationError, etc.)

**Before:**
```typescript
return new Response(JSON.stringify({
  success: false,
  error: err.message,
  stack: err.stack,
}), { status: 500 });
```

**After:**
```typescript
let errorResponse = {
  success: false,
  error: err.message,
  error_code: error.code,
  context: error.context,
  stack: error.stack,
};
```

#### 3. Firecrawl Crawl Validation (Lines 653-661)
Added validation for multi-page crawl responses:

```typescript
// Validate Firecrawl response
const validationResult = validateFirecrawlCrawlResponse(crawlResult);
if (!validationResult.isValid) {
  const errorMsg = formatValidationErrors(validationResult.errors);
  console.error(`❌ Batch #${batchNumber} invalid response:`, errorMsg);
  await logger.logBatch(batchNumber, "crawl", "error", {
    metadata: { validation_errors: errorMsg }
  });
  allErrors.push(`Batch ${batchNumber} validation failed: ${errorMsg}`);
  break;
}
```

#### 4. Firecrawl Scrape Validation (Lines 840-866)
Added validation for single-page scrape responses with custom errors:

```typescript
// Validate Firecrawl scrape response
const validationResult = validateFirecrawlScrapeResponse(scrapeResult);
if (!validationResult.isValid) {
  const errorMsg = formatValidationErrors(validationResult.errors);
  throw new CrawlError(
    `Firecrawl scrape response validation failed: ${errorMsg}`,
    ErrorCode.API_INVALID_RESPONSE,
    { source_url: source.source_url }
  );
}
```

#### 5. Booth Validation Overhaul (Lines 925-943)
Replaced simple validation with comprehensive batch validation:

**Before:**
```typescript
const validBooths: BoothData[] = [];
for (const booth of booths) {
  const validation = validateBooth(booth);
  if (!validation.isValid) {
    console.warn(`❌ Validation failed: ${booth.name} - ${validation.reason}`);
    continue;
  }
  validBooths.push(booth);
}
```

**After:**
```typescript
console.log(`\n🔍 Validating ${booths.length} booths...`);
const { valid: validBooths, invalid: invalidBooths } = validateBoothBatch(booths);

// Track validation results
for (const { booth, errors } of invalidBooths) {
  const errorSummary = getErrorSummary(errors);
  const primaryError = Object.keys(errorSummary)[0] || "unknown_error";
  trackValidationResult(validationMetrics, false, primaryError);

  console.warn(`   ❌ Validation failed: ${booth.name}`);
  console.warn(`      Errors: ${formatValidationErrors(errors)}`);
}

console.log(`   ✅ Valid: ${validBooths.length}, ❌ Invalid: ${invalidBooths.length}`);
```

#### 6. Removed Old Validation Function (Lines 1213-1221)
Replaced inline `validateBooth()` function with comprehensive module validation:

```typescript
/**
 * Note: Booth validation now handled by comprehensive validateBoothData()
 * from validation.ts module. This includes:
 * - Security checks (SQL injection, HTML tags)
 * - Field length validation
 * - Format validation (URLs, phone numbers, coordinates)
 * - Country validation (via validateCountry())
 * - Automatic sanitization of text fields
 */
```

---

## Validation Rules Added

### Required Fields
1. **name** - Non-empty, max 200 chars, sanitized
2. **address** - Non-empty, max 300 chars, sanitized
3. **country** - Non-empty string
4. **source_url** - Valid HTTP/HTTPS URL
5. **status** - Must be "active", "inactive", or "unverified"

### Optional Fields (when provided)
1. **city** - Sanitized text
2. **description** - Sanitized text, max 2000 chars (warning)
3. **latitude** - Number between -90 and 90
4. **longitude** - Number between -180 and 180
5. **website** - Valid HTTP/HTTPS URL
6. **phone** - 7-15 digits, international format
7. **photos** - Array of valid URLs

### Security Checks
1. **SQL Injection** - Detects SQL keywords, comments, boolean injection
2. **HTML Tags** - Detects and strips HTML/script tags
3. **XSS Prevention** - Removes dangerous markup
4. **Field Length** - Prevents buffer overflow attacks

### Automatic Sanitization
- Text fields automatically stripped of HTML
- URLs trimmed and validated
- Phone numbers trimmed
- Coordinates type-checked

---

## Example Error Messages

### Before Validation System
```
❌ Validation failed: Photo Booth NYC - missing_address
```

### After Validation System
```
❌ Validation failed: Photo Booth NYC
   Errors: VALIDATION_2001 [address]: Booth address is required
           VALIDATION_2006 [website]: URL must use HTTP or HTTPS protocol
           VALIDATION_2008 [coordinates]: Latitude must be between -90 and 90 (got 100)
```

---

## Benefits

### 1. Security
- **SQL Injection Protection** - Prevents database attacks
- **XSS Prevention** - Removes dangerous HTML/scripts
- **Input Sanitization** - Cleans all text fields

### 2. Data Quality
- **Format Validation** - Ensures URLs, phone numbers, coordinates are valid
- **Length Limits** - Prevents database errors and performance issues
- **Required Fields** - Ensures data completeness

### 3. Debugging
- **Error Codes** - Unique codes for each error type
- **Error Context** - Additional data for debugging
- **Error Summaries** - Groups errors by type
- **Timestamps** - Tracks when errors occurred

### 4. API Reliability
- **Response Validation** - Catches malformed API responses early
- **Structure Checks** - Ensures required fields are present
- **Type Safety** - Validates data types

### 5. Maintainability
- **Centralized Validation** - Single source of truth
- **Reusable Functions** - Use across different extractors
- **Comprehensive Docs** - Easy to understand and extend
- **Test Examples** - Shows how to test validation

---

## Usage Examples

### Validate API Response
```typescript
const crawlResult = await firecrawl.crawlUrl(url);
const validation = validateFirecrawlCrawlResponse(crawlResult);

if (!validation.isValid) {
  throw new CrawlError(
    formatValidationErrors(validation.errors),
    ErrorCode.API_INVALID_RESPONSE
  );
}
```

### Validate Booth Data
```typescript
const { valid, invalid } = validateBoothBatch(booths);

console.log(`✅ Valid: ${valid.length}, ❌ Invalid: ${invalid.length}`);

for (const { booth, errors } of invalid) {
  console.warn(`${booth.name}: ${formatValidationErrors(errors)}`);
}
```

### Handle Errors with Context
```typescript
try {
  const result = await scrapeUrl(url);
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error(`Timeout after ${error.timeoutMs}ms`);
  } else if (error instanceof CrawlError) {
    console.error(`${error.code}: ${error.message}`, error.context);
  }
}
```

---

## Testing Recommendations

### Unit Tests
```typescript
Deno.test("SQL injection detection", () => {
  assertEquals(detectSQLInjection("'; DROP TABLE--"), true);
  assertEquals(detectSQLInjection("Normal text"), false);
});

Deno.test("Booth validation", () => {
  const booth = createValidBooth();
  const result = validateBoothData(booth);
  assertEquals(result.isValid, true);

  booth.name = ""; // Make invalid
  const badResult = validateBoothData(booth);
  assertEquals(badResult.isValid, false);
});
```

### Integration Tests
```typescript
Deno.test("Crawler with validation", async () => {
  const source = await createTestSource();
  const result = await processSourceImproved(source, ...);

  // Should filter out invalid booths
  assert(result.booths_added > 0);
  assert(result.validation_rate > 90);
});
```

---

## Migration Notes

### For Existing Code

1. **Import validation module:**
   ```typescript
   import { validateBoothData, ErrorCode } from "./validation.ts";
   ```

2. **Replace simple checks with validation:**
   ```typescript
   // Before
   if (!booth.name || !booth.address) {
     return { isValid: false };
   }

   // After
   const result = validateBoothData(booth);
   if (!result.isValid) {
     console.error(formatValidationErrors(result.errors));
   }
   ```

3. **Use custom errors:**
   ```typescript
   // Before
   throw new Error("Crawl failed");

   // After
   throw new CrawlError(
     "Crawl failed",
     ErrorCode.CRAWL_NETWORK_ERROR,
     { url, status }
   );
   ```

---

## Performance Impact

- **Negligible** - Validation is in-memory and fast
- **Batch validation** - More efficient than individual validation
- **Early failure** - Saves API calls and database operations
- **Automatic sanitization** - Happens during validation

---

## Future Enhancements

### Potential Additions
1. **Schema validation** - JSON schema for API responses
2. **Custom validators** - Allow registering custom validation rules
3. **Validation caching** - Cache validation results
4. **Async validators** - For database lookups (duplicate checking)
5. **Validation metrics** - Track validation performance
6. **Validation API** - Expose validation endpoint

### Integration Ideas
1. **Pre-commit hooks** - Validate booth data before commit
2. **API middleware** - Validate incoming requests
3. **CLI tool** - Validate booth data files
4. **Dashboard** - Visualize validation metrics

---

## Conclusion

The validation system adds:
- ✅ **1,100+ lines** of production-ready validation code
- ✅ **30+ error codes** for precise error tracking
- ✅ **5 custom error classes** for better error handling
- ✅ **10+ validators** for different data types
- ✅ **Security checks** (SQL injection, XSS)
- ✅ **API validation** (Firecrawl, Anthropic)
- ✅ **Comprehensive documentation** (600+ lines)
- ✅ **Example usage** and testing patterns

This significantly improves data quality, security, and maintainability of the booth-beacon crawler system.
