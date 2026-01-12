import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';
import {
  generateToken,
  hashToken,
  validateScopes,
  AVAILABLE_SCOPES,
  getAllowedScopesForTier,
} from '@/lib/apiToken';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

/**
 * GET /api/user/tokens
 * List user's API tokens
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tokens = await prisma.apiToken.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('List tokens error:', error);
    Sentry.captureException(error, {
      tags: { context: 'api-tokens-list' },
    });

    return NextResponse.json(
      { error: 'Failed to list tokens' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/tokens
 * Create new API token
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, membershipTier: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { name, scopes, expiresIn } = await request.json();

    if (!name || !scopes || !Array.isArray(scopes)) {
      return NextResponse.json(
        { error: 'Name and scopes array required' },
        { status: 400 }
      );
    }

    // Validate scopes against tier permissions
    const scopeValidation = validateScopes(scopes, user.membershipTier);
    if (!scopeValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid scopes for your tier',
          invalidScopes: scopeValidation.invalidScopes,
          allowedScopes: getAllowedScopesForTier(user.membershipTier),
        },
        { status: 403 }
      );
    }

    // Generate token
    const token = generateToken();
    const hashedToken = await hashToken(token);

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (expiresIn) {
      const days = parseInt(expiresIn);
      if (!isNaN(days) && days > 0) {
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
    }

    // Save to database
    const apiToken = await prisma.apiToken.create({
      data: {
        userId: user.id,
        name,
        token: hashedToken,
        scopes,
        expiresAt,
      },
    });

    Sentry.addBreadcrumb({
      category: 'api-token',
      message: `User ${user.id} created API token: ${name}`,
      level: 'info',
      data: { scopes },
    });

    // Return the plaintext token ONCE (never shown again)
    return NextResponse.json({
      success: true,
      token: {
        id: apiToken.id,
        name: apiToken.name,
        token: token, // Only returned here
        scopes: apiToken.scopes,
        expiresAt: apiToken.expiresAt,
        createdAt: apiToken.createdAt,
      },
      warning:
        'Save this token securely. You will not be able to view it again.',
    });
  } catch (error) {
    console.error('Create token error:', error);
    Sentry.captureException(error, {
      tags: { context: 'api-token-create' },
    });

    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/tokens/[id]
 * Revoke API token
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract token ID from URL
    const url = new URL(request.url);
    const tokenId = url.pathname.split('/').pop();

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID required' },
        { status: 400 }
      );
    }

    // Delete token (only if owned by user)
    const deleted = await prisma.apiToken.deleteMany({
      where: {
        id: tokenId,
        userId: user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Token not found or not owned by user' },
        { status: 404 }
      );
    }

    Sentry.addBreadcrumb({
      category: 'api-token',
      message: `User ${user.id} revoked API token: ${tokenId}`,
      level: 'info',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete token error:', error);
    Sentry.captureException(error, {
      tags: { context: 'api-token-delete' },
    });

    return NextResponse.json(
      { error: 'Failed to delete token' },
      { status: 500 }
    );
  }
}
