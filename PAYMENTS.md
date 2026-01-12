# Payments & Stripe Integration

Complete guide for Stripe payment processing, tier upgrades, and subscription management.

## Table of Contents

- [Overview](#overview)
- [Stripe Setup](#stripe-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Webhook Configuration](#webhook-configuration)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

### What We Support

- **One-Time Charges**: Initial tier upgrades (subscription mode in Stripe)
- **Recurring Billing**: Monthly subscription renewals
- **Tier Management**: Users can upgrade (not downgrade) to higher tiers
- **Subscription States**: Active, past due, canceled
- **Webhook Events**: Successful payments, failed payments, cancellations

### Architecture

```
┌─────────────────────────────────────────────────────┐
│           Member Portal - Payments Flow              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. Dashboard                                        │
│     ├─ Display current tier                          │
│     ├─ Show upgrade button per tier                  │
│     └─ UpgradeButton component triggers checkout    │
│                                                      │
│  2. Frontend (UpgradeButton.tsx)                     │
│     ├─ POST /api/checkout                            │
│     └─ Redirect to Stripe Checkout URL              │
│                                                      │
│  3. Backend /api/checkout                            │
│     ├─ Create/get Stripe Customer                    │
│     ├─ Create Checkout Session                       │
│     └─ Return session URL                            │
│                                                      │
│  4. Stripe Checkout Page (Hosted)                    │
│     ├─ User enters payment details                   │
│     └─ Redirects to success/cancel URL              │
│                                                      │
│  5. Webhook /api/webhooks/stripe                     │
│     ├─ Receives checkout.session.completed          │
│     ├─ Updates User.membershipTier                   │
│     └─ Creates Subscription record                   │
│                                                      │
│  6. Database Updates                                 │
│     ├─ User.stripeCustomerId, stripePriceId         │
│     └─ Subscription model with status/dates         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Stripe Setup

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up with email
3. Create account (use test mode initially)
4. Verify email

### 2. Create Tier Products & Prices

In Stripe Dashboard → Products:

**Example Setup:**

| Tier | Product Name | Price ID (test) | Monthly |
|------|--------------|-----------------|---------|
| Tier 1 | Starter | `price_test_tier1_xxx` | $9.99 |
| Tier 2 | Growth | `price_test_tier2_xxx` | $29.99 |
| Tier 3 | Pro | `price_test_tier3_xxx` | $99.99 |
| Tier 4 | Elite | `price_test_tier4_xxx` | $299.99 |

**Steps to Create:**
1. Dashboard → Products → Add Product
2. Name: "Starter Membership"
3. Pricing: Monthly, $9.99
4. Billing: Recurring / Monthly
5. Copy the Price ID (starts with `price_`)

### 3. Get API Keys

**Dashboard → Developers → API Keys:**

| Key | Format | Use |
|-----|--------|-----|
| Publishable Key | `pk_test_...` | Frontend (public) |
| Secret Key | `sk_test_...` | Backend (private) |

### 4. Create Webhook Endpoint

1. Dashboard → Developers → Webhooks
2. Add endpoint
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
5. Copy signing secret (`whsec_...`)

## Environment Variables

### Development (.env.local)

```bash
# Stripe API Keys (Test Mode)
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"

# Price IDs for each tier (from your Stripe dashboard)
STRIPE_PRICE_TIER1="price_xxxxxxxxxxxxx"
STRIPE_PRICE_TIER2="price_xxxxxxxxxxxxx"
STRIPE_PRICE_TIER3="price_xxxxxxxxxxxxx"
STRIPE_PRICE_TIER4="price_xxxxxxxxxxxxx"
```

### Production (Vercel Dashboard)

Same variables but with **Live Keys** (not test):

```bash
STRIPE_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_live_xxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_live_xxxxxxxxxxxxx"
```

**⚠️ CRITICAL:** Never expose `STRIPE_SECRET_KEY` in frontend code. Use `NEXT_PUBLIC_*` prefix only for publishable key if needed.

## API Endpoints

### POST /api/checkout

**Create a Stripe checkout session for tier upgrade**

**Request:**
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "tierId": "tier2",
    "tierName": "Growth",
    "successUrl": "http://localhost:3000/dashboard?upgrade=success",
    "cancelUrl": "http://localhost:3000/dashboard?upgrade=canceled"
  }'
```

**Response (200 OK):**
```json
{
  "sessionId": "cs_test_xxxxxxxxxxxxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxxxxxxxxxx"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing required fields"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Frontend Usage:**
```typescript
const response = await fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tierId: 'tier2',
    tierName: 'Growth',
    successUrl: `${window.location.origin}/dashboard?upgrade=success`,
    cancelUrl: `${window.location.origin}/dashboard?upgrade=canceled`,
  }),
});

const { url } = await response.json();
window.location.href = url;  // Redirect to Stripe Checkout
```

### POST /api/webhooks/stripe

**Receive Stripe webhook events**

Stripe sends signed POST requests. Signature verification is automatic.

**Handled Events:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription, update user tier |
| `invoice.payment_succeeded` | Confirm subscription active |
| `invoice.payment_failed` | Mark subscription past due |
| `customer.subscription.deleted` | Downgrade to free tier |

## Webhook Configuration

### Local Testing with Stripe CLI

Test webhooks locally without deploying:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded

# Check your app logs for webhook processing
```

### Webhook Signature Verification

All webhooks are signed with `STRIPE_WEBHOOK_SECRET`. Verify before processing:

```typescript
const signature = request.headers.get('stripe-signature');
const rawBody = await getRawBody(request);

const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

## Testing

### Test Card Numbers

Use these cards in test mode (never works in production):

| Card | Number | Exp | CVC | Result |
|------|--------|-----|-----|--------|
| Success | `4242 4242 4242 4242` | Any future | Any | Succeeds |
| Decline | `4000 0000 0000 0002` | Any future | Any | Declines |
| 3D Secure | `4000 0025 0000 3155` | Any future | Any | Requires auth |
| Expired | `4000 0000 0000 0069` | 12/25 | Any | Declines |

### Manual Testing Flow

1. **Start dev server:**
   ```bash
   npm run dev:portal
   ```

2. **Login as demo user:**
   - Email: `demo1@example.com`
   - Password: `demo1234`

3. **Visit dashboard:**
   ```
   http://localhost:3000/dashboard
   ```

4. **Click upgrade button for a tier**
   - You'll be redirected to Stripe Checkout

5. **Enter test card:**
   - Card: `4242 4242 4242 4242`
   - Exp: Any future date
   - CVC: Any 3 digits
   - Name: Any value

6. **Complete payment**
   - Check your app logs for webhook
   - User tier should update (once webhook handler is implemented)

### E2E Tests

```bash
# Run payment-specific E2E tests
cd apps/portal
npm run test:e2e -- payments.spec.ts

# With UI mode
npm run test:e2e:ui -- payments.spec.ts
```

## Production Deployment

### 1. Create Live Stripe Keys

1. Stripe Dashboard → Developers → API Keys
2. Switch from "Test mode" to "Live" toggle (top right)
3. Copy Live `Publishable Key` and `Secret Key`

### 2. Add to Vercel

1. Vercel Dashboard → portal → Settings → Environment Variables
2. Add:
   ```
   STRIPE_PUBLISHABLE_KEY = pk_live_...
   STRIPE_SECRET_KEY = sk_live_...
   STRIPE_WEBHOOK_SECRET = whsec_live_...
   STRIPE_PRICE_TIER1 = price_...
   STRIPE_PRICE_TIER2 = price_...
   STRIPE_PRICE_TIER3 = price_...
   STRIPE_PRICE_TIER4 = price_...
   ```

### 3. Update Stripe Webhook URL

1. Stripe Dashboard → Developers → Webhooks
2. Click webhook endpoint
3. Update URL to production domain
4. Copy new signing secret

### 4. Test on Staging

Use test mode with staging URL first:
1. Keep `pk_test_` and `sk_test_` keys
2. Deploy to staging environment
3. Test full flow with test cards
4. Verify database updates via Webhook

### 5. Enable Production Mode

Once verified:
1. Swap test keys for live keys
2. Update webhook URL to production
3. Deploy to production
4. Test with small payment first
5. Monitor Stripe Dashboard → Transactions

## Database Integration

### Schema

```typescript
model User {
  id                String   // User ID
  membershipTier    String   // Current tier (tier1-tier4)
  stripeCustomerId  String?  // Stripe Customer ID
  stripePriceId     String?  // Current subscription price ID
}

model Subscription {
  id                      String
  userId                  String  // Foreign key to User
  stripeCustomerId        String  // Stripe Customer ID
  stripeSubscriptionId    String  // Stripe Subscription ID
  stripePriceId           String  // Stripe Price ID
  status                  String  // active, past_due, canceled
  currentTier             String  // tier1, tier2, tier3, tier4
  startDate               DateTime
  renewalDate             DateTime?
  canceledAt              DateTime?
}
```

### Webhook Handler Updates (TODO)

Currently, webhook handlers are stubbed. Implement:

```typescript
// apps/portal/src/app/api/webhooks/stripe/route.ts

case 'checkout.session.completed': {
  const session = event.data.object;
  const userId = session.metadata.userId;
  const tierName = session.metadata.tierName;

  // TODO: Update user tier
  await prisma.user.update({
    where: { id: userId },
    data: { membershipTier: tierId },
  });

  // TODO: Create subscription record
  await prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      stripePriceId: session.line_items[0].price.id,
      status: 'active',
      currentTier: tierName,
      startDate: new Date(),
    },
  });
  break;
}
```

## Troubleshooting

### Checkout Session Not Created

**Check:**
1. `STRIPE_SECRET_KEY` is valid and present
2. Price IDs are correct and exist in Stripe
3. User is authenticated
4. All required fields in API body

**Debug:**
```bash
# Check Stripe Dashboard → Logs
# Look for failed API requests

# Check application logs
console.log('Creating checkout with:', {
  tierId,
  stripePriceIds,
  priceId,
});
```

### Webhooks Not Received

**Check:**
1. Webhook endpoint URL is correct
2. Signing secret (`STRIPE_WEBHOOK_SECRET`) matches endpoint
3. Events are subscribed in Stripe dashboard
4. Production SSL certificate is valid

**Test:**
```bash
# Use Stripe CLI to test locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

### Test Card Declined

**Reasons:**
1. Wrong card number (use `4242 4242 4242 4242` for success)
2. Expired card (use future date)
3. Missing CVC (any 3 digits works in test)
4. Test mode disabled (check Stripe Dashboard toggle)

### Subscription Not Updated After Payment

**Check:**
1. Webhook handler is implemented (currently stubbed)
2. Webhook signature verification passed
3. Database migrations were run
4. User exists in database

**Debug:**
```typescript
// Add logging in webhook handler
Sentry.captureMessage(
  `Processing checkout: ${JSON.stringify(session.metadata)}`,
  'info'
);
```

## Security Best Practices

- ✅ Never log full card numbers or PII
- ✅ Use HTTPS in production (Vercel auto-enforces)
- ✅ Verify webhook signatures before processing
- ✅ Keep `STRIPE_SECRET_KEY` server-side only
- ✅ Never commit `.env` files with real keys
- ✅ Rotate webhook signing secrets quarterly
- ✅ Monitor Stripe Dashboard for suspicious activity
- ✅ Use Sentry to track payment errors

## Support & Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Guide](https://stripe.com/docs/checkout)
- [Webhook Events Reference](https://stripe.com/docs/api/events/types)
- [Stripe Test Data](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

**Next: Implement webhook handlers in database, then move to Visual Regression testing milestone.**
