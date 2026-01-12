# Deployment Instructions

This document provides detailed instructions for deploying the Mr.E Generic Membership Platform (both Portal and Studio apps) to various hosting platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Build Process](#build-process)
- [Deployment Platforms](#deployment-platforms)
  - [Vercel (Recommended)](#vercel-recommended)
  - [Railway](#railway)
  - [Netlify](#netlify)
  - [Custom Server](#custom-server)
   - [Docker Compose (Local Dev)](#docker-compose-local-dev)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js (v18.x or v20.x LTS) installed
- [ ] npm (v8.x or higher) installed
- [ ] PostgreSQL database (managed service like Neon, Supabase, or Railway)
- [ ] Access to your hosting platform account
- [ ] Domain name configured (if using custom domain)
- [ ] OAuth app credentials (GitHub, Google)
- [ ] All required API keys and credentials

## Environment Variables

### Portal App (.env in apps/portal)

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/db_name?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth Providers
GITHUB_CLIENT_ID="your_github_oauth_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_client_secret"
GOOGLE_CLIENT_ID="your_google_oauth_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"

# Portal Configuration
PORTAL_CONFIG_ID="generic-default"
NEXT_PUBLIC_PRESET="generic"
```

### Studio App (.env in apps/studio)

```bash
# Database (same as portal)
DATABASE_URL="postgresql://user:password@host:5432/db_name?sslmode=require"
```

**Important**: Never commit `.env` files to version control. Use your hosting platform's environment variable settings.

## Database Setup

### 1. Provision PostgreSQL Database

Choose a managed PostgreSQL provider:

- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier available  
- **Railway** (https://railway.app) - Pay-as-you-go
- **Heroku Postgres** - Paid tiers

### 2. Run Migrations

```bash
cd apps/portal

# Set DATABASE_URL in .env
# Then run migrations
npx prisma migrate deploy

# Or for development
npx prisma migrate dev
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

## Build Process

### 1. Install Dependencies

```bash
# From repo root
npm install
```

### 2. Build Apps

```bash
# Build portal
npm run build:portal

# Build studio
npm run build:studio
```

### 3. Test Locally

```bash
# Run portal
npm run dev:portal

# Run studio (in separate terminal)
npm run dev:studio
```

### 4. Docker Compose (local dev)

```bash
docker-compose up --build
```

Services:
- `postgres` on 5432
- `portal` on http://localhost:3000
- `studio` on http://localhost:3001

## Deployment Platforms

### Vercel (Recommended)

Vercel is recommended for Next.js deployments with automatic scaling and edge optimization.

#### Portal App Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy from apps/portal**:
   ```bash
   cd apps/portal
   vercel --prod
   ```

3. **Configure Environment Variables** in Vercel Dashboard:
   - Add all variables from portal .env
   - Set `NEXTAUTH_URL` to your production URL
   - Configure OAuth callback URLs in GitHub/Google

4. **Set Build Settings**:
   - Framework Preset: Next.js
   - Root Directory: `apps/portal`
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Studio App Deployment

1. **Deploy from apps/studio**:
   ```bash
   cd apps/studio
   vercel --prod
   ```

2. **Configure Environment Variables**:
   - Add `DATABASE_URL`

3. **Set Build Settings**:
   - Framework Preset: Next.js
   - Root Directory: `apps/studio`
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Automatic Deployment (GitHub Integration)

1. **Connect to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository

2. **Create Two Projects**:
   - One for `apps/portal`
   - One for `apps/studio`

3. **Configure Each Project**:
   - Set root directory appropriately
   - Add environment variables
   - Enable automatic deployments from main branch
   - Build Command: `npm run build`
   - Output Directory: `build` or `dist`

3. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all required variables from your `.env` file

4. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically deploy on every push to the main branch

#### Manual Deployment (CLI)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Netlify

#### Automatic Deployment (GitHub Integration)

1. **Connect to Netlify**:
   - Visit [netlify.com](https://netlify.com)
   - Sign in with GitHub
   - Click "New site from Git"
   - Select your repository

2. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `build` or `dist`

3. **Environment Variables**:
   - Go to Site Settings → Build & Deploy → Environment
   - Add all required variables

4. **Deploy**:
   - Click "Deploy site"
   - Automatic deployments will occur on every push

#### Manual Deployment (CLI)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build the project
npm run build

# Deploy
netlify deploy --prod
```

### AWS S3 + CloudFront

For high-performance, scalable hosting on AWS.

#### Step 1: Create S3 Bucket

```bash
# Install AWS CLI
# Visit: https://aws.amazon.com/cli/

# Configure AWS credentials
aws configure

# Create S3 bucket
aws s3 mb s3://codex-build-landing-page

# Enable static website hosting
aws s3 website s3://codex-build-landing-page --index-document index.html --error-document index.html
```

#### Step 2: Build and Upload

```bash
# Build the project
npm run build

# Sync build to S3
aws s3 sync build/ s3://codex-build-landing-page --delete

# Set correct content types
aws s3 cp s3://codex-build-landing-page s3://codex-build-landing-page --recursive --exclude "*" --include "*.html" --content-type "text/html" --metadata-directive REPLACE
```

#### Step 3: Configure CloudFront

1. **Create CloudFront Distribution**:
   - Origin Domain: Your S3 bucket website endpoint
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS
   - Cache Policy: CachingOptimized

2. **Configure Custom Error Pages**:
   - Error Code: 404
   - Response Page Path: `/index.html`
   - Response Code: 200

3. **Add Custom Domain** (Optional):
   - Add your domain as an alternate domain name (CNAME)
   - Configure SSL certificate via AWS Certificate Manager

#### Step 4: Automate with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to S3
        run: aws s3 sync build/ s3://codex-build-landing-page --delete
      
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

### GitHub Pages

Simple hosting for static sites.

#### Step 1: Configure Repository

1. Go to repository Settings → Pages
2. Source: Select branch (usually `main` or `gh-pages`)
3. Folder: Select `/root` or `/docs`

#### Step 2: Deploy Script

Add to `package.json`:

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

#### Step 3: Deploy

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Deploy
npm run deploy
```

### Custom Server

For deployment to your own server (VPS, dedicated server, etc.).

#### Step 1: Server Setup

```bash
# SSH into your server
ssh user@your-server.com

# Install Node.js and npm (use current LTS)
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx (reverse proxy)
sudo apt-get install nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Step 2: Clone and Build

```bash
# Clone repository
git clone https://github.com/Mr-E77/Member-Portal.git
cd Member-Portal

# Install dependencies
npm install

# Build for production
npm run build
```

#### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/landing-page`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/Member-Portal/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/landing-page /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 4: SSL with Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

#### Step 5: Process Management with PM2

If using a Node.js server:

```bash
# Start application
pm2 start npm --name "landing-page" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

#### Step 6: Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment..."

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install

# Build
echo "Building application..."
npm run build

# Restart application (if using PM2)
echo "Restarting application..."
pm2 restart landing-page || echo "PM2 restart skipped"

# Or restart nginx (if serving static files)
sudo systemctl restart nginx || echo "Nginx restart skipped"

echo "Deployment completed successfully!"
```

Make it executable:

```bash
chmod +x deploy.sh
```

## Post-Deployment

### 1. Verify Deployment

- [ ] Visit your deployed URL
- [ ] Test all pages and links
- [ ] Verify responsive design on mobile/tablet
- [ ] Check browser console for errors
- [ ] Test forms and interactive elements
- [ ] Verify SSL certificate is active
- [ ] Test page load speed

### 2. Configure DNS

If using a custom domain:

1. Add A record or CNAME record pointing to your hosting platform
2. Wait for DNS propagation (can take up to 48 hours)
3. Verify domain resolves correctly

### 3. Set Up Monitoring

- Configure uptime monitoring (e.g., UptimeRobot, Pingdom)
- Set up error tracking (e.g., Sentry)
- Enable analytics (Google Analytics, Mixpanel)

### 4. Performance Optimization

```bash
# Test performance
npm install -g lighthouse

lighthouse https://your-domain.com --view
```

Optimize based on Lighthouse recommendations.

### 5. Security Headers

Add security headers in your server/platform configuration:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://trusted-cdn.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.example.com
```

**Note**: The Content-Security-Policy should be customized based on your application's actual resource requirements (external APIs, CDNs, fonts, etc.). The example above is more permissive than `default-src 'self'` alone, which would block most external resources.

## Troubleshooting

### Build Fails

**Problem**: Build process fails with errors.

**Solutions**:
- Check Node.js version: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for syntax errors in code
- Verify all dependencies are installed

### Blank Page After Deployment

**Problem**: Website shows a blank page.

**Solutions**:
- Check browser console for errors
- Verify PUBLIC_URL environment variable is set correctly
- Check if all static assets are loading (Network tab in DevTools)
- Verify routing configuration for single-page applications
- Ensure index.html is in the correct location

### Environment Variables Not Working

**Problem**: Environment variables not being recognized.

**Solutions**:
- Verify variables are set in hosting platform settings
- Rebuild application after adding variables
- Check variable naming conventions for your framework (e.g., REACT_APP_ for Create React App, NEXT_PUBLIC_ for Next.js, VITE_ for Vite)
- Restart application/server
- Clear cache and hard reload browser

### SSL Certificate Issues

**Problem**: SSL certificate not working or showing warnings.

**Solutions**:
- Verify certificate is installed correctly
- Check certificate expiration date
- Ensure all resources load over HTTPS
- Clear browser cache
- Check for mixed content warnings

### Performance Issues

**Problem**: Site loads slowly.

**Solutions**:
- Enable compression (Gzip/Brotli)
- Optimize images (use WebP format)
- Enable CDN
- Implement lazy loading
- Minify CSS/JS
- Enable browser caching
- Use code splitting

### 404 Errors on Refresh

**Problem**: Routes work initially but 404 on page refresh.

**Solutions**:
- Configure server to redirect all routes to index.html
- For nginx: Add `try_files $uri $uri/ /index.html;`
- For Apache: Add `.htaccess` rewrite rules
- For hosting platforms: Check "rewrite" or "SPA" settings

## Rollback Procedure

If deployment fails or causes issues:

### Vercel/Netlify

1. Go to deployments page
2. Find previous working deployment
3. Click "Promote to Production"

### AWS

```bash
# Restore previous version from backup
aws s3 sync s3://codex-build-landing-page-backup/ s3://codex-build-landing-page/

# Invalidate CloudFront cache (replace with your distribution ID)
aws cloudfront create-invalidation --distribution-id <YOUR_DISTRIBUTION_ID> --paths "/*"
```

### Custom Server

```bash
# Option 1: Revert the last deployment safely (preserves history)
git revert --no-edit HEAD

# Option 2: Deploy a known good commit (replace <commit-hash> with actual hash)
# git checkout <commit-hash>

# Rebuild
npm run build

# Restart
./deploy.sh
```

## Support

For deployment issues:

- Check the [GitHub Issues](https://github.com/Mr-E77/Member-Portal/issues)
- Contact DevOps team: devops@codexbuild.com
- Review platform-specific documentation

---

**Last Updated**: January 5, 2026
