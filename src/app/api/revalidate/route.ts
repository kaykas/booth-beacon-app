import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { submitPage } from '@/lib/indexnow/client';

/**
 * On-Demand Revalidation API Route
 *
 * Allows Edge Functions to trigger immediate page revalidation after data updates.
 * This ensures users see fresh content without waiting for ISR revalidation window.
 *
 * Usage:
 * GET /api/revalidate?token=SECRET&path=/booth/slug-here
 *
 * Security: Requires REVALIDATE_TOKEN environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify security token
    const token = request.nextUrl.searchParams.get('token');
    const expectedToken = process.env.REVALIDATE_TOKEN;

    if (!expectedToken) {
      console.error('[Revalidate] REVALIDATE_TOKEN not configured');
      return NextResponse.json(
        { error: 'Revalidation not configured' },
        { status: 500 }
      );
    }

    if (token !== expectedToken) {
      console.warn('[Revalidate] Invalid token attempt');
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get path to revalidate
    const path = request.nextUrl.searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Missing path parameter' },
        { status: 400 }
      );
    }

    // Validate path format
    if (!path.startsWith('/')) {
      return NextResponse.json(
        { error: 'Path must start with /' },
        { status: 400 }
      );
    }

    console.log(`[Revalidate] Revalidating path: ${path}`);

    // Trigger revalidation
    revalidatePath(path);

    // Also revalidate homepage if this is a booth (new photo might show in grid)
    if (path.startsWith('/booth/')) {
      revalidatePath('/');
      console.log('[Revalidate] Also revalidated homepage');
    }

    // Notify search engines via IndexNow (non-blocking)
    submitPage(path).catch((error) => {
      console.error('IndexNow notification failed:', error);
      // Non-critical, don't fail the request
    });

    return NextResponse.json({
      success: true,
      revalidated: true,
      path,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Revalidate] Error:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
