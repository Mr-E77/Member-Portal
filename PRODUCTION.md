# Production Deployment Guide

Complete guide for deploying the Member Portal platform to production on Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Database Setup](#database-setup)
- [OAuth Configuration](#oauth-configuration)
- [Deployment Steps](#deployment-steps)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

Before deploying to production, ensure you have:

- ✅ **GitHub Account** with repository access
- ✅ **Vercel Account** (free tier sufficient for testing)
- ✅ **PostgreSQL Database** (Neon, Supabase, or Railway recommended)
- ✅ **OAuth Apps** configured (GitHub & Google)
- ✅ **Custom Domain** (optional but recommended)
- ✅ **Completed Local Testing** (all tests passing)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Architecture                  │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   Vercel CDN     │
                    │  (Edge Network)  │
                    └────────┬─────────┘
                             │
                ┌────────────┴─────────────┐
                │                          │
        ┌───────▼────────┐        ┌───────▼────────┐
        │  Portal App    │        │  Studio App    │
        │  (Next.js 16)  │        │  (Next.js 16)  │
        │                │        │                │
        │ - Auth         │        │ - Config Mgmt  │
        │ - Dashboard    │        │ - Preview      │
        │ - Multi-Config │        │ - Admin        │
        └───────┬────────┘        └───────┬────────┘
                │                          │
                └────────────┬─────────────┘
                             │
                    ┌────────▼─────────┐
                    │   PostgreSQL     │
                    │  (Managed DB)    │
                    │                  │
                    │ - Neon/Supabase  │
                    │ - Auto-backups   │
                    │ - Connection     │
                    │   pooling        │
                    └──────────────────┘

External Services:
  - GitHub OAuth (authentication)
  - Google OAuth (authentication)
  - Vercel Analytics (monitoring)
  - GitHub Actions (CI/CD)
```

## Database Setup

### Recommended: Neon (Serverless PostgreSQL)

1. **Create Neon Account**
   - Visit [neon.tech](https://neon.tech)
   - Sign up with GitHub
   - Create new project: "member-portal-prod"

2. **Get Connection String**
   ```
   postgresql://user:password@host.neon.tech:5432/main?sslmode=require
   ```

3. **Run Migrations**
   ```bash
   cd apps/portal
   DATABASE_URL="your_neon_connection_string" npx prisma migrate deploy
   ```

4. **Seed Database**
   ```bash
   DATABASE_URL="your_neon_connection_string" npm run db:seed
   ```

### Alternative: Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Navigate to Settings → Database
3. Copy connection string (URI format)
4. Run migrations as above

### Alternative: Railway

1. Create project at [railway.app](https://railway.app)
2. Add PostgreSQL service
3. Copy DATABASE_URL from Variables tab
4. Run migrations as above

## OAuth Configuration

### GitHub OAuth App

1. **Navigate to Settings**
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"

2. **Configure Production App**
   ```
   Application name: Member Portal (Production)
   Homepage URL: https://portal.yourdomain.com
   Authorization callback URL: https://portal.yourdomain.com/api/auth/callback/github
   ```

3. **Get Credentials**
   - Client ID: Copy and save
   - Client Secret: Generate and save securely

4. **For Custom Domains**
   - Update callback URL once domain is configured
   - Can add multiple URLs for staging/preview

### Google OAuth App

1. **Navigate to Google Cloud Console**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Select or create project

2. **Enable Google+ API**
   - APIs & Services → Library
   - Search "Google+ API"
   - Click "Enable"

3. **Create OAuth Credentials**
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application

4. **Configure URLs**
   ```
   Authorized JavaScript origins:
   - https://portal.yourdomain.com
   
   Authorized redirect URIs:
   - https://portal.yourdomain.com/api/auth/callback/google
   ```

5. **Get Credentials**
   - Client ID: Copy (ends with .apps.googleusercontent.com)
   - Client Secret: Copy and save

## Deployment Steps

### Step 1: Portal App Deployment

1. **Login to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy Portal**
   ```bash
   cd /workspaces/Member-Portal
   vercel --prod
   ```

3. **Configure Project**
   - Select "Create new project"
   - Name: "member-portal"
   - Root Directory: `apps/portal`
   - Framework: Next.js (auto-detected)

4. **Link Project**
   ```bash
   # In apps/portal directory
   vercel link
   ```

### Step 2: Studio App Deployment

1. **Deploy Studio**
   ```bash
   cd /workspaces/Member-Portal
   vercel --prod
   ```

2. **Configure Project**
   - Select "Create new project"
   - Name: "design-studio"
   - Root Directory: `apps/studio`
   - Framework: Next.js (auto-detected)

3. **Link Project**
   ```bash
   # In apps/studio directory
   vercel link
   ```

### Step 3: Environment Variables

#### Portal Environment Variables

Go to Vercel Dashboard → member-portal → Settings → Environment Variables

Add the following:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string | Production, Preview |
| `NEXTAUTH_URL` | `https://your-portal-domain.vercel.app` | Production |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` | Production, Preview |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | Production, Preview |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | Production, Preview |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Production, Preview |
| `PORTAL_CONFIG_ID` | `generic-default` | Production, Preview |
| `NEXT_PUBLIC_PRESET` | `generic` | Production, Preview |

#### Studio Environment Variables

Go to Vercel Dashboard → design-studio → Settings → Environment Variables

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `DATABASE_URL` | Same PostgreSQL connection string | Production, Preview |
| `NEXT_PUBLIC_PORTAL_URL` | `https://your-portal-domain.vercel.app` | Production, Preview |

### Step 4: Automatic Deployments

1. **Enable GitHub Integration**
   - Vercel Dashboard → Project Settings → Git
   - Connect GitHub repository
   - Enable automatic deployments for `main` branch

2. **Configure Branch Deployments**
   ```
   Production Branch: main
   Preview Branches: develop, feature/*
   ```

3. **Deploy Hooks (Optional)**
   - Settings → Git → Deploy Hooks
   - Create hook for manual triggers
   - Use in external CI/CD pipelines

## Environment Variables

### Complete Portal `.env` Example

```bash
# Database (Neon/Supabase/Railway)
DATABASE_URL="postgresql://user:pass@host.region.provider.com:5432/main?sslmode=require"

# NextAuth (Session Management)
NEXTAUTH_URL="https://portal.yourdomain.com"
NEXTAUTH_SECRET="generated-with-openssl-rand-base64-32-abc123xyz"

# GitHub OAuth
GITHUB_CLIENT_ID="Iv1.a1b2c3d4e5f6g7h8"
GITHUB_CLIENT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"

# Google OAuth
GOOGLE_CLIENT_ID="123456789012-abc123xyz456.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123xyz456def789"

# Portal Configuration
PORTAL_CONFIG_ID="generic-default"
NEXT_PUBLIC_PRESET="generic"
```

### Complete Studio `.env` Example

```bash
# Database (shared with portal)
DATABASE_URL="postgresql://user:pass@host.region.provider.com:5432/main?sslmode=require"

# Portal Integration
NEXT_PUBLIC_PORTAL_URL="https://portal.yourdomain.com"
```

## Post-Deployment

### 1. Verify Deployments

**Portal Health Check:**
```bash
curl https://portal.yourdomain.com/api/health
# Expected: {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

**Studio Health Check:**
```bash
curl https://studio.yourdomain.com/api/health
# Expected: {"status":"ok"}
```

### 2. Test Authentication

1. Visit portal URL
2. Click "Sign in with GitHub"
3. Authorize application
4. Verify dashboard access
5. Repeat with Google OAuth

### 3. Run Smoke Tests

```bash
# Clone and setup
git clone https://github.com/Mr-E77/Member-Portal.git
cd Member-Portal
npm install

# Run E2E tests against production
cd apps/portal
PLAYWRIGHT_BASE_URL=https://portal.yourdomain.com npm run test:e2e
```

### 4. Configure Custom Domain

**Portal Domain:**
1. Vercel Dashboard → member-portal → Settings → Domains
2. Add domain: `portal.yourdomain.com`
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable
5. Update OAuth callback URLs

**Studio Domain:**
1. Vercel Dashboard → design-studio → Settings → Domains
2. Add domain: `studio.yourdomain.com`
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_PORTAL_URL` in portal env

### 5. Enable Analytics

**Vercel Analytics:**
1. Project Settings → Analytics
2. Enable Web Analytics
3. Enable Speed Insights

**Vercel Logs:**
1. Project Settings → Logs
2. Configure log retention
3. Set up log drains (optional)

## Monitoring & Maintenance

### Monitoring Setup

**1. Vercel Dashboard Monitoring**
- Deployment status
- Build logs
- Runtime logs
- Analytics
- Speed insights

**2. Database Monitoring**
- Neon/Supabase dashboard
- Connection pool usage
- Query performance
- Storage usage

**3. Error Tracking (Optional)**
```bash
# Add Sentry for production error tracking
npm install @sentry/nextjs

# Configure in next.config.ts
```

### Maintenance Tasks

**Weekly:**
- ✅ Review deployment logs
- ✅ Check error rates
- ✅ Monitor database performance
- ✅ Review analytics

**Monthly:**
- ✅ Update dependencies (`npm audit`)
- ✅ Review and rotate secrets
- ✅ Check disk/database usage
- ✅ Performance optimization

**Quarterly:**
- ✅ Security audit
- ✅ Load testing
- ✅ Backup verification
- ✅ Disaster recovery drill

### Backup Strategy

**Automated Backups (Neon):**
- Daily automated backups (7-day retention)
- Point-in-time recovery (PITR)
- Manual backups before major changes

**Manual Backup:**
```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Upload to secure storage
aws s3 cp backup-*.sql s3://your-backup-bucket/
```

### Rollback Procedure

**Immediate Rollback:**
1. Vercel Dashboard → Deployments
2. Find last stable deployment
3. Click "..." → Promote to Production

**Git Rollback:**
```bash
# Revert last commit
git revert HEAD
git push origin main

# Vercel auto-deploys reverted state
```

## Troubleshooting

### Build Failures

**Prisma Client Not Generated:**
```bash
# Ensure buildCommand includes prisma generate
vercel.json:
"buildCommand": "npx prisma generate && npm run build"
```

**Environment Variables Missing:**
- Verify all required vars in Vercel dashboard
- Check for typos in variable names
- Ensure secrets are properly quoted

### Runtime Errors

**Database Connection Issues:**
```bash
# Check connection string format
postgresql://user:pass@host:5432/db?sslmode=require

# Verify SSL mode is enabled
# Neon/Supabase require sslmode=require
```

**OAuth Not Working:**
- Verify callback URLs match exactly
- Check NEXTAUTH_URL matches deployment URL
- Ensure OAuth apps are enabled
- Check for trailing slashes in URLs

### Performance Issues

**Slow Page Loads:**
- Enable Vercel Speed Insights
- Check database query performance
- Review Core Web Vitals
- Consider edge caching

**High Database Load:**
- Review connection pooling settings
- Add database indexes
- Optimize Prisma queries
- Consider read replicas

## Security Checklist

- ✅ All secrets stored in Vercel environment variables
- ✅ `.env` files never committed to git
- ✅ HTTPS enforced (Vercel automatic)
- ✅ Security headers configured (vercel.json)
- ✅ OAuth apps restricted to production domains
- ✅ Database access limited to Vercel IPs
- ✅ Regular dependency updates
- ✅ SQL injection protection (Prisma ORM)
- ✅ XSS protection enabled
- ✅ CSRF protection (NextAuth)

## Support & Resources

### Official Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

### Community Resources
- [GitHub Issues](https://github.com/Mr-E77/Member-Portal/issues)
- [Vercel Community](https://github.com/vercel/community)
- [Next.js Discord](https://nextjs.org/discord)

### Quick Links
- 📊 [Vercel Dashboard](https://vercel.com/dashboard)
- 🗄️ [Neon Console](https://console.neon.tech)
- 🔧 [GitHub OAuth Apps](https://github.com/settings/developers)
- 🔑 [Google Cloud Console](https://console.cloud.google.com)

---

**Deployment Completed?** Continue with performance optimization and monitoring setup!
