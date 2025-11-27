/**
 * AI-Powered Extraction Engine for Photo Booth Data
 *
 * World-class extraction system designed specifically for discovering
 * and extracting photo booth information from any source.
 *
 * Features:
 * - Multi-pass extraction (broad → detailed → validation)
 * - Source-specific strategies
 * - Structured schema enforcement
 * - Context-aware AI prompting
 * - Quality validation
 */

import { BoothData, ExtractorResult } from "./extractors";
import type { AnthropicResponse, AnthropicContentBlock } from "./types";

export interface AIExtractionConfig {
  source_name: string;
  source_type: 'directory' | 'city_guide' | 'blog' | 'community' | 'operator';
  priority: 'high' | 'medium' | 'low';
  extraction_strategy: 'comprehensive' | 'targeted' | 'exploratory';
  anthropic_api_key: string;
}

/**
 * Comprehensive Photo Booth Extraction Schema
 * This is the "perfect" booth object we want to extract
 */
const BOOTH_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    booths: {
      type: "array",
      items: {
        type: "object",
        properties: {
          // Core identification
          name: {
            type: "string",
            description: "Venue or location name where the photo booth is located"
          },
          address: {
            type: "string",
            description: "Full street address including building number and street name"
          },
          city: {
            type: "string",
            description: "City name"
          },
          state: {
            type: "string",
            description: "State/province/region name or code"
          },
          country: {
            type: "string",
            description: "Country name (standardized)"
          },
          postal_code: {
            type: "string",
            description: "Postal/ZIP code"
          },

          // Location details
          latitude: {
            type: "number",
            description: "Latitude coordinate if available"
          },
          longitude: {
            type: "number",
            description: "Longitude coordinate if available"
          },
          micro_location: {
            type: "string",
            description: "Specific location within venue (e.g., 'near entrance', 'basement level', '2nd floor lobby')"
          },

          // Machine details
          machine_model: {
            type: "string",
            description: "Photo booth machine model (e.g., 'Photo-Me', 'Photomaton', 'Vintage Strip')"
          },
          machine_manufacturer: {
            type: "string",
            description: "Manufacturer name (e.g., 'Photo-Me International', 'Photomaton')"
          },
          booth_type: {
            type: "string",
            enum: ["analog", "chemical", "instant", "digital"],
            description: "Type of booth - analog/chemical is preferred"
          },

          // Operational details
          is_operational: {
            type: "boolean",
            description: "Whether the booth is currently operational and accepting customers"
          },
          status: {
            type: "string",
            enum: ["active", "inactive", "removed", "temporarily_closed", "unknown"],
            description: "Current operational status"
          },
          cost: {
            type: "string",
            description: "Cost to use the booth (e.g., '$5', '€4 for 4 strips', '£3')"
          },
          hours: {
            type: "string",
            description: "Operating hours or access times"
          },
          accepts_cash: {
            type: "boolean",
            description: "Whether the booth accepts cash payment"
          },
          accepts_card: {
            type: "boolean",
            description: "Whether the booth accepts card payment"
          },

          // Contact & web
          website: {
            type: "string",
            description: "Website URL for the venue or booth operator"
          },
          phone: {
            type: "string",
            description: "Contact phone number"
          },

          // Rich description
          description: {
            type: "string",
            description: "Detailed description including ambiance, booth condition, historical info, user experiences"
          },

          // Photo outputs
          photo_type: {
            type: "string",
            description: "Type of photos produced (e.g., 'black and white strips', 'color prints', '4 poses')"
          },
          strip_format: {
            type: "string",
            description: "Format of photo strips (e.g., '4 photos vertical', '2x2 grid')"
          },

          // Metadata
          reported_date: {
            type: "string",
            description: "When this information was last reported or verified"
          },
          source_info: {
            type: "string",
            description: "Any additional source-specific information or notes"
          }
        },
        required: ["name", "address", "country"]
      }
    }
  },
  required: ["booths"]
};

/**
 * Clean HTML by removing scripts, styles, and other non-content elements
 * Reduces token count significantly without losing data
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
    .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gim, "")
    .replace(/data:image\/[^;]+;base64,[^\s"')>]+/gim, "[base64-image]");
}

/**
 * AI-powered extraction with detailed prompting and structured output
 * OPTIMIZED based on Google Gemini team feedback to solve "Lazy List Syndrome"
 */
export async function extractWithAI(
  html: string,
  markdown: string,
  sourceUrl: string,
  config: AIExtractionConfig,
  onProgress?: (event: any) => void
): Promise<ExtractorResult> {
  const startTime = Date.now();
  const booths: BoothData[] = [];
  const errors: string[] = [];

  try {
    // Choose content type: prefer clean markdown, fallback to cleaned HTML
    let content = markdown && markdown.length > 500 ? markdown : cleanHtml(html);

    // GOOGLE OPTIMIZATION: Smart chunking based on source type
    // Gemini 2.0 Flash has 1M token window (~4M characters)
    // Only chunk directories/operators; send full content for blogs/guides
    const chunks: string[] = [];

    if (config.source_type === 'directory' || config.source_type === 'operator') {
      // For directories: Use smaller chunks to prevent "Lazy List Syndrome"
      // Google recommendation: Process in batches of 5-10 items
      // Use 50k chunks but split on newlines to preserve structure
      const maxChunkSize = 50000;
      let currentChunk = "";

      const lines = content.split('\n');
      for (const line of lines) {
        if ((currentChunk.length + line.length) > maxChunkSize) {
          chunks.push(currentChunk);
          currentChunk = "";
        }
        currentChunk += line + "\n";
      }
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
    } else {
      // For blogs/city guides/community: Send entire content (no chunking)
      // This preserves context (e.g., intro mentioning "all cash only")
      chunks.push(content);
    }

    console.log(`Processing ${chunks.length} chunks for ${config.source_name} (${config.source_type})`);

    // Process each chunk with AI
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];

      console.log(`Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} chars)`);

      const prompt = buildExtractionPrompt(config, chunk, chunkIndex, chunks.length);

      // Emit AI API call start event
      onProgress?.({
        type: 'ai_api_call_start',
        chunk_index: chunkIndex + 1,
        total_chunks: chunks.length,
        content_size: chunk.length,
        model: 'claude-sonnet-4-5',
        timestamp: new Date().toISOString()
      });

      try {
        const apiStartTime = Date.now();
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": config.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-5-20250929",  // Claude Sonnet 4.5 - Latest and best!
            max_tokens: 16000,  // Increased for large extraction results
            temperature: 0.0,  // Deterministic extraction
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            tools: [
              {
                name: "extract_photo_booths",
                description: "Extract comprehensive photo booth location data from the provided content",
                input_schema: BOOTH_EXTRACTION_SCHEMA
              }
            ],
            tool_choice: {
              type: "tool",
              name: "extract_photo_booths"
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          errors.push(`AI extraction failed for chunk ${chunkIndex + 1}: ${response.status} - ${errorText}`);
          continue;
        }

        const result = await response.json() as AnthropicResponse;

        // Claude's response format: content array with tool_use blocks
        const toolUse = result.content?.find((block: AnthropicContentBlock) => block.type === "tool_use");

        if (!toolUse || toolUse.name !== "extract_photo_booths") {
          errors.push(`No tool use in Claude response for chunk ${chunkIndex + 1}`);
          continue;
        }

        const extracted = toolUse.input as any;
        const chunkBooths = extracted?.booths || [];

        if (chunkBooths.length === 0) {
          console.warn(`⚠️ Zero booths found in chunk ${chunkIndex + 1}. Raw AI response:`, JSON.stringify(result).substring(0, 500) + "...");
        } else {
          console.log(`Extracted ${chunkBooths.length} booths from chunk ${chunkIndex + 1}`);
        }

        // Emit AI API call complete event
        onProgress?.({
          type: 'ai_api_call_complete',
          chunk_index: chunkIndex + 1,
          total_chunks: chunks.length,
          duration_ms: Date.now() - apiStartTime,
          booths_extracted: chunkBooths.length,
          timestamp: new Date().toISOString()
        });

        // FALLBACK: If 0 booths found but content looks promising, try a "loose" extraction
        if (chunkBooths.length === 0 && (content.includes("Address") || content.includes("Location") || content.includes("Street"))) {
          console.log(`⚠️ Zero booths found in chunk ${chunkIndex + 1} despite keywords. This might be a parsing issue.`);
          // In a future iteration, we could try a second pass with a simpler prompt here
        }

        // Convert to BoothData format
        for (const booth of chunkBooths) {
          booths.push({
            name: booth.name,
            address: booth.address,
            city: booth.city,
            state: booth.state,
            country: booth.country,
            postal_code: booth.postal_code,
            latitude: booth.latitude,
            longitude: booth.longitude,
            machine_model: booth.machine_model,
            machine_manufacturer: booth.machine_manufacturer,
            booth_type: booth.booth_type || 'analog',
            is_operational: booth.is_operational ?? true,
            status: booth.status || 'active',
            cost: booth.cost,
            hours: booth.hours,
            accepts_cash: booth.accepts_cash,
            accepts_card: booth.accepts_card,
            website: booth.website,
            phone: booth.phone,
            description: booth.description,
            source_url: sourceUrl,
            source_name: config.source_name,
          });
        }
      } catch (chunkError) {
        errors.push(`Error processing chunk ${chunkIndex + 1}: ${chunkError}`);
      }
    }

    // Deduplicate booths within this extraction
    const uniqueBooths = deduplicateBooths(booths);

    console.log(`AI extraction complete: ${uniqueBooths.length} unique booths from ${booths.length} total`);

    return {
      booths: uniqueBooths,
      errors,
      metadata: {
        pages_processed: chunks.length,
        total_found: booths.length,
        extraction_time_ms: Date.now() - startTime,
      },
    };
  } catch (error) {
    errors.push(`AI extraction error: ${error}`);
    return {
      booths: [],
      errors,
      metadata: {
        pages_processed: 0,
        total_found: 0,
        extraction_time_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * "Lazy Protection" prompt - prevents LLM from stopping after first few items
 * Based on Google Gemini team feedback to solve "Lazy List Syndrome"
 */
const LAZY_PROTECTION_PROMPT = `
🚨 ANTI-LAZY DIRECTIVE (CRITICAL):
This content may contain MANY photo booths (e.g., 50+ in a directory listing).
You MUST extract EVERY SINGLE ONE exhaustively.
- Do NOT stop after the first 10-20 items
- Do NOT summarize or say "...and others"
- Do NOT drift or lose focus midway through long lists
- Process the ENTIRE content systematically
- If you see a table with 100 rows, extract all 100 rows
If the list is long, work through it methodically until the end.
`;

/**
 * System prompt that teaches the AI how to extract photo booth data
 */
const SYSTEM_PROMPT = `You are a world-class photo booth data extraction specialist.

Your mission: Extract EVERY analog/chemical photo booth location from the provided content with maximum detail and accuracy.

${LAZY_PROTECTION_PROMPT}

CRITICAL REQUIREMENTS:
1. Extract ALL photo booths mentioned - don't skip any
2. Focus on ANALOG/CHEMICAL booths (wet process, traditional)
3. Extract complete addresses including street numbers
4. Include ALL available details (hours, cost, machine model, etc.)
5. Be thorough - look for booths in tables, lists, paragraphs, maps, embedded data
6. Extract coordinates if present (latitude/longitude)
7. Note specific locations within venues ("near entrance", "basement", etc.)
8. Capture operator/owner information
9. Extract operational status carefully (active/inactive/closed)
10. Include any historical information or user experiences

BOOTH IDENTIFICATION:
- Look for terms: "photo booth", "photobooth", "photo-booth", "fotoautomat", "photomaton", "cabine photo", "fotocabina"
- Analog indicators: "chemical", "wet process", "analog", "film", "traditional", "vintage", "classic"
- Machine models: "Photo-Me", "Photomaton", "Photomatic", "Photo Studio", etc.

EXTRACTION STRATEGY:
- Parse HTML tables, lists, structured data
- Extract from prose descriptions
- Look for embedded JSON/structured data
- Parse map markers and location data
- Extract from comments or user reports

ADDRESS COMPLETENESS:
- Always extract full street address with number
- Include venue/business name if booth is inside
- Note floor/area within building if mentioned
- Extract postal codes when present

QUALITY STANDARDS:
- Verify each field makes sense
- Don't hallucinate information not in the content
- If unsure about operational status, mark as unknown
- Standardize country names (USA → United States, UK → United Kingdom)

EDGE CASES:
- If multiple booths at same venue, extract as separate entries
- If booth has moved, extract only current location
- If booth is definitively closed/removed, mark status appropriately
- If booth is definitively closed/removed, mark status appropriately
- If content mentions "no longer there", mark inactive

SOURCE-SPECIFIC GUIDANCE:
- autophoto.org: Often lists simple addresses line-by-line. Treat each line with an address as a booth.
- lomography.com: User-submitted locations. Look for "Location", "Address", or map markers in the text.
- flickr.com: Look for photo descriptions containing location data.`;

/**
 * Build extraction prompt based on source type and content
 */
function buildExtractionPrompt(
  config: AIExtractionConfig,
  content: string,
  chunkIndex: number,
  totalChunks: number
): string {
  let prompt = `Extract all photo booth locations from this ${config.source_type} content`;

  if (config.source_name) {
    prompt += ` from ${config.source_name}`;
  }

  if (totalChunks > 1) {
    prompt += ` (chunk ${chunkIndex + 1} of ${totalChunks})`;
  }

  prompt += ".\n\n";

  // Add source-specific guidance
  switch (config.source_type) {
    case 'directory':
      prompt += "This is a directory/database of photo booths. Extract every listing with complete details.\n\n";
      break;
    case 'city_guide':
      prompt += "This is a city guide article. Look for recommendations, venue names, and addresses mentioned in the text.\n\n";
      break;
    case 'blog':
      prompt += "This is a blog post. Extract any photo booth locations mentioned, including personal experiences and details.\n\n";
      break;
    case 'community':
      prompt += "This is community content (forum/reddit/social). Extract user-reported locations with context.\n\n";
      break;
    case 'operator':
      prompt += "This is a photo booth operator site. Extract all their booth locations and details.\n\n";
      break;
  }

  prompt += "CONTENT:\n\n" + content;

  return prompt;
}

/**
 * Deduplicate booths within a single extraction
 */
function deduplicateBooths(booths: BoothData[]): BoothData[] {
  const seen = new Map<string, BoothData>();

  for (const booth of booths) {
    // Create deduplication key from normalized name + address + country
    const key = [
      booth.name?.toLowerCase().trim(),
      booth.address?.toLowerCase().trim(),
      booth.country?.toLowerCase().trim()
    ].filter(Boolean).join('|');

    if (!seen.has(key)) {
      seen.set(key, booth);
    } else {
      // Merge data from duplicate (keep most complete version)
      const existing = seen.get(key)!;
      seen.set(key, mergeBooth(existing, booth));
    }
  }

  return Array.from(seen.values());
}

/**
 * Merge two booth records, keeping the most complete data
 */
function mergeBooth(a: BoothData, b: BoothData): BoothData {
  return {
    ...a,
    // Keep longest/most detailed values
    description: (a.description?.length || 0) > (b.description?.length || 0) ? a.description : b.description,
    machine_model: a.machine_model || b.machine_model,
    machine_manufacturer: a.machine_manufacturer || b.machine_manufacturer,
    cost: a.cost || b.cost,
    hours: a.hours || b.hours,
    phone: a.phone || b.phone,
    website: a.website || b.website,
    latitude: a.latitude || b.latitude,
    longitude: a.longitude || b.longitude,
    // Use first available source information
    source_name: a.source_name || b.source_name,
    source_url: a.source_url || b.source_url,
  };
}
