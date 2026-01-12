# Quick Start & Deployment Guide

This guide walks you through setting up and deploying the Member Portal to production in ~30 minutes.

## 📋 Prerequisites

Before starting, have these ready:

- [ ] GitHub account
- [ ] Vercel account (vercel.com)
- [ ] Stripe account (stripe.com)
- [ ] Neon account for PostgreSQL (neon.tech)
- [ ] Gmail account (for Resend email testing)
- [ ] OAuth app credentials (GitHub & Google)

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Environment Variables (5 minutes)

Generate secure secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

Save these values - you'll need them soon.

### Step 2: Create Production Database (5 minutes)

1. Go to **https://neon.tech**
2. Sign up and create a new project
3. Click **Connection string** and copy the PostgreSQL URL
4. Save this as `DATABASE_URL`

### Step 3: Create OAuth Apps (5 minutes each)

**GitHub OAuth:**
1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** Member Portal
   - **Homepage URL:** https://yourdomain.com
   - **Authorization callback URL:** https://yourdomain.com/api/auth/callback/github
4. Copy **Client ID** and **Client Secret**

**Google OAuth:**
1. Go to https://console.cloud.google.com
2. Create new project → "Member Portal"
3. Go to **Credentials** → Create **OAuth 2.0 Client ID**
4. Choose **Web Application**
5. Add authorized redirect URI: https://yourdomain.com/api/auth/callback/google
6. Copy **Client ID** and **Client Secret**

### Step 4: Create Stripe Account (5 minutes)

1. Go to **https://stripe.com**
2. Sign up and complete verification
3. Go to **Developers** → **API Keys**
4. Copy **Publishable Key** (pk_...) and **Secret Key** (sk_...)

### Step 5: Deploy to Vercel (10 minutes)

1. Go to **https://vercel.com**
2. Click **Import Project**
3. Connect your GitHub repo
4. Select `apps/portal` as root directory
5. Click **Environment Variables** and add:

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<from Step 1>

# GitHub OAuth
GITHUB_ID=<from Step 3>
GITHUB_SECRET=<from Step 3>

# Google OAuth
GOOGLE_ID=<from Step 3>
GOOGLE_SECRET=<from Step 3>

# Stripe
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...

# Admin
ADMIN_EMAILS=your.email@gmail.com

# Cron Secret (for scheduled jobs)
CRON_SECRET=<generate with openssl rand -base64 32>
```

6. Click **Deploy** and wait ~3 minutes

### Step 6: Configure Stripe Webhook (5 minutes)

1. In your Vercel deployment, copy the domain (yourdomain.vercel.app)
2. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Set endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
5. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Copy the **Signing Secret** (whsec_...)
7. Add to Vercel environment: `STRIPE_WEBHOOK_SECRET=whsec_...`
8. Redeploy Vercel

### Step 7: Set Up Custom Domain (2 minutes)

1. In Vercel project settings → **Domains**
2. Enter your custom domain
3. Update your DNS provider with the CNAME record shown
4. Update `NEXTAUTH_URL` to your custom domain
5. Update OAuth app redirect URIs to custom domain
6. Redeploy

### Step 8: Enable Scheduled Jobs (3 minutes)

Add to `vercel.json` in apps/portal root:

```json
{
  "crons": [
    {
      "path": "/api/scheduled/renewal-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs daily at 9 AM UTC to send renewal reminder emails.

### Step 9: Test the Deployment (5 minutes)

1. Visit https://yourdomain.com
2. Click **Sign in**
3. Create account with email
4. Go to dashboard - should show Tier 1
5. Click **Upgrade** → select tier → pay with test card: `4242 4242 4242 4242`
6. After payment, tier should update automatically
7. Check email for payment receipt

---

## ✅ Verification Checklist

After deployment, verify everything works:

- [ ] Site loads without errors
- [ ] Email signup works
- [ ] GitHub login works
- [ ] Google login works
- [ ] Dashboard shows after login
- [ ] Upgrade tier takes you to Stripe checkout
- [ ] Payment with test card succeeds
- [ ] User tier updates after payment
- [ ] Receipt email arrives
- [ ] Admin dashboard accessible at /admin
- [ ] Renewal reminders send at 9 AM

---

## 🔧 Common Issues & Fixes

### "Cannot find module 'prisma'" error
```bash
cd apps/portal
npx prisma generate
npx prisma migrate deploy
```

### Database connection fails
- Check DATABASE_URL in Vercel environment
- Ensure database accepts connections from Vercel IPs
- For Neon: add Vercel IP to allowlist

### OAuth redirect URI mismatch
- Check NEXTAUTH_URL matches your domain
- Update OAuth app redirect URIs to exact domain
- Ensure https:// not http://

### Stripe webhook not firing
- Check webhook signing secret (whsec_...) is correct
- Verify endpoint URL matches exactly
- Check Vercel logs: Applications → Deployment Logs

---

## 📧 Email Setup (Optional - Resend)

For production emails:

1. Go to **https://resend.com**
2. Sign up and add domain
3. Copy API key
4. Add to Vercel environment: `RESEND_API_KEY=re_...`
5. Set `EMAIL_FROM=noreply@yourdomain.com`

Without Resend, emails will log to console only.

---

## 🛡️ Security Checklist

- [ ] All environment variables set in Vercel (not in code)
- [ ] NEXTAUTH_SECRET is strong (32+ chars)
- [ ] OAuth secrets never committed to git
- [ ] Stripe webhook secret configured
- [ ] Database has SSL enabled
- [ ] ADMIN_EMAILS set to your email only
- [ ] Consider adding IP whitelist for admin routes

---

## 📞 Support

### Debug Commands

Check local setup:
```bash
cd apps/portal
npm run build
npm run lint
npm run test:e2e
```

View Vercel logs:
```bash
vercel logs --prod
```

Database inspection:
```bash
npx prisma studio
```

---

## 🎉 You're Done!

Your Member Portal is now live! 

**Next steps:**
- Monitor Sentry for errors (optional)
- Set up analytics (optional)
- Configure backup strategy
- Plan marketing launch

For detailed documentation, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- [PRODUCTION.md](PRODUCTION.md) - Production checklist
- [PAYMENTS.md](PAYMENTS.md) - Payment integration
- [SECURITY.md](SECURITY.md) - Security guidelines
