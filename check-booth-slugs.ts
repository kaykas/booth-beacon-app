import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBooths() {
  console.log('Checking for booth: mopa-i-san-diego');
  const { data: mopa, error: mopaError } = await supabase
    .from('booths')
    .select('id, name, slug')
    .eq('slug', 'mopa-i-san-diego')
    .single();

  if (mopaError) console.log('mopa-i-san-diego ERROR:', mopaError.code, mopaError.message);
  else if (mopa) console.log('mopa-i-san-diego EXISTS:', mopa.name);
  else console.log('mopa-i-san-diego NOT FOUND');

  console.log('\nChecking for booth: kmart-7624-draper');
  const { data: kmart, error: kmartError } = await supabase
    .from('booths')
    .select('id, name, slug')
    .eq('slug', 'kmart-7624-draper')
    .single();

  if (kmartError) console.log('kmart-7624-draper ERROR:', kmartError.code, kmartError.message);
  else if (kmart) console.log('kmart-7624-draper EXISTS:', kmart.name);
  else console.log('kmart-7624-draper NOT FOUND');

  console.log('\nLet me find ACTUAL booths that exist:');
  const { data: realBooths } = await supabase
    .from('booths')
    .select('id, name, slug')
    .limit(10);

  console.log('Real booths in database:');
  realBooths?.forEach(b => console.log('  -', b.slug, ':', b.name));
}

checkBooths().catch(console.error);
