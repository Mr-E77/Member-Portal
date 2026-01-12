import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import * as Sentry from '@sentry/nextjs';

/**
 * POST /api/subscription/cancel
 * Cancel user's active subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing subscriptionId' },
        { status: 400 }
      );
    }

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription already canceled' },
        { status: 400 }
      );
    }

    // Cancel subscription in Stripe
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    Sentry.addBreadcrumb({
      category: 'subscription',
      message: `User ${session.user.id} canceled subscription ${subscriptionId}`,
      level: 'info',
    });

    return NextResponse.json(
      { message: 'Subscription canceled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error canceling subscription:', error);
    Sentry.captureException(error, {
      tags: { context: 'subscription-cancel' },
    });

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
