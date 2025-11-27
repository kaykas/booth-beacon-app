/**
 * SPECIALIZED PHOTOMATICA.COM EXTRACTOR
 *
 * Problem: Generic AI extraction fails to capture European booth locations properly
 *
 * Root Cause: Photomatica's pages have specific structure:
 * - European focus (UK, France, Germany, etc.)
 * - Detailed machine specifications (Photo-Me International models)
 * - Location maps with coordinates
 * - Different page structures for permanent vs. pop-up locations
 *
 * Solution: This specialized extractor:
 * 1. Parses location directory with machine details
 * 2. Extracts Photo-Me machine models
 * 3. Handles European address formats
 * 4. Captures operational status and maintenance info
 */

import { ExtractorResult, BoothData } from "./extractors.ts";

interface PhotomaticaLocation {
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  machineModel?: string;
  latitude?: number;
  longitude?: number;
  operationalStatus?: boolean;
  lastMaintenance?: string;
}

/**
 * Main extractor for Photomatica locations
 */
export async function extractPhotomaticaSpecialized(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  console.log("🎯 Using specialized Photomatica extractor");
  const startTime = Date.now();

  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    // Step 1: Parse location directory
    console.log("📋 Step 1: Parsing Photomatica location directory...");
    const locations = parseLocationDirectory(html, markdown);
    console.log(`   Found ${locations.length} locations`);

    // Step 2: Convert to booth data
    for (const location of locations) {
      const booth: BoothData = {
        name: location.name,
        address: location.address,
        city: location.city,
        country: location.country,
        postal_code: location.postalCode,
        machine_model: location.machineModel || "Photo-Me Classic",
        machine_manufacturer: "Photo-Me International",
        latitude: location.latitude,
        longitude: location.longitude,
        source_url: sourceUrl,
        source_name: "photomatica.com",
        status: location.operationalStatus === false ? "inactive" : "active",
        booth_type: "analog",
        is_operational: location.operationalStatus !== false,
        description: location.lastMaintenance
          ? `Last maintenance: ${location.lastMaintenance}`
          : undefined,
      };

      booths.push(booth);
    }

    console.log(`✅ Extracted ${booths.length} Photomatica booth locations`);

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
    console.error("❌ Photomatica extraction failed:", error);
    errors.push(`Photomatica extraction error: ${error.message}`);

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
 * Parse location directory
 */
function parseLocationDirectory(html: string, markdown: string): PhotomaticaLocation[] {
  const locations: PhotomaticaLocation[] = [];

  try {
    // Strategy 1: Parse JSON-LD structured data (if present)
    const jsonLdLocations = parseJsonLd(html);
    if (jsonLdLocations.length > 0) {
      return jsonLdLocations;
    }

    // Strategy 2: Parse markdown structure
    const lines = markdown.split("\n");
    let currentLocation: Partial<PhotomaticaLocation> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect location headers
      const headerMatch = line.match(/^#{2,3}\s+(.+)$/) || line.match(/^\*\*([^*]+)\*\*$/);
      if (headerMatch) {
        // Save previous location
        if (currentLocation && currentLocation.name && currentLocation.address) {
          locations.push(currentLocation as PhotomaticaLocation);
        }

        currentLocation = {
          name: headerMatch[1].trim(),
          country: "Europe", // Default, will be overridden
        };
        continue;
      }

      if (currentLocation) {
        // Extract address
        if (line.match(/^address:|^location:/i)) {
          currentLocation.address = lines[i + 1]?.trim() || line.split(/address:|location:/i)[1]?.trim();
        } else if (!currentLocation.address && line.match(/\d+\s+[A-Z]/)) {
          currentLocation.address = line;
        }

        // Extract city
        if (line.match(/^city:/i)) {
          currentLocation.city = lines[i + 1]?.trim() || line.split(/city:/i)[1]?.trim();
        }

        // Extract country
        if (line.match(/^country:/i)) {
          currentLocation.country = lines[i + 1]?.trim() || line.split(/country:/i)[1]?.trim();
        }

        // Infer country from context (UK, France, Germany, etc.)
        if (line.match(/\b(London|Manchester|Birmingham|Liverpool|Edinburgh)\b/i)) {
          currentLocation.country = "United Kingdom";
          if (!currentLocation.city) {
            const cityMatch = line.match(/\b(London|Manchester|Birmingham|Liverpool|Edinburgh)\b/i);
            if (cityMatch) currentLocation.city = cityMatch[1];
          }
        }
        if (line.match(/\b(Paris|Lyon|Marseille|Toulouse)\b/i)) {
          currentLocation.country = "France";
        }
        if (line.match(/\b(Berlin|Munich|Hamburg|Frankfurt)\b/i)) {
          currentLocation.country = "Germany";
        }

        // Extract postal code (UK, EU formats)
        const postalMatch =
          line.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i) || // UK postcode
          line.match(/\b(\d{5})\b/); // EU postal code
        if (postalMatch) {
          currentLocation.postalCode = postalMatch[1];
        }

        // Extract machine model
        if (line.match(/model:|machine:/i)) {
          const modelText = lines[i + 1]?.trim() || line.split(/model:|machine:/i)[1]?.trim();
          if (modelText && modelText.length > 3) {
            currentLocation.machineModel = modelText;
          }
        }

        // Infer Photo-Me model from mentions
        if (line.match(/photo[-\s]?me/i) && !currentLocation.machineModel) {
          currentLocation.machineModel = "Photo-Me";
        }

        // Extract operational status
        if (line.match(/operational|working|active/i) && !line.match(/not|no longer/i)) {
          currentLocation.operationalStatus = true;
        }
        if (line.match(/out of service|broken|inactive|removed/i)) {
          currentLocation.operationalStatus = false;
        }

        // Extract maintenance info
        if (line.match(/maintenance|serviced|checked/i)) {
          const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})|(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            currentLocation.lastMaintenance = dateMatch[0];
          }
        }

        // Extract coordinates
        const coordMatch = line.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coordMatch) {
          currentLocation.latitude = parseFloat(coordMatch[1]);
          currentLocation.longitude = parseFloat(coordMatch[2]);
        }
      }
    }

    // Add final location
    if (currentLocation && currentLocation.name && currentLocation.address) {
      locations.push(currentLocation as PhotomaticaLocation);
    }

    // Strategy 3: Parse HTML table structure (common for European directories)
    if (locations.length === 0) {
      const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;

      while ((rowMatch = tableRowRegex.exec(html)) !== null) {
        const row = rowMatch[1];
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);

        if (cells && cells.length >= 3) {
          const name = cleanHtml(cells[0]);
          const address = cleanHtml(cells[1]);
          const city = cleanHtml(cells[2]);

          if (name.length > 2 && address.length > 5) {
            locations.push({
              name: name,
              address: address,
              city: city,
              country: "Europe", // Will be geocoded
            });
          }
        }
      }
    }

    // Strategy 4: Parse HTML location cards
    if (locations.length === 0) {
      const cardRegex =
        /<(?:div|article)[^>]*class="[^"]*(?:location|booth|machine)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article)>/gi;
      let match;

      while ((match = cardRegex.exec(html)) !== null) {
        const content = match[1];
        const nameMatch = content.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/i);
        const addressMatch = content.match(
          /<(?:p|div)[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)<\/(?:p|div)>/i
        );

        if (nameMatch && addressMatch) {
          const cleanContent = cleanHtml(content);

          // Infer country from content
          let country = "Europe";
          if (cleanContent.match(/\b(UK|United Kingdom|Britain)\b/i)) country = "United Kingdom";
          if (cleanContent.match(/\b(France|French)\b/i)) country = "France";
          if (cleanContent.match(/\b(Germany|German|Deutschland)\b/i)) country = "Germany";

          locations.push({
            name: cleanHtml(nameMatch[1]),
            address: cleanHtml(addressMatch[1]),
            city: "",
            country: country,
          });
        }
      }
    }
  } catch (error) {
    console.error("Location parsing error:", error);
  }

  return locations;
}

/**
 * Parse JSON-LD structured data
 */
function parseJsonLd(html: string): PhotomaticaLocation[] {
  const locations: PhotomaticaLocation[] = [];

  try {
    const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);

        if (data["@type"] === "ItemList" && data.itemListElement) {
          for (const item of data.itemListElement) {
            if (item.location || item.address) {
              locations.push({
                name: item.name || "Photo booth",
                address: item.location?.address || item.address?.streetAddress || "",
                city: item.location?.addressLocality || item.address?.addressLocality || "",
                country: item.location?.addressCountry || item.address?.addressCountry || "Europe",
                latitude: item.location?.geo?.latitude || item.geo?.latitude,
                longitude: item.location?.geo?.longitude || item.geo?.longitude,
              });
            }
          }
        }
      } catch (parseError) {
        console.warn("Failed to parse JSON-LD block:", parseError);
      }
    }
  } catch (error) {
    console.error("JSON-LD extraction error:", error);
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
