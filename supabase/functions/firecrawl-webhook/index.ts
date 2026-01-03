import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FirecrawlWebhookPayload {
  success: boolean;
  type: 'crawl.started' | 'crawl.page' | 'crawl.completed' | 'crawl.failed';
  id: string;  // Job ID
  data?: {
    url?: string;
    markdown?: string;
    html?: string;
    metadata?: any;
  }[];
  error?: string;
  metadata?: {
    source_id?: string;
    source_name?: string;
    extractor_type?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔔 Firecrawl webhook received");

    // NOTE: This endpoint is intentionally public to receive webhooks from Firecrawl
    // No authentication required - webhooks are validated by checking job_id exists in database

    // Parse webhook payload
    const payload: FirecrawlWebhookPayload = await req.json();
    console.log(`📦 Event type: ${payload.type}, Job ID: ${payload.id}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get job details from database
    const { data: job, error: jobError } = await supabase
      .from("crawl_jobs")
      .select("*")
      .eq("job_id", payload.id)
      .single();

    if (jobError || !job) {
      console.error(`❌ Job not found: ${payload.id}`, jobError);
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found job for source: ${job.source_name}`);

    // Handle different event types
    switch (payload.type) {
      case 'crawl.started':
        await handleCrawlStarted(supabase, job, payload);
        break;

      case 'crawl.page':
        await handleCrawlPage(supabase, job, payload);
        break;

      case 'crawl.completed':
        await handleCrawlCompleted(supabase, job, payload);
        break;

      case 'crawl.failed':
        await handleCrawlFailed(supabase, job, payload);
        break;

      default:
        console.warn(`⚠️ Unknown event type: ${payload.type}`);
    }

    return new Response(
      JSON.stringify({ success: true, received: payload.type }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Webhook error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleCrawlStarted(supabase: any, job: any, payload: FirecrawlWebhookPayload) {
  console.log(`🚀 Crawl started for job ${job.job_id}`);

  await supabase
    .from("crawl_jobs")
    .update({
      status: "crawling",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("job_id", job.job_id);
}

async function handleCrawlPage(supabase: any, job: any, payload: FirecrawlWebhookPayload) {
  console.log(`📄 Page received for job ${job.job_id}`);

  // Increment pages crawled
  await supabase
    .from("crawl_jobs")
    .update({
      pages_crawled: (job.pages_crawled || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("job_id", job.job_id);

  // Optionally: Store page data for incremental processing
  if (payload.data && payload.data.length > 0) {
    const page = payload.data[0];

    // Save raw page content
    await supabase
      .from("crawl_raw_content")
      .insert({
        source_id: job.source_id,
        job_id: job.job_id,
        url: page.url,
        raw_markdown: page.markdown,
        raw_html: page.html,
        metadata: page.metadata,
        crawled_at: new Date().toISOString(),
      });
  }
}

async function handleCrawlCompleted(supabase: any, job: any, payload: FirecrawlWebhookPayload) {
  console.log(`✅ Crawl completed for job ${job.job_id}`);
  console.log(`📡 Fetching pages from Firecrawl API...`);

  const completedAt = new Date().toISOString();
  const startedAt = new Date(job.started_at || job.created_at);
  const durationMs = Date.now() - startedAt.getTime();

  // Fetch pages from Firecrawl API (v1 webhooks don't include page data)
  let pages: any[] = [];
  try {
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY")!;
    const firecrawlResponse = await fetch(
      `https://api.firecrawl.dev/v1/crawl/${payload.id}`,
      {
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`
        }
      }
    );

    if (!firecrawlResponse.ok) {
      throw new Error(`Firecrawl API error: ${firecrawlResponse.status} ${await firecrawlResponse.text()}`);
    }

    const crawlData = await firecrawlResponse.json();
    pages = crawlData.data || [];
    console.log(`📊 Fetched ${pages.length} pages from Firecrawl`);

  } catch (fetchError: any) {
    console.error(`❌ Failed to fetch pages from Firecrawl:`, fetchError.message);

    await supabase
      .from("crawl_jobs")
      .update({
        status: "failed",
        error_message: `Failed to fetch pages from Firecrawl: ${fetchError.message}`,
        completed_at: completedAt,
        updated_at: completedAt,
        crawl_duration_ms: durationMs,
      })
      .eq("job_id", job.job_id);
    return;
  }

  // Update job status
  await supabase
    .from("crawl_jobs")
    .update({
      status: "processing",
      pages_crawled: pages.length,
      completed_at: completedAt,
      updated_at: completedAt,
      crawl_duration_ms: durationMs,
    })
    .eq("job_id", job.job_id);

  // Now process the pages and extract booths
  if (pages.length > 0) {
    console.log(`🔄 Processing ${pages.length} pages...`);

    try {
      // Import extraction function
      const { extractBooths } = await import("../unified-crawler/extractor-processor.ts");

      const result = await extractBooths({
        pages: pages,
        sourceId: job.source_id,
        sourceName: job.source_name,
        sourceUrl: job.source_url,
        extractorType: job.extractor_type,
        anthropicApiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
      });

      console.log(`✅ Extraction complete: ${result.booths_found} found, ${result.booths_added} added`);

      // Update job with results
      await supabase
        .from("crawl_jobs")
        .update({
          status: "completed",
          booths_found: result.booths_found,
          booths_added: result.booths_added,
          booths_updated: result.booths_updated,
          extraction_time_ms: result.extraction_time_ms,
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", job.job_id);

      // Update source last_crawl_timestamp
      await supabase
        .from("crawl_sources")
        .update({
          last_crawl_timestamp: completedAt,
          crawl_completed: true,
        })
        .eq("id", job.source_id);

      console.log(`🎉 Job ${job.job_id} fully completed`);

    } catch (extractionError: any) {
      console.error(`❌ Extraction failed:`, extractionError.message);

      await supabase
        .from("crawl_jobs")
        .update({
          status: "failed",
          error_message: extractionError.message,
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", job.job_id);
    }
  } else {
    // No pages crawled - mark as completed with no results
    console.warn(`⚠️ Firecrawl returned 0 pages for job ${job.job_id}`);

    await supabase
      .from("crawl_jobs")
      .update({
        status: "completed",
        booths_found: 0,
        booths_added: 0,
        booths_updated: 0,
        error_message: "Firecrawl returned 0 pages (site may block crawlers or have no content)",
        updated_at: new Date().toISOString(),
      })
      .eq("job_id", job.job_id);
  }
}

async function handleCrawlFailed(supabase: any, job: any, payload: FirecrawlWebhookPayload) {
  console.error(`❌ Crawl failed for job ${job.job_id}: ${payload.error}`);

  await supabase
    .from("crawl_jobs")
    .update({
      status: "failed",
      error_message: payload.error,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("job_id", job.job_id);
}
