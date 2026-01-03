import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function run() {
  // Get all booths with full data
  const { data: booths, error } = await supabase
    .from('booths')
    .select('*')
    .order('created_at');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Total booths: ${booths.length}\n`);

  // Group by normalized address
  const addressGroups = new Map<string, typeof booths>();

  for (const booth of booths) {
    if (!booth.address || booth.address.trim() === '') continue;

    // Normalize address: lowercase, remove extra spaces, punctuation
    const normalized = booth.address
      .toLowerCase()
      .replace(/[,\.]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!addressGroups.has(normalized)) {
      addressGroups.set(normalized, []);
    }
    addressGroups.get(normalized)!.push(booth);
  }

  // Find duplicates
  const duplicates = Array.from(addressGroups.entries())
    .filter(([_, booths]) => booths.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`Found ${duplicates.length} address-based duplicate groups\n`);
  console.log('Top 20 duplicate groups:\n');

  for (const [address, group] of duplicates.slice(0, 20)) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`${group.length}x duplicates at: ${address}`);
    console.log(`City: ${group[0].city}, ${group[0].state || group[0].country}`);
    console.log('');

    for (const booth of group) {
      const completeness = [
        booth.description ? 'desc' : '',
        booth.photo_exterior_url ? 'photo' : '',
        booth.ai_preview_url ? 'ai-img' : '',
        booth.latitude && booth.longitude ? 'coords' : '',
        booth.hours ? 'hours' : '',
        booth.cost ? 'cost' : '',
        booth.booth_type ? 'type' : '',
      ].filter(Boolean).join(', ');

      console.log(`  • ${booth.name} (${booth.slug})`);
      console.log(`    ID: ${booth.id}`);
      console.log(`    Address: ${booth.address}`);
      console.log(`    Data: ${completeness || 'minimal'}`);
      console.log(`    Sources: ${booth.source_urls?.length || 0} | ${booth.source_names?.join(', ') || 'none'}`);
      console.log('');
    }
  }

  console.log('\n\nSummary by city:');
  const cityCounts = new Map<string, number>();
  for (const [_, group] of duplicates) {
    const city = group[0].city;
    cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
  }

  const topCities = Array.from(cityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  for (const [city, count] of topCities) {
    console.log(`  ${city}: ${count} duplicate groups`);
  }
}

run().catch(console.error);
