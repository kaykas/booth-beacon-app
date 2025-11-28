# Validation Quick Reference

## Import

```typescript
import {
  // Error Classes
  CrawlError,
  ValidationError,
  ExtractionError,
  TimeoutError,
  ErrorCode,

  // Security
  detectSQLInjection,
  stripHTMLTags,
  sanitizeText,

  // Formats
  validateURL,
  validatePhoneNumber,
  validateCoordinates,

  // API Validators
  validateFirecrawlCrawlResponse,
  validateFirecrawlScrapeResponse,
  validateAnthropicResponse,

  // Data Validators
  validateBoothData,
  validateBoothBatch,

  // Utilities
  formatValidationErrors,
  getErrorSummary,
} from "./validation.ts";
```

---

## Error Codes Cheat Sheet

| Code | Category | Description |
|------|----------|-------------|
| `CRAWL_1001` | Timeout | Operation timed out |
| `CRAWL_1002` | Network | Network/connection error |
| `CRAWL_1003` | Rate Limit | API rate limit exceeded |
| `CRAWL_1004` | URL | Invalid URL format |
| `CRAWL_1005` | Content | No content returned |
| `VALIDATION_2001` | Required | Missing required field |
| `VALIDATION_2002` | Format | Invalid format |
| `VALIDATION_2003` | Range | Value out of range |
| `VALIDATION_2004` | Security | HTML injection detected |
| `VALIDATION_2005` | Security | SQL injection detected |
| `VALIDATION_2006` | URL | Invalid URL |
| `VALIDATION_2007` | Phone | Invalid phone number |
| `VALIDATION_2008` | Coords | Invalid coordinates |
| `VALIDATION_2009` | Length | Field too long |
| `EXTRACTION_3001` | Data | No booths found |
| `EXTRACTION_3002` | Parse | Parse error |
| `EXTRACTION_3003` | AI | AI extraction error |
| `EXTRACTION_3004` | Format | Invalid response format |
| `API_4001` | Firecrawl | Firecrawl API error |
| `API_4002` | Anthropic | Anthropic API error |
| `API_4003` | Response | Invalid API response |
| `API_4004` | Fields | Missing required fields |
| `DB_5001` | Database | Connection error |
| `DB_5002` | Database | Query error |
| `DB_5003` | Database | Upsert error |

---

## Common Patterns

### Validate Firecrawl Response

```typescript
const result = await firecrawl.crawlUrl(url);
const validation = validateFirecrawlCrawlResponse(result);

if (!validation.isValid) {
  throw new CrawlError(
    formatValidationErrors(validation.errors),
    ErrorCode.API_INVALID_RESPONSE
  );
}
```

### Validate Booth Batch

```typescript
const { valid, invalid } = validateBoothBatch(booths);

// Process valid
for (const booth of valid) {
  await upsertBooth(booth);
}

// Log invalid
for (const { booth, errors } of invalid) {
  console.warn(`${booth.name}: ${formatValidationErrors(errors)}`);
}
```

### Throw Custom Error

```typescript
throw new CrawlError(
  "Failed to scrape URL",
  ErrorCode.CRAWL_NETWORK_ERROR,
  { url, status: 503, retries: 3 }
);
```

### Check Security

```typescript
// SQL Injection
if (detectSQLInjection(input)) {
  throw new ValidationError(
    "SQL injection detected",
    "input",
    ErrorCode.VALIDATION_2005
  );
}

// Sanitize Text
const result = sanitizeText(input, "fieldName");
if (!result.isValid) {
  throw new ValidationError(result.error!, "fieldName");
}
const cleaned = result.sanitized;
```

---

## Validation Rules

### Required Fields
- `name` - max 200 chars
- `address` - max 300 chars
- `country` - non-empty
- `source_url` - valid URL
- `status` - active/inactive/unverified

### Optional Fields
- `city` - sanitized
- `description` - max 2000 chars (warning)
- `latitude` - -90 to 90
- `longitude` - -180 to 180
- `website` - valid URL
- `phone` - 7-15 digits
- `photos` - array of URLs

### Security Checks
- ✅ SQL injection detection
- ✅ HTML tag stripping
- ✅ XSS prevention
- ✅ Field length limits

---

## Format Rules

### URLs
- Must use HTTP or HTTPS
- Must be valid URL format

### Phone Numbers
- 7-15 digits (E.164)
- Must start with + or digit
- Separators allowed: space, dash, parens, dots

### Coordinates
- Latitude: -90 to 90
- Longitude: -180 to 180
- Both or neither required

---

## Error Handling

```typescript
try {
  await crawlAndProcess(url);
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error(`Timeout: ${error.timeoutMs}ms`);
    console.error(error.context);
  } else if (error instanceof ValidationError) {
    console.error(`Validation: [${error.field}] ${error.message}`);
    console.error(`Code: ${error.code}`);
  } else if (error instanceof CrawlError) {
    console.error(`Crawl: ${error.message}`);
    console.error(`Code: ${error.code}`);
    console.error(error.context);
  }
}
```

---

## Testing Snippets

### Test SQL Injection

```typescript
assertEquals(detectSQLInjection("'; DROP TABLE--"), true);
assertEquals(detectSQLInjection("Normal text"), false);
```

### Test URL Validation

```typescript
const result = validateURL("https://example.com");
assertEquals(result.isValid, true);
```

### Test Booth Validation

```typescript
const booth: BoothData = {
  name: "Test Booth",
  address: "123 Main St",
  country: "United States",
  status: "active",
  source_url: "https://example.com",
  source_name: "Test",
};

const result = validateBoothData(booth);
assertEquals(result.isValid, true);
```

---

## Tips

1. **Always validate API responses** before processing
2. **Use batch validation** for multiple booths
3. **Include error context** in custom errors
4. **Log validation errors** with `formatValidationErrors()`
5. **Track error patterns** with `getErrorSummary()`
6. **Sanitize early** - validation does it automatically
7. **Check security** - SQL injection and HTML tags
8. **Test validation** - unit tests for validators

---

## Debug Checklist

When validation fails:

- [ ] Check error code for category (VALIDATION_2xxx, etc.)
- [ ] Read error message for specific issue
- [ ] Check `field` property for which field failed
- [ ] Review `context` for additional details
- [ ] Use `formatValidationErrors()` for readable output
- [ ] Use `getErrorSummary()` to identify patterns
- [ ] Check validation guide for examples
- [ ] Review security checks if 2004/2005 error
- [ ] Verify format if 2006/2007/2008 error
- [ ] Check field length if 2009 error

---

## Performance Tips

1. **Batch validation** - Faster than individual
2. **Early validation** - Before expensive operations
3. **In-memory checks** - No database calls
4. **Cached patterns** - Regex compiled once
5. **Efficient sanitization** - Single pass

---

## Common Mistakes

❌ **Don't:** Validate after database insert
✅ **Do:** Validate before processing

❌ **Don't:** Catch all errors as generic Error
✅ **Do:** Use specific error classes

❌ **Don't:** Skip API response validation
✅ **Do:** Always validate API responses

❌ **Don't:** Ignore validation warnings
✅ **Do:** Log and track warnings

❌ **Don't:** Manual sanitization
✅ **Do:** Use `sanitizeText()` or `validateBoothData()`

---

## Links

- Full Guide: [VALIDATION_GUIDE.md](./VALIDATION_GUIDE.md)
- Summary: [VALIDATION_SUMMARY.md](./VALIDATION_SUMMARY.md)
- Source Code: [validation.ts](./validation.ts)
