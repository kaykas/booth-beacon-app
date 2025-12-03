import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getBoothsNeedingEnrichment() {
  const { data: booths } = await supabase
    .from('booths')
    .select('id, name, address, phone, website, latitude, longitude, photo_exterior_url, ai_preview_url, completeness_score')
    .eq('status', 'active')
    .order('completeness_score', { ascending: true, nullsFirst: true });

  if (!booths) return { needsVenue: [], needsImages: [] };

  const needsVenue = booths.filter(b =>
    !b.address || !b.phone || !b.website || !b.latitude || !b.longitude
  );

  const needsImages = booths.filter(b =>
    !b.photo_exterior_url && !b.ai_preview_url
  );

  return { needsVenue, needsImages };
}

async function enrichVenueData(batchSize: number = 50) {
  console.log('\n🏢 Starting Venue Enrichment...');
  console.log('================================\n');

  const { needsVenue } = await getBoothsNeedingEnrichment();

  console.log(`Found ${needsVenue.length} booths needing venue data`);

  const totalBatches = Math.ceil(needsVenue.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const batchNum = i + 1;
    console.log(`\n📦 Processing venue batch ${batchNum}/${totalBatches} (${batchSize} booths)...`);

    try {
      const response = await fetch(`http://localhost:3000/api/enrichment/venue?batchSize=${batchSize}`);

      if (!response.ok) {
        console.error(`❌ Batch ${batchNum} failed:`, response.statusText);
        continue;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.error('❌ No response body');
        continue;
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const log = JSON.parse(data);
              const prefix = log.type === 'error' ? '❌' :
                           log.type === 'success' ? '✅' :
                           log.type === 'warning' ? '⚠️' : 'ℹ️';
              console.log(`  ${prefix} ${log.message}`);
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      console.log(`✅ Batch ${batchNum} completed`);

      // Wait between batches to avoid rate limits
      if (batchNum < totalBatches) {
        console.log('   Waiting 5 seconds before next batch...');
        await sleep(5000);
      }

    } catch (error) {
      console.error(`❌ Batch ${batchNum} error:`, error);
    }
  }

  console.log('\n✅ Venue enrichment completed\n');
}

async function enrichImages(batchSize: number = 100) {
  console.log('\n🎨 Starting AI Image Generation...');
  console.log('==================================\n');

  const { needsImages } = await getBoothsNeedingEnrichment();

  console.log(`Found ${needsImages.length} booths needing images`);
  console.log(`Estimated cost: $${(needsImages.length * 0.04).toFixed(2)}\n`);

  const totalBatches = Math.ceil(needsImages.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const batchNum = i + 1;
    const batchCost = (batchSize * 0.04).toFixed(2);
    console.log(`\n📦 Processing image batch ${batchNum}/${totalBatches} (${batchSize} booths, ~$${batchCost})...`);

    try {
      const response = await fetch(`http://localhost:3000/api/enrichment/images?batchSize=${batchSize}`);

      if (!response.ok) {
        console.error(`❌ Batch ${batchNum} failed:`, response.statusText);
        continue;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        console.error('❌ No response body');
        continue;
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const log = JSON.parse(data);
              const prefix = log.type === 'error' ? '❌' :
                           log.type === 'success' ? '✅' :
                           log.type === 'warning' ? '⚠️' : 'ℹ️';
              console.log(`  ${prefix} ${log.message}`);
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      console.log(`✅ Batch ${batchNum} completed`);

      // Wait between batches to avoid rate limits
      if (batchNum < totalBatches) {
        console.log('   Waiting 10 seconds before next batch...');
        await sleep(10000);
      }

    } catch (error) {
      console.error(`❌ Batch ${batchNum} error:`, error);
    }
  }

  console.log('\n✅ Image generation completed\n');
}

async function showFinalStats() {
  console.log('\n📊 Final Statistics');
  console.log('==================\n');

  const { data: booths } = await supabase
    .from('booths')
    .select('completeness_score')
    .eq('status', 'active');

  if (!booths) return;

  const avgScore = booths.reduce((sum, b) => sum + (b.completeness_score || 0), 0) / booths.length;
  const above80 = booths.filter(b => (b.completeness_score || 0) >= 80).length;
  const above50 = booths.filter(b => (b.completeness_score || 0) >= 50).length;

  console.log(`Total Active Booths: ${booths.length}`);
  console.log(`Average Quality Score: ${avgScore.toFixed(1)}%`);
  console.log(`Booths ≥80% Quality: ${above80} (${Math.round(above80/booths.length*100)}%)`);
  console.log(`Booths ≥50% Quality: ${above50} (${Math.round(above50/booths.length*100)}%)`);
  console.log('');
}

async function main() {
  console.log('🚀 Bulk Enrichment for All Booths');
  console.log('==================================');
  console.log('This will process all booths that need enrichment\n');

  // Check what needs to be done
  const { needsVenue, needsImages } = await getBoothsNeedingEnrichment();

  console.log('Current Status:');
  console.log(`- Booths needing venue data: ${needsVenue.length}`);
  console.log(`- Booths needing images: ${needsImages.length}`);
  console.log(`- Est. total cost: $${(needsImages.length * 0.04).toFixed(2)}\n`);

  // Step 1: Venue enrichment
  if (needsVenue.length > 0) {
    await enrichVenueData(50); // 50 booths per batch
  } else {
    console.log('✅ No booths need venue enrichment\n');
  }

  // Step 2: Image generation
  if (needsImages.length > 0) {
    await enrichImages(100); // 100 booths per batch
  } else {
    console.log('✅ No booths need images\n');
  }

  // Step 3: Show final stats
  await showFinalStats();

  console.log('🎉 Bulk enrichment completed!');
}

main().catch(console.error);
