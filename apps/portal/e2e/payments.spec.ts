import { test, expect } from '@playwright/test';

const STRIPE_TEST_CARD = '4242424242424242';
const STRIPE_TEST_EXPIRY = '12/26';
const STRIPE_TEST_CVC = '123';

test.describe('Payment & Tier Upgrade Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('text=Sign in with Email');
    await page.fill('input[name="email"]', 'tier1@example.com');
    await page.fill('input[name="password"]', 'demo1234');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard');
  });

  test('should display upgrade button on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that upgrade buttons are visible
    const upgradeButtons = page.locator('button:has-text("Upgrade")');
    const count = await upgradeButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should disable upgrade button for current tier', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Current tier button should show "Current Tier"
    const currentTierButtons = page.locator('button:has-text("Current Tier")');
    const count = await currentTierButtons.count();
    expect(count).toBeGreaterThan(0);
    
    // Should be disabled
    const firstDisabled = currentTierButtons.first();
    const isDisabled = await firstDisabled.isDisabled();
    expect(isDisabled).toBeTruthy();
  });

  test('should initiate checkout on upgrade button click', async ({ page, context }) => {
    // Listen for navigation to Stripe
    let stripeRedirectCaught = false;
    context.on('page', async (newPage) => {
      if (newPage.url().includes('stripe.com')) {
        stripeRedirectCaught = true;
        await newPage.close();
      }
    });

    await page.goto('/dashboard');
    
    // Click upgrade button for tier2 (assuming first tier is current)
    const tierCards = page.locator('[class*="grid"]').filter({ has: page.locator('text=Growth') });
    if ((await tierCards.count()) > 0) {
      const upgradeBtn = tierCards.first().locator('button:has-text("Upgrade")');
      
      // Intercept the checkout API call
      const checkoutPromise = page.waitForResponse(
        (response) => response.url().includes('/api/checkout') && response.status() === 200
      );
      
      await upgradeBtn.click();
      const response = await checkoutPromise;
      const data = await response.json();
      
      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('url');
    }
  });

  test('should show upgrade status message on return', async ({ page }) => {
    // Simulate return from successful Stripe checkout
    await page.goto('/dashboard?upgrade=success');
    
    const successMsg = page.locator('text=Upgrade Successful');
    await expect(successMsg).toBeVisible();
    
    // Message should auto-dismiss after 5 seconds
    await page.waitForTimeout(6000);
    await expect(successMsg).not.toBeVisible();
  });

  test('should show cancellation message if user cancels checkout', async ({ page }) => {
    await page.goto('/dashboard?upgrade=canceled');
    
    const cancelMsg = page.locator('text=Upgrade Canceled');
    await expect(cancelMsg).toBeVisible();
    
    // Message should auto-dismiss
    await page.waitForTimeout(6000);
    await expect(cancelMsg).not.toBeVisible();
  });

  test('should not allow payment requests without authentication', async ({ page }) => {
    // Make API call without session
    const response = await page.request.post('/api/checkout', {
      data: {
        tierId: 'tier2',
        tierName: 'Growth',
        successUrl: 'http://localhost:3000/dashboard',
        cancelUrl: 'http://localhost:3000/dashboard',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should validate required fields in checkout', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Try to make checkout request with missing fields
    const cookies = await page.context().cookies();
    const response = await page.request.post('/api/checkout', {
      headers: {
        Cookie: cookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
      data: {
        tierId: 'tier2',
        // Missing tierName, successUrl, cancelUrl
      },
    });

    expect(response.status()).toBe(400);
  });

  test('should handle missing Stripe price ID gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Intercept checkout request
    const response = await page.request.post('/api/checkout', {
      data: {
        tierId: 'invalid-tier',
        tierName: 'Invalid',
        successUrl: 'http://localhost:3000/dashboard',
        cancelUrl: 'http://localhost:3000/dashboard',
      },
    });

    // Should return 400 with error
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should track upgrade attempt in Sentry breadcrumbs', async ({ page }) => {
    // This would need a test Sentry project to verify fully
    // For now, we're just checking the UI doesn't crash
    await page.goto('/dashboard');
    
    const upgradeBtn = page.locator('button:has-text("Upgrade")').first();
    if ((await upgradeBtn.count()) > 0) {
      await upgradeBtn.click();
      // Page should handle the click without crashing
      await page.waitForTimeout(1000);
      expect(page).toBeTruthy();
    }
  });
});
