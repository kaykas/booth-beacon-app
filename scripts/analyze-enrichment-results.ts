import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function analyzeResults() {
  console.log('='.repeat(80));
  console.log('ENRICHMENT RESULTS ANALYSIS');
  console.log('='.repeat(80));
  console.log('');

  // Fetch all booths
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, description, booth_type, photo_type, cost, hours, city')
    .order('name');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Total booths: ${booths.length}`);
  console.log('');

  // Analyze booth_type distribution
  const boothTypeCounts = {
    analog: 0,
    digital: 0,
    instant: 0,
    unknown: 0,
  };

  booths.forEach((b) => {
    if (b.booth_type) {
      boothTypeCounts[b.booth_type as keyof typeof boothTypeCounts] =
        (boothTypeCounts[b.booth_type as keyof typeof boothTypeCounts] || 0) + 1;
    } else {
      boothTypeCounts.unknown++;
    }
  });

  console.log('BOOTH TYPE DISTRIBUTION:');
  console.log(`  Analog: ${boothTypeCounts.analog} (${((boothTypeCounts.analog / booths.length) * 100).toFixed(1)}%)`);
  console.log(`  Digital: ${boothTypeCounts.digital} (${((boothTypeCounts.digital / booths.length) * 100).toFixed(1)}%)`);
  console.log(`  Instant: ${boothTypeCounts.instant} (${((boothTypeCounts.instant / booths.length) * 100).toFixed(1)}%)`);
  console.log(`  Unknown: ${boothTypeCounts.unknown} (${((boothTypeCounts.unknown / booths.length) * 100).toFixed(1)}%)`);
  console.log('');

  // Analyze photo_type distribution
  const photoTypeCounts = {
    'black-and-white': 0,
    'color': 0,
    'both': 0,
    'unknown': 0,
  };

  booths.forEach((b) => {
    if (b.photo_type) {
      photoTypeCounts[b.photo_type as keyof typeof photoTypeCounts] =
        (photoTypeCounts[b.photo_type as keyof typeof photoTypeCounts] || 0) + 1;
    } else {
      photoTypeCounts.unknown++;
    }
  });

  console.log('PHOTO TYPE DISTRIBUTION:');
  console.log(`  Black & White: ${photoTypeCounts['black-and-white']} (${((photoTypeCounts['black-and-white'] / booths.length) * 100).toFixed(1)}%)`);
  console.log(`  Color: ${photoTypeCounts.color} (${((photoTypeCounts.color / booths.length) * 100).toFixed(1)}%)`);
  console.log(`  Both: ${photoTypeCounts.both} (${((photoTypeCounts.both / booths.length) * 100).toFixed(1)}%)`);
  console.log(`  Unknown: ${photoTypeCounts.unknown} (${((photoTypeCounts.unknown / booths.length) * 100).toFixed(1)}%)`);
  console.log('');

  // Show sample extracted data
  const extractedBooths = booths.filter(
    (b) => b.booth_type || b.photo_type || b.cost || b.hours
  );

  console.log(`SAMPLE EXTRACTED DATA (showing first 20 of ${extractedBooths.length}):`);
  console.log('');

  extractedBooths.slice(0, 20).forEach((booth) => {
    console.log(`📸 ${booth.name} (${booth.city})`);
    if (booth.booth_type) console.log(`   Type: ${booth.booth_type}`);
    if (booth.photo_type) console.log(`   Photo: ${booth.photo_type}`);
    if (booth.cost) console.log(`   Cost: ${booth.cost}`);
    if (booth.hours) console.log(`   Hours: ${booth.hours}`);
    console.log('');
  });

  // Analyze remaining unknowns - sample descriptions
  const unknowns = booths.filter((b) => !b.booth_type && b.description);

  console.log('='.repeat(80));
  console.log(`ANALYZING REMAINING UNKNOWNS (${unknowns.length} with descriptions)`);
  console.log('='.repeat(80));
  console.log('');
  console.log('Sample descriptions that did not match patterns:');
  console.log('');

  unknowns.slice(0, 10).forEach((booth, i) => {
    console.log(`${i + 1}. ${booth.name} (${booth.city})`);
    if (booth.description) {
      console.log(`   Description: ${booth.description.substring(0, 150)}${booth.description.length > 150 ? '...' : ''}`);
    }
    console.log('');
  });

  // Common words in unknown descriptions (to identify new patterns)
  const unknownWords = new Map<string, number>();
  unknowns.forEach((booth) => {
    if (booth.description) {
      const words = booth.description
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);

      words.forEach((word) => {
        unknownWords.set(word, (unknownWords.get(word) || 0) + 1);
      });
    }
  });

  const topWords = Array.from(unknownWords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  console.log('='.repeat(80));
  console.log('TOP WORDS IN UNKNOWN BOOTH DESCRIPTIONS:');
  console.log('(might reveal new patterns to add)');
  console.log('='.repeat(80));
  topWords.forEach(([word, count]) => {
    console.log(`  ${word.padEnd(20)} ${count}`);
  });
}

analyzeResults().catch(console.error);
