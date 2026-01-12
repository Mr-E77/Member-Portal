/**
 * Rate Limiting Utilities
 * 
 * Provides rate limiting for API routes to prevent abuse.
 * Uses in-memory storage for development/demo.
 * For production, use Redis or similar distributed cache.
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
};

export const strictConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute (for sensitive endpoints)
};

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns true if rate limit exceeded
 */
export function isRateLimited(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (entry && now < entry.resetTime) {
    if (entry.count >= config.maxRequests) {
      return true;
    }
    entry.count++;
    return false;
  }

  // Reset or create new entry
  rateLimitStore.set(identifier, {
    count: 1,
    resetTime: now + config.windowMs,
  });

  return false;
}

/**
 * Get remaining requests for an identifier
 * @param identifier - Unique identifier
 * @param config - Rate limit configuration
 * @returns remaining request count
 */
export function getRemainingRequests(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): number {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now >= entry.resetTime) {
    return config.maxRequests;
  }

  return Math.max(0, config.maxRequests - entry.count);
}

/**
 * Get time until rate limit reset
 * @param identifier - Unique identifier
 * @returns milliseconds until reset, or 0 if no active limit
 */
export function getResetTime(identifier: string): number {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now >= entry.resetTime) {
    return 0;
  }

  return entry.resetTime - now;
}

/**
 * Clean up expired entries from the rate limit store
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Clear all rate limit entries (for testing)
 */
export function clearRateLimits(): void {
  rateLimitStore.clear();
}

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
