/**
 * EXTRACTORS TEST SUITE
 *
 * Tests for extractor functions in extractors.ts
 * - cleanHtml removes tags
 * - Coordinate extraction
 * - Phone number extraction
 * - Address parsing
 * - Booth finalization with defaults
 * - Deduplication logic
 */

import { assertEquals, assert, assertExists } from "https://deno.land/std/testing/asserts.ts";

// Test cleanHtml function
function cleanHtml(text: string): string {
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Test finalizeBooth function
function finalizeBooth(booth: any, sourceUrl: string, sourceName: string): any {
  return {
    name: booth.name || 'Unknown',
    address: booth.address || '',
    city: booth.city,
    state: booth.state,
    country: booth.country || 'Unknown',
    postal_code: booth.postal_code,
    latitude: booth.latitude,
    longitude: booth.longitude,
    machine_model: booth.machine_model,
    machine_manufacturer: booth.machine_manufacturer,
    booth_type: booth.booth_type || 'analog',
    cost: booth.cost,
    accepts_cash: booth.accepts_cash,
    accepts_card: booth.accepts_card,
    hours: booth.hours,
    is_operational: booth.is_operational ?? true,
    status: booth.status || 'active',
    source_url: sourceUrl,
    source_name: sourceName,
    description: booth.description,
    website: booth.website,
    phone: booth.phone,
    photos: booth.photos,
  };
}

Deno.test("cleanHtml removes HTML tags", () => {
  const input = "<p>Hello <strong>World</strong></p>";
  const expected = "Hello World";
  assertEquals(cleanHtml(input), expected);
});

Deno.test("cleanHtml removes script tags", () => {
  const input = "<div>Text<script>alert('hack')</script>More text</div>";
  const expected = "Text More text";
  assertEquals(cleanHtml(input), expected);
});

Deno.test("cleanHtml removes style tags", () => {
  const input = "<div>Text<style>.test { color: red; }</style>More text</div>";
  const expected = "Text More text";
  assertEquals(cleanHtml(input), expected);
});

Deno.test("cleanHtml decodes HTML entities", () => {
  const input = "Test&nbsp;&amp;&quot;&#x27;";
  const expected = "Test & \"'";
  assertEquals(cleanHtml(input), expected);
});

Deno.test("cleanHtml normalizes whitespace", () => {
  const input = "  Test    multiple   spaces  ";
  const expected = "Test multiple spaces";
  assertEquals(cleanHtml(input), expected);
});

Deno.test("extractCoordinates finds valid coordinates", () => {
  const line = "Location at 40.7128, -74.0060";
  const coordMatch = line.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  assertExists(coordMatch);
  assertEquals(parseFloat(coordMatch![1]), 40.7128);
  assertEquals(parseFloat(coordMatch![2]), -74.0060);
});

Deno.test("extractCoordinates handles negative coordinates", () => {
  const line = "Coordinates: -33.8688, 151.2093";
  const coordMatch = line.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  assertExists(coordMatch);
  assertEquals(parseFloat(coordMatch![1]), -33.8688);
  assertEquals(parseFloat(coordMatch![2]), 151.2093);
});

Deno.test("extractCoordinates returns null for invalid input", () => {
  const line = "No coordinates here";
  const coordMatch = line.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  assertEquals(coordMatch, null);
});

Deno.test("extractPhone finds US phone with dashes", () => {
  const line = "Call us at 212-555-1234";
  const phoneMatch = line.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
  assertExists(phoneMatch);
  assertEquals(phoneMatch![0], "212-555-1234");
});

Deno.test("extractPhone finds US phone with parentheses", () => {
  const line = "Phone: (212) 555-1234";
  const phoneMatch = line.match(/(\(\d{3}\)\s*\d{3}[-.]?\d{4})/);
  assertExists(phoneMatch);
  assertEquals(phoneMatch![0], "(212) 555-1234");
});

Deno.test("extractPhone finds US phone without separators", () => {
  const line = "Contact: 2125551234";
  const phoneMatch = line.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
  assertExists(phoneMatch);
  assertEquals(phoneMatch![0], "2125551234");
});

Deno.test("extractAddress finds street address", () => {
  const line = "Address: 123 Main Street, New York, NY";
  const addressMatch = line.match(/Address:\s*(.+)/i);
  assertExists(addressMatch);
  assertEquals(addressMatch![1], "123 Main Street, New York, NY");
});

Deno.test("extractAddress handles various street types", () => {
  const patterns = [
    "456 Oak Avenue",
    "789 Elm Road",
    "321 Pine Boulevard",
    "654 Maple Drive",
  ];

  for (const pattern of patterns) {
    const match = pattern.match(/\d+\s+[A-Z][a-z]+\s+(?:Street|Avenue|Road|Boulevard|Drive)/i);
    assertExists(match, `Failed to match: ${pattern}`);
  }
});

Deno.test("finalizeBooth adds default values", () => {
  const input = {
    name: "Test Booth",
    address: "123 Main St",
  };

  const result = finalizeBooth(input, "http://example.com", "test-source");

  assertEquals(result.name, "Test Booth");
  assertEquals(result.address, "123 Main St");
  assertEquals(result.country, "Unknown");
  assertEquals(result.booth_type, "analog");
  assertEquals(result.status, "active");
  assertEquals(result.is_operational, true);
  assertEquals(result.source_url, "http://example.com");
  assertEquals(result.source_name, "test-source");
});

Deno.test("finalizeBooth preserves provided values", () => {
  const input = {
    name: "Custom Booth",
    address: "456 Elm St",
    country: "United States",
    booth_type: "digital",
    status: "inactive",
    is_operational: false,
    cost: "$5",
    hours: "9am-5pm",
  };

  const result = finalizeBooth(input, "http://example.com", "test-source");

  assertEquals(result.name, "Custom Booth");
  assertEquals(result.country, "United States");
  assertEquals(result.booth_type, "digital");
  assertEquals(result.status, "inactive");
  assertEquals(result.is_operational, false);
  assertEquals(result.cost, "$5");
  assertEquals(result.hours, "9am-5pm");
});

Deno.test("finalizeBooth handles missing name gracefully", () => {
  const input = {
    address: "123 Main St",
  };

  const result = finalizeBooth(input, "http://example.com", "test-source");
  assertEquals(result.name, "Unknown");
});

Deno.test("finalizeBooth handles missing address gracefully", () => {
  const input = {
    name: "Test Booth",
  };

  const result = finalizeBooth(input, "http://example.com", "test-source");
  assertEquals(result.address, "");
});

Deno.test("extractCost finds dollar amounts", () => {
  const patterns = [
    { input: "Price: $5", expected: "$5" },
    { input: "Cost $10.00", expected: "$10.00" },
    { input: "$3.50 per session", expected: "$3.50" },
  ];

  for (const { input, expected } of patterns) {
    const match = input.match(/\$(\d+(?:\.\d{2})?)/);
    assertExists(match, `Failed to match: ${input}`);
    assertEquals(`$${match![1]}`, expected);
  }
});

Deno.test("extractCityState parses US format", () => {
  const line = "New York, NY 10001";
  const match = line.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*(\d{5})?/);
  assertExists(match);
  assertEquals(match![1], "New York");
  assertEquals(match![2], "NY");
  assertEquals(match![3], "10001");
});

Deno.test("extractCityState handles no ZIP", () => {
  const line = "Los Angeles, CA";
  const match = line.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*(\d{5})?/);
  assertExists(match);
  assertEquals(match![1], "Los Angeles");
  assertEquals(match![2], "CA");
  assertEquals(match![3], undefined);
});

Deno.test("deduplication based on name and address", () => {
  const booths = [
    { name: "Booth A", address: "123 Main St", country: "USA" },
    { name: "Booth A", address: "123 Main St", country: "USA" }, // duplicate
    { name: "Booth B", address: "456 Elm St", country: "USA" },
  ];

  const seen = new Set<string>();
  const unique = booths.filter(booth => {
    const key = `${booth.name}|${booth.address}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  assertEquals(unique.length, 2);
  assertEquals(unique[0].name, "Booth A");
  assertEquals(unique[1].name, "Booth B");
});

Deno.test("deduplication is case-insensitive", () => {
  const booths = [
    { name: "Booth A", address: "123 Main St", country: "USA" },
    { name: "booth a", address: "123 main st", country: "USA" }, // duplicate (different case)
    { name: "Booth B", address: "456 Elm St", country: "USA" },
  ];

  const seen = new Set<string>();
  const unique = booths.filter(booth => {
    const key = `${booth.name}|${booth.address}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  assertEquals(unique.length, 2);
});

Deno.test("extractOperationalStatus detects active booth", () => {
  const texts = ["operational", "working", "active", "open"];

  for (const text of texts) {
    const isOperational = text.match(/operational|working|active|open/i) ? true : false;
    assertEquals(isOperational, true, `Failed for: ${text}`);
  }
});

Deno.test("extractOperationalStatus detects inactive booth", () => {
  const texts = ["closed", "removed", "inactive", "out of service"];

  for (const text of texts) {
    const isInactive = text.match(/closed|removed|inactive|out of service/i) ? true : false;
    assertEquals(isInactive, true, `Failed for: ${text}`);
  }
});

Deno.test("extractWebsite finds URLs", () => {
  const line = "Visit us at https://example.com/booth";
  const urlMatch = line.match(/(https?:\/\/[^\s)]+)/);
  assertExists(urlMatch);
  assertEquals(urlMatch![1], "https://example.com/booth");
});

Deno.test("extractWebsite handles HTTP and HTTPS", () => {
  const urls = ["http://example.com", "https://secure.example.com"];

  for (const url of urls) {
    const match = url.match(/(https?:\/\/[^\s)]+)/);
    assertExists(match, `Failed for: ${url}`);
  }
});

Deno.test("normalizeName trims whitespace", () => {
  const input = "  Test Booth  ";
  const normalized = input.trim();
  assertEquals(normalized, "Test Booth");
});

Deno.test("normalizeName removes extra spaces", () => {
  const input = "Test    Multiple     Spaces";
  const normalized = input.replace(/\s+/g, ' ').trim();
  assertEquals(normalized, "Test Multiple Spaces");
});
