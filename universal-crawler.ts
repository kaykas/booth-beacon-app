/**
 * UNIVERSAL CRAWLER
 *
 * Works on ANY booth source using:
 * 1. Firecrawl (handles JS rendering, any page structure)
 * 2. Claude Opus (extracts booth data from any format)
 *
 * Can crawl ALL 38 sources without custom logic per source.
 */

import { createClient } from '@supabase/supabase-js';
import { FirecrawlAppV1 } from '@mendable/firecrawl-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const firecrawl = new FirecrawlAppV1({ apiKey: FIRECRAWL_API_KEY });

interface BoothData {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

async function extractBooths(markdown: string, url: string): Promise<BoothData[]> {
  const prompt = `Extract ALL analog photo booth locations from this webpage content.

CRITICAL RULES:
- Extract EVERY booth/location mentioned
- Include partial data (even if just name + city)
- For articles: extract booths mentioned in the text
- For directories: extract all listed locations
- For company sites: extract all their booth locations

Content:
${markdown.substring(0, 80000)}

Return ONLY a JSON array: [{"name": "...", "address": "...", "city": "...", "country": "..."}]

If NO booths found, return: []`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);

  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

async function crawlSource(sourceId: string, sourceName: string, url: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 ${sourceName}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Firecrawl handles JS rendering automatically
    console.log(`📡 Firecrawl: ${url}`);
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown']
    });

    if (!result.success || !result.markdown) {
      console.log(`⚠️  Firecrawl failed\n`);
      return { source: sourceName, found: 0, inserted: 0 };
    }

    console.log(`✓ Scraped ${result.markdown.length} chars\n`);

    // Claude extracts booths from ANY format
    console.log(`🤖 Claude extracting...`);
    const booths = await extractBooths(result.markdown, url);
    console.log(`✓ Found ${booths.length} booths\n`);

    if (booths.length === 0) {
      return { source: sourceName, found: 0, inserted: 0 };
    }

    // Insert booths
    console.log(`💾 Inserting...`);
    let inserted = 0;

    for (const booth of booths) {
      const { error } = await supabase
        .from('booths')
        .insert({
          name: booth.name,
          address: booth.address || '',
          city: booth.city,
          country: booth.country,
          status: 'active',
          source_names: [sourceName],
          created_at: new Date().toISOString(),
        });

      if (!error) {
        inserted++;
        console.log(`  ✓ ${booth.name}${booth.city ? ` - ${booth.city}` : ''}`);
      }
    }

    console.log(`\n✅ ${sourceName}: ${inserted}/${booths.length} inserted\n`);
    return { source: sourceName, found: booths.length, inserted };

  } catch (error: any) {
    console.error(`❌ ${sourceName} failed:`, error.message);
    return { source: sourceName, found: 0, inserted: 0, error: error.message };
  }
}

async function crawlAllSources() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 UNIVERSAL CRAWLER - ALL SOURCES`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();

  // Get all enabled sources
  const { data: sources } = await supabase
    .from('crawl_sources')
    .select('id, name, source_url')
    .eq('enabled', true)
    .order('name');

  if (!sources || sources.length === 0) {
    console.error('❌ No sources found');
    return;
  }

  console.log(`✓ Found ${sources.length} enabled sources\n`);

  const results = [];

  // Crawl ALL sources sequentially (can parallelize later)
  for (const source of sources) {  // Process all sources
    const result = await crawlSource(source.id, source.name, source.source_url);
    results.push(result);

    // Small delay between sources to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const duration = Date.now() - startTime;
  const totalFound = results.reduce((sum, r) => sum + r.found, 0);
  const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ COMPLETE`);
  console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
  console.log(`   Sources crawled: ${results.length}`);
  console.log(`   Booths found: ${totalFound}`);
  console.log(`   Booths inserted: ${totalInserted}`);
  console.log(`${'='.repeat(80)}\n`);

  console.log(`\nResults by source:`);
  results.forEach(r => {
    console.log(`  ${r.source}: ${r.inserted}/${r.found}${r.error ? ` (${r.error})` : ''}`);
  });
}

crawlAllSources().catch(console.error);
