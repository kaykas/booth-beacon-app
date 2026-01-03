#!/usr/bin/env node

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTExOTksImV4cCI6MjA3OTc2NzE5OX0.nVAPKx30OTNSaZ92Koeg_gUonm3Zols3FOTvfO5TrrA';

async function checkChicagoBooths() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/booths?city=ilike.%chicago%&select=id,name,slug,city,photo_exterior_url,photo_interior_url,ai_preview_url,ai_generated_image_url,ai_preview_generated_at,created_at&order=created_at.desc&limit=30`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const booths = await response.json();

  console.log(`\n=== CHICAGO BOOTHS ANALYSIS ===`);
  console.log(`Total Chicago booths found: ${booths.length}\n`);

  let stats = {
    total: booths.length,
    withExterior: 0,
    withInterior: 0,
    withAiPreview: 0,
    withAiGenerated: 0,
    withNoImages: 0,
    withAnyImage: 0
  };

  booths.forEach((booth, index) => {
    const hasExt = !!booth.photo_exterior_url;
    const hasInt = !!booth.photo_interior_url;
    const hasAiPrev = !!booth.ai_preview_url;
    const hasAiGen = !!booth.ai_generated_image_url;
    const hasAnyImage = hasExt || hasInt || hasAiPrev || hasAiGen;

    if (hasExt) stats.withExterior++;
    if (hasInt) stats.withInterior++;
    if (hasAiPrev) stats.withAiPreview++;
    if (hasAiGen) stats.withAiGenerated++;
    if (!hasAnyImage) stats.withNoImages++;
    if (hasAnyImage) stats.withAnyImage++;

    const name = booth.name || 'NO NAME';
    const imageStatus = [
      hasExt ? 'EXT✓' : 'EXT✗',
      hasInt ? 'INT✓' : 'INT✗',
      hasAiPrev ? 'AI-PREV✓' : 'AI-PREV✗',
      hasAiGen ? 'AI-GEN✓' : 'AI-GEN✗'
    ].join(' | ');

    console.log(`${(index + 1).toString().padStart(2)}. ${name.substring(0, 40).padEnd(42)} | ${imageStatus}`);
    console.log(`    Slug: ${booth.slug}`);

    if (!hasAnyImage) {
      console.log(`    ⚠️  NO IMAGES AT ALL`);
    }
    console.log('');
  });

  console.log('\n=== STATISTICS ===');
  console.log(`Total booths: ${stats.total}`);
  console.log(`With ANY image: ${stats.withAnyImage} (${Math.round(stats.withAnyImage / stats.total * 100)}%)`);
  console.log(`With NO images: ${stats.withNoImages} (${Math.round(stats.withNoImages / stats.total * 100)}%)`);
  console.log(`With exterior photo: ${stats.withExterior} (${Math.round(stats.withExterior / stats.total * 100)}%)`);
  console.log(`With interior photo: ${stats.withInterior} (${Math.round(stats.withInterior / stats.total * 100)}%)`);
  console.log(`With AI preview: ${stats.withAiPreview} (${Math.round(stats.withAiPreview / stats.total * 100)}%)`);
  console.log(`With AI generated: ${stats.withAiGenerated} (${Math.round(stats.withAiGenerated / stats.total * 100)}%)`);

  // Show examples of booths with no images
  console.log('\n=== BOOTHS WITH NO IMAGES (First 10) ===');
  const noImageBooths = booths.filter(b =>
    !b.photo_exterior_url && !b.photo_interior_url && !b.ai_preview_url && !b.ai_generated_image_url
  ).slice(0, 10);

  noImageBooths.forEach((booth, index) => {
    console.log(`${index + 1}. ${booth.name || 'NO NAME'} (${booth.slug})`);
    console.log(`   Created: ${booth.created_at}`);
    console.log(`   URL: https://boothbeacon.org/booth/${booth.slug}`);
  });
}

checkChicagoBooths().catch(console.error);
