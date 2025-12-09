#!/usr/bin/env npx tsx

/**
 * Set user as admin in the database
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmgbmcbwfkvmylmfpkzy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const email = process.argv[2];

  if (!email) {
    console.log('Usage: npx tsx scripts/set-admin.ts <email>');
    process.exit(1);
  }

  console.log(`Setting ${email} as admin...`);

  // Find user by email
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id, email, is_admin')
    .eq('email', email)
    .single();

  if (findError || !profile) {
    console.error('User not found:', email);
    console.log('Make sure you\'ve logged in to the site at least once to create a profile.');
    process.exit(1);
  }

  console.log('Found user:', profile.email);
  console.log('Current admin status:', profile.is_admin);

  // Set as admin
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Error setting admin:', updateError);
    process.exit(1);
  }

  console.log('✅ Successfully set', email, 'as admin!');
  console.log('You can now access /admin/moderation');
}

run().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
