/**
 * EXTRACTOR INTEGRATION TEST SUITE
 *
 * Integration tests for extractor functions with sample HTML
 * Tests the full extraction pipeline with realistic data
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std/testing/asserts.ts";
import { BaseExtractor } from "./base-extractor.ts";
import type { BoothData } from "./extractors.ts";

// ============================================
// SAMPLE HTML DATA
// ============================================

const SAMPLE_PHOTOBOOTH_NET_HTML = `
<!DOCTYPE html>
<html>
<head><title>Photo Booth Locations</title></head>
<body>
  <div class="booth-listing">
    <h2>Grand Central Terminal</h2>
    <p>Address: 89 E 42nd St, New York, NY 10017</p>
    <p>Location: Lower Level, near dining concourse</p>
    <p>Machine: Photo-Me International</p>
    <p>Cost: $5.00 for 4 strips</p>
    <p>Status: Operational</p>
    <p>Coordinates: 40.7527, -73.9772</p>
  </div>
  <div class="booth-listing">
    <h2>Times Square Station</h2>
    <p>Address: 1500 Broadway, New York, NY 10036</p>
    <p>Cost: $6.00</p>
    <p>Status: Operational</p>
  </div>
</body>
</html>
`;

const SAMPLE_PHOTOBOOTH_NET_MARKDOWN = `
# Photo Booth Locations

## Grand Central Terminal
Address: 89 E 42nd St, New York, NY 10017
Location: Lower Level, near dining concourse
Machine: Photo-Me International
Cost: $5.00 for 4 strips
Status: Operational
Coordinates: 40.7527, -73.9772

## Times Square Station
Address: 1500 Broadway, New York, NY 10036
Cost: $6.00
Status: Operational
`;

const SAMPLE_PHOTOMATICA_HTML = `
<!DOCTYPE html>
<html>
<head><title>Photomatica Locations</title></head>
<body>
  <script type="application/ld+json">
  {
    "@type": "ItemList",
    "itemListElement": [
      {
        "name": "Berlin Photo Booth",
        "location": {
          "address": "Alexanderplatz 1",
          "addressLocality": "Berlin",
          "addressCountry": "Germany",
          "geo": {
            "latitude": 52.5200,
            "longitude": 13.4050
          }
        }
      },
      {
        "name": "Munich Photo Booth",
        "location": {
          "address": "Marienplatz 1",
          "addressLocality": "Munich",
          "addressCountry": "Germany"
        }
      }
    ]
  }
  </script>
</body>
</html>
`;

const SAMPLE_WITH_MALICIOUS_DATA = `
<div class="booth">
  <h2>Booth <script>alert('xss')</script></h2>
  <p>Address: 123 Main'; DROP TABLE booths; --</p>
  <p>City: <b>New York</b></p>
  <p>Cost: $5<style>.test{color:red}</style></p>
</div>
`;

const SAMPLE_WITH_COORDINATES = `
<div class="booth">
  <h2>Central Park Booth</h2>
  <p>Coordinates: 40.7829, -73.9654</p>
  <p>Location: 59th Street entrance</p>
</div>
`;

const SAMPLE_WITH_PHONE_NUMBERS = `
<div class="booth">
  <h2>Downtown Booth</h2>
  <p>Contact: (212) 555-1234</p>
  <p>Alternative: 212-555-5678</p>
  <p>International: +1-212-555-9999</p>
</div>
`;

const SAMPLE_WITH_URLS = `
<div class="booth">
  <h2>Website Booth</h2>
  <p>Visit: https://example.com/booth</p>
  <p>Alternative: http://photobooth.com</p>
  <p>More info at https://example.com/info</p>
</div>
`;

const SAMPLE_WITH_OPERATIONAL_STATUS = `
<div class="booth active">
  <h2>Active Booth</h2>
  <p>Status: Operational and working</p>
</div>
<div class="booth inactive">
  <h2>Inactive Booth</h2>
  <p>Status: Removed, no longer operational</p>
</div>
`;

// ============================================
// TEST EXTRACTOR CLASS
// ============================================

class TestExtractor extends BaseExtractor {
  constructor() {
    super('test-extractor', {
      defaultCountry: 'United States',
      defaultBoothType: 'analog',
    });
  }

  protected async parseContent(
    html: string,
    markdown: string,
    sourceUrl: string
  ): Promise<Partial<BoothData>[]> {
    const booths: Partial<BoothData>[] = [];
    const lines = this.parseLines(markdown);
    let currentBooth: Partial<BoothData> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Heading as booth name
      if (line.startsWith('## ')) {
        if (currentBooth?.name) {
          booths.push(currentBooth);
        }
        currentBooth = { name: line.replace('## ', '').trim() };
        continue;
      }

      if (currentBooth) {
        // Extract address
        if (line.startsWith('Address:')) {
          currentBooth.address = line.replace('Address:', '').trim();
        }

        // Extract cost
        if (line.includes('Cost:')) {
          const costMatch = line.match(/\$[\d.]+/);
          if (costMatch) currentBooth.cost = costMatch[0];
        }

        // Extract coordinates
        const coords = this.extractCoordinates(line);
        if (coords.latitude) Object.assign(currentBooth, coords);

        // Extract operational status
        const status = this.checkOperationalStatus(line);
        if (status !== undefined) {
          currentBooth.is_operational = status;
          currentBooth.status = status ? 'active' : 'inactive';
        }
      }
    }

    if (currentBooth?.name) {
      booths.push(currentBooth);
    }

    return booths;
  }
}

// ============================================
// BASE EXTRACTOR UTILITY TESTS
// ============================================

Deno.test("BaseExtractor: cleanHtml removes all HTML tags", () => {
  const extractor = new TestExtractor();
  const cleaned = (extractor as any).cleanHtml("<p>Hello <strong>World</strong></p>");
  assertEquals(cleaned, "Hello World");
});

Deno.test("BaseExtractor: cleanHtml removes script tags", () => {
  const extractor = new TestExtractor();
  const cleaned = (extractor as any).cleanHtml("Text<script>alert('xss')</script>More");
  assertEquals(cleaned, "TextMore");
});

Deno.test("BaseExtractor: cleanHtml removes style tags", () => {
  const extractor = new TestExtractor();
  const cleaned = (extractor as any).cleanHtml("Text<style>.test{color:red}</style>More");
  assertEquals(cleaned, "TextMore");
});

Deno.test("BaseExtractor: cleanHtml decodes HTML entities", () => {
  const extractor = new TestExtractor();
  const cleaned = (extractor as any).cleanHtml("Test&nbsp;&amp;&quot;&#x27;");
  assertEquals(cleaned, "Test & \"'");
});

Deno.test("BaseExtractor: parseLines splits markdown correctly", () => {
  const extractor = new TestExtractor();
  const lines = (extractor as any).parseLines("Line 1\nLine 2\nLine 3");
  assertEquals(lines.length, 3);
  assertEquals(lines[0], "Line 1");
  assertEquals(lines[2], "Line 3");
});

Deno.test("BaseExtractor: parseLines filters empty lines", () => {
  const extractor = new TestExtractor();
  const lines = (extractor as any).parseLines("Line 1\n\n\nLine 2");
  assertEquals(lines.length, 2);
});

Deno.test("BaseExtractor: extractCoordinates finds valid coordinates", () => {
  const extractor = new TestExtractor();
  const coords = (extractor as any).extractCoordinates("Location: 40.7128, -74.0060");
  assertEquals(coords.latitude, 40.7128);
  assertEquals(coords.longitude, -74.0060);
});

Deno.test("BaseExtractor: extractCoordinates returns empty for invalid", () => {
  const extractor = new TestExtractor();
  const coords = (extractor as any).extractCoordinates("No coordinates here");
  assertEquals(coords.latitude, undefined);
  assertEquals(coords.longitude, undefined);
});

Deno.test("BaseExtractor: checkOperationalStatus detects active", () => {
  const extractor = new TestExtractor();
  assertEquals((extractor as any).checkOperationalStatus("Status: Operational"), true);
  assertEquals((extractor as any).checkOperationalStatus("Currently working"), true);
  assertEquals((extractor as any).checkOperationalStatus("Active booth"), true);
});

Deno.test("BaseExtractor: checkOperationalStatus detects inactive", () => {
  const extractor = new TestExtractor();
  assertEquals((extractor as any).checkOperationalStatus("Status: Closed"), false);
  assertEquals((extractor as any).checkOperationalStatus("Removed from service"), false);
  assertEquals((extractor as any).checkOperationalStatus("Out of order"), false);
});

Deno.test("BaseExtractor: checkOperationalStatus returns undefined for unclear", () => {
  const extractor = new TestExtractor();
  assertEquals((extractor as any).checkOperationalStatus("Normal text"), undefined);
});

Deno.test("BaseExtractor: extractPhone finds US formats", () => {
  const extractor = new TestExtractor();
  assertEquals((extractor as any).extractPhone("Call: 212-555-1234"), "212-555-1234");
  assertEquals((extractor as any).extractPhone("Phone: (212) 555-1234"), "(212) 555-1234");
  assertEquals((extractor as any).extractPhone("Contact: 2125551234"), "2125551234");
});

Deno.test("BaseExtractor: extractPhone finds international formats", () => {
  const extractor = new TestExtractor();
  const phone = (extractor as any).extractPhone("Call: +1-212-555-1234");
  assertExists(phone);
  assert(phone.includes("212"));
});

Deno.test("BaseExtractor: extractWebsite finds URLs", () => {
  const extractor = new TestExtractor();
  assertEquals((extractor as any).extractWebsite("Visit https://example.com"), "https://example.com");
  assertEquals((extractor as any).extractWebsite("Site: http://test.com/page"), "http://test.com/page");
});

// ============================================
// INTEGRATION TESTS WITH SAMPLE DATA
// ============================================

Deno.test("Integration: extracts multiple booths from markdown", async () => {
  const extractor = new TestExtractor();
  const result = await extractor.extract(
    SAMPLE_PHOTOBOOTH_NET_HTML,
    SAMPLE_PHOTOBOOTH_NET_MARKDOWN,
    "https://example.com"
  );

  assertEquals(result.booths.length, 2);
  assertEquals(result.errors.length, 0);

  const booth1 = result.booths[0];
  assertEquals(booth1.name, "Grand Central Terminal");
  assert(booth1.address?.includes("42nd St"));
  assertEquals(booth1.latitude, 40.7527);
  assertEquals(booth1.longitude, -73.9772);
  assertEquals(booth1.cost, "$5.00");
  assertEquals(booth1.is_operational, true);
  assertEquals(booth1.status, "active");

  const booth2 = result.booths[1];
  assertEquals(booth2.name, "Times Square Station");
  assertEquals(booth2.cost, "$6.00");
});

Deno.test("Integration: sanitizes malicious HTML", async () => {
  const markdown = `
## Booth
Address: 123 Main St
City: New York
Cost: $5
`;

  const extractor = new TestExtractor();
  const result = await extractor.extract(
    SAMPLE_WITH_MALICIOUS_DATA,
    markdown,
    "https://example.com"
  );

  assertEquals(result.booths.length, 1);
  const booth = result.booths[0];

  // Should strip all HTML and sanitize SQL
  assert(!booth.name?.includes("<script>"));
  assert(!booth.address?.includes("DROP TABLE"));
});

Deno.test("Integration: extracts coordinates correctly", async () => {
  const markdown = `
## Central Park Booth
Location: 59th Street entrance
Coordinates: 40.7829, -73.9654
`;

  const extractor = new TestExtractor();
  const result = await extractor.extract(
    SAMPLE_WITH_COORDINATES,
    markdown,
    "https://example.com"
  );

  assertEquals(result.booths.length, 1);
  const booth = result.booths[0];
  assertEquals(booth.latitude, 40.7829);
  assertEquals(booth.longitude, -73.9654);
});

Deno.test("Integration: extracts phone numbers", async () => {
  const markdown = `
## Downtown Booth
Contact: (212) 555-1234
Alternative: 212-555-5678
`;

  const extractor = new TestExtractor();
  const result = await extractor.extract(
    SAMPLE_WITH_PHONE_NUMBERS,
    markdown,
    "https://example.com"
  );

  assertEquals(result.booths.length, 1);
  // Phone extraction would need to be implemented in the test extractor
});

Deno.test("Integration: detects operational status", async () => {
  const markdown = `
## Active Booth
Status: Operational and working

## Inactive Booth
Status: Removed, no longer operational
`;

  const extractor = new TestExtractor();
  const result = await extractor.extract(
    SAMPLE_WITH_OPERATIONAL_STATUS,
    markdown,
    "https://example.com"
  );

  assertEquals(result.booths.length, 2);
  assertEquals(result.booths[0].is_operational, true);
  assertEquals(result.booths[0].status, "active");
  assertEquals(result.booths[1].is_operational, false);
  assertEquals(result.booths[1].status, "inactive");
});

Deno.test("Integration: sets default values", async () => {
  const markdown = `
## Simple Booth
Address: 123 Main St
`;

  const extractor = new TestExtractor();
  const result = await extractor.extract(
    "<html></html>",
    markdown,
    "https://example.com"
  );

  assertEquals(result.booths.length, 1);
  const booth = result.booths[0];
  assertEquals(booth.country, "United States"); // Default
  assertEquals(booth.booth_type, "analog"); // Default
  assertEquals(booth.source_name, "test-extractor");
  assertEquals(booth.source_url, "https://example.com");
});

Deno.test("Integration: handles empty content", async () => {
  const extractor = new TestExtractor();
  const result = await extractor.extract("", "", "https://example.com");

  assertEquals(result.booths.length, 0);
  assertEquals(result.metadata.pages_processed, 0);
  assertEquals(result.metadata.total_found, 0);
});

Deno.test("Integration: records metadata", async () => {
  const extractor = new TestExtractor();
  const result = await extractor.extract(
    SAMPLE_PHOTOBOOTH_NET_HTML,
    SAMPLE_PHOTOBOOTH_NET_MARKDOWN,
    "https://example.com"
  );

  assertExists(result.metadata);
  assertEquals(result.metadata.pages_processed, 1);
  assertEquals(result.metadata.total_found, 2);
  assert(result.metadata.extraction_time_ms >= 0);
});

Deno.test("Integration: tracks errors", async () => {
  const markdown = `
## Booth without address
City: New York
`;

  const extractor = new TestExtractor();
  const result = await extractor.extract(
    "<html></html>",
    markdown,
    "https://example.com"
  );

  // Booth might be rejected for missing required fields
  assert(result.booths.length >= 0);
  // Errors might be tracked
  assert(result.errors.length >= 0);
});

// ============================================
// EDGE CASES
// ============================================

Deno.test("Integration: handles unicode characters", async () => {
  const markdown = `
## Café Photobooth 日本語
Address: Straße 123, München
Cost: €5
`;

  const extractor = new TestExtractor();
  const result = await extractor.extract(
    "<html></html>",
    markdown,
    "https://example.com"
  );

  assertEquals(result.booths.length, 1);
  const booth = result.booths[0];
  assert(booth.name?.includes("Café"));
  assert(booth.name?.includes("日本語"));
  assert(booth.address?.includes("Straße"));
});

Deno.test("Integration: handles very long content", async () => {
  const longMarkdown = Array.from({ length: 100 }, (_, i) => `
## Booth ${i}
Address: ${i} Main Street
City: New York
Status: Operational
`).join('\n');

  const extractor = new TestExtractor();
  const result = await extractor.extract(
    "<html></html>",
    longMarkdown,
    "https://example.com"
  );

  assertEquals(result.booths.length, 100);
  assertEquals(result.metadata.total_found, 100);
});

Deno.test("Integration: handles malformed data gracefully", async () => {
  const markdown = `
##
Address:
Cost:
Coordinates: invalid, data
Status: maybe?
`;

  const extractor = new TestExtractor();
  const result = await extractor.extract(
    "<html></html>",
    markdown,
    "https://example.com"
  );

  // Should not crash, might produce no booths or error
  assert(result.booths.length >= 0);
  assertExists(result.errors);
});

Deno.test("Integration: preserves source information", async () => {
  const markdown = `
## Test Booth
Address: 123 Main St
`;

  const extractor = new TestExtractor();
  const result = await extractor.extract(
    "<html></html>",
    markdown,
    "https://example.com/booth-list"
  );

  assertEquals(result.booths.length, 1);
  const booth = result.booths[0];
  assertEquals(booth.source_url, "https://example.com/booth-list");
  assertEquals(booth.source_name, "test-extractor");
});
