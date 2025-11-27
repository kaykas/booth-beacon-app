/**
 * SPECIALIZED PHOTOMATIC.NET EXTRACTOR
 *
 * Problem: Generic AI extraction fails for Australian/NZ booth directory
 *
 * Root Cause: Photomatic.net has specific structure:
 * - Australia and New Zealand focused
 * - State-based organization (NSW, VIC, QLD, SA, WA, etc.)
 * - List format with consistent address patterns
 * - Some locations use suburb names instead of city names
 *
 * Solution: This specialized extractor:
 * 1. Parses state-organized location lists
 * 2. Handles Australian address formats and state codes
 * 3. Extracts suburb/city names correctly
 * 4. Identifies New Zealand locations separately
 */

import { ExtractorResult, BoothData } from "./extractors";

interface PhotomaticLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

// Australian states and territories
const AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

// New Zealand regions (often abbreviated)
const NZ_REGIONS = ["AKL", "WLG", "CHC", "DUD", "WGN", "Auckland", "Wellington", "Christchurch"];

/**
 * Main extractor for Photomatic locations
 */
export async function extractPhotomaticSpecialized(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  console.log("🎯 Using specialized Photomatic.net extractor");
  const startTime = Date.now();

  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    // Step 1: Parse location list
    console.log("📋 Step 1: Parsing Photomatic location list...");
    const locations = parseLocationList(html, markdown);
    console.log(`   Found ${locations.length} locations`);

    // Step 2: Convert to booth data
    for (const location of locations) {
      const booth: BoothData = {
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        country: location.country,
        postal_code: location.postalCode,
        latitude: location.latitude,
        longitude: location.longitude,
        source_url: sourceUrl,
        source_name: "photomatic.net",
        status: "active",
        booth_type: "analog",
        is_operational: true,
        machine_manufacturer: "Photomatic",
      };

      booths.push(booth);
    }

    console.log(`✅ Extracted ${booths.length} Photomatic booth locations`);

    return {
      booths,
      errors,
      metadata: {
        pages_processed: 1,
        total_found: booths.length,
        extraction_time_ms: Date.now() - startTime,
      },
    };
  } catch (error: any) {
    console.error("❌ Photomatic extraction failed:", error);
    errors.push(`Photomatic extraction error: ${error.message}`);

    return {
      booths,
      errors,
      metadata: {
        pages_processed: 0,
        total_found: 0,
        extraction_time_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * Parse location list
 */
function parseLocationList(html: string, markdown: string): PhotomaticLocation[] {
  const locations: PhotomaticLocation[] = [];

  try {
    // Strategy 1: Parse markdown by state sections
    const lines = markdown.split("\n");
    let currentState = "";
    let currentCountry = "Australia";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect state/region headers
      // Pattern: "## New South Wales" or "## NSW"
      const stateHeaderMatch = line.match(/^#{2,3}\s+(.+)$/);
      if (stateHeaderMatch) {
        const header = stateHeaderMatch[1].trim();

        // Check if it's an Australian state
        if (AUSTRALIAN_STATES.includes(header)) {
          currentState = header;
          currentCountry = "Australia";
        } else if (header.match(/New South Wales/i)) {
          currentState = "NSW";
          currentCountry = "Australia";
        } else if (header.match(/Victoria/i)) {
          currentState = "VIC";
          currentCountry = "Australia";
        } else if (header.match(/Queensland/i)) {
          currentState = "QLD";
          currentCountry = "Australia";
        } else if (header.match(/South Australia/i)) {
          currentState = "SA";
          currentCountry = "Australia";
        } else if (header.match(/Western Australia/i)) {
          currentState = "WA";
          currentCountry = "Australia";
        } else if (header.match(/Tasmania/i)) {
          currentState = "TAS";
          currentCountry = "Australia";
        } else if (header.match(/Northern Territory/i)) {
          currentState = "NT";
          currentCountry = "Australia";
        } else if (header.match(/Australian Capital Territory|ACT/i)) {
          currentState = "ACT";
          currentCountry = "Australia";
        } else if (NZ_REGIONS.some((r) => header.includes(r))) {
          currentState = header;
          currentCountry = "New Zealand";
        } else if (header.match(/New Zealand/i)) {
          currentCountry = "New Zealand";
          currentState = "";
        }

        continue;
      }

      // Parse location entries
      // Pattern 1: "Name - Address, City, State"
      const pattern1Match = line.match(/^(.+?)\s*[-–—]\s*(.+?),\s*([^,]+)(?:,\s*([A-Z]{2,3}))?/);
      if (pattern1Match && pattern1Match[1].length > 2) {
        const name = pattern1Match[1].trim();
        const address = pattern1Match[2].trim();
        const city = pattern1Match[3].trim();
        const state = pattern1Match[4]?.trim() || currentState;

        // Determine country from state
        let country = currentCountry;
        if (AUSTRALIAN_STATES.includes(state)) {
          country = "Australia";
        } else if (NZ_REGIONS.some((r) => state.includes(r))) {
          country = "New Zealand";
        }

        locations.push({
          name: name,
          address: address,
          city: city,
          state: state,
          country: country,
        });
        continue;
      }

      // Pattern 2: "City: Name - Address"
      const pattern2Match = line.match(/^([A-Z][a-z]+):\s*(.+?)\s*[-–—]\s*(.+)/);
      if (pattern2Match) {
        const city = pattern2Match[1].trim();
        const name = pattern2Match[2].trim();
        const address = pattern2Match[3].trim();

        locations.push({
          name: name,
          address: address,
          city: city,
          state: currentState,
          country: currentCountry,
        });
        continue;
      }

      // Pattern 3: List items with location info
      // "- Name, Address, City State"
      const pattern3Match = line.match(/^[-*]\s*(.+?),\s*(.+?),\s*([^,]+)\s+([A-Z]{2,3})/);
      if (pattern3Match) {
        const name = pattern3Match[1].trim();
        const address = pattern3Match[2].trim();
        const city = pattern3Match[3].trim();
        const state = pattern3Match[4].trim();

        let country = currentCountry;
        if (AUSTRALIAN_STATES.includes(state)) {
          country = "Australia";
        }

        locations.push({
          name: name,
          address: address,
          city: city,
          state: state,
          country: country,
        });
        continue;
      }

      // Pattern 4: Simple comma-separated format
      // "Name, Address, Suburb/City"
      const pattern4Match = line.match(/^([^,]+),\s*([^,]+),\s*([^,\n]+)/);
      if (pattern4Match && pattern4Match[1].length > 2 && currentState) {
        const name = pattern4Match[1].trim();
        const address = pattern4Match[2].trim();
        const city = pattern4Match[3].trim();

        // Skip if it looks like a header or invalid data
        if (
          !name.match(/^(Name|Location|Venue|State)/i) &&
          address.match(/\d/) // Address should have numbers
        ) {
          locations.push({
            name: name,
            address: address,
            city: city,
            state: currentState,
            country: currentCountry,
          });
        }
      }
    }

    // Strategy 2: Parse HTML list structure
    if (locations.length === 0) {
      const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let match;

      while ((match = listItemRegex.exec(html)) !== null) {
        const content = cleanHtml(match[1]);

        // Try different patterns
        const parts = content.split(/[-–—,]/).map((p) => p.trim());

        if (parts.length >= 3 && parts[0].length > 2) {
          // Detect state from parts
          const stateMatch = parts[parts.length - 1].match(/\b([A-Z]{2,3})\b/);
          const state = stateMatch ? stateMatch[1] : "";

          const country = AUSTRALIAN_STATES.includes(state)
            ? "Australia"
            : NZ_REGIONS.includes(state)
            ? "New Zealand"
            : "Australia";

          locations.push({
            name: parts[0],
            address: parts[1],
            city: parts[2],
            state: state,
            country: country,
          });
        }
      }
    }

    // Strategy 3: Parse table structure
    if (locations.length === 0) {
      const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;

      while ((rowMatch = tableRowRegex.exec(html)) !== null) {
        const row = rowMatch[1];
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);

        if (cells && cells.length >= 3) {
          const name = cleanHtml(cells[0]);
          const address = cleanHtml(cells[1]);
          const cityState = cleanHtml(cells[2]);

          const stateMatch = cityState.match(/([A-Z]{2,3})$/);
          const state = stateMatch ? stateMatch[1] : "";
          const city = cityState.replace(/,?\s*[A-Z]{2,3}$/, "").trim();

          if (name.length > 2 && address.length > 5) {
            locations.push({
              name: name,
              address: address,
              city: city,
              state: state,
              country: AUSTRALIAN_STATES.includes(state) ? "Australia" : "New Zealand",
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Location parsing error:", error);
  }

  return locations;
}

/**
 * Clean HTML helper
 */
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
