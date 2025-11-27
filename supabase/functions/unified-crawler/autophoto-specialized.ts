/**
 * SPECIALIZED AUTOPHOTO.ORG EXTRACTOR
 *
 * Problem: Generic AI extraction misses booth locations or extracts incomplete data
 *
 * Root Cause: AUTOPHOTO's location pages have specific structure:
 * - Individual location pages with detailed specs
 * - Consistent address format: Street, City, State ZIP
 * - Machine specifications (model, manufacturer)
 * - Hours, pricing, payment methods
 * - All booths are Photo-Booth Inc. machines
 *
 * Solution: This specialized extractor:
 * 1. Parses the location list/map page
 * 2. Extracts structured address data
 * 3. Captures machine specs and pricing
 * 4. Handles multi-location venues (e.g., multiple machines in Grand Central)
 */

import { ExtractorResult, BoothData } from "./extractors";

interface AutophotoLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  phone?: string;
  hours?: string;
  cost?: string;
  machineModel?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

/**
 * Main extractor for AUTOPHOTO locations
 */
export async function extractAutophotoSpecialized(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  console.log("🎯 Using specialized AUTOPHOTO extractor");
  const startTime = Date.now();

  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    // Step 1: Parse location list
    console.log("📋 Step 1: Parsing AUTOPHOTO location list...");
    const locations = parseLocationList(html, markdown);
    console.log(`   Found ${locations.length} locations`);

    // Step 2: Convert to booth data
    for (const location of locations) {
      const booth: BoothData = {
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        country: "USA", // AUTOPHOTO is NYC/Northeast focused
        postal_code: location.postalCode,
        phone: location.phone,
        hours: location.hours,
        cost: location.cost,
        machine_model: location.machineModel || "Photo-Booth Classic",
        machine_manufacturer: "Photo-Booth Inc.",
        latitude: location.latitude,
        longitude: location.longitude,
        source_url: sourceUrl,
        source_name: "autophoto.org",
        status: "active",
        booth_type: "analog",
        is_operational: true,
        description: location.notes,
      };

      booths.push(booth);
    }

    console.log(`✅ Extracted ${booths.length} AUTOPHOTO booth locations`);

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
    console.error("❌ AUTOPHOTO extraction failed:", error);
    errors.push(`AUTOPHOTO extraction error: ${error.message}`);

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
 * Parse location list from HTML/markdown
 */
function parseLocationList(html: string, markdown: string): AutophotoLocation[] {
  const locations: AutophotoLocation[] = [];

  try {
    // Strategy 1: Parse markdown structure
    const lines = markdown.split("\n");
    let currentLocation: Partial<AutophotoLocation> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect location headers (h2, h3, or bold)
      const headerMatch = line.match(/^#{2,3}\s+(.+)$/) || line.match(/^\*\*([^*]+)\*\*$/);
      if (headerMatch) {
        // Save previous location
        if (currentLocation && currentLocation.name && currentLocation.address) {
          locations.push(currentLocation as AutophotoLocation);
        }

        currentLocation = {
          name: headerMatch[1].trim(),
          state: "NY", // Default to NY for AUTOPHOTO
        };
        continue;
      }

      if (currentLocation) {
        // Extract address - look for street patterns
        const streetMatch = line.match(
          /(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Plaza|Place|Pl|Way|Drive|Dr|Lane|Ln|Court|Ct))?)/i
        );
        if (streetMatch && !currentLocation.address) {
          currentLocation.address = streetMatch[1];
        }

        // Extract city, state, ZIP pattern
        const cityStateMatch = line.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})(?:\s+(\d{5}))?/);
        if (cityStateMatch) {
          currentLocation.city = cityStateMatch[1];
          currentLocation.state = cityStateMatch[2];
          currentLocation.postalCode = cityStateMatch[3];
        }

        // Extract phone number
        const phoneMatch = line.match(/(\(\d{3}\)\s*\d{3}[-.]?\d{4})|(\d{3}[-.]?\d{3}[-.]?\d{4})/);
        if (phoneMatch) {
          currentLocation.phone = phoneMatch[0];
        }

        // Extract hours
        if (line.match(/hours?:/i)) {
          const hoursText = lines[i + 1]?.trim() || line.split(/hours?:/i)[1]?.trim();
          if (hoursText && hoursText.length > 3) {
            currentLocation.hours = hoursText;
          }
        }

        // Extract pricing
        const priceMatch = line.match(/\$(\d+(?:\.\d{2})?)|price[:\s]+\$?(\d+)/i);
        if (priceMatch) {
          currentLocation.cost = `$${priceMatch[1] || priceMatch[2]}`;
        }

        // Extract machine model
        if (line.match(/model[:\s]/i)) {
          const modelText = line.split(/model[:\s]/i)[1]?.trim() || lines[i + 1]?.trim();
          if (modelText && modelText.length > 3) {
            currentLocation.machineModel = modelText;
          }
        }

        // Extract coordinates
        const coordMatch = line.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coordMatch) {
          currentLocation.latitude = parseFloat(coordMatch[1]);
          currentLocation.longitude = parseFloat(coordMatch[2]);
        }

        // Extract location notes
        if (line.match(/note:|details:|info:/i)) {
          const noteText = line.split(/note:|details:|info:/i)[1]?.trim();
          if (noteText) {
            currentLocation.notes = noteText;
          }
        }
      }
    }

    // Add final location
    if (currentLocation && currentLocation.name && currentLocation.address) {
      locations.push(currentLocation as AutophotoLocation);
    }

    // Strategy 2: Parse HTML structure if markdown failed
    if (locations.length === 0) {
      const locationRegex = /<div[^>]*class="[^"]*(?:location|venue|booth)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      let match;

      while ((match = locationRegex.exec(html)) !== null) {
        const content = match[1];
        const nameMatch = content.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/i);
        const addressMatch = content.match(
          /<(?:p|div)[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)<\/(?:p|div)>/i
        );

        if (nameMatch) {
          const cleanContent = cleanHtml(content);
          const cityStateMatch = cleanContent.match(/([A-Z][a-z]+),\s*([A-Z]{2})\s*(\d{5})?/);

          const location: AutophotoLocation = {
            name: cleanHtml(nameMatch[1]),
            address: addressMatch ? cleanHtml(addressMatch[1]) : "",
            city: cityStateMatch?.[1] || "",
            state: cityStateMatch?.[2] || "NY",
            postalCode: cityStateMatch?.[3],
          };

          // Extract phone from content
          const phoneMatch = cleanContent.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
          if (phoneMatch) location.phone = phoneMatch[0];

          // Extract price from content
          const priceMatch = cleanContent.match(/\$(\d+)/);
          if (priceMatch) location.cost = `$${priceMatch[1]}`;

          if (location.name && location.address) {
            locations.push(location);
          }
        }
      }
    }

    // Strategy 3: Parse table structure (if locations are in a table)
    if (locations.length === 0) {
      const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;

      while ((rowMatch = tableRowRegex.exec(html)) !== null) {
        const row = rowMatch[1];
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);

        if (cells && cells.length >= 2) {
          const name = cleanHtml(cells[0]);
          const address = cleanHtml(cells[1]);

          // Look for US address patterns
          if (address.match(/\d+\s+[A-Z][a-z]/)) {
            const cityStateMatch = address.match(/([A-Z][a-z]+),\s*([A-Z]{2})/);

            locations.push({
              name: name,
              address: address,
              city: cityStateMatch?.[1] || "",
              state: cityStateMatch?.[2] || "NY",
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
