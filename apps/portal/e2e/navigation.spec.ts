// e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between pages without errors', async ({ page }) => {
    await page.goto('/');
    
    // Check console for errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Navigate to campus page if it exists
    const campusLink = page.locator('a[href="/campus"]');
    if (await campusLink.count() > 0) {
      await campusLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/campus');
    }
    
    // Navigate back to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('Download the React DevTools') &&
      !e.includes('DevTools')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should have working links in navigation', async ({ page }) => {
    await page.goto('/');
    
    const links = await page.locator('a[href]').all();
    
    // At least some links should exist
    expect(links.length).toBeGreaterThan(0);
    
    for (const link of links.slice(0, 5)) { // Test first 5 links
      const href = await link.getAttribute('href');
      
      if (href && href.startsWith('/')) {
        // Internal link - verify it's a valid route
        expect(href).toMatch(/^\/[a-z0-9\-\/]*$/i);
      }
    }
  });

  test('should handle browser back button', async ({ page }) => {
    await page.goto('/');
    const homeUrl = page.url();
    
    await page.goto('/campus');
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toBe(homeUrl);
  });

  test('should handle browser forward button', async ({ page }) => {
    await page.goto('/');
    
    await page.goto('/campus');
    const campusUrl = page.url();
    
    await page.goBack();
    await page.goForward();
    
    expect(page.url()).toBe(campusUrl);
  });
});
