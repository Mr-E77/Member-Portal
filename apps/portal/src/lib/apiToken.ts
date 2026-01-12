import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import * as Sentry from '@sentry/nextjs';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set, API tokens will fail');
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const TOKEN_PREFIX = 'mre_';

export interface TokenPayload {
  userId: string;
  tokenId: string;
  scopes: string[];
  tier: string;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

/**
 * Generate a new API token
 */
export function generateToken(): string {
  const randomPart = randomBytes(32).toString('hex');
  return `${TOKEN_PREFIX}${randomPart}`;
}

/**
 * Hash token for storage
 */
export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

/**
 * Verify token hash
 */
export async function verifyTokenHash(
  token: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

/**
 * Create JWT token from payload
 */
export function createJWT(payload: TokenPayload, expiresIn?: string): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn || '90d', // Default 90 days
  });
}

/**
 * Verify and decode JWT token
 */
export function verifyJWT(token: string): TokenValidationResult {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return { valid: true, payload };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' };
    }
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Check if user has required scope
 */
export function hasScope(scopes: string[], requiredScope: string): boolean {
  // Support wildcard scopes
  if (scopes.includes('*') || scopes.includes('admin:*')) {
    return true;
  }

  // Check exact match
  if (scopes.includes(requiredScope)) {
    return true;
  }

  // Check namespace match (e.g., "read:*" matches "read:profile")
  const [namespace] = requiredScope.split(':');
  if (scopes.includes(`${namespace}:*`)) {
    return true;
  }

  return false;
}

/**
 * Available API scopes
 */
export const AVAILABLE_SCOPES = {
  // Read scopes
  'read:profile': 'Read user profile',
  'read:subscriptions': 'Read subscription data',
  'read:invoices': 'Read invoice history',

  // Write scopes
  'write:profile': 'Update user profile',
  'write:subscriptions': 'Manage subscriptions',

  // Admin scopes
  'admin:users': 'Manage users',
  'admin:stats': 'View platform statistics',
  'admin:impersonate': 'Impersonate users',

  // Wildcard scopes
  'read:*': 'Read all resources',
  'write:*': 'Write all resources',
  'admin:*': 'Full admin access',
  '*': 'Full API access',
} as const;

/**
 * Get scopes allowed for membership tier
 */
export function getAllowedScopesForTier(tier: string): string[] {
  switch (tier) {
    case 'admin':
      return ['*'];
    case 'tier4':
      return ['read:*', 'write:*'];
    case 'tier3':
      return [
        'read:profile',
        'read:subscriptions',
        'read:invoices',
        'write:profile',
        'write:subscriptions',
      ];
    case 'tier2':
      return ['read:profile', 'read:subscriptions', 'write:profile'];
    case 'tier1':
    default:
      return ['read:profile'];
  }
}

/**
 * Validate token scopes against tier permissions
 */
export function validateScopes(
  requestedScopes: string[],
  tier: string
): { valid: boolean; invalidScopes: string[] } {
  const allowedScopes = getAllowedScopesForTier(tier);

  // Admin can request any scope
  if (allowedScopes.includes('*')) {
    return { valid: true, invalidScopes: [] };
  }

  const invalidScopes = requestedScopes.filter(
    (scope) => !hasScope(allowedScopes, scope)
  );

  return {
    valid: invalidScopes.length === 0,
    invalidScopes,
  };
}

/**
 * Rate limit tracking for API tokens
 */
const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();

export function checkRateLimit(
  tokenId: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(tokenId);

  if (!existing || existing.resetAt < now) {
    // Create new window
    rateLimitMap.set(tokenId, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Increment count
  existing.count++;

  if (existing.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [tokenId, data] of rateLimitMap.entries()) {
    if (data.resetAt < now) {
      rateLimitMap.delete(tokenId);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);
