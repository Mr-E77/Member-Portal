import { NextRequest, NextResponse } from 'next/server';
import { stripe, createCheckoutSession, getOrCreateStripeCustomer } from '@/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tierId, tierName, successUrl, cancelUrl } = await request.json();

    if (!tierId || !tierName || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const stripeCustomer = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email || '',
      session.user.name || undefined
    );

    // Map tier ID to Stripe price ID (set these in your Stripe dashboard)
    const stripePriceIds: Record<string, string> = {
      tier1: process.env.STRIPE_PRICE_TIER1 || '',
      tier2: process.env.STRIPE_PRICE_TIER2 || '',
      tier3: process.env.STRIPE_PRICE_TIER3 || '',
      tier4: process.env.STRIPE_PRICE_TIER4 || '',
    };

    const priceId = stripePriceIds[tierId];

    if (!priceId) {
      Sentry.captureMessage(
        `Missing Stripe price ID for tier ${tierId}`,
        'warning'
      );
      return NextResponse.json(
        { error: 'Tier not available' },
        { status: 400 }
      );
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession(
      stripeCustomer.id,
      priceId,
      session.user.id,
      tierName,
      successUrl,
      cancelUrl
    );

    return NextResponse.json(
      { sessionId: checkoutSession.id, url: checkoutSession.url },
      { status: 200 }
    );
  } catch (error) {
    Sentry.captureException(error, {
      context: 'checkout-session-creation',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
