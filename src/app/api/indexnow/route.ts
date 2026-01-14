import { NextRequest, NextResponse } from 'next/server';
import { submitUrl, submitUrls, submitBooth, submitPage } from '@/lib/indexnow/client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * POST /api/indexnow
 * Submit URLs to IndexNow for instant search engine notification
 *
 * Body formats:
 * - Single URL: { "url": "https://boothbeacon.org/booth/..." }
 * - Multiple URLs: { "urls": ["https://...", "https://..."] }
 * - Single booth: { "type": "booth", "slug": "booth-slug" }
 * - Multiple booths: { "type": "booths", "slugs": ["slug1", "slug2"] }
 * - Page: { "type": "page", "path": "/recent" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Single URL submission
    if (body.url) {
      const success = await submitUrl(body.url);
      return NextResponse.json(
        {
          success,
          message: success
            ? 'URL submitted to IndexNow successfully'
            : 'Failed to submit URL to IndexNow',
          url: body.url,
        },
        { status: success ? 200 : 500 }
      );
    }

    // Multiple URLs submission
    if (body.urls && Array.isArray(body.urls)) {
      const success = await submitUrls(body.urls);
      return NextResponse.json(
        {
          success,
          message: success
            ? `${body.urls.length} URLs submitted to IndexNow successfully`
            : 'Failed to submit some URLs to IndexNow',
          count: body.urls.length,
        },
        { status: success ? 200 : 500 }
      );
    }

    // Single booth submission
    if (body.type === 'booth' && body.slug) {
      const success = await submitBooth(body.slug);
      return NextResponse.json(
        {
          success,
          message: success
            ? `Booth ${body.slug} submitted to IndexNow successfully`
            : 'Failed to submit booth to IndexNow',
          slug: body.slug,
        },
        { status: success ? 200 : 500 }
      );
    }

    // Multiple booths submission
    if (body.type === 'booths' && body.slugs && Array.isArray(body.slugs)) {
      const urls = body.slugs.map((slug: string) => `https://boothbeacon.org/booth/${slug}`);
      const success = await submitUrls(urls);
      return NextResponse.json(
        {
          success,
          message: success
            ? `${body.slugs.length} booths submitted to IndexNow successfully`
            : 'Failed to submit some booths to IndexNow',
          count: body.slugs.length,
        },
        { status: success ? 200 : 500 }
      );
    }

    // Page submission (e.g., /recent, /browse/all, /collections/...)
    if (body.type === 'page' && body.path) {
      const success = await submitPage(body.path);
      return NextResponse.json(
        {
          success,
          message: success
            ? `Page ${body.path} submitted to IndexNow successfully`
            : 'Failed to submit page to IndexNow',
          path: body.path,
        },
        { status: success ? 200 : 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Invalid request body. Provide url, urls, or { type, slug/slugs/path }',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('IndexNow API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/indexnow
 * Test endpoint to verify IndexNow integration
 */
export async function GET() {
  return NextResponse.json({
    message: 'IndexNow API is ready',
    host: 'boothbeacon.org',
    keyLocation: 'https://boothbeacon.org/8c1a37a40f220431fdb88003e96e9801.txt',
    endpoints: {
      indexnow: 'https://api.indexnow.org/indexnow',
      bing: 'https://www.bing.com/indexnow',
      yandex: 'https://yandex.com/indexnow',
    },
    usage: {
      singleUrl: 'POST { "url": "https://boothbeacon.org/booth/..." }',
      multipleUrls: 'POST { "urls": ["https://...", "https://..."] }',
      singleBooth: 'POST { "type": "booth", "slug": "booth-slug" }',
      multipleBooths: 'POST { "type": "booths", "slugs": ["slug1", "slug2"] }',
      page: 'POST { "type": "page", "path": "/recent" }',
    },
  });
}
