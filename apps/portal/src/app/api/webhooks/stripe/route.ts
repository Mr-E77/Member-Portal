import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
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
    Sentry.captureException(error, { context: 'webhook-verification' });
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log(
          `Checkout completed: ${session.id} for user ${session.metadata?.userId}`
        );
        // TODO: Update user tier in database
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        console.log(
          `Invoice paid: ${invoice.id} for subscription ${invoice.subscription}`
        );
        // TODO: Confirm subscription active status in database
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        console.log(
          `Invoice failed: ${invoice.id} for subscription ${invoice.subscription}`
        );
        // TODO: Mark subscription as past due
        Sentry.captureMessage(
          `Payment failed for subscription ${invoice.subscription}`,
          'warning'
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        console.log(`Subscription cancelled: ${subscription.id}`);
        // TODO: Downgrade user to free tier
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    Sentry.captureException(error, { context: 'webhook-handler' });
    return NextResponse.json(
      { error: 'Webhook handler error' },
      { status: 500 }
    );
  }
}
