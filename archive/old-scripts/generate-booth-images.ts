/**
 * AI IMAGE GENERATION FOR PHOTOBOOTHS
 *
 * Generates detailed image prompts for photobooths using Claude AI.
 * These prompts can be used with DALL-E, Midjourney, or Stable Diffusion.
 *
 * For each booth without photos, creates:
 * - Hero image prompt (exterior booth in venue)
 * - Detail shot prompts (film developing, vintage mechanism)
 * - Atmospheric venue context
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BoothData {
  id: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  machine_model: string | null;
  machine_year: number | null;
  booth_type: string | null;
  description: string | null;
  operator_name: string | null;
}

interface ImagePrompts {
  hero_prompt: string;
  detail_prompt: string;
  atmosphere_prompt: string;
}

/**
 * Generate image prompts using Claude
 */
async function generateImagePrompts(booth: BoothData): Promise<ImagePrompts> {
  const prompt = `You are an expert in vintage analog photobooths and photographic equipment.

Generate THREE detailed image generation prompts for this photobooth that could be used with DALL-E, Midjourney, or Stable Diffusion.

BOOTH DETAILS:
- Name: ${booth.name}
- Location: ${booth.city}, ${booth.state || ''} ${booth.country}
- Machine Model: ${booth.machine_model || 'Classic analog photobooth'}
- Year: ${booth.machine_year || 'Vintage (1950s-1980s era)'}
- Type: ${booth.booth_type || 'Analog chemical'}
- Description: ${booth.description || 'Vintage analog photobooth'}
- Operator: ${booth.operator_name || 'Independent'}

GENERATE THREE PROMPTS:

1. **HERO IMAGE** - External booth in venue:
   - Photorealistic, warm lighting
   - Vintage curtained booth in its natural setting
   - Include venue atmosphere (bar, hotel lobby, arcade, etc.)
   - Show the iconic photobooth shape (tall rectangular box with curtain)
   - Capture the character of the location

2. **DETAIL SHOT** - Internal mechanism or developing process:
   - Close-up of film developing chemicals
   - Or: Vintage mechanical components (gears, lenses, flash system)
   - Technical beauty, industrial design aesthetic
   - Show the analog magic at work

3. **ATMOSPHERIC CONTEXT** - People using the booth:
   - Friends or couple entering/exiting booth
   - Anticipation as photo strips develop
   - Nostalgic, candid moment
   - Authentic 35mm film photography aesthetic

STYLE GUIDELINES:
- Photorealistic, not illustrated
- Warm, inviting lighting (not harsh fluorescent)
- Authentic to the era and location
- Emphasize the analog, chemical process where visible
- Capture the joy and nostalgia of photobooths

FORMAT:
Return ONLY a JSON object with three keys: hero_prompt, detail_prompt, atmosphere_prompt
Each value should be a complete, detailed image generation prompt (50-100 words).

Example format:
{
  "hero_prompt": "Photorealistic image of a vintage analog photobooth with red velvet curtain...",
  "detail_prompt": "Extreme close-up macro photograph of black-and-white photo paper developing...",
  "atmosphere_prompt": "Two friends laughing as they exit a vintage photobooth..."
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const content = message.content[0];
  if (content.type === 'text') {
    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  }

  // Fallback generic prompts
  return {
    hero_prompt: `Photorealistic image of a vintage analog photobooth in ${booth.city}, warm lighting, nostalgic atmosphere, ${booth.machine_model || 'classic design'} machine`,
    detail_prompt: `Close-up of vintage photobooth internal mechanism, chemical film developing process, industrial analog beauty`,
    atmosphere_prompt: `People using a vintage analog photobooth, authentic moment, 35mm film aesthetic, nostalgic scene`
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Starting AI Image Prompt Generation\n');

  const BATCH_SIZE = parseInt(process.argv[2] || '10');
  console.log(`Batch size: ${BATCH_SIZE} booths\n`);

  // Get booths that need image prompts (no photos, active status)
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, state, country, machine_model, machine_year, booth_type, description, operator_name, photos')
    .eq('status', 'active')
    .is('photos', null)
    .limit(BATCH_SIZE);

  if (error) {
    console.error('Error fetching booths:', error);
    return;
  }

  if (!booths || booths.length === 0) {
    console.log('No booths need image prompts!');
    return;
  }

  console.log(`Found ${booths.length} booths needing image prompts\n`);
  console.log('='.repeat(60));

  let generated = 0;
  let errors = 0;

  // Store prompts in a JSON file for later use with image generation APIs
  const allPrompts: any[] = [];

  for (const booth of booths) {
    try {
      console.log(`\n📍 ${booth.name} (${booth.city}, ${booth.country})`);

      // Generate image prompts
      const prompts = await generateImagePrompts(booth);
      console.log(`   ✅ Generated 3 image prompts`);
      console.log(`   Hero: ${prompts.hero_prompt.substring(0, 60)}...`);

      // Store for batch generation later
      allPrompts.push({
        booth_id: booth.id,
        booth_name: booth.name,
        location: `${booth.city}, ${booth.country}`,
        ...prompts
      });

      generated++;

      // Rate limiting: 1 request per 2 seconds (Opus is slower)
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      errors++;
    }
  }

  // Save all prompts to a file
  const fs = await import('fs');
  fs.writeFileSync(
    'booth-image-prompts.json',
    JSON.stringify(allPrompts, null, 2)
  );

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Generated: ${generated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📄 Saved prompts to: booth-image-prompts.json`);
  console.log('='.repeat(60));

  console.log('\n💡 Next Steps:');
  console.log('   1. Use booth-image-prompts.json with DALL-E 3 API');
  console.log('   2. Or: Copy prompts to Midjourney Discord');
  console.log('   3. Or: Use with Stable Diffusion API');
  console.log('   4. Upload generated images to booth pages');

  console.log('\n✨ Done!');
}

main().catch(console.error);
