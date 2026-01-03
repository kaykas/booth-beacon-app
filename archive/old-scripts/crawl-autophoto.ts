/**
 * DIRECT CRAWLER - Autophoto Chicago
 * Bypasses Edge Function timeout by running locally
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

async function extractBoothsFromContent(content: string, sourceUrl: string): Promise<BoothData[]> {
  console.log('🤖 Extracting booths with Claude AI...');

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
      console.error('Claude API Error:', response.status, errorBody);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('⚠️  No JSON found in Claude response');
      return [];
    }

    const booths = JSON.parse(jsonMatch[0]);
    console.log(`✓ Extracted ${booths.length} booths`);
    return booths;

  } catch (error: any) {
    console.error('❌ Extraction failed:', error.message);
    return [];
  }
}

async function crawlSource(sourceName: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 DIRECT CRAWLER - ${sourceName}`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();

  // Get source from database
  const { data: sources, error: sourceError } = await supabase
    .from('crawl_sources')
    .select('*')
    .ilike('name', `%${sourceName}%`)
    .eq('enabled', true)
    .limit(1);

  if (sourceError || !sources || sources.length === 0) {
    console.error('❌ Source not found:', sourceError || 'No matching source');
    return;
  }

  const source = sources[0];
  console.log(`✓ Found source: ${source.name}`);
  console.log(`  URL: ${source.source_url}`);
  console.log(`  Extractor: ${source.extractor_type}\n`);

  // Crawl with Firecrawl
  console.log('📡 Crawling with Firecrawl...');

  try {
    const scrapeResult = await firecrawl.scrapeUrl(source.source_url, {
      formats: ['markdown', 'html']
    });

    if (!scrapeResult.success) {
      console.error('❌ Firecrawl failed:', scrapeResult);
      return;
    }

    console.log(`✓ Crawled successfully`);
    console.log(`  Content length: ${(scrapeResult.markdown || '').length} chars\n`);

    // Extract booths
    const booths = await extractBoothsFromContent(scrapeResult.markdown || '', source.source_url);

    if (booths.length === 0) {
      console.log('⚠️  No booths extracted\n');
      return;
    }

    // Insert booths
    console.log(`\n💾 Inserting ${booths.length} booths into database...`);

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
        console.log(`  ⚠️  Failed to insert ${booth.name}:`, error.message);
      } else {
        inserted++;
        console.log(`  ✓ ${booth.name} in ${booth.city}, ${booth.country}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ COMPLETE`);
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Booths found: ${booths.length}`);
    console.log(`   Booths inserted: ${inserted}`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (error: any) {
    console.error('❌ Crawler failed:', error.message);
    console.error(error.stack);
  }
}

// Run for Autophoto Chicago/Midwest
crawlSource('Autophoto').catch(console.error);
