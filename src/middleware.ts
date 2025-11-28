import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCacheConfigForRoute, getCacheHeaders } from '@/lib/cache';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client configured for Server-Side Rendering
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedRoutes = ['/profile', '/bookmarks'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // If accessing protected route without session, redirect to home
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/', req.url);
    redirectUrl.searchParams.set('login', 'required');
    return NextResponse.redirect(redirectUrl);
  }

  // Add security headers
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Add cache headers based on route type and authentication status
  const cacheType = getCacheConfigForRoute(req.nextUrl.pathname, !!session);
  const cacheHeaders = getCacheHeaders(cacheType);

  Object.entries(cacheHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  return res;
}

export const config = {
  matcher: ['/profile/:path*', '/bookmarks/:path*'],
};
