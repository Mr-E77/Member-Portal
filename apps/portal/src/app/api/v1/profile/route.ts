import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractBearerToken,
  verifyTokenHash,
  hasScope,
  checkRateLimit,
} from '@/lib/apiToken';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

/**
 * Middleware to validate API token
 * Usage: import { validateApiToken } from '@/lib/middleware/apiToken'
 */
export async function validateApiToken(
  request: NextRequest,
  requiredScope?: string
): Promise<
  | { valid: true; userId: string; tokenId: string; tier: string }
  | { valid: false; error: string; status: number }
> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = extractBearerToken(authHeader || '');

    if (!token) {
      return {
        valid: false,
        error: 'Missing or invalid Authorization header',
        status: 401,
      };
    }

    // Find all tokens (we need to check hashes)
    const apiTokens = await prisma.apiToken.findMany({
      where: {
        expiresAt: {
          OR: [{ gt: new Date() }, { equals: null }],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            membershipTier: true,
          },
        },
      },
    });

    // Find matching token by comparing hashes
    let matchedToken = null;
    for (const apiToken of apiTokens) {
      const isMatch = await verifyTokenHash(token, apiToken.token);
      if (isMatch) {
        matchedToken = apiToken;
        break;
      }
    }

    if (!matchedToken) {
      return {
        valid: false,
        error: 'Invalid or expired token',
        status: 401,
      };
    }

    // Check rate limit
    const rateLimit = checkRateLimit(matchedToken.id);
    if (!rateLimit.allowed) {
      return {
        valid: false,
        error: 'Rate limit exceeded',
        status: 429,
      };
    }

    // Check scope if required
    if (requiredScope && !hasScope(matchedToken.scopes, requiredScope)) {
      return {
        valid: false,
        error: `Missing required scope: ${requiredScope}`,
        status: 403,
      };
    }

    // Update last used timestamp
    await prisma.apiToken.update({
      where: { id: matchedToken.id },
      data: { lastUsedAt: new Date() },
    });

    Sentry.addBreadcrumb({
      category: 'api-token',
      message: `API token ${matchedToken.id} used by user ${matchedToken.userId}`,
      level: 'info',
      data: {
        scopes: matchedToken.scopes,
        remaining: rateLimit.remaining,
      },
    });

    return {
      valid: true,
      userId: matchedToken.userId,
      tokenId: matchedToken.id,
      tier: matchedToken.user.membershipTier,
    };
  } catch (error) {
    console.error('Token validation error:', error);
    Sentry.captureException(error, {
      tags: { context: 'api-token-validation' },
    });

    return {
      valid: false,
      error: 'Internal server error',
      status: 500,
    };
  }
}

/**
 * GET /api/v1/profile
 * Example API endpoint using token authentication
 */
export async function GET(request: NextRequest) {
  const validation = await validateApiToken(request, 'read:profile');

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: validation.userId },
      select: {
        id: true,
        name: true,
        email: true,
        membershipTier: true,
        createdAt: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: user,
    });
  } catch (error) {
    console.error('API profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
