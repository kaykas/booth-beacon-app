import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface Booth {
  id: string;
  name: string;
  description: string | null;
  machine_model: string | null;
  historical_notes: string | null;
  booth_type: string | null;
  photo_type: string | null;
  cost: string | null;
  hours: string | null;
  address: string | null;
}

interface ExtractionResult {
  booth_id: string;
  booth_type?: string;
  photo_type?: string;
}

// Enhanced booth type patterns based on analysis
const BOOTH_TYPE_PATTERNS = {
  analog: [
    /\banalog\b/i,
    /\bfilm\b/i,
    /\bchemical\b/i,
    /\bvintage\b/i,
    /\bclassic\b/i,
    /\b35mm\b/i,
    /\bdeveloping\b/i,
    /\bchemistry\b/i,
    /\boriginal\b/i,
    /\bautomatic photo booth/i,
    /\bphoto fixer\b/i,
    /\bfotoautomat\b/i,
    /\bautomat\b/i,
    /\bstrips of 4\b/i,
    /\b4 photo strip/i,
    /\bphoto strip\b/i,
    /\bchemically developed/i,
    /\breal photo booth/i,
    /\bauthentic photo booth/i,
  ],
  digital: [
    /\bdigital\b/i,
    /\bprinter\b/i,
    /\bscreen\b/i,
    /\bmodern\b/i,
    /\belectronic\b/i,
    /\bLCD\b/i,
    /\btouch screen\b/i,
  ],
  instant: [
    /\binstant\b/i,
    /\bpolaroid\b/i,
    /\bfujifilm\b/i,
    /\binstax\b/i,
  ],
};

// Enhanced photo type patterns
const PHOTO_TYPE_PATTERNS = {
  'black-and-white': [
    /\bb&w\b/i,
    /\bblack and white\b/i,
    /\bblack & white\b/i,
    /\bblack-and-white\b/i,
    /\bblack\/white\b/i,
    /\bmonochrome\b/i,
    /\bgrayscale\b/i,
    /\bschwarz-weiß\b/i,
    /\bschwarzweiß\b/i,
  ],
  color: [
    /\bcolou?r photo/i,
    /\bcolou?r print/i,
    /\bfull colou?r\b/i,
    /\bcolou?red\b/i,
    /\bfarbe\b/i,
  ],
  both: [
    /\bcolou?r (and|or|&) (b&w|black and white)/i,
    /\b(b&w|black and white) (and|or|&) colou?r/i,
    /\bboth colou?r and (b&w|black and white)/i,
    /\bboth (b&w|black and white) and colou?r/i,
  ],
};

// Infer from booth name patterns
const NAME_INFERENCE_PATTERNS = {
  analog: [
    /photo ?fix/i,
    /photofix/i,
    /foto ?fix/i,
    /fotofix/i,
    /foto ?automat/i,
    /fotoautomat/i,
    /photo ?automat/i,
  ],
};

function extractBoothType(text: string, name: string): string | undefined {
  // Check for "both" first (analog/digital combo)
  if (/analog.*digital|digital.*analog/i.test(text)) {
    return 'analog'; // Prefer analog if mentioned
  }

  // Check name patterns first (stronger signal)
  for (const pattern of NAME_INFERENCE_PATTERNS.analog) {
    if (pattern.test(name)) {
      return 'analog';
    }
  }

  // Check each type in description
  for (const [type, patterns] of Object.entries(BOOTH_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return type;
      }
    }
  }

  return undefined;
}

function extractPhotoType(text: string): string | undefined {
  // Check for "both" first
  for (const pattern of PHOTO_TYPE_PATTERNS.both) {
    if (pattern.test(text)) {
      return 'both';
    }
  }

  // Check for specific types
  let hasBlackAndWhite = false;
  let hasColor = false;

  for (const pattern of PHOTO_TYPE_PATTERNS['black-and-white']) {
    if (pattern.test(text)) {
      hasBlackAndWhite = true;
      break;
    }
  }

  for (const pattern of PHOTO_TYPE_PATTERNS.color) {
    if (pattern.test(text)) {
      hasColor = true;
      break;
    }
  }

  if (hasBlackAndWhite && hasColor) {
    return 'both';
  } else if (hasBlackAndWhite) {
    return 'black-and-white';
  } else if (hasColor) {
    return 'color';
  }

  return undefined;
}

function analyzeBooth(booth: Booth): ExtractionResult {
  const result: ExtractionResult = {
    booth_id: booth.id,
  };

  // Combine all text fields for analysis
  const combinedText = [
    booth.description,
    booth.machine_model,
    booth.historical_notes,
    booth.address,
  ]
    .filter(Boolean)
    .join(' ');

  // Extract booth_type if missing (including name inference)
  if (!booth.booth_type) {
    const extractedType = extractBoothType(combinedText, booth.name);
    if (extractedType) {
      result.booth_type = extractedType;
    }
  }

  // Extract photo_type if missing
  if (!booth.photo_type && combinedText) {
    const extractedPhotoType = extractPhotoType(combinedText);
    if (extractedPhotoType) {
      result.photo_type = extractedPhotoType;
    }
  }

  return result;
}

async function getBeforeStats() {
  const { data: booths, error } = await supabase
    .from('booths')
    .select('booth_type, photo_type');

  if (error) {
    throw error;
  }

  const total = booths.length;

  return {
    total,
    booth_type_missing: booths.filter((b) => !b.booth_type).length,
    photo_type_missing: booths.filter((b) => !b.photo_type).length,
  };
}

async function enrichBoothDataV2() {
  console.log('='.repeat(80));
  console.log('BOOTH DATA ENRICHMENT SCRIPT V2 (ENHANCED PATTERNS)');
  console.log('='.repeat(80));
  console.log('');

  // Get before stats
  console.log('📊 Collecting BEFORE statistics...');
  const beforeStats = await getBeforeStats();
  console.log('');
  console.log('BEFORE ENRICHMENT:');
  console.log(`  Total booths: ${beforeStats.total}`);
  console.log(`  booth_type missing: ${beforeStats.booth_type_missing} (${((beforeStats.booth_type_missing / beforeStats.total) * 100).toFixed(1)}%)`);
  console.log(`  photo_type missing: ${beforeStats.photo_type_missing} (${((beforeStats.photo_type_missing / beforeStats.total) * 100).toFixed(1)}%)`);
  console.log('');

  // Fetch all booths that still need enrichment
  console.log('🔍 Fetching booths with missing data...');
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, description, machine_model, historical_notes, booth_type, photo_type, address')
    .or('booth_type.is.null,photo_type.is.null')
    .order('name');

  if (error) {
    console.error('❌ Error fetching booths:', error);
    process.exit(1);
  }

  console.log(`✅ Found ${booths.length} booths with missing data`);
  console.log('');

  // Analyze booths and extract data
  console.log('🔬 Analyzing booths with enhanced patterns...');
  const results: ExtractionResult[] = [];
  let processedCount = 0;

  for (const booth of booths) {
    const result = analyzeBooth(booth);

    // Only add if we extracted something new
    const hasNewData = result.booth_type || result.photo_type;

    if (hasNewData) {
      results.push(result);
    }

    processedCount++;
    if (processedCount % 100 === 0) {
      console.log(`  Processed ${processedCount}/${booths.length} booths...`);
    }
  }

  console.log(`✅ Completed analysis of ${booths.length} booths`);
  console.log(`📝 Found ${results.length} booths with extractable data`);
  console.log('');

  // Show extraction summary
  const boothTypeCount = results.filter((r) => r.booth_type).length;
  const photoTypeCount = results.filter((r) => r.photo_type).length;

  console.log('EXTRACTION SUMMARY:');
  console.log(`  booth_type: ${boothTypeCount} extracted`);
  console.log(`  photo_type: ${photoTypeCount} extracted`);
  console.log('');

  // Show samples
  console.log('SAMPLE EXTRACTIONS (first 10):');
  results.slice(0, 10).forEach((r, i) => {
    const booth = booths.find((b) => b.id === r.booth_id);
    if (booth) {
      console.log(`${i + 1}. ${booth.name}`);
      if (r.booth_type) console.log(`   → booth_type: ${r.booth_type}`);
      if (r.photo_type) console.log(`   → photo_type: ${r.photo_type}`);
    }
  });
  console.log('');

  // Update database in batches
  if (results.length > 0) {
    console.log('💾 Updating database...');
    const BATCH_SIZE = 50;
    let updatedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);

      for (const result of batch) {
        const updateData: any = {};

        if (result.booth_type) updateData.booth_type = result.booth_type;
        if (result.photo_type) updateData.photo_type = result.photo_type;

        const { error: updateError } = await supabase
          .from('booths')
          .update(updateData)
          .eq('id', result.booth_id);

        if (updateError) {
          console.error(`  ❌ Failed to update booth ${result.booth_id}:`, updateError);
          failedCount++;
        } else {
          updatedCount++;
        }
      }

      console.log(`  Updated ${Math.min(i + BATCH_SIZE, results.length)}/${results.length} booths...`);
    }

    console.log('');
    console.log(`✅ Successfully updated ${updatedCount} booths`);
    if (failedCount > 0) {
      console.log(`⚠️  Failed to update ${failedCount} booths`);
    }
    console.log('');
  } else {
    console.log('ℹ️  No additional data to update');
    console.log('');
  }

  // Get after stats
  console.log('📊 Collecting AFTER statistics...');
  const afterStats = await getBeforeStats();
  console.log('');
  console.log('AFTER ENRICHMENT:');
  console.log(`  Total booths: ${afterStats.total}`);
  console.log(`  booth_type missing: ${afterStats.booth_type_missing} (${((afterStats.booth_type_missing / afterStats.total) * 100).toFixed(1)}%)`);
  console.log(`  photo_type missing: ${afterStats.photo_type_missing} (${((afterStats.photo_type_missing / afterStats.total) * 100).toFixed(1)}%)`);
  console.log('');

  // Show improvement
  console.log('='.repeat(80));
  console.log('IMPROVEMENT SUMMARY (THIS RUN)');
  console.log('='.repeat(80));
  console.log(`booth_type: ${beforeStats.booth_type_missing - afterStats.booth_type_missing} fields populated`);
  console.log(`photo_type: ${beforeStats.photo_type_missing - afterStats.photo_type_missing} fields populated`);
  console.log('='.repeat(80));
}

enrichBoothDataV2().catch(console.error);
