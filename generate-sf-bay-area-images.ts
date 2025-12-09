import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// SF Bay Area cities
const BAY_AREA_CITIES = [
  'San Francisco',
  'Oakland',
  'Berkeley',
  'San Jose',
  'Palo Alto',
  'Mountain View',
  'Sunnyvale',
  'Santa Clara',
  'Fremont',
  'Hayward',
  'San Mateo',
  'Redwood City',
  'Daly City',
  'Alameda',
  'Richmond',
  'Vallejo',
  'Concord',
  'Santa Rosa',
  'Napa',
];

async function generateImage(booth: any): Promise<string | null> {
  try {
    const locationDescription = booth.address
      ? `street view of ${booth.address}, ${booth.city}, California`
      : `iconic street view of ${booth.city}, California`;

    const prompt = `${locationDescription}. Style: Vintage photo booth strip aesthetic. The image should have a warm, slightly faded nostalgic look, similar to old film photography from the 1960s-1980s. Soft edges, slight vignetting, and warm color tones. This is a LOCATION VIEW, not a photo booth machine.`;

    console.log(`  Generating image for: ${booth.name}`);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    if (!response.data || !response.data[0]?.url) {
      return null;
    }

    return response.data[0].url;
  } catch (error) {
    console.error(`  Error generating image:`, error);
    return null;
  }
}

async function downloadAndUpload(imageUrl: string, boothId: string): Promise<string | null> {
  try {
    // Download image
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase
    const fileName = `booth-${boothId}-ai-preview-${Date.now()}.png`;
    const filePath = `ai-previews/${fileName}`;

    const { error } = await supabase.storage
      .from('booth-images')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('booth-images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(`  Error uploading image:`, error);
    return null;
  }
}

async function main() {
  console.log('SF/Bay Area Image Generation');
  console.log('=============================\n');

  // Get all Bay Area booths without images
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, address, ai_preview_url, photo_exterior_url')
    .in('city', BAY_AREA_CITIES)
    .eq('status', 'active')
    .is('ai_preview_url', null)
    .is('photo_exterior_url', null);

  if (error) {
    console.error('Database error:', error);
    return;
  }

  if (!booths || booths.length === 0) {
    console.log('All Bay Area booths already have images!');
    return;
  }

  console.log(`Found ${booths.length} Bay Area booths needing images`);
  console.log(`Est. cost: $${(booths.length * 0.04).toFixed(2)}\n`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < booths.length; i++) {
    const booth = booths[i];
    console.log(`\n[${i + 1}/${booths.length}] ${booth.name} (${booth.city})`);

    // Generate image
    const tempUrl = await generateImage(booth);
    if (!tempUrl) {
      failed++;
      console.log(`  Failed to generate image`);
      continue;
    }

    // Download and upload
    const permanentUrl = await downloadAndUpload(tempUrl, booth.id);
    if (!permanentUrl) {
      failed++;
      console.log(`  Failed to upload image`);
      continue;
    }

    // Update booth
    const { error: updateError } = await supabase
      .from('booths')
      .update({
        ai_preview_url: permanentUrl,
        ai_preview_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', booth.id);

    if (updateError) {
      failed++;
      console.log(`  Failed to update database:`, updateError.message);
    } else {
      succeeded++;
      console.log(`  Success! Image URL: ${permanentUrl.slice(0, 60)}...`);
    }

    // Rate limiting
    if (i < booths.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }

  console.log(`\n\nCompleted:`);
  console.log(`  Generated: ${succeeded}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Cost: $${(succeeded * 0.04).toFixed(2)}`);
}

main().catch(console.error);
