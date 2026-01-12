# Performance Optimization & Database Strategy
**Phase 4: Performance & Monitoring - January 2026**

## Overview

This document outlines the comprehensive performance optimization strategy for the Member Portal platform, covering database query optimization, caching strategies, and performance monitoring.

---

## 🎯 Performance Goals

- ✅ Page load time: < 2 seconds (FCP < 2s, LCP < 2.5s)
- ✅ API response time: < 200ms (p95)
- ✅ Database query time: < 50ms (p95)
- ✅ Zero N+1 queries
- ✅ Cache hit rate: > 80%
- ✅ Lighthouse score: > 90
- ✅ Core Web Vitals: All green

---

## 📊 Current Performance Baseline

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| FCP (First Contentful Paint) | 2.0s | 1.5s | 🟡 Acceptable |
| LCP (Largest Contentful Paint) | 2.5s | 2.0s | 🟡 Acceptable |
| CLS (Cumulative Layout Shift) | 0.05 | < 0.1 | ✅ Good |
| TBT (Total Blocking Time) | < 50ms | < 50ms | ✅ Good |
| TTFB (Time to First Byte) | 200ms | 100ms | 🟡 Acceptable |

---

## 🗄️ Database Optimization Strategy

### 1. Query Optimization

#### Current Issues to Address
```typescript
// ❌ BAD: N+1 query problem
const users = await db.user.findMany();
for (const user of users) {
  // This runs a query for EACH user
  const profile = await db.profile.findUnique({
    where: { userId: user.id }
  });
}

// ✅ GOOD: Use relations
const users = await db.user.findMany({
  include: {
    profile: true,      // Single query with JOIN
    subscriptions: true // Include all related data
  }
});
```

#### Optimization Tasks

**Task 1.1: Add Database Indexes**
```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique  // Already indexed
  @@index([createdAt])          // Add timestamp index
  @@index([tier])               // Add tier index
  @@index([status])             // Add status index
}

model Profile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Add composite indexes for common queries
  @@index([userId, createdAt])
}

model ApiToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}

model Subscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeId  String   @unique
  status    String
  
  @@index([userId])
  @@index([stripeId])
  @@index([status])
}
```

**Task 1.2: Optimize Common Queries**
```typescript
// lib/queries.ts - Optimized query library

// Get user with all relations (1 query instead of 5)
export async function getUserWithRelations(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 5 // Limit to recent subscriptions
      },
      apiTokens: {
        where: { expiresAt: { gt: new Date() } }, // Only valid tokens
        select: {
          id: true,
          name: true,
          createdAt: true,
          lastUsedAt: true
        }
      },
      activityLog: {
        orderBy: { createdAt: 'desc' },
        take: 10 // Recent activity only
      }
    }
  });
}

// List users with pagination (avoid loading all)
export async function listUsers(page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit;
  
  return Promise.all([
    db.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        tier: true,
        status: true,
        createdAt: true,
        profile: { select: { name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    db.user.count() // Get total for pagination
  ]);
}

// Get user dashboard data efficiently
export async function getDashboardData(userId: string) {
  const [user, subscriptions, tokens, recentActivity] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        tier: true,
        profile: { select: { name: true, avatar: true } }
      }
    }),
    db.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),
    db.apiToken.count({
      where: { userId, expiresAt: { gt: new Date() } }
    }),
    db.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ]);

  return { user, subscriptions, tokens, recentActivity };
}
```

**Task 1.3: Add Query Result Caching**
```typescript
// lib/cache.ts - Simple in-memory cache
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes default

export async function cachedQuery<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached) {
    console.log(`Cache hit: ${key}`);
    return cached;
  }

  const result = await fn();
  cache.set(key, result, ttl);
  return result;
}

// Usage in queries
export async function getUserWithCache(userId: string) {
  return cachedQuery(
    `user:${userId}`,
    () => getUserWithRelations(userId),
    600 // 10 minutes
  );
}

export async function invalidateUserCache(userId: string) {
  cache.del(`user:${userId}`);
  cache.del(`dashboard:${userId}`);
}
```

### 2. Connection Pooling Configuration

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add pool configuration for production
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["tracing"]
}
```

```env
# .env.production
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require&pgbouncer=true"

# Connection pool settings (use PgBouncer)
# Max connections: 50
# Min connections: 5
# Connection timeout: 30s
```

### 3. Query Performance Monitoring

```typescript
// lib/db.ts - Add query logging
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Log slow queries (> 100ms)
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  if (after - before > 100) {
    console.warn(`[SLOW QUERY] ${params.model}.${params.action} took ${after - before}ms`);
    Sentry.captureMessage('Slow database query detected', {
      level: 'warning',
      extra: {
        model: params.model,
        action: params.action,
        duration: after - before
      }
    });
  }
  
  return result;
});

export default prisma;
```

---

## 💾 Caching Strategy

### Cache Layers

```
Request
  ↓
Browser Cache (images, CSS, JS)
  ↓
CDN Cache (Vercel CDN, CloudFlare)
  ↓
In-Memory Cache (Node-Cache, Redis)
  ↓
Database
```

### 1. Browser Caching

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  // ... metadata config
};

// Set cache headers in middleware
middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Cache static assets for 1 year
  if (request.nextUrl.pathname.match(/\.(css|js|woff2|png|jpg|svg)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Cache API responses for 5 minutes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  }
  
  return response;
}
```

### 2. In-Memory Caching

```typescript
// lib/cache.ts
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300,        // 5 minutes default
  checkperiod: 60,    // Check for expired keys every 60s
  useClones: false    // Performance improvement
});

export const cacheKeys = {
  // User data
  user: (id: string) => `user:${id}`,
  userDashboard: (id: string) => `dashboard:${id}`,
  
  // Lists
  usersList: (page: number) => `users:list:${page}`,
  
  // Admin
  adminStats: () => 'admin:stats',
  adminActivityLog: (page: number) => `admin:activity:${page}`,
  
  // Config
  portalConfig: (id: string) => `config:${id}`
};

// Cache invalidation helpers
export function invalidateUser(userId: string) {
  cache.del(cacheKeys.user(userId));
  cache.del(cacheKeys.userDashboard(userId));
}

export function invalidateUsersList() {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.startsWith('users:list:')) {
      cache.del(key);
    }
  });
}

export function invalidateAdminCache() {
  cache.del(cacheKeys.adminStats());
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.startsWith('admin:')) {
      cache.del(key);
    }
  });
}
```

### 3. API Response Caching

```typescript
// app/api/user/profile/route.ts
import { cachedQuery, cacheKeys, invalidateUser } from '@/lib/cache';

export async function GET(request: Request) {
  const session = await getSession();
  
  const profile = await cachedQuery(
    cacheKeys.userDashboard(session.user.id),
    () => getDashboardData(session.user.id),
    600 // 10 minutes
  );
  
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  const data = await request.json();
  
  // Update user
  const updated = await db.user.update({
    where: { id: session.user.id },
    data
  });
  
  // Invalidate cache
  invalidateUser(session.user.id);
  
  return NextResponse.json(updated);
}
```

---

## 📈 Performance Monitoring

### 1. Lighthouse CI Integration

```json
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/campus",
        "http://localhost:3000/dashboard"
      ],
      "numberOfRuns": 3,
      "settings": {
        "configPath": "./lighthouse.config.js"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.90 }],
        "categories:accessibility": ["error", { "minScore": 0.90 }],
        "categories:best-practices": ["error", { "minScore": 0.90 }],
        "categories:seo": ["error", { "minScore": 0.90 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 50 }]
      }
    }
  }
}
```

### 2. Web Vitals Tracking

```typescript
// lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { sendToAnalytics } from '@/lib/analytics';

export function initWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

// Send to Sentry
function sendToAnalytics(metric: any) {
  Sentry.captureMessage('Web Vitals', {
    level: 'info',
    tags: {
      'metric.name': metric.name,
      'metric.rating': metric.rating
    },
    measurements: {
      [metric.name]: { value: metric.value }
    }
  });
}
```

### 3. Database Performance Tracking

```typescript
// Monitor slow queries and generate alerts
// lib/db-monitor.ts

export async function monitorDatabasePerformance() {
  const slowQueryThreshold = 100; // ms
  
  // Log slow queries
  db.$use(async (params, next) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;
    
    if (duration > slowQueryThreshold) {
      Sentry.captureMessage('Slow database query', {
        level: 'warning',
        extra: {
          model: params.model,
          action: params.action,
          duration
        }
      });
    }
    
    return result;
  });
}
```

---

## 🚀 Implementation Checklist

### Week 1: Database Optimization (Jan 13-19)
- [ ] Add database indexes
- [ ] Optimize N+1 queries
- [ ] Implement connection pooling
- [ ] Deploy migrations
- [ ] Test query performance

### Week 2: Caching Layer (Jan 20-26)
- [ ] Implement in-memory cache
- [ ] Add HTTP cache headers
- [ ] Cache API responses
- [ ] Setup cache invalidation
- [ ] Monitor cache effectiveness

### Week 3: Performance Monitoring (Jan 27-Feb 2)
- [ ] Deploy Lighthouse CI
- [ ] Setup Web Vitals tracking
- [ ] Configure performance alerts
- [ ] Create monitoring dashboard
- [ ] Validate all targets met

---

## 📊 Success Metrics

| Metric | Target | Acceptance |
|--------|--------|-----------|
| First Contentful Paint | < 1.5s | 🟢 Good |
| Largest Contentful Paint | < 2.0s | 🟢 Good |
| Cumulative Layout Shift | < 0.1 | 🟢 Good |
| Lighthouse Score | > 90 | 🟢 Good |
| API Response Time (p95) | < 200ms | 🟢 Good |
| Database Query Time (p95) | < 50ms | 🟢 Good |
| Cache Hit Rate | > 80% | 🟢 Good |

---

**Document Status:** Active - January 12, 2026  
**Next Update:** January 19, 2026
