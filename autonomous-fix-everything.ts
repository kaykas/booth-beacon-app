import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface EnrichmentStatus {
  totalBooths: number;
  needsAddress: number;
  needsPhone: number;
  needsWebsite: number;
  needsPhoto: number;
  needsCoords: number;
  completeness: number;
}

async function checkDatabaseSchema(): Promise<void> {
  console.log('\n🔍 CHECKING DATABASE SCHEMA...\n');

  // Check if columns exist by trying to query them
  const columnsToCheck = [
    'enrichment_attempted_at',
    'geocoded_at',
    'google_place_id'
  ];

  for (const column of columnsToCheck) {
    try {
      const { error } = await supabase
        .from('booths')
        .select(column)
        .limit(1);

      if (error) {
        console.log(`❌ Missing column: ${column}`);
        console.log(`   Adding column: ${column}...`);

        // Add the column based on type
        let columnDef = '';
        if (column.endsWith('_at')) {
          columnDef = `${column} timestamptz`;
        } else if (column === 'google_place_id') {
          columnDef = `${column} text`;
        }

        // Note: We can't directly ALTER TABLE from the client
        // We need to use a database migration or RPC call
        console.log(`   ⚠️  Column ${column} needs to be added manually`);
        console.log(`   SQL: ALTER TABLE booths ADD COLUMN IF NOT EXISTS ${columnDef};`);
      } else {
        console.log(`✅ Column exists: ${column}`);
      }
    } catch (err) {
      console.log(`⚠️  Error checking column ${column}:`, err);
    }
  }
}

async function getEnrichmentStatus(): Promise<EnrichmentStatus> {
  const { count: totalBooths } = await supabase
    .from('booths')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

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

  const total = totalBooths || 0;
  const totalFields = total * 5;
  const missingFields = (needsAddress || 0) + (needsPhone || 0) + (needsWebsite || 0) + (needsPhoto || 0) + (needsCoords || 0);
  const completeness = ((totalFields - missingFields) / totalFields * 100);

  return {
    totalBooths: total,
    needsAddress: needsAddress || 0,
    needsPhone: needsPhone || 0,
    needsWebsite: needsWebsite || 0,
    needsPhoto: needsPhoto || 0,
    needsCoords: needsCoords || 0,
    completeness
  };
}

function displayStatus(status: EnrichmentStatus, cycle: number): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`ENRICHMENT STATUS - CYCLE ${cycle}`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`Total active booths: ${status.totalBooths}`);
  console.log(`Overall completeness: ${status.completeness.toFixed(1)}%\n`);
  console.log('MISSING DATA:');
  console.log(`  Address:     ${status.needsAddress.toString().padStart(4)} (${(status.needsAddress/status.totalBooths*100).toFixed(1)}%)`);
  console.log(`  Phone:       ${status.needsPhone.toString().padStart(4)} (${(status.needsPhone/status.totalBooths*100).toFixed(1)}%)`);
  console.log(`  Website:     ${status.needsWebsite.toString().padStart(4)} (${(status.needsWebsite/status.totalBooths*100).toFixed(1)}%)`);
  console.log(`  Photo:       ${status.needsPhoto.toString().padStart(4)} (${(status.needsPhoto/status.totalBooths*100).toFixed(1)}%)`);
  console.log(`  Coordinates: ${status.needsCoords.toString().padStart(4)} (${(status.needsCoords/status.totalBooths*100).toFixed(1)}%)`);
  console.log('');
}

async function triggerEnrichmentCycle(): Promise<void> {
  console.log('🚀 Triggering enrichment via API endpoint...\n');

  try {
    // Trigger venue enrichment API
    const batchSize = 25;
    console.log(`   Calling /api/enrichment/venue?batchSize=${batchSize}...`);

    // Note: This would need to be called via HTTP in production
    // For now, just log what would happen
    console.log('   ⚠️  API call would happen here in production');
    console.log('   For now, background agents are handling enrichment');

  } catch (error) {
    console.log('   ❌ Error triggering enrichment:', error);
  }
}

async function main() {
  console.log('🤖 AUTONOMOUS ENRICHMENT FIX AGENT');
  console.log('==================================');
  console.log('Running until all data is enriched...\n');

  // Check schema first
  await checkDatabaseSchema();

  let cycle = 0;
  const TARGET_COMPLETENESS = 95.0; // Stop when 95% complete

  while (true) {
    cycle++;

    // Get current status
    const status = await getEnrichmentStatus();
    displayStatus(status, cycle);

    // Check if we're done
    if (status.completeness >= TARGET_COMPLETENESS) {
      console.log('🎉 ENRICHMENT COMPLETE!');
      console.log(`   Achieved ${status.completeness.toFixed(1)}% completeness`);
      console.log(`   Target was ${TARGET_COMPLETENESS}%\n`);
      break;
    }

    // Determine what needs to be done
    const priorities = [
      { name: 'Coordinates', count: status.needsCoords, priority: 1 },
      { name: 'Photos', count: status.needsPhoto, priority: 2 },
      { name: 'Address', count: status.needsAddress, priority: 3 },
      { name: 'Phone', count: status.needsPhone, priority: 4 },
      { name: 'Website', count: status.needsWebsite, priority: 5 }
    ].filter(p => p.count > 0).sort((a, b) => a.priority - b.priority);

    if (priorities.length > 0) {
      console.log('📋 PRIORITY ACTIONS:');
      priorities.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}: ${p.count} booths need this`);
      });
      console.log('');
    }

    // Trigger enrichment
    await triggerEnrichmentCycle();

    // Wait before next cycle
    const waitTime = 60; // 1 minute
    console.log(`⏰ Waiting ${waitTime} seconds before next check...\n`);
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
  }
}

main().catch(console.error);
