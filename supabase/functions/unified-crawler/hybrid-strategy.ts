/**
 * Hybrid Strategy Module for Intelligent Crawler Mode Selection
 *
 * Decides when to use:
 * - Agent mode (expensive, slow, but reliable)
 * - Direct mode (cheap, fast, but requires learned patterns)
 * - Hybrid mode (try direct first, fallback to Agent)
 *
 * Decision Factors:
 * 1. Has source been crawled before? (pattern learning status)
 * 2. Do we have high-confidence patterns?
 * 3. Is this the first crawl or a refresh?
 * 4. What's the source type (directory vs blog)?
 * 5. How old are the patterns?
 */

import { ExtractorResult } from "./extractors.ts";
import {
  extractWithDirectScraping,
  DirectScraperResult,
  calculateDirectScrapingConfidence
} from "./direct-scraper.ts";
import { extractWithAI, AIExtractionConfig } from "./ai-extraction-engine.ts";
import {
  learnPatternsFromAgentRun,
  getActivePatternsForSource
} from "./pattern-learning.ts";

export type CrawlMode = 'agent' | 'direct' | 'hybrid';

export interface HybridStrategyConfig {
  source_id: string;
  source_name: string;
  source_type: 'directory' | 'city_guide' | 'blog' | 'community' | 'operator';
  extraction_mode: CrawlMode;
  pattern_learning_status: string;
  pattern_learned_at: string | null;
  anthropic_api_key: string;
  supabase: any;
  crawl_run_id?: string;
  force_mode?: CrawlMode; // Override decision logic
  onProgress?: (event: any) => void;
}

export interface HybridExtractionResult extends ExtractorResult {
  mode_used: CrawlMode;
  mode_decision_reason: string;
  direct_scraping_attempted: boolean;
  direct_scraping_confidence?: number;
  fallback_to_agent: boolean;
  patterns_used?: number;
  patterns_successful?: number;
  agent_run_id?: string;
  pattern_learning_triggered: boolean;
}

/**
 * Main hybrid extraction entry point
 * Intelligently chooses extraction mode and handles fallback
 */
export async function extractWithHybridStrategy(
  html: string,
  markdown: string,
  sourceUrl: string,
  config: HybridStrategyConfig
): Promise<HybridExtractionResult> {
  console.log(`🎯 Hybrid strategy for ${config.source_name}...`);

  // Force mode if specified (useful for testing)
  if (config.force_mode) {
    return await executeWithMode(html, markdown, sourceUrl, config, config.force_mode);
  }

  // Decide mode based on strategy
  const mode = await decideExtractionMode(config);

  return await executeWithMode(html, markdown, sourceUrl, config, mode);
}

/**
 * Decide which extraction mode to use
 */
async function decideExtractionMode(config: HybridStrategyConfig): Promise<CrawlMode> {
  // If extraction_mode is 'agent', always use agent
  if (config.extraction_mode === 'agent') {
    return 'agent';
  }

  // If extraction_mode is 'direct' and patterns exist, use direct
  if (config.extraction_mode === 'direct') {
    const patterns = await getActivePatternsForSource(config.supabase, config.source_id);
    if (patterns.length > 0) {
      return 'direct';
    } else {
      // No patterns yet, must use agent first
      return 'agent';
    }
  }

  // Hybrid mode (default): intelligent decision
  if (config.extraction_mode === 'hybrid') {
    return await decideHybridMode(config);
  }

  // Default: agent
  return 'agent';
}

/**
 * Intelligent hybrid mode decision
 */
async function decideHybridMode(config: HybridStrategyConfig): Promise<CrawlMode> {
  // Check if patterns exist
  const patterns = await getActivePatternsForSource(config.supabase, config.source_id);

  // No patterns learned yet? Must use agent first
  if (config.pattern_learning_status === 'not_started' || patterns.length === 0) {
    console.log(`📊 Decision: AGENT (no patterns learned yet)`);
    return 'agent';
  }

  // Check pattern quality
  const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence_score, 0) / patterns.length;

  // Low confidence patterns? Use agent
  if (avgConfidence < 0.5) {
    console.log(`📊 Decision: AGENT (low pattern confidence: ${avgConfidence.toFixed(2)})`);
    return 'agent';
  }

  // Check pattern age
  if (config.pattern_learned_at) {
    const patternAge = Date.now() - new Date(config.pattern_learned_at).getTime();
    const ageInDays = patternAge / (1000 * 60 * 60 * 24);

    // Patterns older than 90 days? Refresh with agent
    if (ageInDays > 90) {
      console.log(`📊 Decision: AGENT (patterns too old: ${ageInDays.toFixed(0)} days)`);
      return 'agent';
    }
  }

  // Required fields covered?
  const hasNamePattern = patterns.some(p => p.field_name === 'name');
  const hasAddressPattern = patterns.some(p => p.field_name === 'address');

  if (!hasNamePattern || !hasAddressPattern) {
    console.log(`📊 Decision: AGENT (missing required field patterns)`);
    return 'agent';
  }

  // All checks passed: use direct scraping
  console.log(`📊 Decision: DIRECT (${patterns.length} patterns, avg confidence: ${avgConfidence.toFixed(2)})`);
  return 'direct';
}

/**
 * Execute extraction with specified mode
 */
async function executeWithMode(
  html: string,
  markdown: string,
  sourceUrl: string,
  config: HybridStrategyConfig,
  mode: CrawlMode
): Promise<HybridExtractionResult> {
  if (mode === 'agent') {
    return await executeAgentMode(html, markdown, sourceUrl, config);
  } else if (mode === 'direct') {
    return await executeDirectMode(html, markdown, sourceUrl, config);
  } else {
    // Hybrid: try direct first, fallback to agent
    return await executeHybridMode(html, markdown, sourceUrl, config);
  }
}

/**
 * Execute Agent mode (AI extraction)
 */
async function executeAgentMode(
  html: string,
  markdown: string,
  sourceUrl: string,
  config: HybridStrategyConfig
): Promise<HybridExtractionResult> {
  console.log(`🤖 Using AGENT mode for ${config.source_name}`);

  const aiConfig: AIExtractionConfig = {
    source_name: config.source_name,
    source_type: config.source_type,
    priority: 'high',
    extraction_strategy: 'comprehensive',
    anthropic_api_key: config.anthropic_api_key
  };

  const result = await extractWithAI(html, markdown, sourceUrl, aiConfig, config.onProgress);

  // Learn patterns from successful agent run
  let patternLearningTriggered = false;
  if (result.booths.length > 0 && config.pattern_learning_status !== 'completed') {
    console.log(`🧠 Triggering pattern learning from agent results...`);
    const agentRunId = config.crawl_run_id || generateRunId();

    await learnPatternsFromAgentRun(
      html,
      result.booths,
      config.source_id,
      config.source_name,
      agentRunId,
      config.supabase
    );

    patternLearningTriggered = true;
  }

  return {
    ...result,
    mode_used: 'agent',
    mode_decision_reason: 'Agent mode explicitly selected or required',
    direct_scraping_attempted: false,
    fallback_to_agent: false,
    pattern_learning_triggered: patternLearningTriggered
  };
}

/**
 * Execute Direct mode (pattern-based extraction)
 */
async function executeDirectMode(
  html: string,
  markdown: string,
  sourceUrl: string,
  config: HybridStrategyConfig
): Promise<HybridExtractionResult> {
  console.log(`⚡ Using DIRECT mode for ${config.source_name}`);

  // Get patterns
  const patterns = await getActivePatternsForSource(config.supabase, config.source_id);

  if (patterns.length === 0) {
    // No patterns available, must fallback to agent
    console.log(`⚠️ No patterns found, falling back to agent mode`);
    return await executeAgentMode(html, markdown, sourceUrl, config);
  }

  // Execute direct scraping
  const result = await extractWithDirectScraping(html, markdown, sourceUrl, {
    source_id: config.source_id,
    source_name: config.source_name,
    patterns,
    supabase: config.supabase,
    crawl_run_id: config.crawl_run_id
  });

  // Calculate confidence
  const confidence = calculateDirectScrapingConfidence(result, 5); // Expect ~5 booths avg

  return {
    booths: result.booths,
    errors: result.errors,
    extraction_time_ms: result.extraction_time_ms,
    mode_used: 'direct',
    mode_decision_reason: `Direct scraping with ${patterns.length} learned patterns`,
    direct_scraping_attempted: true,
    direct_scraping_confidence: confidence,
    fallback_to_agent: false,
    patterns_used: result.patterns_used,
    patterns_successful: result.patterns_successful,
    pattern_learning_triggered: false
  };
}

/**
 * Execute Hybrid mode (try direct, fallback to agent)
 */
async function executeHybridMode(
  html: string,
  markdown: string,
  sourceUrl: string,
  config: HybridStrategyConfig
): Promise<HybridExtractionResult> {
  console.log(`🔄 Using HYBRID mode for ${config.source_name}`);

  // Try direct first
  const directResult = await executeDirectMode(html, markdown, sourceUrl, config);

  // Check if direct scraping was successful
  const confidence = directResult.direct_scraping_confidence || 0;
  const boothCount = directResult.booths.length;

  // Fallback criteria:
  // - No booths found, OR
  // - Low confidence (< 0.4), OR
  // - Very few booths (< 2) when we expect more
  const shouldFallback = boothCount === 0 || confidence < 0.4 || (boothCount < 2 && config.source_type !== 'blog');

  if (shouldFallback) {
    console.log(`⚠️ Direct scraping underperformed (${boothCount} booths, ${confidence.toFixed(2)} confidence), falling back to agent`);

    // Fallback to agent
    const agentResult = await executeAgentMode(html, markdown, sourceUrl, config);

    return {
      ...agentResult,
      mode_decision_reason: `Direct scraping failed (${boothCount} booths, ${confidence.toFixed(2)} confidence), fallback to agent`,
      direct_scraping_attempted: true,
      direct_scraping_confidence: confidence,
      fallback_to_agent: true,
      patterns_used: directResult.patterns_used,
      patterns_successful: directResult.patterns_successful
    };
  }

  // Direct scraping succeeded
  console.log(`✅ Direct scraping succeeded (${boothCount} booths, ${confidence.toFixed(2)} confidence)`);

  return {
    ...directResult,
    mode_decision_reason: `Direct scraping succeeded (${boothCount} booths, ${confidence.toFixed(2)} confidence)`
  };
}

/**
 * Generate unique run ID
 */
function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Get hybrid strategy statistics for dashboard
 */
export async function getHybridStrategyStats(supabase: any): Promise<HybridStrategyDashboard> {
  // Query pattern health dashboard
  const { data: healthData, error: healthError } = await supabase
    .from('pattern_health_dashboard')
    .select('*');

  if (healthError) {
    console.error('Failed to get strategy stats:', healthError);
    return getEmptyDashboard();
  }

  // Aggregate stats
  const totalSources = healthData.length;
  const sourcesWithPatterns = healthData.filter((s: any) => s.active_patterns > 0).length;
  const directEnabled = healthData.filter((s: any) => s.direct_scraping_enabled).length;
  const agentOnly = healthData.filter((s: any) => s.extraction_mode === 'agent').length;
  const hybridMode = healthData.filter((s: any) => s.extraction_mode === 'hybrid').length;

  const totalPatterns = healthData.reduce((sum: number, s: any) => sum + (s.total_patterns || 0), 0);
  const activePatterns = healthData.reduce((sum: number, s: any) => sum + (s.active_patterns || 0), 0);
  const avgConfidence = healthData.reduce((sum: number, s: any) => sum + (s.avg_confidence || 0), 0) / Math.max(totalSources, 1);

  return {
    total_sources: totalSources,
    sources_with_patterns: sourcesWithPatterns,
    direct_enabled: directEnabled,
    agent_only: agentOnly,
    hybrid_mode: hybridMode,
    total_patterns: totalPatterns,
    active_patterns: activePatterns,
    avg_pattern_confidence: avgConfidence,
    estimated_monthly_savings_usd: calculateEstimatedSavings(directEnabled, totalSources)
  };
}

interface HybridStrategyDashboard {
  total_sources: number;
  sources_with_patterns: number;
  direct_enabled: number;
  agent_only: number;
  hybrid_mode: number;
  total_patterns: number;
  active_patterns: number;
  avg_pattern_confidence: number;
  estimated_monthly_savings_usd: number;
}

function getEmptyDashboard(): HybridStrategyDashboard {
  return {
    total_sources: 0,
    sources_with_patterns: 0,
    direct_enabled: 0,
    agent_only: 0,
    hybrid_mode: 0,
    total_patterns: 0,
    active_patterns: 0,
    avg_pattern_confidence: 0,
    estimated_monthly_savings_usd: 0
  };
}

function calculateEstimatedSavings(directEnabled: number, totalSources: number): number {
  // Agent mode: $0.30/source, Direct mode: $0.005/source
  // Assume 4 crawls per month
  const agentCost = totalSources * 0.30 * 4;
  const hybridCost = (totalSources - directEnabled) * 0.30 * 4 + directEnabled * 0.005 * 4;
  const savings = agentCost - hybridCost;

  return Math.max(savings, 0);
}
