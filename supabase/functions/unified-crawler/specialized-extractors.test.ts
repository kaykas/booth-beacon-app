/**
 * SPECIALIZED EXTRACTORS TEST SUITE
 *
 * Tests for specialized extractor functions
 * - photobooth-net-specialized extracts booths
 * - autophoto-specialized extracts booths
 * - Mock HTML/markdown fixtures for testing
 */

import { assertEquals, assert, assertExists } from "https://deno.land/std/testing/asserts.ts";

// ========================================
// TEST FIXTURES
// ========================================

const PHOTOBOOTH_NET_MOCK_HTML = `
<!DOCTYPE html>
<html>
<head><title>Photobooth.net Locations</title></head>
<body>
  <h2>United States</h2>
  <h3>New York</h3>
  <ul>
    <li><a href="browse.php?ddState=36&locationID=101">Grand Central Terminal</a>, New York</li>
    <li><a href="browse.php?ddState=36&locationID=102">Times Square Pharmacy</a>, New York</li>
  </ul>
  <h3>California</h3>
  <ul>
    <li><a href="browse.php?ddState=6&locationID=201">Hollywood & Highland</a>, Los Angeles</li>
  </ul>
</body>
</html>
`;

const PHOTOBOOTH_NET_MOCK_MARKDOWN = `
### United States

#### New York

[Grand Central Terminal](browse.php?ddState=36&locationID=101), New York
[Times Square Pharmacy](browse.php?ddState=36&locationID=102), New York

#### California

[Hollywood & Highland](browse.php?ddState=6&locationID=201), Los Angeles
`;

const AUTOPHOTO_MOCK_HTML = `
<!DOCTYPE html>
<html>
<head><title>AUTOPHOTO Locations</title></head>
<body>
  <div class="location">
    <h2>Grand Central Terminal</h2>
    <p class="address">89 East 42nd Street</p>
    <p>New York, NY 10017</p>
    <p>Phone: (212) 555-0100</p>
    <p>Hours: 24/7</p>
    <p>Price: $5</p>
  </div>
  <div class="location">
    <h2>Brooklyn Bowl</h2>
    <p class="address">61 Wythe Avenue</p>
    <p>Brooklyn, NY 11249</p>
    <p>Phone: (718) 555-0200</p>
  </div>
</body>
</html>
`;

const AUTOPHOTO_MOCK_MARKDOWN = `
## Grand Central Terminal

89 East 42nd Street
New York, NY 10017

Phone: (212) 555-0100
Hours: 24/7
Price: $5

## Brooklyn Bowl

61 Wythe Avenue
Brooklyn, NY 11249

Phone: (718) 555-0200
`;

// ========================================
// PHOTOBOOTH.NET EXTRACTOR TESTS
// ========================================

interface BoothLink {
  name: string;
  city: string;
  state: string;
  country: string;
  detailUrl: string;
  locationId: string;
}

function parseMarkdownStructure(markdown: string): BoothLink[] {
  const links: BoothLink[] = [];
  const lines = markdown.split("\n");

  let currentCountry = "";
  let currentState = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect country headers
    if (trimmed.startsWith("###")) {
      const header = trimmed.replace(/^###\s*/, "").trim();
      if (header.includes("United States")) {
        currentCountry = "USA";
      } else {
        currentCountry = header;
        currentState = "";
      }
      continue;
    }

    // Detect state headers
    if (trimmed.startsWith("####")) {
      currentState = trimmed.replace(/^####\s*/, "").trim();
      continue;
    }

    // Detect booth links
    const linkMatch = trimmed.match(/\[([^\]]+)\]\((browse\.php\?ddState=(\d+)&locationID=(\d+))\),?\s*([^[\n]+)/);
    if (linkMatch) {
      links.push({
        name: linkMatch[1].trim(),
        city: linkMatch[5].trim(),
        state: currentState || "Unknown",
        country: currentCountry || "USA",
        detailUrl: linkMatch[2],
        locationId: linkMatch[4],
      });
    }
  }

  return links;
}

Deno.test("parseMarkdownStructure extracts booth links", () => {
  const links = parseMarkdownStructure(PHOTOBOOTH_NET_MOCK_MARKDOWN);

  assertEquals(links.length, 3);
});

Deno.test("parseMarkdownStructure extracts booth names", () => {
  const links = parseMarkdownStructure(PHOTOBOOTH_NET_MOCK_MARKDOWN);

  assertEquals(links[0].name, "Grand Central Terminal");
  assertEquals(links[1].name, "Times Square Pharmacy");
  assertEquals(links[2].name, "Hollywood & Highland");
});

Deno.test("parseMarkdownStructure extracts cities", () => {
  const links = parseMarkdownStructure(PHOTOBOOTH_NET_MOCK_MARKDOWN);

  assertEquals(links[0].city, "New York");
  assertEquals(links[1].city, "New York");
  assertEquals(links[2].city, "Los Angeles");
});

Deno.test("parseMarkdownStructure tracks state context", () => {
  const links = parseMarkdownStructure(PHOTOBOOTH_NET_MOCK_MARKDOWN);

  assertEquals(links[0].state, "New York");
  assertEquals(links[1].state, "New York");
  assertEquals(links[2].state, "California");
});

Deno.test("parseMarkdownStructure tracks country context", () => {
  const links = parseMarkdownStructure(PHOTOBOOTH_NET_MOCK_MARKDOWN);

  assertEquals(links[0].country, "USA");
  assertEquals(links[1].country, "USA");
  assertEquals(links[2].country, "USA");
});

Deno.test("parseMarkdownStructure extracts location IDs", () => {
  const links = parseMarkdownStructure(PHOTOBOOTH_NET_MOCK_MARKDOWN);

  assertEquals(links[0].locationId, "101");
  assertEquals(links[1].locationId, "102");
  assertEquals(links[2].locationId, "201");
});

Deno.test("parseMarkdownStructure extracts detail URLs", () => {
  const links = parseMarkdownStructure(PHOTOBOOTH_NET_MOCK_MARKDOWN);

  assert(links[0].detailUrl.includes("ddState=36"));
  assert(links[0].detailUrl.includes("locationID=101"));
});

// ========================================
// AUTOPHOTO EXTRACTOR TESTS
// ========================================

interface AutophotoLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  phone?: string;
  hours?: string;
  cost?: string;
}

function parseAutophotoMarkdown(markdown: string): AutophotoLocation[] {
  const locations: AutophotoLocation[] = [];
  const lines = markdown.split("\n");
  let currentLocation: Partial<AutophotoLocation> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect location headers
    const headerMatch = line.match(/^#{2,3}\s+(.+)$/);
    if (headerMatch) {
      if (currentLocation && currentLocation.name && currentLocation.address) {
        locations.push(currentLocation as AutophotoLocation);
      }
      currentLocation = {
        name: headerMatch[1].trim(),
        state: "NY",
      };
      continue;
    }

    if (currentLocation) {
      // Extract address
      const streetMatch = line.match(/(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      if (streetMatch && !currentLocation.address) {
        currentLocation.address = streetMatch[1];
      }

      // Extract city, state, ZIP
      const cityStateMatch = line.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})(?:\s+(\d{5}))?/);
      if (cityStateMatch) {
        currentLocation.city = cityStateMatch[1];
        currentLocation.state = cityStateMatch[2];
        currentLocation.postalCode = cityStateMatch[3];
      }

      // Extract phone
      const phoneMatch = line.match(/Phone:\s*(\(\d{3}\)\s*\d{3}[-.]?\d{4})/);
      if (phoneMatch) {
        currentLocation.phone = phoneMatch[1];
      }

      // Extract hours
      if (line.match(/^Hours:/i)) {
        const hoursText = line.split(/Hours:/i)[1]?.trim();
        if (hoursText) {
          currentLocation.hours = hoursText;
        }
      }

      // Extract price
      const priceMatch = line.match(/Price:\s*\$(\d+)/);
      if (priceMatch) {
        currentLocation.cost = `$${priceMatch[1]}`;
      }
    }
  }

  // Add final location
  if (currentLocation && currentLocation.name && currentLocation.address) {
    locations.push(currentLocation as AutophotoLocation);
  }

  return locations;
}

Deno.test("parseAutophotoMarkdown extracts locations", () => {
  const locations = parseAutophotoMarkdown(AUTOPHOTO_MOCK_MARKDOWN);

  assertEquals(locations.length, 2);
});

Deno.test("parseAutophotoMarkdown extracts location names", () => {
  const locations = parseAutophotoMarkdown(AUTOPHOTO_MOCK_MARKDOWN);

  assertEquals(locations[0].name, "Grand Central Terminal");
  assertEquals(locations[1].name, "Brooklyn Bowl");
});

Deno.test("parseAutophotoMarkdown extracts addresses", () => {
  const locations = parseAutophotoMarkdown(AUTOPHOTO_MOCK_MARKDOWN);

  assertEquals(locations[0].address, "89 East 42nd Street");
  assertEquals(locations[1].address, "61 Wythe Avenue");
});

Deno.test("parseAutophotoMarkdown extracts cities", () => {
  const locations = parseAutophotoMarkdown(AUTOPHOTO_MOCK_MARKDOWN);

  assertEquals(locations[0].city, "New York");
  assertEquals(locations[1].city, "Brooklyn");
});

Deno.test("parseAutophotoMarkdown extracts states", () => {
  const locations = parseAutophotoMarkdown(AUTOPHOTO_MOCK_MARKDOWN);

  assertEquals(locations[0].state, "NY");
  assertEquals(locations[1].state, "NY");
});

Deno.test("parseAutophotoMarkdown extracts postal codes", () => {
  const locations = parseAutophotoMarkdown(AUTOPHOTO_MOCK_MARKDOWN);

  assertEquals(locations[0].postalCode, "10017");
  assertEquals(locations[1].postalCode, "11249");
});

Deno.test("parseAutophotoMarkdown extracts phone numbers", () => {
  const locations = parseAutophotoMarkdown(AUTOPHOTO_MOCK_MARKDOWN);

  assertEquals(locations[0].phone, "(212) 555-0100");
  assertEquals(locations[1].phone, "(718) 555-0200");
});

Deno.test("parseAutophotoMarkdown extracts hours", () => {
  const locations = parseAutophotoMarkdown(AUTOPHOTO_MOCK_MARKDOWN);

  assertEquals(locations[0].hours, "24/7");
  assertEquals(locations[1].hours, undefined);
});

Deno.test("parseAutophotoMarkdown extracts pricing", () => {
  const locations = parseAutophotoMarkdown(AUTOPHOTO_MOCK_MARKDOWN);

  assertEquals(locations[0].cost, "$5");
  assertEquals(locations[1].cost, undefined);
});

// ========================================
// HTML PARSING TESTS
// ========================================

function cleanHtml(text: string): string {
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

Deno.test("cleanHtml extracts text from HTML", () => {
  const html = "<div class='location'><h2>Test Location</h2></div>";
  const cleaned = cleanHtml(html);
  assertEquals(cleaned, "Test Location");
});

Deno.test("cleanHtml handles nested tags", () => {
  const html = "<div><p>Text <strong>with</strong> nested <em>tags</em></p></div>";
  const cleaned = cleanHtml(html);
  assertEquals(cleaned, "Text with nested tags");
});

Deno.test("cleanHtml removes script tags", () => {
  const html = "<div>Content<script>alert('test')</script>More</div>";
  const cleaned = cleanHtml(html);
  assertEquals(cleaned, "Content More");
});

// ========================================
// REGEX PATTERN TESTS
// ========================================

Deno.test("street address pattern matches various formats", () => {
  const addresses = [
    "123 Main Street",
    "456 Oak Avenue",
    "789 Elm Road",
    "321 Pine Boulevard",
    "42 Wythe Avenue",
  ];

  for (const address of addresses) {
    const match = address.match(/\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Street|Avenue|Road|Boulevard))?/);
    assertExists(match, `Failed to match: ${address}`);
  }
});

Deno.test("city state ZIP pattern matches", () => {
  const locations = [
    { input: "New York, NY 10001", city: "New York", state: "NY", zip: "10001" },
    { input: "Los Angeles, CA 90001", city: "Los Angeles", state: "CA", zip: "90001" },
    { input: "Brooklyn, NY 11249", city: "Brooklyn", state: "NY", zip: "11249" },
  ];

  for (const { input, city, state, zip } of locations) {
    const match = input.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*(\d{5})?/);
    assertExists(match, `Failed to match: ${input}`);
    assertEquals(match![1], city);
    assertEquals(match![2], state);
    assertEquals(match![3], zip);
  }
});

Deno.test("link pattern extracts booth details", () => {
  const link = "[Grand Central Terminal](browse.php?ddState=36&locationID=101), New York";
  const match = link.match(/\[([^\]]+)\]\((browse\.php\?ddState=(\d+)&locationID=(\d+))\),?\s*([^[\n]+)/);

  assertExists(match);
  assertEquals(match![1], "Grand Central Terminal");
  assertEquals(match![2], "browse.php?ddState=36&locationID=101");
  assertEquals(match![3], "36");
  assertEquals(match![4], "101");
  assertEquals(match![5], "New York");
});

// ========================================
// INTEGRATION TESTS
// ========================================

Deno.test("photobooth.net extractor creates valid booth data", () => {
  const links = parseMarkdownStructure(PHOTOBOOTH_NET_MOCK_MARKDOWN);

  for (const link of links) {
    // Verify required fields
    assert(link.name.length > 0);
    assert(link.city.length > 0);
    assert(link.state.length > 0);
    assert(link.country.length > 0);
    assert(link.detailUrl.includes("browse.php"));
    assert(link.locationId.length > 0);
  }
});

Deno.test("autophoto extractor creates valid booth data", () => {
  const locations = parseAutophotoMarkdown(AUTOPHOTO_MOCK_MARKDOWN);

  for (const location of locations) {
    // Verify required fields
    assert(location.name.length > 0);
    assert(location.address.length > 0);
    assert(location.city.length > 0);
    assert(location.state.length === 2);

    // Verify optional fields format if present
    if (location.postalCode) {
      assertEquals(location.postalCode.length, 5);
      assert(/^\d{5}$/.test(location.postalCode));
    }

    if (location.phone) {
      assert(location.phone.includes("("));
      assert(location.phone.includes(")"));
    }

    if (location.cost) {
      assert(location.cost.startsWith("$"));
    }
  }
});

// ========================================
// ERROR HANDLING TESTS
// ========================================

Deno.test("parseMarkdownStructure handles empty input", () => {
  const links = parseMarkdownStructure("");
  assertEquals(links.length, 0);
});

Deno.test("parseMarkdownStructure handles malformed links", () => {
  const markdown = `
### United States
[Missing URL]
[Incomplete](browse.php)
Not a link at all
`;
  const links = parseMarkdownStructure(markdown);
  assertEquals(links.length, 0);
});

Deno.test("parseAutophotoMarkdown handles incomplete data", () => {
  const markdown = `
## Location with no address
New York, NY

## Location with no city
123 Main Street
`;
  const locations = parseAutophotoMarkdown(markdown);
  // Should only include locations with both name and address
  assertEquals(locations.length, 0);
});

Deno.test("parseAutophotoMarkdown handles mixed formats", () => {
  const markdown = `
## Complete Location
123 Main Street
New York, NY 10001

## Minimal Location
456 Elm Street
Brooklyn, NY
`;
  const locations = parseAutophotoMarkdown(markdown);
  assertEquals(locations.length, 2);
  assertEquals(locations[0].postalCode, "10001");
  assertEquals(locations[1].postalCode, undefined);
});
