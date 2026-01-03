import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function verifyColumns() {
  console.log('🔍 Verifying all required geocoding columns...\n');

  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    const allColumns = Object.keys(data[0]).sort();

    // Check for all columns used by geocoding script
    const requiredColumns = [
      'enrichment_attempted_at',
      'geocoded_at',
      'google_place_id',
      'geocode_provider',
      'geocode_confidence'
    ];

    console.log('Checking required columns:');
    requiredColumns.forEach(col => {
      const columnExists = allColumns.includes(col);
      console.log(`  ${columnExists ? '✅' : '❌'} ${col}`);
    });

    const missingColumns = requiredColumns.filter(col => !allColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('\n✅ All required columns exist!');
    } else {
      console.log('\n⚠️  Missing columns:', missingColumns.join(', '));
      console.log('\nThese columns need to be added for full geocoding functionality.');
    }
  }
}

verifyColumns();
