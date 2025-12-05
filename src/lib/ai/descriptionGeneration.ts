/**
 * AI Description Generation Service
 * Generates compelling descriptions for photo booths using OpenAI GPT-4
 * Creates 2-3 paragraph narratives based on available booth data
 */

interface Booth {
  id: string;
  name: string;
  city?: string;
  country?: string;
  state?: string;
  machine_model?: string;
  machine_manufacturer?: string;
  machine_year?: number;
  booth_type?: string;
  photo_type?: string;
  cost?: string;
  status?: string;
  description?: string;
  address?: string;
  operator_name?: string;
}

interface DescriptionGenerationResult {
  success: boolean;
  description?: string;
  error?: string;
}

/**
 * Generate a compelling description for a booth using AI
 */
export async function generateBoothDescription(
  booth: Booth
): Promise<DescriptionGenerationResult> {
  try {
    // Skip if already has a good description (>100 chars)
    if (booth.description && booth.description.length > 100) {
      return {
        success: true,
        description: booth.description,
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY not set, cannot generate description');
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    const prompt = constructDescriptionPrompt(booth);
    const description = await callOpenAIAPI(prompt, apiKey);

    return {
      success: true,
      description,
    };
  } catch (error) {
    console.error('Error generating booth description:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Construct a prompt for generating a booth description
 */
function constructDescriptionPrompt(booth: Booth): string {
  const {
    name,
    city,
    country,
    state,
    machine_model,
    machine_manufacturer,
    machine_year,
    booth_type,
    photo_type,
    cost,
    status,
    address,
    operator_name,
  } = booth;

  // Build location context
  const locationParts = [city, state, country].filter(Boolean);
  const location = locationParts.join(', ');

  // Determine rarity context
  const rarityContext = getRarityContext(booth);

  const prompt = `
You are a photobooth enthusiast writing an engaging description for a vintage analog photobooth listing.

Booth Details:
- Name: ${name}
- Location: ${location}
${address ? `- Address: ${address}` : ''}
${machine_model ? `- Machine Model: ${machine_model}` : ''}
${machine_manufacturer ? `- Manufacturer: ${machine_manufacturer}` : ''}
${machine_year ? `- Year Manufactured: ${machine_year}` : ''}
${booth_type ? `- Type: ${booth_type}` : ''}
${photo_type ? `- Photo Type: ${photo_type}` : ''}
${cost ? `- Cost: ${cost}` : ''}
${status ? `- Status: ${status}` : ''}
${operator_name ? `- Operated by: ${operator_name}` : ''}
${rarityContext ? `- Notable: ${rarityContext}` : ''}

Write a 2-3 paragraph description (150-250 words) that:
1. Opens with what makes this booth special or interesting
2. Provides context about the location, machine, or history
3. Includes practical information visitors should know
4. Conveys enthusiasm for analog photobooth culture
5. Focuses on facts and avoids speculation

Tone: Informative, enthusiastic, respectful of photobooth culture
Style: Engaging but professional, accessible to both enthusiasts and newcomers
Avoid: Overly promotional language, unverified claims, excessive superlatives

Return only the description text, no preamble or metadata.
  `.trim();

  return prompt;
}

/**
 * Determine rarity or special context for a booth
 */
function getRarityContext(booth: Booth): string | null {
  const { machine_year, booth_type, photo_type } = booth;

  // Very old machines
  if (machine_year && machine_year < 1960) {
    return 'one of the oldest operating photobooths';
  }

  // Pre-1970 machines
  if (machine_year && machine_year < 1970) {
    return 'a rare vintage machine from the golden age of photobooths';
  }

  // Color film rarity
  if (photo_type === 'color') {
    return 'rare color film booth (most analog booths only offer black & white)';
  }

  // Chemical/analog emphasis
  if (booth_type === 'analog' || booth_type === 'chemical') {
    return 'authentic analog chemical process machine';
  }

  return null;
}

/**
 * Call OpenAI GPT-4 API to generate description
 */
async function callOpenAIAPI(prompt: string, apiKey: string): Promise<string> {
  try {
    const { default: OpenAI } = await import('openai');

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    console.log('Calling OpenAI GPT-4 for description generation...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in vintage analog photobooths and photographic history. You write engaging, informative descriptions that inspire people to visit these rare cultural artifacts.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const description = completion.choices[0]?.message?.content;

    if (!description) {
      throw new Error('OpenAI returned no description');
    }

    console.log('Successfully generated description');
    return description.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Batch generate descriptions for multiple booths
 * Includes rate limiting to avoid API throttling
 */
export async function batchGenerateDescriptions(
  booths: Booth[],
  delayMs: number = 1000
): Promise<Map<string, DescriptionGenerationResult>> {
  const results = new Map<string, DescriptionGenerationResult>();

  for (const booth of booths) {
    const result = await generateBoothDescription(booth);
    results.set(booth.id, result);

    // Rate limit: wait between requests
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Update booth record with generated description
 */
export async function updateBoothDescription(
  boothId: string,
  description: string
): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing');
  }

  // Use service role key for admin updates
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from('booths')
    .update({
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', boothId);

  if (error) {
    throw new Error(`Failed to update booth: ${error.message}`);
  }

  console.log(`Updated description for booth ${boothId}`);
}
