# Mr.E Generic Membership Platform

[![CI/CD Pipeline](https://github.com/Mr-E77/Member-Portal/actions/workflows/ci.yml/badge.svg)](https://github.com/Mr-E77/Member-Portal/actions/workflows/ci.yml)
[![Lighthouse CI](https://github.com/Mr-E77/Member-Portal/actions/workflows/ci.yml/badge.svg?branch=main&label=Lighthouse%20CI)](https://github.com/Mr-E77/Member-Portal/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/Mr-E77/Member-Portal/actions/workflows/e2e-scheduled.yml/badge.svg)](https://github.com/Mr-E77/Member-Portal/actions/workflows/e2e-scheduled.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A flexible, config-driven membership portal platform built with Next.js, TypeScript, Prisma, and NextAuth. This monorepo contains both the member-facing portal and a design studio for creating and managing portal configurations.

## 🚀 Quick Links

- **✨ [Complete Feature List](FEATURES.md)** - 150+ implemented features across all categories
- **📚 [Production Deployment Guide](PRODUCTION.md)** - Complete production deployment instructions
- **🧪 [Testing Documentation](TESTING.md)** - Unit, integration, and database testing
- **🎭 [E2E Testing Guide](E2E_TESTING.md)** - End-to-end testing and CI/CD pipeline
- **📸 [Visual Regression Testing](VISUAL_REGRESSION.md)** - Percy visual testing and snapshots
- **🔒 [Security Guide](SECURITY.md)** - Security headers, rate limiting, OWASP ZAP, vulnerability management
- **⚡ [Performance & Budgets](#performance--lighthouse-ci)** - Lighthouse CI budgets and local commands
- **📊 [Monitoring & Observability](MONITORING.md)** - Sentry error tracking, uptime monitoring, performance metrics
- **💳 [Payments & Stripe](PAYMENTS.md)** - Tier upgrades, subscription management, webhook handling
- **📦 [Deployment Options](DEPLOYMENT.md)** - Deploy to Vercel, Netlify, AWS, or custom servers

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

The Mr.E Generic Membership Platform is a multi-tenant membership system that allows you to create custom member portals with different presets and configurations. The platform includes:

- **Portal App**: Member-facing application with authentication, dashboards, and profile management
- **Studio App**: Configuration design tool for creating and managing portal instances
- **Presets**: Pre-built configurations (Generic and Campus Sound United)
- **Shared Packages**: Reusable UI components and core utilities

### What This Platform Does

This platform enables organizations to:

- **Create Multiple Member Portals**: Build distinct portals for different communities or organizations
- **Manage Membership Tiers**: Define and customize 4+ membership levels with unique features
- **Authenticate Members**: Support email/password, GitHub, and Google authentication
- **Customize Portal Experience**: Configure sections, branding, and features per portal
- **Track Member Profiles**: Manage "Mr.E Profile" data for each member
- **Design Studio**: Use a web-based tool to configure portals without code

### Key Capabilities

- **Config-Driven Architecture**: All portal behavior controlled by JSON configurations
- **Multiple Auth Providers**: Email, GitHub, Google OAuth support via NextAuth
- **Database-Backed**: PostgreSQL database with Prisma ORM
- **TypeScript Throughout**: Full type safety across the stack
- **Responsive Design**: Tailwind CSS for modern, mobile-first UI
- **Monorepo Structure**: npm workspaces for shared code and apps
- **Protected Routes**: Middleware-based authentication for dashboard and profile pages

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

## Features

### Portal App
- **Multiple Authentication Methods**: Email/password, GitHub OAuth, Google OAuth
- **Protected Routes**: Middleware-based authentication for sensitive pages
- **Member Dashboard**: Personalized dashboard showing current tier and features
- **Mr.E Profile**: Member profile management with editable fields
- **Membership Tiers**: 4 configurable tiers with upgrade paths
- **Payments & Subscriptions**: Stripe integration for tier upgrades with full webhook support
- **Subscription Management**: View, cancel, and track subscriptions with renewal dates
- **Config-Driven Sections**: Dynamic page rendering based on configuration
- **Responsive Design**: Tailwind CSS for modern, mobile-first UI
- **Performance Optimization**: In-memory caching, bundle splitting, image optimization
- **Analytics Integration**: PostHog event tracking and user identification
- **Admin Dashboard**: User management, revenue tracking, platform statistics

### Studio App
- **Configuration Management**: Create and edit portal configurations
- **Form-Based Editor**: Simple form interface for common settings
- **Preset Selection**: Choose between generic and preset-specific configs
- **Database Persistence**: Save configurations to PostgreSQL

### Infrastructure & DevOps
- **Monitoring & Observability**: Sentry error tracking with performance monitoring
- **Security Hardening**: CSP headers, rate limiting, OWASP ZAP scanning
- **Visual Regression Testing**: Percy snapshots with CI integration
- **E2E Testing**: 36+ Playwright tests covering auth, payments, visual, security
- **CI/CD Pipeline**: GitHub Actions with 7 jobs (lint, test, build, security, visual, lighthouse)
- **Health Checks**: API endpoints for uptime monitoring

### Shared Components
- **Reusable UI Library**: Button, Card, Section, TierCard components
- **Type-Safe**: Full TypeScript support across packages
- **Tailwind Integration**: Consistent styling system

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

## Project Structure

```
Member-Portal/
├── public/              # Static assets
├── src/                 # Source files
│   ├── components/      # React components
│   ├── styles/          # CSS/SCSS files
│   ├── utils/           # Utility functions
│   └── index.js         # Entry point
├── .env.example         # Environment variables template
├── package.json         # Project dependencies
└── README.md            # This file
```

## Development

### Code Style

This project follows standard JavaScript/React coding conventions:
- Use ES6+ features
- Follow ESLint rules
- Use meaningful variable and function names
- Write clear comments for complex logic

### Branch Strategy

- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `hotfix/*`: Emergency fixes

### Making Changes

1. Create a new branch from `develop`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Performance & Lighthouse CI

- **CI coverage:** Lighthouse runs on `/` and `/campus` with budgets for FCP, LCP, Speed Index, and total bundle size. Budgets fail the build if performance regresses.
- **Local run:**
   ```bash
   npm run build --workspace=portal
   cd apps/portal
   npm run perf:serve &
   npx wait-on http://localhost:3000
   npm run perf:lhci
   ```
- **Budgets:**
   - `/`: FCP 2.0s, LCP 2.5s, Speed Index 2.8s, total size 180 KB, scripts 90 KB
   - `/campus`: FCP 2.2s, LCP 2.7s, Speed Index 3.0s, total size 200 KB, scripts 100 KB

## Monitoring & Observability

- **Error tracking:** Sentry integration with automatic error capture, session replays, and user context
- **Health checks:** `/api/health` endpoints on both apps for uptime monitoring (e.g., UptimeRobot)
- **Performance monitoring:** Automatic transaction tracking and performance alerts
- **Setup:** See [MONITORING.md](MONITORING.md) for complete setup guide

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy portal
cd apps/portal
vercel --prod

# Deploy studio
cd apps/studio
vercel --prod
```

**Alternative Platforms:**
- See [DEPLOYMENT.md](DEPLOYMENT.md) for Netlify, Railway, AWS, and custom server options

### Pre-Deployment Checklist

- ✅ All tests passing (`npm test` and `npm run test:e2e`)
- ✅ Environment variables configured
- ✅ Database migrations deployed
- ✅ OAuth apps created and configured
- ✅ Production secrets generated
- ✅ Custom domain DNS configured (optional)

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions, please:
- Open an issue on GitHub
- Contact the development team at support@codexbuild.com

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed history of changes.

---

**Built with ❤️ by the Codex Build Team**
