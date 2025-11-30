
import { NextRequest } from 'next/server';
import { processSource, LogEvent } from '@/lib/crawler/master';

// Allow longer timeout for crawling (Vercel Pro: 300s, Hobby: 60s)
// We rely on the client loop to avoid global timeouts, but individual source must finish
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('sourceId');

  if (!sourceId) {
    return new Response('Missing sourceId', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: LogEvent | { type: string; message: string }) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const logCallback = (event: LogEvent) => {
        send(event);
      };

      try {
        await processSource(sourceId, logCallback);
        send({ type: 'complete', message: 'Source finished' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        send({ type: 'error', message: errorMessage });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
