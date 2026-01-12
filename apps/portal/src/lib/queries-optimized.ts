/**
 * Performance-Optimized Database Queries
 * Prevents N+1 queries and implements proper relation loading
 * Phase 4 Enhancement
 */

import { db } from "@/lib/db";
import { Sentry } from "@/lib/sentry";

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

interface QueryMetrics {
  duration: number;
  threshold: number;
  exceeded: boolean;
}

function trackQueryPerformance(name: string, duration: number): QueryMetrics {
  const threshold = 100; // ms
  const exceeded = duration > threshold;

  if (exceeded) {
    Sentry.captureMessage(`Slow query: ${name}`, {
      level: "warning",
      extra: { duration, name }
    });
  }

  return { duration, threshold, exceeded };
}

// ============================================================================
// USER QUERIES - OPTIMIZED
// ============================================================================

/**
 * Get user with dashboard context (all required relations in single query)
 */
export async function getUserDashboard(userId: string) {
  const start = Date.now();

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      subscriptions: {
        where: { status: { in: ["active", "past_due"] } },
        orderBy: { createdAt: "desc" },
        take: 3
      },
      apiTokens: {
        where: { expiresAt: { gt: new Date() } },
        select: {
          id: true,
          name: true,
          createdAt: true,
          lastUsedAt: true
        }
      }
    }
  });

  const duration = Date.now() - start;
  trackQueryPerformance("getUserDashboard", duration);

  return user;
}

/**
 * Efficient user listing with pagination
 */
export async function listUsersEfficient(page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit;
  const start = Date.now();

  const [users, total] = await Promise.all([
    db.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        tier: true,
        createdAt: true,
        profile: { select: { name: true, avatar: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    db.user.count()
  ]);

  const duration = Date.now() - start;
  trackQueryPerformance("listUsersEfficient", duration);

  return {
    users,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    }
  };
}

// ============================================================================
// SUBSCRIPTION QUERIES - OPTIMIZED
// ============================================================================

/**
 * Get user subscription with related data
 */
export async function getUserSubscriptionContext(userId: string) {
  const start = Date.now();

  const [currentSubscription, subscriptionHistory] = await Promise.all([
    db.subscription.findFirst({
      where: { userId, status: { in: ["active", "past_due"] } },
      orderBy: { createdAt: "desc" }
    }),
    db.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  const duration = Date.now() - start;
  trackQueryPerformance("getUserSubscriptionContext", duration);

  return { currentSubscription, subscriptionHistory };
}

/**
 * Get subscription by Stripe ID with user context
 */
export async function getSubscriptionWithContext(stripeId: string) {
  const start = Date.now();

  const subscription = await db.subscription.findUnique({
    where: { stripeId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true } }
        }
      }
    }
  });

  const duration = Date.now() - start;
  trackQueryPerformance("getSubscriptionWithContext", duration);

  return subscription;
}

// ============================================================================
// API TOKEN QUERIES - OPTIMIZED
// ============================================================================

/**
 * Get valid token by hash (doesn't leak actual token)
 */
export async function getValidTokenByHash(tokenHash: string) {
  const start = Date.now();

  const token = await db.apiToken.findFirst({
    where: {
      tokenHash: tokenHash,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: { select: { id: true, email: true } }
    }
  });

  const duration = Date.now() - start;
  trackQueryPerformance("getValidTokenByHash", duration);

  return token;
}

/**
 * List user tokens
 */
export async function listUserTokens(userId: string) {
  const start = Date.now();

  const tokens = await db.apiToken.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  const duration = Date.now() - start;
  trackQueryPerformance("listUserTokens", duration);

  return tokens;
}

// ============================================================================
// ADMIN QUERIES - OPTIMIZED
// ============================================================================

/**
 * Get admin dashboard statistics efficiently
 */
export async function getAdminDashboardStats() {
  const start = Date.now();

  const [totalUsers, activeSubscriptions, revenue] = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { status: "active" } }),
    db.subscription.aggregate({
      where: { status: "active" },
      _sum: { amount: true }
    })
  ]);

  const duration = Date.now() - start;
  trackQueryPerformance("getAdminDashboardStats", duration);

  return {
    totalUsers,
    activeSubscriptions,
    monthlyRevenue: revenue._sum.amount || 0
  };
}

/**
 * List activity logs efficiently
 */
export async function listActivityLogs(page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit;
  const start = Date.now();

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      skip,
      take: limit,
      include: {
        user: { select: { email: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    db.activityLog.count()
  ]);

  const duration = Date.now() - start;
  trackQueryPerformance("listActivityLogs", duration);

  return {
    logs,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    }
  };
}

// ============================================================================
// BATCH QUERIES - OPTIMIZED
// ============================================================================

/**
 * Get multiple users by IDs (batch operation)
 */
export async function getUsersByIds(userIds: string[]) {
  const start = Date.now();

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      email: true,
      tier: true,
      profile: { select: { name: true } }
    }
  });

  const duration = Date.now() - start;
  trackQueryPerformance(`getUsersByIds(${userIds.length})`, duration);

  return users;
}

/**
 * Get subscriptions for multiple users
 */
export async function getSubscriptionsForUsers(userIds: string[]) {
  const start = Date.now();

  const subscriptions = await db.subscription.findMany({
    where: { userId: { in: userIds }, status: "active" }
  });

  const duration = Date.now() - start;
  trackQueryPerformance(`getSubscriptionsForUsers(${userIds.length})`, duration);

  return subscriptions;
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

/**
 * Database connectivity health check
 */
export async function checkDatabaseHealth() {
  const start = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    return {
      healthy: true,
      duration,
      timestamp: new Date()
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { type: "database_health_check" }
    });
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date()
    };
  }
}

/**
 * Get database connection pool stats
 */
export async function getDatabaseStats() {
  // Implementation depends on database driver
  // This is a placeholder for monitoring
  return {
    timestamp: new Date(),
    // Add connection pool stats here
  };
}
