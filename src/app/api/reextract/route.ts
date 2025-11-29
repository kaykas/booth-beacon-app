/**
 * Reextraction API Route
 *
 * Secure server-side proxy for the reextract-content Edge Function.
 * Uses SERVICE_ROLE_KEY to bypass RLS and perform admin operations.
 */

import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content_id, limit, source_id } = body;

    // Determine endpoint based on request
    const isBatch = limit !== undefined || source_id !== undefined;
    const endpoint = isBatch
      ? `${SUPABASE_URL}/functions/v1/reextract-content/batch`
      : `${SUPABASE_URL}/functions/v1/reextract-content`;

    const requestBody = isBatch
      ? { source_id, limit: Math.min(limit || 10, 50) }
      : { content_id };

    console.log(`[Reextract API] Calling ${isBatch ? 'batch' : 'single'} reextraction`);

    // Call Edge Function with SERVICE_ROLE_KEY
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Reextract API] Edge Function error:', data);
      return NextResponse.json(
        { error: data.error || 'Re-extraction failed', success: false },
        { status: response.status }
      );
    }

    console.log('[Reextract API] Success:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('[Reextract API] Server error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
