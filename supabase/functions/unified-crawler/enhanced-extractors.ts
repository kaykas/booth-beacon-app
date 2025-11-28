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

/**
 * TIMEOUT CHICAGO - ENHANCED EXTRACTOR
 *
 * TimeOut Chicago published an article listing "20 Chicago bars with a photo booth".
 * URL: https://www.timeout.com/chicago/bars/20-chicago-bars-with-a-photo-booth
 *
 * Strategy:
 * - Single-page article with exactly 20 bar listings (known count)
 * - Bar venues (booths inside bars/restaurants)
 * - Comprehensive field extraction (30+ fields)
 * - Phase-based processing (detection → extraction → validation → enrichment)
 * - Extract bar names, addresses, neighborhoods
 * - Machine model/manufacturer extraction using regex patterns
 * - Operating status detection from article context
 * - Robust error handling with detailed logging
 *
 * Article Structure:
 * - Listicle format with 20 entries
 * - Each entry contains: bar name, neighborhood, address (may vary), booth details
 * - May include bar descriptions, booth features, operating hours
 * - Chicago-specific neighborhoods (River West, Bucktown, Uptown, etc.)
 *
 * Fields to Extract:
 * - Venue name (bar name)
 * - Full address (street, city=Chicago, state=IL, zip if available)
 * - Neighborhood (crucial for Chicago context)
 * - Machine model and manufacturer (if mentioned)
 * - Booth type (likely digital, may have analog mentions)
 * - Cost information (e.g., "$5 for two strips")
 * - Photo output details (B&W, color, strip format)
 * - Operating status (infer from bar status)
 * - Bar hours (may differ from booth availability)
 * - Booth location within venue (if mentioned)
 * - Description and context from article
 */
export async function extractTimeOutChicagoEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("🍻 Enhanced TimeOut Chicago extraction starting...");
  console.log(`📍 Source URL: ${sourceUrl}`);

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Phase 1: Detect article structure
    onProgress?.({
      type: 'timeout_chicago_phase',
      phase: 'detection',
      message: 'Analyzing TimeOut Chicago article structure',
      timestamp: new Date().toISOString()
    });

    const articleInfo = detectTimeOutChicagoStructure(html, markdown);
    console.log(`📄 Article type: ${articleInfo.type}`);
    console.log(`📊 Expected booths: ${articleInfo.expectedCount}`);

    // Phase 2: AI-powered extraction with city guide strategy
    console.log("📋 Processing TimeOut Chicago bar listicle");
    onProgress?.({
      type: 'timeout_chicago_phase',
      phase: 'extraction',
      message: `Extracting ${articleInfo.expectedCount} bar listings with photo booths`,
      timestamp: new Date().toISOString()
    });

    // Enhance markdown with Chicago-specific context
    const enhancedMarkdown = enhanceTimeOutChicagoMarkdown(markdown, html, articleInfo);

    // Use AI extraction with city guide configuration
    const config: AIExtractionConfig = {
      source_name: "TimeOut Chicago",
      source_type: "city_guide",
      priority: "high",
      extraction_strategy: "comprehensive",
      anthropic_api_key: anthropicApiKey,
    };

    const result = await extractWithAI(html, enhancedMarkdown, sourceUrl, config, onProgress);

    console.log(`📋 Extracted ${result.booths.length} booths (expected ${articleInfo.expectedCount})`);

    // Warn if count mismatch
    if (result.booths.length !== articleInfo.expectedCount) {
      const warning = `⚠️ Booth count mismatch: extracted ${result.booths.length} but article title indicates ${articleInfo.expectedCount}`;
      console.warn(warning);
      errors.push(warning);
    }

    // Phase 3: Enhanced validation and enrichment
    console.log(`🔍 Validating and enriching ${result.booths.length} booths`);
    onProgress?.({
      type: 'timeout_chicago_phase',
      phase: 'validation',
      message: `Validating and enriching ${result.booths.length} booths`,
      timestamp: new Date().toISOString()
    });

    const enrichedBooths = result.booths.map(booth =>
      enhanceTimeOutChicagoBooth(booth, sourceUrl, articleInfo)
    );

    // Phase 4: Data quality analysis
    const qualityMetrics = analyzeTimeOutChicagoDataQuality(enrichedBooths, articleInfo);

    // Phase 5: Report results
    const extractionTime = Date.now() - startTime;
    console.log(`✅ TimeOut Chicago enhanced extraction complete:`);
    console.log(`   - Booths extracted: ${enrichedBooths.length}/${articleInfo.expectedCount}`);
    console.log(`   - Errors: ${result.errors.length + errors.length}`);
    console.log(`   - Extraction time: ${extractionTime}ms`);
    console.log(`   - Data quality score: ${qualityMetrics.overallScore.toFixed(1)}%`);

    onProgress?.({
      type: 'timeout_chicago_complete',
      booths_extracted: enrichedBooths.length,
      expected_count: articleInfo.expectedCount,
      errors_count: result.errors.length + errors.length,
      extraction_time_ms: extractionTime,
      quality_metrics: qualityMetrics,
      timestamp: new Date().toISOString()
    });

    return {
      booths: enrichedBooths,
      errors: [...result.errors, ...errors],
      metadata: {
        pages_processed: result.metadata.pages_processed,
        total_found: enrichedBooths.length,
        extraction_time_ms: extractionTime,
      },
    };

  } catch (error) {
    const errorMessage = `TimeOut Chicago extraction failed: ${error instanceof Error ? error.message : String(error)}`;
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
 * TimeOut Chicago Article Information
 */
interface TimeOutChicagoArticleInfo {
  type: 'bar_listicle' | 'general_guide' | 'unknown';
  expectedCount: number;
  city: string;
  neighborhoods: string[];
}

/**
 * TimeOut Chicago Data Quality Metrics
 */
interface TimeOutChicagoQualityMetrics {
  totalBooths: number;
  boothsWithAddresses: number;
  boothsWithNeighborhoods: number;
  boothsWithMachineInfo: number;
  boothsWithCost: number;
  boothsWithPhotoDetails: number;
  boothsWithDescription: number;
  averageFieldCompleteness: number;
  overallScore: number;
  issues: string[];
}

/**
 * Detect TimeOut Chicago article structure and metadata
 */
function detectTimeOutChicagoStructure(html: string, markdown: string): TimeOutChicagoArticleInfo {
  const info: TimeOutChicagoArticleInfo = {
    type: 'unknown',
    expectedCount: 0,
    city: 'Chicago',
    neighborhoods: []
  };

  // Check for the specific "20 Chicago bars" article
  if (
    markdown.includes('20 Chicago bars with a photo booth') ||
    html.includes('20 Chicago bars with a photo booth') ||
    html.includes('20-chicago-bars-with-a-photo-booth')
  ) {
    info.type = 'bar_listicle';
    info.expectedCount = 20;
  }

  // Extract count from title if pattern matches "N bars/venues with photo booth"
  const countMatch = markdown.match(/(\d+)\s+(?:Chicago\s+)?(?:bars|venues|places).*photo\s*booth/i) ||
                     html.match(/(\d+)\s+(?:Chicago\s+)?(?:bars|venues|places).*photo\s*booth/i);
  if (countMatch) {
    info.expectedCount = parseInt(countMatch[1], 10);
    info.type = 'bar_listicle';
  }

  // Extract Chicago neighborhoods mentioned
  const chicagoNeighborhoods = [
    'River West', 'West Town', 'Bucktown', 'Wicker Park', 'Ukrainian Village',
    'Uptown', 'Lincoln Park', 'Lake View', 'Lakeview', 'Logan Square',
    'River North', 'West Loop', 'Loop', 'South Loop', 'Near North Side',
    'Old Town', 'Gold Coast', 'Streeterville', 'Pilsen', 'Bridgeport',
    'Hyde Park', 'Andersonville', 'Ravenswood', 'Lincoln Square'
  ];

  const content = markdown + ' ' + html;
  for (const neighborhood of chicagoNeighborhoods) {
    if (content.includes(neighborhood)) {
      info.neighborhoods.push(neighborhood);
    }
  }

  // Remove duplicates
  info.neighborhoods = [...new Set(info.neighborhoods)];

  return info;
}

/**
 * Enhance TimeOut Chicago markdown with structured context
 */
function enhanceTimeOutChicagoMarkdown(
  markdown: string,
  html: string,
  articleInfo: TimeOutChicagoArticleInfo
): string {
  const enhanced: string[] = [];

  // Add context header
  enhanced.push(`# TimeOut Chicago: ${articleInfo.expectedCount} Bars with Photo Booths`);
  enhanced.push(`City: ${articleInfo.city}, IL`);
  enhanced.push(`Source Type: Bar/Restaurant Venues with Photo Booths`);
  enhanced.push(`Expected Count: ${articleInfo.expectedCount} listings\n`);

  if (articleInfo.neighborhoods.length > 0) {
    enhanced.push(`Neighborhoods mentioned: ${articleInfo.neighborhoods.join(', ')}\n`);
  }

  enhanced.push('---\n');
  enhanced.push('# EXTRACTION INSTRUCTIONS');
  enhanced.push('Extract ALL bar venues with photo booths from this article.');
  enhanced.push('For each bar:');
  enhanced.push('- Venue name (bar/restaurant name)');
  enhanced.push('- Full address (if available) - Default: Chicago, IL');
  enhanced.push('- Neighborhood/area');
  enhanced.push('- Photo booth details (machine model, features, cost)');
  enhanced.push('- Photo output details (B&W, color, strip format, number of photos)');
  enhanced.push('- Any operating hours or access information');
  enhanced.push('- Bar/venue description and context\n');
  enhanced.push('---\n');

  // Add original content
  enhanced.push(markdown);

  return enhanced.join('\n');
}

/**
 * Enhance individual booth data with TimeOut Chicago-specific improvements
 */
function enhanceTimeOutChicagoBooth(
  booth: BoothData,
  sourceUrl: string,
  articleInfo: TimeOutChicagoArticleInfo
): BoothData {
  const enhanced = { ...booth };

  // Ensure Chicago location defaults
  if (!enhanced.city || enhanced.city === 'Unknown') {
    enhanced.city = 'Chicago';
  }
  if (!enhanced.state) {
    enhanced.state = 'IL';
  }
  if (!enhanced.country || enhanced.country === 'Unknown') {
    enhanced.country = 'United States';
  }

  // Extract neighborhood from description or name if not set
  if (!enhanced.description?.includes('neighborhood') && articleInfo.neighborhoods.length > 0) {
    const desc = (enhanced.description || '').toLowerCase();
    const name = enhanced.name.toLowerCase();
    for (const neighborhood of articleInfo.neighborhoods) {
      if (desc.includes(neighborhood.toLowerCase()) || name.includes(neighborhood.toLowerCase())) {
        enhanced.description = enhanced.description
          ? `${enhanced.description} Located in ${neighborhood}.`
          : `Located in ${neighborhood}.`;
        break;
      }
    }
  }

  // Extract machine model/manufacturer from description
  if (enhanced.description && !enhanced.machine_model) {
    const desc = enhanced.description.toLowerCase();

    // Common photo booth brands/models
    const patterns = [
      { regex: /photo[-\s]?me/i, model: 'Photo-Me', manufacturer: 'Photo-Me International' },
      { regex: /photomaton/i, model: 'Photomaton', manufacturer: 'Photomaton' },
      { regex: /vintage\s+(?:photo\s*)?booth/i, model: 'Vintage Photo Booth', manufacturer: 'Unknown' },
      { regex: /classic\s+(?:photo\s*)?booth/i, model: 'Classic Photo Booth', manufacturer: 'Unknown' },
      { regex: /analog\s+(?:photo\s*)?booth/i, model: 'Analog Photo Booth', manufacturer: 'Unknown' },
      { regex: /old[-\s]?school\s+(?:photo\s*)?booth/i, model: 'Old-School Photo Booth', manufacturer: 'Unknown' }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(desc)) {
        enhanced.machine_model = pattern.model;
        enhanced.machine_manufacturer = pattern.manufacturer;
        break;
      }
    }
  }

  // Extract booth type from description
  if (enhanced.description && !enhanced.booth_type) {
    const desc = enhanced.description.toLowerCase();
    if (desc.includes('analog') || desc.includes('chemical') || desc.includes('film') || desc.includes('vintage')) {
      enhanced.booth_type = 'analog';
    } else if (desc.includes('instant') || desc.includes('polaroid')) {
      enhanced.booth_type = 'instant';
    } else {
      enhanced.booth_type = 'digital'; // Default for modern bars
    }
  }

  // Extract cost from description
  if (enhanced.description && !enhanced.cost) {
    const costMatch = enhanced.description.match(/\$(\d+)(?:\s+for)?(?:\s+(\d+)\s+strips?)?/i);
    if (costMatch) {
      enhanced.cost = costMatch[2]
        ? `$${costMatch[1]} for ${costMatch[2]} strips`
        : `$${costMatch[1]}`;
    }
  }

  // Extract photo output details from description
  if (enhanced.description) {
    const desc = enhanced.description;

    // Check for B&W or color mentions
    if (desc.match(/black\s+and\s+white|b&w|b\/w/i)) {
      if (!desc.match(/and\s+color|or\s+color/i)) {
        enhanced.description = enhanced.description + ' (black and white photos)';
      }
    }

    // Check for strip format mentions
    const stripMatch = desc.match(/(\d+)[-\s]?strip|(\d+)\s+photos?/i);
    if (stripMatch) {
      const count = stripMatch[1] || stripMatch[2];
      if (!enhanced.description.includes('strip format')) {
        enhanced.description = enhanced.description + ` (${count}-photo strip format)`;
      }
    }
  }

  // Infer operational status
  // Bars in active TimeOut guides are typically operational
  if (enhanced.is_operational === undefined) {
    enhanced.is_operational = true;
  }
  if (!enhanced.status || enhanced.status === 'unverified') {
    enhanced.status = 'active';
  }

  // Add venue type context
  if (enhanced.description && !enhanced.description.includes('bar') && !enhanced.description.includes('venue')) {
    enhanced.description = `Bar/venue with photo booth. ${enhanced.description}`;
  }

  return enhanced;
}

/**
 * Analyze data quality for TimeOut Chicago extraction
 */
function analyzeTimeOutChicagoDataQuality(
  booths: BoothData[],
  articleInfo: TimeOutChicagoArticleInfo
): TimeOutChicagoQualityMetrics {
  const metrics: TimeOutChicagoQualityMetrics = {
    totalBooths: booths.length,
    boothsWithAddresses: 0,
    boothsWithNeighborhoods: 0,
    boothsWithMachineInfo: 0,
    boothsWithCost: 0,
    boothsWithPhotoDetails: 0,
    boothsWithDescription: 0,
    averageFieldCompleteness: 0,
    overallScore: 0,
    issues: []
  };

  if (booths.length === 0) {
    metrics.issues.push('No booths extracted');
    return metrics;
  }

  let totalFieldsPopulated = 0;
  const fieldsPerBooth = 30; // Based on BoothData interface

  for (const booth of booths) {
    let fieldsPopulated = 0;

    // Core fields
    if (booth.name) fieldsPopulated++;
    if (booth.address) {
      fieldsPopulated++;
      metrics.boothsWithAddresses++;
    }
    if (booth.city) fieldsPopulated++;
    if (booth.state) fieldsPopulated++;
    if (booth.country) fieldsPopulated++;
    if (booth.postal_code) fieldsPopulated++;

    // Location details
    if (booth.latitude) fieldsPopulated++;
    if (booth.longitude) fieldsPopulated++;

    // Check for neighborhood in description
    if (booth.description && articleInfo.neighborhoods.some(n => booth.description?.includes(n))) {
      metrics.boothsWithNeighborhoods++;
      fieldsPopulated++;
    }

    // Machine details
    if (booth.machine_model) {
      fieldsPopulated++;
      metrics.boothsWithMachineInfo++;
    }
    if (booth.machine_manufacturer) {
      fieldsPopulated++;
      metrics.boothsWithMachineInfo++;
    }
    if (booth.booth_type && booth.booth_type !== 'unknown') fieldsPopulated++;

    // Operational details
    if (booth.is_operational !== undefined) fieldsPopulated++;
    if (booth.status && booth.status !== 'unverified') fieldsPopulated++;
    if (booth.cost) {
      fieldsPopulated++;
      metrics.boothsWithCost++;
    }
    if (booth.hours) fieldsPopulated++;
    if (booth.accepts_cash !== undefined) fieldsPopulated++;
    if (booth.accepts_card !== undefined) fieldsPopulated++;

    // Contact details
    if (booth.website) fieldsPopulated++;
    if (booth.phone) fieldsPopulated++;

    // Description
    if (booth.description) {
      fieldsPopulated++;
      metrics.boothsWithDescription++;

      // Check for photo output details
      if (booth.description.match(/black\s+and\s+white|color|strip|photo/i)) {
        metrics.boothsWithPhotoDetails++;
        fieldsPopulated++;
      }
    }

    totalFieldsPopulated += fieldsPopulated;
  }

  metrics.averageFieldCompleteness = (totalFieldsPopulated / (booths.length * fieldsPerBooth)) * 100;

  // Calculate overall score
  const countScore = (booths.length / articleInfo.expectedCount) * 100;
  const addressScore = (metrics.boothsWithAddresses / booths.length) * 100;
  const neighborhoodScore = (metrics.boothsWithNeighborhoods / booths.length) * 100;
  const descriptionScore = (metrics.boothsWithDescription / booths.length) * 100;

  metrics.overallScore = (
    countScore * 0.3 +
    addressScore * 0.2 +
    neighborhoodScore * 0.15 +
    descriptionScore * 0.15 +
    metrics.averageFieldCompleteness * 0.2
  );

  // Identify issues
  if (booths.length < articleInfo.expectedCount) {
    metrics.issues.push(`Missing ${articleInfo.expectedCount - booths.length} booths (extracted ${booths.length}/${articleInfo.expectedCount})`);
  }
  if (metrics.boothsWithAddresses < booths.length * 0.7) {
    metrics.issues.push(`Only ${metrics.boothsWithAddresses}/${booths.length} booths have addresses`);
  }
  if (metrics.boothsWithNeighborhoods < booths.length * 0.5) {
    metrics.issues.push(`Only ${metrics.boothsWithNeighborhoods}/${booths.length} booths have neighborhood information`);
  }
  if (metrics.boothsWithMachineInfo < booths.length * 0.3) {
    metrics.issues.push(`Only ${metrics.boothsWithMachineInfo}/${booths.length} booths have machine information`);
  }

  return metrics;
}

/**
 * LOCALE MAGAZINE LA - ENHANCED EXTRACTOR
 *
 * Locale Magazine published "From Hollywood to Venice, Snap Some Memories at These 9 LA Photo Booths"
 * URL: https://localemagazine.com/best-la-photo-booths/
 *
 * This is a curated GUIDE/LISTICLE format featuring the best photo booths in Los Angeles.
 * Unlike directories, this is a single article with rich prose descriptions.
 *
 * Strategy:
 * - Phase 1: Detection - Verify this is the LA photo booth guide
 * - Phase 2: Extraction - Extract all 9 booth listings with embedded location details
 * - Phase 3: Validation - Ensure complete addresses and venue information
 * - Phase 4: Enrichment - Extract machine models, operating hours, and contextual details
 *
 * Special Considerations:
 * - Guide format: Single article with multiple booth listings in prose
 * - Venue-focused: Booth identified by venue name (bar, restaurant, etc.)
 * - Embedded addresses: Location details woven into descriptive text
 * - Curated selection: "Best" implies active, recommended booths
 * - LA-specific: All booths in Los Angeles, California
 * - Rich context: Descriptions include ambiance, neighborhood vibe, recommendations
 *
 * Expected Fields:
 * - Venue name (serves as booth identifier)
 * - Full address (extracted from prose)
 * - Neighborhood/area (Hollywood, Venice, etc.)
 * - Description (rich editorial content)
 * - Hours (venue hours if mentioned)
 * - Cost (if mentioned in guide)
 * - Machine type/features (if described)
 * - Operating status (implied active if in "best" guide)
 * - Contextual details (nearby attractions, ambiance, special features)
 */
export async function extractLocaleMagazineLAEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("🌴 Enhanced Locale Magazine LA extraction starting...");
  console.log(`📍 Source URL: ${sourceUrl}`);

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Phase 1: Detect page type and validate
    onProgress?.({
      type: 'locale_magazine_la_phase',
      phase: 'detection',
      message: 'Analyzing Locale Magazine LA guide structure',
      timestamp: new Date().toISOString()
    });

    const isValidGuide = detectLocaleMagazineLAGuide(html, markdown);

    if (!isValidGuide) {
      console.warn("⚠️ Page does not appear to be the Locale Magazine LA photo booth guide");
      errors.push("Page structure does not match expected Locale Magazine LA guide format");
    } else {
      console.log("✅ Confirmed Locale Magazine LA photo booth guide");
    }

    // Phase 2: Extract booth listings from guide
    console.log("📋 Extracting photo booth listings from guide article");
    onProgress?.({
      type: 'locale_magazine_la_phase',
      phase: 'extraction',
      message: 'Extracting booth listings from guide article',
      timestamp: new Date().toISOString()
    });

    const config: AIExtractionConfig = {
      source_name: "Locale Magazine LA",
      source_type: "city_guide",
      priority: "high",
      extraction_strategy: "targeted",
      anthropic_api_key: anthropicApiKey,
    };

    // Enhance markdown to preserve guide structure
    const enhancedMarkdown = enhanceLocaleMagazineLAMarkdown(markdown);

    const result = await extractWithAI(html, enhancedMarkdown, sourceUrl, config, onProgress);

    // Phase 3: Validate and enrich extracted booths
    console.log(`🔍 Validating ${result.booths.length} extracted booths`);
    onProgress?.({
      type: 'locale_magazine_la_phase',
      phase: 'validation',
      message: `Validating ${result.booths.length} booths`,
      timestamp: new Date().toISOString()
    });

    const validatedBooths = result.booths.map(booth =>
      enhanceLocaleMagazineLABooth(booth, sourceUrl)
    );

    // Phase 4: Data quality analysis
    const qualityMetrics = analyzeLocaleMagazineLADataQuality(validatedBooths);

    // Phase 5: Report results
    const extractionTime = Date.now() - startTime;
    console.log(`✅ Locale Magazine LA extraction complete:`);
    console.log(`   - Booths extracted: ${validatedBooths.length}/9 expected`);
    console.log(`   - Errors: ${result.errors.length + errors.length}`);
    console.log(`   - Extraction time: ${extractionTime}ms`);
    console.log(`   - Data quality score: ${qualityMetrics.overallScore.toFixed(1)}%`);

    onProgress?.({
      type: 'locale_magazine_la_complete',
      booths_extracted: validatedBooths.length,
      expected_count: 9,
      errors_count: result.errors.length + errors.length,
      extraction_time_ms: extractionTime,
      quality_metrics: qualityMetrics,
      timestamp: new Date().toISOString()
    });

    return {
      booths: validatedBooths,
      errors: [...result.errors, ...errors],
      metadata: {
        pages_processed: 1,
        total_found: validatedBooths.length,
        extraction_time_ms: extractionTime,
      },
    };

  } catch (error) {
    const errorMessage = `Locale Magazine LA extraction failed: ${error instanceof Error ? error.message : String(error)}`;
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
 * Detect if this is the Locale Magazine LA photo booth guide
 */
function detectLocaleMagazineLAGuide(html: string, markdown: string): boolean {
  // Check for key indicators
  const indicators = [
    // Title/heading patterns
    markdown.includes('LA Photo Booths') ||
    markdown.includes('9 LA Photo Booths') ||
    html.includes('best-la-photo-booths'),

    // Domain check
    html.includes('localemagazine.com'),

    // Content patterns (LA neighborhoods)
    markdown.includes('Hollywood') ||
    markdown.includes('Venice') ||
    markdown.includes('Los Angeles')
  ];

  // Return true if at least 2 indicators match
  return indicators.filter(Boolean).length >= 2;
}

/**
 * Enhance markdown to preserve guide structure and add context
 */
function enhanceLocaleMagazineLAMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const enhanced: string[] = [];

  // Add guide context header
  enhanced.push('# Los Angeles Photo Booth Guide - Locale Magazine');
  enhanced.push('');
  enhanced.push('This guide features 9 curated photo booths across Los Angeles.');
  enhanced.push('All booths are located in Los Angeles, California, United States.');
  enhanced.push('Booths are recommended as active and operational.');
  enhanced.push('');

  // Process content line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect section headers (potential venue names)
    if (trimmed.startsWith('##') || trimmed.startsWith('###')) {
      enhanced.push('');
      enhanced.push(`--- BOOTH LISTING ---`);
      enhanced.push(line);
      continue;
    }

    // Detect numbered list items (potential booth entries)
    const numberedMatch = trimmed.match(/^(\d+)\.\s*(.+)/);
    if (numberedMatch) {
      enhanced.push('');
      enhanced.push(`--- BOOTH #${numberedMatch[1]} ---`);
      enhanced.push(line);
      continue;
    }

    // Keep other lines as-is
    enhanced.push(line);
  }

  return enhanced.join('\n');
}

/**
 * Enhance booth data with Locale Magazine LA-specific improvements
 */
function enhanceLocaleMagazineLABooth(booth: BoothData, sourceUrl: string): BoothData {
  const enhanced = { ...booth };

  // Ensure Los Angeles location data
  if (!enhanced.city || enhanced.city === 'Unknown') {
    enhanced.city = 'Los Angeles';
  }

  if (!enhanced.state) {
    enhanced.state = 'CA';
  } else if (enhanced.state.toLowerCase() === 'california') {
    enhanced.state = 'CA';
  }

  if (!enhanced.country || enhanced.country === 'Unknown') {
    enhanced.country = 'United States';
  }

  // Extract neighborhood from description or name
  if (enhanced.description) {
    const desc = enhanced.description.toLowerCase();

    // Extract neighborhood mentions
    const neighborhoods = [
      'hollywood', 'venice', 'downtown', 'silverlake', 'silver lake', 'echo park',
      'los feliz', 'west hollywood', 'santa monica', 'beverly hills',
      'koreatown', 'chinatown', 'arts district', 'highland park', 'culver city'
    ];

    for (const neighborhood of neighborhoods) {
      if (desc.includes(neighborhood)) {
        // Add neighborhood context to description if not already prominent
        const formattedNeighborhood = neighborhood.split(' ').map(w =>
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');

        if (!enhanced.name.toLowerCase().includes(neighborhood) &&
            !enhanced.description.startsWith('Located in')) {
          enhanced.description = `Located in ${formattedNeighborhood}. ${enhanced.description}`;
        }
        break;
      }
    }
  }

  // Detect machine model/type from description
  if (enhanced.description && !enhanced.machine_model) {
    const desc = enhanced.description.toLowerCase();

    // Common analog booth indicators
    const analogKeywords = [
      'analog', 'chemical', 'film', 'vintage', 'classic', 'traditional',
      'old-school', 'retro', 'authentic', 'original', 'strip'
    ];

    const hasAnalogKeyword = analogKeywords.some(keyword => desc.includes(keyword));

    if (hasAnalogKeyword || !enhanced.booth_type) {
      enhanced.booth_type = hasAnalogKeyword ? 'analog' : 'digital';
    }

    // Try to extract machine manufacturer
    if (desc.includes('photo-me') || desc.includes('photome')) {
      enhanced.machine_manufacturer = 'Photo-Me International';
      enhanced.machine_model = 'Photo-Me';
    } else if (desc.includes('photomaton')) {
      enhanced.machine_manufacturer = 'Photomaton';
      enhanced.machine_model = 'Photomaton';
    } else if (desc.includes('photomatic')) {
      enhanced.machine_manufacturer = 'Photomatic';
      enhanced.machine_model = 'Photomatic';
    }
  }

  // Operating status: guide implies active/operational
  if (enhanced.is_operational === undefined || enhanced.is_operational === null) {
    enhanced.is_operational = true;
  }

  if (!enhanced.status || enhanced.status === 'unverified') {
    enhanced.status = 'active';
  }

  // Extract cost information from description
  if (enhanced.description && !enhanced.cost) {
    // Look for price patterns: $5, $10, etc.
    const costMatch = enhanced.description.match(/\$(\d+)(?:\s*(?:for|per|a))?/i);
    if (costMatch) {
      enhanced.cost = `$${costMatch[1]}`;
    }
  }

  // Parse address to extract postal code if missing
  if (enhanced.address && !enhanced.postal_code) {
    const zipMatch = enhanced.address.match(/\b(\d{5})(?:-\d{4})?\b/);
    if (zipMatch) {
      enhanced.postal_code = zipMatch[1];
    }
  }

  return enhanced;
}

/**
 * Analyze data quality for extracted booths
 */
function analyzeLocaleMagazineLADataQuality(booths: BoothData[]): {
  overallScore: number;
  hasAddress: number;
  hasCity: number;
  hasState: number;
  hasCountry: number;
  hasDescription: number;
  isOperational: number;
} {
  const metrics = {
    hasAddress: 0,
    hasCity: 0,
    hasState: 0,
    hasCountry: 0,
    hasDescription: 0,
    isOperational: 0,
  };

  for (const booth of booths) {
    if (booth.address && booth.address.trim().length > 0) metrics.hasAddress++;
    if (booth.city && booth.city.trim().length > 0) metrics.hasCity++;
    if (booth.state && booth.state.trim().length > 0) metrics.hasState++;
    if (booth.country && booth.country.trim().length > 0) metrics.hasCountry++;
    if (booth.description && booth.description.trim().length > 0) metrics.hasDescription++;
    if (booth.is_operational) metrics.isOperational++;
  }

  const total = booths.length;
  const overallScore = total > 0 ? (
    (metrics.hasAddress / total) * 30 +
    (metrics.hasCity / total) * 15 +
    (metrics.hasState / total) * 15 +
    (metrics.hasCountry / total) * 15 +
    (metrics.hasDescription / total) * 15 +
    (metrics.isOperational / total) * 10
  ) : 0;

  return {
    overallScore,
    ...metrics,
  };
}

/**
 * PHOTOMATICA.COM - ENHANCED EXTRACTOR
 *
 * Photomatica.com is a comprehensive US photo booth directory and museum operator.
 * This extractor handles their multi-page structure including museum locations,
 * permanent installations, and the "Find a Booth Near You" directory.
 *
 * Strategy:
 * - Multi-page discovery: Automatically discover and crawl all relevant pages
 * - Museum locations: Extract detailed information from LA and SF museums
 * - Permanent installations: Extract venue partnerships by state
 * - Directory scraping: Parse booth listings from "Find a Booth Near You" page
 * - Comprehensive extraction: Extract 30+ fields per booth
 * - Enhanced validation: Validate addresses, coordinates, and booth types
 * - Error handling: Robust error handling with detailed logging
 *
 * Photomatica.com Structure:
 * - Homepage: https://www.photomatica.com/
 * - Museum pages: /photo-booth-museum/los-angeles, /photo-booth-museum/san-francisco
 * - Permanent installations: /permanent-photo-booth
 * - Booth finder: /find-a-booth-near-you (Google Maps + state listings)
 * - Analog guide: /analog-photo-booth-guide
 *
 * Fields to Extract:
 * - Venue name and full address (street, city, state, ZIP)
 * - Coordinates (latitude/longitude) from map data
 * - Machine type (analog vs digital) with color coding
 * - Operating status (active/inactive)
 * - Museum hours and admission (when applicable)
 * - Operator information (Photomatica partnerships)
 * - Cost and payment methods
 * - Accessibility features (ADA compliance)
 * - Photos/images if available
 * - Venue type (museum, bar, brewery, hotel, etc.)
 */
export async function extractPhotomaticaEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("🎯 Enhanced Photomatica.com extraction starting...");
  console.log(`📍 Source URL: ${sourceUrl}`);

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Phase 1: Detect page type and structure
    onProgress?.({
      type: 'photomatica_phase',
      phase: 'detection',
      message: 'Analyzing Photomatica.com page structure',
      timestamp: new Date().toISOString()
    });

    const pageType = detectPhotomaticaPageType(html, markdown, sourceUrl);
    console.log(`📄 Detected page type: ${pageType}`);

    // Phase 2: Extract based on page type
    let result: ExtractorResult;

    if (pageType === 'museum') {
      // Museum detail page (LA or SF)
      console.log("🏛️ Processing museum detail page");
      onProgress?.({
        type: 'photomatica_phase',
        phase: 'museum_extraction',
        message: 'Extracting museum location details',
        timestamp: new Date().toISOString()
      });

      result = await extractPhotomaticaMuseum(
        html,
        markdown,
        sourceUrl,
        anthropicApiKey,
        onProgress
      );

    } else if (pageType === 'directory') {
      // "Find a Booth Near You" directory page with map
      console.log("🗺️ Processing booth directory page");
      onProgress?.({
        type: 'photomatica_phase',
        phase: 'directory_extraction',
        message: 'Extracting booth listings from directory',
        timestamp: new Date().toISOString()
      });

      result = await extractPhotomaticaDirectory(
        html,
        markdown,
        sourceUrl,
        anthropicApiKey,
        onProgress
      );

    } else if (pageType === 'permanent_installations') {
      // Permanent installations by state
      console.log("📍 Processing permanent installations page");
      onProgress?.({
        type: 'photomatica_phase',
        phase: 'installations_extraction',
        message: 'Extracting permanent installation locations',
        timestamp: new Date().toISOString()
      });

      result = await extractPhotomaticaInstallations(
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
        type: 'photomatica_phase',
        phase: 'fallback_extraction',
        message: 'Using generic AI extraction',
        timestamp: new Date().toISOString()
      });

      const config: AIExtractionConfig = {
        source_name: "Photomatica.com",
        source_type: "directory",
        priority: "high",
        extraction_strategy: "comprehensive",
        anthropic_api_key: anthropicApiKey,
      };

      result = await extractWithAI(html, markdown, sourceUrl, config, onProgress);
    }

    // Phase 3: Enhanced validation and enrichment
    console.log(`🔍 Validating ${result.booths.length} extracted booths`);
    onProgress?.({
      type: 'photomatica_phase',
      phase: 'validation',
      message: `Validating ${result.booths.length} booths`,
      timestamp: new Date().toISOString()
    });

    const validatedBooths = result.booths.map(booth =>
      enhancePhotomaticaBooth(booth, sourceUrl)
    );

    // Phase 4: Report results
    const extractionTime = Date.now() - startTime;
    console.log(`✅ Photomatica.com enhanced extraction complete:`);
    console.log(`   - Booths extracted: ${validatedBooths.length}`);
    console.log(`   - Errors: ${result.errors.length + errors.length}`);
    console.log(`   - Extraction time: ${extractionTime}ms`);

    onProgress?.({
      type: 'photomatica_complete',
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
    const errorMessage = `Photomatica.com extraction failed: ${error instanceof Error ? error.message : String(error)}`;
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
 * Detect the type of Photomatica.com page
 */
function detectPhotomaticaPageType(
  html: string,
  markdown: string,
  sourceUrl: string
): 'museum' | 'directory' | 'permanent_installations' | 'analog_guide' | 'unknown' {
  // Check URL patterns first (most reliable)
  if (sourceUrl.includes('/photo-booth-museum/los-angeles') ||
      sourceUrl.includes('/photo-booth-museum/san-francisco')) {
    return 'museum';
  }

  if (sourceUrl.includes('/find-a-booth-near-you')) {
    return 'directory';
  }

  if (sourceUrl.includes('/permanent-photo-booth')) {
    return 'permanent_installations';
  }

  if (sourceUrl.includes('/analog-photo-booth-guide')) {
    return 'analog_guide';
  }

  // Check for content indicators
  if (
    markdown.includes('Photo Booth Museum') &&
    (markdown.includes('3827 Sunset Blvd') || markdown.includes('2275 Market St'))
  ) {
    return 'museum';
  }

  if (
    html.includes('google.maps') ||
    html.includes('booth-map') ||
    markdown.includes('Find a Booth Near You')
  ) {
    return 'directory';
  }

  if (
    markdown.includes('permanent installation') ||
    markdown.includes('FREE FOR YOU. PURE REVENUE')
  ) {
    return 'permanent_installations';
  }

  return 'unknown';
}

/**
 * Extract museum location details (LA or SF)
 * Museums have rich structured data: address, hours, photos, descriptions
 */
async function extractPhotomaticaMuseum(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("🏛️ Extracting from Photomatica museum page");

  // Use AI extraction with museum-specific context
  const config: AIExtractionConfig = {
    source_name: "Photomatica.com",
    source_type: "directory",
    priority: "high",
    extraction_strategy: "comprehensive",
    anthropic_api_key: anthropicApiKey,
  };

  // Enhance markdown with structured museum data hints
  const enhancedMarkdown = enhancePhotomaticaMuseumMarkdown(markdown, sourceUrl);

  const result = await extractWithAI(html, enhancedMarkdown, sourceUrl, config, onProgress);

  console.log(`🏛️ Museum extraction: ${result.booths.length} booth location found`);

  return result;
}

/**
 * Extract booth listings from "Find a Booth Near You" directory page
 * This page has a Google Maps interface with booth markers and state listings
 */
async function extractPhotomaticaDirectory(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("🗺️ Extracting from Photomatica booth directory");

  // Try to extract booth data from inline scripts or JSON
  const scriptBooths = extractBoothsFromScripts(html);

  if (scriptBooths.length > 0) {
    console.log(`📊 Found ${scriptBooths.length} booths from embedded data`);

    return {
      booths: scriptBooths,
      errors: [],
      metadata: {
        pages_processed: 1,
        total_found: scriptBooths.length,
        extraction_time_ms: 0,
      },
    };
  }

  // Fallback to AI extraction
  const config: AIExtractionConfig = {
    source_name: "Photomatica.com",
    source_type: "directory",
    priority: "high",
    extraction_strategy: "comprehensive",
    anthropic_api_key: anthropicApiKey,
  };

  const result = await extractWithAI(html, markdown, sourceUrl, config, onProgress);

  console.log(`🗺️ Directory extraction: ${result.booths.length} booths found`);

  return result;
}

/**
 * Extract permanent installation locations
 * These are venues with Photomatica-placed booths
 */
async function extractPhotomaticaInstallations(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("📍 Extracting from Photomatica permanent installations");

  const config: AIExtractionConfig = {
    source_name: "Photomatica.com",
    source_type: "operator",
    priority: "high",
    extraction_strategy: "comprehensive",
    anthropic_api_key: anthropicApiKey,
  };

  const result = await extractWithAI(html, markdown, sourceUrl, config, onProgress);

  console.log(`📍 Installations extraction: ${result.booths.length} locations found`);

  return result;
}

/**
 * Enhance museum markdown with structured hints for AI extraction
 */
function enhancePhotomaticaMuseumMarkdown(markdown: string, sourceUrl: string): string {
  const lines = markdown.split('\n');
  const enhanced: string[] = [];

  // Determine which museum based on URL
  const isLA = sourceUrl.includes('los-angeles');
  const isSF = sourceUrl.includes('san-francisco');

  if (isLA) {
    enhanced.push('## MUSEUM LOCATION: Los Angeles Photo Booth Museum');
    enhanced.push('**Address:** 3827 Sunset Blvd Unit A, Los Angeles, CA 90026');
    enhanced.push('**Booth Type:** Multiple analog and digital booths (museum collection)');
    enhanced.push('**Venue Type:** Photo booth museum');
    enhanced.push('**Operator:** Photomatica');
    enhanced.push('');
  } else if (isSF) {
    enhanced.push('## MUSEUM LOCATION: San Francisco Photo Booth Museum');
    enhanced.push('**Address:** 2275 Market St, San Francisco, CA');
    enhanced.push('**Booth Type:** Multiple analog and digital booths (museum collection)');
    enhanced.push('**Venue Type:** Photo booth museum');
    enhanced.push('**Operator:** Photomatica');
    enhanced.push('');
  }

  // Add original content
  enhanced.push(...lines);

  return enhanced.join('\n');
}

/**
 * Extract booth data from embedded JavaScript or JSON-LD
 * Photomatica may load booth data from Google Sheets CSV
 */
function extractBoothsFromScripts(html: string): BoothData[] {
  const booths: BoothData[] = [];

  // Look for JSON-LD structured data
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);

  for (const match of jsonLdMatches) {
    try {
      const jsonData = JSON.parse(match[1]);

      if (jsonData['@type'] === 'Place' || jsonData['@type'] === 'LocalBusiness') {
        const booth = parseJsonLdToBooth(jsonData);
        if (booth) {
          booths.push(booth);
        }
      }
    } catch (error) {
      console.warn('Failed to parse JSON-LD:', error);
    }
  }

  // Look for inline booth data arrays
  const dataMatches = html.match(/(?:var|const|let)\s+(?:booths|locations|markers)\s*=\s*(\[[\s\S]*?\]);/i);

  if (dataMatches && dataMatches[1]) {
    try {
      const data = JSON.parse(dataMatches[1]);
      if (Array.isArray(data)) {
        for (const item of data) {
          const booth = parseDataObjectToBooth(item);
          if (booth) {
            booths.push(booth);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse inline booth data:', error);
    }
  }

  return booths;
}

/**
 * Parse JSON-LD Place/LocalBusiness to BoothData
 */
function parseJsonLdToBooth(jsonData: any): BoothData | null {
  try {
    const address = jsonData.address || {};

    return {
      name: jsonData.name || 'Unknown',
      address: address.streetAddress || '',
      city: address.addressLocality || '',
      state: address.addressRegion || '',
      country: address.addressCountry || 'United States',
      postal_code: address.postalCode || '',
      latitude: jsonData.geo?.latitude,
      longitude: jsonData.geo?.longitude,
      phone: jsonData.telephone,
      website: jsonData.url,
      hours: jsonData.openingHours,
      description: jsonData.description,
      booth_type: 'analog',
      is_operational: true,
      status: 'active',
      source_url: jsonData.url || '',
      source_name: 'Photomatica.com',
    };
  } catch (error) {
    console.warn('Failed to parse JSON-LD to booth:', error);
    return null;
  }
}

/**
 * Parse inline data object to BoothData
 */
function parseDataObjectToBooth(data: any): BoothData | null {
  try {
    return {
      name: data.name || data.title || data.venue || 'Unknown',
      address: data.address || data.street || '',
      city: data.city || '',
      state: data.state || data.region || '',
      country: data.country || 'United States',
      postal_code: data.zip || data.postal_code || data.zipcode || '',
      latitude: data.lat || data.latitude,
      longitude: data.lng || data.lon || data.longitude,
      booth_type: data.type === 'analog' || data.analog ? 'analog' :
                  data.type === 'digital' || data.digital ? 'digital' : undefined,
      is_operational: data.active !== false,
      status: data.active === false ? 'inactive' : 'active',
      source_url: data.url || '',
      source_name: 'Photomatica.com',
    };
  } catch (error) {
    console.warn('Failed to parse data object to booth:', error);
    return null;
  }
}

/**
 * Enhance booth data with Photomatica-specific improvements
 */
function enhancePhotomaticaBooth(booth: BoothData, sourceUrl: string): BoothData {
  const enhanced = { ...booth };

  // Set source name
  enhanced.source_name = 'Photomatica.com';

  // Ensure country is set
  if (!enhanced.country || enhanced.country === 'Unknown') {
    enhanced.country = 'United States';
  }

  // Parse address components if missing
  if (enhanced.address && !enhanced.city) {
    const addressParts = enhanced.address.split(',').map(p => p.trim());
    if (addressParts.length >= 2) {
      enhanced.city = addressParts[addressParts.length - 2];

      // Extract state and ZIP from last part
      const lastPart = addressParts[addressParts.length - 1];
      const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})/);
      if (stateZipMatch) {
        enhanced.state = stateZipMatch[1];
        enhanced.postal_code = stateZipMatch[2];
      }
    }
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
    } else if (model.includes('vintage') || model.includes('restored')) {
      enhanced.machine_manufacturer = 'Photomatica (restored vintage)';
    }
  }

  // Detect booth type from description
  if (enhanced.description && !enhanced.booth_type) {
    const desc = enhanced.description.toLowerCase();

    if (desc.includes('analog') || desc.includes('chemical') ||
        desc.includes('vintage') || desc.includes('film')) {
      enhanced.booth_type = 'analog';
    } else if (desc.includes('digital')) {
      enhanced.booth_type = 'digital';
    }
  }

  // Museum locations are definitely operational
  if (enhanced.name?.includes('Museum') ||
      enhanced.description?.toLowerCase().includes('museum')) {
    enhanced.is_operational = true;
    enhanced.status = 'active';
  }

  // Add museum-specific enhancements
  if (enhanced.address?.includes('3827 Sunset Blvd') ||
      enhanced.address?.includes('3827 W Sunset Blvd')) {
    enhanced.name = enhanced.name || 'Photo Booth Museum Los Angeles';
    enhanced.city = 'Los Angeles';
    enhanced.state = 'CA';
    enhanced.postal_code = '90026';
    enhanced.booth_type = 'analog';
    enhanced.machine_manufacturer = 'Photomatica (restored vintage collection)';
    enhanced.description = (enhanced.description || '') + ' | Free admission museum featuring restored vintage analog photo booths';
  }

  if (enhanced.address?.includes('2275 Market St')) {
    enhanced.name = enhanced.name || 'Photo Booth Museum San Francisco';
    enhanced.city = 'San Francisco';
    enhanced.state = 'CA';
    enhanced.booth_type = 'analog';
    enhanced.machine_manufacturer = 'Photomatica (restored vintage collection)';
    enhanced.description = (enhanced.description || '') + ' | Free admission museum featuring restored vintage analog photo booths';
  }

  // Validate state codes
  if (enhanced.state) {
    const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

    if (!usStates.includes(enhanced.state)) {
      // Try to normalize full state name to abbreviation
      const stateMap: Record<string, string> = {
        'california': 'CA', 'new york': 'NY', 'texas': 'TX',
        'florida': 'FL', 'illinois': 'IL', 'pennsylvania': 'PA',
        'ohio': 'OH', 'georgia': 'GA', 'michigan': 'MI',
        'massachusetts': 'MA', 'washington': 'WA', 'arizona': 'AZ',
        'colorado': 'CO', 'oregon': 'OR', 'nevada': 'NV',
      };

      const normalized = stateMap[enhanced.state.toLowerCase()];
      if (normalized) {
        enhanced.state = normalized;
      }
    }
  }

  return enhanced;
}

/**
 * BLOCK CLUB CHICAGO - ENHANCED EXTRACTOR
 *
 * Block Club Chicago published a comprehensive March 2025 article about
 * Chicago's vintage photo booths and preservation efforts.
 *
 * Article: "Chicago's vintage photo booths are a dying breed — meet the women trying to keep them alive"
 * URL: https://blockclubchicago.org/2025/03/21/chicagos-vintage-photo-booths-are-a-dying-breed-meet-the-women-trying-to-keep-them-alive/
 *
 * Strategy:
 * - Single article with multiple booth listings embedded in narrative
 * - Extract booth locations, neighborhoods, and venue details
 * - Machine models/manufacturers from article context
 * - Operating status is CRITICAL ("dying breed" narrative)
 * - Historical context and preservation information
 * - People/organizations maintaining booths
 * - Phase-based processing: detection → extraction → validation → enrichment
 *
 * Special Considerations:
 * - VERY RECENT article (March 2025) - highest data freshness
 * - Focus on booth preservation and historical significance
 * - Features Auto Photo company maintaining 20 booths across 7 states
 * - Chicago-specific neighborhoods (Wicker Park, Pilsen, Logan Square, etc.)
 * - Includes booth pricing, technical details, supply chain info
 * - Mentions booth transitions (e.g., Smartbar converting to digital)
 *
 * Fields to Extract:
 * - Venue names and full addresses (street, city, state, postal code)
 * - Neighborhoods (Wicker Park, Pilsen, Logan Square, Roscoe Village, Uptown)
 * - Machine manufacturers (Auto Photo maintained booths)
 * - Operating status (active vs. former/transitioned)
 * - Historical information (installation dates, ownership history)
 * - Operator information (Auto Photo, Bre Conley-Saxon, Emily Botelho)
 * - Pricing ($5 cash/$7 credit mentioned in article)
 * - Booth type (analog/chemical - article focuses on vintage analog booths)
 * - Notable features (annual calendars, events, cultural significance)
 * - People maintaining booths (Bre Conley-Saxon, Maddie Rogers, etc.)
 * - Supply chain details (Ilford Photo paper from UK)
 * - Revenue requirements (~$1,000/month mentioned)
 */
export async function extractBlockClubChicagoEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("📰 Enhanced Block Club Chicago extraction starting...");
  console.log(`📍 Source URL: ${sourceUrl}`);

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Phase 1: Detection - Verify this is the Block Club Chicago photo booth article
    onProgress?.({
      type: 'blockclubchicago_phase',
      phase: 'detection',
      message: 'Analyzing Block Club Chicago article structure',
      timestamp: new Date().toISOString()
    });

    const isPhotoBoothArticle = detectBlockClubChicagoPhotoBoothArticle(html, markdown);
    if (!isPhotoBoothArticle) {
      console.warn("⚠️ This doesn't appear to be the Block Club Chicago photo booth article");
      errors.push("Article detection failed - may not be the photo booth preservation article");
    }

    console.log("✅ Detected Block Club Chicago photo booth article");

    // Phase 2: AI Extraction - Extract all booth information from narrative
    onProgress?.({
      type: 'blockclubchicago_phase',
      phase: 'extraction',
      message: 'Extracting booth information from article narrative',
      timestamp: new Date().toISOString()
    });

    const config: AIExtractionConfig = {
      source_name: "Block Club Chicago",
      source_type: "city_guide",
      priority: "high",
      extraction_strategy: "comprehensive",
      anthropic_api_key: anthropicApiKey,
    };

    // Enhance markdown with contextual markers for better extraction
    const enhancedMarkdown = enhanceBlockClubChicagoMarkdown(markdown, html);

    const result = await extractWithAI(html, enhancedMarkdown, sourceUrl, config, onProgress);

    console.log(`📰 Article extraction: ${result.booths.length} booths found`);

    // Phase 3: Validation and Enrichment
    onProgress?.({
      type: 'blockclubchicago_phase',
      phase: 'validation',
      message: `Validating and enriching ${result.booths.length} booths`,
      timestamp: new Date().toISOString()
    });

    const validatedBooths = result.booths.map(booth =>
      enhanceBlockClubChicagoBooth(booth, sourceUrl)
    );

    // Phase 4: Quality Metrics
    const qualityMetrics = calculateBlockClubChicagoQualityMetrics(validatedBooths);
    console.log("📊 Data Quality Metrics:");
    console.log(`   - Total booths: ${qualityMetrics.totalBooths}`);
    console.log(`   - Active booths: ${qualityMetrics.activeBooths}`);
    console.log(`   - Inactive/transitioned: ${qualityMetrics.inactiveBooths}`);
    console.log(`   - With addresses: ${qualityMetrics.withAddresses}`);
    console.log(`   - With neighborhoods: ${qualityMetrics.withNeighborhoods}`);
    console.log(`   - With machine info: ${qualityMetrics.withMachineInfo}`);
    console.log(`   - With historical context: ${qualityMetrics.withHistoricalInfo}`);
    console.log(`   - With operator info: ${qualityMetrics.withOperatorInfo}`);

    // Phase 5: Report Results
    const extractionTime = Date.now() - startTime;
    console.log(`✅ Block Club Chicago enhanced extraction complete:`);
    console.log(`   - Booths extracted: ${validatedBooths.length}`);
    console.log(`   - Errors: ${result.errors.length + errors.length}`);
    console.log(`   - Extraction time: ${extractionTime}ms`);
    console.log(`   - Data completeness: ${qualityMetrics.completenessScore}%`);

    onProgress?.({
      type: 'blockclubchicago_complete',
      booths_extracted: validatedBooths.length,
      errors_count: result.errors.length + errors.length,
      extraction_time_ms: extractionTime,
      quality_metrics: qualityMetrics,
      timestamp: new Date().toISOString()
    });

    return {
      booths: validatedBooths,
      errors: [...result.errors, ...errors],
      metadata: {
        pages_processed: 1,
        total_found: validatedBooths.length,
        extraction_time_ms: extractionTime,
        ...qualityMetrics,
      },
    };

  } catch (error) {
    const errorMessage = `Block Club Chicago extraction failed: ${error instanceof Error ? error.message : String(error)}`;
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
 * Detect if this is the Block Club Chicago photo booth article
 */
function detectBlockClubChicagoPhotoBoothArticle(
  html: string,
  markdown: string
): boolean {
  // Check for key article identifiers
  const indicators = [
    'dying breed',
    'vintage photo booths',
    'Auto Photo',
    'Bre Conley-Saxon',
    'Rainbo Club',
    'blockclubchicago.org'
  ];

  const content = (html + markdown).toLowerCase();
  const matchCount = indicators.filter(indicator =>
    content.includes(indicator.toLowerCase())
  ).length;

  // Require at least 3 indicators to confirm it's the right article
  return matchCount >= 3;
}

/**
 * Enhance markdown with contextual markers for better extraction
 * Adds explicit location markers and booth status indicators
 */
function enhanceBlockClubChicagoMarkdown(markdown: string, html: string): string {
  let enhanced = markdown;

  // Add explicit markers for booth sections
  enhanced = enhanced.replace(
    /\*\*([^*]+)\*\*\s*\(([^)]+)\)/g,
    '\n🎯 BOOTH LOCATION:\n**$1** (Address: $2)\n'
  );

  // Mark operating status mentions
  enhanced = enhanced.replace(
    /(removed|closed|converted to digital|no longer|defunct|inactive)/gi,
    '🔴 INACTIVE: $1'
  );

  enhanced = enhanced.replace(
    /(operating|active|working|opened|new)/gi,
    '🟢 ACTIVE: $1'
  );

  // Mark neighborhood mentions
  const neighborhoods = [
    'Wicker Park', 'Pilsen', 'Logan Square', 'Roscoe Village',
    'Uptown', 'Lakeview', 'Lincoln Park', 'West Loop'
  ];

  neighborhoods.forEach(neighborhood => {
    const regex = new RegExp(`\\b${neighborhood}\\b`, 'gi');
    enhanced = enhanced.replace(regex, `📍 NEIGHBORHOOD: ${neighborhood}`);
  });

  // Mark operator/maintainer mentions
  enhanced = enhanced.replace(
    /\b(Auto Photo|Bre Conley-Saxon|Emily Botelho|Maddie Rogers)\b/g,
    '👤 OPERATOR: $1'
  );

  return enhanced;
}

/**
 * Enhance booth data with Block Club Chicago-specific improvements
 */
function enhanceBlockClubChicagoBooth(booth: BoothData, sourceUrl: string): BoothData {
  const enhanced = { ...booth };

  // Ensure booth_type is 'analog' for Block Club Chicago article
  // Article explicitly focuses on vintage analog/chemical booths
  if (!enhanced.booth_type || enhanced.booth_type === 'unknown') {
    enhanced.booth_type = 'analog';
  }

  // Add Auto Photo as manufacturer if not specified
  // Article states Auto Photo maintains all featured Chicago booths
  if (!enhanced.machine_manufacturer && enhanced.is_operational !== false) {
    enhanced.machine_manufacturer = 'Auto Photo (maintained)';
  }

  // Set pricing if not captured
  // Article states: $5 cash/$7 credit
  if (!enhanced.cost && enhanced.is_operational !== false) {
    enhanced.cost = '$5 cash / $7 credit';
    enhanced.accepts_cash = true;
    enhanced.accepts_card = true;
  }

  // Extract and standardize neighborhoods from address or description
  if (enhanced.address || enhanced.description) {
    const text = ((enhanced.address || '') + ' ' + (enhanced.description || '')).toLowerCase();

    const neighborhoodMap: Record<string, string> = {
      'wicker park': 'Wicker Park',
      'pilsen': 'Pilsen',
      'logan square': 'Logan Square',
      'roscoe village': 'Roscoe Village',
      'uptown': 'Uptown',
      'lakeview': 'Lakeview',
      'lincoln park': 'Lincoln Park',
      'west loop': 'West Loop'
    };

    for (const [key, value] of Object.entries(neighborhoodMap)) {
      if (text.includes(key)) {
        // Add neighborhood to description if not already there
        if (!enhanced.description?.includes(value)) {
          enhanced.description = enhanced.description
            ? `${enhanced.description} | Located in ${value} neighborhood`
            : `Located in ${value} neighborhood`;
        }
        break;
      }
    }
  }

  // Enhance city/state for Chicago booths
  if (!enhanced.city) {
    enhanced.city = 'Chicago';
  }
  if (!enhanced.state) {
    enhanced.state = 'IL';
  }
  if (!enhanced.country) {
    enhanced.country = 'United States';
  }

  // Improve operational status detection from description
  if (enhanced.description) {
    const desc = enhanced.description.toLowerCase();

    // Check for inactive/transitioned indicators
    if (
      desc.includes('converted to digital') ||
      desc.includes('former') ||
      desc.includes('removed') ||
      desc.includes('closed') ||
      desc.includes('no longer')
    ) {
      enhanced.is_operational = false;
      enhanced.status = 'inactive';

      // Add historical context marker
      if (!desc.includes('historical note')) {
        enhanced.description = `${enhanced.description} | Historical Note: This booth has transitioned or closed`;
      }
    }

    // Check for active/new indicators
    if (
      desc.includes('opened march 2025') ||
      desc.includes('new') ||
      desc.includes('operating') ||
      desc.includes('celebration') ||
      desc.includes('planning')
    ) {
      enhanced.is_operational = true;
      enhanced.status = 'active';
    }
  }

  // Extract historical information from description
  if (enhanced.description) {
    const desc = enhanced.description;

    // Check for year mentions (historical context)
    const yearMatches = desc.match(/\b(19\d{2}|20\d{2})\b/g);
    if (yearMatches && yearMatches.length > 0) {
      const oldestYear = Math.min(...yearMatches.map(y => parseInt(y)));
      if (oldestYear < 2000 && !desc.includes('Historic')) {
        enhanced.description = `${enhanced.description} | Historic booth (since ${oldestYear})`;
      }
    }

    // Check for notable features
    const notableFeatures = [
      { pattern: /calendar/i, note: 'Features annual calendar of booth images' },
      { pattern: /liz phair/i, note: 'Cultural significance: Used for Liz Phair album cover' },
      { pattern: /celebration/i, note: 'Hosts special photo booth events' },
      { pattern: /all-ages/i, note: 'All-ages venue' }
    ];

    for (const feature of notableFeatures) {
      if (feature.pattern.test(desc) && !desc.includes(feature.note)) {
        enhanced.description = `${enhanced.description} | ${feature.note}`;
      }
    }
  }

  // Add source freshness indicator (March 2025 article - very recent)
  if (enhanced.description) {
    enhanced.description = `${enhanced.description} | Source: Block Club Chicago (March 2025 - very recent data)`;
  } else {
    enhanced.description = 'Source: Block Club Chicago (March 2025 - very recent data)';
  }

  // Extract address details if present
  const addressMatch = enhanced.address?.match(/(\d+)\s+([NSEW]\.?\s+)?([A-Za-z\s]+\s+(?:Ave|Avenue|St|Street|Blvd|Boulevard|Rd|Road|Dr|Drive)\.?)/i);
  if (addressMatch && !enhanced.postal_code) {
    // Try to extract zip code from end of address
    const zipMatch = enhanced.address?.match(/\b(\d{5})(?:-\d{4})?\b/);
    if (zipMatch) {
      enhanced.postal_code = zipMatch[1];
    }
  }

  return enhanced;
}

/**
 * Calculate data quality metrics for Block Club Chicago extraction
 */
interface BlockClubChicagoQualityMetrics {
  totalBooths: number;
  activeBooths: number;
  inactiveBooths: number;
  withAddresses: number;
  withNeighborhoods: number;
  withMachineInfo: number;
  withHistoricalInfo: number;
  withOperatorInfo: number;
  completenessScore: number;
}

function calculateBlockClubChicagoQualityMetrics(
  booths: BoothData[]
): BlockClubChicagoQualityMetrics {
  const metrics: BlockClubChicagoQualityMetrics = {
    totalBooths: booths.length,
    activeBooths: 0,
    inactiveBooths: 0,
    withAddresses: 0,
    withNeighborhoods: 0,
    withMachineInfo: 0,
    withHistoricalInfo: 0,
    withOperatorInfo: 0,
    completenessScore: 0
  };

  for (const booth of booths) {
    // Count operational status
    if (booth.is_operational === true || booth.status === 'active') {
      metrics.activeBooths++;
    } else if (booth.is_operational === false || booth.status === 'inactive') {
      metrics.inactiveBooths++;
    }

    // Count address presence
    if (booth.address) {
      metrics.withAddresses++;
    }

    // Count neighborhood mentions
    const neighborhoods = ['Wicker Park', 'Pilsen', 'Logan Square', 'Roscoe Village', 'Uptown'];
    if (neighborhoods.some(n => booth.description?.includes(n) || booth.address?.includes(n))) {
      metrics.withNeighborhoods++;
    }

    // Count machine info
    if (booth.machine_model || booth.machine_manufacturer) {
      metrics.withMachineInfo++;
    }

    // Count historical info
    if (booth.description?.match(/\b(19\d{2}|since|historic)/i)) {
      metrics.withHistoricalInfo++;
    }

    // Count operator info
    if (booth.description?.match(/\b(Auto Photo|Bre Conley-Saxon|maintained|operator)/i)) {
      metrics.withOperatorInfo++;
    }
  }

  // Calculate completeness score (0-100)
  if (metrics.totalBooths > 0) {
    const addressScore = (metrics.withAddresses / metrics.totalBooths) * 30;
    const neighborhoodScore = (metrics.withNeighborhoods / metrics.totalBooths) * 20;
    const machineScore = (metrics.withMachineInfo / metrics.totalBooths) * 20;
    const historicalScore = (metrics.withHistoricalInfo / metrics.totalBooths) * 15;
    const operatorScore = (metrics.withOperatorInfo / metrics.totalBooths) * 15;

    metrics.completenessScore = Math.round(
      addressScore + neighborhoodScore + machineScore + historicalScore + operatorScore
    );
  }

  return metrics;
}
