import { prisma } from '@/lib/prisma';
import { cacheWrapper, cache } from '@/lib/cache';

/**
 * Optimized query helpers with caching and best practices
 */

/**
 * Get user profile with caching
 */
export async function getOptimizedUserProfile(userId: string) {
  return cacheWrapper(
    `user:profile:${userId}`,
    async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          membershipTier: true,
          avatarUrl: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });
    },
    5 * 60 * 1000 // 5 min TTL
  );
}

/**
 * Get user's active subscription with caching
 */
export async function getOptimizedActiveSubscription(userId: string) {
  return cacheWrapper(
    `user:subscription:${userId}`,
    async () => {
      return await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['active', 'past_due'] },
        },
        select: {
          id: true,
          status: true,
          currentTier: true,
          renewalDate: true,
          stripeSubscriptionId: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    },
    60 * 1000 // 1 min TTL
  );
}

/**
 * Get platform statistics with caching
 */
export async function getOptimizedPlatformStats() {
  return cacheWrapper(
    'platform:stats',
    async () => {
      const [
        totalUsers,
        activeSubscriptions,
        revenueData,
        newUsers30Days,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.subscription.count({
          where: { status: 'active' },
        }),
        prisma.subscription.findMany({
          where: { status: { in: ['active', 'past_due'] } },
          select: { stripePriceId: true },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      return {
        totalUsers,
        activeSubscriptions,
        revenueData,
        newUsers30Days,
      };
    },
    10 * 60 * 1000 // 10 min TTL
  );
}

/**
 * Invalidate user cache on updates
 */
export function invalidateUserCache(userId: string) {
  cache.delete(`user:profile:${userId}`);
  cache.delete(`user:subscription:${userId}`);
}

/**
 * Invalidate platform stats cache
 */
export function invalidatePlatformStatsCache() {
  cache.delete('platform:stats');
}

/**
 * Batch fetch users by IDs (prevents N+1)
 */
export async function batchFetchUsers(userIds: string[]) {
  return await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      email: true,
      membershipTier: true,
      avatarUrl: true,
    },
  });
}

/**
 * Get users with subscriptions (optimized join)
 */
export async function getUsersWithActiveSubscriptions(
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        subscriptions: {
          some: { status: 'active' },
        },
      },
      include: {
        subscriptions: {
          where: { status: 'active' },
          select: {
            id: true,
            currentTier: true,
            renewalDate: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({
      where: {
        subscriptions: {
          some: { status: 'active' },
        },
      },
    }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Monitor slow queries
 */
export async function monitorSlowQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  thresholdMs: number = 1000
): Promise<T> {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;

    if (duration > thresholdMs) {
      console.warn(
        `⚠️ Slow query detected: ${queryName} took ${duration}ms (threshold: ${thresholdMs}ms)`
      );
      // In production, send to monitoring service (Sentry, DataDog, etc.)
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `❌ Query failed: ${queryName} after ${duration}ms`,
      error
    );
    throw error;
  }
}

/**
 * Cleanup old records (run as cron job)
 */
export async function cleanupOldRecords() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const results = await Promise.all([
    // Delete expired sessions
    prisma.session.deleteMany({
      where: { expires: { lt: new Date() } },
    }),

    // Delete read notifications older than 30 days
    prisma.notification.deleteMany({
      where: {
        read: true,
        createdAt: { lt: thirtyDaysAgo },
      },
    }),

    // Delete expired API tokens
    prisma.apiToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    }),

    // Delete ended impersonation sessions older than 30 days
    prisma.adminImpersonation.deleteMany({
      where: {
        endedAt: { not: null, lt: thirtyDaysAgo },
      },
    }),
  ]);

  console.log('Cleanup completed:', {
    expiredSessions: results[0].count,
    oldNotifications: results[1].count,
    expiredTokens: results[2].count,
    oldImpersonations: results[3].count,
  });

  return results;
}
