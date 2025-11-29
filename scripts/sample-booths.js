#!/usr/bin/env node

/**
 * Show sample booths that need geocoding
 */

const https = require('https');

const SUPABASE_URL = 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

function getSampleBooths() {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/booths', SUPABASE_URL);
    url.searchParams.set('select', 'id,name,address,city,country,latitude,longitude');
    url.searchParams.set('or', '(latitude.is.null,longitude.is.null)');
    url.searchParams.set('limit', '5');

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

async function main() {
  console.log('Sample booths missing coordinates:\n');

  try {
    const booths = await getSampleBooths();

    if (booths.length === 0) {
      console.log('No booths found missing coordinates!');
      return;
    }

    booths.forEach((booth, i) => {
      console.log(`${i + 1}. ${booth.name}`);
      console.log(`   Address: ${booth.address || 'N/A'}`);
      console.log(`   City: ${booth.city || 'N/A'}`);
      console.log(`   Country: ${booth.country || 'N/A'}`);
      console.log(`   Coordinates: ${booth.latitude || 'null'}, ${booth.longitude || 'null'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
