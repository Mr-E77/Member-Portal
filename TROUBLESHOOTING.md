# Deployment Troubleshooting Guide

Solutions for common issues during and after deployment.

---

## Database Issues

### "P1001: Can't reach database server"

**Symptoms:** Build fails with database connection error

**Solutions:**

1. **Check DATABASE_URL format:**
   ```bash
   # Should be:
   postgresql://user:password@host:5432/db?sslmode=require
   
   # NOT:
   postgres://...  # (missing 'ql')
   ```

2. **Verify database is running:**
   ```bash
   # For Neon: Check dashboard - is project active?
   # For Railway: Check if database container is running
   # For local: docker-compose up -d
   ```

3. **Check firewall/network:**
   - Vercel needs to access your database
   - For Neon: Ensure "Allow all IPs" or add Vercel IPs
   - For Railway: Check network settings

4. **Test connection locally:**
   ```bash
   cd apps/portal
   npx prisma db push  # Should work if connection valid
   ```

---

### "Migration already applied" error

**Symptoms:** Deployment fails saying migration already exists

**Solutions:**

1. **First deployment after schema change:**
   ```bash
   # Skip migrations, just generate client
   npx prisma generate
   npx prisma db push  # Instead of migrate deploy
   ```

2. **If using prisma migrate:**
   ```bash
   # Make sure you committed migration files:
   git add prisma/migrations/
   git commit -m "...migration files..."
   git push
   ```

3. **Check migration_lock.toml:**
   ```bash
   cat prisma/migrations/migration_lock.toml
   # Should show provider = "postgresql"
   ```

---

### Slow queries after deployment

**Symptoms:** Dashboard loads slowly, queries timeout

**Solutions:**

1. **Check indexes are created:**
   ```bash
   npx prisma studio
   # Run indexes manually if needed
   ```

2. **Add missing indexes:**
   ```prisma
   model User {
     id String @id
     email String @unique
     createdAt DateTime @default(now())
     
     @@index([email])  // Already unique
     @@index([createdAt])  // Add if filtering by date
   }
   ```

3. **Optimize queries:**
   ```typescript
   // ❌ Bad: N+1 queries
   const users = await prisma.user.findMany();
   for (const user of users) {
     const subs = await prisma.subscription.findMany({
       where: { userId: user.id }
     });
   }
   
   // ✅ Good: One query with include
   const users = await prisma.user.findMany({
     include: { subscriptions: true }
   });
   ```

---

## Authentication Issues

### "NEXTAUTH_URL mismatch" or blank login page

**Symptoms:** OAuth redirect fails, login broken

**Solutions:**

1. **Check NEXTAUTH_URL:**
   ```bash
   # Production should be:
   NEXTAUTH_URL=https://yourdomain.com
   
   # NOT:
   NEXTAUTH_URL=https://yourdomain.vercel.app  # Unless using this domain
   ```

2. **Update OAuth app settings:**
   - GitHub: https://github.com/settings/developers
   - Google: https://console.cloud.google.com/
   - Check Authorized redirect URIs exactly match

3. **Regenerate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   # Update in Vercel environment
   # Redeploy
   ```

### "Invalid redirect URI" from OAuth provider

**Symptoms:** OAuth login shows error about redirect URL

**Solutions:**

1. **GitHub OAuth redirect:**
   ```
   https://yourdomain.com/api/auth/callback/github
   ```

2. **Google OAuth redirect:**
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

3. **Ensure exact match:**
   - No trailing slashes
   - Exact domain (not IP address)
   - https:// not http:// (production)
   - No query parameters

---

## Stripe Payment Issues

### "Invalid API Key" or "Signature verification failed"

**Symptoms:** Stripe checkout fails or webhook doesn't work

**Solutions:**

1. **Check keys are from same environment:**
   ```bash
   # All should be test keys (sk_test_/pk_test_):
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_test_...
   
   # OR all production keys (sk_live_/pk_live_):
   STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```

2. **Verify webhook signing secret:**
   - Stripe Dashboard → Developers → Webhooks
   - Select webhook endpoint
   - Copy signing secret (whsec_...)
   - Update Vercel environment variable
   - Redeploy

3. **Check webhook endpoint URL:**
   ```
   https://yourdomain.com/api/webhooks/stripe
   
   NOT:
   https://yourdomain.vercel.app/...  (if using custom domain)
   ```

### Payments succeed but user tier doesn't update

**Symptoms:** Stripe shows payment processed, but dashboard still shows Tier 1

**Solutions:**

1. **Check webhook is receiving events:**
   - Stripe Dashboard → Developers → Webhooks
   - Click endpoint → Logs
   - Should see `checkout.session.completed` events
   - Check response status (should be 200)

2. **Verify metadata sent to Stripe:**
   ```typescript
   // In checkout route, should include:
   metadata: {
     userId: user.id,
     tierId: 'tier2',
     tierName: 'Pro'
   }
   ```

3. **Check database query:**
   ```bash
   # Via npx prisma studio or psql
   SELECT * FROM "Subscription" WHERE "userId" = 'user-id';
   SELECT * FROM "User" WHERE id = 'user-id';
   # Check membershipTier was updated
   ```

4. **Check Sentry logs:**
   - Go to Sentry.io
   - Look for webhook processing events
   - Check for error messages

### Test card declined

**Symptoms:** Payment fails with test card

**Solutions:**

Use correct Stripe test cards:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`
- **Requires auth:** `4000 0000 0000 9995`

---

## Email Issues

### "Failed to send email" or no emails received

**Symptoms:** Email functions throw errors or emails don't arrive

**Solutions:**

1. **Check Resend API key:**
   ```bash
   # Should be set in environment:
   RESEND_API_KEY=re_...
   
   # Get from https://resend.com → API Keys
   ```

2. **Verify EMAIL_FROM is correct:**
   ```bash
   EMAIL_FROM=noreply@yourdomain.com
   
   # Resend requires verified domain or test address
   ```

3. **Check logs:**
   - Vercel deployment logs
   - Sentry breadcrumbs
   - Resend dashboard (if using)

4. **Local testing without Resend:**
   ```typescript
   // In email.ts, add console fallback:
   if (!process.env.RESEND_API_KEY) {
     console.log('📧 Email would be sent:', { to, subject, html });
     return { success: true };
   }
   ```

### Emails going to spam

**Symptoms:** Emails arrive but in spam folder

**Solutions:**

1. **Verify domain in Resend:**
   - Add DNS records (SPF, DKIM, DMARC)
   - Follow Resend setup guide

2. **Use proper sender name:**
   ```typescript
   from: `"Member Portal" <noreply@yourdomain.com>`
   ```

3. **Add unsubscribe link (for bulk emails):**
   ```html
   <a href="...">Unsubscribe</a>
   ```

---

## Admin Dashboard Issues

### "Access Denied" or redirect to dashboard

**Symptoms:** Admin can't access `/admin`

**Solutions:**

1. **Check ADMIN_EMAILS:**
   ```bash
   # Should include your email:
   ADMIN_EMAILS=your.email@gmail.com,other@domain.com
   
   # Multiple emails separated by comma (no spaces)
   ```

2. **Verify email matches exactly:**
   - Case-sensitive
   - No extra spaces
   - Must match user email in database

3. **Clear session cache:**
   ```bash
   # Manually clear NextAuth session
   # Use incognito/private window to test
   ```

---

## Performance Issues

### Site loads slowly after deployment

**Symptoms:** First page load >3s, high CLS, LCP

**Solutions:**

1. **Check bundle size:**
   ```bash
   npm run build:portal
   npm run analyze
   
   # Should be:
   # Portal JS: ~150-200KB gzipped
   # Studio JS: ~100-150KB gzipped
   ```

2. **Optimize images:**
   ```typescript
   // Use next/image
   import Image from 'next/image';
   
   <Image
     src="/avatar.jpg"
     alt="..."
     width={200}
     height={200}
   />
   ```

3. **Check database queries:**
   ```bash
   npx prisma studio
   # Count queries on dashboard page
   # Should be <5 queries
   ```

4. **Enable caching headers:**
   ```typescript
   // pages/api/data.ts
   export const revalidate = 3600; // Cache for 1 hour
   ```

5. **Vercel Analytics:**
   - Check Vercel dashboard
   - Monitor Core Web Vitals
   - Identify slow endpoints

---

## Build Issues

### "Build failed: ESLint errors"

**Symptoms:** Deployment fails with lint errors

**Solutions:**

```bash
# Locally check and fix:
cd apps/portal
npm run lint -- --fix
npm run lint  # Verify all fixed
git add . && git commit -m "fix: eslint errors"
git push
```

### "Build failed: TypeScript errors"

**Symptoms:** Deployment fails with type errors

**Solutions:**

```bash
# Type check locally:
npm run type-check

# Fix errors:
# Usually import paths or missing types

# Reinstall types:
npm install -D @types/node
npm install -D @types/react
```

### "Build timeout" or "Function too large"

**Symptoms:** Build takes >15 minutes or fails with size error

**Solutions:**

1. **Reduce dependencies:**
   - Check `node_modules` size
   - Remove unused packages: `npm prune`

2. **Use dynamic imports:**
   ```typescript
   // For heavy components
   const HeavyComponent = dynamic(() => import('@/components/Heavy'));
   ```

3. **Optimize imports:**
   ```typescript
   // ❌ Avoid:
   import * as utils from '@/lib/utils';
   
   // ✅ Use:
   import { specificFunction } from '@/lib/utils';
   ```

---

## Security Issues

### "CORS error" or "Blocked by CORS policy"

**Symptoms:** Frontend can't call API

**Solutions:**

1. **Check CORS headers:**
   ```typescript
   // api/route.ts
   export function GET(req: NextRequest) {
     // NextAuth handles CORS automatically
     // For custom API, add headers:
     const response = new Response(JSON.stringify({ data: '...' }));
     response.headers.set('Access-Control-Allow-Origin', '*');
     return response;
   }
   ```

2. **Verify API route exists and works:**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     https://yourdomain.com/api/route
   ```

### "rate limit exceeded" errors

**Symptoms:** API returns 429 status

**Solutions:**

1. **Check rate limit configuration:**
   ```typescript
   const rateLimit = {
     windowMs: 60 * 1000,  // 1 minute
     max: 100  // 100 requests per minute
   };
   ```

2. **For legitimate high traffic:**
   - Increase rate limit or
   - Implement request queuing or
   - Use API tokens with higher limits

---

## Monitoring & Alerts

### Setup error monitoring

1. **Sentry:**
   ```bash
   # Get DSN from https://sentry.io
   NEXT_PUBLIC_SENTRY_DSN=https://key@sentry.io/123456
   ```

2. **Vercel Analytics:**
   - Built-in, just enable in dashboard

3. **Uptime monitoring:**
   - Use UptimeRobot or Pingdom
   - Monitor /api/health endpoint

---

## Getting Help

If issue persists:

1. **Check logs:**
   ```bash
   # Vercel
   vercel logs --prod
   
   # Local
   npm run dev -- --debug
   ```

2. **Enable verbose logging:**
   ```bash
   DEBUG=prisma* npm run dev
   ```

3. **Check documentation:**
   - [Vercel Docs](https://vercel.com/docs)
   - [NextAuth Docs](https://next-auth.js.org)
   - [Prisma Docs](https://prisma.io/docs)
   - [Stripe Docs](https://stripe.com/docs)

4. **Contact support:**
   - Vercel support: https://vercel.com/support
   - Stripe support: https://stripe.com/contact
   - Prisma support: https://github.com/prisma/prisma/discussions
