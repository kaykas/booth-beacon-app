/**
 * PHASE 2: AI-POWERED BOOTH DESCRIPTION GENERATOR
 *
 * Generates engaging, contextual descriptions for photobooths using Claude AI.
 * Includes rarity detection, historical context, and location-specific details.
 *
 * Based on BOOTH_PAGE_REDESIGN_PLAN.md expert recommendations.
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
  machine_manufacturer: string | null;
  booth_type: string | null;
  cost: string | null;
  operator_name: string | null;
  description: string | null;
  historical_notes: string | null;
}

interface RarityContext {
  isOldest?: boolean;
  isRareModel?: boolean;
  isOnlyInCity?: boolean;
  isColorFilm?: boolean;
  rarityScore: number;
  context: string;
}

/**
 * Detect rarity indicators for a booth
 */
async function detectRarity(booth: BoothData): Promise<RarityContext> {
  let rarityScore = 0;
  const contexts: string[] = [];

  // Check if oldest booth (pre-1960)
  if (booth.machine_year && booth.machine_year < 1960) {
    rarityScore += 30;
    contexts.push(`one of the oldest operating photobooths (${booth.machine_year})`);
  }

  // Check if rare model (count < 5 globally)
  if (booth.machine_model) {
    const { count } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true })
      .eq('machine_model', booth.machine_model);

    if (count !== null && count < 5) {
      rarityScore += 25;
      contexts.push(`one of only ${count} ${booth.machine_model} machines still operating worldwide`);
    } else if (count !== null && count < 20) {
      rarityScore += 15;
      contexts.push(`one of the rare ${booth.machine_model} machines still in service`);
    }
  }

  // Check if only booth in city
  const { count: cityCount } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('city', booth.city)
    .eq('status', 'active');

  if (cityCount === 1) {
    rarityScore += 20;
    contexts.push(`the only analog photobooth in ${booth.city}`);
  } else if (cityCount !== null && cityCount <= 3) {
    rarityScore += 10;
    contexts.push(`one of only ${cityCount} analog photobooths in ${booth.city}`);
  }

  // Check if color film (rare)
  if (booth.booth_type?.toLowerCase().includes('color')) {
    rarityScore += 15;
    contexts.push('rare color film booth');
  }

  return {
    isOldest: booth.machine_year ? booth.machine_year < 1960 : false,
    isRareModel: contexts.some(c => c.includes('rare')),
    isOnlyInCity: cityCount === 1,
    isColorFilm: booth.booth_type?.toLowerCase().includes('color'),
    rarityScore,
    context: contexts.join(' and ')
  };
}

/**
 * Generate engaging description using Claude
 */
async function generateDescription(
  booth: BoothData,
  rarity: RarityContext
): Promise<string> {
  const prompt = `You are an expert on vintage analog photobooths and analog photography culture.

Generate a compelling, engaging 2-3 sentence description for this photobooth location that will make people want to visit.

BOOTH DETAILS:
- Name: ${booth.name}
- Location: ${booth.city}, ${booth.state || ''} ${booth.country}
- Machine: ${booth.machine_model || 'Analog photobooth'}
- Year: ${booth.machine_year || 'Unknown'}
- Manufacturer: ${booth.machine_manufacturer || 'Unknown'}
- Type: ${booth.booth_type || 'Analog'}
- Cost: ${booth.cost || 'Check locally'}
- Operator: ${booth.operator_name || 'Independent'}

RARITY CONTEXT:
${rarity.context || 'A classic analog photobooth'}
Rarity Score: ${rarity.rarityScore}/100

EXISTING DESCRIPTION (if any):
${booth.description || 'None'}

WRITING GUIDELINES:
1. Lead with what makes this booth special (rarity, history, location character)
2. Emphasize the tangible magic: "real chemistry", "developing in real-time", "no digital filters"
3. Include location context: Is it in a hip bar? Historic venue? Hidden gem?
4. Use evocative language but stay factual
5. If rarity score > 30: Emphasize the urgency ("one of the last", "rare opportunity")
6. If rarity score 10-30: Highlight what makes it special
7. If rarity score < 10: Focus on the experience and location
8. Mention the machine model/manufacturer if it's notable (Photo-Me, Anatol Josepho, etc.)
9. Keep it under 200 characters if possible, max 300
10. End with an action-oriented phrase

GOOD EXAMPLES:
- "This Model 11 from 1962 is one of only three still developing black-and-white strips in Chicago. Watch your portrait emerge from real chemistry at this legendary Lincoln Park dive bar."
- "The only analog booth in Portland's Pearl District. This Photo-Me machine has been tucked in Powell's Books since 1989, offering readers instant film portraits for $8."
- "Berlin's iconic Mauerpark booth processes genuine silver halide film—no digital tricks. Join locals for authentic 4-strip portraits at this weekend flea market institution."

BAD EXAMPLES (avoid these):
- "A photobooth located at this address." (Too generic)
- "Digital photo printing available." (Wrong! Never mention digital)
- "The photobooth is fun." (Too vague, no specifics)

Generate ONLY the description text, no preamble or explanation:`;

  const message = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text.trim();
  }

  return '';
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Starting AI Description Generation\n');

  // Get booths that need descriptions (empty or generic)
  const { data: booths, error } = await supabase
    .from('booths')
    .select('*')
    .or('description.is.null,description.eq.""')
    .eq('status', 'active')
    .limit(50); // Start with 50 booths

  if (error) {
    console.error('Error fetching booths:', error);
    return;
  }

  if (!booths || booths.length === 0) {
    console.log('No booths need descriptions!');
    return;
  }

  console.log(`Found ${booths.length} booths needing descriptions\n`);

  let generated = 0;
  let errors = 0;

  for (const booth of booths) {
    try {
      console.log(`\n📍 ${booth.name} (${booth.city}, ${booth.country})`);

      // Detect rarity
      const rarity = await detectRarity(booth);
      console.log(`   Rarity Score: ${rarity.rarityScore}/100`);
      if (rarity.context) {
        console.log(`   Context: ${rarity.context}`);
      }

      // Generate description
      const description = await generateDescription(booth, rarity);
      console.log(`   Generated: "${description}"`);

      // Update database
      const { error: updateError } = await supabase
        .from('booths')
        .update({ description })
        .eq('id', booth.id);

      if (updateError) {
        console.error(`   ❌ Error updating: ${updateError.message}`);
        errors++;
      } else {
        console.log(`   ✅ Saved`);
        generated++;
      }

      // Rate limiting: 1 request per 2 seconds (30 requests/minute)
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`   ❌ Error processing booth:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Generated: ${generated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(60));
  console.log('\n✨ Done!');
}

main().catch(console.error);
