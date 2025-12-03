import { createClient } from '@supabase/supabase-js';
import { FirecrawlAppV1 as FirecrawlApp } from '@mendable/firecrawl-js';
import { Database } from '@/lib/supabase/types';

// Configuration - ONLY Firecrawl needed now
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;
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
  address?: string;
  city: string;
  country: string;
  location_description?: string;
  status?: 'active' | 'closed' | 'unknown';
}

// Firecrawl extraction schema (JSON Schema format)
const extractionSchema = {
  type: "object",
  properties: {
    booths: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the venue or location where the booth is located"
          },
          address: {
            type: "string",
            description: "Street address if available"
          },
          city: {
            type: "string",
            description: "City where the booth is located"
          },
          country: {
            type: "string",
            description: "Country where the booth is located"
          },
          location_description: {
            type: "string",
            description: "Additional location details (e.g., 'Inside the lobby', 'Next to the bar')"
          },
          status: {
            type: "string",
            enum: ["active", "closed", "unknown"],
            description: "Current status of the booth"
          }
        },
        required: ["name", "city", "country"]
      }
    }
  },
  required: ["booths"]
};

const EXTRACTION_SYSTEM_PROMPT = `You are extracting photobooth listings from web content.

Focus on:
- Physical analog photo booth machines only
- Exact venue names and addresses
- Current operational status (active/closed/unknown)
- Location details within the venue

Ignore:
- Digital photo booths (iPad, ring light setups)
- Photo printing services
- Event booth rentals (unless permanent locations)

Extract ONLY booths with at least a name, city, and country.`;

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

    // 2. Scrape & Extract in one step using Firecrawl's built-in AI
    log({ type: 'progress', message: `Extracting booths from ${source.source_url}...` });

    let booths: ExtractedBooth[] = [];

    try {
      const result = await firecrawl.scrapeUrl(source.source_url, {
        formats: ['extract'], // Use Firecrawl's AI extraction
        extract: {
          schema: extractionSchema,
          systemPrompt: EXTRACTION_SYSTEM_PROMPT
        },
        timeout: 60000, // 60s timeout
      });

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed');
      }

      // Extract booths from result
      const extractData = result.extract as any;
      if (extractData && Array.isArray(extractData.booths)) {
        booths = extractData.booths;
      }

      log({ type: 'success', message: `Extracted ${booths.length} booths` });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Firecrawl extraction failed: ${errorMessage}`);
    }

    // 3. Upsert to Database
    if (booths.length > 0) {
      log({ type: 'progress', message: 'Saving to database...' });

      let added = 0;
      let updated = 0;

      for (const booth of booths) {
        // Validation
        if (!booth.name || !booth.city || !booth.country) continue;

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
          address: booth.address || null,
          city: booth.city,
          country: booth.country,
          description: booth.location_description || null,
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

    // 4. Update Source Stats
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
      error_message: errorMessage,
      created_at: new Date().toISOString()
    });

    // Update source error state
    await supabase.from('crawl_sources').update({
      last_error_message: errorMessage,
      last_error_timestamp: new Date().toISOString(),
      status: 'error'
    }).eq('id', sourceId);

    throw error;
  }
}
