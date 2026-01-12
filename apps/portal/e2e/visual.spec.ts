import { test } from '@playwright/test';
import { percySnapshot } from '@percy/playwright';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for visual tests
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('landing page visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture full page
    await percySnapshot(page, 'Landing Page - Full');
    
    // Capture hero section
    const hero = page.locator('section:first-child');
    await percySnapshot(hero, 'Landing Page - Hero Section');
  });

  test('pricing section visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to pricing
    const pricing = page.locator('text=Choose your plan').first();
    await pricing.scrollIntoViewIfNeeded();
    
    // Capture pricing cards
    await percySnapshot(page.locator('section:has-text("Choose your plan")'), 'Pricing Section');
  });

  test('dashboard visual snapshot (authenticated)', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.click('text=Sign in with Email');
    await page.fill('input[name="email"]', 'tier1@example.com');
    await page.fill('input[name="password"]', 'demo1234');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard');
    
    // Capture dashboard layout
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Dashboard - Full Layout');
    
    // Capture tier cards with upgrade buttons
    const tierSection = page.locator('main');
    await percySnapshot(tierSection, 'Dashboard - Tier Cards');
  });

  test('dashboard responsive visual snapshot (mobile)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.goto('/');
    await page.click('text=Sign in with Email');
    await page.fill('input[name="email"]', 'tier1@example.com');
    await page.fill('input[name="password"]', 'demo1234');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard');
    
    // Capture mobile dashboard
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Dashboard - Mobile');
  });

  test('campus page visual snapshot', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.click('text=Sign in with Email');
    await page.fill('input[name="email"]', 'tier1@example.com');
    await page.fill('input[name="password"]', 'demo1234');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard');
    
    // Navigate to campus
    await page.goto('/campus');
    await page.waitForLoadState('networkidle');
    
    // Capture campus page
    await percySnapshot(page, 'Campus Page - Full');
  });

  test('error state visual snapshot', async ({ page }) => {
    // Navigate to non-existent page to trigger error
    await page.goto('/nonexistent', { waitUntil: 'networkidle' });
    
    // Capture error page
    await percySnapshot(page, 'Error Page - 404');
  });

  test('loading state visual snapshot', async ({ page }) => {
    // Intercept network to see loading state
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Capture loading state
    await percySnapshot(page, 'Landing Page - Loading State');
  });

  test('button states visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture buttons in different states
    const buttons = page.locator('button');
    
    // Hover over first button
    const firstButton = buttons.first();
    await firstButton.hover();
    
    await percySnapshot(page, 'Buttons - Various States');
  });

  test('form visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign in with Email');
    await page.waitForLoadState('networkidle');
    
    // Capture login form
    await percySnapshot(page, 'Login Form');
  });

  test('navigation bar visual snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture nav bar
    await percySnapshot(page.locator('header, nav').first(), 'Navigation Bar');
  });
});
