# Validation System Guide

## Overview

The validation system provides comprehensive input validation and error handling for the unified crawler. It includes:

- **Custom error classes** with error codes for better debugging
- **API response validators** for Firecrawl and Anthropic APIs
- **Data validators** with security checks (SQL injection, XSS prevention)
- **Format validators** for URLs, phone numbers, coordinates
- **Automatic sanitization** of text fields

---

## Error Classes

### Base: CrawlerError

Base error class for all crawler errors. Includes error code, context, and timestamp.

```typescript
throw new CrawlerError(
  "Something went wrong",
  ErrorCode.UNKNOWN_ERROR,
  { source: "data-processor" }
);
```

### CrawlError

For crawling-related errors (network, timeouts, API failures).

```typescript
throw new CrawlError(
  "Failed to crawl URL",
  ErrorCode.CRAWL_NETWORK_ERROR,
  { url: "https://example.com", status: 503 }
);
```

### ValidationError

For validation failures with field information.

```typescript
throw new ValidationError(
  "Invalid email format",
  "email",
  ErrorCode.VALIDATION_INVALID_FORMAT,
  { provided: "notanemail" }
);
```

### ExtractionError

For data extraction failures.

```typescript
throw new ExtractionError(
  "Failed to parse booth data",
  ErrorCode.EXTRACTION_PARSE_ERROR,
  { page_url: "https://example.com/booths" }
);
```

### TimeoutError

For timeout-specific errors with duration tracking.

```typescript
throw new TimeoutError(
  "Operation timed out",
  30000,
  { operation: "scrape", url: "https://example.com" }
);
```

---

## Error Codes

### Crawl Errors (1xxx)

- `CRAWL_1001` - Timeout
- `CRAWL_1002` - Network error
- `CRAWL_1003` - Rate limit exceeded
- `CRAWL_1004` - Invalid URL
- `CRAWL_1005` - No content returned

### Validation Errors (2xxx)

- `VALIDATION_2001` - Missing required field
- `VALIDATION_2002` - Invalid format
- `VALIDATION_2003` - Value out of range
- `VALIDATION_2004` - HTML injection detected
- `VALIDATION_2005` - SQL injection detected
- `VALIDATION_2006` - Invalid URL
- `VALIDATION_2007` - Invalid phone number
- `VALIDATION_2008` - Invalid coordinates
- `VALIDATION_2009` - Field too long

### Extraction Errors (3xxx)

- `EXTRACTION_3001` - No booths found
- `EXTRACTION_3002` - Parse error
- `EXTRACTION_3003` - AI extraction error
- `EXTRACTION_3004` - Invalid response format

### API Errors (4xxx)

- `API_4001` - Firecrawl API error
- `API_4002` - Anthropic API error
- `API_4003` - Invalid API response
- `API_4004` - Missing required fields

### Database Errors (5xxx)

- `DB_5001` - Connection error
- `DB_5002` - Query error
- `DB_5003` - Upsert error

---

## Security Validators

### SQL Injection Detection

Detects common SQL injection patterns:

```typescript
import { detectSQLInjection } from "./validation.ts";

// Returns true if SQL injection detected
const isMalicious = detectSQLInjection("'; DROP TABLE booths; --");
// => true

const isSafe = detectSQLInjection("123 Main Street");
// => false
```

**Patterns detected:**
- SQL keywords: SELECT, INSERT, UPDATE, DELETE, DROP, etc.
- Comment markers: --, /*, */
- Stored procedure calls: xp_, sp_
- Boolean logic injection: OR 1=1, AND 1=1

### HTML Tag Detection & Stripping

Detects and removes HTML tags from text:

```typescript
import { hasHTMLTags, stripHTMLTags } from "./validation.ts";

// Check for HTML tags
hasHTMLTags("<script>alert('xss')</script>");
// => true

hasHTMLTags("Normal text");
// => false

// Strip HTML tags
stripHTMLTags("<b>Bold</b> text <script>bad()</script>");
// => "Bold text"
```

**Features:**
- Removes `<script>` tags and content
- Removes `<style>` tags and content
- Strips all other HTML tags
- Preserves text content

### Text Sanitization

Combines SQL injection and HTML checks:

```typescript
import { sanitizeText } from "./validation.ts";

const result = sanitizeText("<b>Main Street</b>", "address");
if (result.isValid) {
  console.log(result.sanitized); // "Main Street"
} else {
  console.error(result.error);
}

// Catches malicious input
const bad = sanitizeText("'; DROP TABLE--", "query");
// => { isValid: false, error: "query contains potential SQL injection" }
```

---

## Format Validators

### Coordinates

Validates latitude and longitude:

```typescript
import { validateCoordinates } from "./validation.ts";

// Valid coordinates
validateCoordinates(37.7749, -122.4194);
// => { isValid: true }

// Out of range
validateCoordinates(100, 50);
// => { isValid: false, error: "Latitude must be between -90 and 90 (got 100)" }

// Must provide both or neither
validateCoordinates(37.7749, null);
// => { isValid: false, error: "Both latitude and longitude must be provided together" }
```

**Ranges:**
- Latitude: -90 to 90
- Longitude: -180 to 180

### URLs

Validates URL format:

```typescript
import { validateURL } from "./validation.ts";

// Valid URL
validateURL("https://example.com/path?query=1");
// => { isValid: true, sanitized: "https://example.com/path?query=1" }

// Invalid protocol
validateURL("ftp://example.com");
// => { isValid: false, error: "URL must use HTTP or HTTPS protocol" }

// Malformed
validateURL("not a url");
// => { isValid: false, error: "Invalid URL format" }

// Optional field
validateURL(null);
// => { isValid: true }
```

### Phone Numbers

Validates international phone number format:

```typescript
import { validatePhoneNumber } from "./validation.ts";

// Valid formats
validatePhoneNumber("+1-555-123-4567");
// => { isValid: true, sanitized: "+1-555-123-4567" }

validatePhoneNumber("(555) 123-4567");
// => { isValid: true, sanitized: "(555) 123-4567" }

// Invalid - too short
validatePhoneNumber("12345");
// => { isValid: false, error: "Phone number must contain 7-15 digits" }

// Invalid - too long
validatePhoneNumber("+1234567890123456");
// => { isValid: false, error: "Phone number must contain 7-15 digits" }
```

**Requirements:**
- 7-15 digits (E.164 standard)
- Must start with + or digit
- Common separators allowed: spaces, dashes, parentheses, dots

---

## API Response Validators

### Firecrawl Crawl Response

Validates multi-page crawl responses:

```typescript
import { validateFirecrawlCrawlResponse } from "./validation.ts";

const response = await firecrawl.crawlUrl(url);
const validation = validateFirecrawlCrawlResponse(response);

if (!validation.isValid) {
  console.error(formatValidationErrors(validation.errors));
  throw new CrawlError("Invalid Firecrawl response", ErrorCode.API_INVALID_RESPONSE);
}
```

**Validates:**
- Response has `success` boolean field
- Successful responses have `data` array
- Each page has `html` or `markdown` content
- Failed responses have `error` message

### Firecrawl Scrape Response

Validates single-page scrape responses:

```typescript
import { validateFirecrawlScrapeResponse } from "./validation.ts";

const response = await firecrawl.scrapeUrl(url);
const validation = validateFirecrawlScrapeResponse(response);

if (!validation.isValid) {
  throw new CrawlError(
    formatValidationErrors(validation.errors),
    ErrorCode.API_INVALID_RESPONSE
  );
}
```

**Validates:**
- Response has `success` boolean field
- Successful responses have `html` or `markdown`
- Failed responses have `error` message

### Anthropic Response

Validates AI extraction responses:

```typescript
import { validateAnthropicResponse } from "./validation.ts";

const response = await anthropic.messages.create({ ... });
const validation = validateAnthropicResponse(response);

if (!validation.isValid) {
  throw new ExtractionError(
    formatValidationErrors(validation.errors),
    ErrorCode.API_INVALID_RESPONSE
  );
}
```

**Validates:**
- Required fields: `id`, `type`, `role`, `content`, `model`
- Content is array of content blocks
- Each content block has valid `type` (text or tool_use)
- Tool use blocks have `id`, `name`, `input`
- Usage tokens are numbers

---

## Booth Data Validation

### Single Booth

Comprehensive validation with automatic sanitization:

```typescript
import { validateBoothData } from "./validation.ts";

const booth: BoothData = {
  name: "Photo Booth Shop",
  address: "123 Main St",
  country: "United States",
  city: "San Francisco",
  latitude: 37.7749,
  longitude: -122.4194,
  website: "https://example.com",
  phone: "+1-555-123-4567",
  status: "active",
  source_url: "https://source.com/booth-123",
  source_name: "Example Source",
};

const result = validateBoothData(booth);

if (!result.isValid) {
  console.error("Validation errors:");
  result.errors.forEach(err => {
    console.error(`  [${err.field}] ${err.code}: ${err.message}`);
  });
}

if (result.warnings) {
  console.warn("Warnings:", result.warnings);
}
```

**Validates:**

**Required fields:**
- `name` (max 200 chars)
- `address` (max 300 chars)
- `country`
- `source_url` (valid URL)
- `status` (active/inactive/unverified)

**Optional fields:**
- `city` (sanitized)
- `description` (sanitized, warning if >2000 chars)
- `latitude` (-90 to 90)
- `longitude` (-180 to 180)
- `website` (valid URL)
- `phone` (7-15 digits)
- `photos` (array of valid URLs)

**Security checks:**
- SQL injection detection
- HTML tag detection and removal
- Automatic text sanitization

### Batch Validation

Validate multiple booths efficiently:

```typescript
import { validateBoothBatch } from "./validation.ts";

const booths: BoothData[] = [ /* ... */ ];
const { valid, invalid } = validateBoothBatch(booths);

console.log(`Valid: ${valid.length}, Invalid: ${invalid.length}`);

// Process valid booths
for (const booth of valid) {
  await upsertBooth(booth);
}

// Log invalid booths
for (const { booth, errors } of invalid) {
  console.error(`Failed to validate: ${booth.name}`);
  console.error(formatValidationErrors(errors));
}
```

---

## Example Error Messages

### Validation Errors

```
VALIDATION_2001 [name]: Booth name is required
VALIDATION_2004 [address]: address contains excessive HTML markup
VALIDATION_2005 [description]: description contains potential SQL injection
VALIDATION_2006 [website]: URL must use HTTP or HTTPS protocol
VALIDATION_2007 [phone]: Phone number must contain 7-15 digits
VALIDATION_2008 [coordinates]: Latitude must be between -90 and 90 (got 100)
VALIDATION_2009 [name]: Booth name must be 200 characters or less
```

### API Errors

```
API_4001: Firecrawl scrape failed after retries: Network timeout
API_4003: Firecrawl response missing 'success' field
API_4004: Anthropic response missing required field: content
```

### Crawl Errors

```
CRAWL_1001: Operation timed out after 30000ms
CRAWL_1002: Failed to crawl URL: Connection refused
CRAWL_1004: Invalid URL format: not-a-url
CRAWL_1005: No content returned from scrape
```

---

## Error Formatting Utilities

### Format Validation Errors

```typescript
import { formatValidationErrors } from "./validation.ts";

const errors: ValidationError[] = [ /* ... */ ];
const formatted = formatValidationErrors(errors);
console.error(formatted);

// Output:
// VALIDATION_2001 [name]: Booth name is required
// VALIDATION_2006 [website]: Invalid URL format
```

### Get Error Summary

```typescript
import { getErrorSummary } from "./validation.ts";

const errors: ValidationError[] = [ /* ... */ ];
const summary = getErrorSummary(errors);

console.log(summary);
// {
//   "VALIDATION_2001": 3,
//   "VALIDATION_2006": 2,
//   "VALIDATION_2008": 1
// }
```

---

## Integration Example

Complete example showing validation in a crawler function:

```typescript
import {
  validateFirecrawlCrawlResponse,
  validateBoothBatch,
  CrawlError,
  ErrorCode,
  formatValidationErrors,
} from "./validation.ts";

async function crawlAndValidate(url: string) {
  // Crawl with Firecrawl
  const crawlResponse = await firecrawl.crawlUrl(url);

  // Validate API response
  const apiValidation = validateFirecrawlCrawlResponse(crawlResponse);
  if (!apiValidation.isValid) {
    throw new CrawlError(
      `Invalid Firecrawl response: ${formatValidationErrors(apiValidation.errors)}`,
      ErrorCode.API_INVALID_RESPONSE,
      { url }
    );
  }

  if (!crawlResponse.success) {
    throw new CrawlError(
      `Crawl failed: ${crawlResponse.error}`,
      ErrorCode.API_FIRECRAWL_ERROR,
      { url }
    );
  }

  // Extract booths (example)
  const booths = await extractBooths(crawlResponse.data);

  // Validate booth data
  const { valid, invalid } = validateBoothBatch(booths);

  // Log invalid booths
  for (const { booth, errors } of invalid) {
    console.warn(`❌ Invalid booth: ${booth.name}`);
    console.warn(formatValidationErrors(errors));
  }

  console.log(`✅ Valid booths: ${valid.length}`);
  console.log(`❌ Invalid booths: ${invalid.length}`);

  // Process valid booths
  await upsertBooths(valid);

  return {
    total: booths.length,
    valid: valid.length,
    invalid: invalid.length,
  };
}
```

---

## Best Practices

### 1. Always Validate API Responses

```typescript
// ✅ Good
const response = await firecrawl.crawlUrl(url);
const validation = validateFirecrawlCrawlResponse(response);
if (!validation.isValid) {
  throw new CrawlError(...);
}

// ❌ Bad
const response = await firecrawl.crawlUrl(url);
// Assume response is valid
const data = response.data;
```

### 2. Use Batch Validation

```typescript
// ✅ Good - efficient
const { valid, invalid } = validateBoothBatch(booths);

// ❌ Bad - inefficient
for (const booth of booths) {
  const result = validateBoothData(booth);
  if (result.isValid) {
    valid.push(booth);
  }
}
```

### 3. Include Error Context

```typescript
// ✅ Good
throw new CrawlError(
  "Failed to scrape page",
  ErrorCode.CRAWL_NETWORK_ERROR,
  { url, status: 503, retry_count: 3 }
);

// ❌ Bad
throw new Error("Failed to scrape page");
```

### 4. Log Validation Errors

```typescript
// ✅ Good
for (const { booth, errors } of invalid) {
  console.warn(`Invalid: ${booth.name}`);
  console.warn(formatValidationErrors(errors));

  // Track metrics
  const summary = getErrorSummary(errors);
  trackValidationMetrics(summary);
}

// ❌ Bad
console.log(`${invalid.length} invalid booths`);
```

### 5. Sanitize Early

```typescript
// ✅ Good - validation sanitizes automatically
const result = validateBoothData(booth);
if (result.isValid) {
  // booth.name, booth.address already sanitized
  await saveBooth(booth);
}

// ❌ Bad - manual sanitization
booth.name = stripHTMLTags(booth.name);
booth.address = stripHTMLTags(booth.address);
```

---

## Testing Validation

### Unit Test Examples

```typescript
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import {
  detectSQLInjection,
  validateURL,
  validatePhoneNumber,
  validateCoordinates,
} from "./validation.ts";

Deno.test("SQL injection detection", () => {
  assertEquals(detectSQLInjection("'; DROP TABLE--"), true);
  assertEquals(detectSQLInjection("Normal text"), false);
});

Deno.test("URL validation", () => {
  const result = validateURL("https://example.com");
  assertEquals(result.isValid, true);

  const bad = validateURL("not-a-url");
  assertEquals(bad.isValid, false);
});

Deno.test("Phone validation", () => {
  const result = validatePhoneNumber("+1-555-123-4567");
  assertEquals(result.isValid, true);

  const bad = validatePhoneNumber("123");
  assertEquals(bad.isValid, false);
});

Deno.test("Coordinate validation", () => {
  const result = validateCoordinates(37.7749, -122.4194);
  assertEquals(result.isValid, true);

  const bad = validateCoordinates(100, 50);
  assertEquals(bad.isValid, false);
});
```

---

## Troubleshooting

### Common Issues

**Issue:** Booth validation fails with "html_tags_detected"
**Solution:** The name or address contains HTML. Use `stripHTMLTags()` or check the data source.

**Issue:** Validation fails with "invalid_country"
**Solution:** Ensure country is standardized using `validateCountry()` before booth validation.

**Issue:** Coordinates validation fails
**Solution:** Ensure both latitude and longitude are provided, or both are null. Check ranges.

**Issue:** Phone number validation fails
**Solution:** Ensure 7-15 digits. International format preferred: `+1-555-123-4567`

**Issue:** Too many validation errors
**Solution:** Use `getErrorSummary()` to identify common issues. Fix at the source.

---

## Performance Considerations

1. **Batch validation is faster** - Use `validateBoothBatch()` for multiple booths
2. **Sanitization is in-place** - `validateBoothData()` modifies the booth object
3. **Early validation saves API calls** - Validate before expensive operations
4. **Error tracking is lightweight** - Minimal overhead for error objects

---

## Changelog

### v1.0.0 (2025-01-26)

- Initial release
- Custom error classes with error codes
- API response validators for Firecrawl and Anthropic
- Comprehensive booth data validation
- Security validators (SQL injection, HTML tags)
- Format validators (URLs, phone numbers, coordinates)
- Automatic text sanitization
- Batch validation support
- Error formatting utilities
