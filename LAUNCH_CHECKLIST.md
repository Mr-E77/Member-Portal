# Launch Checklist - Final Production Deployment

**Last Updated:** January 12, 2026  
**Status:** ✅ READY FOR PRODUCTION

Complete this checklist before launching to production.

---

## Pre-Launch Setup (Before Going Live)

### Phase 1: External Services Setup (2-3 hours)

- [ ] **Vercel Account**
  - [ ] Create account at vercel.com
  - [ ] Connect GitHub repository
  - [ ] Create new project

- [ ] **Database (Choose One)**
  - [ ] **Neon** (Recommended - $0-free tier)
    - Create account at neon.tech
    - Create new project
    - Copy Connection String
    - Password reset link (save for later)
  - [ ] OR **Supabase** - Create PostgreSQL instance
  - [ ] OR **Railway** - Create PostgreSQL database

- [ ] **Stripe Account**
  - [ ] Create account at stripe.com
  - [ ] Complete business verification
  - [ ] Activate account (can take 24-48 hours)
  - [ ] Get API Keys from Developers section

- [ ] **OAuth Providers**
  - [ ] **GitHub** - Create OAuth app
    - Go to github.com/settings/developers
    - New OAuth App
    - Get Client ID & Secret
  - [ ] **Google** - Create OAuth 2.0 Credentials
    - Go to console.cloud.google.com
    - Create OAuth consent screen
    - Create OAuth 2.0 Client ID
    - Get Client ID & Secret

- [ ] **Email Service (Optional but Recommended)**
  - [ ] **Resend** - Create account at resend.com
    - Create and verify domain
    - Get API key
    - Set up DNS records for email

### Phase 2: Generate Secrets (15 minutes)

Run in terminal and save results:

```bash
# Generate 3 secrets
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # CRON_SECRET
```

Create text file with all secrets for safe keeping (password-protected).

### Phase 3: Domain Configuration (15 minutes)

- [ ] Purchase domain (if needed)
- [ ] Point domain DNS to Vercel nameservers
- [ ] Verify DNS propagation (can take 24-48 hours)
- [ ] Note: Can use vercel.app domain temporarily while waiting

### Phase 4: Environment Variables in Vercel

Go to Vercel dashboard → Project Settings → Environment Variables

Add all variables below for **Production**:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<from Step 2>

# OAuth - GitHub
GITHUB_ID=<from OAuth setup>
GITHUB_SECRET=<from OAuth setup>

# OAuth - Google
GOOGLE_ID=<from OAuth setup>
GOOGLE_SECRET=<from OAuth setup>

# Stripe
STRIPE_PUBLIC_KEY=pk_live_or_pk_test_
STRIPE_SECRET_KEY=sk_live_or_sk_test_
STRIPE_WEBHOOK_SECRET=whsec_... (add after webhook setup)

# Email
RESEND_API_KEY=re_... (optional)
EMAIL_FROM=noreply@yourdomain.com (optional)

# Admin
ADMIN_EMAILS=your.email@gmail.com

# Cron Jobs
CRON_SECRET=<from Step 2>

# Analytics (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://... (optional)
NEXT_PUBLIC_POSTHOG_KEY=... (optional)
```

### Phase 5: Initial Deployment

1. [ ] Go to Vercel → Import Project
2. [ ] Select GitHub repository
3. [ ] Root directory: `apps/portal`
4. [ ] All environment variables entered
5. [ ] Click **Deploy**
6. [ ] Wait for build to complete (3-5 minutes)
7. [ ] Verify no build errors

### Phase 6: Setup Stripe Webhook

1. [ ] Go to Stripe Dashboard
2. [ ] Developers → Webhooks
3. [ ] Click "Add endpoint"
4. [ ] Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
5. [ ] Select events to listen to:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. [ ] Copy Signing Secret (whsec_...)
7. [ ] Add to Vercel: `STRIPE_WEBHOOK_SECRET=whsec_...`
8. [ ] Redeploy Vercel (force new deployment)

### Phase 7: Verify Domain & SSL

- [ ] Visit `https://yourdomain.com` (not http://)
- [ ] SSL certificate present (no warnings)
- [ ] Vercel assigns SSL automatically
- [ ] Update all environment URLs from vercel.app to custom domain

---

## Pre-Launch Testing (4-6 hours)

Run through [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md):

### Authentication Tests
- [ ] Email signup works
- [ ] GitHub login works
- [ ] Google login works
- [ ] User created in database
- [ ] Session persists

### Payment Tests (Use Stripe Test Mode)
- [ ] Click Upgrade → goes to Stripe Checkout
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Payment succeeds
- [ ] User tier updates to paid
- [ ] Database subscription created
- [ ] Receipt email sent (check logs)

### Email Tests
- [ ] Welcome email on signup
- [ ] Payment receipt email on upgrade
- [ ] Payment failed email (test with `4000 0000 0000 0002`)
- [ ] Can send renewal reminder (test endpoint)

### Admin Tests
- [ ] Admin can access `/admin`
- [ ] Dashboard shows stats
- [ ] Can impersonate users
- [ ] Can view activity logs
- [ ] Activity logs record actions

### Security Tests
- [ ] Can't access admin without admin email
- [ ] Can't bypass authentication
- [ ] CORS headers correct
- [ ] Rate limiting works
- [ ] No sensitive data in logs

### Performance Tests
- [ ] First page load <2s
- [ ] Dashboard loads <1s after login
- [ ] All Lighthouse scores >85
- [ ] No console errors
- [ ] Images optimize properly

---

## Launch Day Checklist (30 minutes)

### Morning Of Launch

- [ ] [ ] Review all changes one final time
- [ ] [ ] Confirm all environment variables correct
- [ ] [ ] Backup production database
- [ ] [ ] Alert team of launch time
- [ ] [ ] Have rollback plan ready

### Go-Live

1. [ ] **Switch Stripe to Live Mode**
   - Stripe Dashboard → Settings → Enable Live Mode
   - Use `pk_live_...` and `sk_live_...` keys
   - Update Vercel environment variables
   - Update webhook signing secret

2. [ ] **Point Custom Domain to Vercel** (if not already done)
   - DNS propagation complete
   - Test https://yourdomain.com loads

3. [ ] **Verify Production Deployment**
   - Visit site at production domain
   - Test one complete flow: signup → dashboard → upgrade → payment
   - Verify user tier updates

4. [ ] **Monitor Logs**
   - Keep Vercel logs open
   - Watch for errors
   - Check Stripe for transactions
   - Monitor database performance

### Post-Launch (Next 24 Hours)

- [ ] Monitor error tracking (Sentry)
- [ ] Check payment processing
- [ ] Verify emails sending
- [ ] Monitor database performance
- [ ] Check uptime monitoring
- [ ] Document any issues

---

## Post-Launch Monitoring (Ongoing)

### Daily
- [ ] Check Vercel dashboard for errors
- [ ] Review payment transactions in Stripe
- [ ] Check email delivery
- [ ] Monitor site uptime

### Weekly
- [ ] Review analytics (if enabled)
- [ ] Check database performance
- [ ] Review user feedback
- [ ] Update dependencies if needed

### Monthly
- [ ] Full security audit
- [ ] Review costs and optimization opportunities
- [ ] Database maintenance
- [ ] Backup verification
- [ ] Performance review

---

## Rollback Plan

If critical issues occur:

1. [ ] Revert to previous commit: `git revert <commit>`
2. [ ] Re-deploy to Vercel (automatic)
3. [ ] Notify users if outage affected them
4. [ ] Document issue for post-mortem

To switch Stripe back to test mode:
1. [ ] Stripe Dashboard → Disable Live Mode
2. [ ] Update to test keys in Vercel
3. [ ] Webhook signing secret changes
4. [ ] Redeploy

---

## Success Criteria

Consider launch successful when:

- ✅ Site loads without errors
- ✅ Authentication works (all methods)
- ✅ Payments process successfully
- ✅ User tier updates on successful payment
- ✅ Emails send reliably
- ✅ No critical errors in Sentry
- ✅ Database queries performant (<100ms)
- ✅ Stripe transactions appear in dashboard
- ✅ Admin features work
- ✅ 99% uptime in first week

---

## Support Contacts

- **Vercel Support:** https://vercel.com/support
- **Stripe Support:** https://stripe.com/contact
- **Neon Support:** https://neon.tech/docs
- **Sentry Support:** https://sentry.io/support

---

## Emergency Contacts

Save these for quick reference:

- **Stripe Payments Support:** 1-888-252-4759
- **Vercel Status Page:** https://www.vercel-status.com
- **Neon Status Page:** https://neonstatus.com

---

## Documentation References

- [QUICK_START.md](QUICK_START.md) - Step-by-step deployment
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment options
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) - Full testing guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues & fixes
- [SECURITY.md](SECURITY.md) - Security best practices
- [MONITORING.md](MONITORING.md) - Monitoring setup
- [PAYMENTS.md](PAYMENTS.md) - Payment system details

---

## Final Notes

- **Estimate:** 4-8 hours total setup and testing
- **Go-Live Time:** 30-60 minutes
- **Team:** At least 2 people recommended
- **Backup Date:** Deploy backup plan simultaneously
- **Testing:** Never skip testing phase

**Ready? Let's launch! 🚀**
