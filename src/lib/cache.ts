/**
 * Cache Configuration Utility
 * Centralized cache settings for different page types and resources
 */

export const CacheConfig = {
  // Static pages with ISR (Incremental Static Regeneration)
  staticPage: {
    revalidate: 3600, // 1 hour
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  },

  // Dynamic content that changes frequently
  dynamicPage: {
    revalidate: 60, // 1 minute
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  },

  // API responses (public data)
  publicApi: {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  },

  // API responses (private/authenticated)
  privateApi: {
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  },

  // Static assets (images, fonts, etc.)
  staticAsset: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },

  // No cache (for sensitive or frequently changing data)
  noCache: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
} as const;

/**
 * Revalidation times for different page types
 */
export const RevalidateTime = {
  // Home page - revalidate every 5 minutes
  home: 300,

  // City guides - revalidate every hour
  cityGuide: 3600,

  // Individual booth pages - revalidate every 30 minutes
  booth: 1800,

  // Search results - revalidate every 5 minutes
  search: 300,

  // User profiles - revalidate every 10 minutes
  profile: 600,

  // Static content - revalidate daily
  static: 86400,
} as const;

/**
 * Helper function to set cache headers on a Response
 */
export function setCacheHeaders(
  response: Response,
  cacheType: keyof typeof CacheConfig
): Response {
  const headers = new Headers(response.headers);
  const cacheHeaders = CacheConfig[cacheType].headers;

  Object.entries(cacheHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Helper function to get cache headers as an object
 */
export function getCacheHeaders(
  cacheType: keyof typeof CacheConfig
): Record<string, string> {
  return CacheConfig[cacheType].headers;
}

/**
 * Helper function to create a cached fetch response
 */
export async function cachedFetch(
  url: string,
  cacheType: keyof typeof CacheConfig,
  options?: RequestInit
): Promise<Response> {
  const cacheHeaders = CacheConfig[cacheType].headers;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...cacheHeaders,
    },
  });

  return response;
}

/**
 * Helper to determine if a route should be cached based on authentication
 */
export function shouldCache(isAuthenticated: boolean, isPublicRoute: boolean): boolean {
  // Don't cache authenticated pages
  if (isAuthenticated && !isPublicRoute) {
    return false;
  }

  // Cache public routes
  return isPublicRoute;
}

/**
 * Get appropriate cache configuration based on route type
 */
export function getCacheConfigForRoute(
  pathname: string,
  isAuthenticated: boolean
): keyof typeof CacheConfig {
  // API routes
  if (pathname.startsWith('/api/')) {
    return isAuthenticated ? 'privateApi' : 'publicApi';
  }

  // Static assets
  if (pathname.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|avif|woff|woff2|ttf|eot)$/)) {
    return 'staticAsset';
  }

  // Authenticated pages
  if (isAuthenticated) {
    return 'noCache';
  }

  // Home page
  if (pathname === '/') {
    return 'dynamicPage';
  }

  // City guides
  if (pathname.startsWith('/guides/')) {
    return 'staticPage';
  }

  // Booth pages
  if (pathname.startsWith('/booth/')) {
    return 'staticPage';
  }

  // Default to dynamic page caching
  return 'dynamicPage';
}
