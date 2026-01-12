import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';
import { sendRenewalReminderEmail } from '@/lib/email';

/**
 * Scheduled job to send renewal reminder emails 7 days before renewal
 * Triggered daily via Vercel Cron
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Find subscriptions renewing in 7 days
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    console.log(`Checking for renewals between ${today} and ${sevenDaysFromNow}`);

    const subscriptionsToRemind = await prisma.subscription.findMany({
      where: {
        status: 'active',
        renewalDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
        // Only send reminder once
        reminderSentAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(
      `Found ${subscriptionsToRemind.length} subscriptions needing renewal reminders`
    );

    let successCount = 0;
    let failureCount = 0;

    for (const subscription of subscriptionsToRemind) {
      try {
        if (!subscription.user.email) {
          console.warn(`User ${subscription.userId} has no email, skipping`);
          failureCount++;
          continue;
        }

        // Get subscription tier details (estimate monthly cost from renewal amount)
        const tierNameMap: { [key: string]: string } = {
          tier1: 'Free Tier',
          tier2: 'Pro ($9.99/month)',
          tier3: 'Premium ($19.99/month)',
          tier4: 'Enterprise ($49.99/month)',
        };

        const tierName =
          tierNameMap[subscription.currentTier] || subscription.currentTier;

        // Estimate amount based on tier (you may want to store actual amount in Subscription model)
        const tierAmounts: { [key: string]: number } = {
          tier1: 0,
          tier2: 9.99,
          tier3: 19.99,
          tier4: 49.99,
        };

        const amount = tierAmounts[subscription.currentTier] || 0;

        // Send email
        await sendRenewalReminderEmail(
          subscription.user.email,
          tierName,
          subscription.renewalDate || new Date(),
          amount
        );

        // Mark reminder as sent
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            reminderSentAt: new Date(),
          },
        });

        successCount++;

        Sentry.addBreadcrumb({
          category: 'renewal-reminder',
          message: `Sent renewal reminder to user ${subscription.userId}`,
          level: 'info',
          data: { subscriptionId: subscription.id, tierName },
        });

        console.log(
          `Sent renewal reminder to ${subscription.user.email} for subscription ${subscription.id}`
        );
      } catch (error) {
        failureCount++;
        console.error(
          `Failed to send renewal reminder for subscription ${subscription.id}:`,
          error
        );

        Sentry.captureException(error, {
          tags: { context: 'renewal-reminder-send' },
          extra: {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            email: subscription.user.email,
          },
        });
      }
    }

    console.log(
      `Renewal reminder job completed: ${successCount} sent, ${failureCount} failed`
    );

    Sentry.addBreadcrumb({
      category: 'scheduled-job',
      message: 'Renewal reminder job completed',
      level: 'info',
      data: { successCount, failureCount },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Sent ${successCount} renewal reminders, ${failureCount} failures`,
        successCount,
        failureCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Renewal reminder job error:', error);

    Sentry.captureException(error, {
      tags: { context: 'renewal-reminder-job' },
    });

    return NextResponse.json(
      { error: 'Job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
