import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

// Raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(request: NextRequest): Promise<string> {
  const buffer = await request.arrayBuffer();
  return Buffer.from(buffer).toString('utf-8');
}

export async function POST(request: NextRequest) {
  const rawBody = await getRawBody(request);
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { context: 'webhook-verification' },
    });
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  Sentry.addBreadcrumb({
    category: 'stripe-webhook',
    message: `Received event: ${event.type}`,
    level: 'info',
    data: { eventId: event.id },
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const tierId = session.metadata?.tierId;
        const tierName = session.metadata?.tierName;

        if (!userId || !tierId) {
          console.error('Missing metadata in checkout session:', session.id);
          Sentry.captureMessage(
            `Checkout session ${session.id} missing userId or tierId metadata`,
            'error'
          );
          break;
        }

        console.log(`Checkout completed: ${session.id} for user ${userId}`);

        // Get user for email
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });

        // Update user tier and Stripe info
        await prisma.user.update({
          where: { id: userId },
          data: {
            membershipTier: tierId,
            stripeCustomerId: session.customer as string,
            stripePriceId: session.metadata?.stripePriceId,
          },
        });

        // Send payment receipt email
        if (user?.email) {
          const { sendPaymentReceiptEmail } = await import('@/lib/email');
          const amount = session.amount_total ? session.amount_total / 100 : 0;
          await sendPaymentReceiptEmail(
            user.email,
            amount,
            tierName || tierId,
            session.invoice as string | undefined
          ).catch((err) =>
            console.error('Failed to send payment receipt:', err)
          );
        }

        // Create subscription record if subscription ID exists
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await prisma.subscription.create({
            data: {
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              status: subscription.status,
              currentTier: tierId,
              startDate: new Date(subscription.created * 1000),
              renewalDate: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
            },
          });

          console.log(
            `Subscription ${subscription.id} created for user ${userId}`
          );
        }

        Sentry.addBreadcrumb({
          category: 'subscription',
          message: `User ${userId} upgraded to ${tierName}`,
          level: 'info',
        });

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        console.log(
          `Invoice paid: ${invoice.id} for subscription ${subscriptionId}`
        );

        // Update subscription status to active
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (subscription) {
          const stripeSubscription =
            await stripe.subscriptions.retrieve(subscriptionId);

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'active',
              renewalDate: stripeSubscription.current_period_end
                ? new Date(stripeSubscription.current_period_end * 1000)
                : null,
            },
          });

          console.log(`Subscription ${subscriptionId} marked as active`);
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        console.log(
          `Invoice failed: ${invoice.id} for subscription ${subscriptionId}`
        );

        // Mark subscription as past_due
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'past_due' },
          });

          Sentry.captureMessage(
            `Payment failed for subscription ${subscriptionId}, user ${subscription.userId}`,
            'warning'
          );

          // Send payment failed email
          const user = await prisma.user.findUnique({
            where: { id: subscription.userId },
            select: { email: true },
          });

          if (user?.email) {
            const { sendPaymentFailedEmail } = await import('@/lib/email');
            const amount = invoice.amount_due ? invoice.amount_due / 100 : 0;
            await sendPaymentFailedEmail(
              user.email,
              subscription.currentTier,
              amount
            ).catch((err) =>
              console.error('Failed to send payment failed email:', err)
            );
          }

          console.log(`Subscription ${subscriptionId} marked as past_due`);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;

        console.log(`Subscription updated: ${subscription.id}`);

        const existingSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (existingSubscription) {
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: subscription.status,
              renewalDate: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
              canceledAt:
                subscription.canceled_at
                  ? new Date(subscription.canceled_at * 1000)
                  : null,
            },
          });

          console.log(`Subscription ${subscription.id} updated in database`);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;

        console.log(`Subscription cancelled: ${subscription.id}`);

        const existingSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
          include: { user: true },
        });

        if (existingSubscription) {
          // Mark subscription as canceled
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: 'canceled',
              canceledAt: new Date(),
            },
          });

          // Downgrade user to tier1 (free tier)
          await prisma.user.update({
            where: { id: existingSubscription.userId },
            data: {
              membershipTier: 'tier1',
              stripePriceId: null,
            },
          });

          Sentry.addBreadcrumb({
            category: 'subscription',
            message: `User ${existingSubscription.userId} downgraded to tier1 after cancellation`,
            level: 'warning',
          });

          // Send subscription canceled email
          if (existingSubscription.user.email) {
            const { sendSubscriptionCanceledEmail } = await import('@/lib/email');
            const accessUntil = existingSubscription.renewalDate || new Date();
            await sendSubscriptionCanceledEmail(
              existingSubscription.user.email,
              existingSubscription.currentTier,
              accessUntil
            ).catch((err) =>
              console.error('Failed to send cancellation email:', err)
            );
          }

          console.log(
            `User ${existingSubscription.userId} downgraded to tier1`
          );
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    Sentry.captureException(error, {
      tags: { context: 'webhook-handler', eventType: event.type },
      extra: { eventId: event.id },
    });
    return NextResponse.json(
      { error: 'Webhook handler error' },
      { status: 500 }
    );
  }
}

