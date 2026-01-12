// Database optimization guide and indexes

/*
 * DATABASE OPTIMIZATION STRATEGY
 * ==============================
 *
 * 1. INDEXES ADDED
 * ----------------
 * Already implemented in schema.prisma:
 * - User: email (unique index for fast lookups)
 * - Account: [provider, providerAccountId] (unique, OAuth lookups)
 * - Session: sessionToken (unique, auth)
 * - Subscription: userId, stripeSubscriptionId (webhook lookups)
 * - AdminActivityLog: adminId, targetUserId, createdAt (audit queries)
 * - AdminImpersonation: adminId, targetUserId (impersonation tracking)
 * - Notification: [userId, read] (unread notifications query)
 * - ApiToken: userId, token (token validation)
 *
 * 2. MISSING INDEXES TO ADD
 * -------------------------
 * These should be added to schema.prisma for better performance:
 */

// Add to User model:
// @@index([membershipTier]) - Filter users by tier
// @@index([stripeCustomerId]) - Stripe webhook lookups
// @@index([createdAt]) - Sort by signup date

// Add to Subscription model:
// @@index([status]) - Find active/past_due subscriptions
// @@index([renewalDate]) - Renewal reminders cron job
// @@index([userId, status]) - User's active subscription

// Add to ApiToken model:
// @@index([userId, expiresAt]) - Valid tokens for user
// @@index([lastUsedAt]) - Recently used tokens

/*
 * 3. QUERY OPTIMIZATION PATTERNS
 * ------------------------------
 */

// ✅ GOOD: Use select to limit fields
export const optimizedUserQuery = {
  where: { email: 'user@example.com' },
  select: {
    id: true,
    name: true,
    membershipTier: true,
    // Only select what you need
  },
};

// ❌ BAD: Fetch all fields
export const inefficientUserQuery = {
  where: { email: 'user@example.com' },
  // Returns everything including relations
};

// ✅ GOOD: Paginate large result sets
export const paginatedQuery = {
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
};

// ✅ GOOD: Use specific where clauses with indexed fields
export const indexedWhereClause = {
  where: {
    userId: 'specific-user-id', // Indexed
    status: 'active', // Should be indexed
  },
};

// ❌ BAD: Use OR conditions (slower, may not use indexes)
export const slowOrClause = {
  where: {
    OR: [{ email: 'x' }, { name: 'y' }],
  },
};

/*
 * 4. CONNECTION POOLING
 * ---------------------
 * Prisma handles connection pooling automatically, but you can configure:
 *
 * DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=20"
 *
 * Recommended limits:
 * - Development: 10
 * - Production: 20-50 (depends on server resources)
 * - Serverless: 1-5 per function
 */

/*
 * 5. CACHING STRATEGY
 * -------------------
 * Already implemented in lib/cache.ts
 *
 * Cache these expensive queries:
 * - User profile (5 min TTL)
 * - Subscription status (1 min TTL)
 * - Admin stats (10 min TTL)
 * - Tier configuration (1 hour TTL)
 *
 * Don't cache:
 * - Authentication checks
 * - Payment webhooks
 * - Write operations
 */

// Example: Cache user profile
import { cacheWrapper } from '@/lib/cache';

export async function getCachedUserProfile(userId: string) {
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
        },
      });
    },
    5 * 60 * 1000 // 5 minutes
  );
}

/*
 * 6. BATCH OPERATIONS
 * -------------------
 */

// ✅ GOOD: Batch create/update
export async function batchCreateNotifications(
  userIds: string[],
  message: string
) {
  return await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      subject: 'Bulk Notification',
      message,
    })),
    skipDuplicates: true,
  });
}

// ❌ BAD: Individual creates in loop
export async function slowBatchCreate(userIds: string[], message: string) {
  for (const userId of userIds) {
    await prisma.notification.create({
      data: { userId, subject: 'Bulk Notification', message },
    });
  }
}

/*
 * 7. N+1 QUERY PREVENTION
 * -----------------------
 */

// ✅ GOOD: Include relations in single query
export async function getUsersWithSubscriptions() {
  return await prisma.user.findMany({
    include: {
      subscriptions: {
        where: { status: 'active' },
      },
    },
  });
}

// ❌ BAD: Fetch relations in loop (N+1)
export async function slowGetUsersWithSubscriptions() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    user.subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
    });
  }
}

/*
 * 8. MONITORING QUERIES
 * ---------------------
 */

// Slow query monitoring (add to your API routes)
export async function monitorSlowQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  const result = await queryFn();
  const duration = Date.now() - start;

  if (duration > 1000) {
    // > 1 second
    console.warn(`Slow query: ${queryName} took ${duration}ms`);
    // Send to monitoring service
  }

  return result;
}

/*
 * 9. PREPARED STATEMENTS
 * ----------------------
 * Prisma automatically uses prepared statements for security and performance
 */

/*
 * 10. VACUUM AND MAINTENANCE
 * --------------------------
 * Run these periodically in production:
 *
 * -- Analyze tables for query planner
 * ANALYZE;
 *
 * -- Vacuum to reclaim space
 * VACUUM ANALYZE;
 *
 * -- Check table sizes
 * SELECT schemaname, tablename,
 *   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
 * FROM pg_tables
 * WHERE schemaname = 'public'
 * ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
 *
 * -- Check index usage
 * SELECT schemaname, tablename, indexname, idx_scan
 * FROM pg_stat_user_indexes
 * ORDER BY idx_scan ASC;
 */

export const DATABASE_OPTIMIZATION_CHECKLIST = {
  indexes: {
    status: 'Partially implemented',
    action: 'Add missing indexes to schema.prisma',
    priority: 'HIGH',
  },
  connectionPooling: {
    status: 'Auto-configured by Prisma',
    action: 'Set connection_limit in DATABASE_URL',
    priority: 'MEDIUM',
  },
  caching: {
    status: 'Implemented in lib/cache.ts',
    action: 'Apply to expensive queries',
    priority: 'HIGH',
  },
  queryOptimization: {
    status: 'Follow patterns in this file',
    action: 'Review all API routes',
    priority: 'MEDIUM',
  },
  batchOperations: {
    status: 'Implemented in bulk actions',
    action: 'Use createMany/updateMany where possible',
    priority: 'MEDIUM',
  },
  monitoring: {
    status: 'Sentry configured',
    action: 'Add slow query logging',
    priority: 'LOW',
  },
} as const;
