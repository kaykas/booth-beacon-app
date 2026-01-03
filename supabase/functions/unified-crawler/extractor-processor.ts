/**
 * Extractor Processor - Handles booth extraction from crawled pages
 * Used by both sync and async crawling
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  extractPhotoboothNetEnhanced,
  extractDirectoryEnhanced,
  extractOperatorEnhanced,
  extractBlogEnhanced,
  extractCommunityEnhanced,
  extractCityGuideEnhanced,
  extractGeneric,
  type BoothData,
  type ExtractorResult,
} from "./extractors.ts";
import { validateCountry } from "./country-validation.ts";

interface ExtractBoothsParams {
  pages: Array<{
    url?: string;
    markdown?: string;
    html?: string;
    metadata?: any;
  }>;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  extractorType: string;
  anthropicApiKey: string;
}

interface ExtractBoothsResult {
  booths_found: number;
  booths_added: number;
  booths_updated: number;
  extraction_time_ms: number;
  errors: string[];
}

/**
 * Extract booths from crawled pages and save to database
 */
export async function extractBooths(params: ExtractBoothsParams): Promise<ExtractBoothsResult> {
  const { pages, sourceId, sourceName, sourceUrl, extractorType, anthropicApiKey } = params;
  const extractionStartTime = Date.now();

  console.log(`🔍 Extracting booths from ${pages.length} pages for ${sourceName}`);

  // Combine all pages into single content for extraction
  const combinedHtml = pages.map(p => p.html || '').join('\n\n---PAGE-BREAK---\n\n');
  const combinedMarkdown = pages.map(p => p.markdown || '').join('\n\n---PAGE-BREAK---\n\n');

  // Select and run appropriate extractor
  let extractorResult: ExtractorResult;

  try {
    extractorResult = await selectAndRunExtractor(
      extractorType,
      combinedHtml,
      combinedMarkdown,
      sourceUrl,
      sourceName,
      anthropicApiKey
    );
  } catch (error: any) {
    console.error(`❌ Extraction failed: ${error.message}`);
    return {
      booths_found: 0,
      booths_added: 0,
      booths_updated: 0,
      extraction_time_ms: Date.now() - extractionStartTime,
      errors: [error.message],
    };
  }

  console.log(`✅ Extracted ${extractorResult.booths.length} booths`);

  // Validate and save booths to database
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let boothsAdded = 0;
  let boothsUpdated = 0;
  const errors: string[] = [];

  for (const booth of extractorResult.booths) {
    try {
      // Validate booth
      if (!validateBooth(booth)) {
        errors.push(`Invalid booth: ${booth.name || 'unnamed'}`);
        continue;
      }

      // Check for duplicate by address
      const { data: existing } = await supabase
        .from("booths")
        .select("id")
        .eq("address", booth.address)
        .limit(1)
        .single();

      if (existing) {
        // Update existing booth
        const { error: updateError } = await supabase
          .from("booths")
          .update({
            ...booth,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateError) {
          errors.push(`Update failed for ${booth.name}: ${updateError.message}`);
        } else {
          boothsUpdated++;
          console.log(`✏️ Updated: ${booth.name}`);
        }
      } else {
        // Insert new booth
        const { error: insertError } = await supabase
          .from("booths")
          .insert({
            ...booth,
            source: sourceName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          errors.push(`Insert failed for ${booth.name}: ${insertError.message}`);
        } else {
          boothsAdded++;
          console.log(`✨ Added: ${booth.name}`);
        }
      }
    } catch (error: any) {
      errors.push(`Processing error for ${booth.name}: ${error.message}`);
    }
  }

  const extractionTimeMs = Date.now() - extractionStartTime;

  console.log(`📊 Results: ${boothsAdded} added, ${boothsUpdated} updated, ${errors.length} errors`);

  return {
    booths_found: extractorResult.booths.length,
    booths_added: boothsAdded,
    booths_updated: boothsUpdated,
    extraction_time_ms: extractionTimeMs,
    errors,
  };
}

/**
 * Select appropriate extractor based on type
 */
async function selectAndRunExtractor(
  extractorType: string,
  html: string,
  markdown: string,
  sourceUrl: string,
  sourceName: string,
  anthropicApiKey: string
): Promise<ExtractorResult> {
  console.log(`🎯 Using extractor type: ${extractorType}`);

  switch (extractorType) {
    // GOLD STANDARD: photobooth.net
    case 'photobooth_net':
      return extractPhotoboothNetEnhanced(html, markdown, sourceUrl, anthropicApiKey);

    // Directory sources
    case 'photomatica':
    case 'photoautomat_de':
    case 'photomatic':
    case 'lomography':
    case 'flickr_photobooth':
    case 'pinterest':
    case 'autophoto':
    case 'photomatica_west_coast':
    case 'classic_photo_booth_co':
      return extractDirectoryEnhanced(html, markdown, sourceUrl, sourceName, anthropicApiKey);

    // European operators
    case 'fotoautomat_berlin':
    case 'autofoto':
    case 'fotoautomat_fr':
    case 'fotoautomat_wien':
    case 'fotoautomatica':
    case 'flash_pack':
    case 'metro_auto_photo':
      return extractOperatorEnhanced(html, markdown, sourceUrl, sourceName, anthropicApiKey);

    // City guides
    case 'city_guide_berlin_digitalcosmonaut':
    case 'city_guide_berlin_phelt':
    case 'city_guide_berlin_aperture':
    case 'city_guide_london_designmynight':
    case 'city_guide_london_world':
    case 'city_guide_london_flashpack':
    case 'city_guide_la_timeout':
    case 'city_guide_la_locale':
    case 'city_guide_chicago_timeout':
    case 'city_guide_chicago_blockclub':
    case 'city_guide_ny_designmynight':
    case 'city_guide_ny_roxy':
    case 'city_guide_ny_airial':
      return extractCityGuideEnhanced(html, markdown, sourceUrl, sourceName, anthropicApiKey);

    // Travel blogs
    case 'solo_sophie':
    case 'misadventures_andi':
    case 'no_camera_bag':
    case 'girl_in_florence':
    case 'accidentally_wes_anderson':
    case 'dothebay':
    case 'concrete_playground':
    case 'japan_experience':
      return extractBlogEnhanced(html, markdown, sourceUrl, sourceName, anthropicApiKey);

    // Community sources
    case 'smithsonian':
      return extractCommunityEnhanced(html, markdown, sourceUrl, sourceName, anthropicApiKey);

    // Generic fallback
    default:
      console.warn(`⚠️ Unknown extractor type: ${extractorType}, using generic`);
      return extractGeneric(html, markdown, sourceUrl, sourceName, anthropicApiKey);
  }
}

/**
 * Validate booth data meets minimum requirements
 */
function validateBooth(booth: BoothData): boolean {
  if (!booth.name || booth.name.trim().length === 0) {
    console.warn(`Booth validation failed: missing name`);
    return false;
  }
  if (!booth.address || booth.address.trim().length === 0) {
    console.warn(`Booth validation failed: missing address for ${booth.name}`);
    return false;
  }

  // Validate country
  const countryValidation = validateCountry(booth.country, booth.city);
  if (!countryValidation.isValid) {
    console.warn(`Booth validation failed for "${booth.name}": ${countryValidation.error}`);
    return false;
  }

  return true;
}
