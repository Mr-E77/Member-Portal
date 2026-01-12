/**
 * In-Memory Caching Layer
 * Simple, efficient caching for database query results
 * Phase 4 Performance Optimization
 */

import NodeCache from 'node-cache';

// Initialize cache with 5-minute standard TTL
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Performance optimization
});

// ============================================================================
// CACHE KEY CONSTANTS
// ============================================================================

export const CACHE_KEYS = {
  // User data
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  userDashboard: (id: string) => `user:dashboard:${id}`,
  
  // Lists
  usersList: (page: number) => `users:list:${page}`,
  subscriptionsList: (userId: string, page: number) => `subs:user:${userId}:${page}`,
  activityLog: (page: number) => `activity:${page}`,
  
  // Admin
  adminStats: () => 'admin:stats',
  adminActivityLog: (page: number) => `admin:activity:${page}`,
  
  // Config
  portalConfig: (id: string) => `config:${id}`,
  
  // API Tokens
  apiTokens: (userId: string) => `tokens:${userId}`
};

// ============================================================================
// CACHE TTL CONSTANTS (in seconds)
// ============================================================================

export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 600,        // 10 minutes
  VERY_LONG: 1800   // 30 minutes
};

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Wrap a query with caching
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(key);
  if (cached) {
    console.log(`[CACHE HIT] ${key}`);
    return cached;
  }

  console.log(`[CACHE MISS] ${key}`);
  
  // Execute query
  const result = await queryFn();
  
  // Store in cache
  cache.set(key, result, ttl);
  
  return result;
}

/**
 * Set a value in cache
 */
export function setCached<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.MEDIUM
): void {
  cache.set(key, value, ttl);
}

/**
 * Get a value from cache
 */
export function getCached<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

/**
 * Delete a key from cache
 */
export function deleteCached(key: string): number {
  return cache.del(key);
}

/**
 * Delete multiple keys by pattern
 */
export function deleteCachedByPattern(pattern: string): number {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  return cache.del(matchingKeys);
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cache.flushAll();
}

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

/**
 * Invalidate user cache
 */
export function invalidateUserCache(userId: string): void {
  deleteCached(CACHE_KEYS.user(userId));
  deleteCached(CACHE_KEYS.userProfile(userId));
  deleteCached(CACHE_KEYS.userDashboard(userId));
  deleteCached(CACHE_KEYS.apiTokens(userId));
  console.log(`[CACHE INVALIDATED] User: ${userId}`);
}

/**
 * Invalidate all user list cache
 */
export function invalidateUsersList(): void {
  deleteCachedByPattern('users:list:');
  console.log(`[CACHE INVALIDATED] Users list`);
}

/**
 * Invalidate user subscription cache
 */
export function invalidateUserSubscriptions(userId: string): void {
  deleteCachedByPattern(`subs:user:${userId}:`);
  console.log(`[CACHE INVALIDATED] Subscriptions for user: ${userId}`);
}

/**
 * Invalidate admin cache
 */
export function invalidateAdminCache(): void {
  deleteCached(CACHE_KEYS.adminStats());
  deleteCachedByPattern('admin:');
  deleteCachedByPattern('activity:');
  console.log(`[CACHE INVALIDATED] Admin cache`);
}

/**
 * Invalidate config cache
 */
export function invalidateConfigCache(configId: string): void {
  deleteCached(CACHE_KEYS.portalConfig(configId));
  console.log(`[CACHE INVALIDATED] Config: ${configId}`);
}

// ============================================================================
// CACHE STATISTICS
// ============================================================================

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const keys = cache.keys();
  const stats = cache.getStats();
  
  return {
    keys: keys.length,
    hits: stats.hits,
    misses: stats.misses,
    ksize: stats.ksize,
    vsize: stats.vsize,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0
  };
}

/**
 * Log cache statistics
 */
export function logCacheStats(): void {
  const stats = getCacheStats();
  console.log('[CACHE STATS]', {
    totalKeys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
    memoryKB: stats.ksize + stats.vsize
  });
}

// ============================================================================
// CACHE MIDDLEWARE (for API routes)
// ============================================================================

/**
 * Middleware for caching API responses
 */
export function withCaching<T>(
  cacheKey: string,
  ttl: number = CACHE_TTL.MEDIUM
) {
  return async (queryFn: () => Promise<T>): Promise<T> => {
    return cachedQuery(cacheKey, queryFn, ttl);
  };
}

// ============================================================================
// CACHE PREWARMING
// ============================================================================

/**
 * Prewarm cache with frequently accessed data
 */
export async function prewarmCache(fn: () => Promise<void>): Promise<void> {
  console.log('[CACHE] Prewarming...');
  try {
    await fn();
    console.log('[CACHE] Prewarm complete');
  } catch (error) {
    console.error('[CACHE] Prewarm failed:', error);
  }
}

// ============================================================================
// MONITORING
// ============================================================================

/**
 * Monitor cache performance
 */
export function monitorCachePerformance(): NodeJS.Timer {
  return setInterval(() => {
    const stats = getCacheStats();
    if (stats.keys > 0) {
      console.log('[CACHE MONITOR]', {
        keys: stats.keys,
        hitRate: `${(stats.hitRate * 100).toFixed(2)}%`
      });
    }
  }, 60000); // Log every minute
}

export default {
  cachedQuery,
  setCached,
  getCached,
  deleteCached,
  deleteCachedByPattern,
  clearAllCache,
  invalidateUserCache,
  invalidateUsersList,
  invalidateUserSubscriptions,
  invalidateAdminCache,
  invalidateConfigCache,
  getCacheStats,
  logCacheStats,
  withCaching,
  prewarmCache,
  monitorCachePerformance,
  CACHE_KEYS,
  CACHE_TTL
};
