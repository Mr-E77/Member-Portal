// e2e/landing-page.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check page loaded
    await expect(page).toHaveTitle(/Mr.E Generic Membership Platform/i);
    
    // Check hero section
    await expect(page.locator('h1')).toContainText('Welcome to Mr.E');
  });

  test('should display all main sections', async ({ page }) => {
    await page.goto('/');
    
    // Check for key sections
    const heroSection = page.locator('text=Welcome to Mr.E');
    await expect(heroSection).toBeVisible();
    
    // Check for membership tiers
    const tiersSection = page.locator('text=Membership Tiers');
    await expect(tiersSection).toBeVisible();
    
    // Check for features
    const featuresSection = page.locator('text=Features');
    await expect(featuresSection).toBeVisible();
  });

  test('should display auth options', async ({ page }) => {
    await page.goto('/');
    
    // Check for login/signup buttons
    const signInButton = page.locator('text=/Sign In|Log In/i').first();
    await expect(signInButton).toBeVisible();
  });

  test('should have responsive layout', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
  });
});
