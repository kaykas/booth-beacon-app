import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function enrichBooth(slug: string) {
  // Get booth ID
  const { data: booth } = await supabase
    .from('booths')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!booth) {
    console.error('Booth not found:', slug);
    return;
  }

  console.log('Triggering enrichment for booth:', booth.id);

  // Call auto-enrichment API
  const response = await fetch('http://localhost:3000/api/enrichment/auto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boothIds: [booth.id] })
  });

  const result = await response.json();
  console.log('Enrichment result:', JSON.stringify(result, null, 2));
}

enrichBooth('beauty-bar-san-francisco').catch(console.error);
