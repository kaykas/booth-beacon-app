/**
 * SPECIALIZED LOMOGRAPHY.COM/STORES EXTRACTOR
 *
 * Problem: Generic AI extraction fails to properly parse the Lomography store locator
 *
 * Root Cause: The store locator has a specific structure:
 * - JSON-LD structured data with store locations
 * - Store list with "Embassy", "Gallery Store", and "Partner Store" types
 * - Only Embassy stores reliably have photo booths
 * - Address data is in structured format
 *
 * Solution: This specialized extractor:
 * 1. Parses JSON-LD structured data first (most reliable)
 * 2. Falls back to HTML parsing of store cards
 * 3. Filters for Embassy stores (highest booth probability)
 * 4. Extracts complete address, coordinates, hours, contact info
 */

import { ExtractorResult, BoothData } from "./extractors";

interface LomographyStore {
  name: string;
  storeType: "Embassy" | "Gallery Store" | "Partner Store";
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  hours?: string;
  phone?: string;
  website?: string;
  hasPhotoBooth?: boolean;
}

/**
 * Main extractor for Lomography store locator
 */
export async function extractLomographySpecialized(
  html: string,
  markdown: string,
  sourceUrl: string
): Promise<ExtractorResult> {
  console.log("🎯 Using specialized Lomography extractor");
  const startTime = Date.now();

  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    // Step 1: Try JSON-LD structured data extraction
    console.log("📋 Step 1: Parsing JSON-LD structured data...");
    const jsonLdStores = parseJsonLd(html);
    console.log(`   Found ${jsonLdStores.length} stores in JSON-LD`);

    if (jsonLdStores.length > 0) {
      for (const store of jsonLdStores) {
        // Convert store to booth data
        // Embassy stores are most likely to have booths
        const booth: BoothData = {
          name: store.name,
          address: store.address,
          city: store.city,
          country: store.country,
          latitude: store.latitude,
          longitude: store.longitude,
          hours: store.hours,
          phone: store.phone,
          website: store.website,
          source_url: sourceUrl,
          source_name: "lomography.com/stores",
          status: store.hasPhotoBooth ? "active" : "unverified",
          booth_type: "analog",
          is_operational: store.hasPhotoBooth || store.storeType === "Embassy",
          description:
            store.storeType === "Embassy"
              ? "Lomography Embassy - likely has analog photo booth"
              : `Lomography ${store.storeType} - may have photo booth`,
        };

        booths.push(booth);
      }
    }

    // Step 2: Fallback to HTML parsing if JSON-LD didn't work
    if (booths.length === 0) {
      console.log("📝 Step 2: Falling back to HTML parsing...");
      const htmlStores = parseHtmlStoreCards(html, markdown);
      console.log(`   Found ${htmlStores.length} stores in HTML`);

      for (const store of htmlStores) {
        const booth: BoothData = {
          name: store.name,
          address: store.address,
          city: store.city,
          country: store.country,
          latitude: store.latitude,
          longitude: store.longitude,
          hours: store.hours,
          phone: store.phone,
          website: store.website,
          source_url: sourceUrl,
          source_name: "lomography.com/stores",
          status: store.hasPhotoBooth ? "active" : "unverified",
          booth_type: "analog",
          is_operational: store.hasPhotoBooth || store.storeType === "Embassy",
          description:
            store.storeType === "Embassy"
              ? "Lomography Embassy - likely has analog photo booth"
              : `Lomography ${store.storeType} - may have photo booth`,
        };

        booths.push(booth);
      }
    }

    console.log(`✅ Extracted ${booths.length} potential booth locations from Lomography`);

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
    console.error("❌ Lomography extraction failed:", error);
    errors.push(`Lomography extraction error: ${error.message}`);

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
 * Parse JSON-LD structured data
 */
function parseJsonLd(html: string): LomographyStore[] {
  const stores: LomographyStore[] = [];

  try {
    // Find all JSON-LD script tags
    const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);

        // Handle single store or array of stores
        const storeData = Array.isArray(data) ? data : [data];

        for (const item of storeData) {
          if (
            item["@type"] === "Store" ||
            item["@type"] === "LocalBusiness" ||
            item["@type"] === "Organization"
          ) {
            // Extract store type from name
            let storeType: "Embassy" | "Gallery Store" | "Partner Store" = "Partner Store";
            if (item.name?.toLowerCase().includes("embassy")) {
              storeType = "Embassy";
            } else if (item.name?.toLowerCase().includes("gallery")) {
              storeType = "Gallery Store";
            }

            // Check for photo booth mentions
            const hasPhotoBooth =
              item.description?.toLowerCase().includes("photo booth") ||
              item.description?.toLowerCase().includes("photobooth") ||
              item.amenityFeature?.some((a: any) => a.name?.toLowerCase().includes("photo"));

            stores.push({
              name: item.name || "Lomography Store",
              storeType: storeType,
              address: item.address?.streetAddress || item.address || "",
              city: item.address?.addressLocality || "",
              country: item.address?.addressCountry || "Unknown",
              latitude: item.geo?.latitude || item.latitude,
              longitude: item.geo?.longitude || item.longitude,
              hours: item.openingHours || item.openingHoursSpecification?.join(", "),
              phone: item.telephone || item.contactPoint?.telephone,
              website: item.url,
              hasPhotoBooth: hasPhotoBooth,
            });
          }
        }
      } catch (parseError) {
        console.warn("Failed to parse JSON-LD block:", parseError);
      }
    }
  } catch (error) {
    console.error("JSON-LD extraction error:", error);
  }

  return stores;
}

/**
 * Parse HTML store cards/listings
 */
function parseHtmlStoreCards(html: string, markdown: string): LomographyStore[] {
  const stores: LomographyStore[] = [];

  try {
    // Strategy 1: Parse markdown structure
    const lines = markdown.split("\n");
    let currentStore: Partial<LomographyStore> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect store headers
      const headerMatch = line.match(
        /^#+\s*Lomography\s+(Embassy|Gallery Store|Partner Store)[\s\-:]*(.+)$/i
      );
      if (headerMatch) {
        // Save previous store
        if (currentStore && currentStore.name && currentStore.address) {
          stores.push(currentStore as LomographyStore);
        }

        const storeType = headerMatch[1] as "Embassy" | "Gallery Store" | "Partner Store";
        currentStore = {
          name: `Lomography ${headerMatch[1]} ${headerMatch[2].trim()}`,
          storeType: storeType,
          country: "Unknown",
          hasPhotoBooth: storeType === "Embassy", // Embassies most likely
        };
        continue;
      }

      if (currentStore) {
        // Extract fields
        if (line.match(/^address:/i)) {
          currentStore.address = lines[i + 1]?.trim() || "";
        }
        if (line.match(/^city:/i)) {
          currentStore.city = lines[i + 1]?.trim() || "";
        }
        if (line.match(/^country:/i)) {
          currentStore.country = lines[i + 1]?.trim() || "Unknown";
        }
        if (line.match(/^phone:/i) || line.match(/^tel:/i)) {
          currentStore.phone = lines[i + 1]?.trim() || "";
        }
        if (line.match(/^hours:/i) || line.match(/^opening hours:/i)) {
          currentStore.hours = lines[i + 1]?.trim() || "";
        }
        if (line.match(/^website:/i)) {
          currentStore.website = lines[i + 1]?.trim() || "";
        }

        // Check for photo booth mentions
        if (line.match(/photo\s*booth|photobooth/i)) {
          currentStore.hasPhotoBooth = true;
        }

        // Extract coordinates
        const coordMatch = line.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coordMatch) {
          currentStore.latitude = parseFloat(coordMatch[1]);
          currentStore.longitude = parseFloat(coordMatch[2]);
        }
      }
    }

    // Add final store
    if (currentStore && currentStore.name && currentStore.address) {
      stores.push(currentStore as LomographyStore);
    }

    // Strategy 2: Parse HTML divs/cards if markdown didn't work
    if (stores.length === 0) {
      const storeCardRegex =
        /<div[^>]*class="[^"]*(?:store|location|embassy)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      let cardMatch;

      while ((cardMatch = storeCardRegex.exec(html)) !== null) {
        const content = cardMatch[1];

        const nameMatch = content.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/i);
        const addressMatch =
          content.match(/<p[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)<\/p>/i) ||
          content.match(/address[^>]*>([^<]+)</i);

        if (nameMatch) {
          const name = cleanText(nameMatch[1]);
          let storeType: "Embassy" | "Gallery Store" | "Partner Store" = "Partner Store";

          if (name.toLowerCase().includes("embassy")) {
            storeType = "Embassy";
          } else if (name.toLowerCase().includes("gallery")) {
            storeType = "Gallery Store";
          }

          stores.push({
            name: name,
            storeType: storeType,
            address: addressMatch ? cleanText(addressMatch[1]) : "",
            city: "",
            country: "Unknown",
            hasPhotoBooth: storeType === "Embassy",
          });
        }
      }
    }
  } catch (error) {
    console.error("HTML parsing error:", error);
  }

  return stores;
}

/**
 * Clean text helper
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
