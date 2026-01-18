import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface Booth {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  country: string;
  machine_model?: string;
  machine_manufacturer?: string;
  booth_type?: string;
  cost?: string;
  hours?: string;
  source_primary?: string;
}

async function generateDescription(booth: Booth): Promise<string> {
  const prompt = `Generate a concise, engaging description (2-3 sentences, 100-150 chars) for this analog photo booth:

Name: ${booth.name}
Location: ${booth.address}, ${booth.city ? booth.city + ', ' : ''}${booth.state ? booth.state + ', ' : ''}${booth.country}
${booth.machine_model ? `Machine: ${booth.machine_model}` : ''}
${booth.machine_manufacturer ? `Manufacturer: ${booth.machine_manufacturer}` : ''}
${booth.booth_type ? `Type: ${booth.booth_type}` : ''}
${booth.cost ? `Cost: ${booth.cost}` : ''}
${booth.hours ? `Hours: ${booth.hours}` : ''}

Write a description that:
1. Highlights what makes this booth special or unique
2. Mentions the location/neighborhood context
3. Includes practical details (machine type, cost) if available
4. Uses enthusiastic but authentic tone
5. Appeals to photo booth enthusiasts and travelers

Description:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    return '';
  } catch (error: any) {
    console.error(`Error generating description for ${booth.name}:`, error.message);
    return '';
  }
}

async function main() {
  console.log('\n=== GENERATING DESCRIPTION FOR HEEBE JEEBE ===\n');

  // Get the booth
  const { data: booth, error } = await supabase
    .from('booths')
    .select('id, name, address, city, state, country, machine_model, machine_manufacturer, booth_type, cost, hours, source_primary')
    .ilike('name', '%heebe%')
    .single();

  if (error || !booth) {
    console.error('Error fetching booth:', error);
    return;
  }

  console.log(`Generating description for: ${booth.name} (${booth.city}, ${booth.state})`);

  const description = await generateDescription(booth);

  if (description) {
    console.log(`\n✅ Generated description:\n"${description}"\n`);

    // Update booth with generated description
    const { error: updateError } = await supabase
      .from('booths')
      .update({
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booth.id);

    if (updateError) {
      console.log(`❌ Failed to update: ${updateError.message}`);
    } else {
      console.log(`✅ Description saved to database\n`);

      // Check updated completeness score
      const { data: updated } = await supabase
        .from('booths')
        .select('completeness_score')
        .eq('id', booth.id)
        .single();

      if (updated) {
        console.log(`📊 New completeness score: ${updated.completeness_score}`);
      }
    }
  } else {
    console.log('⚠️  No description generated');
  }
}

main();
