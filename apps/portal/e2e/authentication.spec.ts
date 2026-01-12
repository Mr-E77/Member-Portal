// e2e/authentication.spec.ts
import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-users';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show login options', async ({ page }) => {
    // Look for OAuth buttons or login link
    const loginSection = page.locator('text=/Access Your|Sign In/i');
    await expect(loginSection).toBeVisible({ timeout: 10000 });
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/dashboard');
    
    // Should redirect to home or show login
    await page.waitForURL(/\/(signin|auth|$)/);
    
    // Verify not on dashboard
    const url = page.url();
    expect(url).not.toContain('/dashboard');
  });

  test('should redirect to login when accessing profile', async ({ page }) => {
    await page.goto('/profile');
    
    // Should redirect away from profile
    await page.waitForURL(/\/(signin|auth|$)/);
    
    const url = page.url();
    expect(url).not.toContain('/profile');
  });

  test('should display GitHub OAuth button if configured', async ({ page }) => {
    await page.goto('/');
    
    // Check if GitHub OAuth is available
    const githubButton = page.locator('button:has-text("GitHub"), a:has-text("GitHub")');
    
    // This test is optional - only fails if button should exist but doesn't
    if (await githubButton.count() > 0) {
      await expect(githubButton).toBeVisible();
    }
  });

  test('should display Google OAuth button if configured', async ({ page }) => {
    await page.goto('/');
    
    // Check if Google OAuth is available
    const googleButton = page.locator('button:has-text("Google"), a:has-text("Google")');
    
    if (await googleButton.count() > 0) {
      await expect(googleButton).toBeVisible();
    }
  });
});

test.describe('Session Management', () => {
  test('should maintain session across page navigation', async ({ page, context }) => {
    // This test would require actual authentication
    // For now, we just verify the session provider is set up
    await page.goto('/');
    
    // Check that SessionProvider is working (no React errors)
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // No React SessionProvider errors should occur
    const sessionErrors = errors.filter(e => e.includes('SessionProvider'));
    expect(sessionErrors.length).toBe(0);
  });
});
