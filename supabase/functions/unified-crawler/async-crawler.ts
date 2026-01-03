/**
 * Async Crawler - Uses Firecrawl's async mode with webhooks
 * Fixes timeout issues by not blocking on crawl completion
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface AsyncCrawlParams {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  extractorType: string;
  pageLimit: number;
  firecrawlApiKey: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
}

interface AsyncCrawlResult {
  success: boolean;
  jobId: string;
  status: 'pending' | 'crawling';
  message: string;
  checkUrl: string;
}

/**
 * Start an async crawl job using Firecrawl's webhook mode
 * Returns immediately with job ID - does NOT wait for crawl to complete
 */
export async function startAsyncCrawl(params: AsyncCrawlParams): Promise<AsyncCrawlResult> {
  const {
    sourceId,
    sourceName,
    sourceUrl,
    extractorType,
    pageLimit,
    firecrawlApiKey,
    supabaseUrl,
    supabaseServiceKey,
  } = params;

  console.log(`🚀 Starting async crawl for ${sourceName} (${pageLimit} pages)`);

  // Construct webhook URL
  const webhookUrl = `${supabaseUrl}/functions/v1/firecrawl-webhook`;
  console.log(`📡 Webhook URL: ${webhookUrl}`);

  // Start async crawl via Firecrawl API
  const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: sourceUrl,
      limit: pageLimit,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        waitFor: 8000,  // Wait 8 seconds for JS to load
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'scroll', direction: 'down' }
        ],
      },
      webhook: webhookUrl,
      // Note: Firecrawl v2 API removed 'mode' parameter
      // Agent capabilities are now built-in by default
    }),
  });

  if (!crawlResponse.ok) {
    const errorText = await crawlResponse.text();
    throw new Error(`Firecrawl API error (${crawlResponse.status}): ${errorText}`);
  }

  const crawlData = await crawlResponse.json();
  const jobId = crawlData.id || crawlData.jobId;

  if (!jobId) {
    throw new Error('Firecrawl did not return a job ID');
  }

  console.log(`✅ Async crawl started: Job ID ${jobId}`);

  // Save job to database for webhook tracking
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error: insertError } = await supabase
    .from('crawl_jobs')
    .insert({
      job_id: jobId,
      source_id: sourceId,
      source_name: sourceName,
      source_url: sourceUrl,
      extractor_type: extractorType,
      status: 'pending',
      metadata: {
        page_limit: pageLimit,
        webhook_url: webhookUrl,
      },
    });

  if (insertError) {
    console.error(`⚠️ Failed to save job to database: ${insertError.message}`);
    // Don't fail the request - the job is running, just not tracked
  }

  // Update source last_crawl_timestamp
  await supabase
    .from('crawl_sources')
    .update({
      last_crawl_timestamp: new Date().toISOString(),
      crawl_completed: false,
    })
    .eq('id', sourceId);

  return {
    success: true,
    jobId,
    status: 'pending',
    message: `Crawl job started for ${sourceName}. Will process ${pageLimit} pages.`,
    checkUrl: `/api/crawl-status/${jobId}`,
  };
}

/**
 * Check status of an async crawl job
 */
export async function getCrawlJobStatus(
  jobId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<any> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: job, error } = await supabase
    .from('crawl_jobs')
    .select('*')
    .eq('job_id', jobId)
    .single();

  if (error || !job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  return {
    jobId: job.job_id,
    sourceName: job.source_name,
    status: job.status,
    pagesCrawled: job.pages_crawled,
    boothsFound: job.booths_found,
    boothsAdded: job.booths_added,
    boothsUpdated: job.booths_updated,
    createdAt: job.created_at,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    crawlDurationMs: job.crawl_duration_ms,
    extractionTimeMs: job.extraction_time_ms,
    errorMessage: job.error_message,
  };
}
