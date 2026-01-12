# Visual Regression Testing with Percy

This document outlines the visual regression testing infrastructure for the Member Portal using [Percy](https://percy.io/), an automated visual testing platform.

## Overview

Visual regression testing captures visual snapshots of your UI and automatically detects visual changes between builds. Percy integrates with your CI/CD pipeline to:

- **Detect unintended visual changes** before they reach production
- **Compare snapshots** across browsers and devices
- **Prevent regression bugs** in UI layouts, colors, typography, and responsiveness
- **Enable code review feedback** on visual changes directly in pull requests
- **Maintain design consistency** across the application

## Architecture

### Percy Integration

**Components:**
- `@percy/cli` - Command-line tool for visual testing
- `@percy/playwright` - Playwright integration for snapshot capture
- `e2e/visual.spec.ts` - Visual regression test suite (11 test scenarios)
- GitHub Actions CI - Automated visual testing on every PR/push

**Workflow:**
```
Code Change → Git Push → GitHub Actions → Playwright Tests
                                              ↓
                                        Percy Snapshots
                                              ↓
                                        Percy Service
                                              ↓
                                    Visual Comparison
                                              ↓
                                    PR Comment/Report
```

## Installation

### Prerequisites

- Node.js 20+
- Playwright browsers installed
- Percy account (free at https://percy.io)

### Setup

1. **Install dependencies:**
```bash
npm install --save-dev @percy/cli @percy/playwright
```

2. **Link Percy project:**
```bash
npx percy link
```
This creates a `.percy.yml` configuration file in your project root.

3. **Generate PERCY_TOKEN:**
- Go to https://percy.io/projects
- Create new project (or select existing)
- Copy the read-only token from project settings
- Add to GitHub repository secrets as `PERCY_TOKEN`

### Configuration Files

**.percy.yml** (created by `percy link`):
```yaml
version: 2
static:
  cleanUrls: true
  include: '**/*.html'
discovery:
  network-idle-timeout: 750
```

**Environment Variables:**
- `PERCY_TOKEN` - Authentication token (set in CI secrets)
- `PERCY_PARALLEL_NONCE` - For parallel test runs
- `PERCY_BRANCH` - Branch name (auto-detected in CI)
- `CI` - Set to `true` in GitHub Actions

## Test Suite

### Visual Test Scenarios (`e2e/visual.spec.ts`)

#### 1. Landing Page Visual Snapshot
- **Purpose:** Verify landing page layout consistency
- **Coverage:** Full page + hero section
- **Breakpoints:** Desktop (1280x720)
- **Elements:** Navigation, hero, CTA buttons

```typescript
test('landing page visual snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await percySnapshot(page, 'Landing Page - Full');
  await percySnapshot(hero, 'Landing Page - Hero Section');
});
```

#### 2. Pricing Section Visual Snapshot
- **Purpose:** Capture pricing tier cards and layout
- **Coverage:** Pricing cards, tier comparisons
- **Elements:** Card styling, badge positioning, button states

#### 3. Dashboard Visual Snapshot (Authenticated)
- **Purpose:** Verify dashboard layout with user data
- **Coverage:** Full dashboard layout
- **Elements:** Sidebar, tier cards, upgrade buttons, data panels

#### 4. Dashboard Mobile Visual Snapshot
- **Purpose:** Verify responsive design on mobile
- **Viewport:** 375x667 (iPhone SE)
- **Elements:** Navigation collapse, card stacking, button sizing

#### 5. Campus Page Visual Snapshot
- **Purpose:** Verify campus/studio listing page
- **Coverage:** Campus cards, filters, layout
- **Elements:** Card grid, metadata display

#### 6. Error State Visual Snapshot
- **Purpose:** Capture 404 error page styling
- **Coverage:** Error page layout, messaging
- **Elements:** Error icon, message text, recovery actions

#### 7. Loading State Visual Snapshot
- **Purpose:** Verify loading indicators and skeleton states
- **Coverage:** Page while loading
- **Elements:** Spinners, skeleton screens, loading bars

#### 8. Button States Visual Snapshot
- **Purpose:** Capture button hover/focus states
- **Coverage:** Various button states (hover, focus, disabled)
- **Elements:** Primary, secondary, danger buttons

#### 9. Login Form Visual Snapshot
- **Purpose:** Verify form styling and layout
- **Coverage:** Sign-in form appearance
- **Elements:** Input fields, labels, validation messages, submit button

#### 10. Navigation Bar Visual Snapshot
- **Purpose:** Capture navigation header consistency
- **Coverage:** Header/navbar layout
- **Elements:** Logo, navigation links, user menu

#### 11. Upgrade Status Messages
- **Purpose:** Verify payment success/error messages
- **Coverage:** Toast/alert styling, dismissal button
- **Elements:** Icon, text, close button

## Running Tests Locally

### Setup Percy Locally

1. **Authenticate with Percy:**
```bash
export PERCY_TOKEN=<your-token>
```

2. **Run visual tests:**
```bash
npx percy exec -- npm run test:e2e -- e2e/visual.spec.ts
```

3. **View results:**
- Percy will output a link to the build results
- Click link to view snapshots in Percy dashboard

### Running Specific Tests

**Run single visual test:**
```bash
npx percy exec -- npm run test:e2e -- e2e/visual.spec.ts -g "landing page"
```

**Run all E2E including visual:**
```bash
npm run test:e2e
```

### Debugging Failed Snapshots

1. **Compare snapshots in Percy dashboard:**
   - Visual diffs highlight pixel-level changes
   - Can zoom in to see exact differences

2. **Common causes of failures:**
   - CSS color changes
   - Font/typography changes
   - Layout shifts (margin, padding, width)
   - Image loading/missing
   - Animation/transition differences

3. **Local troubleshooting:**
```bash
# Run with headed browser to inspect visually
npx playwright test e2e/visual.spec.ts --headed

# Run with debug mode
npx playwright test e2e/visual.spec.ts --debug
```

## CI/CD Integration

### GitHub Actions Configuration

The CI pipeline includes Percy visual regression testing:

**Workflow file:** `.github/workflows/ci.yml`

**Percy job in E2E Tests step:**
```yaml
- name: Run Visual Regression Tests with Percy
  env:
    PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
  run: |
    npx percy exec -- npm run test:e2e -- e2e/visual.spec.ts
```

**GitHub Secrets Required:**
- `PERCY_TOKEN` - Read-only Percy API token
- Other existing secrets: `NEXTAUTH_SECRET`, `DATABASE_URL` (via services)

### Pull Request Integration

When a PR is opened:
1. GitHub Actions runs all jobs including visual tests
2. Percy captures snapshots and compares to main branch
3. Percy comments on PR with:
   - Number of changes detected
   - Link to full visual diff report
   - Approve/reject recommendation

**PR Comment Example:**
```
📸 Percy has created a build of this PR.
8 new snapshots
0 changes
0 removals

View full build: https://percy.io/builds/xyz
```

### Approving Changes

**When visual changes are intentional:**
1. Review diffs in Percy
2. Click "Approve" in Percy dashboard
3. Percy updates PR status to pass
4. PR can proceed to merge

**When visual changes are bugs:**
1. Fix the CSS/component in your code
2. Push new commit
3. New Percy build will run
4. New snapshots captured automatically

## Best Practices

### Snapshot Naming Conventions

Use descriptive names that identify:
- Page/component being tested
- Specific section or state
- Device/breakpoint (optional)

**Good names:**
- `Landing Page - Hero Section`
- `Dashboard - Tier Cards`
- `Dashboard - Mobile`

**Poor names:**
- `Page`
- `Test 1`
- `Snapshot`

### Viewport Consistency

Set consistent viewport sizes for deterministic snapshots:

```typescript
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
});
```

**Standard Breakpoints:**
- Desktop: 1280x720
- Tablet: 768x1024
- Mobile: 375x667

### Avoiding Flaky Snapshots

**Wait for content to load:**
```typescript
await page.waitForLoadState('networkidle');
```

**Wait for specific elements:**
```typescript
await page.waitForSelector('img[data-testid="hero-image"]');
```

**Mock date/time for consistency:**
```typescript
await page.addInitScript(`
  window.Date = class Date extends Date {
    constructor() { super('2026-01-12'); }
  };
`);
```

### Test Organization

Group related tests:
```typescript
test.describe('Landing Page', () => {
  test('hero section snapshot', async ({ page }) => {});
  test('navigation snapshot', async ({ page }) => {});
  test('footer snapshot', async ({ page }) => {});
});
```

### Authentication in Visual Tests

For authenticated routes, set up credentials:
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.click('text=Sign in with Email');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('/dashboard');
});
```

## Maintenance

### Updating Baselines

**Intentional visual changes require baseline updates:**

1. **Local development:**
```bash
# Make design changes
# Run visual tests
npx percy exec -- npm run test:e2e -- e2e/visual.spec.ts

# Review changes in Percy
# If correct, approve build in Percy dashboard
```

2. **In CI/CD:**
- Percy automatically detects main branch as baseline
- Next PR will compare against updated baseline
- New snapshots become the source of truth

### Monitoring Snapshot Health

**Dashboard checks:**
- Monitor for consistently failing snapshots
- Check for flaky tests (intermittent failures)
- Review approval rate and change frequency

**Metrics to track:**
- Average snapshot count per build
- Approval rate (% of changes intentional)
- CI pass rate
- Mean time to visual approval

## Troubleshooting

### Common Issues

**Issue: "PERCY_TOKEN not found"**
- Verify token in GitHub repository settings → Secrets
- Token should be read-only project token (not account token)
- Check environment variable is exported in CI

**Issue: Snapshots not uploading to Percy**
- Verify network connectivity in CI
- Check Percy CLI version: `npx percy --version`
- Verify Playwright is installed: `npx playwright install`

**Issue: Flaky/inconsistent snapshots**
- Add `await page.waitForLoadState('networkidle')`
- Wait for images to load: `await page.waitForSelector('img')`
- Avoid timestamps/dynamic content in snapshots
- Use fixed viewport sizes

**Issue: Snapshots differ only in animation/transitions**
- Disable animations in test environment:
```typescript
await page.addInitScript(`
  document.documentElement.style.setProperty('--animation-duration', '0ms');
`);
```

**Issue: Percy build times are too long**
- Run tests in parallel: `npm run test:e2e -- --workers=4`
- Reduce snapshot count (test fewer pages)
- Use `percy:skip` tag to skip slow tests

### Getting Help

- Percy Documentation: https://docs.percy.io
- Percy CLI Docs: https://github.com/percy/cli
- GitHub Issues: Open issue in repo for setup problems
- Sentry Integration: Visual errors logged to Sentry

## Integration with Other Testing

### Relationship to E2E Tests

- **E2E Tests** (`e2e/payments.spec.ts`, `e2e/auth.spec.ts`): Functional testing, user interactions
- **Visual Tests** (`e2e/visual.spec.ts`): Visual consistency, design verification
- **Unit Tests** (`src/**/*.spec.ts`): Component logic, utilities
- **Lighthouse**: Performance metrics

### Relationship to Sentry Monitoring

- **Sentry**: Tracks runtime errors, performance issues, user sessions
- **Percy**: Tracks visual changes, design regressions
- **Combined**: Comprehensive quality monitoring (functionality + appearance + performance)

## Future Enhancements

**Planned improvements:**

1. **Visual diffs in Sentry:**
   - Link Percy builds from Sentry error tracking
   - Correlate visual changes with error spikes

2. **Component library snapshots:**
   - Add Storybook integration
   - Test component variations (props, states)
   - Build living design system

3. **Accessibility snapshots:**
   - Visual + axe accessibility checks
   - Color contrast verification
   - Responsive layout testing

4. **Performance + visual:**
   - Correlate Lighthouse scores with visual changes
   - Detect performance regressions from CSS bloat

5. **Cross-browser testing:**
   - Expand to Safari, Firefox visual tests
   - Verify platform-specific rendering

## Quick Reference

### Commands

```bash
# Install Percy
npm install --save-dev @percy/cli @percy/playwright

# Authenticate
npx percy link

# Run visual tests locally
npx percy exec -- npm run test:e2e -- e2e/visual.spec.ts

# Run specific visual test
npx percy exec -- npm run test:e2e -- e2e/visual.spec.ts -g "landing page"

# View Percy project
npx percy open

# Check Percy CLI version
npx percy --version
```

### Environment Variables

| Variable | Value | Location |
|----------|-------|----------|
| PERCY_TOKEN | [Read-only token] | GitHub Secrets |
| PERCY_BRANCH | Detected auto | CI environment |
| CI | true | GitHub Actions |
| NEXTAUTH_SECRET | Test secret | CI environment |
| DATABASE_URL | Test DB URL | CI services |

### Files Changed

- `e2e/visual.spec.ts` - New visual regression test suite (11 scenarios)
- `.github/workflows/ci.yml` - Updated with Percy job
- `package.json` - Added `@percy/cli`, `@percy/playwright` dev dependencies
- `.percy.yml` - Percy configuration (created by `percy link`)

## Monitoring

### Sentry Integration

Visual regression issues can trigger Sentry alerts:

```typescript
// In percySnapshot calls, Sentry tracks:
- Breadcrumb: "visual-snapshot-started"
- Breadcrumb: "visual-snapshot-completed"
- If snapshot fails: Error capture with context
```

### Dashboard Access

- **Percy Dashboard:** https://percy.io/projects
- **GitHub Actions:** Repository → Actions tab → "CI/CD Pipeline"
- **Sentry Issues:** https://sentry.io/organizations/mr-e/issues/

---

**Last Updated:** January 12, 2026  
**Version:** 1.0  
**Maintained By:** Development Team  
**Status:** ✅ Active & Monitoring
