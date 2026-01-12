# Mr.E Generic Membership Platform

[![CI/CD Pipeline](https://github.com/Mr-E77/Member-Portal/actions/workflows/ci.yml/badge.svg)](https://github.com/Mr-E77/Member-Portal/actions/workflows/ci.yml)
[![Lighthouse CI](https://github.com/Mr-E77/Member-Portal/actions/workflows/ci.yml/badge.svg?branch=main&label=Lighthouse%20CI)](https://github.com/Mr-E77/Member-Portal/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/Mr-E77/Member-Portal/actions/workflows/e2e-scheduled.yml/badge.svg)](https://github.com/Mr-E77/Member-Portal/actions/workflows/e2e-scheduled.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)

A flexible, config-driven membership portal platform built with **Next.js**, **TypeScript**, **Prisma**, and **NextAuth**. This monorepo contains both the member-facing portal and a design studio for creating and managing portal configurations.

> **Status:** ✅ **FEATURE COMPLETE** - All core features implemented. Currently in **Security & Compliance Phase** before production launch.

---

## 🚀 Deployment Roadmap (Jan 2026)

| Phase | Status | Timeline | Focus |
|-------|--------|----------|-------|
| **Phase 1:** Core Features | ✅ Complete | ✓ Complete | Email, Avatars, Admin Tools, API Tokens |
| **Phase 2:** Security & Compliance | 🔄 In Progress | 2-3 weeks | Security audit, compliance certifications, data protection |
| **Phase 3:** Testing & Quality | 📋 Planned | 2 weeks | Comprehensive test coverage, automation |
| **Phase 4:** Performance & Monitoring | 📋 Planned | 2 weeks | Optimization, real-time dashboards, alerting |
| **Phase 5:** Production Launch | 📋 Ready | Jan 2026 | Go-live, customer onboarding, support |

## 📚 Documentation Index

### Getting Started
- **[Quick Start Guide](QUICK_START.md)** - Deploy to production in ~30 minutes
- **[Project Status](STATUS.md)** - Current status and feature overview
- **[Complete Feature List](FEATURES.md)** - 150+ implemented features

### Current Phase: Security & Compliance
- **[Security & Compliance](SECURITY.md)** - Security headers, OWASP, vulnerability management
- **[Compliance Roadmap](COMPLIANCE.md)** - GDPR, PCI-DSS, and regulatory requirements (NEW)
- **[Security Audit Checklist](SECURITY_AUDIT.md)** - Pre-launch security verification (NEW)

### Testing & Quality Assurance
- **[Testing Documentation](TESTING.md)** - Unit, integration, and database testing
- **[E2E Testing Guide](E2E_TESTING.md)** - Playwright automation and CI/CD
- **[Testing Checklist](TESTING_CHECKLIST.md)** - Complete pre-launch testing guide
- **[Visual Regression Testing](VISUAL_REGRESSION.md)** - Percy snapshots and visual validation

### Deployment & Operations
- **[Production Deployment Guide](PRODUCTION.md)** - Complete production setup
- **[Deployment Options](DEPLOYMENT.md)** - Vercel, Netlify, AWS, custom servers
- **[Monitoring & Observability](MONITORING.md)** - Sentry, uptime monitoring, dashboards
- **[Launch Checklist](LAUNCH_CHECKLIST.md)** - Pre-launch verification
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions

### Features & Payments
- **[Payments & Stripe Integration](PAYMENTS.md)** - Tier upgrades, subscriptions, webhooks
- **[Performance & Budgets](#performance--lighthouse-ci)** - Lighthouse CI targets and optimization

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

The Mr.E Generic Membership Platform is a **production-grade membership system** designed for organizations to create custom member portals with flexible configurations. Currently deployed features handle authentication, payments, profiles, and administrative functions.

### What This Platform Enables

- **Multiple Member Portals** - Create distinct portals for different communities or organizations
- **Membership Tiers** - 4+ customizable levels with unique features and pricing
- **Secure Authentication** - Email/password, GitHub, and Google OAuth via NextAuth
- **Payment Processing** - Stripe integration for subscriptions and tier upgrades
- **Member Profiles** - Customizable user data and profile management
- **Admin Dashboard** - Revenue tracking, user management, and platform analytics
- **Configuration Studio** - Web-based design tool for portal customization (no code required)

## Architecture

```
Member-Portal/
├── apps/
│   ├── portal/          # Next.js member-facing portal
│   │   ├── src/
│   │   │   ├── app/           # Next.js app directory
│   │   │   ├── components/    # React components
│   │   │   ├── config/        # Portal configurations
│   │   │   ├── lib/           # Utilities and Prisma client
│   │   │   └── types/         # TypeScript types
│   │   ├── prisma/            # Database schema and migrations
│   │   └── public/            # Static assets
│   └── studio/          # Next.js configuration design tool
│       ├── src/
│       │   ├── app/           # Studio pages
│       │   ├── lib/           # Shared utilities
│       │   └── types/         # TypeScript types
│       └── public/
├── packages/
│   ├── core/            # Shared business logic (placeholder)
│   └── ui/              # Shared React components
├── presets/
│   ├── generic/         # Generic preset assets
│   └── campus-sound/    # Campus Sound United preset
├── README.md
├── DEPLOYMENT.md
└── CHANGELOG.md
```

## ✨ Features

### Portal App - Member Features
- 🔐 **Multiple Auth Methods** - Email/password, GitHub, Google OAuth
- 📊 **Member Dashboard** - Personalized tier view, upgrade options, renewal tracking
- 👤 **Profile Management** - Editable user profiles with avatar uploads
- 💳 **Stripe Integration** - Seamless subscription management and tier upgrades
- 🎨 **Responsive Design** - Mobile-first Tailwind CSS interface
- ⚡ **Performance Optimized** - In-memory caching, image optimization, bundle splitting

### Recently Implemented (Jan 2026)
- ✉️ **Email Notifications** - Welcome, confirmation, upgrade, renewal, and failure emails
- 🖼️ **Avatar Upload System** - S3 storage with auto-resizing, WebP conversion, signed URLs
- 🔐 **Admin Features** - Impersonation, bulk actions, activity logs, user management
- 🔑 **API Token System** - Personal access tokens with scopes and expiration
- 📈 **Database Optimization** - Indexed queries, migration scripts, performance tracking

### Admin & Operations
- 👨‍💼 **Admin Dashboard** - User management, revenue analytics, platform statistics
- 📊 **Activity Logs** - Track all admin actions with timestamps and user context
- 🔄 **Bulk Operations** - Manage multiple users efficiently
- 💰 **Revenue Tracking** - Subscription analytics and financial reporting

### Studio App - Configuration Management
- ⚙️ **Configuration Editor** - Form-based UI for portal settings
- 🎨 **Preset Selection** - Choose from generic or pre-built templates
- 💾 **Database Persistence** - All configs stored in PostgreSQL

### Infrastructure & DevOps
- 🛡️ **Security Hardening** - CSP headers, rate limiting, input validation
- 📊 **Monitoring** - Sentry error tracking with performance monitoring
- ✅ **Automated Testing** - 86+ unit tests, 36+ E2E tests with Playwright
- 🚀 **CI/CD Pipeline** - GitHub Actions with lint, test, build, security scanning
- 📸 **Visual Testing** - Percy snapshot comparison for regression detection

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or 20.x (LTS)
- **npm**: Version 8.x or higher
- **PostgreSQL**: Version 14+ (or use Prisma's local dev database)
- **Git**: For version control

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Mr-E77/Member-Portal.git
   cd Member-Portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables for the portal app:
   ```bash
   cd apps/portal
   cp .env.example .env
   # Edit .env with your database and OAuth credentials
   ```

4. Run database migrations:
   ```bash
   cd apps/portal
   npx prisma migrate dev
   ```

5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

## Usage

### Running the Portal App

```bash
npm run dev:portal
```

Visit http://localhost:3000 for the generic preset or http://localhost:3000/campus for the Campus Sound preset.

### Running the Studio App

```bash
npm run dev:studio
```

Visit http://localhost:3001 to access the configuration design studio.

### Building for Production

```bash
# Build portal
npm run build:portal

# Build studio
npm run build:studio
```

## Configuration

### Environment Variables (Portal)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mre_portal"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
PORTAL_CONFIG_ID="generic-default"
NEXT_PUBLIC_PRESET="generic"
```

### Creating a New Preset

1. Create a new config file in `apps/portal/src/config/`:
   ```typescript
   // myPresetConfig.ts
   export const myPresetConfig: PortalConfig = {
     id: "my-preset-v1",
     preset: "my-preset",
     platformName: "My Platform",
     // ... other fields
   };
   ```

2. Update `apps/portal/src/config/index.ts` to include the new preset

3. Optionally create preset-specific components or routes

### Configuring Sections

Each portal config includes a `sections` array:

```typescript
sections: [
  { type: "hero", enabled: true, order: 1 },
  { type: "login-card", enabled: true, order: 2 },
  { type: "features-grid", enabled: true, order: 3 },
  { type: "membership-tiers", enabled: true, order: 4 },
  { type: "programs", enabled: false, order: 5 },
  { type: "callout", enabled: true, order: 6 }
]
```

- `enabled`: Controls whether the section renders
- `order`: Determines the vertical order on the page

## Project Structure
   cd Member-Portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration.

## Usage

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or the port specified in your configuration).

### Production Build

Build the application for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Linting

Run the linter to check code quality:
```bash
npm run lint
```

### Testing

Run the test suite:
```bash
npm test
```

## 📊 Performance & Monitoring

### Lighthouse CI
- **Coverage:** Automated performance testing on `/` and `/campus`
- **Budgets:**
  - `/`: FCP 2.0s, LCP 2.5s, Speed Index 2.8s, size 180 KB (scripts 90 KB)
  - `/campus`: FCP 2.2s, LCP 2.7s, Speed Index 3.0s, size 200 KB (scripts 100 KB)
- **Run Locally:**
  ```bash
  npm run build --workspace=portal && cd apps/portal
  npm run perf:serve & npx wait-on http://localhost:3000
  npm run perf:lhci
  ```

### Monitoring & Observability
- **Error Tracking:** Sentry with session replays and performance monitoring
- **Health Checks:** `/api/health` endpoints for uptime monitoring
- **Dashboard:** Real-time performance metrics and alerts
- **Setup:** See [MONITORING.md](MONITORING.md)

---

## 🚀 Deployment

### Quick Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy portal app
cd apps/portal && vercel --prod

# Deploy studio app
cd apps/studio && vercel --prod
```

### Other Platforms
See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Netlify deployment
- Railway deployment
- AWS Lambda/EC2
- Custom VPS servers

### Pre-Launch Checklist
- ✅ All tests passing (`npm test && npm run test:e2e`)
- ✅ Environment variables configured
- ✅ Database migrations deployed
- ✅ OAuth providers configured
- ✅ Production secrets secured
- ✅ Security audit completed ([SECURITY_AUDIT.md](SECURITY_AUDIT.md))
- ✅ Compliance verified ([COMPLIANCE.md](COMPLIANCE.md))

---

## 🤝 Contributing

We welcome contributions! Please:
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit with clear messages (`git commit -m 'feat: add amazing feature'`)
3. Push to your branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

**Code Standards:**
- Use TypeScript for type safety
- Follow ESLint configuration
- Write tests for new features
- Update documentation

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 📞 Support & Contact

- **Issues:** [GitHub Issues](https://github.com/Mr-E77/Member-Portal/issues)
- **Email:** support@codexbuild.com
- **Documentation:** See [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

## 🎉 Project Status

| Metric | Status | Details |
|--------|--------|---------|
| Core Features | ✅ Complete | 5 features implemented in Phase 1 |
| Test Coverage | ✅ 86+ Tests | Unit, integration, E2E automated tests |
| Security | 🔄 In Progress | Phase 2 security audit underway |
| Performance | ✅ Optimized | Lighthouse targets met |
| Documentation | ✅ Complete | 15+ comprehensive guides |
| Launch Readiness | 📋 Scheduled | Q4 2026 |

---

**Built with ❤️ by the Codex Build Team**  
**Last Updated:** January 12, 2026
