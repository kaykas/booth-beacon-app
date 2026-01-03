#!/usr/bin/env node

// Run geocoding via Supabase Edge Function with SSE (Server-Sent Events)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const limit = process.env.BATCH_SIZE || 100;
const dryRun = process.env.DRY_RUN === 'true';

const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/geocode-booths`;

async function runGeocoding() {
  console.log(`Starting geocoding batch (limit: ${limit}, dry_run: ${dryRun})...`);
  console.log('');

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: parseInt(limit),
        dry_run: dryRun,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge function request failed: ${response.status} ${errorText}`);
    }

    // Parse Server-Sent Events stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonData = line.slice(6);
          try {
            const event = JSON.parse(jsonData);
            handleEvent(event);
          } catch (e) {
            console.error('Failed to parse event:', jsonData);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error running geocoding:', error.message);
    process.exit(1);
  }
}

function handleEvent(event) {
  switch (event.type) {
    case 'start':
      console.log(event.message);
      break;

    case 'progress':
      console.log(event.message);
      if (event.data?.total) {
        console.log('');
      }
      break;

    case 'booth_geocoded':
      console.log(event.message);
      break;

    case 'booth_failed':
      console.log(event.message);
      break;

    case 'booth_skipped':
      console.log(event.message);
      break;

    case 'complete':
      console.log('');
      console.log('='.repeat(50));
      console.log(event.message);
      console.log('='.repeat(50));
      if (event.data) {
        console.log('');
        console.log('Summary:');
        console.log(`  Total booths processed: ${event.data.total}`);
        console.log(`  Successfully geocoded: ${event.data.success}`);
        console.log(`  Errors: ${event.data.errors}`);
        console.log(`  Skipped: ${event.data.skipped}`);
        console.log(`  Validation rejected: ${event.data.validationRejected || 0}`);
        console.log(`  Need review: ${event.data.needsReview || 0}`);
        if (event.data.dry_run) {
          console.log('  (DRY RUN - no changes made)');
        }
      }
      break;

    case 'error':
      console.error('');
      console.error('ERROR:', event.message);
      process.exit(1);
      break;

    default:
      console.log('Unknown event:', event);
  }
}

runGeocoding();
