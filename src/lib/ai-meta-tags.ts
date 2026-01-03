/**
 * AI Meta Tags Utility Library
 *
 * Generates AI-specific meta tags to help language models and AI crawlers
 * better understand and surface your content.
 *
 * Based on AI SEO Playbook v1.0
 * Last Updated: 2026-01-02
 */

/**
 * Content structure types that define how content is organized
 */
export type ContentStructure =
  | 'educational-guide'
  | 'faq-format'
  | 'how-to-guide'
  | 'comparison-analysis'
  | 'reference'
  | 'article'
  | 'directory'
  | 'documentation';

/**
 * Expertise level of the content
 */
export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Perspective or domain from which content is presented
 */
export type Perspective =
  | 'clinical-psychology'
  | 'technical'
  | 'business'
  | 'educational'
  | 'commercial'
  | 'personal'
  | 'industry'
  | 'academic';

/**
 * Authority level of the content creator/source
 */
export type Authority =
  | 'licensed-professional'
  | 'evidence-based-research'
  | 'industry-expert'
  | 'enthusiast'
  | 'community'
  | 'certified-specialist';

/**
 * Configuration object for generating AI meta tags
 */
export interface AIMetaTagsConfig {
  /**
   * One-sentence summary of the page content (40-60 words ideal)
   * Should directly answer the main question or describe the core value
   *
   * @example "Comprehensive directory of art galleries and exhibition spaces in Austin, Texas, with locations, hours, and upcoming events."
   */
  summary: string;

  /**
   * Array of key concepts, terms, or topics covered in the content
   * These help AI understand the main themes and relationships
   *
   * @example ["art galleries", "Austin Texas", "exhibitions", "gallery directory", "art events"]
   */
  keyConcepts: string[];

  /**
   * Type of content structure used on the page
   * Helps AI understand how to parse and present the information
   *
   * @example "directory"
   */
  contentStructure: ContentStructure;

  /**
   * Target expertise level of the content
   * Indicates the assumed knowledge level of the reader
   *
   * @example "beginner"
   */
  expertiseLevel: ExpertiseLevel;

  /**
   * Perspective or domain lens through which content is presented
   * Helps AI understand the context and approach
   *
   * @example "commercial"
   */
  perspective: Perspective;

  /**
   * Authority level of the content creator or source
   * Signals trustworthiness and expertise to AI systems
   *
   * @example "industry-expert"
   */
  authority: Authority;
}

/**
 * Return type for generated AI meta tags
 * Key-value pairs ready to be inserted as meta tags
 */
export interface AIMetaTags {
  'AI:summary': string;
  'AI:key-concepts': string;
  'AI:content-structure': ContentStructure;
  'AI:expertise-level': ExpertiseLevel;
  'AI:perspective': Perspective;
  'AI:authority': Authority;
}

/**
 * Generates AI-specific meta tags based on content configuration
 *
 * These meta tags help AI systems (ChatGPT, Claude, Perplexity, etc.)
 * better understand, index, and surface your content in responses.
 *
 * @param config - Configuration object with content metadata
 * @returns Object with AI meta tag names and values
 *
 * @example
 * ```tsx
 * import { generateAIMetaTags } from '@/lib/ai-meta-tags';
 *
 * const aiTags = generateAIMetaTags({
 *   summary: "Comprehensive guide to art galleries in Austin, Texas",
 *   keyConcepts: ["art galleries", "Austin", "exhibitions", "art events"],
 *   contentStructure: "directory",
 *   expertiseLevel: "beginner",
 *   perspective: "commercial",
 *   authority: "industry-expert"
 * });
 *
 * // In your component
 * <Helmet>
 *   {Object.entries(aiTags).map(([name, content]) => (
 *     <meta key={name} name={name} content={content} />
 *   ))}
 * </Helmet>
 * ```
 */
export const generateAIMetaTags = (config: AIMetaTagsConfig): AIMetaTags => {
  // Validate that keyConcepts is not empty
  if (!config.keyConcepts || config.keyConcepts.length === 0) {
    console.warn('AIMetaTags: keyConcepts array is empty. Consider adding key concepts for better AI understanding.');
  }

  // Validate summary length (recommend 40-60 words for featured snippets)
  const wordCount = config.summary.trim().split(/\s+/).length;
  if (wordCount < 30) {
    console.warn(`AIMetaTags: Summary is short (${wordCount} words). Consider 40-60 words for optimal AI parsing.`);
  } else if (wordCount > 80) {
    console.warn(`AIMetaTags: Summary is long (${wordCount} words). Consider shortening to 40-60 words for better AI parsing.`);
  }

  return {
    'AI:summary': config.summary,
    'AI:key-concepts': config.keyConcepts.join(', '),
    'AI:content-structure': config.contentStructure,
    'AI:expertise-level': config.expertiseLevel,
    'AI:perspective': config.perspective,
    'AI:authority': config.authority,
  };
};

/**
 * Content freshness signals configuration
 */
export interface ContentFreshnessConfig {
  /**
   * ISO 8601 date string when content was originally published
   * @example "2026-01-02T08:00:00Z"
   */
  publishedDate: string;

  /**
   * ISO 8601 date string when content was last modified
   * @example "2026-01-02T15:30:00Z"
   */
  modifiedDate?: string;

  /**
   * Human-readable revision date (YYYY-MM-DD format)
   * @example "2026-01-02"
   */
  revisedDate?: string;
}

/**
 * Generates content freshness meta tags
 *
 * Freshness signals help AI systems understand content recency and updates.
 * This is particularly important for time-sensitive content.
 *
 * @param config - Configuration with publication and modification dates
 * @returns Object with freshness meta tag names and values
 *
 * @example
 * ```tsx
 * import { generateContentFreshnessSignals } from '@/lib/ai-meta-tags';
 *
 * const freshness = generateContentFreshnessSignals({
 *   publishedDate: "2026-01-02T08:00:00Z",
 *   modifiedDate: new Date().toISOString(),
 *   revisedDate: "2026-01-02"
 * });
 *
 * // In your component
 * <Helmet>
 *   {Object.entries(freshness).map(([property, content]) => (
 *     <meta key={property} property={property} content={content} />
 *   ))}
 * </Helmet>
 * ```
 */
export const generateContentFreshnessSignals = (
  config: ContentFreshnessConfig
): Record<string, string> => {
  const signals: Record<string, string> = {
    'article:published_time': config.publishedDate,
  };

  if (config.modifiedDate) {
    signals['article:modified_time'] = config.modifiedDate;
  }

  if (config.revisedDate) {
    signals['revised'] = config.revisedDate;
  }

  return signals;
};

/**
 * Helper function to generate all AI optimization meta tags at once
 *
 * Combines AI meta tags and freshness signals for convenience.
 *
 * @param aiConfig - AI meta tags configuration
 * @param freshnessConfig - Content freshness configuration
 * @returns Combined object with all meta tags
 *
 * @example
 * ```tsx
 * import { generateAllAIMetaTags } from '@/lib/ai-meta-tags';
 *
 * const allTags = generateAllAIMetaTags(
 *   {
 *     summary: "Guide to Austin art galleries",
 *     keyConcepts: ["art", "galleries", "Austin"],
 *     contentStructure: "directory",
 *     expertiseLevel: "beginner",
 *     perspective: "commercial",
 *     authority: "industry-expert"
 *   },
 *   {
 *     publishedDate: "2026-01-02T08:00:00Z",
 *     modifiedDate: new Date().toISOString()
 *   }
 * );
 * ```
 */
export const generateAllAIMetaTags = (
  aiConfig: AIMetaTagsConfig,
  freshnessConfig: ContentFreshnessConfig
): Record<string, string> => {
  const aiTags = generateAIMetaTags(aiConfig);
  const freshnessTags = generateContentFreshnessSignals(freshnessConfig);

  // Convert AI tags to Record<string, string> for consistency
  const aiTagsRecord: Record<string, string> = Object.entries(aiTags).reduce(
    (acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    },
    {} as Record<string, string>
  );

  return {
    ...aiTagsRecord,
    ...freshnessTags,
  };
};

/**
 * Type guard to check if a value is a valid ContentStructure
 */
export const isContentStructure = (value: string): value is ContentStructure => {
  return [
    'educational-guide',
    'faq-format',
    'how-to-guide',
    'comparison-analysis',
    'reference',
    'article',
    'directory',
    'documentation',
  ].includes(value);
};

/**
 * Type guard to check if a value is a valid ExpertiseLevel
 */
export const isExpertiseLevel = (value: string): value is ExpertiseLevel => {
  return ['beginner', 'intermediate', 'advanced'].includes(value);
};

/**
 * Type guard to check if a value is a valid Perspective
 */
export const isPerspective = (value: string): value is Perspective => {
  return [
    'clinical-psychology',
    'technical',
    'business',
    'educational',
    'commercial',
    'personal',
    'industry',
    'academic',
  ].includes(value);
};

/**
 * Type guard to check if a value is a valid Authority
 */
export const isAuthority = (value: string): value is Authority => {
  return [
    'licensed-professional',
    'evidence-based-research',
    'industry-expert',
    'enthusiast',
    'community',
    'certified-specialist',
  ].includes(value);
};
