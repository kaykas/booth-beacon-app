
import { createClient } from '@supabase/supabase-js';
import { FirecrawlAppV1 } from '@mendable/firecrawl-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must be Service Role Key for writing
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_KEY || !FIRECRAWL_API_KEY || !ANTHROPIC_API_KEY) {
  console.error('Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY, FIRECRAWL_API_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const firecrawl = new FirecrawlAppV1({ apiKey: FIRECRAWL_API_KEY });

interface BoothData {
  name: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  status?: string;
}

// Helper to normalize strings for deduplication
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

async function extractBooths(markdown: string, sourceUrl: string): Promise<BoothData[]> {
  const prompt = `You are an expert data extractor. Extract ALL analog photo booth locations from the following webpage content.

Source URL: ${sourceUrl}

Content:
${markdown.substring(0, 100000)} // Truncate to avoid token limits

Return a JSON object with a key "booths" containing an array of objects.
Each object MUST have:
- name: string (e.g. "Photoautomat", "Ace Hotel Booth")
- address: string (full address if available, or descriptive location)
- city: string
- country: string
- description: string (any details about the booth, machine type, cost, hours)

If coordinates are explicitly mentioned, include "latitude" and "longitude" (numbers).
If status is mentioned (e.g. "Broken", "Removed"), include "status": "closed" or "inactive". Default is "active".

Return ONLY JSON. No text before or after.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const text = data.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.booths || [];
  } catch (error) {
    console.error('Error extracting data with Claude:', error);
    return [];
  }
}

async function processSource(source: any) {
  console.log(`\nProcessing source: ${source.source_name} (${source.source_url})`);

  try {
    // 1. Scrape with Firecrawl
    console.log(`  Scraping...`);
    const scrapeResult = await firecrawl.scrapeUrl(source.source_url, {
      formats: ['markdown'],
      timeout: 30000
    });

    if (!scrapeResult.success) {
      throw new Error(`Firecrawl failed: ${scrapeResult.error}`);
    }

    const markdown = scrapeResult.markdown || '';
    console.log(`  Scraped ${markdown.length} chars.`);

    // 2. Extract with Claude
    console.log(`  Extracting...`);
    const booths = await extractBooths(markdown, source.source_url);
    console.log(`  Found ${booths.length} booths.`);

    if (booths.length === 0) {
      console.log(`  No booths found.`);
      return;
    }

    // 3. Upsert into Supabase
    let added = 0;
    let updated = 0;

    for (const booth of booths) {
      // Basic validation
      if (!booth.name || !booth.city || !booth.country) {
        console.warn(`  Skipping invalid booth: ${JSON.stringify(booth)}`);
        continue;
      }

      // Check for existing booth
      const { data: existing } = await supabase
        .from('booths')
        .select('id, source_names, source_urls')
        .ilike('name', booth.name)
        .ilike('city', booth.city) // Loose matching
        .limit(1)
        .maybeSingle();

      const boothData = {
        name: booth.name,
        address: booth.address,
        city: booth.city,
        country: booth.country,
        description: booth.description,
        status: booth.status || 'active',
        // Preserve existing coords if new ones are missing
        ...(booth.latitude ? { latitude: booth.latitude } : {}),
        ...(booth.longitude ? { longitude: booth.longitude } : {}),
      };

      if (existing) {
        // Update
        const sourceNames = existing.source_names || [];
        if (!sourceNames.includes(source.source_name)) sourceNames.push(source.source_name);
        
        const sourceUrls = existing.source_urls || [];
        if (!sourceUrls.includes(source.source_url)) sourceUrls.push(source.source_url);

        await supabase
          .from('booths')
          .update({
            ...boothData,
            source_names: sourceNames,
            source_urls: sourceUrls,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        updated++;
      } else {
        // Insert
        // Generate a slug
        const slug = `${normalize(booth.name)}-${normalize(booth.city)}`.replace(/\s+/g, '-').substring(0, 50);
        
        await supabase
          .from('booths')
          .insert({
            ...boothData,
            slug: slug,
            source_names: [source.source_name],
            source_urls: [source.source_url],
            source_id: source.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        added++;
      }
    }

    console.log(`  Result: ${added} added, ${updated} updated.`);

    // Update source status
    await supabase.from('crawl_sources').update({
      last_successful_crawl: new Date().toISOString(),
      total_booths_found: booths.length,
      status: 'active'
    }).eq('id', source.id);

  } catch (error: any) {
    console.error(`  Error processing source: ${error.message}`);
    // Update source with error
    await supabase.from('crawl_sources').update({
      last_error_message: error.message,
      last_error_timestamp: new Date().toISOString(),
      status: 'error'
    }).eq('id', source.id);
  }
}

async function run() {
  console.log('Starting Robust Crawler...');

  // Get enabled sources
  const { data: sources, error } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true);

  if (error) {
    console.error('Error fetching sources:', error);
    return;
  }

  console.log(`Found ${sources?.length} enabled sources.`);

  for (const source of sources || []) {
    await processSource(source);
    // Wait a bit to avoid rate limits
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('Crawler finished.');
}

run().catch(console.error);
