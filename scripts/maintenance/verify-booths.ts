import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyBooths() {
  console.log('🔍 Checking booths in database...\n');

  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, country, status, created_at')
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) {
    console.error('❌ Error querying booths:', error);
    return;
  }

  console.log(`✅ Total booths found: ${booths?.length || 0}\n`);

  if (booths && booths.length > 0) {
    console.log('Recent booths:');
    booths.forEach((booth, i) => {
      const date = new Date(booth.created_at).toLocaleString();
      console.log(`  ${i + 1}. ${booth.name} - ${booth.city}, ${booth.country} (${booth.status})`);
      console.log(`     Added: ${date}`);
    });
  }

  console.log('\n✅ Verification complete!');
}

verifyBooths().catch(console.error);
