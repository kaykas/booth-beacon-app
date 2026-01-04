/**
 * Direct Scraper Module for Hybrid Crawler
 *
 * Uses learned patterns (CSS selectors, XPath, regex) to extract booth data
 * directly from HTML without using expensive AI Agent mode.
 *
 * Cost Comparison:
 * - Agent mode: ~200-400 Firecrawl credits (~$0.20-$0.40 per source)
 * - Direct mode: ~1-5 Firecrawl credits (~$0.001-$0.005 per source)
 *
 * Performance:
 * - Agent mode: 100-200+ seconds per source
 * - Direct mode: 5-15 seconds per source
 *
 * Strategy:
 * 1. Fetch page with Firecrawl in direct mode (cheap)
 * 2. Apply learned CSS selectors to extract booth data
 * 3. Validate extracted data against patterns
 * 4. Return structured booth data
 */

import { BoothData, ExtractorResult } from "./extractors.ts";
import { LearnedPattern, validatePattern } from "./pattern-learning.ts";

export interface DirectScraperConfig {
  source_id: string;
  source_name: string;
  patterns: LearnedPattern[];
  supabase: any;
  crawl_run_id?: string;
}

export interface DirectScraperResult extends ExtractorResult {
  patterns_used: number;
  patterns_successful: number;
  patterns_failed: number;
  scraping_mode: 'direct';
}

/**
 * Extract booth data using direct scraping with learned patterns
 */
export async function extractWithDirectScraping(
  html: string,
  markdown: string,
  sourceUrl: string,
  config: DirectScraperConfig
): Promise<DirectScraperResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const errors: string[] = [];
  const patterns = config.patterns;

  console.log(`🎯 Direct scraping ${config.source_name} with ${patterns.length} patterns...`);

  try {
    // Parse HTML into DOM-like structure
    const document = parseHtmlToDocument(html);

    // Find booth containers (lists, articles, cards)
    const boothContainers = findBoothContainers(document);

    console.log(`Found ${boothContainers.length} potential booth containers`);

    // Extract data from each container
    for (const container of boothContainers) {
      const booth = extractBoothFromContainer(container, patterns, config);

      if (booth && isValidBooth(booth)) {
        booths.push(booth);
      }
    }

    // Validate patterns used
    let patternsSuccessful = 0;
    let patternsFailed = 0;

    for (const pattern of patterns) {
      const extracted = booths.some(booth => (booth as any)[pattern.field_name] != null);

      if (extracted) {
        patternsSuccessful++;

        // Log successful pattern validation
        if (config.crawl_run_id) {
          await validatePattern(
            config.supabase,
            pattern.field_name, // Use field_name as proxy for pattern_id
            config.crawl_run_id,
            'success',
            true,
            sourceUrl,
            html.substring(0, 500),
            Date.now() - startTime
          );
        }
      } else {
        patternsFailed++;
      }
    }

    console.log(`✅ Direct scraping found ${booths.length} booths (${patternsSuccessful}/${patterns.length} patterns successful)`);

    return {
      booths,
      errors,
      extraction_time_ms: Date.now() - startTime,
      patterns_used: patterns.length,
      patterns_successful: patternsSuccessful,
      patterns_failed: patternsFailed,
      scraping_mode: 'direct'
    };

  } catch (error) {
    console.error('Direct scraping error:', error);
    return {
      booths: [],
      errors: [error instanceof Error ? error.message : String(error)],
      extraction_time_ms: Date.now() - startTime,
      patterns_used: patterns.length,
      patterns_successful: 0,
      patterns_failed: patterns.length,
      scraping_mode: 'direct'
    };
  }
}

/**
 * Simple HTML parser for Deno environment
 * Creates a minimal DOM-like structure
 */
interface SimpleElement {
  tagName: string;
  attributes: Record<string, string>;
  textContent: string;
  innerHTML: string;
  children: SimpleElement[];
  querySelector: (selector: string) => SimpleElement | null;
  querySelectorAll: (selector: string) => SimpleElement[];
}

function parseHtmlToDocument(html: string): SimpleElement {
  // This is a simplified parser - in production, use a proper HTML parser
  // For Deno, we can use: https://deno.land/x/deno_dom

  return {
    tagName: 'document',
    attributes: {},
    textContent: html,
    innerHTML: html,
    children: [],
    querySelector: (selector: string) => {
      return querySelectorSimple(html, selector);
    },
    querySelectorAll: (selector: string) => {
      return querySelectorAllSimple(html, selector);
    }
  };
}

/**
 * Simple CSS selector implementation using regex
 * Supports: .class, #id, tag, [attr], [attr="value"]
 */
function querySelectorSimple(html: string, selector: string): SimpleElement | null {
  const results = querySelectorAllSimple(html, selector);
  return results.length > 0 ? results[0] : null;
}

function querySelectorAllSimple(html: string, selector: string): SimpleElement[] {
  const elements: SimpleElement[] = [];

  // Parse selector type
  if (selector.startsWith('.')) {
    // Class selector
    const className = selector.substring(1);
    const regex = new RegExp(`<[^>]+class=["\'][^"\']*\\b${className}\\b[^"\']*["\'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      elements.push(createSimpleElement('div', {}, match[1], match[0]));
    }
  } else if (selector.startsWith('#')) {
    // ID selector
    const id = selector.substring(1);
    const regex = new RegExp(`<[^>]+id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i');
    const match = regex.exec(html);
    if (match) {
      elements.push(createSimpleElement('div', {}, match[1], match[0]));
    }
  } else if (selector.startsWith('[')) {
    // Attribute selector
    const attrMatch = selector.match(/\[([^=\]]+)(?:=["']([^"']+)["'])?\]/);
    if (attrMatch) {
      const attrName = attrMatch[1];
      const attrValue = attrMatch[2];
      const regex = attrValue
        ? new RegExp(`<[^>]+${attrName}=["']${attrValue}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'gi')
        : new RegExp(`<[^>]+${attrName}=["\'][^"\']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'gi');

      let match;
      while ((match = regex.exec(html)) !== null) {
        elements.push(createSimpleElement('div', {}, match[1], match[0]));
      }
    }
  } else {
    // Tag selector
    const regex = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      elements.push(createSimpleElement(selector, {}, match[1], match[0]));
    }
  }

  return elements;
}

function createSimpleElement(
  tagName: string,
  attributes: Record<string, string>,
  textContent: string,
  innerHTML: string
): SimpleElement {
  return {
    tagName,
    attributes,
    textContent: textContent.replace(/<[^>]+>/g, '').trim(),
    innerHTML,
    children: [],
    querySelector: (selector: string) => querySelectorSimple(innerHTML, selector),
    querySelectorAll: (selector: string) => querySelectorAllSimple(innerHTML, selector)
  };
}

/**
 * Find potential booth containers in HTML
 */
function findBoothContainers(document: SimpleElement): SimpleElement[] {
  const containers: SimpleElement[] = [];

  // Try common container patterns
  const selectors = [
    'article',
    'li',
    '.card',
    '.item',
    '.listing',
    '.booth',
    '.location',
    '[data-booth]',
    '[data-location]'
  ];

  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    if (found.length >= 2) {
      // If we find 2+ elements with this selector, likely a list
      containers.push(...found);
      break; // Use first matching pattern
    }
  }

  // If no containers found, treat entire document as single booth
  if (containers.length === 0) {
    containers.push(document);
  }

  return containers;
}

/**
 * Extract booth data from a container using patterns
 */
function extractBoothFromContainer(
  container: SimpleElement,
  patterns: LearnedPattern[],
  config: DirectScraperConfig
): BoothData | null {
  const booth: Partial<BoothData> = {
    source: config.source_name
  };

  let extractedFields = 0;

  // Apply each pattern
  for (const pattern of patterns) {
    try {
      const value = extractValueWithPattern(container, pattern);

      if (value != null && value !== '') {
        (booth as any)[pattern.field_name] = value;
        extractedFields++;
      }
    } catch (error) {
      console.error(`Pattern extraction error for ${pattern.field_name}:`, error);
    }
  }

  // Must extract at least name and address to be valid
  if (!booth.name || !booth.address) {
    return null;
  }

  return booth as BoothData;
}

/**
 * Extract value using a learned pattern
 */
function extractValueWithPattern(
  container: SimpleElement,
  pattern: LearnedPattern
): string | null {
  // Try primary selector
  let value = tryExtractWithSelector(container, pattern.selector, pattern.extraction_method, pattern.extraction_args);

  // Try fallback selectors if primary fails
  if (!value && pattern.fallback_selectors) {
    for (const fallbackSelector of pattern.fallback_selectors) {
      value = tryExtractWithSelector(container, fallbackSelector, pattern.extraction_method, pattern.extraction_args);
      if (value) break;
    }
  }

  // Validate with regex if specified
  if (value && pattern.validation_regex) {
    const regex = new RegExp(pattern.validation_regex);
    if (!regex.test(value)) {
      return null; // Validation failed
    }
  }

  // Apply transformation if specified
  if (value && pattern.transform_fn) {
    value = applyTransform(value, pattern.transform_fn);
  }

  return value;
}

/**
 * Try to extract value with a specific selector
 */
function tryExtractWithSelector(
  container: SimpleElement,
  selector: string,
  method: string,
  args?: Record<string, any>
): string | null {
  if (selector === '') return null;

  try {
    const element = container.querySelector(selector);
    if (!element) return null;

    switch (method) {
      case 'text':
        return element.textContent;
      case 'attr':
        return args?.attr ? element.attributes[args.attr] : null;
      case 'html':
        return element.innerHTML;
      default:
        return element.textContent;
    }
  } catch {
    return null;
  }
}

/**
 * Apply transformation function to extracted value
 */
function applyTransform(value: string, transformFn: string): string {
  switch (transformFn) {
    case 'trim':
      return value.trim();
    case 'lowercase':
      return value.toLowerCase();
    case 'uppercase':
      return value.toUpperCase();
    case 'remove_extra_spaces':
      return value.replace(/\s+/g, ' ').trim();
    default:
      return value;
  }
}

/**
 * Validate that booth has minimum required fields
 */
function isValidBooth(booth: BoothData): boolean {
  return !!(
    booth.name &&
    booth.address &&
    booth.name !== '' &&
    booth.address !== '' &&
    booth.name !== 'N/A'
  );
}

/**
 * Calculate confidence score for direct scraping result
 * Based on number of fields extracted and pattern success rate
 */
export function calculateDirectScrapingConfidence(
  result: DirectScraperResult,
  expectedBoothCount: number
): number {
  const boothCountScore = Math.min(result.booths.length / Math.max(expectedBoothCount, 1), 1);
  const patternSuccessScore = result.patterns_successful / Math.max(result.patterns_used, 1);

  return (boothCountScore * 0.6 + patternSuccessScore * 0.4);
}
