import { createClient } from '@supabase/supabase-js';
import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js';
import { Database } from '@/lib/supabase/types';

// Configuration
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize clients
const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export interface LogEvent {
  type: 'info' | 'error' | 'success' | 'progress';
  message: string;
  data?: unknown;
}

export type LogCallback = (event: LogEvent) => void;

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

export async function processSource(sourceId: string, log: LogCallback) {
  try {
    // 1. Fetch Source
    const { data: source, error: sourceError } = await supabase
      .from('crawl_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    log({ type: 'info', message: `Starting crawl for ${source.source_name}` });

    // 2. Scrape
    log({ type: 'progress', message: `Scraping ${source.source_url}...` });
    
    let markdown = '';
    try {
      const result = await firecrawl.scrapeUrl(source.source_url, {
        formats: ['markdown'],
        timeout: 45000, // 45s timeout for scraping
      });

      if (!result.success || !result.markdown) {
        throw new Error(result.error || 'No markdown content returned');
      }
      markdown = result.markdown;
      log({ type: 'success', message: `Scraped ${markdown.length} chars` });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Firecrawl failed: ${errorMessage}`);
    }

    // 3. Extract
    log({ type: 'progress', message: 'Analyzing content with Claude...' });
    
    const truncatedContent = markdown.substring(0, 50000);
    const userMessage = `Source Context: ${source.source_name}\n\nContent to Extract:\n${truncatedContent}`;

    let booths: ExtractedBooth[] = [];
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 4096,
          messages: [
            { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Claude API error: ${response.status} ${err}`);
      }

      const data = await response.json();
      const text = data.content[0].text;
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      
      if (Array.isArray(parsed.booths)) {
        booths = parsed.booths;
      }

      log({ type: 'success', message: `Extracted ${booths.length} potential booths` });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Extraction failed: ${errorMessage}`);
    }

    // 4. Upsert
    if (booths.length > 0) {
      log({ type: 'progress', message: 'Saving to database...' });
      
      let added = 0;
      let updated = 0;

      for (const booth of booths) {
        // Validation
        if (!booth.name || !booth.city) continue;

        const slugRaw = `${booth.name}-${booth.city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const slug = slugRaw.substring(0, 60);

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
          const urls = existing.source_urls || [];
          if (!urls.includes(source.source_url)) urls.push(source.source_url);
          
          await supabase.from('booths').update({
            ...boothPayload,
            source_urls: urls,
            updated_at: new Date().toISOString()
          }).eq('id', existing.id);
          updated++;
        } else {
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
      
      log({ type: 'success', message: `Saved: ${added} new, ${updated} updated` });
    }

    // 5. Update Source Stats
    await supabase.from('crawl_sources').update({
      last_crawl_timestamp: new Date().toISOString(),
      last_successful_crawl: new Date().toISOString(),
      total_booths_found: booths.length,
      status: 'active',
      consecutive_failures: 0
    }).eq('id', sourceId);

    // Log to DB history
    await supabase.from('crawl_logs').insert({
      source_id: sourceId,
      source_name: source.source_name,
      operation_type: 'master_crawl',
      operation_status: 'success',
      booths_extracted: booths.length,
      created_at: new Date().toISOString()
    });

    return { success: true, boothsFound: booths.length };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log({ type: 'error', message: errorMessage });

    // Log failure to DB
    await supabase.from('crawl_logs').insert({
      source_id: sourceId,
      source_name: 'Unknown', // Might fail before fetch
      operation_type: 'master_crawl',
      operation_status: 'error',
      error_message: error.message,
      created_at: new Date().toISOString()
    });

    // Update source error state
    await supabase.from('crawl_sources').update({
      last_error_message: error.message,
      last_error_timestamp: new Date().toISOString(),
      status: 'error'
    }).eq('id', sourceId);

    throw error;
  }
}
