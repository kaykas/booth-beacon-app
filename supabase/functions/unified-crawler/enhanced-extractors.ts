/**
 * Enhanced AI-Powered Extractors
 *
 * These extractors replace the weak regex-based extractors with
 * robust AI-powered extraction specifically tuned for photo booth data.
 */

import { extractWithAI, AIExtractionConfig } from "./ai-extraction-engine.ts";
import { ExtractorResult } from "./extractors.ts";

/**
 * PHOTOBOOTH.NET - ENHANCED EXTRACTOR
 *
 * photobooth.net is the GOLD STANDARD directory of analog photo booths.
 * This extractor must be comprehensive and extract maximum detail.
 *
 * Strategy:
 * - Use AI extraction with high-detail prompting
 * - Process all state/country pages
 * - Extract venue names, addresses, machine models, operators
 * - Capture historical information and user reports
 */
export async function extractPhotoboothNetEnhanced(
  html: string,
  markdown: string,
  sourceUrl: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  console.log("🎯 Enhanced photobooth.net extraction starting...");

  const config: AIExtractionConfig = {
    source_name: "photobooth.net",
    source_type: "directory",
    priority: "high",
    extraction_strategy: "comprehensive",
    anthropic_api_key: anthropicApiKey,
  };

  const result = await extractWithAI(html, markdown, sourceUrl, config, onProgress);

  console.log(`✅ photobooth.net enhanced extraction: ${result.booths.length} booths, ${result.errors.length} errors`);

  return result;
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
