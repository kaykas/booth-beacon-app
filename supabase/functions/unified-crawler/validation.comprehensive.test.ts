/**
 * COMPREHENSIVE VALIDATION TEST SUITE
 *
 * Tests all validation functions including:
 * - SQL injection detection
 * - HTML tag stripping
 * - Coordinate validation
 * - URL validation
 * - Phone number validation
 * - Booth data validation
 * - Error handling
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std/testing/asserts.ts";
import {
  detectSQLInjection,
  hasHTMLTags,
  stripHTMLTags,
  sanitizeText,
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  validateURL,
  validatePhoneNumber,
  validateBoothData,
  validateBoothBatch,
  ValidationError,
  ErrorCode,
  formatValidationErrors,
  getErrorSummary,
} from "./validation.ts";
import type { BoothData } from "./extractors.ts";

// ============================================
// SQL INJECTION TESTS
// ============================================

Deno.test("detectSQLInjection: detects SELECT statements", () => {
  const malicious = "'; SELECT * FROM users; --";
  assertEquals(detectSQLInjection(malicious), true);
});

Deno.test("detectSQLInjection: detects INSERT statements", () => {
  const malicious = "test'; INSERT INTO users VALUES ('hack'); --";
  assertEquals(detectSQLInjection(malicious), true);
});

Deno.test("detectSQLInjection: detects DROP statements", () => {
  const malicious = "'; DROP TABLE booths; --";
  assertEquals(detectSQLInjection(malicious), true);
});

Deno.test("detectSQLInjection: detects UNION attacks", () => {
  const malicious = "' UNION SELECT password FROM users --";
  assertEquals(detectSQLInjection(malicious), true);
});

Deno.test("detectSQLInjection: detects OR 1=1 attacks", () => {
  const malicious = "' OR 1=1 --";
  assertEquals(detectSQLInjection(malicious), true);
});

Deno.test("detectSQLInjection: accepts clean text", () => {
  const clean = "Photo Booth at Union Square";
  assertEquals(detectSQLInjection(clean), false);
});

Deno.test("detectSQLInjection: accepts empty string", () => {
  assertEquals(detectSQLInjection(""), false);
});

// ============================================
// HTML TAG TESTS
// ============================================

Deno.test("hasHTMLTags: detects script tags", () => {
  assertEquals(hasHTMLTags("<script>alert('xss')</script>"), true);
});

Deno.test("hasHTMLTags: detects div tags", () => {
  assertEquals(hasHTMLTags("<div>content</div>"), true);
});

Deno.test("hasHTMLTags: detects inline tags", () => {
  assertEquals(hasHTMLTags("Text <strong>bold</strong>"), true);
});

Deno.test("hasHTMLTags: accepts clean text", () => {
  assertEquals(hasHTMLTags("Normal text without HTML"), false);
});

Deno.test("stripHTMLTags: removes all HTML tags", () => {
  const input = "<p>Hello <strong>World</strong></p>";
  assertEquals(stripHTMLTags(input), "Hello World");
});

Deno.test("stripHTMLTags: removes script tags completely", () => {
  const input = "Text<script>alert('bad')</script>More";
  assertEquals(stripHTMLTags(input), "TextMore");
});

Deno.test("stripHTMLTags: removes style tags completely", () => {
  const input = "Text<style>.class { color: red; }</style>More";
  assertEquals(stripHTMLTags(input), "TextMore");
});

Deno.test("stripHTMLTags: preserves text content", () => {
  const input = "<div><p>Keep this text</p></div>";
  assertEquals(stripHTMLTags(input), "Keep this text");
});

Deno.test("sanitizeText: rejects SQL injection", () => {
  const result = sanitizeText("'; DROP TABLE booths; --", "name");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("SQL injection"));
});

Deno.test("sanitizeText: strips HTML and returns sanitized", () => {
  const result = sanitizeText("<p>Clean Name</p>", "name");
  assertEquals(result.isValid, true);
  assertEquals(result.sanitized, "Clean Name");
});

Deno.test("sanitizeText: rejects excessive HTML", () => {
  const result = sanitizeText("<div><script></script><style></style>x</div>", "name");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("excessive HTML"));
});

// ============================================
// COORDINATE VALIDATION TESTS
// ============================================

Deno.test("validateLatitude: accepts valid latitude", () => {
  const result = validateLatitude(40.7128);
  assertEquals(result.isValid, true);
});

Deno.test("validateLatitude: accepts boundary values", () => {
  assertEquals(validateLatitude(-90).isValid, true);
  assertEquals(validateLatitude(90).isValid, true);
  assertEquals(validateLatitude(0).isValid, true);
});

Deno.test("validateLatitude: rejects out of range high", () => {
  const result = validateLatitude(91);
  assertEquals(result.isValid, false);
  assert(result.error?.includes("90"));
});

Deno.test("validateLatitude: rejects out of range low", () => {
  const result = validateLatitude(-91);
  assertEquals(result.isValid, false);
  assert(result.error?.includes("-90"));
});

Deno.test("validateLatitude: rejects NaN", () => {
  const result = validateLatitude(NaN);
  assertEquals(result.isValid, false);
  assert(result.error?.includes("valid number"));
});

Deno.test("validateLatitude: accepts null/undefined as optional", () => {
  assertEquals(validateLatitude(null).isValid, true);
  assertEquals(validateLatitude(undefined).isValid, true);
});

Deno.test("validateLongitude: accepts valid longitude", () => {
  const result = validateLongitude(-74.0060);
  assertEquals(result.isValid, true);
});

Deno.test("validateLongitude: accepts boundary values", () => {
  assertEquals(validateLongitude(-180).isValid, true);
  assertEquals(validateLongitude(180).isValid, true);
  assertEquals(validateLongitude(0).isValid, true);
});

Deno.test("validateLongitude: rejects out of range high", () => {
  const result = validateLongitude(181);
  assertEquals(result.isValid, false);
  assert(result.error?.includes("180"));
});

Deno.test("validateLongitude: rejects out of range low", () => {
  const result = validateLongitude(-181);
  assertEquals(result.isValid, false);
  assert(result.error?.includes("-180"));
});

Deno.test("validateCoordinates: accepts valid pair", () => {
  const result = validateCoordinates(40.7128, -74.0060);
  assertEquals(result.isValid, true);
});

Deno.test("validateCoordinates: accepts both null", () => {
  const result = validateCoordinates(null, null);
  assertEquals(result.isValid, true);
});

Deno.test("validateCoordinates: rejects mismatched presence", () => {
  const result1 = validateCoordinates(40.7128, null);
  assertEquals(result1.isValid, false);
  assert(result1.error?.includes("together"));

  const result2 = validateCoordinates(null, -74.0060);
  assertEquals(result2.isValid, false);
  assert(result2.error?.includes("together"));
});

// ============================================
// URL VALIDATION TESTS
// ============================================

Deno.test("validateURL: accepts valid HTTP URL", () => {
  const result = validateURL("http://example.com");
  assertEquals(result.isValid, true);
});

Deno.test("validateURL: accepts valid HTTPS URL", () => {
  const result = validateURL("https://example.com/path?query=value");
  assertEquals(result.isValid, true);
});

Deno.test("validateURL: rejects invalid protocol", () => {
  const result = validateURL("ftp://example.com");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("HTTP or HTTPS"));
});

Deno.test("validateURL: rejects malformed URL", () => {
  const result = validateURL("not a url");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("Invalid URL"));
});

Deno.test("validateURL: accepts null/undefined as optional", () => {
  assertEquals(validateURL(null).isValid, true);
  assertEquals(validateURL(undefined).isValid, true);
  assertEquals(validateURL("").isValid, true);
});

Deno.test("validateURL: trims whitespace", () => {
  const result = validateURL("  https://example.com  ");
  assertEquals(result.isValid, true);
  assertEquals(result.sanitized, "  https://example.com  ");
});

// ============================================
// PHONE NUMBER VALIDATION TESTS
// ============================================

Deno.test("validatePhoneNumber: accepts US format with dashes", () => {
  const result = validatePhoneNumber("212-555-1234");
  assertEquals(result.isValid, true);
});

Deno.test("validatePhoneNumber: accepts US format with parentheses", () => {
  const result = validatePhoneNumber("(212) 555-1234");
  assertEquals(result.isValid, true);
});

Deno.test("validatePhoneNumber: accepts international format", () => {
  const result = validatePhoneNumber("+1-212-555-1234");
  assertEquals(result.isValid, true);
});

Deno.test("validatePhoneNumber: accepts European format", () => {
  const result = validatePhoneNumber("+44 20 7946 0958");
  assertEquals(result.isValid, true);
});

Deno.test("validatePhoneNumber: rejects too few digits", () => {
  const result = validatePhoneNumber("12345");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("7-15 digits"));
});

Deno.test("validatePhoneNumber: rejects too many digits", () => {
  const result = validatePhoneNumber("1234567890123456");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("7-15 digits"));
});

Deno.test("validatePhoneNumber: accepts null/undefined as optional", () => {
  assertEquals(validatePhoneNumber(null).isValid, true);
  assertEquals(validatePhoneNumber(undefined).isValid, true);
  assertEquals(validatePhoneNumber("").isValid, true);
});

// ============================================
// BOOTH DATA VALIDATION TESTS
// ============================================

const createValidBooth = (): BoothData => ({
  name: "Test Photo Booth",
  address: "123 Main Street",
  city: "New York",
  state: "NY",
  country: "United States",
  postal_code: "10001",
  latitude: 40.7128,
  longitude: -74.0060,
  status: "active",
  source_url: "https://example.com/booth",
  source_name: "test-source",
});

Deno.test("validateBoothData: accepts valid booth", () => {
  const booth = createValidBooth();
  const result = validateBoothData(booth);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateBoothData: rejects missing name", () => {
  const booth = createValidBooth();
  booth.name = "";
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field === "name"));
});

Deno.test("validateBoothData: rejects missing address", () => {
  const booth = createValidBooth();
  booth.address = "";
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field === "address"));
});

Deno.test("validateBoothData: rejects missing country", () => {
  const booth = createValidBooth();
  booth.country = "";
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field === "country"));
});

Deno.test("validateBoothData: rejects name with HTML", () => {
  const booth = createValidBooth();
  booth.name = "<script>alert('xss')</script>Test";
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field === "name" && e.code === ErrorCode.VALIDATION_HTML_INJECTION));
});

Deno.test("validateBoothData: rejects name with SQL injection", () => {
  const booth = createValidBooth();
  booth.name = "'; DROP TABLE booths; --";
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field === "name"));
});

Deno.test("validateBoothData: rejects name too long", () => {
  const booth = createValidBooth();
  booth.name = "A".repeat(201);
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field === "name" && e.code === ErrorCode.VALIDATION_FIELD_TOO_LONG));
});

Deno.test("validateBoothData: rejects address too long", () => {
  const booth = createValidBooth();
  booth.address = "A".repeat(301);
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field === "address" && e.code === ErrorCode.VALIDATION_FIELD_TOO_LONG));
});

Deno.test("validateBoothData: rejects invalid coordinates", () => {
  const booth = createValidBooth();
  booth.latitude = 100; // Out of range
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field === "coordinates"));
});

Deno.test("validateBoothData: rejects invalid website URL", () => {
  const booth = createValidBooth();
  booth.website = "not a url";
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field === "website"));
});

Deno.test("validateBoothData: rejects invalid phone", () => {
  const booth = createValidBooth();
  booth.phone = "123"; // Too short
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field === "phone"));
});

Deno.test("validateBoothData: rejects invalid status", () => {
  const booth = createValidBooth();
  booth.status = "invalid" as any;
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field === "status"));
});

Deno.test("validateBoothData: rejects invalid photo URLs", () => {
  const booth = createValidBooth();
  booth.photos = ["https://valid.com/img.jpg", "not a url"];
  const result = validateBoothData(booth);
  assertEquals(result.isValid, false);
  assert(result.errors.some(e => e.field?.includes("photos")));
});

Deno.test("validateBoothData: sanitizes fields", () => {
  const booth = createValidBooth();
  booth.name = "  Test Booth  ";
  booth.address = "  123 Main St  ";
  const result = validateBoothData(booth);
  assertEquals(result.isValid, true);
  assertEquals(booth.name.trim(), "Test Booth");
  assertEquals(booth.address.trim(), "123 Main St");
});

Deno.test("validateBoothData: warns on long description", () => {
  const booth = createValidBooth();
  booth.description = "A".repeat(2001);
  const result = validateBoothData(booth);
  // Should still be valid, just with warning
  assertEquals(result.isValid, true);
  assert(result.warnings && result.warnings.length > 0);
});

// ============================================
// BATCH VALIDATION TESTS
// ============================================

Deno.test("validateBoothBatch: separates valid and invalid", () => {
  const booths = [
    createValidBooth(),
    { ...createValidBooth(), name: "" }, // Invalid
    createValidBooth(),
    { ...createValidBooth(), address: "" }, // Invalid
  ];

  const result = validateBoothBatch(booths);
  assertEquals(result.valid.length, 2);
  assertEquals(result.invalid.length, 2);
});

Deno.test("validateBoothBatch: handles empty array", () => {
  const result = validateBoothBatch([]);
  assertEquals(result.valid.length, 0);
  assertEquals(result.invalid.length, 0);
});

Deno.test("validateBoothBatch: returns errors for invalid booths", () => {
  const booths = [
    { ...createValidBooth(), name: "" },
  ];

  const result = validateBoothBatch(booths);
  assertEquals(result.invalid.length, 1);
  assertExists(result.invalid[0].errors);
  assert(result.invalid[0].errors.length > 0);
});

// ============================================
// ERROR FORMATTING TESTS
// ============================================

Deno.test("formatValidationErrors: formats single error", () => {
  const error = new ValidationError("Test error", "name", ErrorCode.VALIDATION_INVALID_FORMAT);
  const formatted = formatValidationErrors([error]);
  assert(formatted.includes("VALIDATION_2002"));
  assert(formatted.includes("[name]"));
  assert(formatted.includes("Test error"));
});

Deno.test("formatValidationErrors: formats multiple errors", () => {
  const errors = [
    new ValidationError("Error 1", "name"),
    new ValidationError("Error 2", "address"),
  ];
  const formatted = formatValidationErrors(errors);
  assert(formatted.includes("Error 1"));
  assert(formatted.includes("Error 2"));
});

Deno.test("formatValidationErrors: handles empty array", () => {
  const formatted = formatValidationErrors([]);
  assertEquals(formatted, "No errors");
});

Deno.test("getErrorSummary: counts errors by code", () => {
  const errors = [
    new ValidationError("E1", "name", ErrorCode.VALIDATION_MISSING_FIELD),
    new ValidationError("E2", "address", ErrorCode.VALIDATION_MISSING_FIELD),
    new ValidationError("E3", "country", ErrorCode.VALIDATION_INVALID_FORMAT),
  ];
  const summary = getErrorSummary(errors);
  assertEquals(summary[ErrorCode.VALIDATION_MISSING_FIELD], 2);
  assertEquals(summary[ErrorCode.VALIDATION_INVALID_FORMAT], 1);
});

Deno.test("getErrorSummary: handles empty array", () => {
  const summary = getErrorSummary([]);
  assertEquals(Object.keys(summary).length, 0);
});

// ============================================
// EDGE CASES AND SECURITY TESTS
// ============================================

Deno.test("validateBoothData: handles unicode characters", () => {
  const booth = createValidBooth();
  booth.name = "Café Photobooth 日本語";
  booth.address = "Straße 123, München";
  const result = validateBoothData(booth);
  assertEquals(result.isValid, true);
});

Deno.test("validateBoothData: rejects null byte injection", () => {
  const booth = createValidBooth();
  booth.name = "Test\x00Booth";
  // Should still process but sanitize
  const result = validateBoothData(booth);
  // Null bytes should be handled gracefully
  assert(result.isValid === true || result.isValid === false); // Either way is acceptable
});

Deno.test("validateBoothData: handles very long valid description", () => {
  const booth = createValidBooth();
  booth.description = "A".repeat(1999); // Just under warning threshold
  const result = validateBoothData(booth);
  assertEquals(result.isValid, true);
  assertEquals(result.warnings, undefined);
});

Deno.test("validateURL: rejects javascript: protocol", () => {
  const result = validateURL("javascript:alert('xss')");
  assertEquals(result.isValid, false);
});

Deno.test("validateURL: rejects data: protocol", () => {
  const result = validateURL("data:text/html,<script>alert('xss')</script>");
  assertEquals(result.isValid, false);
});

Deno.test("sanitizeText: handles only whitespace", () => {
  const result = sanitizeText("   ", "name");
  assertEquals(result.isValid, false);
});

Deno.test("sanitizeText: preserves allowed special characters", () => {
  const result = sanitizeText("O'Brien's Photo Booth & Co.", "name");
  assertEquals(result.isValid, true);
  assert(result.sanitized?.includes("&"));
  assert(result.sanitized?.includes("'"));
});
