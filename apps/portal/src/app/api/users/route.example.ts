/**
 * Example API Route: GET /api/users
 * Demonstrates complete Phase 4 integration
 * - Caching with cache-layer
 * - Monitoring with sentry-enhanced
 * - Middleware with api-middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildApiRoute } from '@/lib/api-middleware';
import { withQueryCache } from '@/lib/api-middleware';
import { listUsersEfficient } from '@/lib/queries-optimized';
import { CACHE_KEYS, CACHE_TTL, invalidateUsersList } from '@/lib/cache-layer';
import { recordMetric } from '@/lib/sentry-enhanced';

// ============================================================================
// QUERY FUNCTION WITH CACHING
// ============================================================================

const getCachedUsersList = withQueryCache(
  async (page: number = 1, limit: number = 10) => {
    return listUsersEfficient(page, limit);
  },
  (page: number = 1) => CACHE_KEYS.usersList(page),
  CACHE_TTL.MEDIUM
);

// ============================================================================
// ROUTE HANDLER
// ============================================================================

async function handleGetUsers(req: NextRequest) {
  // Get pagination params
  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '10'));

  // Get users with automatic caching
  const users = await getCachedUsersList(page, limit);

  // Record metric
  recordMetric('users_fetched', users.length, {
    page: page.toString(),
    limit: limit.toString()
  });

  return NextResponse.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total: users.length
    }
  });
}

// ============================================================================
// EXPORT WITH MIDDLEWARE
// ============================================================================

export const GET = buildApiRoute(handleGetUsers, {
  cacheable: true,
  cacheTTL: CACHE_TTL.MEDIUM,
  cacheHeaders: true,
  maxAge: 300 // 5 minutes browser cache
});

// ============================================================================
// POST: CREATE USER (with cache invalidation)
// ============================================================================

export const POST = buildApiRoute(
  async (req: NextRequest) => {
    const body = await req.json();

    // Validate body (in production, use Zod/Joi)
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: body.email,
        name: body.name
      }
    });

    // Invalidate users list cache
    invalidateUsersList();

    // Record metric
    recordMetric('users_created', 1, { success: 'true' });

    return NextResponse.json(
      {
        success: true,
        data: user
      },
      { status: 201 }
    );
  },
  {
    requireAuth: true,
    cacheHeaders: false
  }
);

/**
 * USAGE EXAMPLES
 * 
 * # Get all users (with caching)
 * curl https://domain.com/api/users?page=1&limit=10
 * 
 * # Create user (invalidates cache)
 * curl -X POST https://domain.com/api/users \
 *   -H "Authorization: Bearer token" \
 *   -H "Content-Type: application/json" \
 *   -d '{"email":"user@example.com","name":"User"}'
 * 
 * # Response includes cache info
 * {
 *   "success": true,
 *   "data": [...],
 *   "pagination": {"page":1,"limit":10,"total":10}
 * }
 * 
 * # Response headers include:
 * X-Response-Time: 150ms
 * X-Request-ID: req_123
 * Cache-Control: public, max-age=300
 * X-Content-Type-Options: nosniff
 */
