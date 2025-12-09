#!/usr/bin/env npx tsx

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
  console.log('Checking admin_users table...\n');

  // Check admin_users table
  const { data: adminUsers, error: adminError } = await supabase
    .from('admin_users')
    .select('*');

  if (adminError) {
    console.error('Error fetching admin_users:', adminError);
  } else {
    console.log('admin_users table contents:');
    console.log(adminUsers);
    console.log('');
  }

  // Check profiles table
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, is_admin')
    .eq('email', 'jascha@kaykas.com');

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  } else {
    console.log('jascha@kaykas.com profile:');
    console.log(profiles);
    console.log('');
  }

  // Test the is_admin RPC function
  if (profiles && profiles.length > 0) {
    const { data: isAdminResult, error: rpcError } = await supabase
      .rpc('is_admin', { user_uuid: profiles[0].id });

    if (rpcError) {
      console.error('Error calling is_admin RPC:', rpcError);
    } else {
      console.log(`is_admin() RPC result for ${profiles[0].email}: ${isAdminResult}`);
    }
  }
}

run().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
