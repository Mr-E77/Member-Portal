# Phase 4 Integration Guide: Performance & Monitoring System

## Overview

This guide explains how to integrate the three Phase 4 components:
1. **Cache Layer** (`lib/cache-layer.ts`) - In-memory caching with invalidation
2. **Health Checks** (`api/health/advanced/route.ts`) - System observability
3. **Sentry Enhanced** (`lib/sentry-enhanced.ts`) - Performance & error tracking

## Integration Architecture

```
User Request
    ↓
Health Check Middleware (optional)
    ↓
Sentry Transaction Start
    ↓
Try Cache Layer
    ├─ HIT → Return from cache + recordMetric
    └─ MISS → Query DB + setCached + track performance
    ↓
Record Metrics to Sentry
    ├─ Response time
    ├─ Database duration
    ├─ Cache hit/miss
    └─ Error tracking
    ↓
Response
```

## Step 1: Update queries-optimized.ts with Caching

```typescript
import { cachedQuery, invalidateUserCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache-layer';
import { trackDatabaseQuery, recordMetric } from '@/lib/sentry-enhanced';

export async function getUserDashboard(userId: string) {
  return cachedQuery(
    CACHE_KEYS.userDashboard(userId),
    async () => {
      const start = Date.now();
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          subscriptions: { where: { status: { in: ["active", "past_due"] } } },
          apiTokens: { where: { expiresAt: { gt: new Date() } } }
        }
      });
      
      const duration = Date.now() - start;
      trackDatabaseQuery('getUserDashboard', duration, 1);
      
      return user;
    },
    CACHE_TTL.MEDIUM
  );
}
```

## Step 2: Update API Routes with Health & Performance Tracking

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { startTransaction, trackApiEndpoint } from '@/lib/sentry-enhanced';
import { recordRequest } from '@/app/api/health/advanced/route';

export async function GET(request: NextRequest) {
  const transaction = startTransaction('GET /api/users', 'http.request');
  const start = Date.now();
  
  try {
    const users = await listUsersEfficient(1, 10);
    const duration = Date.now() - start;
    
    trackApiEndpoint('GET', '/api/users', 200, duration);
    recordRequest(duration, false);
    
    return NextResponse.json(users);
  } catch (error) {
    const duration = Date.now() - start;
    trackApiEndpoint('GET', '/api/users', 500, duration);
    recordRequest(duration, true);
    
    throw error;
  } finally {
    transaction?.end();
  }
}
```

## Step 3: Invalidate Cache on Data Changes

```typescript
import { invalidateUserCache, invalidateAdminCache } from '@/lib/cache-layer';
import { setSentryUser } from '@/lib/sentry-enhanced';

// When user is updated
export async function updateUser(userId: string, data: any) {
  const user = await db.user.update({
    where: { id: userId },
    data
  });
  
  // Invalidate caches
  invalidateUserCache(userId);
  invalidateAdminCache();
  
  // Track in Sentry
  setSentryUser(userId, user.email, user.username);
  
  return user;
}
```

## Step 4: Add Health Check Prewarm

```typescript
// In app.ts or middleware.ts
import { prewarmCache } from '@/lib/cache-layer';
import { getUserDashboard, getAdminDashboardStats } from '@/lib/queries-optimized';

export async function warmCache() {
  await prewarmCache(async () => {
    // Prewarm frequently accessed data
    const adminId = process.env.ADMIN_USER_ID;
    if (adminId) {
      await getUserDashboard(adminId);
      await getAdminDashboardStats();
    }
  });
}
```

## Step 5: Monitor Health Regularly

```typescript
// In lib/monitoring.ts
import { logCacheStats } from '@/lib/cache-layer';
import { reportHealthCheck } from '@/lib/sentry-enhanced';

export function setupMonitoring() {
  // Log cache stats every minute
  setInterval(() => {
    logCacheStats();
  }, 60000);
  
  // Report health every 5 minutes
  setInterval(async () => {
    const response = await fetch('/api/health/advanced');
    const health = await response.json();
    reportHealthCheck(health);
  }, 300000);
}
```

## Configuration Checklist

### Environment Variables
```bash
# .env.local
SENTRY_DSN=your_sentry_dsn
SENTRY_RELEASE=0.1.0
SENTRY_ENABLED=true
NODE_ENV=production

# Cache settings (optional)
CACHE_TTL_SHORT=60
CACHE_TTL_MEDIUM=300
CACHE_TTL_LONG=600
```

### UptimeRobot Configuration
```
Service: Member Portal
URL: https://your-domain.com/api/health
Check Interval: 5 minutes
Expected HTTP Status: 200
Timeout: 30 seconds
Notifications: Email, Slack, PagerDuty
```

### Lighthouse CI Configuration
Update `.lighthouserc.json`:
```json
{
  "ci": {
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 1500}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    }
  }
}
```

## Monitoring Dashboard Example

### Grafana Dashboard (if using Prometheus)

**Panels to Add:**

1. **Cache Hit Rate**
   - Query: `rate(cache_hits[5m]) / rate(cache_total[5m])`
   - Alert: < 70%

2. **Database Query Duration**
   - Query: `histogram_quantile(0.95, db_query_duration_seconds)`
   - Alert: > 500ms

3. **API Response Time**
   - Query: `histogram_quantile(0.95, http_request_duration_seconds)`
   - Alert: > 1000ms

4. **Error Rate**
   - Query: `rate(errors_total[5m])`
   - Alert: > 0.05

5. **Active Connections**
   - Query: `pg_stat_activity_count{state="active"}`
   - Alert: > 90% of max_connections

## Troubleshooting

### Cache Not Working
```bash
# Check cache stats
curl https://your-domain.com/api/health/advanced

# Should show hitRate > 0
```

### Database Slow Queries
```bash
# Check slow query logs
tail -f /var/log/postgresql/slow_query.log

# Should see nothing if optimization working
```

### Sentry Not Receiving Data
```bash
# Test Sentry DSN
curl -X POST https://[key]@sentry.io/[projectId]/envelope/ \
  -H "Content-Type: application/x-sentry-envelope" \
  -d '...'
```

### Memory Leaks
```bash
# Monitor from health endpoint
curl https://your-domain.com/api/health/advanced

# Memory percentage should stay < 80%
```

## Performance Targets

| Metric | Target | Alert |
|--------|--------|-------|
| Cache Hit Rate | > 75% | < 70% |
| API Response (p95) | < 500ms | > 1000ms |
| Database Query (p95) | < 250ms | > 500ms |
| Heap Memory | < 70% | > 80% |
| Error Rate | < 0.1% | > 0.5% |
| Uptime | > 99.9% | < 99.5% |

## Next Steps

1. **Deploy database migration** - Run `prisma migrate deploy`
2. **Test locally** - Verify all components working
3. **Deploy to staging** - Test in production-like environment
4. **Monitor metrics** - Watch for improvements
5. **Optimize further** - Adjust TTLs based on actual usage
6. **Document results** - Record performance improvements

## Files Summary

| File | Purpose | When to Use |
|------|---------|------------|
| `cache-layer.ts` | In-memory caching | Before every database query |
| `sentry-enhanced.ts` | Performance tracking | In every API route |
| `health/advanced/route.ts` | System monitoring | Uptime monitoring, status pages |
| `queries-optimized.ts` | Efficient queries | All database access |

## Resources

- [Sentry Docs](https://docs.sentry.io/)
- [Node-Cache Docs](https://www.npmjs.com/package/node-cache)
- [Prisma Optimization](https://www.prisma.io/docs/guides/performance-and-optimization)
- [UptimeRobot Setup](https://uptimerobot.com/help/dashboard/apis)
