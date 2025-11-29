import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Check for required environment variables
// Use placeholder values during build if not configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// Validate environment variables
function validateSupabaseConfig(): boolean {
  const isValid =
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseUrl.includes('supabase.co') &&
    supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

  if (!isValid && typeof window === 'undefined') {
    console.error('❌ Supabase configuration is missing or invalid!');
    console.error('Required environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return isValid;
}

// Validate config on module load (server-side only)
if (typeof window === 'undefined') {
  validateSupabaseConfig();
}

/**
 * Browser client for Supabase using SSR
 * This client properly handles cookies set by the auth callback
 * Use this in client components and pages
 */
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * Create a Supabase client for server-side operations with enhanced error handling
 * Use this in server components, API routes, and server actions
 *
 * @returns A Supabase client configured for server-side use
 * @throws Error if configuration is invalid
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate configuration
  if (!url || url === 'https://placeholder.supabase.co') {
    const error = new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not configured. Please set it in your environment variables.'
    );
    console.error('❌ Supabase Configuration Error:', error.message);
    throw error;
  }

  if (!serviceKey || serviceKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-service') {
    const error = new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Please set it in your environment variables.'
    );
    console.error('❌ Supabase Configuration Error:', error.message);
    throw error;
  }

  try {
    return createClient<Database>(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-client-info': 'booth-beacon-app',
        },
      },
    });
  } catch (error) {
    console.error('❌ Failed to create Supabase server client:', error);
    throw error;
  }
}

/**
 * Check if Supabase is configured and available
 * Useful for conditional rendering or graceful degradation
 */
export function isSupabaseConfigured(): boolean {
  return validateSupabaseConfig();
}
