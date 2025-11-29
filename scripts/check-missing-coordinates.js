#!/usr/bin/env node

/**
 * Check how many booths are missing coordinates
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https');

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.error('Load it from .env.local: export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)');
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function querySupabase(query) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/booths', SUPABASE_URL);
    url.searchParams.set('select', query);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

function countMissing(query) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/booths', SUPABASE_URL);
    url.searchParams.set('select', 'count');

    if (query) {
      url.searchParams.set(query.key, query.value);
    }

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Accept': 'application/json',
        'Prefer': 'count=exact'
      }
    };

    const req = https.request(options, (res) => {
      let _data = '';

      res.on('data', (chunk) => {
        _data += chunk;
      });

      res.on('end', () => {
        const countHeader = res.headers['content-range'];
        if (countHeader) {
          const count = parseInt(countHeader.split('/')[1]);
          resolve(count);
        } else {
          reject(new Error('No count header in response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('='.repeat(80));
  console.log('Booth Beacon - Coordinate Status Check');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Count total booths
    const total = await countMissing(null);
    console.log(`Total booths: ${total}`);

    // Count booths missing coordinates (latitude OR longitude is null)
    const missingCoords = await countMissing({
      key: 'or',
      value: '(latitude.is.null,longitude.is.null)'
    });
    console.log(`Missing coordinates: ${missingCoords}`);

    // Calculate percentages
    const withCoords = total - missingCoords;
    const percentComplete = ((withCoords / total) * 100).toFixed(1);

    console.log(`With coordinates: ${withCoords}`);
    console.log(`Completion: ${percentComplete}%`);

    console.log('');
    console.log('='.repeat(80));

    if (missingCoords > 0) {
      console.log(`\n${missingCoords} booths need geocoding`);
      console.log('\nTo geocode them, run:');
      console.log('  export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)');
      console.log('  node scripts/run-geocoding.js');
    } else {
      console.log('\nAll booths have coordinates!');
    }

  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

main();
