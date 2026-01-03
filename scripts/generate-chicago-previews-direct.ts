/**
 * Generate AI preview images for 5 specific Chicago booths
 * Direct version that bypasses the API and calls the functions directly
 *
 * Booths to generate previews for:
 * 1. Schubas (slug: schubas-chicago-1)
 * 2. Reckless Records (slug: reckless-records-chicago-1)
 * 3. Quimby's Bookstore (slug: quimby-s-bookstore-chicago-1)
 * 4. Sheffield's (slug: sheffield-s-chicago-1)
 * 5. Charleston (slug: charleston-chicago)
 */

import { createClient } from '@supabase/supabase-js';
import {
  generateLocationImage,
  uploadGeneratedImage,
  updateBoothAIPreview,
} from '../src/lib/imageGeneration';

const BOOTH_SLUGS = [
  'schubas-chicago-1',
  'reckless-records-chicago-1',
  'quimby-s-bookstore-chicago-1',
  'sheffield-s-chicago-1',
  'charleston-chicago',
];

interface GenerationResult {
  slug: string;
  boothId: string;
  boothName: string;
  success: boolean;
  aiPreviewUrl?: string;
  error?: string;
}

async function generatePreviewsForChicagoBooths() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  if (!openaiApiKey) {
    console.error('❌ Missing OpenAI API key');
    console.error('Required: OPENAI_API_KEY');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('🎯 Chicago AI Preview Generation Script (Direct)');
  console.log('==================================================\n');

  // Fetch booth IDs for the slugs
  console.log('📋 Fetching booth details...');
  const { data: booths, error: fetchError } = await supabase
    .from('booths')
    .select('id, slug, name, city, country, address, ai_preview_url')
    .in('slug', BOOTH_SLUGS);

  if (fetchError || !booths) {
    console.error('❌ Error fetching booths:', fetchError?.message);
    process.exit(1);
  }

  console.log(`✅ Found ${booths.length} booths\n`);

  // Display booth information
  console.log('Booths to process:');
  booths.forEach((booth, index) => {
    const status = booth.ai_preview_url ? '✅ Has preview' : '⏳ Needs preview';
    console.log(`  ${index + 1}. ${booth.name} (${booth.slug}) - ${status}`);
  });
  console.log();

  // Filter to only booths that need previews
  const boothsNeedingPreviews = booths.filter((b) => !b.ai_preview_url);

  if (boothsNeedingPreviews.length === 0) {
    console.log('✅ All booths already have AI preview images!');
    return;
  }

  console.log(`🎨 Generating AI previews for ${boothsNeedingPreviews.length} booths using DALL-E 3...\n`);

  // Generate previews one by one
  const results: GenerationResult[] = [];

  for (const booth of boothsNeedingPreviews) {
    console.log(`🖼️  Processing: ${booth.name} (${booth.slug})`);
    console.log(`   Location: ${booth.address || booth.city}, ${booth.country}`);

    try {
      // Generate AI image
      console.log('   🎨 Generating AI image with DALL-E 3...');
      const result = await generateLocationImage({
        city: booth.city,
        country: booth.country,
        address: booth.address,
        boothName: booth.name,
      });

      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Image generation failed');
      }

      console.log('   ✅ Image generated successfully');

      // Upload to Supabase if needed (data URL)
      let finalImageUrl = result.imageUrl;
      if (result.imageUrl.startsWith('data:')) {
        console.log('   📤 Uploading to Supabase storage...');
        finalImageUrl = await uploadGeneratedImage(result.imageUrl, booth.id);
        console.log('   ✅ Image uploaded');
      } else if (result.imageUrl.startsWith('http')) {
        // If it's a temporary DALL-E URL, we should download and upload it
        console.log('   📤 Downloading and uploading to Supabase storage...');
        const response = await fetch(result.imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        finalImageUrl = await uploadGeneratedImage(dataUrl, booth.id);
        console.log('   ✅ Image uploaded');
      }

      // Update booth record
      console.log('   💾 Updating booth record...');
      await updateBoothAIPreview(booth.id, finalImageUrl);
      console.log(`   ✅ Success! Preview URL: ${finalImageUrl}\n`);

      results.push({
        slug: booth.slug,
        boothId: booth.id,
        boothName: booth.name,
        success: true,
        aiPreviewUrl: finalImageUrl,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`   ❌ Failed: ${errorMessage}\n`);
      results.push({
        slug: booth.slug,
        boothId: booth.id,
        boothName: booth.name,
        success: false,
        error: errorMessage,
      });
    }

    // Wait 2 seconds between requests to avoid rate limiting
    if (boothsNeedingPreviews.indexOf(booth) < boothsNeedingPreviews.length - 1) {
      console.log('   ⏳ Waiting 2 seconds before next generation...\n');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('==================================================');
  console.log('📊 Generation Summary');
  console.log('==================================================\n');

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total processed: ${results.length}\n`);

  if (successful > 0) {
    console.log('Successfully generated previews for:');
    results
      .filter((r) => r.success)
      .forEach((r) => {
        console.log(`  ✅ ${r.boothName} (${r.slug})`);
        console.log(`     ${r.aiPreviewUrl}`);
      });
    console.log();
  }

  if (failed > 0) {
    console.log('Failed booths:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  ❌ ${r.boothName} (${r.slug}): ${r.error}`);
      });
    console.log();
  }

  // Verify final state
  console.log('🔍 Verifying final state...');
  const { data: finalBooths, error: verifyError } = await supabase
    .from('booths')
    .select('slug, name, ai_preview_url')
    .in('slug', BOOTH_SLUGS);

  if (verifyError || !finalBooths) {
    console.error('❌ Error verifying final state:', verifyError?.message);
    return;
  }

  console.log('\nFinal state:');
  finalBooths.forEach((booth, index) => {
    const status = booth.ai_preview_url ? '✅ Has preview' : '❌ No preview';
    console.log(`  ${index + 1}. ${booth.name} - ${status}`);
  });

  const allHavePreviews = finalBooths.every((b) => b.ai_preview_url);
  console.log();
  if (allHavePreviews) {
    console.log('🎉 SUCCESS! All 5 Chicago booths now have AI preview images!');
  } else {
    console.log('⚠️  Some booths still missing previews. Review errors above.');
  }
}

// Run the script
generatePreviewsForChicagoBooths().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
