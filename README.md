# Mr.E Generic Membership Platform

A flexible, config-driven membership portal platform built with Next.js, TypeScript, Prisma, and NextAuth. This monorepo contains both the member-facing portal and a design studio for creating and managing portal configurations.

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
- **Config-Driven Sections**: Dynamic page rendering based on configuration
- **Responsive Design**: Tailwind CSS for modern, mobile-first UI

### Studio App
- **Configuration Management**: Create and edit portal configurations
- **Form-Based Editor**: Simple form interface for common settings
- **Preset Selection**: Choose between generic and preset-specific configs
- **Database Persistence**: Save configurations to PostgreSQL

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

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Quick deployment overview:
- Build the production bundle
- Deploy to your hosting platform (Vercel, Netlify, AWS, etc.)
- Configure environment variables
- Set up custom domain (optional)

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
