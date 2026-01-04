import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function verifyGuides() {
  console.log('🔍 Verifying City Guides in Database\n');
  console.log('='.repeat(80));

  const { data: guides, error } = await supabase
    .from('city_guides')
    .select('*')
    .order('slug');

  if (error) {
    console.error('Error fetching guides:', error);
    return;
  }

  if (!guides || guides.length === 0) {
    console.log('❌ No city guides found in database!');
    return;
  }

  console.log(`\n✅ Found ${guides.length} city guides:\n`);

  for (const guide of guides) {
    console.log(`📍 ${guide.city} (${guide.country})`);
    console.log(`   Slug: ${guide.slug}`);
    console.log(`   Title: ${guide.title}`);
    console.log(`   Booths: ${guide.booth_ids?.length || 0}`);
    console.log(`   Estimated time: ${guide.estimated_time}`);
    console.log(`   Hero image: ${guide.hero_image_url ? '✓' : '✗'}`);
    console.log(`   Published: ${guide.published ? '✓' : '✗'}`);
    console.log(`   Description: ${guide.description?.substring(0, 80)}...`);
    console.log(`   Tips preview: ${guide.tips?.substring(0, 60)}...`);
    console.log();
  }

  console.log('='.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   Total guides: ${guides.length}`);
  console.log(`   Published guides: ${guides.filter((g) => g.published).length}`);
  console.log(`   Total booths across all guides: ${guides.reduce((sum, g) => sum + (g.booth_ids?.length || 0), 0)}`);
  console.log();
}

verifyGuides().catch(console.error);
