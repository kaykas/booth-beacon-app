/**
 * Re-extraction Edge Function
 *
 * Processes stored raw content from crawl_raw_content table
 * without making new Firecrawl API calls. This saves API costs
 * when improving extractors or reprocessing failed extractions.
 *
 * Endpoints:
 * - POST /reextract-content
 *   Body: { content_id: string } - Single content re-extraction
 * - POST /reextract-content/batch
 *   Body: { source_id?: string, limit?: number } - Batch re-extraction
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Import AI extraction engine from unified-crawler
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

interface RawContent {
  id: string;
  source_id: string;
  url: string;
  raw_markdown: string | null;
  raw_html: string | null;
  metadata: Record<string, unknown> | null;
  crawled_at: string;
  source: {
    source_name: string;
    extractor_type: string;
  };
}

interface BoothData {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  micro_location?: string;
  machine_model?: string;
  machine_manufacturer?: string;
  booth_type?: string;
  is_operational?: boolean;
  status?: string;
  price?: string;
  strip_format?: string;
  photo_exterior_url?: string;
  photo_interior_url?: string;
  photo_sample_strip_url?: string;
  hours_of_operation?: string;
  phone?: string;
  website?: string;
  operator_name?: string;
  notes?: string;
  last_verified?: string;
  instagram_handle?: string;
  tags?: string[];
}

/**
 * Extract booths using Claude AI with the same logic as unified-crawler
 */
async function extractBooths(content: string, config: {
  source_name: string;
  source_type: string;
}): Promise<BoothData[]> {
  const BOOTH_EXTRACTION_SCHEMA = {
    type: "object",
    properties: {
      booths: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Venue or location name" },
            address: { type: "string", description: "Full street address" },
            city: { type: "string", description: "City name" },
            state: { type: "string", description: "State/province/region" },
            country: { type: "string", description: "Country name" },
            postal_code: { type: "string", description: "Postal/ZIP code" },
            latitude: { type: "number", description: "Latitude coordinate" },
            longitude: { type: "number", description: "Longitude coordinate" },
            micro_location: { type: "string", description: "Location within venue" },
            machine_model: { type: "string", description: "Photo booth machine model" },
            machine_manufacturer: { type: "string", description: "Manufacturer name" },
            booth_type: { type: "string", enum: ["analog", "chemical", "instant", "digital"], description: "Type of booth" },
            is_operational: { type: "boolean", description: "Currently operational" },
            status: { type: "string", enum: ["active", "inactive", "removed", "temporarily_closed", "unknown"], description: "Current status" },
            price: { type: "string", description: "Cost per session" },
            strip_format: { type: "string", description: "Photo strip format" },
            photo_exterior_url: { type: "string", description: "Booth exterior photo URL" },
            photo_interior_url: { type: "string", description: "Booth interior photo URL" },
            photo_sample_strip_url: { type: "string", description: "Sample photo strip URL" },
            hours_of_operation: { type: "string", description: "Operating hours" },
            phone: { type: "string", description: "Contact phone number" },
            website: { type: "string", description: "Website URL" },
            operator_name: { type: "string", description: "Operator or owner name" },
            notes: { type: "string", description: "Additional notes" },
            last_verified: { type: "string", description: "Last verification date" },
            instagram_handle: { type: "string", description: "Instagram handle" },
            tags: { type: "array", items: { type: "string" }, description: "Tags or categories" }
          },
          required: ["name"]
        }
      }
    },
    required: ["booths"]
  };

  const SYSTEM_PROMPT = `You are the world's best photo booth location extractor. Your mission is to find EVERY analog/chemical photo booth mentioned in the content.

CRITICAL RULES:
1. Extract ALL booths mentioned - even brief mentions
2. Only extract analog/chemical photo booths (not digital/modern booths)
3. Focus on permanent installations (not mobile/event booths)
4. Be thorough but accurate - no hallucinations
5. If address is incomplete, extract what's available

SOURCE CONTEXT:
- Source: ${config.source_name}
- Type: ${config.source_type}

For city guides/blogs: Extract all booths mentioned in the article.
For directories: Extract all listings, even if information is minimal.`;

  const prompt = `Extract ALL analog photo booths from this content:\n\n${content.substring(0, 30000)}`;

  console.log(`Calling Claude AI for extraction (${content.length} chars)`);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8000,
        temperature: 0.0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
        tools: [{
          name: "extract_photo_booths",
          description: "Extract comprehensive photo booth location data",
          input_schema: BOOTH_EXTRACTION_SCHEMA
        }],
        tool_choice: { type: "tool", name: "extract_photo_booths" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI extraction failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const toolUse = result.content?.find((block: { type: string }) => block.type === "tool_use");

    if (!toolUse || !toolUse.input || !toolUse.input.booths) {
      console.warn("No booths extracted from content");
      return [];
    }

    console.log(`Extracted ${toolUse.input.booths.length} booths`);
    return toolUse.input.booths;
  } catch (error) {
    console.error("AI extraction error:", error);
    throw error;
  }
}

/**
 * Re-extract a single piece of raw content
 */
async function reextractSingle(contentId: string, supabase: ReturnType<typeof createClient>) {
  console.log(`Re-extracting content ID: ${contentId}`);

  // Fetch raw content with source info
  const { data: rawContent, error: fetchError } = await supabase
    .from('crawl_raw_content')
    .select(`
      id, source_id, url, raw_markdown, raw_html, metadata, crawled_at,
      crawl_sources!inner(source_name, extractor_type)
    `)
    .eq('id', contentId)
    .single();

  if (fetchError || !rawContent) {
    throw new Error(`Failed to fetch raw content: ${fetchError?.message || 'Not found'}`);
  }

  const content = rawContent.raw_markdown || rawContent.raw_html;
  if (!content) {
    throw new Error("No raw content available to extract from");
  }

  // Extract booths using AI
  const booths = await extractBooths(content, {
    source_name: rawContent.crawl_sources.source_name,
    source_type: rawContent.crawl_sources.extractor_type
  });

  if (booths.length === 0) {
    return {
      success: true,
      booths_extracted: 0,
      message: "No booths found in content"
    };
  }

  // Save booths to database
  const savedBooths = [];
  for (const booth of booths) {
    const boothData = {
      ...booth,
      source_id: rawContent.source_id,
      source_url: rawContent.url,
      extracted_from_content_id: contentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      re_extracted: true, // Flag to indicate this came from re-extraction
      re_extracted_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('booths')
      .insert(boothData)
      .select()
      .single();

    if (error) {
      console.error(`Failed to save booth ${booth.name}:`, error);
    } else {
      savedBooths.push(data);
    }
  }

  return {
    success: true,
    booths_extracted: booths.length,
    booths_saved: savedBooths.length,
    booths: savedBooths
  };
}

/**
 * Re-extract multiple pieces of raw content in batch
 */
async function reextractBatch(
  sourceId: string | undefined,
  limit: number,
  supabase: ReturnType<typeof createClient>
) {
  console.log(`Batch re-extraction - source: ${sourceId || 'all'}, limit: ${limit}`);

  // Query for unextracted content
  let query = supabase
    .from('crawl_raw_content')
    .select(`
      id, source_id, url, raw_markdown, raw_html, metadata, crawled_at,
      crawl_sources!inner(source_name, extractor_type)
    `)
    .is('booths.extracted_from_content_id', null)
    .limit(limit);

  if (sourceId) {
    query = query.eq('source_id', sourceId);
  }

  const { data: rawContents, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch raw contents: ${error.message}`);
  }

  if (!rawContents || rawContents.length === 0) {
    return {
      success: true,
      processed: 0,
      message: "No unextracted content found"
    };
  }

  // Process each content item
  const results = [];
  for (const rawContent of rawContents) {
    try {
      const result = await reextractSingle(rawContent.id, supabase);
      results.push({
        content_id: rawContent.id,
        url: rawContent.url,
        ...result
      });
    } catch (error) {
      console.error(`Failed to re-extract ${rawContent.id}:`, error);
      results.push({
        content_id: rawContent.id,
        url: rawContent.url,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const totalExtracted = results.reduce((sum, r) => sum + (r.booths_extracted || 0), 0);
  const totalSaved = results.reduce((sum, r) => sum + (r.booths_saved || 0), 0);

  return {
    success: true,
    processed: results.length,
    total_booths_extracted: totalExtracted,
    total_booths_saved: totalSaved,
    results
  };
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const isBatch = url.pathname.includes('/batch');

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();

    if (isBatch) {
      // Batch re-extraction
      const { source_id, limit = 10 } = body;
      const result = await reextractBatch(source_id, Math.min(limit, 50), supabase);

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      // Single re-extraction
      const { content_id } = body;
      if (!content_id) {
        return new Response(JSON.stringify({ error: 'content_id is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const result = await reextractSingle(content_id, supabase);

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    console.error("Re-extraction error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
