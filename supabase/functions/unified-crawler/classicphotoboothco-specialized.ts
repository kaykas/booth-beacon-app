/**
 * SPECIALIZED CLASSICPHOTOBOOTHCO.COM EXTRACTOR
 *
 * Problem: Generic AI extraction misses venue placements and case studies
 *
 * Root Cause: Classic Photo Booth Co has scattered location data:
 * - Blog posts and case studies with venue details
 * - Portfolio pages with installation photos
 * - Venue pages with multiple sections
 * - Embedded maps with location markers
 *
 * Solution: This specialized extractor:
 * 1. Parses portfolio/case study pages
 * 2. Extracts venue names and addresses from blog content
 * 3. Captures installation dates and venue types
 * 4. Handles embedded location data and map markers
 */

import { ExtractorResult, BoothData } from "./extractors.ts";

interface ClassicBoothLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  venueType?: string;
  installationYear?: string;
  machineModel?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  phone?: string;
}

/**
 * Main extractor for Classic Photo Booth Co locations
 */
export async function extractClassicPhotoBoothCoSpecialized(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  console.log("🎯 Using specialized Classic Photo Booth Co extractor");
  const startTime = Date.now();

  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    // Step 1: Parse location/venue pages
    console.log("📋 Step 1: Parsing venue placements...");
    const locations = parseVenuePages(html, markdown);
    console.log(`   Found ${locations.length} venue locations`);

    // Step 2: Convert to booth data
    for (const location of locations) {
      const booth: BoothData = {
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        country: "USA", // Classic Photo Booth Co is US-based
        postal_code: location.postalCode,
        phone: location.phone,
        website: location.website,
        machine_model: location.machineModel || "Photo-Booth Classic",
        machine_manufacturer: "Classic Photo Booth Co.",
        latitude: location.latitude,
        longitude: location.longitude,
        source_url: sourceUrl,
        source_name: "classicphotoboothco.com",
        status: "active",
        booth_type: "analog",
        is_operational: true,
        description: buildDescription(location),
      };

      booths.push(booth);
    }

    console.log(`✅ Extracted ${booths.length} Classic Photo Booth Co locations`);

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
    console.error("❌ Classic Photo Booth Co extraction failed:", error);
    errors.push(`Classic Photo Booth Co extraction error: ${error.message}`);

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
 * Parse venue pages and case studies
 */
function parseVenuePages(html: string, markdown: string): ClassicBoothLocation[] {
  const locations: ClassicBoothLocation[] = [];

  try {
    // Strategy 1: Parse markdown structure
    const lines = markdown.split("\n");
    let currentVenue: Partial<ClassicBoothLocation> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect venue headers
      const headerMatch = line.match(/^#{2,3}\s+(.+)$/) || line.match(/^\*\*([^*]+)\*\*$/);
      if (headerMatch) {
        // Save previous venue
        if (currentVenue && currentVenue.name && currentVenue.address) {
          locations.push(currentVenue as ClassicBoothLocation);
        }

        currentVenue = {
          name: headerMatch[1].trim(),
          city: "",
          state: "",
        };
        continue;
      }

      if (currentVenue) {
        // Extract location/address
        if (line.match(/location[:\s]|address[:\s]/i)) {
          currentVenue.address = lines[i + 1]?.trim() || line.split(/location[:\s]|address[:\s]/i)[1]?.trim();
        } else if (!currentVenue.address && line.match(/\d+\s+[A-Z][a-z]/)) {
          currentVenue.address = line;
        }

        // Extract city, state, ZIP
        const cityStateMatch = line.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})(?:\s+(\d{5}))?/);
        if (cityStateMatch) {
          currentVenue.city = cityStateMatch[1];
          currentVenue.state = cityStateMatch[2];
          currentVenue.postalCode = cityStateMatch[3];
        }

        // Extract venue type
        if (line.match(/venue type[:\s]|type[:\s]/i)) {
          const venueType = lines[i + 1]?.trim() || line.split(/venue type[:\s]|type[:\s]/i)[1]?.trim();
          if (venueType && venueType.length > 3) {
            currentVenue.venueType = venueType;
          }
        }

        // Infer venue type from keywords
        if (line.match(/\b(bar|pub|tavern)\b/i) && !currentVenue.venueType) {
          currentVenue.venueType = "Bar/Pub";
        }
        if (line.match(/\b(restaurant|diner|cafe)\b/i) && !currentVenue.venueType) {
          currentVenue.venueType = "Restaurant/Cafe";
        }
        if (line.match(/\b(arcade|game|entertainment)\b/i) && !currentVenue.venueType) {
          currentVenue.venueType = "Arcade/Entertainment";
        }
        if (line.match(/\b(mall|shopping center)\b/i) && !currentVenue.venueType) {
          currentVenue.venueType = "Shopping Mall";
        }
        if (line.match(/\b(hotel|resort)\b/i) && !currentVenue.venueType) {
          currentVenue.venueType = "Hotel/Resort";
        }

        // Extract installation year
        const yearMatch = line.match(/installed[:\s]|since[:\s]|(\b(19|20)\d{2}\b)/i);
        if (yearMatch) {
          const year = yearMatch[1] || line.match(/\b(19|20)\d{2}\b/)?.[0];
          if (year && parseInt(year) > 1900 && parseInt(year) <= new Date().getFullYear()) {
            currentVenue.installationYear = year;
          }
        }

        // Extract machine model
        if (line.match(/model[:\s]/i)) {
          const modelText = line.split(/model[:\s]/i)[1]?.trim() || lines[i + 1]?.trim();
          if (modelText && modelText.length > 3) {
            currentVenue.machineModel = modelText;
          }
        }

        // Extract contact info
        const phoneMatch = line.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
        if (phoneMatch) {
          currentVenue.phone = phoneMatch[0];
        }

        const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch && !urlMatch[1].includes("classicphotoboothco.com")) {
          currentVenue.website = urlMatch[1];
        }

        // Extract coordinates
        const coordMatch = line.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coordMatch) {
          currentVenue.latitude = parseFloat(coordMatch[1]);
          currentVenue.longitude = parseFloat(coordMatch[2]);
        }
      }
    }

    // Add final venue
    if (currentVenue && currentVenue.name && currentVenue.address) {
      locations.push(currentVenue as ClassicBoothLocation);
    }

    // Strategy 2: Parse HTML case study cards
    if (locations.length === 0) {
      const cardRegex =
        /<(?:div|article)[^>]*class="[^"]*(?:location|venue|case-study|portfolio)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article)>/gi;
      let match;

      while ((match = cardRegex.exec(html)) !== null) {
        const content = match[1];
        const nameMatch = content.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/i);

        if (nameMatch) {
          const cleanContent = cleanHtml(content);

          // Look for address patterns
          const addressMatch = cleanContent.match(
            /(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd))?)/i
          );

          const cityStateMatch = cleanContent.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/);

          if (addressMatch || cityStateMatch) {
            const location: ClassicBoothLocation = {
              name: cleanHtml(nameMatch[1]),
              address: addressMatch ? addressMatch[1] : "",
              city: cityStateMatch?.[1] || "",
              state: cityStateMatch?.[2] || "",
            };

            // Extract venue type from content
            if (cleanContent.match(/\bbar\b|\bpub\b|\btavern\b/i)) {
              location.venueType = "Bar/Pub";
            } else if (cleanContent.match(/\brestaurant\b|\bdiner\b|\bcafe\b/i)) {
              location.venueType = "Restaurant/Cafe";
            }

            // Extract installation year
            const yearMatch = cleanContent.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
              location.installationYear = yearMatch[0];
            }

            if (location.name && (location.address || location.city)) {
              locations.push(location);
            }
          }
        }
      }
    }

    // Strategy 3: Parse blog posts with location mentions
    if (locations.length === 0) {
      const blogRegex = /<article[^>]*class="[^"]*(?:post|blog)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
      let blogMatch;

      while ((blogMatch = blogRegex.exec(html)) !== null) {
        const content = blogMatch[1];
        const titleMatch = content.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);

        if (titleMatch) {
          const cleanContent = cleanHtml(content);

          // Look for venue installation mentions
          const venueMatch = cleanContent.match(
            /(?:installed|placed|booth)\s+(?:at|in)\s+([^,]+),\s*([A-Z][a-z]+),\s*([A-Z]{2})/i
          );

          if (venueMatch) {
            locations.push({
              name: venueMatch[1].trim(),
              address: venueMatch[1].trim(),
              city: venueMatch[2],
              state: venueMatch[3],
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Venue parsing error:", error);
  }

  return locations;
}

/**
 * Build description from location data
 */
function buildDescription(location: ClassicBoothLocation): string {
  const parts: string[] = [];

  if (location.venueType) {
    parts.push(`Venue type: ${location.venueType}`);
  }

  if (location.installationYear) {
    parts.push(`Installed: ${location.installationYear}`);
  }

  if (parts.length === 0) {
    return "Classic Photo Booth Co installation";
  }

  return parts.join(" - ");
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
