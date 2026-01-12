import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

/**
 * POST /api/admin/bulk-action
 * Perform bulk actions on users
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

    const { action, userIds, data } = await request.json();

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide action and userIds array.' },
        { status: 400 }
      );
    }

    let result;
    let affectedCount = 0;

    switch (action) {
      case 'update-tier':
        if (!data?.tier) {
          return NextResponse.json(
            { error: 'Tier required for update-tier action' },
            { status: 400 }
          );
        }
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { membershipTier: data.tier },
        });
        affectedCount = result.count;
        break;

      case 'delete-users':
        // Log before deletion
        await prisma.adminActivityLog.createMany({
          data: userIds.map((userId: string) => ({
            adminId: adminUser.id,
            action: 'DELETE_USER',
            targetUserId: userId,
            details: { reason: data?.reason || 'Bulk delete' },
          })),
        });

        result = await prisma.user.deleteMany({
          where: { id: { in: userIds }, membershipTier: { not: 'admin' } }, // Protect admin accounts
        });
        affectedCount = result.count;
        break;

      case 'send-notification':
        if (!data?.subject || !data?.message) {
          return NextResponse.json(
            { error: 'Subject and message required for notifications' },
            { status: 400 }
          );
        }

        // Create notification records
        await prisma.notification.createMany({
          data: userIds.map((userId: string) => ({
            userId,
            subject: data.subject,
            message: data.message,
            type: data.type || 'info',
          })),
        });

        affectedCount = userIds.length;
        break;

      case 'export-users':
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            email: true,
            name: true,
            membershipTier: true,
            createdAt: true,
            lastLoginAt: true,
          },
        });

        return NextResponse.json({
          success: true,
          data: users,
          count: users.length,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Log bulk action
    await prisma.adminActivityLog.create({
      data: {
        adminId: adminUser.id,
        action: `BULK_${action.toUpperCase()}`,
        details: {
          affectedUsers: userIds,
          affectedCount,
          data,
        },
      },
    });

    Sentry.addBreadcrumb({
      category: 'admin',
      message: `Bulk action ${action} performed on ${affectedCount} users`,
      level: 'warning',
      data: { adminId: adminUser.id, action, affectedCount },
    });

    return NextResponse.json({
      success: true,
      action,
      affectedCount,
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    Sentry.captureException(error, {
      tags: { context: 'admin-bulk-action' },
    });

    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
