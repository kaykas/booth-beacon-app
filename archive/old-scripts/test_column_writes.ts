import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testColumnWrites() {
  console.log('🧪 Testing write access to enrichment columns...\n');

  // Get a booth to test with
  const { data: booths, error: selectError } = await supabase
    .from('booths')
    .select('id, name, enrichment_attempted_at, geocoded_at, google_place_id')
    .limit(1);

  if (selectError || !booths || booths.length === 0) {
    console.error('❌ Error selecting test booth:', selectError?.message);
    return;
  }

  const testBooth = booths[0];
  console.log(`Testing with booth: ${testBooth.name} (${testBooth.id})`);
  console.log('Current values:');
  console.log(`  enrichment_attempted_at: ${testBooth.enrichment_attempted_at}`);
  console.log(`  geocoded_at: ${testBooth.geocoded_at}`);
  console.log(`  google_place_id: ${testBooth.google_place_id}`);
  console.log('');

  // Test writing to the columns
  const testData = {
    enrichment_attempted_at: new Date().toISOString(),
    geocoded_at: new Date().toISOString(),
    google_place_id: 'test_place_id_' + Date.now()
  };

  console.log('Attempting to update columns...');
  const { data: updateData, error: updateError } = await supabase
    .from('booths')
    .update(testData)
    .eq('id', testBooth.id)
    .select();

  if (updateError) {
    console.error('❌ Error updating booth:', updateError.message);
    console.error('Error details:', updateError);
    return;
  }

  console.log('✅ Successfully updated columns!');
  console.log('New values:');
  if (updateData && updateData.length > 0) {
    console.log(`  enrichment_attempted_at: ${updateData[0].enrichment_attempted_at}`);
    console.log(`  geocoded_at: ${updateData[0].geocoded_at}`);
    console.log(`  google_place_id: ${updateData[0].google_place_id}`);
  }

  // Restore original values
  console.log('\nRestoring original values...');
  const { error: restoreError } = await supabase
    .from('booths')
    .update({
      enrichment_attempted_at: testBooth.enrichment_attempted_at,
      geocoded_at: testBooth.geocoded_at,
      google_place_id: testBooth.google_place_id
    })
    .eq('id', testBooth.id);

  if (restoreError) {
    console.error('⚠️  Warning: Could not restore original values:', restoreError.message);
  } else {
    console.log('✅ Original values restored');
  }

  console.log('\n---');
  console.log('✅ All enrichment columns are working correctly!');
  console.log('The geocoding and enrichment processes can now write to these columns.');
}

testColumnWrites();
