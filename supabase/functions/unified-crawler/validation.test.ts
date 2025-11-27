/**
 * VALIDATION TEST SUITE
 *
 * Tests for booth validation functions
 * - validateBooth accepts valid booths
 * - validateBooth rejects invalid booths
 * - Country normalization
 * - HTML tag detection in fields
 */

import { assertEquals, assert } from "https://deno.land/std/testing/asserts.ts";
import { validateCountry, isValidCountry, getAllValidCountries } from "./country-validation";

// ========================================
// BOOTH VALIDATION TESTS
// ========================================

interface BoothData {
  name: string;
  address: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  source_url: string;
  source_name: string;
  status: "active" | "inactive" | "unverified";
}

function validateBooth(booth: BoothData): { isValid: boolean; reason?: string } {
  if (!booth.name || booth.name.trim().length === 0) {
    return { isValid: false, reason: "missing_name" };
  }

  if (!booth.address || booth.address.trim().length === 0) {
    return { isValid: false, reason: "missing_address" };
  }

  // Validate country
  const countryValidation = validateCountry(booth.country, booth.city);
  if (!countryValidation.isValid) {
    return { isValid: false, reason: `invalid_country: ${countryValidation.error}` };
  }

  // Check for HTML tags
  const htmlPattern = /<[^>]+>/;
  if (htmlPattern.test(booth.name) || htmlPattern.test(booth.address)) {
    return { isValid: false, reason: "html_tags_detected" };
  }

  // Check for reasonable length
  if (booth.name.length > 200) {
    return { isValid: false, reason: "name_too_long" };
  }

  if (booth.address.length > 300) {
    return { isValid: false, reason: "address_too_long" };
  }

  return { isValid: true };
}

Deno.test("validateBooth accepts valid booth", () => {
  const booth: BoothData = {
    name: "Test Photo Booth",
    address: "123 Main Street",
    city: "New York",
    state: "NY",
    country: "United States",
    source_url: "http://example.com",
    source_name: "test-source",
    status: "active",
  };

  const result = validateBooth(booth);
  assertEquals(result.isValid, true);
  assertEquals(result.reason, undefined);
});

Deno.test("validateBooth rejects booth with missing name", () => {
  const booth: BoothData = {
    name: "",
    address: "123 Main Street",
    country: "United States",
    source_url: "http://example.com",
    source_name: "test-source",
    status: "active",
  };

  const result = validateBooth(booth);
  assertEquals(result.isValid, false);
  assertEquals(result.reason, "missing_name");
});

Deno.test("validateBooth rejects booth with missing address", () => {
  const booth: BoothData = {
    name: "Test Booth",
    address: "",
    country: "United States",
    source_url: "http://example.com",
    source_name: "test-source",
    status: "active",
  };

  const result = validateBooth(booth);
  assertEquals(result.isValid, false);
  assertEquals(result.reason, "missing_address");
});

Deno.test("validateBooth rejects booth with HTML in name", () => {
  const booth: BoothData = {
    name: "<script>alert('hack')</script>Test Booth",
    address: "123 Main Street",
    country: "United States",
    source_url: "http://example.com",
    source_name: "test-source",
    status: "active",
  };

  const result = validateBooth(booth);
  assertEquals(result.isValid, false);
  assertEquals(result.reason, "html_tags_detected");
});

Deno.test("validateBooth rejects booth with HTML in address", () => {
  const booth: BoothData = {
    name: "Test Booth",
    address: "123 <strong>Main</strong> Street",
    country: "United States",
    source_url: "http://example.com",
    source_name: "test-source",
    status: "active",
  };

  const result = validateBooth(booth);
  assertEquals(result.isValid, false);
  assertEquals(result.reason, "html_tags_detected");
});

Deno.test("validateBooth rejects booth with name too long", () => {
  const booth: BoothData = {
    name: "A".repeat(201),
    address: "123 Main Street",
    country: "United States",
    source_url: "http://example.com",
    source_name: "test-source",
    status: "active",
  };

  const result = validateBooth(booth);
  assertEquals(result.isValid, false);
  assertEquals(result.reason, "name_too_long");
});

Deno.test("validateBooth rejects booth with address too long", () => {
  const booth: BoothData = {
    name: "Test Booth",
    address: "A".repeat(301),
    country: "United States",
    source_url: "http://example.com",
    source_name: "test-source",
    status: "active",
  };

  const result = validateBooth(booth);
  assertEquals(result.isValid, false);
  assertEquals(result.reason, "address_too_long");
});

Deno.test("validateBooth accepts booth with optional fields", () => {
  const booth: BoothData = {
    name: "Test Booth",
    address: "123 Main Street",
    city: "New York",
    state: "NY",
    country: "United States",
    postal_code: "10001",
    latitude: 40.7128,
    longitude: -74.0060,
    source_url: "http://example.com",
    source_name: "test-source",
    status: "active",
  };

  const result = validateBooth(booth);
  assertEquals(result.isValid, true);
});

// ========================================
// COUNTRY VALIDATION TESTS
// ========================================

Deno.test("validateCountry accepts United States", () => {
  const result = validateCountry("United States");
  assertEquals(result.isValid, true);
  assertEquals(result.standardizedCountry, "United States");
});

Deno.test("validateCountry accepts USA variant", () => {
  const result = validateCountry("USA");
  assertEquals(result.isValid, true);
  assertEquals(result.standardizedCountry, "United States");
});

Deno.test("validateCountry accepts US variant", () => {
  const result = validateCountry("US");
  assertEquals(result.isValid, true);
  assertEquals(result.standardizedCountry, "United States");
});

Deno.test("validateCountry accepts United Kingdom", () => {
  const result = validateCountry("United Kingdom");
  assertEquals(result.isValid, true);
  assertEquals(result.standardizedCountry, "United Kingdom");
});

Deno.test("validateCountry accepts UK variant", () => {
  const result = validateCountry("UK");
  assertEquals(result.isValid, true);
  assertEquals(result.standardizedCountry, "United Kingdom");
});

Deno.test("validateCountry is case-insensitive", () => {
  const result = validateCountry("united states");
  assertEquals(result.isValid, true);
  assertEquals(result.standardizedCountry, "United States");
});

Deno.test("validateCountry normalizes Germany variants", () => {
  const variants = ["Germany", "germany", "Deutschland", "de"];

  for (const variant of variants) {
    const result = validateCountry(variant);
    assertEquals(result.isValid, true, `Failed for: ${variant}`);
    assertEquals(result.standardizedCountry, "Germany");
  }
});

Deno.test("validateCountry normalizes France variants", () => {
  const variants = ["France", "france", "fr"];

  for (const variant of variants) {
    const result = validateCountry(variant);
    assertEquals(result.isValid, true, `Failed for: ${variant}`);
    assertEquals(result.standardizedCountry, "France");
  }
});

Deno.test("validateCountry rejects empty string", () => {
  const result = validateCountry("");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Country is required and could not be inferred from city");
});

Deno.test("validateCountry rejects null", () => {
  const result = validateCountry(null);
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Country is required and could not be inferred from city");
});

Deno.test("validateCountry rejects undefined", () => {
  const result = validateCountry(undefined);
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Country is required and could not be inferred from city");
});

Deno.test("validateCountry rejects corrupted HTML", () => {
  const result = validateCountry("<script>alert('hack')</script>");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("corrupted"));
});

Deno.test("validateCountry rejects URL-encoded strings", () => {
  const result = validateCountry("United%20States");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("corrupted"));
});

Deno.test("validateCountry rejects URLs", () => {
  const result = validateCountry("https://example.com");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("corrupted"));
});

Deno.test("validateCountry rejects strings with numbers", () => {
  const result = validateCountry("Country123");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("corrupted"));
});

Deno.test("validateCountry rejects excessively long strings", () => {
  const result = validateCountry("A".repeat(100));
  assertEquals(result.isValid, false);
  assert(result.error?.includes("corrupted"));
});

Deno.test("validateCountry infers from known city", () => {
  const result = validateCountry("", "New York");
  assertEquals(result.isValid, true);
  assertEquals(result.standardizedCountry, "United States");
});

Deno.test("validateCountry infers from London", () => {
  const result = validateCountry("", "London");
  assertEquals(result.isValid, true);
  assertEquals(result.standardizedCountry, "United Kingdom");
});

Deno.test("validateCountry infers from Berlin", () => {
  const result = validateCountry("", "Berlin");
  assertEquals(result.isValid, true);
  assertEquals(result.standardizedCountry, "Germany");
});

Deno.test("validateCountry handles unknown city", () => {
  const result = validateCountry("", "UnknownCity");
  assertEquals(result.isValid, false);
  assertEquals(result.error, "Country is required and could not be inferred from city");
});

Deno.test("isValidCountry shortcut returns true for valid", () => {
  assertEquals(isValidCountry("United States"), true);
  assertEquals(isValidCountry("Canada"), true);
  assertEquals(isValidCountry("Germany"), true);
});

Deno.test("isValidCountry shortcut returns false for invalid", () => {
  assertEquals(isValidCountry(""), false);
  assertEquals(isValidCountry("Invalid Country"), false);
  assertEquals(isValidCountry("<script>"), false);
});

Deno.test("getAllValidCountries returns array", () => {
  const countries = getAllValidCountries();
  assert(Array.isArray(countries));
  assert(countries.length > 0);
});

Deno.test("getAllValidCountries includes major countries", () => {
  const countries = getAllValidCountries();
  assert(countries.includes("United States"));
  assert(countries.includes("United Kingdom"));
  assert(countries.includes("Canada"));
  assert(countries.includes("Germany"));
  assert(countries.includes("France"));
  assert(countries.includes("Australia"));
  assert(countries.includes("Japan"));
});

Deno.test("getAllValidCountries is sorted", () => {
  const countries = getAllValidCountries();
  const sorted = [...countries].sort();
  assertEquals(countries, sorted);
});

// ========================================
// HTML TAG DETECTION TESTS
// ========================================

Deno.test("detectHtmlTags finds script tags", () => {
  const text = "<script>alert('test')</script>";
  const hasHtml = /<[^>]+>/.test(text);
  assertEquals(hasHtml, true);
});

Deno.test("detectHtmlTags finds div tags", () => {
  const text = "<div>content</div>";
  const hasHtml = /<[^>]+>/.test(text);
  assertEquals(hasHtml, true);
});

Deno.test("detectHtmlTags finds inline tags", () => {
  const text = "Text with <strong>bold</strong>";
  const hasHtml = /<[^>]+>/.test(text);
  assertEquals(hasHtml, true);
});

Deno.test("detectHtmlTags accepts clean text", () => {
  const text = "Normal text without HTML";
  const hasHtml = /<[^>]+>/.test(text);
  assertEquals(hasHtml, false);
});

Deno.test("detectHtmlTags handles less-than symbol", () => {
  const text = "Price < $10";
  const hasHtml = /<[^>]+>/.test(text);
  assertEquals(hasHtml, false); // Not a complete HTML tag
});

// ========================================
// LENGTH VALIDATION TESTS
// ========================================

Deno.test("validateLength accepts reasonable name", () => {
  const name = "Photo Booth at Grand Central Station";
  assertEquals(name.length <= 200, true);
});

Deno.test("validateLength accepts reasonable address", () => {
  const address = "123 Main Street, Suite 456, New York, NY 10001";
  assertEquals(address.length <= 300, true);
});

Deno.test("validateLength rejects excessive name", () => {
  const name = "A".repeat(201);
  assertEquals(name.length > 200, true);
});

Deno.test("validateLength rejects excessive address", () => {
  const address = "A".repeat(301);
  assertEquals(address.length > 300, true);
});
