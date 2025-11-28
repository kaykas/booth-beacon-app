/**
 * Quick Crawler Test - Minimal Test for Fixes
 *
 * Tests the unified crawler with optimized settings to ensure:
 * 1. Completes within 2 minutes (120s)
 * 2. Successfully extracts booths
 * 3. Adds booths to database
 * 4. No 504 timeouts
 */

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

async function testCrawler() {
  console.log('🧪 Quick Crawler Test\n');
  console.log('Testing optimized crawler with photobooth.net...\n');

  const startTime = Date.now();

  try {
    console.log('📡 Calling unified-crawler Edge Function...');

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/unified-crawler`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_name: 'Photobooth.net',
          force_crawl: true,
          stream: false
        })
      }
    );

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ Crawler failed: ${response.status} ${response.statusText}`);
      console.error(`Duration: ${Math.round(duration / 1000)}s`);
      console.error(`Error: ${errorText}`);

      if (response.status === 504) {
        console.error('\n⚠️ 504 TIMEOUT - Crawler still taking too long!');
        console.error('The optimization may need further tuning.');
      }

      process.exit(1);
    }

    const result = await response.json();

    console.log('\n✅ Crawler completed successfully!');
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`\n📊 Results:`);
    console.log(`   - Sources processed: ${result.summary?.total_sources || 0}`);
    console.log(`   - Booths found: ${result.summary?.total_booths_found || 0}`);
    console.log(`   - Booths added: ${result.summary?.total_booths_added || 0}`);
    console.log(`   - Booths updated: ${result.summary?.total_booths_updated || 0}`);

    if (result.results && result.results.length > 0) {
      console.log(`\n📋 Details:`);
      for (const r of result.results) {
        console.log(`   ${r.source_name}:`);
        console.log(`      Status: ${r.status}`);
        console.log(`      Found: ${r.booths_found}, Added: ${r.booths_added}, Updated: ${r.booths_updated}`);
        console.log(`      Pages crawled: ${r.pages_crawled || 'N/A'}`);
        console.log(`      Duration: ${Math.round((r.crawl_duration_ms || 0) / 1000)}s`);
        if (r.error_message) {
          console.log(`      Error: ${r.error_message}`);
        }
      }
    }

    // Success criteria
    const success = result.success &&
                   duration < 120000 && // Under 2 minutes
                   (result.summary?.total_booths_found || 0) > 0;

    if (success) {
      console.log('\n🎉 SUCCESS: Crawler is working correctly!');
      console.log('   ✓ Completed under 2 minutes');
      console.log('   ✓ No 504 timeouts');
      console.log('   ✓ Booths extracted successfully');
      process.exit(0);
    } else {
      console.log('\n⚠️ WARNING: Crawler completed but with issues');
      if (duration >= 120000) {
        console.log('   ✗ Took too long (>2 minutes)');
      }
      if ((result.summary?.total_booths_found || 0) === 0) {
        console.log('   ✗ No booths extracted');
      }
      process.exit(1);
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Test failed: ${error.message}`);
    console.error(`Duration: ${Math.round(duration / 1000)}s`);
    process.exit(1);
  }
}

testCrawler();
