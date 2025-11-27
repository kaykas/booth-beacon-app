import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@1.8.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  extractPhotomatica,
  extractPhotoautomatDe,
  extractPhotomatic,
  extractPhotoboothNet,
  extractLomography,
  extractFlickrPhotobooth,
  extractPinterest,
  extractAutophoto,
  extractPhotomaticaWestCoast,
  extractClassicPhotoBoothCo,
  extractGeneric,
  type BoothData,
  type ExtractorResult,
} from "./extractors.ts";
import {
  extractSoloSophie,
  extractMisadventuresAndi,
  extractNoCameraBag,
  extractGirlInFlorence,
  extractAccidentallyWesAnderson,
  extractDoTheBay,
  extractConcretePlayground,
  extractJapanExperience,
  extractSmithsonian,
  extractDigitalCosmonautBerlin,
  extractPheltMagazineBerlin,
  extractApertureToursberlin,
  extractDesignMyNightLondon,
  extractLondonWorld,
  extractFlashPackLondon,
  extractTimeOutLA,
  extractLocaleMagazineLA,
  extractTimeOutChicago,
  extractBlockClubChicago,
  extractDesignMyNightNY,
  extractRoxyHotelNY,
  extractAirialTravelBrooklyn,
} from "./city-guide-extractors.ts";
import {
  extractFotoautomatBerlin,
  extractAutofoto,
  extractFotoautomatFr,
  extractFotoautomatWien,
  extractFotoautomatica,
  extractFlashPack,
  extractMetroAutoPhoto,
} from "./european-extractors.ts";
import { validateCountry } from "./country-validation.ts";
import {
  extractPhotoboothNetEnhanced,
  extractCityGuideEnhanced,
  extractBlogEnhanced,
  extractCommunityEnhanced,
  extractOperatorEnhanced,
  extractDirectoryEnhanced,
} from "./enhanced-extractors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CrawlResult {
  source_name: string;
  status: "success" | "error" | "skipped";
  booths_found: number;
  booths_added: number;
  booths_updated: number;
  extraction_time_ms: number;
  crawl_duration_ms: number;
  error_message?: string;
  pages_crawled?: number;
  logs?: string[];
}

interface CrawlLog {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  metadata?: Record<string, any>;
}

const crawlLogs: CrawlLog[] = [];

function addLog(level: "info" | "warn" | "error", message: string, metadata?: Record<string, any>) {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata
  };
  crawlLogs.push(log);

  // Also log to console
  const logMessage = `[${level.toUpperCase()}] ${message}`;
  if (level === "error") {
    console.error(logMessage, metadata || "");
  } else if (level === "warn") {
    console.warn(logMessage, metadata || "");
  } else {
    console.log(logMessage, metadata || "");
  }
}

/**
 * Log crawler metrics to database for health monitoring
 */
async function logCrawlerMetric(
  supabase: any,
  sourceId: string,
  sourceName: string,
  batchNumber: number,
  startedAt: Date,
  status: 'success' | 'error' | 'timeout' | 'cancelled',
  pagesCrawled: number = 0,
  boothsExtracted: number = 0,
  errorMessage: string | null = null,
  apiCallDuration: number | null = null,
  extractionDuration: number | null = null
) {
  try {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    await supabase
      .from('crawler_metrics')
      .insert({
        source_id: sourceId,
        source_name: sourceName,
        batch_number: batchNumber,
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
        status,
        error_message: errorMessage,
        pages_crawled: pagesCrawled,
        booths_extracted: boothsExtracted,
        api_call_duration_ms: apiCallDuration,
        extraction_duration_ms: extractionDuration,
      });
  } catch (error) {
    console.error('Failed to log crawler metric:', error);
  }
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  baseDelay: number = 2000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on 404s or certain fatal errors
      if (error.message?.includes('404') || error.message?.includes('auth')) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, i), maxDelay);
      const jitter = Math.random() * 1000;
      console.log(`⚠️ Attempt ${i + 1}/${retries} failed: ${error.message}. Retrying in ${Math.round(delay + jitter)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
}

/**
 * Domain-specific configuration for crawling
 * Helps prevent timeouts on slow sites
 */
const DOMAIN_CONFIG: Record<string, { pageLimit: number; timeout: number; waitFor: number }> = {
  'photobooth.net': { pageLimit: 1, timeout: 60000, waitFor: 8000 },
  'fotoautomat-wien.at': { pageLimit: 1, timeout: 60000, waitFor: 8000 },
  'autophoto.org': { pageLimit: 2, timeout: 45000, waitFor: 5000 },
  'lomography.com': { pageLimit: 2, timeout: 45000, waitFor: 5000 },
  // Default fallback
  'default': { pageLimit: 3, timeout: 30000, waitFor: 6000 }
};

function getDomainConfig(url: string) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    // Check for exact match or substring match
    const configKey = Object.keys(DOMAIN_CONFIG).find(key => hostname.includes(key));
    return configKey ? DOMAIN_CONFIG[configKey] : DOMAIN_CONFIG['default'];
  } catch {
    return DOMAIN_CONFIG['default'];
  }
}

serve(async (req) => {
  crawlLogs.length = 0; // Clear logs for new request
  addLog("info", "Edge function invoked");

  if (req.method === "OPTIONS") {
    addLog("info", "Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  addLog("info", "Processing POST request");

  try {
    addLog("info", "Loading environment variables");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!firecrawlKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    addLog("info", "Environment variables loaded");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey });
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    addLog("info", "Parsing request body");
    // Parse request body for options
    const body = await req.json().catch(() => ({}));
    const {
      source_name: specificSource,
      force_crawl = false,
      stream = false, // Enable SSE streaming for real-time progress
      admin_email = "admin@boothbeacon.com", // Email to send notifications
    } = body;

    addLog("info", "Starting unified crawler", { specificSource, force_crawl, stream });

    // Set up SSE stream if requested
    let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
    const sendProgressEvent = (data: any) => {
      if (stream && streamController) {
        const event = `data: ${JSON.stringify(data)}\n\n`;
        streamController.enqueue(new TextEncoder().encode(event));
      }
    };

    // Get enabled crawl sources
    let query = supabase
      .from("crawl_sources")
      .select("*")
      .eq("enabled", true)
      .order("priority", { ascending: false });

    if (specificSource) {
      query = query.eq("source_name", specificSource);
    }

    const { data: sources, error: sourcesError } = await query;

    if (sourcesError) throw sourcesError;

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No enabled crawl sources found",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: CrawlResult[] = [];
    let totalBooths = 0;
    let totalAdded = 0;
    let totalUpdated = 0;

    // If streaming, create a readable stream
    if (stream) {
      const streamBody = new ReadableStream({
        start(controller) {
          streamController = controller;

          // Send initial event
          sendProgressEvent({
            type: 'start',
            total_sources: sources.length,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Start processing in background
      (async () => {
        try {
          for (let i = 0; i < sources.length; i++) {
            const source = sources[i];
            await processSource(source, i, sources.length, sendProgressEvent, results, force_crawl, anthropicApiKey, firecrawl, supabase);
          }

          // Send completion event
          sendProgressEvent({
            type: 'complete',
            results,
            total_booths_found: results.reduce((sum, r) => sum + r.booths_found, 0),
            total_booths_added: results.reduce((sum, r) => sum + r.booths_added, 0),
            total_booths_updated: results.reduce((sum, r) => sum + r.booths_updated, 0),
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          sendProgressEvent({
            type: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        } finally {
          if (streamController) {
            (streamController as ReadableStreamDefaultController<Uint8Array>).close();
          }
        }
      })();

      return new Response(streamBody, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming: process sources sequentially
    console.log(`Non-streaming mode: Processing ${sources.length} sources...`);
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      console.log(`Processing source ${i + 1}/${sources.length}: ${source.source_name}`);
      await processSource(source, i, sources.length, sendProgressEvent, results, force_crawl, anthropicApiKey, firecrawl, supabase);
      console.log(`Completed source ${i + 1}/${sources.length}`);
    }

    // Return results for non-streaming mode
    addLog("info", "All sources processed. Calculating totals");
    totalBooths = results.reduce((sum, r) => sum + r.booths_found, 0);
    totalAdded = results.reduce((sum, r) => sum + r.booths_added, 0);
    totalUpdated = results.reduce((sum, r) => sum + r.booths_updated, 0);

    addLog("info", `Crawl complete: ${totalBooths} booths found, ${totalAdded} added, ${totalUpdated} updated`);

    const responseData = {
      success: true,
      results,
      summary: {
        total_sources: sources.length,
        total_booths_found: totalBooths,
        total_booths_added: totalAdded,
        total_booths_updated: totalUpdated,
      },
    };

    // Send email notification if configured
    if (resend && admin_email) {
      addLog("info", "Sending email notification", { admin_email });
      try {
        await sendCrawlCompletionEmail(resend, admin_email, responseData, crawlLogs);
        addLog("info", "Email notification sent successfully");
      } catch (emailError: any) {
        addLog("error", "Failed to send email notification", { error: emailError.message });
      }
    }

    addLog("info", "Response prepared, returning");
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    addLog("error", "Crawler error", { error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendCrawlCompletionEmail(
  resend: any,
  adminEmail: string,
  responseData: any,
  logs: CrawlLog[]
) {
  const { summary, results } = responseData;

  // Collect errors from results
  const errors = results.filter((r: CrawlResult) => r.status === "error");
  const successes = results.filter((r: CrawlResult) => r.status === "success");
  const skipped = results.filter((r: CrawlResult) => r.status === "skipped");

  // Format logs for readability
  const formattedLogs = logs.map(log =>
    `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${log.metadata ? '\n  ' + JSON.stringify(log.metadata, null, 2) : ''}`
  ).join('\n\n');

  // Create error summary
  const errorSummary = errors.length > 0
    ? errors.map((e: CrawlResult) => `• ${e.source_name}: ${e.error_message}`).join('\n')
    : 'No errors encountered';

  // Create success summary
  const successSummary = successes.map((s: CrawlResult) =>
    `• ${s.source_name}: ${s.booths_found} found, ${s.booths_added} added, ${s.booths_updated} updated (${s.pages_crawled || 0} pages)`
  ).join('\n');

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .summary { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .stat { display: inline-block; margin: 10px 20px 10px 0; }
          .stat-label { font-weight: 600; color: #64748b; }
          .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .success { color: #16a34a; }
          .error { color: #dc2626; background: #fee; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .warning { color: #ea580c; }
          pre { background: #f8fafc; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px; max-height: 400px; overflow-y: auto; }
          .section { margin: 20px 0; }
          ul { padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <h1>🎯 Booth Beacon Crawl Completion Report</h1>
        
        <div class="summary">
          <h2>📊 Summary Statistics</h2>
          <div class="stat">
            <div class="stat-label">Total Sources</div>
            <div class="stat-value">${summary.total_sources}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Booths Found</div>
            <div class="stat-value success">${summary.total_booths_found}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Booths Added</div>
            <div class="stat-value success">${summary.total_booths_added}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Booths Updated</div>
            <div class="stat-value">${summary.total_booths_updated}</div>
          </div>
        </div>

        <div class="section">
          <h2>✅ Successful Crawls (${successes.length})</h2>
          <pre>${successSummary || 'None'}</pre>
        </div>

        ${skipped.length > 0 ? `
        <div class="section">
          <h2 class="warning">⏭️ Skipped Sources (${skipped.length})</h2>
          <pre>${skipped.map((s: CrawlResult) => `• ${s.source_name}`).join('\n')}</pre>
        </div>
        ` : ''}

        ${errors.length > 0 ? `
        <div class="section error">
          <h2>❌ Errors Encountered (${errors.length})</h2>
          <pre>${errorSummary}</pre>
        </div>
        ` : '<p class="success"><strong>✅ No errors encountered!</strong></p>'}

        <div class="section">
          <h2>📋 Full Execution Logs</h2>
          <p>Complete logs for AI evaluation and debugging:</p>
          <pre>${formattedLogs}</pre>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #64748b; font-size: 12px;">
          Generated: ${new Date().toISOString()}<br>
          Booth Beacon - Unified Crawler System
        </p>
      </body>
    </html>
  `;

  await resend.emails.send({
    from: 'Booth Beacon <notifications@boothbeacon.com>',
    to: [adminEmail],
    subject: `🎯 Crawl Complete: ${summary.total_booths_found} booths found${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
    html: htmlContent,
  });
}

async function processSource(
  source: any,
  index: number,
  total: number,
  sendProgressEvent: (data: any) => void,
  results: CrawlResult[],
  force_crawl: boolean,
  anthropicApiKey: string,
  firecrawl: any,
  supabase: any
) {
  const crawlStartTime = Date.now();
  addLog("info", `Processing source: ${source.source_name}`, {
    url: source.source_url,
    priority: source.priority,
    index: index + 1,
    total
  });

  sendProgressEvent({
    type: 'progress',
    current: index + 1,
    total,
    source_name: source.source_name,
    status: 'starting',
    timestamp: new Date().toISOString()
  });

  try {
    // Check if we should skip based on last crawl time
    // Reset batch progress if force_crawl or if previous crawl was completed
    if (force_crawl || source.crawl_completed) {
      await supabase
        .from("crawl_sources")
        .update({
          last_batch_page: 0,
          crawl_completed: false,
        })
        .eq("id", source.id);
      addLog("info", `Reset batch progress for ${source.source_name}`);
    }

    if (!force_crawl && source.last_crawl_timestamp && source.crawl_frequency_days) {
      const daysSinceLastCrawl =
        (Date.now() - new Date(source.last_crawl_timestamp).getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastCrawl < source.crawl_frequency_days) {
        addLog("info", `Skipping ${source.source_name}`, {
          days_since_last_crawl: daysSinceLastCrawl.toFixed(1),
          frequency_days: source.crawl_frequency_days
        });
        const skipResult: CrawlResult = {
          source_name: source.source_name,
          status: "skipped" as const,
          booths_found: 0,
          booths_added: 0,
          booths_updated: 0,
          extraction_time_ms: 0,
          crawl_duration_ms: Date.now() - crawlStartTime,
        };
        results.push(skipResult);

        sendProgressEvent({
          type: 'progress',
          current: index + 1,
          total,
          source_name: source.source_name,
          status: 'skipped',
          result: skipResult,
          timestamp: new Date().toISOString()
        });

        return;
      }
    }

    // Update crawl status to in-progress
    await supabase
      .from("crawl_sources")
      .update({ last_crawl_timestamp: new Date().toISOString() })
      .eq("id", source.id);

    // Determine if we should use multi-page crawling
    // Since websites are small, use multi-page crawl for ALL directory-type sources
    // Keep single-page scrape for blogs and individual articles
    const singlePageSources = [
      'aperturetours', // Berlin photography blog
      'digital_cosmonaut', // Berlin city blog
      'girlinflorence', // Florence blog
      'nocamerabag', // Vienna photo spots
      'solosophie', // Paris travel blog
      'roxyhotelnyc', // NYC hotel blog
      'itstheflashpack', // London travel blog
    ];

    const useMultiPageCrawl = !singlePageSources.includes(source.extractor_type);

    let extractorResult: ExtractorResult;

    if (useMultiPageCrawl) {
      // AUTOMATIC BATCH PROCESSING - Process multiple batches until complete or timeout
      console.log(`🔄 Starting automatic batch processing for ${source.source_name}...`);

      // Use configurable batch size from source settings OR domain config
      const domainConfig = getDomainConfig(source.source_url);
      const pageLimit = source.pages_per_batch || domainConfig.pageLimit;

      console.log(`Using batch size of ${pageLimit} pages for ${source.source_name} (Timeout: ${domainConfig.timeout}ms)...`);
      const totalPages = source.total_pages_target || 0;
      const functionTimeoutMs = 130000; // Exit 20 seconds before Supabase 150s timeout
      const functionStartTime = Date.now();

      // Accumulate results across all batches
      const allBooths: BoothData[] = [];
      const allErrors: string[] = [];
      let totalExtractionTime = 0;
      let totalPagesCrawled = 0;
      let batchNumber = 0;

      // Get current progress from database
      let currentPage = source.last_batch_page || 0;
      let isCrawlComplete = totalPages > 0 && currentPage >= totalPages;

      console.log(`📊 Starting from page ${currentPage}/${totalPages} (batch size: ${pageLimit})`);

      // BATCH LOOP: Continue until complete or approaching timeout
      while (!isCrawlComplete) {
        batchNumber++;
        const batchStartTime = Date.now();
        const batchStartDate = new Date();
        const elapsedTime = batchStartTime - functionStartTime;

        // Check if we're approaching timeout (exit gracefully)
        if (elapsedTime > functionTimeoutMs) {
          console.log(`⏰ Approaching function timeout (${Math.round(elapsedTime / 1000)}s elapsed). Exiting gracefully.`);
          console.log(`💾 Progress saved: ${currentPage}/${totalPages} pages complete`);

          // Log timeout metric
          await logCrawlerMetric(
            supabase,
            source.id,
            source.source_name,
            batchNumber,
            batchStartDate,
            'timeout',
            0,
            allBooths.length,
            'Function timeout approaching',
            null,
            null
          );

          sendProgressEvent({
            type: 'batch_timeout',
            source_name: source.source_name,
            current_page: currentPage,
            total_pages: totalPages,
            batches_completed: batchNumber - 1,
            booths_so_far: allBooths.length,
            timestamp: new Date().toISOString()
          });

          break;
        }

        console.log(`\n🔄 Processing batch #${batchNumber} (pages ${currentPage + 1}-${currentPage + pageLimit})...`);

        sendProgressEvent({
          type: 'batch_start',
          source_name: source.source_name,
          batch_number: batchNumber,
          start_page: currentPage + 1,
          end_page: currentPage + pageLimit,
          total_pages: totalPages,
          progress_percent: totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0,
          booths_so_far: allBooths.length,
          timestamp: new Date().toISOString()
        });

        let crawlResult;
        let apiCallDuration = 0;
        const apiCallStart = Date.now();

        try {
          console.log(`⏳ Waiting for Firecrawl API to crawl pages (Timeout: ${domainConfig.timeout}ms)...`);

          // Use retry logic for robustness
          crawlResult = await retryWithBackoff(async () => {
            const result = await firecrawl.crawlUrl(source.source_url, {
              limit: pageLimit,
              scrapeOptions: {
                formats: ['markdown', 'html'],
                onlyMainContent: false,
                waitFor: domainConfig.waitFor,
                timeout: domainConfig.timeout,
              },
            });

            if (!result.success) {
              throw new Error(result.error || 'Firecrawl returned unsuccessful status');
            }
            return result;
          }, 2, 2000, 10000); // 2 retries (3 attempts total)

          apiCallDuration = Date.now() - apiCallStart;
          console.log(`✅ Firecrawl API responded in ${apiCallDuration}ms`);
        } catch (error: any) {
          apiCallDuration = Date.now() - apiCallStart;
          console.error(`❌ Batch failed after retries: ${error.message}`);
          allErrors.push(`Batch ${batchNumber}: ${error.message}`);

          // Log error metric
          await logCrawlerMetric(
            supabase,
            source.id,
            source.source_name,
            batchNumber,
            batchStartDate,
            'error',
            0,
            0,
            error.message,
            apiCallDuration,
            null
          );

          sendProgressEvent({
            type: 'batch_error',
            source_name: source.source_name,
            batch_number: batchNumber,
            error: error.message,
            timestamp: new Date().toISOString()
          });

          // If it's a timeout, we might want to stop this source but continue others
          break;
        }

        if (!crawlResult.success) {
          const errorMsg = `Batch #${batchNumber} failed: ${crawlResult.error || 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          allErrors.push(errorMsg);

          // Log error metric
          await logCrawlerMetric(
            supabase,
            source.id,
            source.source_name,
            batchNumber,
            batchStartDate,
            'error',
            0,
            0,
            crawlResult.error || 'Unknown error',
            apiCallDuration,
            null
          );

          sendProgressEvent({
            type: 'batch_error',
            source_name: source.source_name,
            batch_number: batchNumber,
            error: crawlResult.error || 'Unknown error',
            timestamp: new Date().toISOString()
          });

          break;
        }

        const pages = crawlResult.data || [];
        const pagesCrawled = pages.length;
        console.log(`✓ Crawled ${pagesCrawled} pages in batch #${batchNumber}`);

        sendProgressEvent({
          type: 'batch_crawled',
          source_name: source.source_name,
          batch_number: batchNumber,
          pages_crawled: pagesCrawled,
          timestamp: new Date().toISOString()
        });

        // Update progress
        const previousPage = currentPage;
        currentPage = previousPage + pagesCrawled;
        totalPagesCrawled += pagesCrawled;
        isCrawlComplete = totalPages > 0 && currentPage >= totalPages;

        console.log(`📈 Progress: ${currentPage}/${totalPages} pages (${Math.round(currentPage / totalPages * 100)}%)`);

        // Extract booths from all pages in this batch
        const extractionStart = Date.now();

        sendProgressEvent({
          type: 'extraction_start',
          source_name: source.source_name,
          batch_number: batchNumber,
          total_pages: pagesCrawled,
          timestamp: new Date().toISOString()
        });

        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
          const page = pages[pageIndex];

          sendProgressEvent({
            type: 'extraction_progress',
            source_name: source.source_name,
            batch_number: batchNumber,
            page_index: pageIndex + 1,
            total_pages: pagesCrawled,
            booths_extracted_so_far: allBooths.length,
            timestamp: new Date().toISOString()
          });

          const pageResult = await extractFromSource(
            page.html || '',
            page.markdown || '',
            source.source_url,
            source.source_name,
            source.extractor_type,
            anthropicApiKey,
            (event) => sendProgressEvent({
              ...event,
              page_index: pageIndex + 1,
              source_name: source.source_name,
              batch_number: batchNumber
            })
          );
          allBooths.push(...pageResult.booths);
          allErrors.push(...pageResult.errors);
          totalExtractionTime += pageResult.metadata.extraction_time_ms;
        }
        const extractionDuration = Date.now() - extractionStart;

        sendProgressEvent({
          type: 'extraction_complete',
          source_name: source.source_name,
          batch_number: batchNumber,
          pages_processed: pagesCrawled,
          booths_extracted: allBooths.length,
          extraction_duration_ms: extractionDuration,
          timestamp: new Date().toISOString()
        });

        const batchDuration = Date.now() - batchStartTime;
        console.log(`⏱️  Batch #${batchNumber} completed in ${Math.round(batchDuration / 1000)}s`);
        console.log(`🎯 Total booths so far: ${allBooths.length}`);

        // Log successful batch metric
        await logCrawlerMetric(
          supabase,
          source.id,
          source.source_name,
          batchNumber,
          batchStartDate,
          'success',
          pagesCrawled,
          allBooths.length,
          null,
          apiCallDuration,
          extractionDuration
        );

        sendProgressEvent({
          type: 'batch_complete',
          source_name: source.source_name,
          batch_number: batchNumber,
          pages_crawled: pagesCrawled,
          current_page: currentPage,
          total_pages: totalPages,
          progress_percent: totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0,
          booths_so_far: allBooths.length,
          batch_duration_ms: batchDuration,
          is_complete: isCrawlComplete,
          timestamp: new Date().toISOString()
        });

        // Update database with progress after each batch
        await supabase
          .from("crawl_sources")
          .update({
            last_batch_page: currentPage,
            crawl_completed: isCrawlComplete,
            last_successful_crawl: new Date().toISOString(),
          })
          .eq("id", source.id);

        // Exit if complete
        if (isCrawlComplete) {
          console.log(`🎉 ${source.source_name}: All batches complete! (${currentPage}/${totalPages} pages)`);

          sendProgressEvent({
            type: 'source_complete',
            source_name: source.source_name,
            total_batches: batchNumber,
            total_pages_crawled: totalPagesCrawled,
            total_booths_found: allBooths.length,
            timestamp: new Date().toISOString()
          });

          break;
        }

        // Exit if no pages were returned (Firecrawl reached end of site)
        if (pagesCrawled === 0) {
          console.log(`⚠️  No more pages available from Firecrawl. Marking as complete.`);
          isCrawlComplete = true;
          await supabase
            .from("crawl_sources")
            .update({ crawl_completed: true })
            .eq("id", source.id);
          break;
        }
      }

      // Deduplicate all booths collected across batches
      extractorResult = {
        booths: deduplicateBooths(allBooths),
        errors: allErrors,
        metadata: {
          pages_processed: totalPagesCrawled,
          total_found: allBooths.length,
          extraction_time_ms: totalExtractionTime,
        },
      };

      console.log(`\n📊 BATCH SUMMARY for ${source.source_name}:`);
      console.log(`   Batches processed: ${batchNumber}`);
      console.log(`   Total pages crawled: ${totalPagesCrawled}`);
      console.log(`   Total booths found: ${allBooths.length}`);
      console.log(`   Unique booths after dedup: ${extractorResult.booths.length}`);
      console.log(`   Status: ${isCrawlComplete ? 'COMPLETE ✅' : 'IN PROGRESS (will resume on next run)'}`);

    } else {
      // Use scrapeUrl for single-page sites
      console.log(`Using single-page scrape for ${source.source_name}...`);

      const scrapeResult = await firecrawl.scrapeUrl(source.source_url, {
        formats: ['markdown', 'html'],
        onlyMainContent: false, // FALSE to capture sidebars/navigation with booth lists
        waitFor: 6000, // Wait 6 seconds for Maps/React to load
        timeout: 30000,
      });

      if (!scrapeResult.success) {
        throw new Error(`Firecrawl scrape failed: ${scrapeResult.error}`);
      }

      extractorResult = await extractFromSource(
        scrapeResult.html || '',
        scrapeResult.markdown || '',
        source.source_url,
        source.source_name,
        source.extractor_type,
        anthropicApiKey
      );
    }

    addLog("info", `Extracted ${extractorResult.booths.length} booths from ${source.source_name}`);
    if (extractorResult.errors.length > 0) {
      addLog("warn", `Extraction errors for ${source.source_name}`, {
        error_count: extractorResult.errors.length,
        sample_errors: extractorResult.errors.slice(0, 3)
      });
    }

    // Upsert booths into database
    let added = 0;
    let updated = 0;

    for (const booth of extractorResult.booths) {
      // Validate booth data
      if (!validateBooth(booth)) {
        console.warn(`Skipping invalid booth: ${booth.name}`);
        continue;
      }

      // Check if booth exists by normalized name + city + country
      const normalizedName = normalizeName(booth.name);
      const normalizedCity = booth.city ? normalizeName(booth.city) : null;

      const { data: existing } = await supabase
        .from("booths")
        .select("id, source_names, source_urls")
        .eq("country", booth.country)
        .ilike("name", `%${normalizedName}%`)
        .maybeSingle();

      const boothData = {
        name: booth.name,
        address: booth.address,
        city: booth.city,
        state: booth.state,
        country: booth.country,
        postal_code: booth.postal_code,
        latitude: booth.latitude,
        longitude: booth.longitude,
        machine_model: booth.machine_model,
        machine_manufacturer: booth.machine_manufacturer,
        type: booth.booth_type || 'analog',
        cost: booth.cost,
        hours: booth.hours,
        is_operational: booth.is_operational ?? true,
        status: booth.status,
        description: booth.description,
        website: booth.website,
        phone: booth.phone,
        photos: booth.photos || [],
      };

      if (existing) {
        // Update existing booth and track source
        const sourceNames = existing.source_names || [];
        const sourceUrls = existing.source_urls || [];

        if (!sourceNames.includes(source.source_name)) {
          sourceNames.push(source.source_name);
        }
        if (!sourceUrls.includes(booth.source_url)) {
          sourceUrls.push(booth.source_url);
        }

        const { error: updateError } = await supabase
          .from("booths")
          .update({
            ...boothData,
            source_names: sourceNames,
            source_urls: sourceUrls,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (!updateError) updated++;
      } else {
        // Insert new booth
        const { error: insertError } = await supabase
          .from("booths")
          .insert({
            ...boothData,
            source_names: [source.source_name],
            source_urls: [booth.source_url],
            source_id: source.id,
          });

        if (!insertError) added++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const crawlDuration = Date.now() - crawlStartTime;

    // Get final batch status from database (may have been updated during batch loop)
    const { data: updatedSource } = await supabase
      .from("crawl_sources")
      .select("last_batch_page, crawl_completed, total_pages_target")
      .eq("id", source.id)
      .single();

    const finalPage = updatedSource?.last_batch_page || 0;
    const finalTotalPages = updatedSource?.total_pages_target || 0;
    const finalIsComplete = updatedSource?.crawl_completed || false;

    // Update source statistics with final results
    await supabase
      .from("crawl_sources")
      .update({
        last_successful_crawl: new Date().toISOString(),
        total_booths_found: extractorResult.booths.length,
        total_booths_added: added,
        total_booths_updated: updated,
        average_crawl_duration_seconds: Math.round(crawlDuration / 1000),
        consecutive_failures: 0,
        status: 'active',
      })
      .eq("id", source.id);

    if (finalIsComplete) {
      console.log(`🎉 ${source.source_name}: CRAWL COMPLETE! (${finalPage}/${finalTotalPages} pages) ✅`);
    } else if (finalTotalPages > 0) {
      console.log(`📊 ${source.source_name}: Partial progress saved (${finalPage}/${finalTotalPages} pages, ${finalTotalPages - finalPage} remaining)`);
      console.log(`💡 Will automatically resume on next crawler run`);
    }

    results.push({
      source_name: source.source_name,
      status: "success",
      booths_found: extractorResult.booths.length,
      booths_added: added,
      booths_updated: updated,
      extraction_time_ms: extractorResult.metadata.extraction_time_ms,
      crawl_duration_ms: crawlDuration,
      pages_crawled: extractorResult.metadata.pages_processed,
    });

    addLog("info", `Completed ${source.source_name} successfully`, {
      booths_found: extractorResult.booths.length,
      booths_added: added,
      booths_updated: updated,
      duration_ms: crawlDuration
    });

    sendProgressEvent({
      type: 'progress',
      current: index + 1,
      total,
      source_name: source.source_name,
      status: 'complete',
      result: {
        source_name: source.source_name,
        status: "success",
        booths_found: extractorResult.booths.length,
        booths_added: added,
        booths_updated: updated,
        extraction_time_ms: extractorResult.metadata.extraction_time_ms,
        crawl_duration_ms: crawlDuration,
        pages_crawled: extractorResult.metadata.pages_processed,
      },
      timestamp: new Date().toISOString()
    });

    return; // Explicit return to exit the function

  } catch (error) {
    addLog("error", `Source ${source.source_name} failed`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Update source error status
    const consecutiveFailures = (source.consecutive_failures || 0) + 1;
    await supabase
      .from("crawl_sources")
      .update({
        consecutive_failures: consecutiveFailures,
        last_error_message: error instanceof Error ? error.message : String(error),
        last_error_timestamp: new Date().toISOString(),
        status: consecutiveFailures >= 3 ? 'error' : 'active',
      })
      .eq("id", source.id);

    results.push({
      source_name: source.source_name,
      status: "error",
      booths_found: 0,
      booths_added: 0,
      booths_updated: 0,
      extraction_time_ms: 0,
      crawl_duration_ms: Date.now() - crawlStartTime,
      error_message: error instanceof Error ? error.message : String(error),
    });
  }
}


/**
 * Route to appropriate extractor based on source type
 */
async function extractFromSource(
  html: string,
  markdown: string,
  sourceUrl: string,
  sourceName: string,
  extractorType: string,
  anthropicApiKey: string,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  // PRIORITY: Use enhanced AI extractors for gold standard sources
  switch (extractorType) {
    // GOLD STANDARD: photobooth.net - Use enhanced extractor
    case 'photobooth_net':
      console.log("🎯 Using ENHANCED extractor for photobooth.net");
      return extractPhotoboothNetEnhanced(html, markdown, sourceUrl, anthropicApiKey, onProgress);

    // Use AI extraction for all directory sources
    case 'photomatica':
    case 'photoautomat_de':
    case 'photomatic':
    case 'lomography':
    case 'flickr_photobooth':
    case 'pinterest':
    case 'autophoto':
    case 'photomatica_west_coast':
    case 'classic_photo_booth_co':
      console.log(`🎯 Using ENHANCED extractor for directory: ${sourceName}`);
      return extractDirectoryEnhanced(html, markdown, sourceUrl, sourceName, anthropicApiKey, onProgress);

    // TIER 3A: City Guide Extractors - ALL USE ENHANCED AI EXTRACTION
    // Berlin City Guides
    case 'city_guide_berlin_digitalcosmonaut':
    case 'city_guide_berlin_phelt':
    case 'city_guide_berlin_aperture':
    // London City Guides
    case 'city_guide_london_designmynight':
    case 'city_guide_london_world':
    case 'city_guide_london_flashpack':
    // Los Angeles City Guides
    case 'city_guide_la_timeout':
    case 'city_guide_la_locale':
    // Chicago City Guides
    case 'city_guide_chicago_timeout':
    case 'city_guide_chicago_blockclub':
    // New York City Guides
    case 'city_guide_ny_designmynight':
    case 'city_guide_ny_roxy':
    case 'city_guide_ny_airial':
      console.log(`🏙️ Using ENHANCED extractor for city guide: ${sourceName}`);
      return extractCityGuideEnhanced(html, markdown, sourceUrl, sourceName, anthropicApiKey, onProgress);

    // TIER 2B: European Operators - Use AI extraction
    case 'fotoautomat_berlin':
    case 'autofoto':
    case 'fotoautomat_fr':
    case 'fotoautomat_wien':
    case 'fotoautomatica':
    case 'flash_pack':
    case 'metro_auto_photo':
      console.log(`🇪🇺 Using ENHANCED extractor for operator: ${sourceName}`);
      return extractOperatorEnhanced(html, markdown, sourceUrl, sourceName, anthropicApiKey, onProgress);

    // TIER 3B: Travel Blogs & Community - ALL USE ENHANCED AI EXTRACTION
    case 'solo_sophie':
    case 'misadventures_andi':
    case 'no_camera_bag':
    case 'girl_in_florence':
    case 'accidentally_wes_anderson':
    case 'dothebay':
    case 'concrete_playground':
    case 'japan_experience':
      console.log(`📝 Using ENHANCED extractor for blog: ${sourceName}`);
      return extractBlogEnhanced(html, markdown, sourceUrl, sourceName, anthropicApiKey, onProgress);

    case 'smithsonian':
      console.log(`🏛️ Using ENHANCED extractor for community source: ${sourceName}`);
      return extractCommunityEnhanced(html, markdown, sourceUrl, sourceName, anthropicApiKey, onProgress);

    default:
      return extractGeneric(html, markdown, sourceUrl, sourceName, anthropicApiKey);
  }
}

/**
 * Validate booth data meets minimum requirements
 * Now includes country validation to prevent "Unknown", "Brian |", and corrupted data
 */
function validateBooth(booth: BoothData): boolean {
  if (!booth.name || booth.name.trim().length === 0) {
    console.warn(`Booth validation failed: missing name`);
    return false;
  }
  if (!booth.address || booth.address.trim().length === 0) {
    console.warn(`Booth validation failed: missing address for ${booth.name}`);
    return false;
  }

  // Validate country (strict validation with city fallback)
  const countryValidation = validateCountry(booth.country, booth.city);
  if (!countryValidation.isValid) {
    console.warn(`Booth validation failed for "${booth.name}": ${countryValidation.error}`);
    return false;
  }

  // Standardize country name to validated version
  booth.country = countryValidation.standardizedCountry;

  // Check for HTML tags
  const htmlPattern = /<[^>]+>/;
  if (htmlPattern.test(booth.name) || htmlPattern.test(booth.address)) {
    console.warn(`Booth validation failed: HTML tags detected in ${booth.name}`);
    return false;
  }

  // Check for reasonable length
  if (booth.name.length > 200 || booth.address.length > 300) {
    console.warn(`Booth validation failed: excessive length for ${booth.name}`);
    return false;
  }

  return true;
}

/**
 * Normalize name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deduplicate booths within extraction result
 */
function deduplicateBooths(booths: BoothData[]): BoothData[] {
  const seen = new Map<string, BoothData>();

  for (const booth of booths) {
    const key = `${normalizeName(booth.name)}_${booth.city}_${booth.country}`;
    if (!seen.has(key)) {
      seen.set(key, booth);
    }
  }

  return Array.from(seen.values());
}
