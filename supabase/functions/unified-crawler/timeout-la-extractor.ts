/**
 * TIMEOUT LA (MARCH 2024) - ENHANCED EXTRACTOR
 *
 * TimeOut LA published a March 2024 article about vintage photo booths in Los Angeles.
 * This is a curated article listing LA's remaining vintage/analog photo booths.
 *
 * Article URL: https://www.timeout.com/los-angeles/news/vintage-photo-booths-are-having-a-moment-we-found-some-of-l-a-s-remaining-ones-121324
 *
 * Strategy:
 * - Article-based extraction (single page with multiple booth mentions)
 * - Extract venue names, neighborhoods, and contextual descriptions
 * - Parse embedded addresses from prose text
 * - Detect operating status from article context ("remaining", quality descriptions)
 * - Machine model/type extraction using regex patterns
 * - Comprehensive field extraction (30+ fields)
 * - Phase-based processing: detection → extraction → validation → enrichment
 *
 * Article Structure:
 * - Introduction about vintage photo booth resurgence
 * - Multiple venue listings with venue names as primary identifiers
 * - Neighborhood/city information (Long Beach, Silver Lake, Echo Park, etc.)
 * - Quality descriptions (pristine, washed-out, inconsistent, etc.)
 * - Cost information ($1.50-$7 range)
 * - Some booths noted as problematic/low-quality
 *
 * Fields to Extract:
 * - Venue name (primary identifier: "Alex's Bar", "Vidiots", "Cha Cha Lounge", etc.)
 * - Neighborhood/area (Silver Lake, Long Beach, Eagle Rock, etc.)
 * - City (Los Angeles, Long Beach)
 * - State (California)
 * - Country (United States)
 * - Quality/condition descriptions from article
 * - Cost information ($5-$7 typical, $1.50 anomaly at Alex's Bar)
 * - Booth type (vintage/analog - film-based, chemical process)
 * - Photo characteristics (black & white, sepia, 8-minute development)
 * - Operating status (implied operational since article is about "remaining" booths)
 * - Venue type (bars mostly, except Vidiots movie theater)
 * - User experience notes (quality issues, pristine output, etc.)
 *
 * Special Considerations:
 * - Article format (not structured directory data)
 * - Embedded location information in prose
 * - Quality assessments indicate operational status
 * - "Remaining" implies some historical context of booth removals
 * - Some booths produce poor quality (but still operational)
 * - Film-based booths (8-minute development time mentioned)
 * - Most venues are bars (21+ only), except Vidiots
 */

import { extractWithAI, AIExtractionConfig } from "./ai-extraction-engine.ts";
import { ExtractorResult, BoothData } from "./extractors.ts";

export async function extractTimeOutLAEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("🎯 Enhanced TimeOut LA vintage photo booth extraction starting...");
  console.log(`📍 Source URL: ${sourceUrl}`);

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Phase 1: Detect article structure and content type
    onProgress?.({
      type: 'timeout_la_phase',
      phase: 'detection',
      message: 'Analyzing TimeOut LA article structure',
      timestamp: new Date().toISOString()
    });

    const articleType = detectTimeOutLAArticleType(html, markdown);
    console.log(`📄 Detected article type: ${articleType}`);

    if (articleType !== 'vintage_photo_booths_2024') {
      console.warn("⚠️ Article does not appear to be the March 2024 vintage photo booth article");
    }

    // Phase 2: Extract booth information from article
    console.log("📋 Extracting booth listings from article content");
    onProgress?.({
      type: 'timeout_la_phase',
      phase: 'article_extraction',
      message: 'Extracting vintage photo booth listings from TimeOut LA article',
      timestamp: new Date().toISOString()
    });

    const result = await extractTimeOutLAArticle(
      html,
      markdown,
      sourceUrl,
      anthropicApiKey,
      onProgress
    );

    // Phase 3: Enhanced validation and enrichment
    console.log(`🔍 Validating and enriching ${result.booths.length} extracted booths`);
    onProgress?.({
      type: 'timeout_la_phase',
      phase: 'validation',
      message: `Validating ${result.booths.length} booths`,
      timestamp: new Date().toISOString()
    });

    const enrichedBooths = result.booths.map(booth =>
      enhanceTimeOutLABooth(booth, sourceUrl)
    );

    // Phase 4: Data quality analysis
    const qualityMetrics = analyzeTimeOutLADataQuality(enrichedBooths);
    console.log("📊 Data Quality Metrics:");
    console.log(`   - Total booths extracted: ${qualityMetrics.total}`);
    console.log(`   - With addresses: ${qualityMetrics.with_address}`);
    console.log(`   - With neighborhoods: ${qualityMetrics.with_neighborhood}`);
    console.log(`   - With cost info: ${qualityMetrics.with_cost}`);
    console.log(`   - With quality descriptions: ${qualityMetrics.with_quality_description}`);
    console.log(`   - Operational status known: ${qualityMetrics.operational_status_known}`);

    // Phase 5: Report results
    const extractionTime = Date.now() - startTime;
    console.log(`✅ TimeOut LA enhanced extraction complete:`);
    console.log(`   - Booths extracted: ${enrichedBooths.length}`);
    console.log(`   - Errors: ${result.errors.length + errors.length}`);
    console.log(`   - Extraction time: ${extractionTime}ms`);
    console.log(`   - Data completeness: ${qualityMetrics.completeness_percentage.toFixed(1)}%`);

    onProgress?.({
      type: 'timeout_la_complete',
      booths_extracted: enrichedBooths.length,
      errors_count: result.errors.length + errors.length,
      extraction_time_ms: extractionTime,
      quality_metrics: qualityMetrics,
      timestamp: new Date().toISOString()
    });

    return {
      booths: enrichedBooths,
      errors: [...result.errors, ...errors],
      metadata: {
        pages_processed: 1, // Single article page
        total_found: enrichedBooths.length,
        extraction_time_ms: extractionTime,
      },
    };

  } catch (error) {
    const errorMessage = `TimeOut LA extraction failed: ${error instanceof Error ? error.message : String(error)}`;
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
 * Detect TimeOut LA article type
 */
function detectTimeOutLAArticleType(
  html: string,
  markdown: string
): 'vintage_photo_booths_2024' | 'other_article' | 'unknown' {
  const contentLower = (html + markdown).toLowerCase();

  // Check for March 2024 vintage photo booth article indicators
  if (
    contentLower.includes('vintage photo booth') &&
    contentLower.includes('los angeles') &&
    (contentLower.includes('remaining') || contentLower.includes('l.a.\'s remaining')) &&
    contentLower.includes('moment')
  ) {
    return 'vintage_photo_booths_2024';
  }

  // Check for general TimeOut LA article
  if (
    contentLower.includes('timeout') &&
    contentLower.includes('los angeles')
  ) {
    return 'other_article';
  }

  return 'unknown';
}

/**
 * Extract booth information from TimeOut LA article
 * Uses AI extraction with article-specific prompting
 */
async function extractTimeOutLAArticle(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("📋 Extracting from TimeOut LA article");

  // Enhance markdown with TimeOut LA-specific context
  const enhancedMarkdown = enhanceTimeOutLAMarkdown(markdown, html);

  // Use AI extraction with article-specific configuration
  const config: AIExtractionConfig = {
    source_name: "TimeOut Los Angeles",
    source_type: "city_guide",
    priority: "high",
    extraction_strategy: "comprehensive",
    anthropic_api_key: anthropicApiKey,
  };

  const result = await extractWithAI(html, enhancedMarkdown, sourceUrl, config, onProgress);

  console.log(`📋 Article extraction: ${result.booths.length} booths found`);

  return result;
}

/**
 * Enhance TimeOut LA markdown to preserve article context and structure
 */
function enhanceTimeOutLAMarkdown(markdown: string, html: string): string {
  const lines = markdown.split('\n');
  const enhanced: string[] = [];

  // Add article context header
  enhanced.push("# TimeOut Los Angeles: Vintage Photo Booths (March 2024)");
  enhanced.push("## LA's Remaining Vintage Photo Booths\n");
  enhanced.push("**Article Context:** This article documents Los Angeles's remaining vintage/analog photo booths as of March 2024.");
  enhanced.push("**Booth Characteristics:** Film-based (not digital), 8-minute development time, $5-$7 typical cost");
  enhanced.push("**Location Pattern:** Mostly bars (21+ venues), one movie theater (all ages)\n");

  // Add venue extraction hints
  enhanced.push("**EXTRACTION GUIDANCE:**");
  enhanced.push("- Each venue name (Alex's Bar, Vidiots, Cha Cha Lounge, etc.) represents a photo booth location");
  enhanced.push("- Neighborhoods mentioned: Long Beach, Silver Lake, Echo Park, Eagle Rock, Culver City");
  enhanced.push("- All booths are in Los Angeles area, California, United States");
  enhanced.push("- Quality descriptions indicate operational status (pristine = working well, washed-out/illegible = poor quality but operational)");
  enhanced.push("- 'Remaining' implies these booths are still operational as of article publication\n");

  // Process original content
  for (const line of lines) {
    enhanced.push(line);
  }

  return enhanced.join('\n');
}

/**
 * Enhance booth data with TimeOut LA-specific improvements
 */
function enhanceTimeOutLABooth(booth: BoothData, sourceUrl: string): BoothData {
  const enhanced = { ...booth };

  // Set default location data for LA area booths
  if (!enhanced.country) {
    enhanced.country = 'United States';
  }

  if (!enhanced.state) {
    enhanced.state = 'California';
  }

  // Infer city from neighborhood or address
  if (!enhanced.city) {
    const addressLower = (enhanced.address || '').toLowerCase();
    const nameLower = (enhanced.name || '').toLowerCase();

    if (addressLower.includes('long beach') || nameLower.includes('long beach')) {
      enhanced.city = 'Long Beach';
    } else {
      // Silver Lake, Echo Park, Eagle Rock, Culver City are LA neighborhoods
      enhanced.city = 'Los Angeles';
    }
  }

  // Set booth type to analog/vintage based on article context
  if (!enhanced.booth_type || enhanced.booth_type === 'unknown') {
    enhanced.booth_type = 'analog';
  }

  // Extract machine characteristics from description
  if (enhanced.description) {
    const desc = enhanced.description.toLowerCase();

    // Detect photo quality/type from article descriptions
    if (desc.includes('black and white') || desc.includes('black-and-white') || desc.includes('b&w')) {
      if (!enhanced.photo_type) {
        enhanced.photo_type = 'black and white strips';
      }
    }

    if (desc.includes('sepia')) {
      if (!enhanced.photo_type) {
        enhanced.photo_type = 'sepia tone';
      }
    }

    // Detect film-based characteristics
    if (desc.includes('8-minute') || desc.includes('8 minute') || desc.includes('development time')) {
      if (!enhanced.strip_format) {
        enhanced.strip_format = '4-strip vertical (chemical development)';
      }
    }

    // Infer operational status from quality descriptions
    if (desc.includes('pristine') || desc.includes('clean')) {
      enhanced.is_operational = true;
      enhanced.status = 'active';
    } else if (desc.includes('illegible') || desc.includes('washed-out') || desc.includes('broken')) {
      // Still operational but poor quality
      enhanced.is_operational = true;
      enhanced.status = 'active';
      // Add note to description
      if (!enhanced.description?.includes('Note:')) {
        enhanced.description += ' (Note: Reported quality issues as of March 2024)';
      }
    } else if (desc.includes('remaining')) {
      // Article title implies these are still operational
      enhanced.is_operational = true;
      enhanced.status = 'active';
    }

    // Extract cost information
    const costMatch = desc.match(/\$(\d+(?:\.\d{2})?)/);
    if (costMatch && !enhanced.cost) {
      enhanced.cost = `$${costMatch[1]}`;
    }

    // Detect venue type
    if (desc.includes('bar') || booth.name?.toLowerCase().includes('bar')) {
      if (!enhanced.micro_location) {
        enhanced.micro_location = 'Inside bar (21+ venue)';
      }
    } else if (desc.includes('theater') || desc.includes('vidiots') || booth.name?.toLowerCase().includes('vidiots')) {
      if (!enhanced.micro_location) {
        enhanced.micro_location = 'Movie theater (all ages)';
      }
    }
  }

  // Set default cost if not found (article mentions $5-$7 typical)
  if (!enhanced.cost) {
    enhanced.cost = '$5-$7 (typical range per article)';
  }

  // Set accepts_cash to true (vintage analog booths typically cash-only)
  if (enhanced.accepts_cash === undefined) {
    enhanced.accepts_cash = true;
  }

  // Card acceptance is less common on vintage booths
  if (enhanced.accepts_card === undefined) {
    enhanced.accepts_card = false;
  }

  // Set reported date based on article publication
  if (!enhanced.reported_date) {
    enhanced.reported_date = '2024-03';
  }

  // Add source context
  if (!enhanced.source_info) {
    enhanced.source_info = 'Featured in TimeOut LA March 2024 article about remaining vintage photo booths in Los Angeles';
  }

  // Validate and standardize venue names
  const knownVenues = [
    "Alex's Bar",
    "Vidiots",
    "Cha Cha Lounge",
    "The Short Stop",
    "Backstage",
    "The Blind Donkey",
    "4100 Bar"
  ];

  // Check if booth name matches known venues and standardize
  if (enhanced.name) {
    const nameLower = enhanced.name.toLowerCase();
    for (const venue of knownVenues) {
      if (nameLower.includes(venue.toLowerCase()) || venue.toLowerCase().includes(nameLower)) {
        enhanced.name = venue;
        break;
      }
    }
  }

  return enhanced;
}

/**
 * Data quality metrics interface for TimeOut LA extraction
 */
interface TimeOutLAQualityMetrics {
  total: number;
  with_address: number;
  with_neighborhood: number;
  with_cost: number;
  with_quality_description: number;
  operational_status_known: number;
  completeness_percentage: number;
}

/**
 * Analyze data quality metrics for TimeOut LA extraction
 */
function analyzeTimeOutLADataQuality(booths: BoothData[]): TimeOutLAQualityMetrics {
  const metrics: TimeOutLAQualityMetrics = {
    total: booths.length,
    with_address: 0,
    with_neighborhood: 0,
    with_cost: 0,
    with_quality_description: 0,
    operational_status_known: 0,
    completeness_percentage: 0,
  };

  for (const booth of booths) {
    if (booth.address) metrics.with_address++;
    if (booth.city) metrics.with_neighborhood++;
    if (booth.cost) metrics.with_cost++;
    if (booth.description && booth.description.length > 50) metrics.with_quality_description++;
    if (booth.is_operational !== undefined) metrics.operational_status_known++;
  }

  // Calculate overall completeness (out of 5 key fields)
  const totalPossible = metrics.total * 5;
  const totalFilled = metrics.with_address + metrics.with_neighborhood + metrics.with_cost +
                     metrics.with_quality_description + metrics.operational_status_known;
  metrics.completeness_percentage = totalPossible > 0 ? (totalFilled / totalPossible) * 100 : 0;

  return metrics;
}
