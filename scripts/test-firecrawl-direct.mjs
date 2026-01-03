#!/usr/bin/env node

/**
 * Test Firecrawl API directly to debug crawling issues
 */

const FIRECRAWL_API_KEY = 'fc-cd227b1042ab42c38f1c03d095d9de0b';
const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';

// Test URLs - try a simple one first
const TEST_URLS = [
  'https://www.photobooth.net/locations/photo.php?PhotographID=1',  // Single booth page
  'http://www.photobooth.net/locations/browse.php?ddState=0',        // Browse page (problematic)
  'https://www.lomography.com/magazine/334637-a-guide-to-analog-photo-booths-in-new-york-city', // Lomography
];

const TEST_URL = process.argv[2] || TEST_URLS[0];

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║    FIRECRAWL API DIRECT TEST                             ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log(`🎯 Testing URL: ${TEST_URL}\n`);

async function testFirecrawlAsync() {
  console.log('📡 Starting async crawl with Firecrawl...\n');

  const webhookUrl = `${SUPABASE_URL}/functions/v1/firecrawl-webhook`;

  try {
    const startTime = Date.now();

    const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: TEST_URL,
        limit: 2,  // Only 2 pages
        scrapeOptions: {
          formats: ['markdown', 'html'],
          onlyMainContent: false,
          waitFor: 8000,
        },
        webhook: webhookUrl,
      }),
    });

    const duration = Date.now() - startTime;

    console.log(`⏱️  Request completed in ${(duration / 1000).toFixed(1)}s\n`);
    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:');
      console.error(errorText);
      return;
    }

    const data = await response.json();

    console.log('✅ Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    if (data.id || data.jobId) {
      const jobId = data.id || data.jobId;
      console.log(`🎉 Crawl started successfully!`);
      console.log(`   Job ID: ${jobId}`);
      console.log(`   Status: ${data.status || 'unknown'}`);
      console.log(`   Webhook: ${webhookUrl}\n`);

      console.log('💡 The webhook should receive updates as the crawl progresses.');
      console.log('   Check logs with: supabase functions logs firecrawl-webhook\n');

      // Poll the job status
      console.log('⏱️  Polling Firecrawl job status...\n');
      await pollFirecrawlStatus(jobId, 180000); // 3 minutes
    } else {
      console.log('⚠️  No job ID returned (unexpected)');
    }

  } catch (error) {
    console.error('❌ Exception:', error.message);
    console.error(error.stack);
  }
}

async function pollFirecrawlStatus(jobId, maxDuration) {
  const startTime = Date.now();
  const interval = 5000; // 5 seconds

  while (Date.now() - startTime < maxDuration) {
    await new Promise(resolve => setTimeout(resolve, interval));

    try {
      const response = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const elapsed = Math.round((Date.now() - startTime) / 1000);

        const status = data.status || 'unknown';
        const total = data.total || 0;
        const completed = data.completed || 0;
        const creditsUsed = data.creditsUsed || 0;

        console.log(`[${elapsed}s] Status: ${status} | Progress: ${completed}/${total} | Credits: ${creditsUsed}`);

        if (status === 'completed') {
          console.log('\n✅ FIRECRAWL JOB COMPLETED!');
          console.log(`   Total pages: ${total}`);
          console.log(`   Completed: ${completed}`);
          console.log(`   Credits used: ${creditsUsed}`);

          if (data.data && data.data.length > 0) {
            console.log(`   ✅ Pages returned: ${data.data.length}\n`);
            console.log('Sample page data:');
            const samplePage = data.data[0];
            console.log(`  URL: ${samplePage.url || samplePage.sourceURL || 'N/A'}`);
            console.log(`  Markdown length: ${(samplePage.markdown || '').length} chars`);
            console.log(`  HTML length: ${(samplePage.html || '').length} chars`);
          } else {
            console.log(`   ⚠️  NO PAGES RETURNED!\n`);
          }

          return;
        }

        if (status === 'failed') {
          console.log(`\n❌ FIRECRAWL JOB FAILED!`);
          console.log(`   Error: ${data.error || 'Unknown error'}\n`);
          return;
        }

      } else {
        console.log(`⚠️  HTTP ${response.status}: ${await response.text()}`);
      }

    } catch (error) {
      console.error(`⚠️  Polling error: ${error.message}`);
    }
  }

  console.log('\n⏱️  Polling timeout - job might still be running\n');
}

// Run test
testFirecrawlAsync();
