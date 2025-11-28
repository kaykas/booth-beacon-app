/**
 * CRAWLER UTILITIES
 *
 * Comprehensive utilities for logging, retry logic, content hashing,
 * and idempotency checks.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import type {
  TypedSupabaseClient,
  UnknownRecord,
  ErrorWithMessage,
} from "./types";
import { toError } from "./types";

// ========================================
// TYPES
// ========================================

export interface CrawlLogger {
  sessionId: string;
  sourceId: string;
  sourceName: string;
  supabase: TypedSupabaseClient;

  logOperation: (
    operationType: string,
    operationStatus: string,
    metrics?: Partial<LogMetrics>,
    error?: ErrorWithMessage
  ) => Promise<void>;

  logBatch: (
    batchNumber: number,
    operationType: string,
    operationStatus: string,
    metrics?: Partial<LogMetrics>
  ) => Promise<void>;

  logError: (error: ErrorWithMessage, context?: UnknownRecord) => Promise<void>;
}

export interface LogMetrics {
  pages_crawled: number;
  booths_extracted: number;
  booths_validated: number;
  booths_deduplicated: number;
  booths_upserted: number;
  urls_processed: string[];
  content_hash?: string;
  metadata?: UnknownRecord;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  exponentialBackoff: boolean;
  shouldRetry?: (error: ErrorWithMessage) => boolean;
}

export interface ContentHash {
  hash: string;
  algorithm: string;
  timestamp: string;
}

// ========================================
// LOGGING FUNCTIONS
// ========================================

/**
 * Create a logger for a crawl session
 */
export function createCrawlLogger(
  sourceId: string,
  sourceName: string,
  supabase: TypedSupabaseClient
): CrawlLogger {
  const sessionId = crypto.randomUUID();

  console.log(`📝 Created crawl session: ${sessionId} for ${sourceName}`);

  return {
    sessionId,
    sourceId,
    sourceName,
    supabase,

    async logOperation(
      operationType: string,
      operationStatus: string,
      metrics: Partial<LogMetrics> = {},
      error?: ErrorWithMessage
    ) {
      const logEntry = {
        source_id: sourceId,
        source_name: sourceName,
        crawl_session_id: sessionId,
        operation_type: operationType,
        operation_status: operationStatus,
        pages_crawled: metrics.pages_crawled || 0,
        booths_extracted: metrics.booths_extracted || 0,
        booths_validated: metrics.booths_validated || 0,
        booths_deduplicated: metrics.booths_deduplicated || 0,
        booths_upserted: metrics.booths_upserted || 0,
        urls_processed: metrics.urls_processed || [],
        content_hash: metrics.content_hash,
        error_message: error?.message,
        error_stack: error?.stack,
        metadata: metrics.metadata || {},
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      try {
        const { error: insertError } = await supabase
          .from("crawl_logs")
          .insert(logEntry);

        if (insertError) {
          console.error("Failed to insert crawl log:", insertError);
        }
      } catch (e) {
        console.error("Failed to log operation:", e);
      }

      // Also log to console for immediate visibility
      const icon = operationStatus === "success" ? "✅" : operationStatus === "error" ? "❌" : "⏳";
      console.log(`${icon} [${operationType}] ${operationStatus} - ${sourceName}`);
      if (metrics.booths_extracted) {
        console.log(`   📊 Extracted: ${metrics.booths_extracted}, Validated: ${metrics.booths_validated || 0}`);
      }
      if (error) {
        console.error(`   ⚠️  Error: ${error.message}`);
      }
    },

    async logBatch(
      batchNumber: number,
      operationType: string,
      operationStatus: string,
      metrics: Partial<LogMetrics> = {}
    ) {
      const logEntry = {
        source_id: sourceId,
        source_name: sourceName,
        crawl_session_id: sessionId,
        batch_number: batchNumber,
        operation_type: operationType,
        operation_status: operationStatus,
        pages_crawled: metrics.pages_crawled || 0,
        booths_extracted: metrics.booths_extracted || 0,
        booths_validated: metrics.booths_validated || 0,
        booths_deduplicated: metrics.booths_deduplicated || 0,
        booths_upserted: metrics.booths_upserted || 0,
        urls_processed: metrics.urls_processed || [],
        content_hash: metrics.content_hash,
        metadata: metrics.metadata || {},
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      try {
        const { error: insertError } = await supabase
          .from("crawl_logs")
          .insert(logEntry);

        if (insertError) {
          console.error("Failed to insert batch log:", insertError);
        }
      } catch (e) {
        console.error("Failed to log batch:", e);
      }

      console.log(`📦 Batch #${batchNumber} [${operationType}] ${operationStatus}`);
      if (metrics.pages_crawled) {
        console.log(`   Pages: ${metrics.pages_crawled}, Booths: ${metrics.booths_extracted || 0}`);
      }
    },

    async logError(error: ErrorWithMessage, context: UnknownRecord = {}) {
      await this.logOperation(
        "error",
        "error",
        { metadata: context },
        error
      );
    },
  };
}

// ========================================
// RETRY LOGIC
// ========================================

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  logger?: CrawlLogger
): Promise<T> {
  const defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    exponentialBackoff: true,
    shouldRetry: (error: ErrorWithMessage) => {
      // Retry on network errors, timeouts, rate limits
      if (error.name === "AbortError") return true;
      if (error.message?.includes("timeout")) return true;
      if (error.message?.includes("rate limit")) return true;
      if (error.message?.includes("429")) return true;
      if (error.message?.includes("503")) return true;
      return false;
    },
  };

  const finalConfig = { ...defaultConfig, ...config };
  let lastError: ErrorWithMessage | undefined;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      const result = await fn();

      if (attempt > 1) {
        console.log(`✅ Retry succeeded on attempt ${attempt}`);
        if (logger) {
          await logger.logOperation(
            "retry",
            "success",
            { metadata: { attempt, total_attempts: finalConfig.maxAttempts } }
          );
        }
      }

      return result;
    } catch (error: unknown) {
      lastError = toError(error);

      // Check if we should retry
      const shouldRetry = finalConfig.shouldRetry?.(lastError) ?? true;
      const isLastAttempt = attempt === finalConfig.maxAttempts;

      if (isLastAttempt || !shouldRetry) {
        console.error(`❌ All retry attempts failed (${attempt}/${finalConfig.maxAttempts})`);
        if (logger) {
          await logger.logOperation(
            "retry",
            "error",
            { metadata: { attempt, total_attempts: finalConfig.maxAttempts } },
            lastError
          );
        }
        throw lastError;
      }

      // Calculate delay
      let delay = finalConfig.baseDelay;
      if (finalConfig.exponentialBackoff) {
        delay = Math.min(
          finalConfig.baseDelay * Math.pow(2, attempt - 1),
          finalConfig.maxDelay
        );
      }

      console.warn(`⚠️  Attempt ${attempt} failed: ${lastError.message}`);
      console.log(`   Retrying in ${delay}ms...`);

      if (logger) {
        await logger.logOperation(
          "retry",
          "started",
          { metadata: { attempt, delay_ms: delay, error_message: lastError.message } }
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ========================================
// CONTENT HASHING
// ========================================

/**
 * Generate SHA-256 hash of content
 */
export async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Generate hash of multiple content pieces (for combining HTML + markdown)
 */
export async function hashMultipleContent(contents: string[]): Promise<string> {
  const combined = contents.join("|");
  return hashContent(combined);
}

/**
 * Check if content has changed since last crawl
 */
export async function checkContentChanged(
  sourceId: string,
  pageUrl: string,
  newContentHash: string,
  supabase: TypedSupabaseClient
): Promise<boolean> {
  const { data: cached } = await supabase
    .from("page_cache")
    .select("content_hash")
    .eq("source_id", sourceId)
    .eq("page_url", pageUrl)
    .maybeSingle();

  if (!cached) {
    // New page, definitely changed
    return true;
  }

  return cached.content_hash !== newContentHash;
}

/**
 * Store page content in cache
 */
export async function cachePageContent(
  sourceId: string,
  sourceName: string,
  pageUrl: string,
  html: string,
  markdown: string,
  supabase: TypedSupabaseClient
): Promise<string> {
  const contentHash = await hashMultipleContent([html, markdown]);

  const pageData = {
    source_id: sourceId,
    source_name: sourceName,
    page_url: pageUrl,
    content_hash: contentHash,
    html_content: html,
    markdown_content: markdown,
    content_length: html.length + markdown.length,
    crawled_at: new Date().toISOString(),
    is_valid: true,
  };

  const { error } = await supabase
    .from("page_cache")
    .upsert(pageData, {
      onConflict: "source_id,page_url",
    });

  if (error) {
    console.error("Failed to cache page content:", error);
  } else {
    console.log(`💾 Cached: ${pageUrl} (hash: ${contentHash.slice(0, 8)}...)`);
  }

  return contentHash;
}

/**
 * Get cached page content
 */
export async function getCachedPageContent(
  sourceId: string,
  pageUrl: string,
  supabase: TypedSupabaseClient
): Promise<{ html: string; markdown: string; hash: string } | null> {
  const { data, error } = await supabase
    .from("page_cache")
    .select("html_content, markdown_content, content_hash")
    .eq("source_id", sourceId)
    .eq("page_url", pageUrl)
    .eq("is_valid", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    html: data.html_content,
    markdown: data.markdown_content,
    hash: data.content_hash,
  };
}

// ========================================
// IDEMPOTENCY CHECKS
// ========================================

/**
 * Check if this exact content has already been processed
 */
export async function isContentAlreadyProcessed(
  sourceId: string,
  contentHash: string,
  supabase: TypedSupabaseClient
): Promise<boolean> {
  // Check if we have this exact content hash in our logs
  const { data, error } = await supabase
    .from("crawl_logs")
    .select("id")
    .eq("source_id", sourceId)
    .eq("content_hash", contentHash)
    .eq("operation_status", "success")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to check idempotency:", error);
    return false;
  }

  return data !== null;
}

/**
 * Check if URL has already been crawled in this session
 */
export function hasUrlBeenProcessed(
  url: string,
  processedUrls: Set<string>
): boolean {
  return processedUrls.has(url);
}

/**
 * Track processed URL
 */
export function markUrlProcessed(
  url: string,
  processedUrls: Set<string>
): void {
  processedUrls.add(url);
}

// ========================================
// BATCH TRACKING
// ========================================

/**
 * Update batch progress with URL tracking
 */
export async function updateBatchProgress(
  sourceId: string,
  batchPage: number,
  urls: string[],
  isComplete: boolean,
  supabase: TypedSupabaseClient
): Promise<void> {
  const updateData: Record<string, string | number | boolean | string[]> = {
    last_batch_page: batchPage,
    last_batch_urls: urls,
    pages_processed: batchPage,
    crawl_completed: isComplete,
    updated_at: new Date().toISOString(),
  };

  if (isComplete) {
    updateData.crawl_completed = true;
    updateData.last_successful_crawl = new Date().toISOString();
  }

  const { error } = await supabase
    .from("crawl_sources")
    .update(updateData)
    .eq("id", sourceId);

  if (error) {
    console.error("Failed to update batch progress:", error);
  } else {
    console.log(`📊 Progress updated: ${batchPage} pages, ${urls.length} URLs tracked`);
  }
}

/**
 * Get last processed URLs to detect duplicates
 */
export async function getLastProcessedUrls(
  sourceId: string,
  supabase: TypedSupabaseClient
): Promise<string[]> {
  const { data, error } = await supabase
    .from("crawl_sources")
    .select("last_batch_urls")
    .eq("id", sourceId)
    .single();

  if (error || !data) {
    return [];
  }

  return data.last_batch_urls || [];
}

// ========================================
// HEALTH METRICS
// ========================================

/**
 * Update health metrics for a source
 */
export async function updateHealthMetrics(
  sourceId: string,
  sourceName: string,
  success: boolean,
  durationSeconds: number,
  boothsExtracted: number,
  boothsValidated: number,
  errorType: string | null,
  supabase: TypedSupabaseClient
): Promise<void> {
  try {
    const { error } = await supabase.rpc("update_health_metrics", {
      p_source_id: sourceId,
      p_source_name: sourceName,
      p_success: success,
      p_duration_seconds: durationSeconds,
      p_booths_extracted: boothsExtracted,
      p_booths_validated: boothsValidated,
      p_error_type: errorType,
    });

    if (error) {
      console.error("Failed to update health metrics:", error);
    }
  } catch (e) {
    console.error("Failed to update health metrics:", e);
  }
}

// ========================================
// DRY RUN HELPERS
// ========================================

export interface DryRunContext {
  enabled: boolean;
  results: Array<{
    operation: string;
    data: UnknownRecord;
    timestamp: string;
  }>;
}

export function createDryRunContext(enabled: boolean): DryRunContext {
  return {
    enabled,
    results: [],
  };
}

export function dryRunLog(context: DryRunContext, operation: string, data: UnknownRecord): void {
  if (context.enabled) {
    console.log(`🔍 DRY RUN [${operation}]:`, JSON.stringify(data, null, 2));
    context.results.push({ operation, data, timestamp: new Date().toISOString() });
  }
}

export function getDryRunSummary(context: DryRunContext): {
  dry_run: boolean;
  total_operations: number;
  operations: Array<{ operation: string; data: UnknownRecord; timestamp: string }>;
} | null {
  if (!context.enabled) {
    return null;
  }

  return {
    dry_run: true,
    total_operations: context.results.length,
    operations: context.results,
  };
}

// ========================================
// VALIDATION METRICS TRACKING
// ========================================

export interface ValidationMetrics {
  total_extracted: number;
  passed_validation: number;
  failed_validation: number;
  failure_reasons: Record<string, number>;
}

export function createValidationMetrics(): ValidationMetrics {
  return {
    total_extracted: 0,
    passed_validation: 0,
    failed_validation: 0,
    failure_reasons: {},
  };
}

export function trackValidationResult(
  metrics: ValidationMetrics,
  passed: boolean,
  reason?: string
): void {
  metrics.total_extracted++;

  if (passed) {
    metrics.passed_validation++;
  } else {
    metrics.failed_validation++;
    if (reason) {
      metrics.failure_reasons[reason] = (metrics.failure_reasons[reason] || 0) + 1;
    }
  }
}

export function getValidationRate(metrics: ValidationMetrics): number {
  if (metrics.total_extracted === 0) return 0;
  return (metrics.passed_validation / metrics.total_extracted) * 100;
}

export function logValidationSummary(metrics: ValidationMetrics, logger: CrawlLogger): void {
  const rate = getValidationRate(metrics);
  console.log(`\n📊 VALIDATION SUMMARY:`);
  console.log(`   Total extracted: ${metrics.total_extracted}`);
  console.log(`   Passed: ${metrics.passed_validation} (${rate.toFixed(1)}%)`);
  console.log(`   Failed: ${metrics.failed_validation}`);

  if (Object.keys(metrics.failure_reasons).length > 0) {
    console.log(`   Failure breakdown:`);
    for (const [reason, count] of Object.entries(metrics.failure_reasons)) {
      console.log(`     - ${reason}: ${count}`);
    }
  }
}
