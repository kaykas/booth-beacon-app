/**
 * QUICK TEST: Firecrawl Agent on single simple source
 * Tests extraction on just the Chicago city guide (fastest test case)
 */

import FirecrawlApp from '@mendable/firecrawl-js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;

const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });

async function quickTest() {
  console.log('🚀 QUICK AGENT TEST - Chicago City Guide\n');

  const url = 'https://www.timeout.com/chicago/things-to-do/photo-booths-in-chicago';

  const prompt = `Find ALL analog photo booth locations from this Chicago city guide article.

Extract information including:
- Venue name
- Address
- Neighborhood/area
- Any other details mentioned

Return as JSON array: [{"name": "...", "address": "...", "city": "Chicago", "country": "USA"}]`;

  console.log(`📡 Calling Agent for: ${url}\n`);
  const startTime = Date.now();

  try {
    // @ts-ignore
    const result = await firecrawl.agent({
      prompt,
      url
    });

    const duration = Date.now() - startTime;

    console.log(`✅ Agent completed in ${duration}ms\n`);
    console.log(`📊 Result structure:`);
    console.log(`   success: ${result.success}`);
    console.log(`   status: ${result.status}`);
    console.log(`   creditsUsed: ${result.creditsUsed}`);
    console.log(`   expiresAt: ${result.expiresAt}\n`);

    if (result.data) {
      console.log(`📄 Data type: ${typeof result.data}`);
      console.log(`📄 Data content (first 500 chars):`);
      const dataStr = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
      console.log(dataStr.substring(0, 500));
      console.log('\n...\n');

      // Try to parse booths
      let booths = [];
      try {
        if (typeof result.data === 'string') {
          const jsonMatch = result.data.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            booths = JSON.parse(jsonMatch[0]);
          }
        } else if (Array.isArray(result.data)) {
          booths = result.data;
        } else if (result.data.booths && Array.isArray(result.data.booths)) {
          booths = result.data.booths;
        }

        console.log(`\n🎯 RESULTS:`);
        console.log(`   Booths found: ${booths.length}\n`);

        if (booths.length > 0) {
          console.log(`   Sample booths:\n`);
          booths.slice(0, 3).forEach((booth, i) => {
            console.log(`   ${i + 1}. ${booth.name || 'Unnamed'}`);
            console.log(`      Address: ${booth.address || 'No address'}`);
            console.log(`      City: ${booth.city || 'No city'}\n`);
          });

          // Calculate field completion
          const totalFields = booths.length * 4; // name, address, city, country
          const completedFields = booths.reduce((sum, b) => {
            let completed = 0;
            if (b.name) completed++;
            if (b.address) completed++;
            if (b.city) completed++;
            if (b.country) completed++;
            return sum + completed;
          }, 0);

          const completionRate = (completedFields / totalFields) * 100;
          console.log(`   📊 Field completion: ${completionRate.toFixed(1)}%`);

          console.log(`\n   ✅ SUCCESS! Agent extracted ${booths.length} booths`);
        } else {
          console.log(`   ⚠️  No booths found in data`);
        }

      } catch (parseError: any) {
        console.error(`   ❌ Failed to parse booths: ${parseError.message}`);
      }
    } else {
      console.log(`⚠️  No data in result`);
    }

  } catch (error: any) {
    console.error(`\n❌ Agent failed: ${error.message}`);
    console.error(error.stack);
  }
}

quickTest().catch(console.error);
