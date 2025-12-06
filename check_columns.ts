import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkColumns() {
  console.log('🔍 Checking booths table columns...\n');

  // Get one row to see what columns exist
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
    console.log('All columns in booths table:');
    console.log(allColumns.join(', '));
    console.log('\n');

    // Check for specific columns we need
    const requiredColumns = ['enrichment_attempted_at', 'geocoded_at', 'google_place_id'];
    const missingColumns = requiredColumns.filter(col => !allColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('✅ All required columns exist!');
    } else {
      console.log('❌ Missing columns:', missingColumns.join(', '));
    }
  }
}

checkColumns();
