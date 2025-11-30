/**
 * Test extraction from a single booth detail page
 */

import { FirecrawlAppV1 } from '@mendable/firecrawl-js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const firecrawl = new FirecrawlAppV1({ apiKey: FIRECRAWL_API_KEY });

const TEST_URL = 'https://www.photobooth.net/locations/browse.php?ddState=5&locationID=786';

async function testSingleBooth() {
  console.log('🧪 Testing single booth extraction\n');
  console.log(`URL: ${TEST_URL}\n`);

  // Scrape the page
  console.log('📡 Scraping with Firecrawl...');
  const scrapeResult = await firecrawl.scrapeUrl(TEST_URL, {
    formats: ['markdown']
  });

  if (!scrapeResult.success) {
    console.error('❌ Scrape failed');
    return;
  }

  console.log(`✓ Scraped ${(scrapeResult.markdown || '').length} chars\n`);

  // Extract with Claude
  console.log('🤖 Extracting with Claude...\n');

  const prompt = `Extract the photo booth information from this page.

This is a SINGLE booth detail page. Extract ALL information shown.

Required fields:
- name: The booth name/location name
- address: Full street address
- city: City name
- country: Country
- lat/lng: Coordinates if in map links
- machine_type: Model type
- cost: Cost per strip
- hours: Operating hours
- website: Website URL
- status: "active" or "closed"

Content:
${(scrapeResult.markdown || '').substring(0, 30000)}

Return ONLY JSON: {"name": "...", "address": "...", "city": "...", "country": "...", "lat": 33.678, "lng": -117.887, "machine_type": "...", "cost": "...", "hours": "...", "website": "...", "status": "active"}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('❌ Claude API Error:', response.status, errorBody);
    return;
  }

  const data = await response.json();
  const text = data.content[0].text;

  console.log('Claude response:', text, '\n');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.log('❌ No JSON found');
    return;
  }

  const booth = JSON.parse(jsonMatch[0]);
  console.log('✅ Extracted booth data:');
  console.log(JSON.stringify(booth, null, 2));
}

testSingleBooth().catch(console.error);
