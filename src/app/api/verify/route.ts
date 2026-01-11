import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { VerificationType, VerificationSubmission } from '@/types/verification';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Valid verification types
const VALID_VERIFICATION_TYPES: VerificationType[] = ['working', 'not_working', 'closed', 'moved'];

// Helper to hash IP for spam prevention (privacy-preserving)
function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'booth-beacon-default-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex').substring(0, 16);
}

// Rate limiting: check if same IP verified same booth recently
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkRateLimit(supabase: SupabaseClient<any, any, any>, boothId: string, ipHash: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('booth_verifications')
    .select('id')
    .eq('booth_id', boothId)
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo)
    .limit(1);

  if (error) {
    console.error('Rate limit check error:', error);
    return false; // Allow on error
  }

  return data && data.length > 0;
}

/**
 * POST /api/verify
 * Submit a new verification for a booth
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VerificationSubmission;
    const { booth_id, verification_type, notes, photo_url } = body;

    // Validate required fields
    if (!booth_id) {
      return NextResponse.json(
        { error: 'booth_id is required' },
        { status: 400 }
      );
    }

    if (!verification_type || !VALID_VERIFICATION_TYPES.includes(verification_type)) {
      return NextResponse.json(
        { error: 'Valid verification_type is required (working, not_working, closed, moved)' },
        { status: 400 }
      );
    }

    // Get IP for rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';
    const ipHash = hashIP(ip);
    const userAgent = request.headers.get('user-agent') || null;

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if booth exists
    const { data: booth, error: boothError } = await supabase
      .from('booths')
      .select('id, name')
      .eq('id', booth_id)
      .single();

    if (boothError || !booth) {
      return NextResponse.json(
        { error: 'Booth not found' },
        { status: 404 }
      );
    }

    // Check rate limit
    const isRateLimited = await checkRateLimit(supabase, booth_id, ipHash);
    if (isRateLimited) {
      return NextResponse.json(
        { error: 'You have already verified this booth recently. Please wait before verifying again.' },
        { status: 429 }
      );
    }

    // Try to get authenticated user (optional)
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const anonClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user } } = await anonClient.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    // Insert verification
    const { data: verification, error: insertError } = await supabase
      .from('booth_verifications')
      .insert([{
        booth_id,
        user_id: userId,
        verification_type,
        notes: notes || null,
        photo_url: photo_url || null,
        verified_at: new Date().toISOString(),
        ip_hash: ipHash,
        user_agent: userAgent,
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting verification:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit verification', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      verification: {
        id: verification.id,
        booth_id: verification.booth_id,
        verification_type: verification.verification_type,
        verified_at: verification.verified_at,
      },
      message: `Thank you! Your verification for "${booth.name}" has been recorded.`,
    });
  } catch (error) {
    console.error('Error in verify POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verify?booth_id=xxx
 * Get verification history for a booth
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boothId = searchParams.get('booth_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const includeSummary = searchParams.get('summary') !== 'false';

    if (!boothId) {
      return NextResponse.json(
        { error: 'booth_id query parameter is required' },
        { status: 400 }
      );
    }

    // Use anon key for public reads
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get verification history
    const { data: verifications, error: historyError } = await supabase
      .from('booth_verifications')
      .select('id, verification_type, notes, photo_url, verified_at, created_at')
      .eq('booth_id', boothId)
      .order('verified_at', { ascending: false })
      .limit(Math.min(limit, 50)); // Cap at 50

    if (historyError) {
      console.error('Error fetching verifications:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch verifications' },
        { status: 500 }
      );
    }

    // Calculate summary
    let summary = null;
    if (includeSummary && verifications && verifications.length > 0) {
      const workingCount = verifications.filter(v => v.verification_type === 'working').length;
      const notWorkingCount = verifications.filter(v => v.verification_type === 'not_working').length;
      const closedCount = verifications.filter(v => v.verification_type === 'closed').length;
      const movedCount = verifications.filter(v => v.verification_type === 'moved').length;
      const lastVerification = verifications[0];
      const daysSince = lastVerification
        ? Math.floor((Date.now() - new Date(lastVerification.verified_at).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      summary = {
        total_verifications: verifications.length,
        working_count: workingCount,
        not_working_count: notWorkingCount,
        closed_count: closedCount,
        moved_count: movedCount,
        last_verified_at: lastVerification?.verified_at || null,
        last_verification_type: lastVerification?.verification_type || null,
        days_since_verification: daysSince,
      };
    }

    return NextResponse.json({
      booth_id: boothId,
      verifications: verifications || [],
      summary,
    });
  } catch (error) {
    console.error('Error in verify GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
