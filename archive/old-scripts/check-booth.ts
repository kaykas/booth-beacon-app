import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkBooth() {
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('slug', 'beauty-bar-san-francisco')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Beauty Bar San Francisco Booth Status:');
  console.log('=====================================');
  console.log('Name:', data.name);
  console.log('City:', data.city, data.state, data.country);
  console.log('');
  console.log('Enrichment Status:');
  console.log('- Address:', data.address || '❌ MISSING');
  console.log('- Phone:', data.phone || '❌ MISSING');
  console.log('- Website:', data.website || '❌ MISSING');
  console.log('- Hours:', data.hours ? '✅ YES' : '❌ MISSING');
  console.log('- Photo (exterior):', data.photo_exterior_url ? '✅ YES' : '❌ MISSING');
  console.log('- AI Preview:', data.ai_preview_url ? '✅ YES' : '❌ MISSING');
  console.log('- Coordinates:', data.latitude && data.longitude ? '✅ YES' : '❌ MISSING');
  console.log('- Google Place ID:', data.google_place_id || '❌ MISSING');
  console.log('');
  console.log('Quality Score:', data.completeness_score || 'Not calculated');
  console.log('Status:', data.status);
  console.log('Description:', data.description || 'None');
}

checkBooth().catch(console.error);
