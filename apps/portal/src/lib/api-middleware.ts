/**
 * API Route Middleware for Caching & Monitoring
 * Automatically handles performance tracking and cache management
 * Phase 4 Performance & Monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { startTransaction, trackApiEndpoint, captureError } from '@/lib/sentry-enhanced';
import { recordRequest } from '@/app/api/health/advanced/route';

type RouteHandler = (req: NextRequest) => Promise<Response>;

interface MiddlewareOptions {
  cacheable?: boolean;
  cacheTTL?: number;
  requireAuth?: boolean;
  rateLimitPerMinute?: number;
}

// ============================================================================
// MIDDLEWARE FACTORY
// ============================================================================

/**
 * Wrap API route handler with performance monitoring and caching
 */
export function withMonitoring(
  handler: RouteHandler,
  options: MiddlewareOptions = {}
) {
  return async (req: NextRequest): Promise<Response> => {
    const startTime = Date.now();
    const method = req.method;
    const pathname = req.nextUrl.pathname;

    // Start Sentry transaction
    const transaction = startTransaction(
      `${method} ${pathname}`,
      'http.server'
    );

    try {
      // Call the actual route handler
      const response = await handler(req);

      // Calculate duration
      const duration = Date.now() - startTime;

      // Track in Sentry
      trackApiEndpoint(method, pathname, response.status, duration);

      // Record request metrics
      recordRequest(duration, !response.ok);

      // Add performance headers
      const headers = new Headers(response.headers);
      headers.set('X-Response-Time', `${duration}ms`);
      headers.set('X-Request-ID', req.headers.get('x-request-id') || 'unknown');

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Track error
      if (error instanceof Error) {
        captureError(error, 'error', {
          method,
          pathname
        }, {
          duration
        });
      }

      // Record failed request
      recordRequest(duration, true);
      trackApiEndpoint(method, pathname, 500, duration);

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    } finally {
      // End transaction
      transaction?.end();
    }
  };
}

/**
 * Wrap query function with caching
 */
export function withQueryCache<T>(
  queryFn: (...args: any[]) => Promise<T>,
  getCacheKey: (...args: any[]) => string,
  ttl: number = 300
) {
  return async (...args: any[]): Promise<T> => {
    const { cachedQuery } = await import('@/lib/cache-layer');

    const cacheKey = getCacheKey(...args);

    return cachedQuery(
      cacheKey,
      () => queryFn(...args),
      ttl
    );
  };
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Validate token...
  return null; // null means auth passed
}

/**
 * Middleware to check rate limits
 */
export async function checkRateLimit(
  req: NextRequest,
  limitsPerMinute: number = 100
) {
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const key = `ratelimit:${clientIp}`;

  // This would use Redis in production
  // For now, just a placeholder
  console.log(`[RATELIMIT] ${clientIp}: checking limit`);

  return null; // null means rate limit passed
}

/**
 * Middleware to validate request body
 */
export async function validateBody(
  req: NextRequest,
  schema: any
) {
  try {
    const body = await req.json();
    
    // Validate with schema (e.g., Zod, Joi)
    // const validated = schema.parse(body);
    
    return body;
  } catch (error) {
    throw new Error('Invalid request body');
  }
}

/**
 * Middleware to add security headers
 */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  // Security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('Content-Security-Policy', "default-src 'self'");

  return new NextResponse(response.body, {
    status: response.status,
    headers
  });
}

/**
 * Middleware to add cache headers
 */
export function withCacheHeaders(
  response: Response,
  maxAge: number = 3600,
  public_: boolean = false
): Response {
  const headers = new Headers(response.headers);

  const cacheControl = public_
    ? `public, max-age=${maxAge}`
    : `private, max-age=${maxAge}`;

  headers.set('Cache-Control', cacheControl);

  return new NextResponse(response.body, {
    status: response.status,
    headers
  });
}

// ============================================================================
// ROUTE HANDLER BUILDER
// ============================================================================

/**
 * Build a complete API route handler with all middleware
 */
export function buildApiRoute(
  handler: RouteHandler,
  options: MiddlewareOptions & {
    securityHeaders?: boolean;
    cacheHeaders?: boolean;
    maxAge?: number;
  } = {}
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      // Apply auth middleware if required
      if (options.requireAuth) {
        const authError = await requireAuth(req);
        if (authError) return authError;
      }

      // Apply rate limiting if configured
      if (options.rateLimitPerMinute) {
        const rateLimitError = await checkRateLimit(
          req,
          options.rateLimitPerMinute
        );
        if (rateLimitError) return rateLimitError;
      }

      // Monitor and handle request
      let response = await withMonitoring(handler, options)(req);

      // Apply security headers if requested
      if (options.securityHeaders !== false) {
        response = withSecurityHeaders(response);
      }

      // Apply cache headers if requested
      if (options.cacheHeaders) {
        response = withCacheHeaders(
          response,
          options.maxAge || 3600,
          false
        );
      }

      return response;
    } catch (error) {
      console.error('[API ERROR]', error);

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper to handle GET requests
 */
export function GET(
  handler: (req: NextRequest) => Promise<Response>,
  options?: MiddlewareOptions
) {
  return buildApiRoute(handler, { ...options, cacheHeaders: true });
}

/**
 * Helper to handle POST requests
 */
export function POST(
  handler: (req: NextRequest) => Promise<Response>,
  options?: MiddlewareOptions
) {
  return buildApiRoute(handler, { ...options, cacheHeaders: false });
}

/**
 * Helper to handle PUT requests
 */
export function PUT(
  handler: (req: NextRequest) => Promise<Response>,
  options?: MiddlewareOptions
) {
  return buildApiRoute(handler, { ...options, cacheHeaders: false });
}

/**
 * Helper to handle DELETE requests
 */
export function DELETE(
  handler: (req: NextRequest) => Promise<Response>,
  options?: MiddlewareOptions
) {
  return buildApiRoute(handler, { ...options, cacheHeaders: false });
}

export default {
  withMonitoring,
  withQueryCache,
  requireAuth,
  checkRateLimit,
  validateBody,
  withSecurityHeaders,
  withCacheHeaders,
  buildApiRoute,
  GET,
  POST,
  PUT,
  DELETE
};
