#!/usr/bin/env node

/**
 * Batch Street View Validation Script
 *
 * Validates Street View availability for all booths with coordinates.
 * Uses the /api/street-view/validate API endpoint with rate limiting.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/validate-street-views.js
 *
 * Options:
 *   BATCH_SIZE=100         Number of booths to validate (default: all)
 *   DRY_RUN=true          Test without updating database
 *   RESUME=true           Skip already-validated booths
 *   RATE_LIMIT=10         Requests per second (default: 10)
 */

const https = require('https');
const http = require('http');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.APP_URL || 'http://localhost:3000';

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const batchSize = parseInt(process.env.BATCH_SIZE || '0');
const dryRun = process.env.DRY_RUN === 'true';
const resume = process.env.RESUME === 'true';
const rateLimit = parseInt(process.env.RATE_LIMIT || '10'); // requests per second

// Track progress
let stats = {
  total: 0,
  processed: 0,
  available: 0,
  unavailable: 0,
  errors: 0,
  skipped: 0,
};

/**
 * Fetch booths that need validation from Supabase
 */
async function fetchBoothsNeedingValidation() {
  console.log('Fetching booths with coordinates...\n');

  let query = `${supabaseUrl}/rest/v1/booths?select=id,name,slug,latitude,longitude,street_view_available,street_view_validated_at&latitude=not.is.null&longitude=not.is.null`;

  // If resuming, skip already-validated booths
  if (resume) {
    query += '&street_view_validated_at=is.null';
  }

  // Apply batch size limit if specified
  if (batchSize > 0) {
    query += `&limit=${batchSize}`;
  }

  // Order by ID for consistent resume capability
  query += '&order=id.asc';

  return new Promise((resolve, reject) => {
    const url = new URL(query);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch booths: ${res.statusCode} ${data}`));
          return;
        }

        try {
          const booths = JSON.parse(data);
          resolve(booths);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Validate Street View for a single booth
 */
async function validateBooth(booth) {
  const url = new URL(`${appUrl}/api/street-view/validate`);
  const client = url.protocol === 'https:' ? https : http;

  const body = JSON.stringify({
    boothId: booth.id,
    latitude: booth.latitude,
    longitude: booth.longitude,
  });

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = client.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API returned ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Display progress bar
 */
function displayProgress() {
  const total = stats.total;
  const processed = stats.processed;
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const barLength = 40;
  const filledLength = Math.round((barLength * processed) / total);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

  process.stdout.write(`\r[${bar}] ${percent}% | ${processed}/${total} booths | ` +
    `✓ ${stats.available} available | ✗ ${stats.unavailable} unavailable | ⚠ ${stats.errors} errors`);
}

/**
 * Main validation process
 */
async function runValidation() {
  console.log('='.repeat(70));
  console.log('Street View Batch Validation');
  console.log('='.repeat(70));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no database updates)' : 'LIVE'}`);
  console.log(`Resume: ${resume ? 'Yes (skip validated)' : 'No (re-validate all)'}`);
  console.log(`Rate Limit: ${rateLimit} requests/second`);
  console.log(`Batch Size: ${batchSize > 0 ? batchSize : 'Unlimited'}`);
  console.log('='.repeat(70));
  console.log('');

  try {
    // Fetch booths
    const booths = await fetchBoothsNeedingValidation();
    stats.total = booths.length;

    console.log(`Found ${stats.total} booths needing validation\n`);

    if (stats.total === 0) {
      console.log('No booths to validate. Exiting.');
      return;
    }

    console.log('Starting validation...\n');

    // Calculate delay between requests to respect rate limit
    const delayMs = 1000 / rateLimit;

    // Process each booth
    for (const booth of booths) {
      try {
        if (dryRun) {
          // In dry run mode, just simulate the request
          console.log(`[DRY RUN] Would validate: ${booth.name} (${booth.latitude}, ${booth.longitude})`);
          stats.processed++;
          stats.available++; // Fake success for testing
        } else {
          // Validate the booth
          const result = await validateBooth(booth);

          if (result.success && result.validation) {
            if (result.validation.available) {
              stats.available++;
            } else {
              stats.unavailable++;
            }
          }

          stats.processed++;
        }

        // Display progress
        displayProgress();

        // Rate limiting
        if (stats.processed < stats.total) {
          await sleep(delayMs);
        }
      } catch (error) {
        stats.errors++;
        stats.processed++;

        // Log error to separate line
        process.stdout.write('\n');
        console.error(`Error validating booth ${booth.name} (${booth.id}): ${error.message}`);

        // Continue with rate limiting
        if (stats.processed < stats.total) {
          await sleep(delayMs);
        }
      }
    }

    // Final newline after progress bar
    console.log('\n');
    console.log('='.repeat(70));
    console.log('Validation Complete!');
    console.log('='.repeat(70));
    console.log(`Total Processed: ${stats.processed}/${stats.total}`);
    console.log(`Street View Available: ${stats.available} (${Math.round((stats.available / stats.processed) * 100)}%)`);
    console.log(`Street View Unavailable: ${stats.unavailable} (${Math.round((stats.unavailable / stats.processed) * 100)}%)`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(70));

    if (stats.errors > 0) {
      console.log('\nNote: Some booths failed validation. Review errors above.');
      console.log('You can resume validation by running with RESUME=true');
    }

  } catch (error) {
    console.error('\nFatal error:', error.message);
    process.exit(1);
  }
}

// Run the validation
runValidation();
