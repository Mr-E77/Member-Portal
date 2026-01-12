# Monitoring & Observability

Complete guide for monitoring the Member Portal platform with Sentry error tracking, uptime checks, and performance monitoring.

## Table of Contents

- [Overview](#overview)
- [Sentry Setup](#sentry-setup)
- [Error Tracking](#error-tracking)
- [Uptime Monitoring](#uptime-monitoring)
- [Performance Monitoring](#performance-monitoring)
- [Local Development](#local-development)
- [Troubleshooting](#troubleshooting)

## Overview

### What We Monitor

- **Errors & Exceptions**: Server and client-side errors with stack traces
- **Performance**: API response times, database queries, transactions
- **Uptime**: Health check endpoints for availability monitoring
- **User Context**: User ID, email, and action breadcrumbs
- **Session Replays**: Visual recording of user sessions (on errors only)

### Architecture

```
┌─────────────────────────────────────────────────────┐
│           Member Portal Infrastructure              │
├─────────────────────────────────────────────────────┤
│  Portal & Studio Apps (Next.js 16)                  │
│  ├─ Error Boundary (client)                         │
│  ├─ Global Error Handler (server)                   │
│  ├─ Health Check Endpoint (/api/health)             │
│  └─ Sentry Integration (@sentry/nextjs)             │
└────────┬────────────────────────────┬───────────────┘
         │                            │
    ┌────▼─────┐          ┌──────────▼──────┐
    │  Sentry  │          │  UptimeRobot    │
    │  DSN     │          │  (3rd party)    │
    │          │          │                 │
    │ Errors   │          │ GET /api/health │
    │ & Traces │          │ Polling every   │
    │          │          │ 5 mins          │
    └──────────┘          └─────────────────┘
        │
    ┌───▼──────────────┐
    │ Sentry Dashboard │
    ├──────────────────┤
    │ - Errors list    │
    │ - Performance    │
    │ - Replays        │
    │ - Alerts         │
    └──────────────────┘
```

## Sentry Setup

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up (GitHub/email)
3. Create organization
4. Create projects:
   - **member-portal** (portal app)
   - **design-studio** (studio app)

### 2. Get DSN Keys

For each project:
1. Settings → Projects → [Project Name] → Client Keys (DSN)
2. Copy the DSN (looks like: `https://key@org.ingest.sentry.io/123456`)

### 3. Add Environment Variables

**Portal (.env.local or Vercel dashboard):**
```bash
# Client-side (public, used in browser)
NEXT_PUBLIC_SENTRY_DSN="https://key@org.ingest.sentry.io/123456"

# Server-side (private, used in Node.js)
SENTRY_DSN="https://key@org.ingest.sentry.io/123456"

# Sentry Auth Token (for source maps upload in CI)
SENTRY_AUTH_TOKEN="your-auth-token"
```

**Studio (.env.local or Vercel dashboard):**
```bash
NEXT_PUBLIC_SENTRY_DSN="https://key@org.ingest.sentry.io/789012"
SENTRY_DSN="https://key@org.ingest.sentry.io/789012"
SENTRY_AUTH_TOKEN="your-auth-token"
```

**How to get SENTRY_AUTH_TOKEN:**
1. Sentry → Settings → Auth Tokens
2. Create new token with `project:releases` and `project:write` scopes
3. Copy and store securely

### 4. Verify Setup

```bash
# Start dev server
npm run dev:portal

# Trigger test error
# Visit: http://localhost:3000/error (if you add this route)
# Check Sentry dashboard for captured error
```

## Error Tracking

### Automatic Error Capture

Errors are automatically captured in the following scenarios:

1. **Unhandled Exceptions**: Server and client crashes
2. **API Errors**: Failed routes return errors with context
3. **React Errors**: Component errors caught by Error Boundary
4. **Network Errors**: Failed fetch/axios requests
5. **Console Errors**: `console.error()` statements in production

### Manual Error Capture

```typescript
import { captureException, captureMessage } from '@/lib/sentry';

// Capture exception
try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    operation: 'riskyOperation',
    userId: session?.user?.id,
  });
}

// Capture message
if (unexpectedCondition) {
  captureMessage('Unexpected condition detected', 'warning');
}
```

### Set User Context

When user authenticates:

```typescript
import { setUser } from '@/lib/sentry';
import { useSession } from 'next-auth/react';

export function Layout() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      setUser(session.user.id, session.user.email);
    }
  }, [session]);

  // ...
}
```

### Add Breadcrumbs (Actions)

Track user actions leading to errors:

```typescript
import { addBreadcrumb } from '@/lib/sentry';

function handleUpgrade() {
  addBreadcrumb('User clicked upgrade button', 'user-action', 'info');
  
  try {
    await upgradeUser();
    addBreadcrumb('Upgrade successful', 'user-action', 'info');
  } catch (error) {
    addBreadcrumb('Upgrade failed', 'user-action', 'error');
    throw error;
  }
}
```

### Error Boundary (Client-Side)

Wraps components to catch React rendering errors:

```typescript
'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';

export function Page() {
  return (
    <ErrorBoundary>
      <RiskyComponent />
    </ErrorBoundary>
  );
}
```

Fallback UI shows error message and reload button. Error automatically sent to Sentry.

## Uptime Monitoring

### Health Check Endpoints

Both apps expose health checks:

**Portal:**
```
GET https://portal.yourdomain.com/api/health
```

**Studio:**
```
GET https://studio.yourdomain.com/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-12T10:30:00.000Z",
  "service": "member-portal",
  "version": "0.1.0"
}
```

### Set Up UptimeRobot (Recommended)

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up (free tier is fine)
3. Create monitors:
   - **Portal Monitor**
     - URL: `https://portal.yourdomain.com/api/health`
     - Interval: 5 minutes
     - Timeout: 30 seconds
   
   - **Studio Monitor**
     - URL: `https://studio.yourdomain.com/api/health`
     - Interval: 5 minutes
     - Timeout: 30 seconds

4. Configure alerts:
   - Email notification on down
   - Slack notification (if available)

### Alternative: Healthchecks.io

1. Go to [healthchecks.io](https://healthchecks.io)
2. Create checks for both endpoints
3. Set up integrations (Slack, Discord, PagerDuty)

### Local Testing

```bash
# Test portal health check
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"...","service":"member-portal"}

# Test studio health check
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"...","service":"design-studio"}
```

## Performance Monitoring

### Automatic Performance Tracking

Sentry automatically tracks:

- **Transactions**: API routes, page loads, navigation
- **Spans**: Database queries, external API calls, cache operations
- **Slow Transactions**: Flagged when > configured threshold

### View Performance Data

1. Sentry Dashboard → Performance
2. See transaction breakdown by endpoint
3. Identify slow routes/operations
4. Click transaction for detailed spans

### Performance Alerts

Configure in Sentry → Alerts:

```
Alert Rule: Transaction Duration
├─ When: avg(http.server_duration) > 500ms
├─ For: last 10 minutes
└─ Action: Notify Slack channel
```

### Sampling (Production)

To avoid overload, we sample traces:

- **Development**: 100% of transactions (all recorded)
- **Production**: 10% of transactions (1 in 10)

Adjust in `sentry.*.config.ts`:

```typescript
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
```

## Local Development

### Running Locally

```bash
# Start portal with Sentry
npm run dev:portal

# Sentry will use NEXT_PUBLIC_SENTRY_DSN from .env.local
# Errors are sent to your Sentry project
```

### Testing Error Capture

Create a test route to verify Sentry:

```typescript
// apps/portal/src/app/api/test-error/route.ts
export async function GET() {
  throw new Error('Test error for Sentry');
}
```

Visit `http://localhost:3000/api/test-error` and check:
1. Sentry dashboard for error
2. Timestamp and stack trace
3. Breadcrumbs if added

### Disable Sentry Locally (Optional)

If you want to skip Sentry in local dev:

```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN=""  # Empty = Sentry disabled
```

## Production Configuration

### Environment Variables on Vercel

1. Vercel Dashboard → member-portal → Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_SENTRY_DSN = https://...
   SENTRY_DSN = https://...
   SENTRY_AUTH_TOKEN = your-token
   ```
3. Repeat for design-studio project

### Source Maps Upload (CI)

Source maps are automatically uploaded during build if `SENTRY_AUTH_TOKEN` is set.

Check in Sentry → Project Settings → Source Maps to verify upload.

### Replay Privacy

Session replays capture user interactions. Sensitive data is masked:

- Password inputs: `●●●●●●●`
- Credit card fields: `●●●●●●●●●●●●●●`
- Text in input[type=password]: masked

Configure in `sentry.client.config.ts`:

```typescript
integrations: [
  new Sentry.Replay({
    maskAllText: true,    // Mask all text
    blockAllMedia: true,  // Don't capture images/videos
  }),
],
```

## Monitoring Dashboard

### Key Metrics to Watch

1. **Error Rate**: Errors per minute
2. **P95 Response Time**: 95th percentile latency
3. **Apdex**: User satisfaction (ratio of good vs tolerable responses)
4. **Session Replay**: Videos of error sessions

### Setting Alerts

**Critical (page to immediately):**
- Error rate > 5%
- P95 response time > 2s

**Warning (review within 1 hour):**
- Error rate > 1%
- New error type

**Info (daily digest):**
- Performance trends
- New users experiencing errors

Set up in Sentry → Alerts → Create Alert Rule

## Troubleshooting

### Errors Not Appearing in Sentry

**Check 1: DSN is set**
```bash
# Verify environment variable
echo $NEXT_PUBLIC_SENTRY_DSN
# Should show: https://key@org.ingest.sentry.io/...
```

**Check 2: Sentry is initialized**
- Look for Sentry initialization logs in server console
- Check browser console for Sentry client init messages

**Check 3: Sentry isn't disabled**
```bash
# Make sure DSN is not empty
NEXT_PUBLIC_SENTRY_DSN=""  # ❌ Disabled
NEXT_PUBLIC_SENTRY_DSN="https://..." # ✅ Enabled
```

### Health Checks Not Responding

```bash
# Test endpoint directly
curl -v http://localhost:3000/api/health

# If 404: Route file not created at:
# apps/portal/src/app/api/health/route.ts

# If 500: Check server logs for errors
```

### Session Replays Not Recording

**Check:**
1. Error occurred (replays only record on errors by default)
2. `replaysOnErrorSampleRate: 1.0` in config
3. Browser allows cookies/local storage

**Manually trigger replay recording:**
```typescript
import * as Sentry from '@sentry/nextjs';

// Force start recording
Sentry.getReplay()?.setIsEnabled(true);
```

## Performance Optimization

### Reduce Sentry Overhead

**1. Lower sample rate in production:**
```typescript
tracesSampleRate: 0.05  // 5% of traces
```

**2. Disable replay in low-value scenarios:**
```typescript
replaysSessionSampleRate: 0.01  // 1% of sessions
replaysOnErrorSampleRate: 0.5   // 50% of errors
```

**3. Ignore certain errors:**
```typescript
beforeSend(event, hint) {
  const error = hint.originalException;
  if (error?.message?.includes('ResizeObserver')) {
    return null; // Don't send
  }
  return event;
}
```

## Sentry Pricing

- **Free tier**: 5,000 errors/month, limited replay
- **Standard**: Pay-as-you-go after free quota
- **Business**: $29/mo + overages

For this project (development/small production): Free tier is sufficient.

## Support & Resources

- [Sentry Docs](https://docs.sentry.io)
- [Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry CLI](https://docs.sentry.io/product/cli/)
- [Error Reporting Best Practices](https://docs.sentry.io/platforms/javascript/enriching-events/)

---

**Next: Set up monitoring alerts in Slack/email, then proceed to next milestone (Payments or Visual Regression).**
