/**
 * Simple diagnostic test for Firecrawl Agent endpoint
 * Tests if Agent is available and what the correct endpoint is
 */

import FirecrawlApp from '@mendable/firecrawl-js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;

if (!FIRECRAWL_API_KEY) {
  console.error('❌ Missing FIRECRAWL_API_KEY');
  process.exit(1);
}

const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });

async function testAgentAvailability() {
  console.log('🔍 Testing Firecrawl Agent Availability\n');

  // Test 1: Check SDK methods
  console.log('1️⃣ Checking SDK methods:');
  console.log(`   firecrawl.scrapeUrl: ${typeof firecrawl.scrapeUrl}`);
  console.log(`   firecrawl.crawlUrl: ${typeof firecrawl.crawlUrl}`);
  // @ts-ignore
  console.log(`   firecrawl.agent: ${typeof firecrawl.agent}`);

  // Test 2: Try SDK agent method if available
  // @ts-ignore
  if (typeof firecrawl.agent === 'function') {
    console.log('\n2️⃣ Agent method found in SDK! Testing...\n');
    try {
      // @ts-ignore
      const result = await firecrawl.agent({
        prompt: 'Find one photo booth in Chicago',
        url: 'https://www.timeout.com/chicago/things-to-do/photo-booths-in-chicago'
      });
      console.log('✅ Agent request succeeded!');
      console.log(`Result type: ${typeof result}`);
      console.log(`Result keys: ${Object.keys(result).join(', ')}`);
    } catch (error: any) {
      console.error(`❌ Agent request failed: ${error.message}`);
    }
  } else {
    console.log('\n2️⃣ Agent method NOT found in SDK\n');
  }

  // Test 3: Try different API endpoints
  console.log('\n3️⃣ Testing API endpoints directly:\n');

  const endpoints = [
    'https://api.firecrawl.dev/v0/agent',
    'https://api.firecrawl.dev/v1/agent',
    'https://api.firecrawl.dev/v2/agent',
    'https://api.firecrawl.dev/agent'
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          prompt: 'Find one photo booth',
          url: 'https://www.timeout.com/chicago/things-to-do/photo-booths-in-chicago'
        })
      });

      console.log(`  Status: ${response.status}`);

      if (response.status !== 404) {
        const text = await response.text();
        console.log(`  Response: ${text.substring(0, 200)}`);
      }

      if (response.ok) {
        console.log('  ✅ This endpoint works!\n');
        break;
      } else {
        console.log(`  ❌ Failed\n`);
      }
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  // Test 4: Check Firecrawl docs/status
  console.log('\n4️⃣ Additional checks:');
  console.log('   - Check https://docs.firecrawl.dev/features/agent for latest info');
  console.log('   - Check https://www.firecrawl.dev/changelog for Agent release status');
  console.log('   - Agent may be in limited preview/beta access only');
  console.log('   - May need to contact Firecrawl support for early access\n');
}

testAgentAvailability().catch(console.error);
