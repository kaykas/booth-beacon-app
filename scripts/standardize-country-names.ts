/**
 * Standardize Country Names
 *
 * Fixes booth count inconsistencies by standardizing country field values:
 * - USA variants (USA, Arizona USA, New York USA) → United States
 * - UK variants (UK) → United Kingdom
 * - Empty values → Set based on state/city
 * - Invalid values (LAT) → Set based on context
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function standardizeCountryNames() {
  console.log('🔄 Starting country name standardization...\n');

  try {
    // 1. Fix USA variants → United States
    console.log('1️⃣ Standardizing USA variants...');
    const { data: usaBooths, error: usaError } = await supabase
      .from('booths')
      .select('id, name, country, state, city')
      .or('country.eq.USA,country.like.%USA%');

    if (usaError) throw usaError;

    console.log(`   Found ${usaBooths.length} booths with USA variants`);

    for (const booth of usaBooths) {
      const { error } = await supabase
        .from('booths')
        .update({ country: 'United States' })
        .eq('id', booth.id);

      if (error) {
        console.error(`   ❌ Failed to update booth ${booth.id}: ${error.message}`);
      }
    }

    console.log(`   ✅ Updated ${usaBooths.length} booths from USA → United States\n`);

    // 2. Fix UK → United Kingdom
    console.log('2️⃣ Standardizing UK → United Kingdom...');
    const { data: ukBooths, error: ukError } = await supabase
      .from('booths')
      .select('id, name')
      .eq('country', 'UK');

    if (ukError) throw ukError;

    console.log(`   Found ${ukBooths.length} booths with UK`);

    for (const booth of ukBooths) {
      const { error } = await supabase
        .from('booths')
        .update({ country: 'United Kingdom' })
        .eq('id', booth.id);

      if (error) {
        console.error(`   ❌ Failed to update booth ${booth.id}: ${error.message}`);
      }
    }

    console.log(`   ✅ Updated ${ukBooths.length} booths from UK → United Kingdom\n`);

    // 3. Fix empty country values
    console.log('3️⃣ Fixing empty country values...');
    const { data: emptyBooths, error: emptyError } = await supabase
      .from('booths')
      .select('id, name, state, city, country')
      .or('country.eq.,country.is.null');

    if (emptyError) throw emptyError;

    console.log(`   Found ${emptyBooths.length} booths with empty country`);

    // Map US state codes to United States
    const usStates = new Set([
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
      'DC'
    ]);

    for (const booth of emptyBooths) {
      let newCountry = null;

      // If state is US state code, set to United States
      if (booth.state && usStates.has(booth.state.toUpperCase())) {
        newCountry = 'United States';
      }

      if (newCountry) {
        const { error } = await supabase
          .from('booths')
          .update({ country: newCountry })
          .eq('id', booth.id);

        if (error) {
          console.error(`   ❌ Failed to update booth ${booth.id}: ${error.message}`);
        } else {
          console.log(`   ✅ Set ${booth.name} (${booth.city}, ${booth.state}) → ${newCountry}`);
        }
      } else {
        console.log(`   ⚠️  Could not determine country for booth ${booth.id}: ${booth.name} (${booth.city}, ${booth.state})`);
      }
    }

    console.log('');

    // 4. Fix invalid country values (LAT)
    console.log('4️⃣ Fixing invalid country values...');
    const { data: invalidBooths, error: invalidError } = await supabase
      .from('booths')
      .select('id, name, country, state, city')
      .eq('country', 'LAT');

    if (invalidError) throw invalidError;

    if (invalidBooths.length > 0) {
      console.log(`   Found ${invalidBooths.length} booths with invalid country (LAT)`);
      // LAT likely means Latvia
      for (const booth of invalidBooths) {
        const { error } = await supabase
          .from('booths')
          .update({ country: 'Latvia' })
          .eq('id', booth.id);

        if (error) {
          console.error(`   ❌ Failed to update booth ${booth.id}: ${error.message}`);
        }
      }
      console.log(`   ✅ Updated ${invalidBooths.length} booths from LAT → Latvia\n`);
    }

    // 5. Verify results
    console.log('📊 Final country counts:');
    const { data: allBooths } = await supabase
      .from('booths')
      .select('country');

    const counts: Record<string, number> = {};
    allBooths?.forEach(b => {
      counts[b.country || '(empty)'] = (counts[b.country || '(empty)'] || 0) + 1;
    });

    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([country, count]) => {
        console.log(`   ${country}: ${count} booths`);
      });

    console.log('\n✅ Country name standardization complete!');

  } catch (error) {
    console.error('❌ Error during standardization:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  standardizeCountryNames()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { standardizeCountryNames };
