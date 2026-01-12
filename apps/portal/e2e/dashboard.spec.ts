// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test('should be protected and redirect unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to home or login page
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url).not.toContain('/dashboard');
  });

  test('should not be accessible without session', async ({ page }) => {
    // Clear all cookies/storage
    await page.context().clearCookies();
    
    await page.goto('/dashboard');
    
    // Wait for redirect
    await page.waitForTimeout(2000);
    
    // Should be redirected
    const finalUrl = page.url();
    expect(finalUrl).not.toMatch(/\/dashboard$/);
  });
});

test.describe('Profile Page', () => {
  test('should be protected and redirect unauthenticated users', async ({ page }) => {
    await page.goto('/profile');
    
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url).not.toContain('/profile');
  });

  test('should not be accessible without session', async ({ page }) => {
    await page.context().clearCookies();
    
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    
    const finalUrl = page.url();
    expect(finalUrl).not.toMatch(/\/profile$/);
  });
});
