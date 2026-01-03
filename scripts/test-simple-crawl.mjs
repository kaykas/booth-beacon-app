#!/usr/bin/env node

/**
 * Test Async Crawler with Simple Source - Quick E2E Test
 */

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTExOTksImV4cCI6MjA3OTc2NzE5OX0.nVAPKx30OTNSaZ92Koeg_gUonm3Zols3FOTvfO5TrrA';

// Use a simple test URL - try photobooth.net with just 1-2 pages
const TEST_SOURCE = process.argv[2] || 'photobooth.net';
const MAX_PAGES = parseInt(process.argv[3]) || 2;  // Very small for fast testing

async function testAsyncCrawl() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║       ASYNC CRAWLER E2E TEST (SIMPLE)                ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log(`🎯 Testing source: ${TEST_SOURCE}`);
  console.log(`📄 Max pages: ${MAX_PAGES} (small test for speed)`);
  console.log(`📡 Endpoint: ${SUPABASE_URL}/functions/v1/unified-crawler\n`);

  const startTime = Date.now();

  try {
    console.log('⏳ Starting async crawl...\n');

    const requestBody = {
      source_name: TEST_SOURCE,
      async: true,
      force_crawl: true,
      max_pages: MAX_PAGES  // Limit pages for fast testing
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-crawler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Request failed: ${response.status}`);
      console.error(`Error: ${errorText}\n`);
      return;
    }

    const result = await response.json();

    console.log(`✅ Request completed in ${(duration / 1000).toFixed(1)}s\n`);
    console.log('═'.repeat(60));
    console.log('RESPONSE');
    console.log('═'.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    console.log('═'.repeat(60));
    console.log('');

    if (result.jobs && result.jobs.length > 0) {
      const job = result.jobs[0];
      const jobId = job.jobId;

      console.log(`\n🎉 SUCCESS! Async crawl started:`);
      console.log(`   Job ID: ${jobId}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Firecrawl Job ID: ${job.firecrawlJobId || 'N/A'}\n`);

      console.log('💡 The crawl is now running in the background.');
      console.log(`   Limited to ${MAX_PAGES} pages for fast testing.\n`);

      console.log('📊 To check status manually:');
      console.log(`   curl "${SUPABASE_URL}/rest/v1/crawl_jobs?job_id=eq.${jobId}&select=*" \\`);
      console.log(`     -H "apikey: ${ANON_KEY.substring(0, 30)}..."\n`);

      // Poll for status
      console.log('⏱️  Polling for status (will check every 5 seconds for 3 minutes)...\n');
      await pollJobStatus(jobId, 180000);  // Poll for 3 minutes

    } else if (result.error) {
      console.log(`⚠️  Error from API: ${result.error}`);
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    } else {
      console.log('⚠️  No jobs returned (unexpected response format)');
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Exception after ${(duration / 1000).toFixed(1)}s:`);
    console.error(`   ${error.message}`);
    console.error(`   Stack: ${error.stack}\n`);
  }
}

async function pollJobStatus(jobId, maxDuration) {
  const startTime = Date.now();
  const interval = 5000;  // 5 seconds

  while (Date.now() - startTime < maxDuration) {
    await new Promise(resolve => setTimeout(resolve, interval));

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/crawl_jobs?job_id=eq.${jobId}&select=*`,
        {
          headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const job = data[0];
          const elapsed = Math.round((Date.now() - startTime) / 1000);

          console.log(`[${elapsed}s] Status: ${job.status} | Pages: ${job.pages_crawled || 0} | Booths: ${job.booths_added || 0} | Firecrawl Job: ${job.firecrawl_job_id || 'N/A'}`);

          if (job.status === 'completed') {
            console.log('\n✅ JOB COMPLETED!');
            console.log(`   Pages crawled: ${job.pages_crawled}`);
            console.log(`   Booths found: ${job.booths_found}`);
            console.log(`   Booths added: ${job.booths_added}`);
            console.log(`   Booths updated: ${job.booths_updated}`);
            console.log(`   Duration: ${(job.crawl_duration_ms / 1000).toFixed(1)}s`);

            if (job.error_message) {
              console.log(`   ⚠️  Error message: ${job.error_message}`);
            }

            // Check if any booths were actually added
            if (job.booths_added > 0) {
              console.log('\n🎊 SUCCESS! Booths were extracted and saved!\n');
            } else {
              console.log('\n⚠️  Job completed but no booths were added.\n');
            }
            return;
          }

          if (job.status === 'failed') {
            console.log(`\n❌ JOB FAILED!`);
            console.log(`   Error: ${job.error_message}`);
            console.log(`   Duration: ${(job.crawl_duration_ms / 1000).toFixed(1)}s\n`);
            return;
          }
        }
      }
    } catch (error) {
      console.error(`⚠️  Polling error: ${error.message}`);
    }
  }

  console.log('\n⏱️  Polling timeout - job still running. Check later with:');
  console.log(`   SELECT * FROM crawl_jobs WHERE job_id = '${jobId}';\n`);
}

// Run test
console.log('');
testAsyncCrawl();
