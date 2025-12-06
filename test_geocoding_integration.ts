import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testGeocodingIntegration() {
  console.log('🧪 Testing Geocoding Integration\n');
  console.log('='.repeat(60));

  // Step 1: Check column existence
  console.log('\n1️⃣  Checking column existence...\n');
  const { data: sampleBooth, error: selectError } = await supabase
    .from('booths')
    .select('*')
    .limit(1);

  if (selectError || !sampleBooth || sampleBooth.length === 0) {
    console.error('❌ Error selecting booth:', selectError?.message);
    return;
  }

  const allColumns = Object.keys(sampleBooth[0]).sort();
  const requiredColumns = {
    'User Requested': ['enrichment_attempted_at', 'geocoded_at', 'google_place_id'],
    'Geocoding Script': ['geocode_provider', 'geocode_confidence']
  };

  let allColumnsExist = true;

  for (const [category, columns] of Object.entries(requiredColumns)) {
    console.log(`   ${category}:`);
    for (const col of columns) {
      const exists = allColumns.includes(col);
      console.log(`      ${exists ? '✅' : '❌'} ${col}`);
      if (!exists) allColumnsExist = false;
    }
    console.log('');
  }

  // Step 2: Test write operations
  console.log('2️⃣  Testing write operations...\n');

  const { data: testBooths, error: testError } = await supabase
    .from('booths')
    .select('id, name')
    .limit(1);

  if (testError || !testBooths || testBooths.length === 0) {
    console.error('❌ Error selecting test booth:', testError?.message);
    return;
  }

  const testBooth = testBooths[0];
  const testTimestamp = new Date().toISOString();

  console.log(`   Testing with: ${testBooth.name}`);

  // Test update with all geocoding-related columns
  const updateData: Record<string, unknown> = {
    enrichment_attempted_at: testTimestamp,
    geocoded_at: testTimestamp,
    google_place_id: 'test_place_' + Date.now(),
  };

  // Only add these if they exist
  if (allColumns.includes('geocode_provider')) {
    updateData.geocode_provider = 'test_provider';
  }
  if (allColumns.includes('geocode_confidence')) {
    updateData.geocode_confidence = 'high';
  }

  const { data: updateResult, error: updateError } = await supabase
    .from('booths')
    .update(updateData)
    .eq('id', testBooth.id)
    .select();

  if (updateError) {
    console.error('   ❌ Update failed:', updateError.message);
    return;
  }

  console.log('   ✅ Write test successful!\n');

  // Step 3: Verify data was written
  console.log('3️⃣  Verifying written data...\n');

  if (updateResult && updateResult.length > 0) {
    const result = updateResult[0];
    console.log(`   enrichment_attempted_at: ${result.enrichment_attempted_at}`);
    console.log(`   geocoded_at: ${result.geocoded_at}`);
    console.log(`   google_place_id: ${result.google_place_id}`);
    if (allColumns.includes('geocode_provider')) {
      console.log(`   geocode_provider: ${result.geocode_provider}`);
    }
    if (allColumns.includes('geocode_confidence')) {
      console.log(`   geocode_confidence: ${result.geocode_confidence}`);
    }
  }

  // Step 4: Clean up test data
  console.log('\n4️⃣  Cleaning up test data...\n');

  const cleanupData: Record<string, unknown> = {
    enrichment_attempted_at: null,
    geocoded_at: null,
    google_place_id: null,
  };

  if (allColumns.includes('geocode_provider')) {
    cleanupData.geocode_provider = null;
  }
  if (allColumns.includes('geocode_confidence')) {
    cleanupData.geocode_confidence = null;
  }

  const { error: cleanupError } = await supabase
    .from('booths')
    .update(cleanupData)
    .eq('id', testBooth.id);

  if (cleanupError) {
    console.error('   ⚠️  Cleanup warning:', cleanupError.message);
  } else {
    console.log('   ✅ Cleanup complete');
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY\n');

  if (allColumnsExist) {
    console.log('✅ All required columns exist');
    console.log('✅ Write operations working');
    console.log('✅ Geocoding processes can proceed\n');
    console.log('🎉 Database schema is ready for geocoding and enrichment!');
  } else {
    console.log('⚠️  Some optional columns missing (geocode_provider, geocode_confidence)');
    console.log('✅ Core columns exist (enrichment_attempted_at, geocoded_at, google_place_id)');
    console.log('✅ Geocoding can proceed with reduced metadata tracking\n');
    console.log('💡 Run migration 20251205_add_geocode_metadata_columns.sql for full functionality');
  }

  console.log('='.repeat(60));
}

testGeocodingIntegration();
