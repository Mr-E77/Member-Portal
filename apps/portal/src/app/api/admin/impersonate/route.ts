import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

/**
 * POST /api/admin/impersonate
 * Generate impersonation token for user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { membershipTier: true, id: true },
    });

    if (!adminUser || adminUser.membershipTier !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, membershipTier: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create impersonation record
    const impersonation = await prisma.adminImpersonation.create({
      data: {
        adminId: adminUser.id,
        targetUserId: userId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    Sentry.captureMessage(
      `Admin ${adminUser.id} started impersonating user ${userId}`,
      'warning'
    );

    return NextResponse.json({
      success: true,
      impersonation: {
        id: impersonation.id,
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          tier: targetUser.membershipTier,
        },
        expiresAt: impersonation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    Sentry.captureException(error, {
      tags: { context: 'admin-impersonation' },
    });

    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/impersonate
 * End impersonation session
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // End active impersonation
    await prisma.adminImpersonation.updateMany({
      where: {
        adminId: adminUser.id,
        endedAt: null,
      },
      data: {
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End impersonation error:', error);
    Sentry.captureException(error, {
      tags: { context: 'admin-end-impersonation' },
    });

    return NextResponse.json(
      { error: 'Failed to end impersonation' },
      { status: 500 }
    );
  }
}
