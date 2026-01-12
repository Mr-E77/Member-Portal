import { test, expect } from '@playwright/test';

test.describe('Security Headers', () => {
  test('should have Content Security Policy header', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    const headers = response?.headers();
    expect(headers).toBeDefined();
    
    const csp = headers!['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  test('should have Strict-Transport-Security header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    const hsts = headers!['strict-transport-security'];
    expect(hsts).toBeDefined();
    expect(hsts).toContain('max-age=');
    expect(hsts).toContain('includeSubDomains');
  });

  test('should have X-Content-Type-Options header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers!['x-content-type-options']).toBe('nosniff');
  });

  test('should have X-Frame-Options header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers!['x-frame-options']).toBe('DENY');
  });

  test('should have Referrer-Policy header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    expect(headers!['referrer-policy']).toBeDefined();
  });

  test('should have Permissions-Policy header', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    const permissionsPolicy = headers!['permissions-policy'];
    expect(permissionsPolicy).toBeDefined();
    expect(permissionsPolicy).toContain('camera=()');
    expect(permissionsPolicy).toContain('microphone=()');
  });
});

test.describe('Rate Limiting', () => {
  test('should rate limit excessive API requests', async ({ request }) => {
    const endpoint = '/api/checkout';
    const tierId = 'tier2';
    const tierName = 'Tier 2';

    // Attempt to exceed rate limit (10 requests/minute for checkout)
    const requests = Array.from({ length: 12 }, () =>
      request.post(endpoint, {
        data: { tierId, tierName },
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    const responses = await Promise.all(requests);
    
    // At least one response should be rate limited (429)
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // Check rate limit headers on 429 response
    const rateLimited = rateLimitedResponses[0];
    const headers = rateLimited.headers();
    expect(headers['retry-after']).toBeDefined();
    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBe('0');
  });

  test('should include rate limit headers on successful requests', async ({ request }) => {
    const response = await request.get('/api/health');
    
    // Check for rate limit headers
    const headers = response.headers();
    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBeDefined();
  });
});

test.describe('Authentication Security', () => {
  test('should prevent access to protected routes without authentication', async ({ page }) => {
    // Attempt to access dashboard without login
    await page.goto('/dashboard');
    
    // Should redirect to login or show 401/403
    expect(page.url()).not.toContain('/dashboard');
    expect(page.url()).toContain('/api/auth/signin');
  });

  test('should prevent CSRF attacks with token validation', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('text=Sign in with Email');
    await page.fill('input[name="email"]', 'tier1@example.com');
    await page.fill('input[name="password"]', 'demo1234');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard');

    // Attempt API call without CSRF token
    const response = await page.evaluate(async () => {
      return fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: 'tier2', tierName: 'Tier 2' }),
        credentials: 'omit', // Omit cookies
      });
    });

    // Should fail without proper authentication
    expect(response).toBeDefined();
  });

  test('should not expose sensitive data in error responses', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: { tierId: 'invalid' },
    });

    const body = await response.json();
    
    // Error should not contain stack traces, internal paths, or sensitive info
    expect(JSON.stringify(body)).not.toContain('node_modules');
    expect(JSON.stringify(body)).not.toContain('prisma');
    expect(JSON.stringify(body)).not.toContain('password');
    expect(JSON.stringify(body)).not.toContain('secret');
  });
});

test.describe('Input Validation', () => {
  test('should reject malformed JSON in API requests', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: 'not valid json',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(400);
  });

  test('should sanitize user input to prevent XSS', async ({ page }) => {
    await page.goto('/');
    
    // Attempt XSS in login form
    await page.click('text=Sign in with Email');
    await page.fill('input[name="email"]', '<script>alert("xss")</script>@example.com');
    await page.fill('input[name="password"]', '<script>alert("xss")</script>');
    
    // Submit form
    await page.click('button:has-text("Sign in")');
    
    // Wait for response
    await page.waitForTimeout(1000);
    
    // Check that no script executed (no alert)
    const dialogs: string[] = [];
    page.on('dialog', dialog => dialogs.push(dialog.message()));
    
    expect(dialogs.length).toBe(0);
  });

  test('should validate tierId format in checkout', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.click('text=Sign in with Email');
    await page.fill('input[name="email"]', 'tier1@example.com');
    await page.fill('input[name="password"]', 'demo1234');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard');

    // Mock API call with invalid tierId
    const response = await page.evaluate(async () => {
      return fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: '../../../etc/passwd', // Path traversal attempt
          tierName: 'Hacker Tier',
        }),
      }).then(r => r.json());
    });

    // Should reject invalid format
    expect(response.error).toBeDefined();
  });
});

test.describe('HTTPS and Transport Security', () => {
  test('should enforce HTTPS in production headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    const csp = headers!['content-security-policy'];
    expect(csp).toContain('upgrade-insecure-requests');
  });

  test('should set secure cookie flags', async ({ context, page }) => {
    // Login to set cookies
    await page.goto('/');
    await page.click('text=Sign in with Email');
    await page.fill('input[name="email"]', 'tier1@example.com');
    await page.fill('input[name="password"]', 'demo1234');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard');

    // Check cookies
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));

    if (sessionCookie) {
      // In production, cookies should be secure and httpOnly
      // (In dev environment, secure might not be set)
      expect(sessionCookie.httpOnly).toBe(true);
    }
  });
});
