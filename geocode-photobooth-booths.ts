/**
 * Trigger geocoding for photobooth.net booths missing coordinates
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function geocodePhotoboothBooths() {
  console.log('\n🌍 Starting geocoding for photobooth.net booths...\n');

  // Get booths without coordinates
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, address, city, state, country')
    .eq('source_primary', 'photobooth.net')
    .is('latitude', null)
    .limit(200);

  if (error) {
    console.error('❌ Error querying booths:', error);
    return;
  }

  console.log(`Found ${booths?.length || 0} booths needing geocoding\n`);

  if (!booths || booths.length === 0) {
    console.log('✅ All photobooth.net booths already have coordinates!');
    return;
  }

  // Call the geocode-booths edge function
  console.log('⏳ Calling geocode-booths edge function...\n');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/geocode-booths`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        source: 'photobooth.net',
        limit: 150,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Geocoding request failed:', error);
    return;
  }

  // Stream the results
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    console.error('❌ No response body');
    return;
  }

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6));

          if (event.type === 'booth_geocoded') {
            console.log(`✓ ${event.data.name}: ${event.data.latitude}, ${event.data.longitude}`);
          } else if (event.type === 'booth_failed') {
            console.log(`✗ ${event.data.name}: ${event.data.error}`);
          } else if (event.type === 'progress') {
            console.log(`📍 Progress: ${event.data.processed}/${event.data.total} (${event.data.success} successful)`);
          } else if (event.type === 'complete') {
            console.log(`\n✅ Geocoding complete!`);
            console.log(`   Total: ${event.data.total}`);
            console.log(`   Success: ${event.data.success}`);
            console.log(`   Failed: ${event.data.failed}`);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  console.log('\n✅ Done!');
}

geocodePhotoboothBooths().catch(console.error);
