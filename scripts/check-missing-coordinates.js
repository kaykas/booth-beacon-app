#!/usr/bin/env node

// Check how many booths are missing coordinates

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
  try {
    // Count total booths
    const { count: total, error: totalError } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      throw new Error(`Failed to count total booths: ${totalError.message}`);
    }

    // Count booths with coordinates
    const { count: withCoords, error: withCoordsError } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (withCoordsError) {
      throw new Error(`Failed to count booths with coordinates: ${withCoordsError.message}`);
    }

    // Count booths missing coordinates
    const { count: missing, error: missingError } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true })
      .or('latitude.is.null,longitude.is.null');

    if (missingError) {
      throw new Error(`Failed to count booths missing coordinates: ${missingError.message}`);
    }

    const percentage = total > 0 ? ((withCoords / total) * 100).toFixed(1) : '0.0';

    console.log('Geocoding Status:');
    console.log('=================');
    console.log(`Total booths: ${total}`);
    console.log(`With coordinates: ${withCoords} (${percentage}%)`);
    console.log(`Missing coordinates: ${missing}`);
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkStatus();
