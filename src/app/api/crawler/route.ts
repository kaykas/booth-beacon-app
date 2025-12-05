/**
 * Crawler SSE Streaming API Route
 *
 * Secure server-side proxy for the unified-crawler Edge Function.
 * Uses SERVICE_ROLE_KEY to bypass RLS and perform admin operations.
 * Supports Server-Sent Events (SSE) streaming for real-time updates.
 */

import { NextRequest } from 'next/server';
import { getRequiredEnv } from '@/lib/utils';

const SUPABASE_URL = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Forward all query parameters to the Edge Function
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => {
    params.append(key, value);
  });

  const endpoint = `${SUPABASE_URL}/functions/v1/unified-crawler?${params}`;

  console.log('[Crawler API] Initiating SSE stream to:', endpoint);

  try {
    // Fetch with SERVICE_ROLE_KEY
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Accept': 'text/event-stream',
      },
    });

    if (!response.ok) {
      console.error('[Crawler API] Edge Function error:', response.status, response.statusText);
      return new Response(`Error: ${response.statusText}`, { status: response.status });
    }

    // Stream the response back to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('[Crawler API] Stream completed');
              controller.close();
              break;
            }

            // Forward the SSE data chunk to the client
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (error) {
          console.error('[Crawler API] Stream error:', error);
          controller.error(error);
        }
      },
    });

    // Return SSE response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Crawler API] Server error:', error);
    return new Response(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}
