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
  console.log('\n=== AI DESCRIPTION GENERATOR ===\n');
  console.log('Generating descriptions for booths without descriptions...\n');

  // Get active booths without descriptions
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, address, city, state, country, machine_model, machine_manufacturer, booth_type, cost, hours, source_primary')
    .eq('status', 'active')
    .or('description.is.null,description.eq.')
    .order('completeness_score', { ascending: true })  // Prioritize least complete
    .limit(50);  // Process 50 at a time

  if (error) {
    console.error('Error fetching booths:', error);
    return;
  }

  if (!booths || booths.length === 0) {
    console.log('✅ All active booths already have descriptions!');
    return;
  }

  console.log(`Found ${booths.length} booths needing descriptions\n`);

  let successful = 0;
  let failed = 0;

  for (const booth of booths) {
    try {
      console.log(`🔄 Generating description for: ${booth.name}`);

      const description = await generateDescription(booth);

      if (description) {
        // Update booth with generated description
        const { error: updateError } = await supabase
          .from('booths')
          .update({
            description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booth.id);

        if (updateError) {
          console.log(`   ❌ Failed to update: ${updateError.message}`);
          failed++;
        } else {
          console.log(`   ✅ Description added: "${description.substring(0, 80)}..."`);
          successful++;
        }
      } else {
        console.log(`   ⚠️  No description generated`);
        failed++;
      }

      // Rate limiting: Wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully generated: ${successful} descriptions`);
  console.log(`❌ Failed: ${failed} descriptions`);
  console.log('='.repeat(60) + '\n');

  // Report updated completeness scores
  const { data: stats, error: statsError } = await supabase
    .from('booths')
    .select('completeness_score')
    .eq('status', 'active');

  if (!statsError && stats) {
    const avgScore = stats.reduce((sum, b) => sum + (b.completeness_score || 0), 0) / stats.length;
    const withDescriptions = stats.filter(b => b.completeness_score >= 50).length;

    console.log(`📊 Updated Stats:`);
    console.log(`   Average completeness: ${avgScore.toFixed(1)}%`);
    console.log(`   Booths with 50+ score: ${withDescriptions} (${(withDescriptions / stats.length * 100).toFixed(1)}%)\n`);
  }
}

main();
