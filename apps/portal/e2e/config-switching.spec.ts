// e2e/config-switching.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Configuration Switching', () => {
  test('should display generic config on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check for generic platform name
    const platformName = page.locator('text=/Mr.E Generic|Mr\\.E/i');
    await expect(platformName.first()).toBeVisible();
  });

  test('should display Campus Sound config on /campus route', async ({ page }) => {
    await page.goto('/campus');
    
    await page.waitForLoadState('networkidle');
    
    // Check for Campus Sound branding
    const campusName = page.locator('text=/Campus Sound/i');
    await expect(campusName.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have different membership tiers per config', async ({ page }) => {
    // Check generic tiers
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const genericTiers = page.locator('text=/Starter|Growth|Pro|Elite/i');
    const genericCount = await genericTiers.count();
    expect(genericCount).toBeGreaterThan(0);
    
    // Check campus tiers
    await page.goto('/campus');
    await page.waitForLoadState('networkidle');
    
    const campusTiers = page.locator('text=/Member|Chapter Builder|Campus Leader|Alliance Council/i');
    const campusCount = await campusTiers.count();
    expect(campusCount).toBeGreaterThan(0);
  });
});
