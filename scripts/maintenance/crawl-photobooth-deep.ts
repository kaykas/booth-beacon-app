/**
 * DEEP PHOTOBOOTH.NET CRAWLER
 *
 * Uses Firecrawl's crawl feature to:
 * 1. Discover all booth detail pages
 * 2. Scrape each page for complete booth data
 *
 * This gets us: addresses, coordinates, hours, costs, photos, etc.
 */

import { createClient } from '@supabase/supabase-js';
import { FirecrawlAppV1 } from '@mendable/firecrawl-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY || !FIRECRAWL_API_KEY || !ANTHROPIC_API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const firecrawl = new FirecrawlAppV1({ apiKey: FIRECRAWL_API_KEY });

interface BoothData {
  name: string;
  address: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  machine_type?: string;
  cost?: string;
  hours?: string;
  website?: string;
  status?: string;
  photos?: string[];
}

async function extractBoothFromPage(markdown: string, _url: string): Promise<BoothData | null> {
  console.log('  🤖 Extracting booth data with Claude...');

  const prompt = `Extract the photo booth information from this page.

CRITICAL: This is a SINGLE booth detail page. Extract ALL information shown.

Required fields:
- name: The booth name/location name
- address: Full street address (e.g., "2944 Randolph Ave. Costa Mesa, CA 92626")
- city: City name
- country: Country (likely USA)
- lat/lng: Coordinates if shown in map links
- machine_type: Model type (e.g., "Model 21", "Model 11", etc.)
- cost: Cost per strip (e.g., "$5")
- hours: Operating hours if shown
- website: Website URL if present
- status: "active" or "closed"
- photos: Array of photo URLs if present

Content:
${markdown.substring(0, 30000)}

Return ONLY JSON:
{"name": "...", "address": "...", "city": "...", "country": "...", "lat": ..., "lng": ..., "machine_type": "...", "cost": "...", "hours": "...", "website": "...", "status": "active"}`;

  try {
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
      console.error('    ❌ Claude API Error:', response.status, errorBody);
      return null;
    }

    const data = await response.json();
    const text = data.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('    ⚠️  No JSON in response');
      return null;
    }

    const booth = JSON.parse(jsonMatch[0]);
    return booth;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('    ❌ Extraction failed:', message);
    return null;
  }
}

async function deepCrawl() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 DEEP PHOTOBOOTH.NET CRAWLER`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();

  // Get source from database
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('extractor_type', 'photobooth_net')
    .limit(1);

  if (!sources || sources.length === 0) {
    console.error('❌ Source not found');
    return;
  }

  const source = sources[0];
  console.log(`✓ Source: ${source.name}\n`);

  // Use Firecrawl's crawl feature to discover all booth pages
  console.log('📡 Step 1: Discovering all booth pages with Firecrawl crawl...');
  console.log('   This will find all /locations/browse.php pages...\n');

  try {
    const crawlResult = await firecrawl.crawlUrl('https://www.photobooth.net/locations/', {
      maxDepth: 2,
      includePaths: ['browse.php'],
      limit: 50,  // Start with first 50 booths
      scrapeOptions: {
        formats: ['markdown']
      }
    });

    if (!crawlResult.success || !crawlResult.data) {
      console.error('❌ Firecrawl crawl failed');
      return;
    }

    const pages = crawlResult.data;
    console.log(`✓ Found ${pages.length} booth pages\n`);

    // Extract booth data from each page
    console.log('📊 Step 2: Extracting booth data from each page...\n');

    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      console.log(`[${i + 1}/${pages.length}] ${page.url}`);

      const booth = await extractBoothFromPage(page.markdown || '', page.url);

      if (!booth) {
        console.log('  ⚠️  Extraction failed\n');
        failed++;
        continue;
      }

      // Insert into database
      const { error } = await supabase
        .from('booths')
        .insert({
          name: booth.name,
          address: booth.address || '',
          city: booth.city,
          country: booth.country,
          status: booth.status || 'active',
          source_names: [source.name],
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.log(`  ⚠️  Insert failed: ${error.message}\n`);
        failed++;
      } else {
        console.log(`  ✓ ${booth.name} - ${booth.address}\n`);
        inserted++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ DEEP CRAWL COMPLETE`);
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Pages found: ${pages.length}`);
    console.log(`   Booths inserted: ${inserted}`);
    console.log(`   Failed: ${failed}`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Deep crawl failed:', message);
    if (stack) console.error(stack);
  }
}

deepCrawl().catch(console.error);
