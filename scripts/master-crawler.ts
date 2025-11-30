
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must be Service Role
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

if (!SUPABASE_KEY || !FIRECRAWL_API_KEY || !ANTHROPIC_API_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY, FIRECRAWL_API_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });

// --- SCHEMA & PROMPTS ---

// A minimal, strict interface for what we expect from the LLM
interface ExtractedBooth {
  name: string;
  address: string;
  city: string;
  country: string;
  location_description?: string;
  status?: 'active' | 'closed' | 'unknown';
}

const EXTRACTION_SYSTEM_PROMPT = `You are a Precision Data Extraction Engine. 
Your goal is to extract strictly structured data about "Analog Photo Booths" from unstructured text.

RULES:
1. **Target**: Identify physical photo booth machines.
2. **Strictness**: ONLY extract if you have a Name and a Location (City/Country).
3. **Filtering**: Ignore digital booths (iPad, ring light) if clearly stated.
4. **Format**: Return a JSON object with a single key "booths" containing an array of objects.

JSON STRUCTURE:
{
  "booths": [
    {
      "name": "Exact Name of Venue or Booth",
      "address": "Street Address (if available) or descriptive location",
      "city": "City Name",
      "country": "Country Name (infer from context if necessary)",
      "location_description": "Any extra details: 'Inside the lobby', 'Next to the bar', 'Model 21'",
      "status": "active" | "closed" | "unknown"
    }
  ]
}

Return ONLY VALID JSON. No markdown code blocks.`;

// --- HELPERS ---

async function scrapeSource(url: string): Promise<string | null> {
  console.log(`  📡 Scraping: ${url}`);
  try {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown'],
      timeout: 30000,
    });

    if (!result.success || !result.markdown) {
      console.error(`  ❌ Firecrawl failed: ${result.error}`);
      return null;
    }
    return result.markdown;
  } catch (err: any) {
    console.error(`  ❌ Scrape exception: ${err.message}`);
    return null;
  }
}

async function extractData(content: string, sourceName: string): Promise<ExtractedBooth[]> {
  console.log(`  🧠 Extracting with Claude...`);
  
  // Truncate content to avoid token limits (50k chars is plenty for most pages)
  const truncatedContent = content.substring(0, 50000);

  const userMessage = `Source Context: ${sourceName}
  
  Content to Extract:
  ${truncatedContent}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620', // Use Sonnet for speed/quality balance
        max_tokens: 4096,
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`  ❌ Claude API Error: ${response.status} ${err}`);
      return [];
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Clean up potential markdown formatting
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.booths)) {
        return parsed.booths;
      }
      return [];
    } catch (e) {
      console.error(`  ❌ JSON Parse Error. Raw output: ${text.substring(0, 100)}...`);
      return [];
    }

  } catch (err: any) {
    console.error(`  ❌ Extraction exception: ${err.message}`);
    return [];
  }
}

// --- MAIN PIPELINE ---

async function runMasterCrawler() {
  console.log('🚀 Starting Master Crawler Pipeline');
  console.log('===================================');

  // 1. Fetch Sources
  const { data: sources, error } = await supabase
    .from('crawl_sources')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: false });

  if (error || !sources) {
    console.error('❌ Failed to fetch sources:', error);
    return;
  }

  console.log(`📋 Found ${sources.length} sources to process.\n`);

  for (const source of sources) {
    console.log(`🔹 Processing: ${source.source_name}`);
    
    // 2. Scrape
    const markdown = await scrapeSource(source.source_url);
    if (!markdown) continue;

    // 3. Extract
    const booths = await extractData(markdown, source.source_name);
    console.log(`  💎 Extracted ${booths.length} potential booths.`);

    if (booths.length === 0) continue;

    // 4. Upsert (One by one for safety)
    let added = 0;
    let updated = 0;

    for (const booth of booths) {
      // Basic Validation
      if (!booth.name || !booth.city || !booth.country) {
        console.warn(`  ⚠️ Skipping incomplete booth: ${booth.name}`);
        continue;
      }

      // Generate a robust slug
      const slugRaw = `${booth.name}-${booth.city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = slugRaw.substring(0, 60); // Safety limit

      // Check existing
      const { data: existing } = await supabase
        .from('booths')
        .select('id, source_urls')
        .eq('slug', slug)
        .maybeSingle();

      const boothPayload = {
        name: booth.name,
        address: booth.address,
        city: booth.city,
        country: booth.country,
        description: booth.location_description,
        status: booth.status || 'active',
        last_verified: new Date().toISOString(),
      };

      if (existing) {
        // Update: Append source URL if new
        const urls = existing.source_urls || [];
        if (!urls.includes(source.source_url)) {
          urls.push(source.source_url);
        }
        
        await supabase.from('booths').update({
          ...boothPayload,
          source_urls: urls,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id);
        updated++;
      } else {
        // Insert
        await supabase.from('booths').insert({
          ...boothPayload,
          slug,
          source_urls: [source.source_url],
          source_primary: source.source_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        added++;
      }
    }

    console.log(`  ✅ Result: ${added} added, ${updated} updated.\n`);
    
    // 5. Update Source Status
    await supabase.from('crawl_sources').update({
      last_crawl_timestamp: new Date().toISOString(),
      last_successful_crawl: new Date().toISOString(),
      total_booths_found: booths.length
    }).eq('id', source.id);

    // Rate Limit Safety
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('🎉 Master Crawl Complete.');
}

runMasterCrawler().catch(console.error);
