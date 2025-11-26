import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Check for required environment variables
// Use placeholder values during build if not configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

if (!supabaseUrl.includes('supabase.co') && supabaseUrl !== 'https://placeholder.supabase.co') {
  console.warn('⚠️  Supabase URL might be invalid. Please check your environment variables.');
}

/**
 * Browser client for Supabase
 * Use this in client components and pages
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Create a Supabase client for server-side operations
 * Use this in server components, API routes, and server actions
 *
 * @returns A Supabase client configured for server-side use
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-service';

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
