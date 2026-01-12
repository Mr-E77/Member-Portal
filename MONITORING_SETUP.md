# Monitoring & Observability Setup
**Phase 4: Performance & Monitoring - January 2026**

## Overview

This document outlines the comprehensive monitoring strategy including Sentry error tracking, uptime monitoring, performance dashboards, and real-time alerting.

---

## 🎯 Monitoring Goals

- ✅ 99.9% uptime SLA
- ✅ Error detection within seconds
- ✅ Performance tracking and alerts
- ✅ Real-time dashboards
- ✅ Incident response automation
- ✅ Post-incident analysis

---

## 📊 Monitoring Stack

| Service | Purpose | Status |
|---------|---------|--------|
| **Sentry** | Error tracking & performance monitoring | ✅ Configured |
| **UptimeRobot** | Uptime monitoring & alerts | 📋 Setup needed |
| **Grafana** | Metrics dashboard | 📋 Setup needed |
| **AlertManager** | Incident alerts | 📋 Setup needed |
| **LogRocket** | Session replay | 📋 Optional |

---

## 🛡️ Sentry Configuration

### 1. Already Implemented

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection({
      mode: "strict"
    })
  ],
  tracesSampleRate: 1.0,
  debug: false,
  environment: process.env.NODE_ENV,
  beforeSend(event, hint) {
    // Filter errors
    if (event.exception) {
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore network errors in development
        if (error.message.includes("Network") && process.env.NODE_ENV === "development") {
          return null;
        }
      }
    }
    return event;
  }
});

// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true
    })
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV
});
```

### 2. Enhanced Error Tracking

```typescript
// lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

export function captureError(
  error: Error,
  context?: Record<string, any>
) {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      type: error.constructor.name
    }
  });
}

export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" = "info",
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    extra: context
  });
}

export function addBreadcrumb(
  message: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    level: "info",
    data
  });
}

// Usage in API routes
export async function handleRequest(handler: Function) {
  try {
    return await handler();
  } catch (error) {
    captureError(error as Error, {
      handler: handler.name,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}
```

### 3. Performance Monitoring

```typescript
// lib/performance.ts
import * as Sentry from "@sentry/nextjs";

// Transaction tracking for API routes
export async function withPerformanceTracking(
  name: string,
  fn: () => Promise<any>
) {
  const transaction = Sentry.startTransaction({
    name,
    op: "http.server"
  });

  try {
    const result = await fn();
    transaction.setStatus("ok");
    return result;
  } catch (error) {
    transaction.setStatus("internal_error");
    throw error;
  } finally {
    transaction.finish();
  }
}

// Usage in API routes
export async function GET(request: Request) {
  return withPerformanceTracking("GET /api/user/profile", async () => {
    const session = await getSession();
    const profile = await db.user.findUnique({
      where: { id: session.user.id }
    });
    return NextResponse.json(profile);
  });
}
```

### 4. Custom Metrics

```typescript
// lib/metrics.ts
import * as Sentry from "@sentry/nextjs";

export function recordMetric(
  name: string,
  value: number,
  unit: string = "milliseconds"
) {
  Sentry.captureMessage(`Metric: ${name}`, {
    level: "info",
    tags: {
      metric: name,
      unit
    },
    extra: {
      value
    }
  });
}

// Database metrics
export async function recordQueryTime(
  query: string,
  duration: number
) {
  recordMetric(`db.${query}`, duration, "milliseconds");
  
  if (duration > 100) {
    captureMessage(`Slow query: ${query}`, "warning", {
      duration,
      query
    });
  }
}

// API metrics
export async function recordApiMetric(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number
) {
  recordMetric(`api.${method}.${endpoint}`, duration, "milliseconds");
  
  if (statusCode >= 500) {
    captureMessage(`Server error on ${method} ${endpoint}`, "error", {
      statusCode,
      duration
    });
  } else if (duration > 1000) {
    captureMessage(`Slow API call: ${method} ${endpoint}`, "warning", {
      duration,
      statusCode
    });
  }
}
```

---

## 📡 Uptime Monitoring

### UptimeRobot Setup

```bash
# Health check endpoints (already configured)
- GET /api/health (Portal app)
- GET /api/health (Studio app)

# Monitor response time and availability
Interval: Every 5 minutes
Timeout: 30 seconds
Expected HTTP code: 200 OK
```

### Health Check Endpoints

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check database connectivity
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
```

### Monitoring Rules

| Alert | Threshold | Action |
|-------|-----------|--------|
| Service Down | 2 consecutive failures | Page oncall |
| High Response Time | > 2 seconds | Warning email |
| High Error Rate | > 5% errors | PagerDuty alert |
| Database Error | Any error | Immediate alert |

---

## 📊 Performance Dashboard

### Grafana Dashboard (Optional)

```yaml
# docker-compose monitoring stack
version: '3'
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_storage:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"

volumes:
  grafana_storage:
```

### Dashboard Metrics to Track

1. **Application Health**
   - Error rate (per endpoint)
   - Response time (p50, p95, p99)
   - Request volume
   - Active sessions

2. **Database Performance**
   - Query execution time
   - Connection pool usage
   - Slow query count
   - Transaction rollback rate

3. **Infrastructure**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network bandwidth

4. **Business Metrics**
   - Sign-ups per day
   - Subscription changes
   - Revenue tracked
   - Active users

---

## 🚨 Alerting Strategy

### Alert Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: application
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      # Slow response times
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
        for: 5m
        annotations:
          summary: "Response time above 2 seconds"
          
      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        annotations:
          summary: "Service is down"
          
      # Database connection pool exhausted
      - alert: DbPoolExhausted
        expr: db_connection_pool_usage > 0.9
        for: 5m
        annotations:
          summary: "Database connection pool nearly exhausted"
```

### Alert Destinations

1. **Email** - All alerts
2. **PagerDuty** - Critical (P1) incidents
3. **Slack** - Warnings and info
4. **SMS** - Service down alerts

---

## 📈 Incident Response Procedures

### Severity Levels

| Level | Response Time | Resolution Time | Escalation |
|-------|---------------|-----------------|------------|
| **P1 - Critical** | 15 minutes | 1 hour | CEO, CTO |
| **P2 - High** | 1 hour | 4 hours | CTO, Engineering Lead |
| **P3 - Medium** | 4 hours | 24 hours | Engineering team |
| **P4 - Low** | 24 hours | 1 week | Backlog |

### Incident Workflow

```mermaid
Incident Detected
  ↓
Auto-Alert (Slack, Email, PagerDuty)
  ↓
Acknowledge Incident (< 15 min)
  ↓
Investigate & Mitigate
  ↓
Implement Fix
  ↓
Deploy & Monitor
  ↓
Post-Incident Review
  ↓
Root Cause Analysis
  ↓
Preventive Measures
```

### Post-Incident Review Template

```markdown
# Incident Report - [INCIDENT_ID]

## Summary
- Incident: [Description]
- Duration: [Start] to [End]
- Impact: [Users affected, Revenue lost, etc]
- Severity: [P1/P2/P3/P4]

## Timeline
- [HH:MM] Event triggered
- [HH:MM] Detected by monitoring
- [HH:MM] Alert received
- [HH:MM] Mitigation started
- [HH:MM] Service restored

## Root Cause
[Description of underlying cause]

## Immediate Action Items
- [ ] [Task]
- [ ] [Task]

## Prevention Measures
- [ ] [Future prevention]
- [ ] [Future prevention]

## Owners
- Incident Commander: [Name]
- Follow-up Owner: [Name]
- Review Date: [Date]
```

---

## 📋 Monitoring Checklist

### Setup Phase (Week 1)
- [ ] Sentry project created and configured
- [ ] Error tracking verified
- [ ] Performance monitoring enabled
- [ ] Custom metrics setup
- [ ] Session replay configured

### Uptime Phase (Week 2)
- [ ] UptimeRobot configured
- [ ] Health check endpoints created
- [ ] Alerting rules configured
- [ ] Notification channels setup
- [ ] Test alerts validated

### Dashboard Phase (Week 3)
- [ ] Grafana/monitoring dashboard created
- [ ] Key metrics configured
- [ ] Incident procedures documented
- [ ] Team trained on monitoring
- [ ] Runbook created

---

## 🔧 Environment Configuration

```env
# .env.production
SENTRY_DSN=https://[key]@sentry.io/[project]
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Uptime monitoring
HEALTH_CHECK_URL=https://app.example.com/api/health
```

---

## 📞 Escalation Contacts

| Role | Name | Contact | Available |
|------|------|---------|-----------|
| On-Call | [Name] | [Phone/Slack] | 24/7 |
| CTO | Emmanuel | [Contact] | Weekdays |
| Engineering Lead | [Name] | [Contact] | Weekdays |

---

## 📚 Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [UptimeRobot Docs](https://uptimerobot.com/api/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Incident Response Guide](https://www.atlassian.com/incident-management)

---

**Document Status:** Active - January 12, 2026  
**Next Update:** January 19, 2026
