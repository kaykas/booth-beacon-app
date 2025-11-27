/**
 * TypeScript Type Definitions for Unified Crawler
 *
 * This file contains all shared types to eliminate 'any' usage
 * and provide strict type safety across the crawler system.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// ============================================
// DATABASE TYPES
// ============================================

/**
 * CrawlSource - Represents a source for booth data crawling
 * Based on crawl_sources table schema
 */
export interface CrawlSource {
  id: string;

  // Source identification
  source_name: string;
  source_url: string;
  source_type: string;
  country_focus: string | null;

  // Crawl configuration
  extractor_type: string;
  enabled: boolean;
  priority: number;

  // Crawl frequency settings
  crawl_frequency_days: number;
  incremental_enabled: boolean;

  // Status tracking
  last_crawl_timestamp: string | null;
  last_successful_crawl: string | null;
  total_booths_found: number;
  total_booths_added: number;
  total_booths_updated: number;

  // Health monitoring
  status: string;
  consecutive_failures: number;
  last_error_message: string | null;
  last_error_timestamp: string | null;

  // Performance metrics
  average_crawl_duration_seconds: number | null;
  average_booths_per_crawl: number | null;

  // Batch tracking (added in later migrations)
  pages_per_batch: number;
  total_pages_target: number | null;
  last_batch_page: number;
  last_batch_urls: string[];
  crawl_completed: boolean;
  pages_processed: number;
  total_pages_crawled: number;

  // Content fingerprinting
  last_content_hash: string | null;
  content_changed_at: string | null;

  // Validation metrics
  total_booths_extracted: number;
  total_booths_validated: number;
  total_booths_deduplicated: number;
  validation_failure_rate: number;

  // Retry tracking
  retry_count: number;
  last_retry_at: string | null;

  // Metadata
  crawl_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

/**
 * Booth database record
 */
export interface BoothRecord {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  machine_model: string | null;
  machine_manufacturer: string | null;
  type: string;
  cost: string | null;
  hours: string | null;
  is_operational: boolean;
  status: string;
  description: string | null;
  website: string | null;
  phone: string | null;
  photos: string[];
  source_id: string;
  source_names: string[];
  source_urls: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// FIRECRAWL API TYPES
// ============================================

/**
 * Firecrawl page result
 */
export interface FirecrawlPage {
  url?: string;
  html?: string;
  markdown?: string;
  metadata?: {
    sourceURL?: string;
    title?: string;
    description?: string;
    [key: string]: unknown;
  };
}

/**
 * Firecrawl crawl result
 */
export interface FirecrawlCrawlResult {
  success: boolean;
  data?: FirecrawlPage[];
  error?: string;
}

/**
 * Firecrawl scrape result
 */
export interface FirecrawlScrapeResult {
  success: boolean;
  html?: string;
  markdown?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

/**
 * Firecrawl API client interface
 */
export interface FirecrawlClient {
  crawlUrl: (
    url: string,
    options?: {
      limit?: number;
      scrapeOptions?: {
        formats?: string[];
        onlyMainContent?: boolean;
        waitFor?: number;
        timeout?: number;
      };
    }
  ) => Promise<FirecrawlCrawlResult>;

  scrapeUrl: (
    url: string,
    options?: {
      formats?: string[];
      onlyMainContent?: boolean;
      waitFor?: number;
      timeout?: number;
    }
  ) => Promise<FirecrawlScrapeResult>;
}

// ============================================
// SUPABASE CLIENT TYPE
// ============================================

/**
 * Typed Supabase client with our database schema
 */
export type TypedSupabaseClient = SupabaseClient<{
  public: {
    Tables: {
      crawl_sources: {
        Row: CrawlSource;
        Insert: Partial<CrawlSource>;
        Update: Partial<CrawlSource>;
      };
      booths: {
        Row: BoothRecord;
        Insert: Partial<BoothRecord>;
        Update: Partial<BoothRecord>;
      };
      crawl_logs: {
        Row: {
          id: string;
          source_id: string;
          source_name: string;
          crawl_session_id: string;
          batch_number: number | null;
          operation_type: string;
          operation_status: string;
          pages_crawled: number;
          booths_extracted: number;
          booths_validated: number;
          booths_deduplicated: number;
          booths_upserted: number;
          urls_processed: string[];
          content_hash: string | null;
          error_message: string | null;
          error_stack: string | null;
          metadata: Record<string, unknown>;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Partial<{
          id: string;
          source_id: string;
          source_name: string;
          crawl_session_id: string;
          batch_number: number | null;
          operation_type: string;
          operation_status: string;
          pages_crawled: number;
          booths_extracted: number;
          booths_validated: number;
          booths_deduplicated: number;
          booths_upserted: number;
          urls_processed: string[];
          content_hash: string | null;
          error_message: string | null;
          error_stack: string | null;
          metadata: Record<string, unknown>;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        }>;
        Update: Partial<{
          id: string;
          source_id: string;
          source_name: string;
          crawl_session_id: string;
          batch_number: number | null;
          operation_type: string;
          operation_status: string;
          pages_crawled: number;
          booths_extracted: number;
          booths_validated: number;
          booths_deduplicated: number;
          booths_upserted: number;
          urls_processed: string[];
          content_hash: string | null;
          error_message: string | null;
          error_stack: string | null;
          metadata: Record<string, unknown>;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        }>;
      };
      page_cache: {
        Row: {
          id: string;
          source_id: string;
          source_name: string;
          page_url: string;
          content_hash: string;
          html_content: string;
          markdown_content: string;
          content_length: number;
          crawled_at: string;
          is_valid: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          source_id: string;
          source_name: string;
          page_url: string;
          content_hash: string;
          html_content: string;
          markdown_content: string;
          content_length: number;
          crawled_at: string;
          is_valid: boolean;
          created_at: string;
          updated_at: string;
        }>;
        Update: Partial<{
          id: string;
          source_id: string;
          source_name: string;
          page_url: string;
          content_hash: string;
          html_content: string;
          markdown_content: string;
          content_length: number;
          crawled_at: string;
          is_valid: boolean;
          created_at: string;
          updated_at: string;
        }>;
      };
    };
    Functions: {
      update_health_metrics: {
        Args: {
          p_source_id: string;
          p_source_name: string;
          p_success: boolean;
          p_duration_seconds: number;
          p_booths_extracted: number;
          p_booths_validated: number;
          p_error_type: string | null;
        };
        Returns: void;
      };
    };
  };
}>;

// ============================================
// ANTHROPIC API TYPES
// ============================================

/**
 * Anthropic message content block
 */
export interface AnthropicContentBlock {
  type: "text" | "tool_use";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

/**
 * Anthropic API response
 */
export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Record with string keys and unknown values
 */
export type UnknownRecord = Record<string, unknown>;

/**
 * JSON-serializable value
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Error with standard Error interface
 */
export interface ErrorWithMessage {
  message: string;
  name?: string;
  stack?: string;
}

/**
 * Type guard for Error objects
 */
export function isError(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ErrorWithMessage).message === "string"
  );
}

/**
 * Convert unknown error to ErrorWithMessage
 */
export function toError(error: unknown): ErrorWithMessage {
  if (isError(error)) {
    return error;
  }

  if (typeof error === "string") {
    return { message: error };
  }

  return { message: String(error) };
}
