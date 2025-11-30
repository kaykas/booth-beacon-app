import { NextResponse } from 'next/server';

/**
 * API Route: Check Discovery Engine Environment Variables
 *
 * Returns the status of required environment variables for the Discovery Engine.
 * Does NOT expose the actual values for security.
 */
export async function GET() {
  const envVars = {
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    FIRECRAWL_API_KEY: !!process.env.FIRECRAWL_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  const allSet = Object.values(envVars).every(val => val === true);

  return NextResponse.json({
    envVars,
    allSet,
    message: allSet
      ? 'All required environment variables are set'
      : 'Some required environment variables are missing'
  });
}
