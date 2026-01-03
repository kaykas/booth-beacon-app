/**
 * Generate AI preview images for 5 specific Chicago booths
 *
 * Booths to generate previews for:
 * 1. Schubas (slug: schubas-chicago-1)
 * 2. Reckless Records (slug: reckless-records-chicago-1)
 * 3. Quimby's Bookstore (slug: quimby-s-bookstore-chicago-1)
 * 4. Sheffield's (slug: sheffield-s-chicago-1)
 * 5. Charleston (slug: charleston-chicago)
 */

import { createClient } from '@supabase/supabase-js';

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
  success: boolean;
  aiPreviewUrl?: string;
  error?: string;
}

async function generatePreviewsForChicagoBooths() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('🎯 Chicago AI Preview Generation Script');
  console.log('========================================\n');

  // Fetch booth IDs for the slugs
  console.log('📋 Fetching booth IDs...');
  const { data: booths, error: fetchError } = await supabase
    .from('booths')
    .select('id, slug, name, city, ai_preview_url')
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

  console.log(`🎨 Generating previews for ${boothsNeedingPreviews.length} booths...\n`);

  // Generate previews one by one
  const results: GenerationResult[] = [];

  for (const booth of boothsNeedingPreviews) {
    console.log(`🖼️  Processing: ${booth.name} (${booth.slug})`);

    try {
      // Call the API endpoint
      const response = await fetch(`${appUrl}/api/booths/generate-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boothId: booth.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      if (result.success && result.aiPreviewUrl) {
        console.log(`   ✅ Success! Preview URL: ${result.aiPreviewUrl}`);
        results.push({
          slug: booth.slug,
          boothId: booth.id,
          success: true,
          aiPreviewUrl: result.aiPreviewUrl,
        });
      } else {
        throw new Error('No preview URL in response');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`   ❌ Failed: ${errorMessage}`);
      results.push({
        slug: booth.slug,
        boothId: booth.id,
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
  console.log('\n========================================');
  console.log('📊 Generation Summary');
  console.log('========================================\n');

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total processed: ${results.length}\n`);

  if (failed > 0) {
    console.log('Failed booths:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  • ${r.slug}: ${r.error}`);
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
    if (booth.ai_preview_url) {
      console.log(`     ${booth.ai_preview_url}`);
    }
  });

  const allHavePreviews = finalBooths.every((b) => b.ai_preview_url);
  console.log();
  if (allHavePreviews) {
    console.log('🎉 SUCCESS! All 5 Chicago booths now have AI preview images!');
  } else {
    console.log('⚠️  Some booths still missing previews. You may need to re-run the script.');
  }
}

// Run the script
generatePreviewsForChicagoBooths().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
