import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ2JtY2J3Zmt2bXlsbWZwa3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTExOTksImV4cCI6MjA3OTc2NzE5OX0.nVAPKx30OTNSaZ92Koeg_gUonm3Zols3FOTvfO5TrrA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function analyzeChicagoBooths() {
  console.log('\n🔍 Analyzing Chicago Booths...\n');

  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, slug, city, photo_exterior_url, photo_interior_url, ai_preview_url, ai_generated_image_url, ai_preview_generated_at, created_at')
    .ilike('city', '%chicago%')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching booths:', error);
    return;
  }

  console.log(`Total Chicago booths: ${booths.length}\n`);

  const stats = {
    total: booths.length,
    withExterior: 0,
    withInterior: 0,
    withAiPreview: 0,
    withAiGenerated: 0,
    withNoImages: 0,
    withAnyImage: 0,
    noImagesBooths: []
  };

  booths.forEach((booth) => {
    const hasExt = !!booth.photo_exterior_url;
    const hasInt = !!booth.photo_interior_url;
    const hasAiPrev = !!booth.ai_preview_url;
    const hasAiGen = !!booth.ai_generated_image_url;
    const hasAnyImage = hasExt || hasInt || hasAiPrev || hasAiGen;

    if (hasExt) stats.withExterior++;
    if (hasInt) stats.withInterior++;
    if (hasAiPrev) stats.withAiPreview++;
    if (hasAiGen) stats.withAiGenerated++;
    if (hasAnyImage) stats.withAnyImage++;

    if (!hasAnyImage) {
      stats.withNoImages++;
      stats.noImagesBooths.push(booth);
    }
  });

  console.log('=== STATISTICS ===');
  console.log(`📊 Total booths: ${stats.total}`);
  console.log(`✅ With ANY image: ${stats.withAnyImage} (${Math.round(stats.withAnyImage / stats.total * 100)}%)`);
  console.log(`❌ With NO images: ${stats.withNoImages} (${Math.round(stats.withNoImages / stats.total * 100)}%)`);
  console.log(`📷 With exterior photo: ${stats.withExterior} (${Math.round(stats.withExterior / stats.total * 100)}%)`);
  console.log(`🏠 With interior photo: ${stats.withInterior} (${Math.round(stats.withInterior / stats.total * 100)}%)`);
  console.log(`🤖 With AI preview: ${stats.withAiPreview} (${Math.round(stats.withAiPreview / stats.total * 100)}%)`);
  console.log(`🎨 With AI generated: ${stats.withAiGenerated} (${Math.round(stats.withAiGenerated / stats.total * 100)}%)`);

  if (stats.noImagesBooths.length > 0) {
    console.log(`\n\n=== ❌ BOOTHS WITH NO IMAGES (${stats.noImagesBooths.length} total) ===\n`);

    stats.noImagesBooths.slice(0, 15).forEach((booth, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${(booth.name || 'NO NAME').substring(0, 50)}`);
      console.log(`    Slug: ${booth.slug}`);
      console.log(`    Created: ${new Date(booth.created_at).toLocaleDateString()}`);
      console.log(`    URL: https://boothbeacon.org/booth/${booth.slug}`);
      console.log('');
    });

    if (stats.noImagesBooths.length > 15) {
      console.log(`    ... and ${stats.noImagesBooths.length - 15} more\n`);
    }
  }

  console.log('\n=== 🎯 RECOMMENDATIONS ===');
  console.log(`1. ${stats.withNoImages} booths need AI preview generation`);
  console.log(`2. Run batch AI preview generation: npm run generate-previews`);
  console.log(`3. Consider manual photo collection for top Chicago booths`);
}

analyzeChicagoBooths().catch(console.error);
