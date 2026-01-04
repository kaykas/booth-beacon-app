import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface InferenceRule {
  name: string;
  description: string;
  apply: (booths: any[]) => Promise<any[]>;
}

const rules: InferenceRule[] = [
  {
    name: 'Analog booths → Black & White',
    description: 'Most analog booths produce B&W photos',
    apply: async (booths) => {
      return booths.filter(
        (b) => b.booth_type === 'analog' && !b.photo_type
      );
    },
  },
  {
    name: 'PhotoFix/Fotofix variants → Analog',
    description: 'PhotoFix is a brand of analog booths',
    apply: async (booths) => {
      return booths.filter(
        (b) =>
          !b.booth_type &&
          /photo ?fix|foto ?fix/i.test(b.name)
      );
    },
  },
  {
    name: 'Photo Booth in name → Likely Analog',
    description: 'Generic "Photo Booth" usually refers to analog',
    apply: async (booths) => {
      return booths.filter(
        (b) =>
          !b.booth_type &&
          /\bphoto ?booth\b/i.test(b.name) &&
          !/(digital|modern|new)/i.test(b.name + ' ' + (b.description || ''))
      );
    },
  },
];

async function getStats() {
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, description, booth_type, photo_type');

  if (error) throw error;

  const total = booths.length;
  return {
    total,
    booth_type_missing: booths.filter((b) => !b.booth_type).length,
    photo_type_missing: booths.filter((b) => !b.photo_type).length,
  };
}

async function applyConservativeInference(dryRun = true) {
  console.log('='.repeat(80));
  console.log('CONSERVATIVE INFERENCE RULES');
  console.log(dryRun ? '(DRY RUN MODE - NO CHANGES WILL BE MADE)' : '(LIVE MODE - CHANGES WILL BE APPLIED)');
  console.log('='.repeat(80));
  console.log('');

  // Get before stats
  const beforeStats = await getStats();
  console.log('BEFORE:');
  console.log(`  Total booths: ${beforeStats.total}`);
  console.log(`  booth_type missing: ${beforeStats.booth_type_missing} (${((beforeStats.booth_type_missing / beforeStats.total) * 100).toFixed(1)}%)`);
  console.log(`  photo_type missing: ${beforeStats.photo_type_missing} (${((beforeStats.photo_type_missing / beforeStats.total) * 100).toFixed(1)}%)`);
  console.log('');

  // Fetch all booths
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, description, booth_type, photo_type, city');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('APPLYING INFERENCE RULES');
  console.log('='.repeat(80));
  console.log('');

  let totalUpdates = 0;

  // Rule 1: Analog → B&W
  {
    const rule = rules[0];
    const matches = await rule.apply(booths);

    console.log(`RULE 1: ${rule.name}`);
    console.log(`  ${rule.description}`);
    console.log(`  Matches: ${matches.length} booths`);

    if (matches.length > 0) {
      console.log('  Sample matches:');
      matches.slice(0, 5).forEach((b) => {
        console.log(`    - ${b.name} (${b.city})`);
      });

      if (!dryRun) {
        for (const booth of matches) {
          const { error } = await supabase
            .from('booths')
            .update({ photo_type: 'black-and-white' })
            .eq('id', booth.id);

          if (!error) totalUpdates++;
        }
        console.log(`  ✓ Updated ${matches.length} booths`);
      } else {
        console.log(`  → Would update ${matches.length} booths`);
      }
    }
    console.log('');
  }

  // Rule 2: PhotoFix variants → Analog
  {
    const rule = rules[1];
    const matches = await rule.apply(booths);

    console.log(`RULE 2: ${rule.name}`);
    console.log(`  ${rule.description}`);
    console.log(`  Matches: ${matches.length} booths`);

    if (matches.length > 0) {
      console.log('  Sample matches:');
      matches.slice(0, 5).forEach((b) => {
        console.log(`    - ${b.name} (${b.city})`);
      });

      if (!dryRun) {
        for (const booth of matches) {
          const { error } = await supabase
            .from('booths')
            .update({ booth_type: 'analog' })
            .eq('id', booth.id);

          if (!error) totalUpdates++;
        }
        console.log(`  ✓ Updated ${matches.length} booths`);
      } else {
        console.log(`  → Would update ${matches.length} booths`);
      }
    }
    console.log('');
  }

  // Rule 3: "Photo Booth" → Analog
  {
    const rule = rules[2];
    const matches = await rule.apply(booths);

    console.log(`RULE 3: ${rule.name}`);
    console.log(`  ${rule.description}`);
    console.log(`  Matches: ${matches.length} booths`);

    if (matches.length > 0) {
      console.log('  Sample matches:');
      matches.slice(0, 10).forEach((b) => {
        console.log(`    - ${b.name} (${b.city})`);
      });

      if (!dryRun) {
        for (const booth of matches) {
          const { error } = await supabase
            .from('booths')
            .update({ booth_type: 'analog' })
            .eq('id', booth.id);

          if (!error) totalUpdates++;
        }
        console.log(`  ✓ Updated ${matches.length} booths`);
      } else {
        console.log(`  → Would update ${matches.length} booths`);
      }
    }
    console.log('');
  }

  // Get after stats
  if (!dryRun) {
    const afterStats = await getStats();
    console.log('='.repeat(80));
    console.log('AFTER:');
    console.log(`  Total booths: ${afterStats.total}`);
    console.log(`  booth_type missing: ${afterStats.booth_type_missing} (${((afterStats.booth_type_missing / afterStats.total) * 100).toFixed(1)}%)`);
    console.log(`  photo_type missing: ${afterStats.photo_type_missing} (${((afterStats.photo_type_missing / afterStats.total) * 100).toFixed(1)}%)`);
    console.log('');
    console.log('IMPROVEMENT:');
    console.log(`  booth_type: ${beforeStats.booth_type_missing - afterStats.booth_type_missing} fields populated`);
    console.log(`  photo_type: ${beforeStats.photo_type_missing - afterStats.photo_type_missing} fields populated`);
    console.log('='.repeat(80));
  } else {
    console.log('='.repeat(80));
    console.log('DRY RUN COMPLETE - NO CHANGES MADE');
    console.log('Run with --live flag to apply changes');
    console.log('Example: npx tsx scripts/apply-conservative-inference.ts --live');
    console.log('='.repeat(80));
  }
}

// Check for --live flag
const isLive = process.argv.includes('--live');
applyConservativeInference(!isLive).catch(console.error);
