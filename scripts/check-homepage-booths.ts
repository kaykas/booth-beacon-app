#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkHomepageBooths() {
  console.log('\n📊 HOMEPAGE BOOTH VISIBILITY ANALYSIS\n');
  console.log('='.repeat(80));

  // Get total count
  const { count: total } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🎯 Total booths in database: ${total}\n`);

  // Get by status
  const { data: byStatus } = await supabase.from('booths').select('status');

  const statusCounts: Record<string, number> = {};
  byStatus?.forEach(b => {
    const status = b.status || 'null';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  console.log('📋 BY STATUS:');
  Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const pct = ((count / total!) * 100).toFixed(1);
      console.log(`   ${status.padEnd(15)} ${count.toString().padStart(4)} (${pct}%)`);
    });

  // Get geocoded count
  const { count: geocoded } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log(`\n🗺️  GEOCODE STATUS:`);
  console.log(`   With coordinates:    ${geocoded?.toString().padStart(4)} (${((geocoded! / total!) * 100).toFixed(1)}%)`);
  console.log(`   Missing coordinates: ${(total! - geocoded!).toString().padStart(4)} (${(((total! - geocoded!) / total!) * 100).toFixed(1)}%)`);

  // Get what homepage shows (active + operational + geocoded)
  const { count: homepage } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('is_operational', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  console.log(`\n✅ HOMEPAGE VISIBLE: ${homepage}`);
  console.log(`   (status='active' + is_operational=true + has coordinates)`);

  console.log(`\n❌ MISSING FROM HOMEPAGE: ${total! - homepage!} booths`);

  // Break down what's missing
  console.log(`\n🔍 WHY BOOTHS ARE MISSING:\n`);

  // Not active
  const { count: notActive } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'active');

  console.log(`   ${notActive?.toString().padStart(4)} - Not status='active'`);

  // Not operational
  const { count: notOperational } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('is_operational', false);

  console.log(`   ${notOperational?.toString().padStart(4)} - Active but not operational`);

  // Active + operational but no coordinates
  const { count: needsGeocode } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('is_operational', true)
    .or('latitude.is.null,longitude.is.null');

  console.log(`   ${needsGeocode?.toString().padStart(4)} - Active + operational but missing coordinates`);

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 RECOMMENDATION:\n');
  console.log('   To show all ${total} booths on homepage:');
  console.log('   1. Remove status filter (show unverified booths)');
  console.log('   2. Geocode missing coordinates (${total! - geocoded!} booths)');
  console.log('   3. Or change homepage query filters');
  console.log('\n' + '='.repeat(80) + '\n');
}

checkHomepageBooths().catch(console.error);
