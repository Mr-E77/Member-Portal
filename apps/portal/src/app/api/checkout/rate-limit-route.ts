import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isRateLimited, strictConfig, getRemainingRequests, getResetTime } from '@/lib/rate-limit';

/**
 * Apply rate limiting to checkout endpoint
 * Uses stricter limits (10 requests/minute) for payment operations
 */
export async function applyCheckoutRateLimit(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const identifier = session.user.email;

  if (isRateLimited(identifier, strictConfig)) {
    const resetTime = getResetTime(identifier);
    const resetSeconds = Math.ceil(resetTime / 1000);

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded for checkout endpoint',
        retryAfter: resetSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': resetSeconds.toString(),
          'X-RateLimit-Limit': strictConfig.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + resetTime).toISOString(),
        },
      }
    );
  }

  const remaining = getRemainingRequests(identifier, strictConfig);

  return {
    headers: {
      'X-RateLimit-Limit': strictConfig.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(Date.now() + strictConfig.windowMs).toISOString(),
    },
  };
}
