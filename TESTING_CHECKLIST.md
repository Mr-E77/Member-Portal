# E2E Testing & Verification Guide

Complete this checklist before considering the project deployment-ready.

## 🧪 Local Testing (Run Locally First)

### 1. Setup Local Environment

```bash
cd /workspaces/Member-Portal

# Install dependencies
npm install

# Setup database (if using Docker)
docker-compose up -d

# Generate Prisma client
cd apps/portal
npx prisma generate
npx prisma migrate dev

# Seed test data (optional)
npx prisma db seed
```

### 2. Run All Tests

```bash
# From apps/portal
npm run lint
npm run type-check
npm run test
npm run test:e2e
```

Expected results:
- ✅ All ESLint checks pass
- ✅ All TypeScript types correct
- ✅ All unit tests pass
- ✅ All E2E tests pass

---

## 🌐 Testing Authentication Flow

### Email Signup
- [ ] Visit https://localhost:3000
- [ ] Click "Sign up"
- [ ] Enter email and click "Continue"
- [ ] Check console/terminal for email verification (local dev)
- [ ] Verify email in auth database
- [ ] Dashboard shows Tier 1 (free)

### GitHub Login (Test OAuth)
```bash
# Create GitHub OAuth app:
# - App name: "Member Portal Dev"
# - Homepage: http://localhost:3000
# - Callback: http://localhost:3000/api/auth/callback/github

# Set in .env.local:
GITHUB_ID=your_test_app_id
GITHUB_SECRET=your_test_app_secret
```

- [ ] Click "Sign in with GitHub"
- [ ] Authorize app
- [ ] Redirected to dashboard
- [ ] User created in database
- [ ] Profile shows GitHub name/avatar

### Google Login (Test OAuth)
```bash
# Create Google OAuth app in Cloud Console
# Same callback pattern: http://localhost:3000/api/auth/callback/google

# Set in .env.local:
GOOGLE_ID=your_test_app_id
GOOGLE_SECRET=your_test_app_secret
```

- [ ] Click "Sign in with Google"
- [ ] Select Google account
- [ ] Redirected to dashboard
- [ ] User created in database

---

## 💳 Testing Payment Flow

### Stripe Test Setup

```bash
# Get test keys from Stripe Dashboard > Developers > API Keys

# Set in .env.local:
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_... (get from webhook settings)
```

### Test Payment Checkout

- [ ] Login to dashboard
- [ ] Click "Upgrade to Pro" (or any tier)
- [ ] Taken to Stripe Checkout
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Expiry: any future date (e.g., 12/25)
- [ ] CVC: any 3 digits (e.g., 123)
- [ ] ZIP: any 5 digits
- [ ] Click "Pay"
- [ ] Success page shows
- [ ] User tier updated to "Pro"
- [ ] Check email for receipt

### Test Webhook Handling

With Stripe CLI running:

```bash
# Terminal 1: Start app
cd apps/portal && npm run dev

# Terminal 2: Start Stripe listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed

# Check app logs for webhook processing
# Should see: "Checkout completed: cs_test_..."
# Should see: "Subscription ... created for user ..."
```

Expected webhook behavior:
- ✅ User tier updates to paid tier
- ✅ Subscription record created
- ✅ Payment receipt email sent (check logs)
- ✅ Activity logged to database

### Test Failed Payment

Use test card: `4000 0000 0000 0002` (always fails)

- [ ] Attempt payment with failure card
- [ ] Checkout shows error
- [ ] Subscription marked as "past_due"
- [ ] Payment failed email sent
- [ ] User can retry with valid card

---

## 📧 Testing Email System

### Welcome Email
- [ ] Create new account via email
- [ ] Check console/logs for email content
- [ ] Verify template renders correctly
- [ ] Links clickable (point to dashboard)

### Payment Receipt Email
- [ ] Make successful payment
- [ ] Check logs for receipt email
- [ ] Verify amount and tier name shown
- [ ] Invoice link works (if provided)

### Renewal Reminder Email (Cron Job)
```bash
# Manually trigger renewal reminders:
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/scheduled/renewal-reminders
```

- [ ] Endpoint returns 200 with count
- [ ] Only subscriptions renewing in 7 days reminded
- [ ] Reminder not sent twice for same subscription
- [ ] Email shows correct renewal date

### Payment Failed Email
Use test card that fails, then:

- [ ] Check logs for payment failed email
- [ ] Verify amount in email matches
- [ ] Link to update payment method works

---

## 👨‍💼 Testing Admin Features

### Access Control

- [ ] Login as non-admin user
- [ ] Try visiting `/admin` → should redirect
- [ ] Check `ADMIN_EMAILS` environment variable

```bash
# Set admin email
ADMIN_EMAILS=your.email@gmail.com
```

- [ ] Login with admin email
- [ ] Can access `/admin` dashboard
- [ ] See stats: total users, subscriptions, revenue

### User Impersonation

- [ ] Go to `/admin` → click "Impersonate"
- [ ] Select a regular user
- [ ] Click "Start Impersonation"
- [ ] Dashboard now shows as that user
- [ ] Activity logged with admin email
- [ ] Can't delete admin accounts
- [ ] Click "End Impersonation" to stop

### Bulk User Actions

- [ ] Admin dashboard → "Bulk Actions"
- [ ] Select multiple users
- [ ] Change tier → Apply
- [ ] Verify all selected users upgraded
- [ ] Activity log shows action and count

### Activity Logs

- [ ] Admin dashboard → "Activity Logs"
- [ ] Filter by admin user
- [ ] See all past impersonations, bulk actions
- [ ] Logs show timestamps, user affected, action taken
- [ ] Can't edit/delete logs

---

## 📊 Testing Configuration System

### Portal Config Management (Studio App)

- [ ] Visit studio app at `localhost:3001`
- [ ] List configurations
- [ ] Create new with "generic" preset
- [ ] Edit: toggle sections on/off
- [ ] Reorder sections
- [ ] Save to database
- [ ] Load in portal at `/generic-new-config`

### Config Switching on Portal

- [ ] Login to portal
- [ ] Go to `/campus/home` (campus config)
- [ ] Go to `/fitness/home` (fitness config)
- [ ] Go to `/generic/home` (generic config)
- [ ] Each shows correct sections/tiers from config
- [ ] Profile icon visible on all

---

## 🔒 Testing Security Features

### Rate Limiting

```bash
# API token endpoint should rate limit

for i in {1..101}; do
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/v1/profile
done
# Response 101 should get rate limited
```

- [ ] After 100 requests/minute, returns 429
- [ ] Rate limit header shows reset time

### CSRF Protection

- [ ] Forms include CSRF tokens
- [ ] POST requests without token fail
- [ ] NextAuth CSRF validation active

### Input Validation

- [ ] Try SQL injection in signup email → blocked
- [ ] Try XSS in name field → sanitized
- [ ] Try uploading non-image to avatar → rejected
- [ ] Avatar size >5MB → rejected

### Session Security

- [ ] Session cookie is httpOnly
- [ ] Session cookie is secure (HTTPS only in prod)
- [ ] Session expires after inactivity
- [ ] Can't use expired session token

---

## 🖼️ Testing UI/UX

### Responsive Design

Test on different viewport sizes:

- [ ] Desktop (1920px) - all elements visible
- [ ] Tablet (768px) - responsive layout works
- [ ] Mobile (375px) - touch-friendly buttons, readable text
- [ ] Avatar uploads - preview works on all sizes

### Accessibility

```bash
cd apps/portal
npm run test:a11y
```

- [ ] All text has sufficient contrast
- [ ] Images have alt text
- [ ] Forms are keyboard navigable
- [ ] Buttons are accessible
- [ ] Links are meaningful

### Dark Mode (if implemented)

- [ ] Toggle dark mode
- [ ] All content readable in dark mode
- [ ] Images have proper contrast
- [ ] No color-only information

---

## 📈 Testing Performance

### Bundle Size

```bash
cd apps/portal
npm run build
npm run analyze
```

- [ ] Portal bundle <200KB (gzipped)
- [ ] First page load <3s on 4G
- [ ] JavaScript execution <1s

### Database Performance

```bash
npx prisma studio

# Check query count for dashboard page
# Should be <5 queries
```

- [ ] Dashboard loads with minimal queries
- [ ] No N+1 query problems
- [ ] Indexes being used (check EXPLAIN ANALYZE)

### Image Optimization

- [ ] Avatar images are optimized (WebP, multiple sizes)
- [ ] Hero images lazy load
- [ ] No oversized images served

---

## 🌍 Pre-Production Testing (Vercel Staging)

Before final production deployment:

### Deploy to Staging

```bash
# In Vercel, create a "staging" environment branch
# Or use preview deployments

vercel --prod --yes  # Creates preview
```

### Run Full Test Suite on Staging

- [ ] All E2E tests pass against staging
- [ ] Performance metrics acceptable
- [ ] Real Stripe test payments work
- [ ] Real emails send via Resend (if configured)
- [ ] Database migrations run without errors

### Load Testing

```bash
# Simple load test with ab
ab -n 1000 -c 10 https://staging-domain.com

# Check:
# - No 5xx errors
# - Response times <2s
# - All requests successful
```

---

## ✅ Final Production Checklist

Before going live:

- [ ] All test suites pass
- [ ] Production environment variables configured
- [ ] Database migrations run successfully
- [ ] Stripe webhook signing secret correct
- [ ] ADMIN_EMAILS set to your email
- [ ] Custom domain configured and DNS updated
- [ ] NEXTAUTH_URL updated to production domain
- [ ] OAuth apps updated with production URLs
- [ ] Email service configured (Resend)
- [ ] Sentry project created and DSN configured
- [ ] Error monitoring and alerts set up
- [ ] Database backups enabled
- [ ] CDN enabled for static assets
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] API docs updated
- [ ] Support email configured

---

## 🚨 Monitoring After Launch

### Daily Checks

- [ ] Check Vercel dashboard for errors
- [ ] Check Sentry for exceptions
- [ ] Check Stripe dashboard for failed payments
- [ ] Monitor uptime status

### Weekly Checks

- [ ] Review analytics (if enabled)
- [ ] Check database performance (slow queries)
- [ ] Review admin activity logs
- [ ] Check renewal reminder emails sent

### Monthly Checks

- [ ] Review costs (Vercel, database, Stripe fees)
- [ ] Update dependencies
- [ ] Security audit
- [ ] Backup verification

---

## 📞 Support & Debugging

### View Logs

```bash
# Vercel logs
vercel logs --prod

# Database console
npx prisma studio

# Sentry console (if configured)
# https://sentry.io/your-org/
```

### Common Issues During Testing

**Issue:** Webhook not triggering
- Check webhook URL is correct
- Check signing secret is correct
- View webhook logs in Stripe Dashboard
- Check Vercel function logs

**Issue:** Email not sending
- Check RESEND_API_KEY is set
- Check EMAIL_FROM is configured
- Review email service logs
- Check spam folder

**Issue:** Payment not processing
- Check STRIPE_SECRET_KEY is correct
- Check test vs live key not mixed
- Verify Stripe account is activated
- Check payment method is valid

---

## 🎉 Testing Complete!

Once all checks pass, you're ready for production launch.
