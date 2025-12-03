import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyFixes() {
  console.log('\n🔧 Applying crawler source fixes...\n');

  // 1. Disable 11 broken sources
  console.log('1️⃣ Disabling 11 broken sources (404s, timeouts, 405s)...');
  const brokenSourceIds = [
    '06e164b0-8071-4e78-ba36-65802ff43a3f', // aastudiosinc (404)
    '0d1a2065-c8ee-473b-84a6-f9c04ed705ac', // Classic Photo Booth (404)
    '6d1ffea2-7d4d-4de7-a787-3d0e0693d70e', // Louie Despres (404)
    '47fd8906-0fea-4519-bf55-ea12bb98e8d8', // Autofoto UK/Spain (timeout)
    '02ca8203-e441-426d-bb94-d4998253ed09', // Photomatica West Coast (404)
    '8867017a-2ec2-40e4-b07d-ca3d827ca4d4', // Girl in Florence (404)
    '8ae47c82-eef9-4139-8846-eb950b9ccb3b', // DoTheBay (404)
    '3187ba89-608f-4d22-9413-0b7725e7907e', // Time Out LA (405)
    '7697acf9-143f-48ca-9abe-1c3ea3324cdf', // Time Out Chicago (405)
    'bad7bc13-613e-4aeb-8b6b-ef0e29c31182'  // Metro Auto Photo Australia (timeout)
  ];

  const { data: disabled, error: disableError } = await supabase
    .from('crawl_sources')
    .update({ enabled: false, status: 'disabled_broken' })
    .in('id', brokenSourceIds)
    .select();

  if (disableError) {
    console.error('   ❌ Error:', disableError.message);
  } else {
    console.log(`   ✅ Disabled ${disabled?.length || 0} broken sources`);
  }

  // 2. Remove duplicate photobooth.net
  console.log('\n2️⃣ Disabling duplicate photobooth.net source...');
  const { data: dupPhotobooth, error: dupPhotoboothError } = await supabase
    .from('crawl_sources')
    .update({ enabled: false, status: 'disabled_duplicate' })
    .eq('source_url', 'https://www.photobooth.net/locations/')
    .lt('total_booths_found', 10)
    .select();

  if (dupPhotoboothError) {
    console.error('   ❌ Error:', dupPhotoboothError.message);
  } else {
    console.log(`   ✅ Disabled ${dupPhotobooth?.length || 0} duplicate photobooth.net sources`);
  }

  // 3. Remove duplicate autophoto
  console.log('\n3️⃣ Disabling duplicate autophoto source...');
  const { data: dupAutophoto, error: dupAutophotoError } = await supabase
    .from('crawl_sources')
    .update({ enabled: false, status: 'disabled_duplicate' })
    .eq('source_name', 'Autophoto Chicago/Midwest')
    .select();

  if (dupAutophotoError) {
    console.error('   ❌ Error:', dupAutophotoError.message);
  } else {
    console.log(`   ✅ Disabled ${dupAutophoto?.length || 0} duplicate autophoto sources`);
  }

  // 4. Fix missing source names
  console.log('\n4️⃣ Fixing missing source names...');

  const nameFixes = [
    { id: 'a6eb60de-4c91-43c3-9ee9-f15a608c6f74', name: 'Photoautomat Berlin' },
    { id: '2652b605-0b48-41e9-b529-819278a8462f', name: 'Booth by Bryant' },
    { id: '28584ea2-1c01-452c-9260-fd2200a2b5c9', name: 'Find My Film Lab' },
    { id: '6ea21991-64ae-4986-aa9f-47b4bc71ea2d', name: 'Eternalog Fotobooth' }
  ];

  let nameFixCount = 0;
  for (const fix of nameFixes) {
    const { error } = await supabase
      .from('crawl_sources')
      .update({ source_name: fix.name })
      .eq('id', fix.id);

    if (!error) nameFixCount++;
  }
  console.log(`   ✅ Fixed ${nameFixCount} source names`);

  // 5. Fix missing extractor
  console.log('\n5️⃣ Fixing missing extractor type...');
  const { data: extractorFix, error: extractorError } = await supabase
    .from('crawl_sources')
    .update({ extractor_type: 'core' })
    .eq('source_name', 'Automatfoto - Stockholm Network')
    .is('extractor_type', null)
    .select();

  if (extractorError) {
    console.error('   ❌ Error:', extractorError.message);
  } else {
    console.log(`   ✅ Fixed ${extractorFix?.length || 0} missing extractors`);
  }

  // Final verification
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION');
  console.log('='.repeat(60));

  const { count: enabledCount } = await supabase
    .from('crawl_sources')
    .select('*', { count: 'exact', head: true })
    .eq('enabled', true);

  const { count: disabledCount } = await supabase
    .from('crawl_sources')
    .select('*', { count: 'exact', head: true })
    .eq('enabled', false);

  console.log(`\n📈 Source Status:`);
  console.log(`   Enabled: ${enabledCount}`);
  console.log(`   Disabled: ${disabledCount}`);
  console.log(`   Total: ${(enabledCount || 0) + (disabledCount || 0)}`);

  console.log('\n✅ All fixes applied successfully!\n');
}

applyFixes().catch(console.error);
