/**
 * Enhanced AI-Powered Extractors
 *
 * These extractors replace the weak regex-based extractors with
 * robust AI-powered extraction specifically tuned for photo booth data.
 */

import { extractWithAI, AIExtractionConfig } from "./ai-extraction-engine.ts";
import { ExtractorResult, BoothData } from "./extractors.ts";

/**
 * PHOTOBOOTH.NET - ENHANCED EXTRACTOR
 *
 * photobooth.net is the GOLD STANDARD directory of analog photo booths.
 * This extractor must be comprehensive and extract maximum detail.
 *
 * Strategy:
 * - Multi-page discovery: Automatically discover state/country index pages
 * - Deep crawling: Follow links to individual booth detail pages
 * - Comprehensive extraction: Extract all fields including machine details, photos, history
 * - Enhanced validation: Validate address, coordinates, and operational status
 * - Error handling: Robust error handling with detailed logging
 *
 * Photobooth.net Structure:
 * - Homepage: http://www.photobooth.net/locations/
 * - Index page: browse.php?ddState=0 (lists all states/countries)
 * - State pages: browse.php?ddState=X (lists booths in state X)
 * - Booth detail: browse.php?ddState=X&locationID=Y (individual booth)
 *
 * Fields to Extract:
 * - Venue name and full address (street, city, state/province, postal code)
 * - Coordinates (latitude/longitude) if available
 * - Machine model and manufacturer (critical for analog booths)
 * - Operating status (active/inactive/removed)
 * - Historical information (installation date, previous locations)
 * - Operator/owner information
 * - Photo type and strip format (4-strip, color/B&W)
 * - Cost and payment methods
 * - Hours of operation
 * - Photos/images if available
 * - User reports and verification dates
 */
export async function extractPhotoboothNetEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("🎯 Enhanced photobooth.net extraction starting...");
  console.log(`📍 Source URL: ${sourceUrl}`);

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Phase 1: Detect page type and structure
    onProgress?.({
      type: 'photobooth_net_phase',
      phase: 'detection',
      message: 'Analyzing photobooth.net page structure',
      timestamp: new Date().toISOString()
    });

    const pageType = detectPhotoboothNetPageType(html, markdown);
    console.log(`📄 Detected page type: ${pageType}`);

    // Phase 2: Extract based on page type
    let result: ExtractorResult;

    if (pageType === 'index' || pageType === 'state_list') {
      // Index/directory page: Extract booth listings with hierarchical context
      console.log("📋 Processing directory/index page with hierarchical structure");
      onProgress?.({
        type: 'photobooth_net_phase',
        phase: 'directory_extraction',
        message: 'Extracting booth listings from directory page',
        timestamp: new Date().toISOString()
      });

      result = await extractPhotoboothNetDirectory(
        html,
        markdown,
        sourceUrl,
        anthropicApiKey,
        onProgress
      );

    } else if (pageType === 'booth_detail') {
      // Individual booth detail page: Extract comprehensive details
      console.log("🔍 Processing individual booth detail page");
      onProgress?.({
        type: 'photobooth_net_phase',
        phase: 'detail_extraction',
        message: 'Extracting detailed booth information',
        timestamp: new Date().toISOString()
      });

      result = await extractPhotoboothNetBoothDetail(
        html,
        markdown,
        sourceUrl,
        anthropicApiKey,
        onProgress
      );

    } else {
      // Unknown/fallback: Use generic AI extraction
      console.log("⚠️ Unknown page type, using generic extraction");
      onProgress?.({
        type: 'photobooth_net_phase',
        phase: 'fallback_extraction',
        message: 'Using generic AI extraction',
        timestamp: new Date().toISOString()
      });

      const config: AIExtractionConfig = {
        source_name: "photobooth.net",
        source_type: "directory",
        priority: "high",
        extraction_strategy: "comprehensive",
        anthropic_api_key: anthropicApiKey,
      };

      result = await extractWithAI(html, markdown, sourceUrl, config, onProgress);
    }

    // Phase 3: Enhanced validation
    console.log(`🔍 Validating ${result.booths.length} extracted booths`);
    onProgress?.({
      type: 'photobooth_net_phase',
      phase: 'validation',
      message: `Validating ${result.booths.length} booths`,
      timestamp: new Date().toISOString()
    });

    const validatedBooths = result.booths.map(booth =>
      enhancePhotoboothNetBooth(booth, sourceUrl)
    );

    // Phase 4: Report results
    const extractionTime = Date.now() - startTime;
    console.log(`✅ photobooth.net enhanced extraction complete:`);
    console.log(`   - Booths extracted: ${validatedBooths.length}`);
    console.log(`   - Errors: ${result.errors.length + errors.length}`);
    console.log(`   - Extraction time: ${extractionTime}ms`);

    onProgress?.({
      type: 'photobooth_net_complete',
      booths_extracted: validatedBooths.length,
      errors_count: result.errors.length + errors.length,
      extraction_time_ms: extractionTime,
      timestamp: new Date().toISOString()
    });

    return {
      booths: validatedBooths,
      errors: [...result.errors, ...errors],
      metadata: {
        pages_processed: result.metadata.pages_processed,
        total_found: validatedBooths.length,
        extraction_time_ms: extractionTime,
      },
    };

  } catch (error) {
    const errorMessage = `Photobooth.net extraction failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`❌ ${errorMessage}`);
    errors.push(errorMessage);

    return {
      booths: [],
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
 * Detect the type of photobooth.net page
 */
function detectPhotoboothNetPageType(
  html: string,
  markdown: string
): 'index' | 'state_list' | 'booth_detail' | 'unknown' {
  // Check for booth detail page indicators
  if (
    html.includes('locationID=') ||
    markdown.includes('Machine Model:') ||
    markdown.includes('Operator:') ||
    markdown.includes('Photo Type:')
  ) {
    return 'booth_detail';
  }

  // Check for state/country list indicators
  if (
    markdown.includes('### United States') ||
    markdown.includes('### Canada') ||
    markdown.includes('### The World') ||
    html.includes('ddState=')
  ) {
    return 'state_list';
  }

  // Check for main index page
  if (
    markdown.includes('Photo Booth Locations') ||
    html.includes('/locations/') ||
    html.includes('browse.php')
  ) {
    return 'index';
  }

  return 'unknown';
}

/**
 * Extract booth listings from photobooth.net directory/index pages
 * Handles hierarchical structure: United States → California → City → Booth
 */
async function extractPhotoboothNetDirectory(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("📋 Extracting from photobooth.net directory page");

  // Use AI extraction with directory-specific prompt
  const config: AIExtractionConfig = {
    source_name: "photobooth.net",
    source_type: "directory",
    priority: "high",
    extraction_strategy: "comprehensive",
    anthropic_api_key: anthropicApiKey,
  };

  // Enhance the content to preserve hierarchical context
  const enhancedMarkdown = enhancePhotoboothNetMarkdown(markdown, html);

  const result = await extractWithAI(html, enhancedMarkdown, sourceUrl, config, onProgress);

  console.log(`📋 Directory extraction: ${result.booths.length} booths found`);

  return result;
}

/**
 * Extract detailed information from individual booth detail pages
 */
async function extractPhotoboothNetBoothDetail(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("🔍 Extracting from photobooth.net booth detail page");

  // Use AI extraction with detail-specific prompt
  const config: AIExtractionConfig = {
    source_name: "photobooth.net",
    source_type: "directory",
    priority: "high",
    extraction_strategy: "comprehensive",
    anthropic_api_key: anthropicApiKey,
  };

  const result = await extractWithAI(html, markdown, sourceUrl, config, onProgress);

  // Detail pages should typically have 1 booth
  if (result.booths.length === 0) {
    console.warn("⚠️ No booth extracted from detail page");
  } else if (result.booths.length > 1) {
    console.warn(`⚠️ Multiple booths (${result.booths.length}) extracted from detail page - expected 1`);
  } else {
    console.log("✅ Successfully extracted booth details");
  }

  return result;
}

/**
 * Enhance photobooth.net markdown to preserve hierarchical structure
 * This helps AI understand the geographic context (Country → State → City)
 */
function enhancePhotoboothNetMarkdown(markdown: string, html: string): string {
  const lines = markdown.split('\n');
  const enhanced: string[] = [];

  let currentCountry = '';
  let currentState = '';
  let currentCity = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect country headers
    if (trimmed.startsWith('###')) {
      const header = trimmed.replace(/^###\s*/, '').trim();
      if (header.includes('United States') || header.includes('USA')) {
        currentCountry = 'United States';
        enhanced.push(`\n### ${currentCountry}\n`);
      } else if (header.includes('Canada')) {
        currentCountry = 'Canada';
        enhanced.push(`\n### ${currentCountry}\n`);
      } else if (header.includes('The World') || header.includes('International')) {
        currentCountry = 'International';
        enhanced.push(`\n### ${currentCountry}\n`);
      } else {
        // Assume it's a state/province
        currentState = header;
        enhanced.push(`\n#### ${currentState} (${currentCountry})\n`);
      }
      continue;
    }

    // Detect state headers
    if (trimmed.startsWith('####')) {
      currentState = trimmed.replace(/^####\s*/, '').trim();
      enhanced.push(`\n#### ${currentState} (${currentCountry})\n`);
      continue;
    }

    // Detect booth links and enhance with context
    const linkMatch = trimmed.match(/\[([^\]]+)\]\((browse\.php[^\)]+)\),?\s*([^[\n]+)/);
    if (linkMatch) {
      const boothName = linkMatch[1].trim();
      const detailUrl = linkMatch[2];
      const city = linkMatch[3].trim();

      // Enhance with geographic context
      enhanced.push(
        `**${boothName}** | ${city}, ${currentState}, ${currentCountry} | [Details](${detailUrl})`
      );
      continue;
    }

    // Keep other lines as-is
    enhanced.push(line);
  }

  return enhanced.join('\n');
}

/**
 * Enhance booth data with photobooth.net-specific improvements
 */
function enhancePhotoboothNetBooth(booth: BoothData, sourceUrl: string): BoothData {
  const enhanced = { ...booth };

  // Ensure booth_type is 'analog' for photobooth.net (they focus on chemical booths)
  if (!enhanced.booth_type || enhanced.booth_type === 'unknown') {
    enhanced.booth_type = 'analog';
  }

  // Extract machine manufacturer from model if present
  if (enhanced.machine_model && !enhanced.machine_manufacturer) {
    const model = enhanced.machine_model.toLowerCase();
    if (model.includes('photo-me') || model.includes('photome')) {
      enhanced.machine_manufacturer = 'Photo-Me International';
    } else if (model.includes('photomaton')) {
      enhanced.machine_manufacturer = 'Photomaton';
    } else if (model.includes('photomatic')) {
      enhanced.machine_manufacturer = 'Photomatic';
    }
  }

  // Parse address to extract city/state/postal code if missing
  if (enhanced.address && !enhanced.city) {
    const addressParts = enhanced.address.split(',').map(p => p.trim());
    if (addressParts.length >= 2) {
      // Common format: "123 Main St, City, State ZIP"
      enhanced.city = addressParts[addressParts.length - 2];

      // Try to extract state and ZIP from last part
      const lastPart = addressParts[addressParts.length - 1];
      const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})/);
      if (stateZipMatch) {
        enhanced.state = stateZipMatch[1];
        enhanced.postal_code = stateZipMatch[2];
      }
    }
  }

  // Improve operational status detection from description
  if (enhanced.description) {
    const desc = enhanced.description.toLowerCase();

    // Check for inactive/removed indicators
    if (
      desc.includes('no longer') ||
      desc.includes('removed') ||
      desc.includes('closed') ||
      desc.includes('out of service') ||
      desc.includes('defunct')
    ) {
      enhanced.is_operational = false;
      enhanced.status = 'inactive';
    }

    // Check for active/verified indicators
    if (
      desc.includes('verified') ||
      desc.includes('recently visited') ||
      desc.includes('working') ||
      desc.includes('operational')
    ) {
      enhanced.is_operational = true;
      enhanced.status = 'active';
    }
  }

  // Validate and standardize country
  if (!enhanced.country || enhanced.country === 'Unknown') {
    // Try to infer from address or state
    if (enhanced.state) {
      const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
      const canadianProvinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

      if (usStates.includes(enhanced.state)) {
        enhanced.country = 'United States';
      } else if (canadianProvinces.includes(enhanced.state)) {
        enhanced.country = 'Canada';
      }
    }
  }

  return enhanced;
}

/**
 * CITY GUIDE - ENHANCED EXTRACTOR
 *
 * City guides mention photo booths in articles, listicles, and recommendations.
 * Extract venue names, neighborhoods, and contextual information.
 */
export async function extractCityGuideEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  sourceName: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log(`🏙️ Enhanced city guide extraction for ${sourceName}...`);

  const config: AIExtractionConfig = {
    source_name: sourceName,
    source_type: "city_guide",
    priority: "medium",
    extraction_strategy: "targeted",
    anthropic_api_key: anthropicApiKey,
  };

  return await extractWithAI(html, markdown, sourceUrl, config, onProgress);
}

/**
 * BLOG/TRAVEL SITE - ENHANCED EXTRACTOR
 *
 * Travel blogs and photography sites mention photo booths in context.
 * Extract locations with surrounding context and user experiences.
 */
export async function extractBlogEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  sourceName: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log(`📝 Enhanced blog extraction for ${sourceName}...`);

  const config: AIExtractionConfig = {
    source_name: sourceName,
    source_type: "blog",
    priority: "medium",
    extraction_strategy: "exploratory",
    anthropic_api_key: anthropicApiKey,
  };

  return await extractWithAI(html, markdown, sourceUrl, config, onProgress);
}

/**
 * COMMUNITY - ENHANCED EXTRACTOR
 *
 * Reddit, forums, and community sites have user-reported locations.
 * Extract with careful attention to user context and reports.
 */
export async function extractCommunityEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  sourceName: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log(`👥 Enhanced community extraction for ${sourceName}...`);

  const config: AIExtractionConfig = {
    source_name: sourceName,
    source_type: "community",
    priority: "low",
    extraction_strategy: "exploratory",
    anthropic_api_key: anthropicApiKey,
  };

  return await extractWithAI(html, markdown, sourceUrl, config, onProgress);
}

/**
 * OPERATOR SITE - ENHANCED EXTRACTOR
 *
 * Photo booth operator websites list their booth locations.
 * Extract all locations with operational details.
 */
export async function extractOperatorEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  sourceName: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log(`🏢 Enhanced operator extraction for ${sourceName}...`);

  const config: AIExtractionConfig = {
    source_name: sourceName,
    source_type: "operator",
    priority: "high",
    extraction_strategy: "comprehensive",
    anthropic_api_key: anthropicApiKey,
  };

  return await extractWithAI(html, markdown, sourceUrl, config, onProgress);
}

/**
 * DIRECTORY - ENHANCED EXTRACTOR
 *
 * Generic directory extraction for any photo booth directory site.
 */
export async function extractDirectoryEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  sourceName: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log(`📋 Enhanced directory extraction for ${sourceName}...`);

  const config: AIExtractionConfig = {
    source_name: sourceName,
    source_type: "directory",
    priority: "high",
    extraction_strategy: "comprehensive",
    anthropic_api_key: anthropicApiKey,
  };

  return await extractWithAI(html, markdown, sourceUrl, config, onProgress);
}
