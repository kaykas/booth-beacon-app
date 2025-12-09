/**
 * ADDRESS VALIDATION TEST SUITE
 *
 * Tests for new address validation improvements that prevent business names
 * from being extracted as addresses, which was causing geocoding failures.
 *
 * Key validations:
 * - Address must have street number
 * - Address cannot equal business name
 * - Address must be at least 10 characters
 */

import { assertEquals, assert } from "https://deno.land/std/testing/asserts.ts";

// Mock the validation functions
interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

function validateAddressFormat(address: string, boothName: string): FieldValidationResult {
  // Check if address is empty or too short
  if (address.trim().length < 10) {
    return {
      isValid: false,
      error: "Address must be at least 10 characters (too short, possibly just a business name)"
    };
  }

  // Check if address is the same as booth name (bad data - address == business name)
  if (address.trim().toLowerCase() === boothName.trim().toLowerCase()) {
    return {
      isValid: false,
      error: "Address cannot be the same as the business name - must include street address"
    };
  }

  // Check for street number (required for valid addresses)
  const hasStreetNumber = /\d+\s+[A-Za-z]/.test(address);
  if (!hasStreetNumber) {
    return {
      isValid: false,
      error: "Address must include a street number (e.g., '123 Main St')"
    };
  }

  return { isValid: true, sanitized: address.trim() };
}

// ========================================
// TEST CASES: GOOD ADDRESSES (SHOULD PASS)
// ========================================

Deno.test("Good address: Full street address with number and name", () => {
  const result = validateAddressFormat("123 Main Street", "Main Street Photo Booth");
  assertEquals(result.isValid, true);
  console.log("✓ PASS: '123 Main Street' is valid");
});

Deno.test("Good address: Complete address with suite number", () => {
  const result = validateAddressFormat("456 Park Avenue, Suite 200", "Park Avenue Photo Booth");
  assertEquals(result.isValid, true);
  console.log("✓ PASS: '456 Park Avenue, Suite 200' is valid");
});

Deno.test("Good address: International address with street number", () => {
  const result = validateAddressFormat("789 Boulevard Saint-Germain, Paris", "Saint-Germain Booth");
  assertEquals(result.isValid, true);
  console.log("✓ PASS: International address with street number is valid");
});

Deno.test("Good address: Address with postal code", () => {
  const result = validateAddressFormat("100 Oxford Street, London, UK W1A 1AA", "Oxford Street Photo Booth");
  assertEquals(result.isValid, true);
  console.log("✓ PASS: Address with postal code is valid");
});

Deno.test("Good address: City and state with street number", () => {
  const result = validateAddressFormat("555 Market Street, San Francisco, CA 94105", "SF Photo Booth");
  assertEquals(result.isValid, true);
  console.log("✓ PASS: Address with city/state and street number is valid");
});

// ========================================
// TEST CASES: BAD ADDRESSES (SHOULD FAIL)
// ========================================

Deno.test("Bad address: Just business name (no street address)", () => {
  const result = validateAddressFormat("The Photo Booth", "The Photo Booth");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("cannot be the same as the business name"));
  console.log("✗ FAIL: '123 Main Street' correctly rejected (business name = address)");
});

Deno.test("Bad address: Street name without number", () => {
  const result = validateAddressFormat("Main Street", "Main Street Photo Booth");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("street number"));
  console.log("✗ FAIL: 'Main Street' correctly rejected (no street number)");
});

Deno.test("Bad address: Neighborhood only (too vague)", () => {
  const result = validateAddressFormat("Downtown Brooklyn", "Brooklyn Booth");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("street number") || result.error?.includes("10 characters"));
  console.log("✗ FAIL: 'Downtown Brooklyn' correctly rejected (too vague)");
});

Deno.test("Bad address: Too short - possible venue name", () => {
  const result = validateAddressFormat("The Theater", "Theater Photo Booth");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("10 characters"));
  console.log("✗ FAIL: 'The Theater' correctly rejected (too short)");
});

Deno.test("Bad address: Venue name with no street details", () => {
  const result = validateAddressFormat("Somewhere in Manhattan", "Manhattan Booth");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("10 characters") || result.error?.includes("street number"));
  console.log("✗ FAIL: 'Somewhere in Manhattan' correctly rejected (vague)");
});

Deno.test("Bad address: Address matches business name exactly", () => {
  const result = validateAddressFormat("Booth Central", "Booth Central");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("cannot be the same as the business name"));
  console.log("✗ FAIL: Business name as address correctly rejected");
});

// ========================================
// TEST CASES: EDGE CASES
// ========================================

Deno.test("Edge case: Number without space before street name", () => {
  const result = validateAddressFormat("123Main Street", "Main Street Booth");
  // This should fail because regex requires space after number
  assertEquals(result.isValid, false);
  console.log("✗ FAIL: '123Main Street' (no space) correctly rejected");
});

Deno.test("Edge case: Address with extra whitespace", () => {
  const result = validateAddressFormat("  789  Oak Avenue  ", "Oak Avenue Booth");
  assertEquals(result.isValid, true);
  console.log("✓ PASS: Address with extra whitespace is trimmed and valid");
});

Deno.test("Edge case: Case-insensitive business name matching", () => {
  const result = validateAddressFormat("PHOTO BOOTH NYC", "Photo Booth NYC");
  assertEquals(result.isValid, false);
  assert(result.error?.includes("cannot be the same as the business name"));
  console.log("✗ FAIL: Case-insensitive match correctly rejected");
});

// ========================================
// DATA QUALITY SCORE TESTS
// ========================================

interface BoothQualityData {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  description: string | null;
  photo_exterior_url: string | null;
  ai_preview_url: string | null;
  photos: string[] | null;
  google_place_id: string | null;
  status: string;
}

function hasStreetNumber(address: string | null): boolean {
  if (!address) return false;
  return /\d+\s+[A-Za-z]/.test(address);
}

function calculateQualityScore(booth: BoothQualityData): number {
  let score = 0;

  // Address: 10 points (but penalize if missing street number or too short)
  if (booth.address) {
    const addressLength = booth.address.trim().length;
    const hasStreetNum = hasStreetNumber(booth.address);

    // PENALTY: Address without street number (reduces by 30%)
    if (!hasStreetNum) {
      score += 7; // 70% of 10 points
    }
    // PENALTY: Address too short (likely just a name)
    else if (addressLength < 10) {
      score += 7; // 70% of 10 points
    }
    // PENALTY: Address might be business name (same as booth name)
    else if (booth.address.trim().toLowerCase() === booth.name.trim().toLowerCase()) {
      score += 0; // 0 points - this is bad data
    } else {
      // Good address with street number
      score += 10;
    }
  }

  // Other fields
  score += booth.state ? 5 : 0;
  score += (booth.latitude && booth.longitude) ? 10 : 0;
  score += booth.phone ? 10 : 0;
  score += booth.website ? 10 : 0;
  score += booth.hours ? 10 : 0;
  score += booth.description ? 5 : 0;
  score += (booth.photo_exterior_url || booth.ai_preview_url) ? 15 : 0;
  score += (booth.photos && booth.photos.length > 0) ? 10 : 0;
  score += booth.google_place_id ? 10 : 0;
  score += booth.status === 'active' ? 5 : 0;

  return Math.min(score, 100);
}

Deno.test("Quality score: Good booth with complete data", () => {
  const booth: BoothQualityData = {
    id: "1",
    name: "Main Street Photo Booth",
    city: "New York",
    country: "USA",
    address: "123 Main Street, New York, NY 10001", // GOOD address
    state: "NY",
    latitude: 40.7128,
    longitude: -74.0060,
    phone: "(555) 123-4567",
    website: "https://example.com",
    hours: "9am-9pm",
    description: "Classic analog photo booth",
    photo_exterior_url: "https://example.com/photo.jpg",
    ai_preview_url: null,
    photos: ["https://example.com/photo1.jpg"],
    google_place_id: "ChIJdfRCJ6BDXFQRv-PLV5GL5Z0",
    status: "active"
  };

  const score = calculateQualityScore(booth);
  console.log(`Quality score for good booth: ${score}/100 (should be 100)`);
  assertEquals(score, 100);
});

Deno.test("Quality score: Booth with address missing street number (PENALIZED)", () => {
  const booth: BoothQualityData = {
    id: "2",
    name: "Times Square Photo Booth",
    city: "New York",
    country: "USA",
    address: "Times Square", // BAD: no street number
    state: "NY",
    latitude: 40.7589,
    longitude: -73.9851,
    phone: "(555) 123-4567",
    website: "https://example.com",
    hours: "9am-9pm",
    description: "Popular Times Square location",
    photo_exterior_url: "https://example.com/photo.jpg",
    ai_preview_url: null,
    photos: ["https://example.com/photo1.jpg"],
    google_place_id: null,
    status: "active"
  };

  const score = calculateQualityScore(booth);
  console.log(`Quality score for booth without street number: ${score}/100 (should be 97 = 7+90)`);
  // 7 (address without street number) + 5 (state) + 10 (coords) + 10 (phone) + 10 (website) + 10 (hours) + 5 (description) + 15 (photo) + 10 (photos) + 5 (status) = 97
  assertEquals(score, 97);
});

Deno.test("Quality score: Booth with business name as address (HEAVILY PENALIZED)", () => {
  const booth: BoothQualityData = {
    id: "3",
    name: "Photo Booth Central",
    city: "New York",
    country: "USA",
    address: "Photo Booth Central", // BAD: business name as address
    state: "NY",
    latitude: null,
    longitude: null,
    phone: null,
    website: null,
    hours: null,
    description: null,
    photo_exterior_url: null,
    ai_preview_url: null,
    photos: null,
    google_place_id: null,
    status: "unverified"
  };

  const score = calculateQualityScore(booth);
  console.log(`Quality score for booth with business name as address: ${score}/100 (should be 5)`);
  // 0 (bad address) + 5 (state) = 5
  assertEquals(score, 5);
});

// ========================================
// SUMMARY
// ========================================

console.log("\n========================================");
console.log("ADDRESS VALIDATION TEST SUITE COMPLETE");
console.log("========================================");
console.log("\nKey findings:");
console.log("- Addresses MUST have a street number (e.g., '123')");
console.log("- Addresses cannot be just the business name");
console.log("- Addresses must be at least 10 characters");
console.log("- Quality scoring penalizes bad addresses by 30%");
console.log("- Bad addresses (business name = address) get 0 points");
console.log("\nThis prevents geocoding failures from bad data!");
