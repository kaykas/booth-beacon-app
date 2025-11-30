
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkBooth() {
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('slug', 'funland-arcade-i-seaside')
    .single();

  if (error) {
    console.error('Error fetching booth:', error);
  } else {
    console.log('Booth Data:', JSON.stringify(data, null, 2));
  }
}

checkBooth();
