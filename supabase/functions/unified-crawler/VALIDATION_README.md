# Validation System

Comprehensive input validation and error handling for the booth-beacon unified crawler.

## 📋 Overview

The validation system provides:

- **Security** - SQL injection detection, XSS prevention, input sanitization
- **Data Quality** - Format validation, length checks, required field enforcement
- **Debugging** - Error codes, detailed context, structured logging
- **API Reliability** - Response validation for Firecrawl and Anthropic APIs
- **Type Safety** - Full TypeScript support with proper error types

## 🚀 Quick Start

```typescript
import {
  validateBoothBatch,
  validateFirecrawlCrawlResponse,
  CrawlError,
  ErrorCode,
  formatValidationErrors,
} from "./validation.ts";

// Validate API response
const crawlResult = await firecrawl.crawlUrl(url);
const validation = validateFirecrawlCrawlResponse(crawlResult);

if (!validation.isValid) {
  throw new CrawlError(
    formatValidationErrors(validation.errors),
    ErrorCode.API_INVALID_RESPONSE
  );
}

// Validate booth data
const { valid, invalid } = validateBoothBatch(booths);
console.log(`✅ Valid: ${valid.length}, ❌ Invalid: ${invalid.length}`);
```

## 📚 Documentation

- **[Quick Reference](./VALIDATION_QUICK_REF.md)** - Cheat sheet with common patterns
- **[Full Guide](./VALIDATION_GUIDE.md)** - Complete documentation with examples
- **[Summary](./VALIDATION_SUMMARY.md)** - Implementation details and changes

## 🔒 Security Features

### SQL Injection Detection
Detects and blocks SQL injection attempts:
```typescript
detectSQLInjection("'; DROP TABLE users--") // => true
```

### HTML/XSS Prevention
Strips dangerous HTML and scripts:
```typescript
stripHTMLTags("<script>alert('xss')</script>Bold text") // => "Bold text"
```

### Input Sanitization
Automatically cleans text fields:
```typescript
const result = sanitizeText("<b>Address</b>", "address");
// => { isValid: true, sanitized: "Address" }
```

## ✅ Validation Rules

### Booth Data

**Required:**
- `name` - max 200 chars, sanitized
- `address` - max 300 chars, sanitized
- `country` - non-empty
- `source_url` - valid HTTP/HTTPS URL
- `status` - active/inactive/unverified

**Optional (validated when provided):**
- `city` - sanitized text
- `description` - max 2000 chars
- `latitude` - -90 to 90
- `longitude` - -180 to 180
- `website` - valid URL
- `phone` - 7-15 digits
- `photos` - array of URLs

### API Responses

**Firecrawl:**
- Validates response structure
- Checks required fields (success, data/error)
- Validates page content (html or markdown)

**Anthropic:**
- Validates response structure
- Checks required fields (id, type, role, content, model)
- Validates content blocks and tool_use format

## 🏷️ Error Codes

| Code | Category | Example |
|------|----------|---------|
| **1xxx** | Crawl | `CRAWL_1001` - Timeout |
| **2xxx** | Validation | `VALIDATION_2005` - SQL injection |
| **3xxx** | Extraction | `EXTRACTION_3002` - Parse error |
| **4xxx** | API | `API_4001` - Firecrawl error |
| **5xxx** | Database | `DB_5002` - Query error |

[See full list in Quick Reference](./VALIDATION_QUICK_REF.md#error-codes-cheat-sheet)

## 🛠️ Error Classes

### CrawlError
For crawling failures:
```typescript
throw new CrawlError(
  "Failed to scrape URL",
  ErrorCode.CRAWL_NETWORK_ERROR,
  { url, status: 503 }
);
```

### ValidationError
For validation failures:
```typescript
throw new ValidationError(
  "Invalid phone format",
  "phone",
  ErrorCode.VALIDATION_INVALID_PHONE
);
```

### TimeoutError
For timeout-specific errors:
```typescript
throw new TimeoutError(
  "Operation timed out",
  30000,
  { operation: "scrape" }
);
```

## 📊 Usage in index.ts

The validation system is integrated into the crawler at key points:

### 1. API Response Validation
```typescript
// Validates Firecrawl responses before processing
const validation = validateFirecrawlCrawlResponse(crawlResult);
if (!validation.isValid) {
  // Handle validation errors
}
```

### 2. Booth Data Validation
```typescript
// Validates all extracted booths before database insert
const { valid, invalid } = validateBoothBatch(booths);

for (const { booth, errors } of invalid) {
  console.warn(`❌ ${booth.name}: ${formatValidationErrors(errors)}`);
}
```

### 3. Error Handling
```typescript
// Returns structured errors with codes and context
catch (error) {
  if (error instanceof CrawlerError) {
    return {
      error: error.message,
      error_code: error.code,
      context: error.context
    };
  }
}
```

## 🧪 Testing

```typescript
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { detectSQLInjection, validateURL } from "./validation.ts";

Deno.test("SQL injection detection", () => {
  assertEquals(detectSQLInjection("'; DROP TABLE--"), true);
  assertEquals(detectSQLInjection("Normal text"), false);
});

Deno.test("URL validation", () => {
  const result = validateURL("https://example.com");
  assertEquals(result.isValid, true);
});
```

## 📈 Benefits

### Security
- Prevents SQL injection attacks
- Blocks XSS attempts
- Sanitizes all user input
- Validates data before database operations

### Data Quality
- Enforces required fields
- Validates data formats
- Checks value ranges
- Maintains data consistency

### Debugging
- Unique error codes
- Detailed error context
- Structured error logging
- Error pattern tracking

### Maintainability
- Centralized validation logic
- Reusable validators
- Type-safe error handling
- Comprehensive documentation

## 🔧 Configuration

No configuration needed - just import and use!

All validators have sensible defaults:
- SQL injection patterns cover common attacks
- URL validation requires HTTP/HTTPS
- Phone numbers follow E.164 standard
- Coordinates use standard lat/lng ranges

## 📝 Example Workflows

### Crawl with Validation
```typescript
async function crawlWithValidation(url: string) {
  // 1. Crawl
  const result = await firecrawl.crawlUrl(url);

  // 2. Validate API response
  const validation = validateFirecrawlCrawlResponse(result);
  if (!validation.isValid) {
    throw new CrawlError(
      formatValidationErrors(validation.errors),
      ErrorCode.API_INVALID_RESPONSE
    );
  }

  // 3. Extract data
  const booths = await extractBooths(result.data);

  // 4. Validate booth data
  const { valid, invalid } = validateBoothBatch(booths);

  // 5. Log results
  console.log(`✅ Valid: ${valid.length}`);
  console.log(`❌ Invalid: ${invalid.length}`);

  // 6. Process valid booths
  await upsertBooths(valid);

  return { valid: valid.length, invalid: invalid.length };
}
```

### Error Handling
```typescript
try {
  await crawlWithValidation(url);
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error(`Timeout after ${error.timeoutMs}ms`);
    await scheduleRetry(url, error.context);
  } else if (error instanceof ValidationError) {
    console.error(`Validation failed: [${error.field}] ${error.message}`);
    await logValidationFailure(error);
  } else if (error instanceof CrawlError) {
    console.error(`Crawl failed: ${error.code} - ${error.message}`);
    await updateSourceStatus(url, "error", error);
  }
}
```

## 🤝 Contributing

When adding new validators:

1. Add error code to `ErrorCode` enum
2. Implement validator function
3. Add tests
4. Update documentation
5. Add examples to guide

When adding new error types:

1. Extend `CrawlerError` class
2. Add specific fields if needed
3. Override `toJSON()` if needed
4. Update error handling in index.ts

## 📖 API Reference

See [VALIDATION_GUIDE.md](./VALIDATION_GUIDE.md) for complete API documentation.

## ⚡ Performance

- **Fast** - In-memory validation, no database calls
- **Efficient** - Batch validation optimized
- **Lightweight** - Minimal overhead
- **Cached** - Regex patterns compiled once

## 🐛 Troubleshooting

**Issue:** Validation fails with HTML_INJECTION error
**Solution:** Use `stripHTMLTags()` to clean the data, or check the source

**Issue:** Phone validation fails
**Solution:** Ensure 7-15 digits, use international format: `+1-555-123-4567`

**Issue:** Coordinate validation fails
**Solution:** Check ranges (lat: -90 to 90, lng: -180 to 180), provide both or neither

See [VALIDATION_GUIDE.md](./VALIDATION_GUIDE.md#troubleshooting) for more help.

## 📦 Files

```
unified-crawler/
├── validation.ts              # Main validation module (1,100+ lines)
├── VALIDATION_README.md       # This file
├── VALIDATION_GUIDE.md        # Complete guide with examples
├── VALIDATION_QUICK_REF.md    # Quick reference cheat sheet
└── VALIDATION_SUMMARY.md      # Implementation summary
```

## 🎯 Next Steps

1. Read the [Quick Reference](./VALIDATION_QUICK_REF.md) for common patterns
2. Review the [Full Guide](./VALIDATION_GUIDE.md) for detailed examples
3. Check the [Summary](./VALIDATION_SUMMARY.md) for implementation details
4. Start using validators in your code!

## 📄 License

Same as booth-beacon project.

## ✨ Credits

Built for the booth-beacon unified crawler to improve data quality, security, and reliability.

---

**Last Updated:** 2025-01-26
**Version:** 1.0.0
