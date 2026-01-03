#!/usr/bin/env node

/**
 * End-to-End Async Crawler Test
 * Tests: unified-crawler -> Firecrawl -> webhook -> booth extraction
 */

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5MTE5OSwiZXhwIjoyMDc5NzY3MTk5fQ.Mlg7UpJZ1nFnfOv5EUt9CfuRIgJYU_aXaoRa5tCMFWk';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTExOTksImV4cCI6MjA3OTc2NzE5OX0.nVAPKx30OTNSaZ92Koeg_gUonm3Zols3FOTvfO5TrrA';

// Use a URL that we KNOW works with Firecrawl
const TEST_URL = 'https://www.photobooth.net/locations/photo.php?PhotographID=1';
const TEST_SOURCE_NAME = 'test-single-booth-page';

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║       ASYNC CRAWLER END-TO-END TEST                           ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('This test verifies:');
console.log('  1️⃣  unified-crawler starts job (<5s response)');
console.log('  2️⃣  Firecrawl crawls the page');
console.log('  3️⃣  Webhook receives callback');
console.log('  4️⃣  Booths are extracted and saved');
console.log('  5️⃣  Job completes with results\n');

console.log(`🎯 Test URL: ${TEST_URL}`);
console.log(`📝 Source name: ${TEST_SOURCE_NAME}\n`);

async function runE2ETest() {
  const startTime = Date.now();

  try {
    // Step 1: Start async crawl via unified-crawler
    console.log('═'.repeat(70));
    console.log('STEP 1: Starting async crawl via unified-crawler');
    console.log('═'.repeat(70));

    const crawlResponse = await fetch(`${SUPABASE_URL}/functions/v1/unified-crawler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_name: TEST_SOURCE_NAME,
        source_url: TEST_URL,
        extractor_type: 'photobooth_net',
        async: true,
        force_crawl: true,
        max_pages: 1,
      }),
    });

    const crawlDuration = Date.now() - startTime;

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text();
      console.error(`❌ Crawler failed: ${crawlResponse.status}`);
      console.error(errorText);
      return;
    }

    const result = await crawlResponse.json();
    console.log(`\n✅ Response received in ${(crawlDuration / 1000).toFixed(1)}s`);
    console.log(JSON.stringify(result, null, 2));

    if (!result.jobs || result.jobs.length === 0) {
      console.log('\n❌ No jobs returned\n');
      return;
    }

    const job = result.jobs[0];
    const jobId = job.jobId;
    const firecrawlJobId = job.firecrawlJobId;

    console.log(`\n🎉 Job started successfully!`);
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Firecrawl Job ID: ${firecrawlJobId || 'N/A'}`);
    console.log(`   Status: ${job.status}\n`);

    // Step 2: Poll job status
    console.log('═'.repeat(70));
    console.log('STEP 2: Monitoring job progress (polling every 5s for 3 minutes)');
    console.log('═'.repeat(70));
    console.log('');

    await pollJobStatus(jobId, 180000);  // 3 minutes

    // Step 3: Verify results
    console.log('\n═'.repeat(70));
    console.log('STEP 3: Verifying results');
    console.log('═'.repeat(70));

    await verifyResults(jobId);

    const totalDuration = Date.now() - startTime;
    console.log(`\n🏁 Test completed in ${(totalDuration / 1000).toFixed(1)}s\n`);

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    console.error(error.stack);
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

          const statusEmoji = job.status === 'completed' ? '✅' :
                             job.status === 'failed' ? '❌' :
                             job.status === 'crawling' ? '🔄' :
                             job.status === 'processing' ? '⚙️' : '⏳';

          console.log(`[${elapsed}s] ${statusEmoji} ${job.status.toUpperCase()} | Pages: ${job.pages_crawled || 0} | Booths: ${job.booths_added || 0}`);

          if (job.status === 'completed') {
            console.log('\n✅ JOB COMPLETED!');
            console.log(`   Pages crawled: ${job.pages_crawled || 0}`);
            console.log(`   Booths found: ${job.booths_found || 0}`);
            console.log(`   Booths added: ${job.booths_added || 0}`);
            console.log(`   Booths updated: ${job.booths_updated || 0}`);
            console.log(`   Duration: ${((job.crawl_duration_ms || 0) / 1000).toFixed(1)}s`);

            if (job.booths_added > 0) {
              console.log('\n🎊 SUCCESS! Booths were extracted and saved!');
            } else {
              console.log('\n⚠️  Job completed but no booths were added.');
              if (job.error_message) {
                console.log(`   Error: ${job.error_message}`);
              }
            }
            return true;
          }

          if (job.status === 'failed') {
            console.log(`\n❌ JOB FAILED: ${job.error_message || 'Unknown error'}`);
            return false;
          }
        }
      }
    } catch (error) {
      console.error(`⚠️  Polling error: ${error.message}`);
    }
  }

  console.log('\n⏱️  Polling timeout (job still running)');
  return false;
}

async function verifyResults(jobId) {
  try {
    // Get final job state
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

        console.log('\n📊 Final Job State:');
        console.log(JSON.stringify(job, null, 2));

        // Check if booths were added
        if (job.booths_added > 0) {
          console.log('\n✅ E2E TEST PASSED!');
          console.log('   The async crawler system works end-to-end:');
          console.log('   ✓ Job created');
          console.log('   ✓ Firecrawl crawled pages');
          console.log('   ✓ Webhook received callback');
          console.log('   ✓ Booths extracted and saved');
          console.log('   ✓ Job completed successfully');
          return true;
        } else {
          console.log('\n⚠️  E2E TEST INCOMPLETE');
          console.log('   Job completed but no booths were extracted.');
          console.log('   This might indicate an extractor issue.');
          return false;
        }
      }
    }
  } catch (error) {
    console.error(`Error verifying results: ${error.message}`);
    return false;
  }
}

// Run test
runE2ETest();
