/**
 * TEST AUTOPHOTO FIXED URL
 * Verify the /booth-locator URL works correctly
 */

import { createClient } from '@supabase/supabase-js';
import { FirecrawlAppV1 } from '@mendable/firecrawl-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const firecrawl = new FirecrawlAppV1({ apiKey: FIRECRAWL_API_KEY });

async function testAutophoto() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING AUTOPHOTO FIXED URL');
  console.log('='.repeat(80) + '\n');

  const testURL = 'https://autophoto.org/booth-locator';
  console.log(`Testing: ${testURL}\n`);

  try {
    // Step 1: Crawl with Firecrawl
    console.log('📡 Step 1: Crawling with Firecrawl...');
    const scrapeResult = await firecrawl.scrapeUrl(testURL, {
      formats: ['markdown', 'html']
    });

    if (!scrapeResult.success) {
      console.error('❌ Firecrawl failed');
      return;
    }

    const contentLength = (scrapeResult.markdown || '').length;
    console.log(`✅ Crawled successfully: ${contentLength} chars\n`);

    // Show first 500 chars to see what we got
    console.log('📄 Content Preview (first 500 chars):');
    console.log('-'.repeat(80));
    console.log((scrapeResult.markdown || '').substring(0, 500));
    console.log('-'.repeat(80) + '\n');

    // Step 2: Extract booths with Claude
    console.log('🤖 Step 2: Extracting booths with Claude AI...');

    const prompt = `Extract ALL analog photo booth locations from this content. Return a JSON array of booths.

CRITICAL RULES:
- ONLY include real physical photo booth locations
- MUST have a name and location (city/address)
- Include ALL booths mentioned, don't skip any
- If coordinates aren't explicitly stated, leave lat/lng empty
- Mark status as "active" if currently operating, "closed" if mentioned as closed

Content:
${(scrapeResult.markdown || '').substring(0, 50000)}

Return ONLY a JSON array like: [{"name": "...", "address": "...", "city": "...", "country": "...", "lat": ..., "lng": ..., "machine_type": "...", "cost": "...", "status": "active"}]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.error('❌ Claude API error:', response.status);
      return;
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('⚠️  No JSON found in Claude response');
      console.log('Claude Response:');
      console.log(text);
      return;
    }

    const booths = JSON.parse(jsonMatch[0]);
    console.log(`✅ Extracted ${booths.length} booths\n`);

    if (booths.length > 0) {
      console.log('🎉 SUCCESS! Sample booths extracted:');
      console.log('='.repeat(80));
      booths.slice(0, 10).forEach((booth: any, i: number) => {
        console.log(`${i + 1}. ${booth.name || 'Unnamed'}`);
        console.log(`   ${booth.address || 'No address'}`);
        console.log(`   ${booth.city || 'No city'}, ${booth.country || 'No country'}`);
        console.log('');
      });
      console.log('='.repeat(80));
      console.log(`\n✅ FIXED! Autophoto now extracting ${booths.length} booths`);
      console.log('   Previous: 0 booths (wrong URL)');
      console.log('   Now: ${booths.length} booths (correct URL)');
    } else {
      console.log('⚠️  Still 0 booths - may need different extraction approach');
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testAutophoto().catch(console.error);
