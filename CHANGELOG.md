# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Mr.E Generic Membership Platform (Major Refactor)

#### Infrastructure & Architecture
- Monorepo structure with npm workspaces
- `apps/portal` - Next.js member-facing portal application
- `apps/studio` - Next.js configuration design studio
- `packages/ui` - Shared React component library
- `packages/core` - Shared business logic (placeholder)
- `presets/` - Configuration presets (generic and campus-sound)

#### Portal App Features
- Config-driven portal architecture with TypeScript types
- Generic preset: "Mr.E Generic Membership Platform"
- Campus Sound United preset with dedicated route
- NextAuth authentication with email, GitHub, and Google OAuth
- Prisma ORM with PostgreSQL database
- Protected routes with middleware authentication
- Member dashboard showing current tier and features
- "Mr.E Profile" page with editable user information
- Dynamic section rendering based on configuration
- 4-tier membership system (Starter, Growth, Pro, Elite)
- Responsive landing page with:
  - Hero section
  - Login card with OAuth buttons
  - Features grid
  - Membership tiers display
  - Programs section (configurable)
  - Call-to-action section

#### Studio App Features
- Configuration listing and management
- Form-based config editor for portal settings
- Preset selection (generic, campus-sound)
- Auth options configuration
- Membership tier CRUD
- Section toggles and ordering
- Database persistence for configurations

#### Shared Components
- Button component with variants
- Card component
- Section wrapper component
- TierCard component for membership display
- Full Tailwind CSS integration

#### Database & Schema
- User model with membership tier tracking
- Account model for OAuth providers
- Session model for NextAuth
- VerificationToken model
- PortalConfigModel for storing portal configurations
- Prisma migrations setup

#### Configuration System
- `PortalConfig` TypeScript type
- `genericConfig` with Mr.E branding
- `campusSoundConfig` with music-focused branding
- Config loader with database fallback
- Section-based layout system
- Membership tier definitions
- Auth provider options

### Changed
- Moved existing static HTML/CSS to `presets/campus-sound/`
- Updated README.md with comprehensive platform documentation
- Updated DEPLOYMENT.md with database and OAuth setup instructions
- Repository structure from static site to Next.js monorepo
- Node.js version requirements to 18.x/20.x LTS
- npm version requirements to 8.x or higher

### Technical Stack
- Next.js 16.x (App Router)
- TypeScript
- Tailwind CSS
- Prisma 7.x
- NextAuth.js
- PostgreSQL
- React 19

## [0.1.0] - 2026-01-05

### Added
- Initial project setup
- Basic repository structure
- Project initialization

[Unreleased]: https://github.com/Mr-E77/Member-Portal/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Mr-E77/Member-Portal/releases/tag/v0.1.0

