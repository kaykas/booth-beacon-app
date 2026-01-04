/**
 * Pattern Learning Module for Hybrid Crawler
 *
 * Analyzes successful Agent (AI) extractions to learn reusable patterns
 * for cheaper direct scraping on subsequent runs.
 *
 * Strategy:
 * 1. After Agent successfully extracts booths, analyze the HTML structure
 * 2. Identify CSS selectors, XPath patterns, or structural patterns
 * 3. Store patterns in extraction_patterns table with confidence scores
 * 4. Validate patterns on next crawl to ensure they still work
 */

import { BoothData } from "./extractors.ts";

export interface LearnedPattern {
  field_name: string;
  pattern_type: 'css_selector' | 'xpath' | 'json_path' | 'regex' | 'compound';
  selector: string;
  fallback_selectors?: string[];
  extraction_method: 'text' | 'attr' | 'html' | 'json';
  extraction_args?: Record<string, any>;
  validation_regex?: string;
  required: boolean;
  transform_fn?: string;
  confidence_score: number;
}

export interface PatternLearningResult {
  source_id: string;
  source_name: string;
  patterns_learned: LearnedPattern[];
  analysis_time_ms: number;
  success: boolean;
  error_message?: string;
}

/**
 * Learn patterns from successful Agent extraction
 *
 * This is the core pattern learning function that analyzes HTML structure
 * and the extracted data to identify reusable patterns.
 */
export async function learnPatternsFromAgentRun(
  html: string,
  extractedBooths: BoothData[],
  sourceId: string,
  sourceName: string,
  agentRunId: string,
  supabase: any
): Promise<PatternLearningResult> {
  const startTime = Date.now();
  const learnedPatterns: LearnedPattern[] = [];

  try {
    console.log(`🧠 Learning patterns from ${sourceName} (${extractedBooths.length} booths extracted)`);

    // If no booths extracted, nothing to learn
    if (extractedBooths.length === 0) {
      return {
        source_id: sourceId,
        source_name: sourceName,
        patterns_learned: [],
        analysis_time_ms: Date.now() - startTime,
        success: false,
        error_message: 'No booths extracted by Agent'
      };
    }

    // Parse HTML into DOM-like structure (using regex for Deno environment)
    const htmlAnalysis = analyzeHtmlStructure(html, extractedBooths);

    // Learn patterns for each common field
    const fieldsToLearn = [
      'name',
      'address',
      'city',
      'state',
      'country',
      'machine_model',
      'cost',
      'hours',
      'description'
    ];

    for (const fieldName of fieldsToLearn) {
      const pattern = learnPatternForField(fieldName, htmlAnalysis, extractedBooths);
      if (pattern) {
        learnedPatterns.push(pattern);
      }
    }

    // Store patterns in database
    if (learnedPatterns.length > 0) {
      await storePatternsInDatabase(
        supabase,
        sourceId,
        agentRunId,
        learnedPatterns
      );

      // Update crawl_sources to mark pattern learning complete
      await supabase
        .from('crawl_sources')
        .update({
          pattern_learning_status: 'completed',
          pattern_learned_at: new Date().toISOString(),
          extraction_mode: 'hybrid' // Enable hybrid mode
        })
        .eq('id', sourceId);

      console.log(`✅ Learned ${learnedPatterns.length} patterns for ${sourceName}`);
    }

    return {
      source_id: sourceId,
      source_name: sourceName,
      patterns_learned: learnedPatterns,
      analysis_time_ms: Date.now() - startTime,
      success: true
    };

  } catch (error) {
    console.error('Pattern learning error:', error);
    return {
      source_id: sourceId,
      source_name: sourceName,
      patterns_learned: [],
      analysis_time_ms: Date.now() - startTime,
      success: false,
      error_message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Analyze HTML structure to find common patterns
 */
function analyzeHtmlStructure(html: string, booths: BoothData[]): HtmlAnalysis {
  const analysis: HtmlAnalysis = {
    commonClasses: findCommonClasses(html),
    commonTags: findCommonTags(html),
    listStructures: findListStructures(html),
    tableStructures: findTableStructures(html),
    dataAttributes: findDataAttributes(html),
    boothCount: booths.length
  };

  return analysis;
}

interface HtmlAnalysis {
  commonClasses: string[];
  commonTags: string[];
  listStructures: string[];
  tableStructures: string[];
  dataAttributes: string[];
  boothCount: number;
}

/**
 * Find common class names that might indicate booth containers
 */
function findCommonClasses(html: string): string[] {
  const classRegex = /class=["']([^"']+)["']/g;
  const classMap = new Map<string, number>();

  let match;
  while ((match = classRegex.exec(html)) !== null) {
    const classes = match[1].split(/\s+/);
    for (const cls of classes) {
      classMap.set(cls, (classMap.get(cls) || 0) + 1);
    }
  }

  // Return classes that appear multiple times (likely list items)
  return Array.from(classMap.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([cls]) => cls);
}

/**
 * Find common HTML tags that might contain booth data
 */
function findCommonTags(html: string): string[] {
  const tags = ['article', 'section', 'div', 'li', 'tr', 'dl', 'card'];
  const tagCounts = new Map<string, number>();

  for (const tag of tags) {
    const regex = new RegExp(`<${tag}[^>]*>`, 'gi');
    const matches = html.match(regex);
    if (matches) {
      tagCounts.set(tag, matches.length);
    }
  }

  return Array.from(tagCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

/**
 * Find list structures (ul, ol, repeated divs)
 */
function findListStructures(html: string): string[] {
  const structures: string[] = [];

  // Check for ul/ol lists
  if (/<ul[^>]*>[\s\S]*?<li/i.test(html)) {
    structures.push('ul > li');
  }
  if (/<ol[^>]*>[\s\S]*?<li/i.test(html)) {
    structures.push('ol > li');
  }

  // Check for article tags
  const articleMatches = html.match(/<article/gi);
  if (articleMatches && articleMatches.length >= 2) {
    structures.push('article');
  }

  return structures;
}

/**
 * Find table structures
 */
function findTableStructures(html: string): string[] {
  const structures: string[] = [];

  if (/<table[^>]*>[\s\S]*?<tr/i.test(html)) {
    structures.push('table > tbody > tr');
  }

  return structures;
}

/**
 * Find data attributes that might contain booth info
 */
function findDataAttributes(html: string): string[] {
  const dataAttrRegex = /data-([a-z-]+)=/gi;
  const attrs = new Set<string>();

  let match;
  while ((match = dataAttrRegex.exec(html)) !== null) {
    attrs.add(`data-${match[1]}`);
  }

  return Array.from(attrs);
}

/**
 * Learn pattern for a specific field
 */
function learnPatternForField(
  fieldName: string,
  analysis: HtmlAnalysis,
  booths: BoothData[]
): LearnedPattern | null {
  // Get all non-null values for this field from extracted booths
  const fieldValues = booths
    .map(booth => (booth as any)[fieldName])
    .filter(val => val != null && val !== '');

  if (fieldValues.length === 0) {
    return null; // No values to learn from
  }

  // For city guides and blogs, patterns are often unique per page
  // So we use heuristics based on common HTML structures

  const pattern = inferPatternFromFieldType(fieldName, analysis, fieldValues);

  return pattern;
}

/**
 * Infer pattern based on field type and HTML structure
 */
function inferPatternFromFieldType(
  fieldName: string,
  analysis: HtmlAnalysis,
  values: any[]
): LearnedPattern | null {
  // Field-specific pattern inference
  switch (fieldName) {
    case 'name':
      return {
        field_name: 'name',
        pattern_type: 'css_selector',
        selector: inferNameSelector(analysis),
        fallback_selectors: ['h1', 'h2', 'h3', '.title', '.name', '[data-name]'],
        extraction_method: 'text',
        required: true,
        confidence_score: 0.7
      };

    case 'address':
      return {
        field_name: 'address',
        pattern_type: 'css_selector',
        selector: inferAddressSelector(analysis),
        fallback_selectors: ['.address', '[itemprop="address"]', '.location', 'address'],
        extraction_method: 'text',
        required: true,
        confidence_score: 0.6
      };

    case 'city':
      return {
        field_name: 'city',
        pattern_type: 'css_selector',
        selector: '.city',
        fallback_selectors: ['[data-city]', '.location-city', '[itemprop="addressLocality"]'],
        extraction_method: 'text',
        required: false,
        confidence_score: 0.5
      };

    case 'cost':
      return {
        field_name: 'cost',
        pattern_type: 'regex',
        selector: '\\$\\d+(?:\\.\\d{2})?|€\\d+|£\\d+',
        extraction_method: 'text',
        required: false,
        confidence_score: 0.6
      };

    case 'description':
      return {
        field_name: 'description',
        pattern_type: 'css_selector',
        selector: inferDescriptionSelector(analysis),
        fallback_selectors: ['.description', 'p', '.content', '[itemprop="description"]'],
        extraction_method: 'text',
        required: false,
        confidence_score: 0.5
      };

    default:
      return null;
  }
}

/**
 * Infer selector for booth name
 */
function inferNameSelector(analysis: HtmlAnalysis): string {
  // Priority: h1 > h2 > h3 > .title > .name
  if (analysis.commonTags.includes('article')) {
    return 'article h1, article h2, article h3';
  }
  return 'h1, h2, .title, .name';
}

/**
 * Infer selector for address
 */
function inferAddressSelector(analysis: HtmlAnalysis): string {
  // Look for semantic address tag or common classes
  return 'address, .address, [itemprop="address"], .location, .venue-address';
}

/**
 * Infer selector for description
 */
function inferDescriptionSelector(analysis: HtmlAnalysis): string {
  if (analysis.commonTags.includes('article')) {
    return 'article p';
  }
  return 'p, .description, .content, .text';
}

/**
 * Store learned patterns in database
 */
async function storePatternsInDatabase(
  supabase: any,
  sourceId: string,
  agentRunId: string,
  patterns: LearnedPattern[]
): Promise<void> {
  const records = patterns.map(pattern => ({
    source_id: sourceId,
    pattern_type: pattern.pattern_type,
    field_name: pattern.field_name,
    selector: pattern.selector,
    fallback_selectors: pattern.fallback_selectors || null,
    extraction_method: pattern.extraction_method,
    extraction_args: pattern.extraction_args ? JSON.stringify(pattern.extraction_args) : null,
    validation_regex: pattern.validation_regex || null,
    required: pattern.required,
    transform_fn: pattern.transform_fn || null,
    confidence_score: pattern.confidence_score,
    learned_from_agent_run_id: agentRunId,
    learned_at: new Date().toISOString(),
    is_active: true
  }));

  const { error } = await supabase
    .from('extraction_patterns')
    .upsert(records, {
      onConflict: 'source_id,field_name,selector',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Failed to store patterns:', error);
    throw error;
  }
}

/**
 * Retrieve active patterns for a source
 */
export async function getActivePatternsForSource(
  supabase: any,
  sourceId: string
): Promise<LearnedPattern[]> {
  const { data, error } = await supabase
    .rpc('get_active_patterns_for_source', { p_source_id: sourceId });

  if (error) {
    console.error('Failed to retrieve patterns:', error);
    return [];
  }

  return data || [];
}

/**
 * Validate pattern against extracted data
 */
export async function validatePattern(
  supabase: any,
  patternId: string,
  crawlRunId: string,
  extractedValue: string | null,
  success: boolean,
  sourceUrl: string,
  htmlSnippet: string,
  extractionTimeMs: number
): Promise<void> {
  const { error } = await supabase
    .from('extraction_validations')
    .insert({
      pattern_id: patternId,
      crawl_run_id: crawlRunId,
      success,
      extracted_value: extractedValue,
      validation_error: success ? null : 'Extraction failed',
      extraction_time_ms: extractionTimeMs,
      source_url: sourceUrl,
      html_snippet: htmlSnippet.substring(0, 500),
      validated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to log pattern validation:', error);
  }
}
