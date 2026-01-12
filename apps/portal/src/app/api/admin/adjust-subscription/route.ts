import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

/**
 * POST /api/admin/adjust-subscription
 * Manually adjust user subscription
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

    const { userId, action, data } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, membershipTier: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let result;

    switch (action) {
      case 'grant-tier':
        if (!data?.tier) {
          return NextResponse.json(
            { error: 'Tier required' },
            { status: 400 }
          );
        }

        await prisma.user.update({
          where: { id: userId },
          data: { membershipTier: data.tier },
        });

        // Create subscription record if it doesn't exist
        const existingSubscription = await prisma.subscription.findFirst({
          where: { userId, status: 'active' },
        });

        if (!existingSubscription) {
          await prisma.subscription.create({
            data: {
              userId,
              stripeSubscriptionId: `manual_${Date.now()}`,
              currentTier: data.tier,
              status: 'active',
              startDate: new Date(),
              renewalDate: data.expiresAt
                ? new Date(data.expiresAt)
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            },
          });
        }

        result = { tier: data.tier, action: 'granted' };
        break;

      case 'extend-subscription':
        if (!data?.days) {
          return NextResponse.json(
            { error: 'Days required' },
            { status: 400 }
          );
        }

        const subscription = await prisma.subscription.findFirst({
          where: { userId, status: { in: ['active', 'past_due'] } },
        });

        if (!subscription) {
          return NextResponse.json(
            { error: 'No active subscription found' },
            { status: 404 }
          );
        }

        const newRenewalDate = new Date(
          subscription.renewalDate.getTime() + data.days * 24 * 60 * 60 * 1000
        );

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { renewalDate: newRenewalDate },
        });

        result = { renewalDate: newRenewalDate, daysAdded: data.days };
        break;

      case 'cancel-subscription':
        await prisma.subscription.updateMany({
          where: { userId, status: { in: ['active', 'past_due'] } },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { membershipTier: 'tier1' },
        });

        result = { action: 'canceled' };
        break;

      case 'refund':
        // In a real app, this would process a Stripe refund
        // For now, just log the action
        result = { action: 'refund-logged', amount: data?.amount || 0 };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Log the manual adjustment
    await prisma.adminActivityLog.create({
      data: {
        adminId: adminUser.id,
        action: `MANUAL_${action.toUpperCase()}`,
        targetUserId: userId,
        details: {
          action,
          data,
          result,
          reason: data?.reason || 'Manual adjustment',
        },
      },
    });

    Sentry.captureMessage(
      `Admin ${adminUser.id} performed manual adjustment: ${action} on user ${userId}`,
      'warning'
    );

    return NextResponse.json({
      success: true,
      action,
      result,
    });
  } catch (error) {
    console.error('Subscription adjustment error:', error);
    Sentry.captureException(error, {
      tags: { context: 'admin-adjust-subscription' },
    });

    return NextResponse.json(
      { error: 'Failed to adjust subscription' },
      { status: 500 }
    );
  }
}
