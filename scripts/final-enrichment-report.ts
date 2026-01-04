import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function generateReport() {
  console.log('='.repeat(80));
  console.log('FINAL DATA ENRICHMENT REPORT');
  console.log('='.repeat(80));
  console.log('');

  // Fetch all booths
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, city, booth_type, photo_type, cost, hours')
    .order('city, name');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  const total = booths.length;

  // Calculate statistics
  const stats = {
    total,
    booth_type: {
      analog: booths.filter((b) => b.booth_type === 'analog').length,
      digital: booths.filter((b) => b.booth_type === 'digital').length,
      instant: booths.filter((b) => b.booth_type === 'instant').length,
      unknown: booths.filter((b) => !b.booth_type).length,
    },
    photo_type: {
      'black-and-white': booths.filter((b) => b.photo_type === 'black-and-white').length,
      color: booths.filter((b) => b.photo_type === 'color').length,
      both: booths.filter((b) => b.photo_type === 'both').length,
      unknown: booths.filter((b) => !b.photo_type).length,
    },
    cost: {
      present: booths.filter((b) => b.cost).length,
      missing: booths.filter((b) => !b.cost).length,
    },
    hours: {
      present: booths.filter((b) => b.hours).length,
      missing: booths.filter((b) => !b.hours).length,
    },
  };

  console.log('📊 OVERALL STATISTICS');
  console.log('='.repeat(80));
  console.log(`Total Booths: ${total}`);
  console.log('');

  // Booth Type
  console.log('BOOTH TYPE DISTRIBUTION:');
  console.log(`  ✓ Analog:   ${stats.booth_type.analog.toString().padStart(3)} (${((stats.booth_type.analog / total) * 100).toFixed(1)}%)`);
  console.log(`  ✓ Digital:  ${stats.booth_type.digital.toString().padStart(3)} (${((stats.booth_type.digital / total) * 100).toFixed(1)}%)`);
  console.log(`  ✓ Instant:  ${stats.booth_type.instant.toString().padStart(3)} (${((stats.booth_type.instant / total) * 100).toFixed(1)}%)`);
  console.log(`  ✗ Unknown:  ${stats.booth_type.unknown.toString().padStart(3)} (${((stats.booth_type.unknown / total) * 100).toFixed(1)}%)`);
  console.log('');

  // Photo Type
  console.log('PHOTO TYPE DISTRIBUTION:');
  console.log(`  ✓ B&W:      ${stats.photo_type['black-and-white'].toString().padStart(3)} (${((stats.photo_type['black-and-white'] / total) * 100).toFixed(1)}%)`);
  console.log(`  ✓ Color:    ${stats.photo_type.color.toString().padStart(3)} (${((stats.photo_type.color / total) * 100).toFixed(1)}%)`);
  console.log(`  ✓ Both:     ${stats.photo_type.both.toString().padStart(3)} (${((stats.photo_type.both / total) * 100).toFixed(1)}%)`);
  console.log(`  ✗ Unknown:  ${stats.photo_type.unknown.toString().padStart(3)} (${((stats.photo_type.unknown / total) * 100).toFixed(1)}%)`);
  console.log('');

  // Cost
  console.log('COST DATA:');
  console.log(`  ✓ Present:  ${stats.cost.present.toString().padStart(3)} (${((stats.cost.present / total) * 100).toFixed(1)}%)`);
  console.log(`  ✗ Missing:  ${stats.cost.missing.toString().padStart(3)} (${((stats.cost.missing / total) * 100).toFixed(1)}%)`);
  console.log('');

  // Hours
  console.log('HOURS DATA:');
  console.log(`  ✓ Present:  ${stats.hours.present.toString().padStart(3)} (${((stats.hours.present / total) * 100).toFixed(1)}%)`);
  console.log(`  ✗ Missing:  ${stats.hours.missing.toString().padStart(3)} (${((stats.hours.missing / total) * 100).toFixed(1)}%)`);
  console.log('');

  console.log('='.repeat(80));
  console.log('TOTAL IMPROVEMENTS FROM ENRICHMENT RUNS');
  console.log('='.repeat(80));
  console.log('');
  console.log('BEFORE (from initial stats):');
  console.log('  booth_type unknown: 610 (69.3%)');
  console.log('  photo_type unknown: 877 (99.7%)');
  console.log('  cost missing:       757 (86.0%)');
  console.log('  hours missing:      704 (80.0%)');
  console.log('');
  console.log('AFTER (current):');
  console.log(`  booth_type unknown: ${stats.booth_type.unknown} (${((stats.booth_type.unknown / total) * 100).toFixed(1)}%)`);
  console.log(`  photo_type unknown: ${stats.photo_type.unknown} (${((stats.photo_type.unknown / total) * 100).toFixed(1)}%)`);
  console.log(`  cost missing:       ${stats.cost.missing} (${((stats.cost.missing / total) * 100).toFixed(1)}%)`);
  console.log(`  hours missing:      ${stats.hours.missing} (${((stats.hours.missing / total) * 100).toFixed(1)}%)`);
  console.log('');
  console.log('IMPROVEMENTS:');
  console.log(`  booth_type: ${610 - stats.booth_type.unknown} fields populated (↓ ${(69.3 - ((stats.booth_type.unknown / total) * 100)).toFixed(1)}pp)`);
  console.log(`  photo_type: ${877 - stats.photo_type.unknown} fields populated (↓ ${(99.7 - ((stats.photo_type.unknown / total) * 100)).toFixed(1)}pp)`);
  console.log(`  cost:       ${757 - stats.cost.missing} fields populated (↓ ${(86.0 - ((stats.cost.missing / total) * 100)).toFixed(1)}pp)`);
  console.log(`  hours:      ${704 - stats.hours.missing} fields populated (↓ ${(80.0 - ((stats.hours.missing / total) * 100)).toFixed(1)}pp)`);
  console.log('');

  console.log('='.repeat(80));
  console.log('COMPLETENESS BY CITY (Top 20)');
  console.log('='.repeat(80));
  console.log('');

  // Group by city
  const cityStats = new Map<string, {
    total: number;
    booth_type: number;
    photo_type: number;
    cost: number;
    hours: number;
  }>();

  booths.forEach((booth) => {
    if (!cityStats.has(booth.city)) {
      cityStats.set(booth.city, {
        total: 0,
        booth_type: 0,
        photo_type: 0,
        cost: 0,
        hours: 0,
      });
    }

    const cityData = cityStats.get(booth.city)!;
    cityData.total++;
    if (booth.booth_type) cityData.booth_type++;
    if (booth.photo_type) cityData.photo_type++;
    if (booth.cost) cityData.cost++;
    if (booth.hours) cityData.hours++;
  });

  const topCities = Array.from(cityStats.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 20);

  console.log('City'.padEnd(25) + 'Total  Type   Photo  Cost   Hours');
  console.log('-'.repeat(70));

  for (const [city, data] of topCities) {
    const typePercent = ((data.booth_type / data.total) * 100).toFixed(0);
    const photoPercent = ((data.photo_type / data.total) * 100).toFixed(0);
    const costPercent = ((data.cost / data.total) * 100).toFixed(0);
    const hoursPercent = ((data.hours / data.total) * 100).toFixed(0);

    console.log(
      city.padEnd(25) +
      data.total.toString().padStart(5) + '  ' +
      typePercent.padStart(3) + '%  ' +
      photoPercent.padStart(3) + '%  ' +
      costPercent.padStart(3) + '%  ' +
      hoursPercent.padStart(3) + '%'
    );
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('RECOMMENDATIONS FOR FURTHER ENRICHMENT');
  console.log('='.repeat(80));
  console.log('');
  console.log('1. BOOTH TYPE (62.6% still unknown):');
  console.log('   - Manual review of booth names with "Photo Booth", "Studio", etc.');
  console.log('   - Check venue types (bars/restaurants typically have analog)');
  console.log('   - Research by city (some cities predominantly have one type)');
  console.log('');
  console.log('2. PHOTO TYPE (89.2% still unknown):');
  console.log('   - Most analog booths are B&W - consider bulk update for analog booths');
  console.log('   - Contact venue owners for verification');
  console.log('   - User contributions via submission form');
  console.log('');
  console.log('3. COST (85.7% still missing):');
  console.log('   - Pricing varies by location - needs manual research');
  console.log('   - User contributions via submission form');
  console.log('   - Web scraping from venue websites');
  console.log('');
  console.log('4. HOURS (79.0% still missing):');
  console.log('   - Most inherited from venue hours in descriptions');
  console.log('   - Google Maps API integration could help');
  console.log('   - User contributions via submission form');
  console.log('');
  console.log('='.repeat(80));
}

generateReport().catch(console.error);
