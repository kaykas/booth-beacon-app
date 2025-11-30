/**
 * BATCH DIRECT CRAWLER - All Sources
 * Bypasses Edge Function timeout by running locally
 * Processes ALL enabled sources in the database
 */

import { createClient } from '@supabase/supabase-js';
import { FirecrawlAppV1 } from '@mendable/firecrawl-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY || !FIRECRAWL_API_KEY || !ANTHROPIC_API_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: SUPABASE_SERVICE_ROLE_KEY, FIRECRAWL_API_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const firecrawl = new FirecrawlAppV1({ apiKey: FIRECRAWL_API_KEY });

interface BoothData {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  machine_type?: string;
  machine_model?: string;
  cost?: string;
  description?: string;
  website?: string;
  status?: string;
}

interface CrawlResult {
  sourceName: string;
  sourceUrl: string;
  success: boolean;
  boothsFound: number;
  boothsInserted: number;
  duration: number;
  error?: string;
}

async function extractBoothsFromContent(content: string, sourceUrl: string): Promise<BoothData[]> {
  console.log('  🤖 Extracting booths with Claude AI...');

  const prompt = `Extract ALL analog photo booth locations from this content. Return a JSON array of booths.

CRITICAL RULES:
- ONLY include real physical photo booth locations
- MUST have a name and location (city/address)
- Include ALL booths mentioned, don't skip any
- If coordinates aren't explicitly stated, leave lat/lng empty
- Mark status as "active" if currently operating, "closed" if mentioned as closed

Content:
${content.substring(0, 50000)}

Return ONLY a JSON array like: [{"name": "...", "address": "...", "city": "...", "country": "...", "lat": ..., "lng": ..., "machine_type": "...", "cost": "...", "status": "active"}]`;

  try {
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
      const errorBody = await response.text();
      console.error('  ❌ Claude API Error:', response.status, errorBody);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('  ⚠️  No JSON found in Claude response');
      return [];
    }

    const booths = JSON.parse(jsonMatch[0]);
    console.log(`  ✓ Extracted ${booths.length} booths`);
    return booths;

  } catch (error: any) {
    console.error('  ❌ Extraction failed:', error.message);
    return [];
  }
}

async function crawlSource(source: any): Promise<CrawlResult> {
  const startTime = Date.now();
  const result: CrawlResult = {
    sourceName: source.name,
    sourceUrl: source.source_url,
    success: false,
    boothsFound: 0,
    boothsInserted: 0,
    duration: 0
  };

  console.log(`\n📍 ${source.name}`);
  console.log(`   URL: ${source.source_url}`);

  try {
    // Crawl with Firecrawl
    console.log('  📡 Crawling with Firecrawl...');

    const scrapeResult = await firecrawl.scrapeUrl(source.source_url, {
      formats: ['markdown', 'html']
    });

    if (!scrapeResult.success) {
      throw new Error('Firecrawl scrape failed');
    }

    console.log(`  ✓ Crawled successfully (${(scrapeResult.markdown || '').length} chars)`);

    // Extract booths
    const booths = await extractBoothsFromContent(scrapeResult.markdown || '', source.source_url);
    result.boothsFound = booths.length;

    if (booths.length === 0) {
      console.log('  ⚠️  No booths extracted');
      result.success = true; // Not an error, just no data
      result.duration = Date.now() - startTime;
      return result;
    }

    // Insert booths
    console.log(`  💾 Inserting ${booths.length} booths...`);

    let inserted = 0;
    for (const booth of booths) {
      const { error } = await supabase
        .from('booths')
        .insert({
          name: booth.name,
          address: booth.address || '',
          city: booth.city,
          country: booth.country,
          status: booth.status || 'active',
          source_id: source.id,
          source_names: [source.name],
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.log(`     ⚠️  Failed to insert ${booth.name}: ${error.message}`);
      } else {
        inserted++;
        console.log(`     ✓ ${booth.name} in ${booth.city}, ${booth.country}`);
      }
    }

    result.boothsInserted = inserted;
    result.success = true;
    result.duration = Date.now() - startTime;

    console.log(`  ✅ Complete: ${inserted}/${booths.length} booths inserted (${(result.duration / 1000).toFixed(1)}s)`);

    return result;

  } catch (error: any) {
    result.error = error.message;
    result.duration = Date.now() - startTime;
    console.error(`  ❌ Failed: ${error.message}`);
    return result;
  }
}

async function crawlAllSources() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 BATCH DIRECT CRAWLER - All Enabled Sources`);
  console.log(`${'='.repeat(80)}\n`);

  const batchStartTime = Date.now();

  // Get all enabled sources
  console.log('📊 Fetching enabled sources from database...\n');

  const { data: sources, error: sourceError } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: false });

  if (sourceError || !sources || sources.length === 0) {
    console.error('❌ Failed to fetch sources:', sourceError || 'No enabled sources');
    return;
  }

  console.log(`✓ Found ${sources.length} enabled sources\n`);
  console.log(`${'='.repeat(80)}\n`);

  // Process each source
  const results: CrawlResult[] = [];

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    console.log(`[${i + 1}/${sources.length}] Processing: ${source.name}`);

    const result = await crawlSource(source);
    results.push(result);

    // Small delay between sources to avoid rate limits
    if (i < sources.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  const totalDuration = Date.now() - batchStartTime;
  const successCount = results.filter(r => r.success).length;
  const totalBoothsFound = results.reduce((sum, r) => sum + r.boothsFound, 0);
  const totalBoothsInserted = results.reduce((sum, r) => sum + r.boothsInserted, 0);
  const failedResults = results.filter(r => !r.success);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 BATCH CRAWL COMPLETE`);
  console.log(`${'='.repeat(80)}`);
  console.log(`   Total sources: ${sources.length}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${failedResults.length}`);
  console.log(`   Total booths found: ${totalBoothsFound}`);
  console.log(`   Total booths inserted: ${totalBoothsInserted}`);
  console.log(`   Total duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);

  if (failedResults.length > 0) {
    console.log(`\n❌ Failed Sources:`);
    failedResults.forEach(r => {
      console.log(`   - ${r.sourceName}: ${r.error}`);
    });
  }

  console.log(`\n✅ Top Performers:`);
  results
    .filter(r => r.boothsInserted > 0)
    .sort((a, b) => b.boothsInserted - a.boothsInserted)
    .slice(0, 10)
    .forEach(r => {
      console.log(`   - ${r.sourceName}: ${r.boothsInserted} booths (${(r.duration / 1000).toFixed(1)}s)`);
    });

  console.log(`${'='.repeat(80)}\n`);
}

// Run batch crawler
crawlAllSources().catch(console.error);
