import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18',
});

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  return customer;
}

/**
 * Create a checkout session for tier upgrade
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  tierName: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      tierName,
      tierId: tierName.toLowerCase().replace(' ', ''), // tier2, tier3, etc.
      stripePriceId: priceId,
    },
  });

  return session;
}

/**
 * Handle successful checkout
 */
export async function handleCheckoutComplete(
  sessionId: string,
  stripeCustomerId: string,
  subscriptionId: string,
  tierName: string
) {
  // In a real app, update the database here
  // For now, this is a placeholder
  console.log(
    `Subscription ${subscriptionId} created for tier ${tierName}`
  );

  return {
    subscriptionId,
    tierName,
    status: 'active',
  };
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.del(subscriptionId);
  return subscription;
}
