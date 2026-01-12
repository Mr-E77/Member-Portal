/**
 * Enhanced Sentry Configuration for Performance & Error Monitoring
 * Phase 4 Performance & Monitoring
 */

import * as Sentry from "@sentry/nextjs";
import { ProfilingIntegration } from "@sentry/profiling-node";

const ENVIRONMENT = process.env.NODE_ENV || "development";
const IS_PRODUCTION = ENVIRONMENT === "production";

Sentry.init({
  // ======================================================================
  // CORE CONFIGURATION
  // ======================================================================
  
  dsn: process.env.SENTRY_DSN,
  environment: ENVIRONMENT,
  enabled: IS_PRODUCTION || process.env.SENTRY_ENABLED === "true",

  // ======================================================================
  // PERFORMANCE MONITORING
  // ======================================================================
  
  // Capture 100% of transactions in production for comprehensive monitoring
  tracesSampleRate: IS_PRODUCTION ? 1.0 : 0.1,
  
  // Profile all transactions for performance insights
  profilesSampleRate: IS_PRODUCTION ? 0.1 : 0,
  
  // Track database queries and external APIs
  trackBreadcrumbs: true,
  maxBreadcrumbs: 100,

  // ======================================================================
  // ERROR TRACKING
  // ======================================================================
  
  // Only capture errors in production + test env
  beforeSend(event, hint) {
    if (!IS_PRODUCTION && ENVIRONMENT !== "test") {
      return null;
    }

    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Skip 404 errors in API routes
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }

      // Skip aborted request errors
      if (error instanceof Error && error.message.includes("AbortError")) {
        return null;
      }

      // Skip network timeout errors from external APIs
      if (error instanceof Error && error.message.includes("timeout")) {
        return null;
      }
    }

    return event;
  },

  // ======================================================================
  // INTEGRATIONS
  // ======================================================================
  
  integrations: [
    // Profiling for performance insights
    new ProfilingIntegration(),
    
    // HTTP client monitoring
    new Sentry.Integrations.Http({ tracing: true }),
    
    // Database monitoring
    new Sentry.Integrations.Postgres({ 
      usePreparedStatements: true 
    }),
    
    // Capture unhandled promise rejections
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection({ mode: "strict" }),
    
    // Node.js specific
    new Sentry.Integrations.NodeFetch(),
    new Sentry.Integrations.RequestData({
      include: {
        cookies: true,
        headers: true,
        query_string: true,
        url: true
      }
    })
  ],

  // ======================================================================
  // CUSTOM CONTEXT & METADATA
  // ======================================================================
  
  initialScope: {
    tags: {
      service: "member-portal",
      version: "0.1.0"
    },
    level: "info"
  },

  // ======================================================================
  // RELEASE TRACKING
  // ======================================================================
  
  release: process.env.SENTRY_RELEASE || "0.1.0",
  dist: process.env.VERCEL_ENV || "development",

  // ======================================================================
  // ATTACHMENT OPTIONS
  // ======================================================================
  
  attachStacktrace: true,
  sendDefaultPii: false, // Never send PII by default
  includeLocalVariables: IS_PRODUCTION ? false : true,

  // ======================================================================
  // IGNORE PATTERNS
  // ======================================================================
  
  ignoreErrors: [
    // Browser extensions
    "extension://",
    "moz-extension://",
    
    // Network errors from clients
    "NetworkError",
    "NetworkingError",
    "net::ERR_INTERNET_DISCONNECTED",
    
    // Common browser errors to ignore
    "ResizeObserver loop limit exceeded",
    "Script error",
    "Non-Error promise rejection captured"
  ]
});

// ============================================================================
// CUSTOM MONITORING FUNCTIONS
// ============================================================================

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  queryName: string,
  duration: number,
  rowCount: number = 0
) {
  const transaction = Sentry.getCurrentScope()?.getTransaction();
  if (transaction) {
    const span = transaction.startChild({
      op: "db.query",
      description: queryName,
      data: {
        duration,
        rowCount
      }
    });
    span.end();
  }

  // Alert if query is slow
  if (duration > 500) {
    Sentry.captureMessage(
      `Slow database query detected: ${queryName} took ${duration}ms`,
      "warning"
    );
  }

  // Add breadcrumb
  Sentry.addBreadcrumb({
    category: "database",
    message: `Query: ${queryName}`,
    level: "debug",
    data: {
      duration,
      rowCount
    }
  });
}

/**
 * Track API endpoint performance
 */
export function trackApiEndpoint(
  method: string,
  path: string,
  statusCode: number,
  duration: number
) {
  Sentry.addBreadcrumb({
    category: "api",
    message: `${method} ${path} - ${statusCode}`,
    level: statusCode >= 400 ? "warning" : "info",
    data: {
      method,
      path,
      statusCode,
      duration
    }
  });

  // Alert on errors
  if (statusCode >= 500) {
    Sentry.captureMessage(
      `API error: ${method} ${path} returned ${statusCode}`,
      "error"
    );
  }

  // Alert on slow endpoints
  if (duration > 1000) {
    Sentry.captureMessage(
      `Slow API endpoint: ${method} ${path} took ${duration}ms`,
      "warning"
    );
  }
}

/**
 * Track cache operations
 */
export function trackCacheOperation(
  operation: "hit" | "miss" | "set" | "delete",
  key: string,
  duration: number
) {
  Sentry.addBreadcrumb({
    category: "cache",
    message: `Cache ${operation}: ${key}`,
    level: "debug",
    data: {
      operation,
      key,
      duration
    }
  });
}

/**
 * Track external API calls
 */
export function trackExternalApi(
  service: string,
  method: string,
  statusCode: number,
  duration: number,
  error?: Error
) {
  if (error) {
    Sentry.captureException(error, {
      tags: {
        externalService: service,
        method
      },
      extra: {
        statusCode,
        duration
      }
    });
  } else {
    Sentry.addBreadcrumb({
      category: "external-api",
      message: `${service} ${method} - ${statusCode}`,
      level: statusCode >= 400 ? "warning" : "info",
      data: {
        service,
        method,
        statusCode,
        duration
      }
    });
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(
  userId: string,
  email?: string,
  username?: string
) {
  Sentry.setUser({
    id: userId,
    email,
    username
  });
}

/**
 * Clear user context
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add custom context data
 */
export function setSentryContext(
  contextName: string,
  data: Record<string, any>
) {
  Sentry.setContext(contextName, data);
}

/**
 * Record custom metric
 */
export function recordMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
) {
  try {
    const client = Sentry.getClient();
    if (client && client.captureMessage) {
      Sentry.addBreadcrumb({
        category: "metric",
        message: `${name}: ${value}`,
        level: "debug",
        data: {
          metric: name,
          value,
          tags
        }
      });
    }
  } catch (error) {
    console.error("Failed to record metric:", error);
  }
}

/**
 * Start performance transaction
 */
export function startTransaction(name: string, op: string = "http.request") {
  return Sentry.startTransaction({
    name,
    op
  });
}

/**
 * Capture custom error
 */
export function captureError(
  error: Error,
  level: "fatal" | "error" | "warning" | "info" = "error",
  tags?: Record<string, string>,
  extra?: Record<string, any>
) {
  Sentry.captureException(error, {
    level,
    tags,
    extra
  });
}

// ============================================================================
// HEALTH CHECK INTEGRATION
// ============================================================================

/**
 * Report health check results to Sentry
 */
export function reportHealthCheck(health: {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, any>;
  metrics: Record<string, any>;
}) {
  if (health.status === "unhealthy") {
    Sentry.captureMessage(
      `System health check failed: ${JSON.stringify(health.checks)}`,
      "error"
    );
  } else if (health.status === "degraded") {
    Sentry.captureMessage(
      `System health degraded: ${JSON.stringify(health.checks)}`,
      "warning"
    );
  }

  // Record metrics
  setSentryContext("health", health);
}

export default Sentry;
