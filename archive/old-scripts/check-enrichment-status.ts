import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkEnrichmentStatus() {
  // Get total active booths
  const { count: totalActive } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get booths missing critical data
  const { count: needsAddress } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('address', null);

  const { count: needsPhone } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('phone', null);

  const { count: needsWebsite } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('website', null);

  const { count: needsPhoto } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('photo_exterior_url', null);

  const { count: needsCoords } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .or('latitude.is.null,longitude.is.null');

  // Get enrichment attempts
  const { count: attempted } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('enrichment_attempted_at', 'is', null);

  console.log('\n=== ENRICHMENT STATUS REPORT ===\n');
  console.log('Total active booths:', totalActive);
  console.log('Enrichment attempts made:', attempted);
  console.log('\nMISSING DATA:');
  console.log('- Address:', needsAddress);
  console.log('- Phone:', needsPhone);
  console.log('- Website:', needsWebsite);
  console.log('- Photo:', needsPhoto);
  console.log('- Coordinates:', needsCoords);
  console.log('');

  // Calculate enrichment percentage
  const total = totalActive || 0;
  const totalFields = total * 5; // 5 fields tracked
  const missingFields = (needsAddress || 0) + (needsPhone || 0) + (needsWebsite || 0) + (needsPhoto || 0) + (needsCoords || 0);
  const completeness = ((totalFields - missingFields) / totalFields * 100).toFixed(1);

  console.log('Overall data completeness:', completeness + '%');
  console.log('Enrichment coverage:', ((attempted || 0) / total * 100).toFixed(1) + '% of booths have been attempted');
}

checkEnrichmentStatus().catch(console.error);
