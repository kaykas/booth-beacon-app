/**
 * VALIDATION MODULE
 *
 * Comprehensive input validation and error handling for the unified crawler.
 *
 * Features:
 * - Custom error classes with error codes
 * - API response validators (Firecrawl, Anthropic)
 * - Data validators with security checks
 * - SQL injection detection
 * - HTML tag stripping
 * - URL and phone number validation
 * - Coordinate validation
 */

import type {
  FirecrawlCrawlResult,
  FirecrawlScrapeResult,
  FirecrawlPage,
  AnthropicResponse,
  AnthropicContentBlock,
} from "./types.ts";
import type { BoothData } from "./extractors.ts";

// ============================================
// ERROR CODES
// ============================================

export enum ErrorCode {
  // Crawl errors (1xxx)
  CRAWL_TIMEOUT = "CRAWL_1001",
  CRAWL_NETWORK_ERROR = "CRAWL_1002",
  CRAWL_RATE_LIMIT = "CRAWL_1003",
  CRAWL_INVALID_URL = "CRAWL_1004",
  CRAWL_NO_CONTENT = "CRAWL_1005",

  // Validation errors (2xxx)
  VALIDATION_MISSING_FIELD = "VALIDATION_2001",
  VALIDATION_INVALID_FORMAT = "VALIDATION_2002",
  VALIDATION_OUT_OF_RANGE = "VALIDATION_2003",
  VALIDATION_HTML_INJECTION = "VALIDATION_2004",
  VALIDATION_SQL_INJECTION = "VALIDATION_2005",
  VALIDATION_INVALID_URL = "VALIDATION_2006",
  VALIDATION_INVALID_PHONE = "VALIDATION_2007",
  VALIDATION_INVALID_COORDINATES = "VALIDATION_2008",
  VALIDATION_FIELD_TOO_LONG = "VALIDATION_2009",

  // Extraction errors (3xxx)
  EXTRACTION_NO_BOOTHS = "EXTRACTION_3001",
  EXTRACTION_PARSE_ERROR = "EXTRACTION_3002",
  EXTRACTION_AI_ERROR = "EXTRACTION_3003",
  EXTRACTION_INVALID_RESPONSE = "EXTRACTION_3004",

  // API errors (4xxx)
  API_FIRECRAWL_ERROR = "API_4001",
  API_ANTHROPIC_ERROR = "API_4002",
  API_INVALID_RESPONSE = "API_4003",
  API_MISSING_FIELDS = "API_4004",

  // Database errors (5xxx)
  DB_CONNECTION_ERROR = "DB_5001",
  DB_QUERY_ERROR = "DB_5002",
  DB_UPSERT_ERROR = "DB_5003",

  // Generic errors
  UNKNOWN_ERROR = "ERROR_9999",
}

// ============================================
// CUSTOM ERROR CLASSES
// ============================================

/**
 * Base error class with error codes
 */
export class CrawlerError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "CrawlerError";
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CrawlerError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Crawl-specific errors
 */
export class CrawlError extends CrawlerError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.CRAWL_NETWORK_ERROR,
    context?: Record<string, unknown>
  ) {
    super(message, code, context);
    this.name = "CrawlError";
  }
}

/**
 * Validation-specific errors
 */
export class ValidationError extends CrawlerError {
  public readonly field?: string;

  constructor(
    message: string,
    field?: string,
    code: ErrorCode = ErrorCode.VALIDATION_INVALID_FORMAT,
    context?: Record<string, unknown>
  ) {
    super(message, code, context);
    this.name = "ValidationError";
    this.field = field;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}

/**
 * Extraction-specific errors
 */
export class ExtractionError extends CrawlerError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.EXTRACTION_PARSE_ERROR,
    context?: Record<string, unknown>
  ) {
    super(message, code, context);
    this.name = "ExtractionError";
  }
}

/**
 * Timeout-specific errors
 */
export class TimeoutError extends CrawlerError {
  public readonly timeoutMs: number;

  constructor(
    message: string,
    timeoutMs: number,
    context?: Record<string, unknown>
  ) {
    super(message, ErrorCode.CRAWL_TIMEOUT, context);
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      timeoutMs: this.timeoutMs,
    };
  }
}

// ============================================
// VALIDATION RESULT TYPES
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

// ============================================
// SECURITY VALIDATORS
// ============================================

/**
 * SQL injection detection patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /('|"|`)([\s\S]*?)(\1)([\s\S]*?)(OR|AND)/gi,
  /(\bOR\b|\bAND\b)[\s]+([\d]+)[\s]*=[\s]*([\d]+)/gi,
];

/**
 * Detect potential SQL injection attempts
 */
export function detectSQLInjection(value: string): boolean {
  if (!value || typeof value !== "string") return false;

  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * HTML tag detection pattern
 */
const HTML_TAG_PATTERN = /<[^>]+>/g;
const SCRIPT_TAG_PATTERN = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
const STYLE_TAG_PATTERN = /<style[\s\S]*?>[\s\S]*?<\/style>/gi;

/**
 * Detect HTML tags
 */
export function hasHTMLTags(value: string): boolean {
  if (!value || typeof value !== "string") return false;

  return HTML_TAG_PATTERN.test(value);
}

/**
 * Strip HTML tags from text
 */
export function stripHTMLTags(value: string): string {
  if (!value || typeof value !== "string") return value;

  return value
    .replace(SCRIPT_TAG_PATTERN, "")
    .replace(STYLE_TAG_PATTERN, "")
    .replace(HTML_TAG_PATTERN, "")
    .trim();
}

/**
 * Sanitize text input - removes HTML and checks for SQL injection
 */
export function sanitizeText(
  value: string,
  fieldName: string
): FieldValidationResult {
  if (!value || typeof value !== "string") {
    return { isValid: false, error: `${fieldName} must be a non-empty string` };
  }

  // Check for SQL injection
  if (detectSQLInjection(value)) {
    return {
      isValid: false,
      error: `${fieldName} contains potential SQL injection`,
    };
  }

  // Strip HTML tags
  const sanitized = stripHTMLTags(value);

  // Check if sanitization changed the value significantly
  if (hasHTMLTags(value) && sanitized.length < value.length * 0.5) {
    return {
      isValid: false,
      error: `${fieldName} contains excessive HTML markup`,
    };
  }

  return {
    isValid: true,
    sanitized: sanitized.trim(),
  };
}

// ============================================
// COORDINATE VALIDATORS
// ============================================

/**
 * Validate latitude (-90 to 90)
 */
export function validateLatitude(lat: number | undefined | null): FieldValidationResult {
  if (lat === undefined || lat === null) {
    return { isValid: true }; // Optional field
  }

  if (typeof lat !== "number" || isNaN(lat)) {
    return { isValid: false, error: "Latitude must be a valid number" };
  }

  if (lat < -90 || lat > 90) {
    return {
      isValid: false,
      error: `Latitude must be between -90 and 90 (got ${lat})`,
    };
  }

  return { isValid: true };
}

/**
 * Validate longitude (-180 to 180)
 */
export function validateLongitude(lng: number | undefined | null): FieldValidationResult {
  if (lng === undefined || lng === null) {
    return { isValid: true }; // Optional field
  }

  if (typeof lng !== "number" || isNaN(lng)) {
    return { isValid: false, error: "Longitude must be a valid number" };
  }

  if (lng < -180 || lng > 180) {
    return {
      isValid: false,
      error: `Longitude must be between -180 and 180 (got ${lng})`,
    };
  }

  return { isValid: true };
}

/**
 * Validate coordinates together
 */
export function validateCoordinates(
  lat: number | undefined | null,
  lng: number | undefined | null
): FieldValidationResult {
  // Both must be present or both absent
  const hasLat = lat !== undefined && lat !== null;
  const hasLng = lng !== undefined && lng !== null;

  if (hasLat !== hasLng) {
    return {
      isValid: false,
      error: "Both latitude and longitude must be provided together",
    };
  }

  if (!hasLat && !hasLng) {
    return { isValid: true }; // Both optional
  }

  const latResult = validateLatitude(lat);
  if (!latResult.isValid) {
    return latResult;
  }

  const lngResult = validateLongitude(lng);
  if (!lngResult.isValid) {
    return lngResult;
  }

  return { isValid: true };
}

// ============================================
// URL VALIDATORS
// ============================================

/**
 * Validate URL format
 */
export function validateURL(url: string | undefined | null): FieldValidationResult {
  if (!url) {
    return { isValid: true }; // Optional field
  }

  if (typeof url !== "string") {
    return { isValid: false, error: "URL must be a string" };
  }

  try {
    const parsed = new URL(url);

    // Must be http or https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return {
        isValid: false,
        error: "URL must use HTTP or HTTPS protocol",
      };
    }

    return { isValid: true, sanitized: url.trim() };
  } catch (_error) {
    return { isValid: false, error: "Invalid URL format" };
  }
}

// ============================================
// PHONE NUMBER VALIDATORS
// ============================================

/**
 * Validate phone number format (basic international format check)
 */
export function validatePhoneNumber(
  phone: string | undefined | null
): FieldValidationResult {
  if (!phone) {
    return { isValid: true }; // Optional field
  }

  if (typeof phone !== "string") {
    return { isValid: false, error: "Phone number must be a string" };
  }

  // Remove common separators
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  // Must contain at least 7 digits and no more than 15 (E.164 standard)
  const digitCount = (cleaned.match(/\d/g) || []).length;

  if (digitCount < 7 || digitCount > 15) {
    return {
      isValid: false,
      error: "Phone number must contain 7-15 digits",
    };
  }

  // Should start with + or digit
  if (!/^[\+\d]/.test(cleaned)) {
    return {
      isValid: false,
      error: "Phone number must start with + or a digit",
    };
  }

  return { isValid: true, sanitized: phone.trim() };
}

// ============================================
// API RESPONSE VALIDATORS
// ============================================

/**
 * Validate Firecrawl crawl response
 */
export function validateFirecrawlCrawlResponse(
  response: unknown
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!response || typeof response !== "object") {
    errors.push(
      new ValidationError(
        "Firecrawl response must be an object",
        "response",
        ErrorCode.API_INVALID_RESPONSE
      )
    );
    return { isValid: false, errors };
  }

  const result = response as Partial<FirecrawlCrawlResult>;

  // Check required fields
  if (typeof result.success !== "boolean") {
    errors.push(
      new ValidationError(
        "Firecrawl response missing 'success' field",
        "success",
        ErrorCode.API_MISSING_FIELDS
      )
    );
  }

  // If success is true, data must be present
  if (result.success === true) {
    if (!Array.isArray(result.data)) {
      errors.push(
        new ValidationError(
          "Firecrawl successful response must include 'data' array",
          "data",
          ErrorCode.API_MISSING_FIELDS
        )
      );
    } else {
      // Validate each page in data
      result.data.forEach((page, index) => {
        const pageErrors = validateFirecrawlPage(page, index);
        errors.push(...pageErrors);
      });
    }
  }

  // If success is false, error should be present
  if (result.success === false && !result.error) {
    errors.push(
      new ValidationError(
        "Firecrawl error response should include 'error' message",
        "error",
        ErrorCode.API_MISSING_FIELDS
      )
    );
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate Firecrawl page data
 */
function validateFirecrawlPage(
  page: unknown,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!page || typeof page !== "object") {
    errors.push(
      new ValidationError(
        `Page at index ${index} must be an object`,
        `data[${index}]`,
        ErrorCode.API_INVALID_RESPONSE
      )
    );
    return errors;
  }

  const p = page as Partial<FirecrawlPage>;

  // At least one of html or markdown should be present
  if (!p.html && !p.markdown) {
    errors.push(
      new ValidationError(
        `Page at index ${index} must have html or markdown content`,
        `data[${index}]`,
        ErrorCode.API_INVALID_RESPONSE
      )
    );
  }

  return errors;
}

/**
 * Validate Firecrawl scrape response
 */
export function validateFirecrawlScrapeResponse(
  response: unknown
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!response || typeof response !== "object") {
    errors.push(
      new ValidationError(
        "Firecrawl scrape response must be an object",
        "response",
        ErrorCode.API_INVALID_RESPONSE
      )
    );
    return { isValid: false, errors };
  }

  const result = response as Partial<FirecrawlScrapeResult>;

  // Check required fields
  if (typeof result.success !== "boolean") {
    errors.push(
      new ValidationError(
        "Firecrawl scrape response missing 'success' field",
        "success",
        ErrorCode.API_MISSING_FIELDS
      )
    );
  }

  // If success is true, content should be present
  if (result.success === true) {
    if (!result.html && !result.markdown) {
      errors.push(
        new ValidationError(
          "Firecrawl successful scrape must include html or markdown content",
          "content",
          ErrorCode.API_MISSING_FIELDS
        )
      );
    }
  }

  // If success is false, error should be present
  if (result.success === false && !result.error) {
    errors.push(
      new ValidationError(
        "Firecrawl scrape error response should include 'error' message",
        "error",
        ErrorCode.API_MISSING_FIELDS
      )
    );
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate Anthropic API response
 */
export function validateAnthropicResponse(response: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!response || typeof response !== "object") {
    errors.push(
      new ValidationError(
        "Anthropic response must be an object",
        "response",
        ErrorCode.API_INVALID_RESPONSE
      )
    );
    return { isValid: false, errors };
  }

  const result = response as Partial<AnthropicResponse>;

  // Check required fields
  const requiredFields: Array<keyof AnthropicResponse> = [
    "id",
    "type",
    "role",
    "content",
    "model",
  ];

  for (const field of requiredFields) {
    if (!result[field]) {
      errors.push(
        new ValidationError(
          `Anthropic response missing required field: ${field}`,
          field,
          ErrorCode.API_MISSING_FIELDS
        )
      );
    }
  }

  // Validate content array
  if (result.content) {
    if (!Array.isArray(result.content)) {
      errors.push(
        new ValidationError(
          "Anthropic response 'content' must be an array",
          "content",
          ErrorCode.API_INVALID_RESPONSE
        )
      );
    } else {
      result.content.forEach((block, index) => {
        const blockErrors = validateAnthropicContentBlock(block, index);
        errors.push(...blockErrors);
      });
    }
  }

  // Validate usage
  if (result.usage) {
    if (
      typeof result.usage.input_tokens !== "number" ||
      typeof result.usage.output_tokens !== "number"
    ) {
      errors.push(
        new ValidationError(
          "Anthropic response usage tokens must be numbers",
          "usage",
          ErrorCode.API_INVALID_RESPONSE
        )
      );
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate Anthropic content block
 */
function validateAnthropicContentBlock(
  block: unknown,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!block || typeof block !== "object") {
    errors.push(
      new ValidationError(
        `Content block at index ${index} must be an object`,
        `content[${index}]`,
        ErrorCode.API_INVALID_RESPONSE
      )
    );
    return errors;
  }

  const b = block as Partial<AnthropicContentBlock>;

  // Must have type
  if (!b.type) {
    errors.push(
      new ValidationError(
        `Content block at index ${index} missing 'type' field`,
        `content[${index}].type`,
        ErrorCode.API_MISSING_FIELDS
      )
    );
  }

  // Type must be valid
  if (b.type && !["text", "tool_use"].includes(b.type)) {
    errors.push(
      new ValidationError(
        `Content block at index ${index} has invalid type: ${b.type}`,
        `content[${index}].type`,
        ErrorCode.API_INVALID_RESPONSE
      )
    );
  }

  // If type is tool_use, must have id, name, and input
  if (b.type === "tool_use") {
    if (!b.id) {
      errors.push(
        new ValidationError(
          `Tool use block at index ${index} missing 'id' field`,
          `content[${index}].id`,
          ErrorCode.API_MISSING_FIELDS
        )
      );
    }
    if (!b.name) {
      errors.push(
        new ValidationError(
          `Tool use block at index ${index} missing 'name' field`,
          `content[${index}].name`,
          ErrorCode.API_MISSING_FIELDS
        )
      );
    }
    if (!b.input) {
      errors.push(
        new ValidationError(
          `Tool use block at index ${index} missing 'input' field`,
          `content[${index}].input`,
          ErrorCode.API_MISSING_FIELDS
        )
      );
    }
  }

  return errors;
}

// ============================================
// BOOTH DATA VALIDATORS
// ============================================

/**
 * Comprehensive booth data validation
 */
export function validateBoothData(booth: BoothData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!booth.name || booth.name.trim().length === 0) {
    errors.push(
      new ValidationError(
        "Booth name is required",
        "name",
        ErrorCode.VALIDATION_MISSING_FIELD
      )
    );
  } else {
    // Validate name
    const nameValidation = sanitizeText(booth.name, "name");
    if (!nameValidation.isValid) {
      errors.push(
        new ValidationError(
          nameValidation.error!,
          "name",
          ErrorCode.VALIDATION_HTML_INJECTION
        )
      );
    } else if (nameValidation.sanitized) {
      booth.name = nameValidation.sanitized;
    }

    // Check length
    if (booth.name.length > 200) {
      errors.push(
        new ValidationError(
          "Booth name must be 200 characters or less",
          "name",
          ErrorCode.VALIDATION_FIELD_TOO_LONG
        )
      );
    }
  }

  // Address is required
  if (!booth.address || booth.address.trim().length === 0) {
    errors.push(
      new ValidationError(
        "Booth address is required",
        "address",
        ErrorCode.VALIDATION_MISSING_FIELD
      )
    );
  } else {
    // Validate address
    const addressValidation = sanitizeText(booth.address, "address");
    if (!addressValidation.isValid) {
      errors.push(
        new ValidationError(
          addressValidation.error!,
          "address",
          ErrorCode.VALIDATION_HTML_INJECTION
        )
      );
    } else if (addressValidation.sanitized) {
      booth.address = addressValidation.sanitized;
    }

    // Check length
    if (booth.address.length > 300) {
      errors.push(
        new ValidationError(
          "Booth address must be 300 characters or less",
          "address",
          ErrorCode.VALIDATION_FIELD_TOO_LONG
        )
      );
    }
  }

  // Country is required
  if (!booth.country || booth.country.trim().length === 0) {
    errors.push(
      new ValidationError(
        "Booth country is required",
        "country",
        ErrorCode.VALIDATION_MISSING_FIELD
      )
    );
  } else {
    // Note: Country validation and standardization should be done
    // by the country-validation module before this step.
    // This validator assumes country has already been standardized.
    // Additional country-specific validation can be added here if needed.
  }

  // Validate optional fields
  if (booth.city) {
    const cityValidation = sanitizeText(booth.city, "city");
    if (!cityValidation.isValid) {
      errors.push(
        new ValidationError(
          cityValidation.error!,
          "city",
          ErrorCode.VALIDATION_HTML_INJECTION
        )
      );
    } else if (cityValidation.sanitized) {
      booth.city = cityValidation.sanitized;
    }
  }

  if (booth.description) {
    const descValidation = sanitizeText(booth.description, "description");
    if (!descValidation.isValid) {
      errors.push(
        new ValidationError(
          descValidation.error!,
          "description",
          ErrorCode.VALIDATION_HTML_INJECTION
        )
      );
    } else if (descValidation.sanitized) {
      booth.description = descValidation.sanitized;
    }

    // Check length
    if (booth.description.length > 2000) {
      warnings.push("Description is very long (>2000 chars), may be truncated");
    }
  }

  // Validate coordinates
  const coordValidation = validateCoordinates(booth.latitude, booth.longitude);
  if (!coordValidation.isValid) {
    errors.push(
      new ValidationError(
        coordValidation.error!,
        "coordinates",
        ErrorCode.VALIDATION_INVALID_COORDINATES
      )
    );
  }

  // Validate URL
  if (booth.website) {
    const urlValidation = validateURL(booth.website);
    if (!urlValidation.isValid) {
      errors.push(
        new ValidationError(
          urlValidation.error!,
          "website",
          ErrorCode.VALIDATION_INVALID_URL
        )
      );
    } else if (urlValidation.sanitized) {
      booth.website = urlValidation.sanitized;
    }
  }

  // Validate phone
  if (booth.phone) {
    const phoneValidation = validatePhoneNumber(booth.phone);
    if (!phoneValidation.isValid) {
      errors.push(
        new ValidationError(
          phoneValidation.error!,
          "phone",
          ErrorCode.VALIDATION_INVALID_PHONE
        )
      );
    } else if (phoneValidation.sanitized) {
      booth.phone = phoneValidation.sanitized;
    }
  }

  // Validate source URL
  const sourceUrlValidation = validateURL(booth.source_url);
  if (!sourceUrlValidation.isValid) {
    errors.push(
      new ValidationError(
        "Invalid source URL",
        "source_url",
        ErrorCode.VALIDATION_INVALID_URL
      )
    );
  }

  // Validate status
  const validStatuses = ["active", "inactive", "unverified"];
  if (!validStatuses.includes(booth.status)) {
    errors.push(
      new ValidationError(
        `Status must be one of: ${validStatuses.join(", ")}`,
        "status",
        ErrorCode.VALIDATION_INVALID_FORMAT
      )
    );
  }

  // Validate photos array
  if (booth.photos) {
    if (!Array.isArray(booth.photos)) {
      errors.push(
        new ValidationError(
          "Photos must be an array",
          "photos",
          ErrorCode.VALIDATION_INVALID_FORMAT
        )
      );
    } else {
      booth.photos.forEach((photo, index) => {
        const photoValidation = validateURL(photo);
        if (!photoValidation.isValid) {
          errors.push(
            new ValidationError(
              `Invalid photo URL at index ${index}`,
              `photos[${index}]`,
              ErrorCode.VALIDATION_INVALID_URL
            )
          );
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate batch of booths
 */
export function validateBoothBatch(booths: BoothData[]): {
  valid: BoothData[];
  invalid: Array<{ booth: BoothData; errors: ValidationError[] }>;
} {
  const valid: BoothData[] = [];
  const invalid: Array<{ booth: BoothData; errors: ValidationError[] }> = [];

  for (const booth of booths) {
    const result = validateBoothData(booth);
    if (result.isValid) {
      valid.push(booth);
    } else {
      invalid.push({ booth, errors: result.errors });
    }
  }

  return { valid, invalid };
}

// ============================================
// ERROR FORMATTING
// ============================================

/**
 * Format validation errors for logging
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return "No errors";

  return errors
    .map((err) => {
      const field = err.field ? `[${err.field}]` : "";
      return `${err.code} ${field}: ${err.message}`;
    })
    .join("\n");
}

/**
 * Get error summary
 */
export function getErrorSummary(errors: ValidationError[]): Record<string, number> {
  const summary: Record<string, number> = {};

  for (const error of errors) {
    const code = error.code;
    summary[code] = (summary[code] || 0) + 1;
  }

  return summary;
}
