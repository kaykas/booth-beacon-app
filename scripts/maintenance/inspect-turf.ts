
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function inspectTurfClub() {
  console.log('Inspecting Turf Club...');
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('slug', 'turf-club-st-paul')
    .single();

  if (error) {
    console.error('DATABASE ERROR:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

inspectTurfClub();
