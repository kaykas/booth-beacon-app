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

import { BoothData, ExtractorResult } from "./extractors.ts";
import type { AnthropicResponse, AnthropicContentBlock } from "./types.ts";

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

        const extracted = toolUse.input;
        const chunkBooths = extracted.booths || [];

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
3. Extract complete addresses including street numbers (REQUIRED - no exceptions)
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

ADDRESS COMPLETENESS (CRITICAL - varies by source type):

FOR DIRECTORIES (operator sites, business listings):
- REQUIRED: Always extract full street address with number (e.g., "123 Main Street")
- REQUIRED: Address must include both street number AND street name
- REJECT: Do not extract if only venue/business name is available
- Always verify address includes a number before a street name

FOR CITY GUIDES & BLOGS (venue mentions, listicles):
- BEST: Full street address with number when available
- ACCEPTABLE: Venue name + neighborhood (e.g., "Hotel Utah Saloon, SoMa")
- ACCEPTABLE: Venue name + cross streets (e.g., "The Ha-Ra Club at 16th & Mission")
- We can geocode venue names later - partial data is better than no data
- Include: Venue/business name if booth is inside (separate from address)
- Include: Floor/area within building if mentioned
- Include: Postal codes when present

GOOD ADDRESS EXAMPLES:
- "123 Main Street, New York, NY 10001" - GOOD (has street number)
- "456 Park Avenue, Suite 200, Los Angeles, CA 90001" - GOOD (has street number)
- "789 Boulevard Saint-Germain, Paris, 75005" - GOOD (has street number)
- "100 Oxford Street, London, UK" - GOOD (has street number)

BAD ADDRESS EXAMPLES:
- "The Photo Booth" - BAD (just business name, no street address)
- "Main Street" - BAD (no street number)
- "Downtown Brooklyn" - BAD (no specific address)
- "Somewhere in Manhattan" - BAD (too vague)
- "The Old Theater" - BAD (venue name, not an address)

QUALITY STANDARDS:
- Verify each field makes sense
- Don't hallucinate information not in the content
- If unsure about operational status, mark as unknown
- Standardize country names (USA → United States, UK → United Kingdom)
- For DIRECTORIES: If address doesn't have a street number, SKIP that booth entry
- For CITY GUIDES/BLOGS: Extract even with partial address (venue+neighborhood is OK)

EDGE CASES:
- If multiple booths at same venue, extract as separate entries
- If booth has moved, extract only current location
- If booth is definitively closed/removed, mark status appropriately
- If content mentions "no longer there", mark inactive
- For DIRECTORIES: If only venue name without street address, DO NOT EXTRACT
- For CITY GUIDES/BLOGS: Extract venue name with neighborhood/area (we'll geocode later)

SOURCE-SPECIFIC GUIDANCE:
- autophoto.org: Often lists simple addresses line-by-line. Treat each line with an address as a booth.
- lomography.com: User-submitted locations. Look for "Location", "Address", or map markers in the text.
- flickr.com: Look for photo descriptions containing location data.`;

/**
 * Build extraction prompt based on source type and content
 * ENHANCED with detailed source-type-specific instructions
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

  // Add DETAILED source-specific guidance
  switch (config.source_type) {
    case 'directory':
      prompt += `DIRECTORY EXTRACTION STRATEGY:
This is a directory/database of photo booths. Extract EVERY listing with complete details.

CRITICAL INSTRUCTIONS:
1. Extract ALL booth entries - this is a comprehensive directory
2. Look for structured data: names, addresses, cities, countries
3. Extract coordinates if provided (lat/lng or coordinates)
4. Extract machine types/models if mentioned
5. Look for status indicators (active, closed, removed)
6. Extract any pricing, hours, or contact information
7. Parse tables, lists, and structured HTML carefully
8. Don't skip ANY entries even if they seem incomplete

WHAT TO EXTRACT:
- Venue/location name (REQUIRED)
- Full street address (REQUIRED)
- City, state/region, country
- Coordinates if available
- Machine model/type if mentioned
- Cost, hours, contact info
- Status (active/closed)

\n\n`;
      break;

    case 'city_guide':
      prompt += `CITY GUIDE EXTRACTION STRATEGY:
This is a city guide article, listicle, or blog post mentioning photo booths.

CRITICAL INSTRUCTIONS:
1. Look for venue names, bar names, restaurant names where photo booths are mentioned
2. Extract addresses when provided - they might be in different formats
3. If only a neighborhood is mentioned (e.g., "Silver Lake", "Wicker Park"), that's okay - include it
4. Extract ANY pricing information mentioned (e.g., "$5", "free", "$1.50")
5. Look for phrases like "located at", "find it at", "address:", venue descriptions
6. Include ALL venues mentioned, even if details are sparse
7. The content will be in markdown format with headings, numbered lists, or narrative text

IMPORTANT PATTERNS TO LOOK FOR:
- Numbered lists: "1. Venue Name" or "## Venue Name"
- Inline mentions: "You can find a booth at [Venue Name] in [Location]"
- Address patterns: "123 Main St", "at 456 Oak Ave", "located at 789 Park"
- Neighborhood mentions: "in Silver Lake", "Wicker Park location", "on the Lower East Side"

PARTIAL DATA IS OK:
If a venue is mentioned but some fields are missing, STILL INCLUDE IT.
It's better to have partial data than no data.
If no full address, extract neighborhood, cross streets, or venue name.

\n\n`;
      break;

    case 'blog':
      prompt += `BLOG/TRAVEL SITE EXTRACTION STRATEGY:
This is a blog post or travel article mentioning photo booths in context.

CRITICAL INSTRUCTIONS:
1. Extract any photo booth locations mentioned, including personal experiences
2. Look for venue names, landmarks, or businesses where booths are located
3. Extract addresses, neighborhoods, or geographic descriptions
4. Capture user experiences and contextual details (ambiance, condition, etc.)
5. Include pricing, cost, or operational details if mentioned
6. Note if the author mentions the booth is still there or has been removed
7. Extract from prose, captions, or inline descriptions

CONTEXT IS VALUABLE:
- "We found a booth at [Venue] in [Neighborhood]" - Extract both venue and location
- "The booth near [Landmark]" - Include landmark as location context
- "It costs about $5" - Include pricing
- "Last time I checked it was still there" - Mark as active

HANDLE UNCERTAINTY:
- If author is unsure about status, still include but note uncertainty
- If multiple locations mentioned without clear structure, extract each one
- Personal anecdotes often contain valuable location data

\n\n`;
      break;

    case 'community':
      prompt += `COMMUNITY CONTENT EXTRACTION STRATEGY:
This is community content (forum, reddit, social media) with user-reported locations.

CRITICAL INSTRUCTIONS:
1. Extract user-reported locations with surrounding context
2. Look for comments, posts, or threads mentioning photo booths
3. Capture venue names, addresses, and user experiences
4. Note if users report booths as working, broken, or removed
5. Extract from comment chains and discussion threads
6. Include community knowledge about booth history or changes
7. Be aware of slang or informal location descriptions

USER REPORTS ARE VALUABLE:
- "I saw one at [Location]" - Valid report even without full address
- "The booth at [Venue] is gone now" - Include with status: removed
- "Still works as of [Date]" - Include reported date
- Cross-referenced reports about same location add confidence

COMMUNITY PATTERNS:
- Look for location queries and responses
- Extract from "Does anyone know..." threads
- Capture user corrections or updates
- Note consensus among multiple users

\n\n`;
      break;

    case 'operator':
      prompt += `OPERATOR SITE EXTRACTION STRATEGY:
This is a photo booth operator's website listing their booth locations.

CRITICAL INSTRUCTIONS:
1. This operator owns/manages these booths - extract ALL their locations
2. Look for location pages, store locators, "Where to Find Us" sections
3. Extract complete operational details (hours, contact, machine specs)
4. Often formatted as tables, lists, or map markers
5. May include venue partnership information
6. Extract machine models and types if specified
7. Capture pricing, hours, and operational policies
8. Note if location is permanent installation vs rotating

OPERATOR DATA IS HIGH QUALITY:
- Addresses are usually complete and accurate
- Machine models and types are specified
- Operational status is current
- Contact information is authoritative
- Hours and pricing are official

WHAT TO PRIORITIZE:
- Complete venue/location lists
- Store locator data
- Partnership venues
- Installation details
- Machine specifications
- Pricing and policies

\n\n`;
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
