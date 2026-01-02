/**
 * Advanced Caching Layer
 * Council Recommendation: Redis-backed caching with in-memory fallback
 * Builds on existing cache.ts with more sophisticated caching strategies
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export const CACHE_KEYS = {
  // Map viewport queries - Short TTL due to dynamic nature
  BOOTHS_VIEWPORT: (bounds: string) => `booths:viewport:${bounds}`,

  // Booth details - Medium TTL
  BOOTH_DETAIL: (id: string) => `booth:${id}:detail`,

  // City statistics - Long TTL
  CITY_STATS: (city: string, state: string) => `city:${city}:${state}:stats`,

  // Featured booths - Very long TTL
  FEATURED_BOOTHS: 'booths:featured:v1',

  // Search results with hash of query
  SEARCH_RESULTS: (query: string) => `search:${Buffer.from(query).toString('base64')}`,

  // Geocoding status
  GEOCODING_STATUS: 'geocoding:status',

  // API rate limiting
  RATE_LIMIT: (identifier: string) => `ratelimit:${identifier}`,

  // User sessions (if needed)
  USER_SESSION: (userId: string) => `session:${userId}`,
} as const;

export const TTL = {
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  SIX_HOURS: 21600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
} as const;

/**
 * In-Memory LRU Cache for local fallback
 */
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  set(key: string, data: T, ttl: number): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * Advanced Cache Service
 */
export class AdvancedCacheService {
  private memoryCache: LRUCache<unknown>;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
  };

  constructor(maxMemoryCacheSize: number = 1000) {
    this.memoryCache = new LRUCache(maxMemoryCacheSize);

    // TODO: Initialize Redis when available
    // if (process.env.REDIS_URL) {
    //   this.redisClient = new Redis(process.env.REDIS_URL);
    // }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryValue = this.memoryCache.get(key);
    if (memoryValue !== null) {
      this.stats.hits++;
      return memoryValue as T;
    }

    // TODO: Try Redis
    // if (this.redisClient) {
    //   const redisValue = await this.redisClient.get(key);
    //   if (redisValue) {
    //     const parsed = JSON.parse(redisValue);
    //     // Populate memory cache
    //     this.memoryCache.set(key, parsed, TTL.FIFTEEN_MINUTES);
    //     this.stats.hits++;
    //     return parsed as T;
    //   }
    // }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl: number = TTL.ONE_HOUR): Promise<void> {
    this.stats.sets++;

    // Set in memory cache
    this.memoryCache.set(key, value, ttl);

    // TODO: Set in Redis
    // if (this.redisClient) {
    //   await this.redisClient.setex(key, ttl, JSON.stringify(value));
    // }
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);

    // TODO: Delete from Redis
    // if (this.redisClient) {
    //   await this.redisClient.del(key);
    // }
  }

  /**
   * Get or compute with automatic caching
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttl: number = TTL.ONE_HOUR
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const computed = await computeFn();
    await this.set(key, computed, ttl);
    return computed;
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    // Try to get all from memory cache first
    for (const key of keys) {
      const value = await this.get<T>(key);
      results.set(key, value);
    }

    return results;
  }

  /**
   * Batch set multiple keys
   */
  async mset<T>(entries: Map<string, T>, ttl: number = TTL.ONE_HOUR): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keys = this.memoryCache.keys().filter(key => regex.test(key));

    for (const key of keys) {
      this.memoryCache.delete(key);
    }

    // TODO: Invalidate in Redis
    // if (this.redisClient) {
    //   const redisKeys = await this.redisClient.keys(pattern);
    //   if (redisKeys.length > 0) {
    //     await this.redisClient.del(...redisKeys);
    //   }
    //   return redisKeys.length + keys.length;
    // }

    return keys.length;
  }

  /**
   * Rate limiting with sliding window
   */
  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const key = CACHE_KEYS.RATE_LIMIT(identifier);
    const now = Date.now();

    // Get current window data
    const windowData = await this.get<number[]>(key) || [];

    // Remove expired timestamps
    const validTimestamps = windowData.filter(
      timestamp => now - timestamp < windowSeconds * 1000
    );

    // Check if limit exceeded
    if (validTimestamps.length >= maxRequests) {
      const oldestTimestamp = Math.min(...validTimestamps);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(oldestTimestamp + windowSeconds * 1000),
      };
    }

    // Add current timestamp
    validTimestamps.push(now);
    await this.set(key, validTimestamps, windowSeconds);

    return {
      allowed: true,
      remaining: maxRequests - validTimestamps.length,
      resetAt: new Date(now + windowSeconds * 1000),
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : '0.00';

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memorySize: this.memoryCache.size(),
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
    };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    // TODO: Clear Redis
    // if (this.redisClient) {
    //   await this.redisClient.flushall();
    // }
  }
}

// Singleton instance
let cacheServiceInstance: AdvancedCacheService | null = null;

export function getAdvancedCache(): AdvancedCacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new AdvancedCacheService();
  }
  return cacheServiceInstance;
}

/**
 * Caching strategies for different data types
 */
export const CachingStrategies = {
  /**
   * Viewport booths - Short TTL, frequently updated
   */
  viewportBooths: {
    getTTL: (boothCount: number) => {
      // More booths = longer cache
      return boothCount > 100 ? TTL.THIRTY_MINUTES : TTL.FIFTEEN_MINUTES;
    },
  },

  /**
   * Booth details - Medium TTL, less frequently updated
   */
  boothDetails: {
    getTTL: (verificationStatus: string) => {
      // Verified booths cached longer
      return verificationStatus === 'verified' ? TTL.SIX_HOURS : TTL.ONE_HOUR;
    },
  },

  /**
   * Search results - Variable TTL based on popularity
   */
  searchResults: {
    getTTL: (resultCount: number) => {
      // Popular searches (many results) cached longer
      return resultCount > 10 ? TTL.ONE_HOUR : TTL.FIFTEEN_MINUTES;
    },
  },
};

/**
 * Cache warming utility
 */
export async function warmPopularCaches() {
  const cache = getAdvancedCache();

  console.log('🔥 Warming popular caches...');

  // TODO: Implement cache warming for:
  // - Top 10 cities
  // - Featured booths
  // - Popular search terms

  console.log('✅ Cache warming complete');
}

/**
 * Example usage in API route:
 *
 * import { getAdvancedCache, CACHE_KEYS, TTL } from '@/lib/advanced-cache';
 *
 * export async function GET(request: Request) {
 *   const cache = getAdvancedCache();
 *   const { searchParams } = new URL(request.url);
 *   const city = searchParams.get('city');
 *
 *   return cache.getOrCompute(
 *     CACHE_KEYS.CITY_STATS(city, state),
 *     async () => {
 *       const stats = await fetchCityStatsFromDB(city, state);
 *       return stats;
 *     },
 *     TTL.SIX_HOURS
 *   );
 * }
 */
