#!/usr/bin/env node

/**
 * Script to trigger the Supabase geocode-booths Edge Function
 * Uses EventSource to stream progress updates
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https');

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/geocode-booths`;

// Configuration
const BATCH_SIZE = 100; // Process 100 booths at a time
const DRY_RUN = process.argv.includes('--dry-run');

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

console.log('='.repeat(80));
console.log('Booth Beacon - Geocoding Service');
console.log('='.repeat(80));
console.log(`Function URL: ${FUNCTION_URL}`);
console.log(`Batch size: ${BATCH_SIZE}`);
console.log(`Dry run: ${DRY_RUN}`);
console.log('='.repeat(80));
console.log('');

// Statistics
let totalProcessed = 0;
let totalSuccess = 0;
let totalErrors = 0;
let totalSkipped = 0;

function makeRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      limit: BATCH_SIZE,
      dry_run: DRY_RUN
    });

    const url = new URL(FUNCTION_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);

      if (res.statusCode !== 200) {
        let errorData = '';
        res.on('data', (chunk) => {
          errorData += chunk;
        });
        res.on('end', () => {
          reject(new Error(`HTTP ${res.statusCode}: ${errorData}`));
        });
        return;
      }

      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();

        // Process complete events (ending with \n\n)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const event of events) {
          if (!event.trim()) continue;

          // Parse SSE format: "data: {json}\n"
          const lines = event.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                handleEvent(data);
              } catch (e) {
                console.error('Failed to parse event:', line, e);
              }
            }
          }
        }
      });

      res.on('end', () => {
        resolve({
          success: totalSuccess,
          errors: totalErrors,
          skipped: totalSkipped,
          total: totalProcessed
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

function handleEvent(event) {
  const { type, message, data } = event;

  switch (type) {
    case 'start':
      console.log(`\n[START] ${message}\n`);
      break;

    case 'progress':
      console.log(`[PROGRESS] ${message}`);
      if (data?.total) {
        totalProcessed = data.total;
      }
      break;

    case 'booth_geocoded':
      totalSuccess++;
      const successMsg = data?.dry_run ? ' (DRY RUN)' : '';
      console.log(`  ✓ ${data?.name || 'Unknown'} [${data?.index}/${data?.total}]${successMsg}`);
      if (data?.latitude && data?.longitude) {
        console.log(`    → ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`);
      }
      break;

    case 'booth_failed':
      totalErrors++;
      console.log(`  ✗ ${data?.name || 'Unknown'} [${data?.index}/${data?.total}]`);
      if (data?.error) {
        console.log(`    → Error: ${data.error}`);
      }
      break;

    case 'complete':
      console.log(`\n[COMPLETE] ${message}\n`);
      if (data) {
        console.log('Summary:');
        console.log(`  Total booths: ${data.total || 0}`);
        console.log(`  Successful: ${data.success || 0}`);
        console.log(`  Errors: ${data.errors || 0}`);
        console.log(`  Skipped: ${data.skipped || 0}`);
        if (data.dry_run) {
          console.log('\n  ** DRY RUN - No changes were saved **');
        }
      }
      break;

    case 'error':
      console.error(`\n[ERROR] ${message}`);
      if (data?.error) {
        console.error(`  ${data.error}`);
      }
      break;

    default:
      console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

async function main() {
  const startTime = Date.now();

  try {
    console.log('Starting geocoding process...\n');

    const _result = await makeRequest();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(80));
    console.log('GEOCODING COMPLETE');
    console.log('='.repeat(80));
    console.log(`Duration: ${duration}s`);
    console.log(`Success rate: ${totalProcessed > 0 ? ((totalSuccess / totalProcessed) * 100).toFixed(1) : 0}%`);
    console.log('='.repeat(80));

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('GEOCODING FAILED');
    console.error('='.repeat(80));
    console.error(error.message);
    console.error('='.repeat(80));
    process.exit(1);
  }
}

main();
