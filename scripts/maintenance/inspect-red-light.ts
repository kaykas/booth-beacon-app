
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function inspectRedLight() {
  console.log('Inspecting Red Light Clothing Exchange...');
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('slug', 'red-light-clothing-exchange-portland')
    .single();

  if (error) {
    console.error('DATABASE ERROR:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

inspectRedLight();
