# Security Guide

This document outlines the security features, best practices, and vulnerability management for the Member Portal application.

## Table of Contents

- [Security Architecture](#security-architecture)
- [Security Headers](#security-headers)
- [Rate Limiting](#rate-limiting)
- [Authentication & Authorization](#authentication--authorization)
- [Input Validation](#input-validation)
- [Data Protection](#data-protection)
- [OWASP ZAP Security Scanning](#owasp-zap-security-scanning)
- [Security Testing](#security-testing)
- [Vulnerability Management](#vulnerability-management)
- [Production Security Checklist](#production-security-checklist)
- [Incident Response](#incident-response)

---

## Security Architecture

### Defense in Depth

The Member Portal implements multiple layers of security:

1. **Network Layer**: HTTPS enforcement, DNS security
2. **Transport Layer**: TLS 1.2+, HSTS headers
3. **Application Layer**: CSP, rate limiting, input validation
4. **Authentication Layer**: NextAuth with session tokens
5. **Database Layer**: Parameterized queries (Prisma), encrypted connections
6. **Monitoring Layer**: Sentry error tracking, security event logging

### Security Components

```
┌─────────────────────────────────────────┐
│         Client Browser                   │
├─────────────────────────────────────────┤
│  HTTPS/TLS │ CSP │ HSTS │ Secure Cookies│
├─────────────────────────────────────────┤
│         Next.js Middleware               │
│  Rate Limiting │ Auth Check │ Headers   │
├─────────────────────────────────────────┤
│         API Routes                       │
│  Validation │ Sanitization │ Auth       │
├─────────────────────────────────────────┤
│         Prisma ORM                       │
│  Parameterized Queries │ Type Safety    │
├─────────────────────────────────────────┤
│         PostgreSQL Database              │
│  Encryption at Rest │ Access Control    │
└─────────────────────────────────────────┘
```

---

## Security Headers

### Implemented Headers

All responses include the following security headers (configured in `src/middleware.ts`):

#### 1. Content Security Policy (CSP)

**Purpose**: Prevent XSS, code injection, and other content-based attacks.

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://browser.sentry-cdn.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://api.stripe.com https://*.sentry.io https://percy.io;
  frame-src 'self' https://js.stripe.com;
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests
```

**What it does**:
- Restricts resource loading to trusted sources
- Allows Stripe and Sentry integrations
- Blocks inline scripts (except where needed for Next.js)
- Prevents clickjacking via `frame-ancestors 'none'`
- Upgrades insecure requests to HTTPS

#### 2. Strict-Transport-Security (HSTS)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

**What it does**:
- Forces HTTPS for 2 years (63072000 seconds)
- Applies to all subdomains
- Eligible for browser HSTS preload list

#### 3. X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

**What it does**:
- Prevents MIME type sniffing
- Blocks execution of mistyped files

#### 4. X-Frame-Options

```
X-Frame-Options: DENY
```

**What it does**:
- Prevents page from being embedded in iframes
- Mitigates clickjacking attacks

#### 5. X-XSS-Protection

```
X-XSS-Protection: 1; mode=block
```

**What it does**:
- Enables XSS filter in legacy browsers
- Modern browsers use CSP instead

#### 6. Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

**What it does**:
- Sends full URL for same-origin requests
- Sends only origin for cross-origin requests
- Protects sensitive URL parameters

#### 7. Permissions-Policy

```
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

**What it does**:
- Disables camera and microphone access
- Blocks geolocation API
- Opts out of FLoC (privacy protection)

### Testing Security Headers

**Using curl:**
```bash
curl -I https://your-domain.com
```

**Using online tools:**
- https://securityheaders.com
- https://observatory.mozilla.org

---

## Rate Limiting

### Overview

Rate limiting prevents abuse and DoS attacks by restricting request frequency per client.

### Implementation

**In-memory storage** (development/demo):
- `src/lib/rate-limit.ts` - Core rate limiting logic
- `src/middleware.ts` - Global rate limit middleware
- `src/app/api/checkout/rate-limit-route.ts` - Per-endpoint limits

**Production recommendation**: Use Redis or similar distributed cache for:
- Multi-instance deployments
- Persistent rate limit counters
- Better scalability

### Rate Limit Configurations

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| Global (all routes) | 100 req/min | 60s | General abuse prevention |
| `/api/checkout` | 10 req/min | 60s | Payment endpoint protection |
| `/api/webhooks/stripe` | 500 req/min | 60s | High-volume webhook handling |
| `/api/health` | 1000 req/min | 60s | Monitoring/uptime checks |

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2026-01-12T12:34:56.789Z
```

**429 responses include**:
```
Retry-After: 45
```

### Customizing Rate Limits

**For API routes:**

```typescript
import { isRateLimited, strictConfig } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const identifier = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (isRateLimited(identifier, strictConfig)) {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  // Handle request
}
```

**Custom configurations:**

```typescript
const customConfig = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 50, // 50 requests per 5 minutes
};
```

### Production Upgrade: Redis Rate Limiting

**Install dependencies:**
```bash
npm install ioredis
```

**Update `src/lib/rate-limit.ts`:**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function isRateLimited(
  identifier: string,
  config: RateLimitConfig
): Promise<boolean> {
  const key = `rate_limit:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, Math.ceil(config.windowMs / 1000));
  }
  
  return current > config.maxRequests;
}
```

---

## Authentication & Authorization

### NextAuth Configuration

**Authentication providers:**
- Email/Password (credentials)
- GitHub OAuth
- Google OAuth

**Session management:**
- JWT tokens (default)
- Secure cookies with `httpOnly`, `sameSite`, `secure` flags
- 30-day session expiration

### Protected Routes

**Middleware protection** (`src/middleware.ts`):
```typescript
export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/api/:path*"],
};
```

**Route-level protection** (API routes):
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Handle authenticated request
}
```

### CSRF Protection

NextAuth automatically handles CSRF tokens:
- Tokens generated per session
- Validated on state-changing requests (POST, PUT, DELETE)
- Stored in HTTP-only cookies

### Password Security

**Hashing:**
- bcrypt with salt rounds: 10
- Password minimum length: 8 characters
- No plain-text password storage

**Example:**
```typescript
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashedPassword);
```

---

## Input Validation

### Validation Strategy

1. **Client-side**: Basic UX validation (HTML5, React form validation)
2. **Server-side**: Comprehensive validation (never trust client)
3. **Database-level**: Schema constraints, type checking

### Zod Schema Validation

**Example validation schema:**

```typescript
import { z } from 'zod';

const CheckoutSchema = z.object({
  tierId: z.enum(['tier1', 'tier2', 'tier3', 'tier4']),
  tierName: z.string().min(1).max(50),
  priceId: z.string().startsWith('price_'),
});

// In API route
const body = await request.json();
const validated = CheckoutSchema.parse(body);
```

### Sanitization

**HTML sanitization** (for user-generated content):
```bash
npm install dompurify isomorphic-dompurify
```

```typescript
import DOMPurify from 'isomorphic-dompurify';

const clean = DOMPurify.sanitize(userInput);
```

### SQL Injection Prevention

**Prisma ORM**:
- All queries parameterized by default
- No raw SQL string concatenation
- Type-safe query building

**Safe:**
```typescript
await prisma.user.findUnique({
  where: { email: userEmail },
});
```

**Unsafe (never do this):**
```typescript
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userEmail}`; // ❌ DON'T
```

---

## Data Protection

### Sensitive Data Handling

**Environment variables:**
- Never commit secrets to version control
- Use `.env.local` for local development
- Use secret management (GitHub Secrets, AWS Secrets Manager) in production

**Sensitive fields:**
```typescript
// ❌ Don't log sensitive data
console.log('User:', user); // May expose email, password hash

// ✅ Log safely
console.log('User ID:', user.id);
```

### Encryption

**At rest:**
- PostgreSQL encrypted volumes (production)
- Environment variable encryption (GitHub Secrets, Vercel, AWS)

**In transit:**
- HTTPS/TLS for all connections
- Database connections over SSL

### Payment Data (PCI Compliance)

**Stripe integration:**
- No credit card data touches our servers
- Stripe.js handles card input directly
- Webhook signature verification

**Webhook security:**
```typescript
import Stripe from 'stripe';

const signature = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### Data Retention

- User profiles: Retained until account deletion
- Payment records: 7 years (compliance requirement)
- Logs: 90 days (Sentry retention)
- Session tokens: 30 days expiration

---

## OWASP ZAP Security Scanning

### What is OWASP ZAP?

OWASP Zed Attack Proxy (ZAP) is an automated security testing tool that finds vulnerabilities in web applications.

### CI/CD Integration

**GitHub Actions workflow** (`.github/workflows/ci.yml`):

```yaml
- name: Run OWASP ZAP Baseline Scan
  uses: zaproxy/action-baseline@v0.12.0
  with:
    target: 'http://localhost:3000'
    rules_file_name: '.zap/config.yml'
    cmd_options: '-a -j'
```

### ZAP Configuration

**File**: `.zap/config.yml`

**Scan types:**
- **Spider**: Crawls application to discover pages
- **Passive Scan**: Analyzes responses for security issues
- **Active Scan**: Sends attack payloads to test vulnerabilities

**Rules enabled:**
- Cross-Site Scripting (XSS) - HIGH
- SQL Injection - HIGH
- Server-Side Code Injection - HIGH
- CSRF token validation - MEDIUM
- Security header validation - LOW

### Running ZAP Locally

**Prerequisites:**
```bash
docker pull zaproxy/zap-stable
```

**Run baseline scan:**
```bash
# Start application
npm run dev

# In another terminal
docker run -v $(pwd):/zap/wrk/:rw -t zaproxy/zap-stable \
  zap-baseline.py -t http://host.docker.internal:3000 \
  -c .zap/config.yml -r zap-report.html
```

**View report:**
```bash
open zap-report.html
```

### Interpreting Results

**Alert levels:**
- **HIGH** (red): Critical vulnerabilities, fix immediately
- **MEDIUM** (orange): Important issues, fix before production
- **LOW** (yellow): Minor concerns, consider fixing
- **INFO** (blue): Informational, no action needed

**Common false positives:**
- Anti-CSRF tokens (NextAuth handles this)
- Cookie SameSite attribute (set by NextAuth)
- X-Content-Type-Options (set in middleware)

---

## Security Testing

### E2E Security Tests

**File**: `apps/portal/e2e/security.spec.ts`

**Test scenarios (12 tests):**

1. ✅ Security headers validation (CSP, HSTS, X-Frame-Options, etc.)
2. ✅ Rate limiting enforcement
3. ✅ Authentication bypass prevention
4. ✅ CSRF token validation
5. ✅ Sensitive data exposure prevention
6. ✅ Input validation (malformed JSON)
7. ✅ XSS prevention
8. ✅ Path traversal protection
9. ✅ HTTPS enforcement
10. ✅ Secure cookie flags
11. ✅ Error message sanitization
12. ✅ API authorization checks

**Running tests:**
```bash
npm run test:e2e -- e2e/security.spec.ts
```

### Manual Security Testing

**Tools:**
- [securityheaders.com](https://securityheaders.com) - Header analysis
- [Mozilla Observatory](https://observatory.mozilla.org) - Overall security score
- [SSL Labs](https://www.ssllabs.com/ssltest/) - TLS configuration
- [Qualys SSL Test](https://www.ssllabs.com/ssltest/) - Certificate validation

**Checklist:**
- [ ] All pages served over HTTPS
- [ ] Security headers present on all routes
- [ ] Rate limiting works (test with curl loop)
- [ ] Login requires valid credentials
- [ ] Protected routes redirect unauthenticated users
- [ ] API endpoints validate input
- [ ] Error messages don't leak sensitive info

---

## Vulnerability Management

### Dependency Scanning

**npm audit:**
```bash
npm audit
npm audit fix
npm audit fix --force  # Be careful with breaking changes
```

**GitHub Dependabot:**
- Automatically scans dependencies
- Creates PRs for security updates
- Configured in `.github/dependabot.yml`

### Reporting Vulnerabilities

**If you discover a security vulnerability:**

1. **DO NOT** open a public GitHub issue
2. Email security concerns to: [your-security-email@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Response timeline:**
- Acknowledgment: Within 48 hours
- Initial assessment: Within 7 days
- Fix deployed: Within 30 days (based on severity)

### CVE Tracking

Monitor CVEs for dependencies:
- Next.js: https://github.com/vercel/next.js/security/advisories
- Prisma: https://github.com/prisma/prisma/security/advisories
- NextAuth: https://github.com/nextauthjs/next-auth/security/advisories
- Stripe: https://stripe.com/docs/security

---

## Production Security Checklist

### Pre-Deployment

**Environment:**
- [ ] All secrets in environment variables (not hardcoded)
- [ ] `NODE_ENV=production`
- [ ] Database credentials rotated
- [ ] API keys use least-privilege permissions

**Configuration:**
- [ ] HTTPS enforced (no HTTP access)
- [ ] Domain has valid SSL certificate
- [ ] CSP configured for production domains
- [ ] CORS configured (if applicable)
- [ ] Rate limiting enabled

**Database:**
- [ ] Database firewall rules configured
- [ ] Only application server can access database
- [ ] Encryption at rest enabled
- [ ] Regular automated backups scheduled
- [ ] Point-in-time recovery configured

**Monitoring:**
- [ ] Sentry error tracking active
- [ ] Uptime monitoring configured
- [ ] Security event logging enabled
- [ ] Alert notifications set up

**Testing:**
- [ ] All security tests passing
- [ ] ZAP scan shows no HIGH vulnerabilities
- [ ] Penetration testing completed (if required)
- [ ] Load testing passed (rate limits tested)

### Post-Deployment

**Verification:**
- [ ] Security headers present (check with curl/securityheaders.com)
- [ ] HTTPS redirects working
- [ ] Rate limiting active
- [ ] Authentication working
- [ ] Sentry receiving events

**Ongoing:**
- [ ] Weekly dependency updates
- [ ] Monthly security reviews
- [ ] Quarterly penetration tests
- [ ] Annual security audit

---

## Incident Response

### Security Incident Types

1. **Data Breach**: Unauthorized access to user data
2. **DDoS Attack**: Service disruption via traffic flood
3. **Account Compromise**: Unauthorized access to user accounts
4. **Code Injection**: XSS, SQL injection, or other injection attacks
5. **Vulnerability Disclosure**: Public disclosure of zero-day

### Response Process

**1. Detection & Triage (0-1 hour)**
- Identify incident type and severity
- Gather initial evidence (logs, error reports)
- Assemble incident response team

**2. Containment (1-4 hours)**
- Isolate affected systems
- Block malicious traffic/IPs
- Revoke compromised credentials
- Deploy emergency patches

**3. Eradication (4-24 hours)**
- Remove malicious code/access
- Patch vulnerabilities
- Verify system integrity
- Update security configurations

**4. Recovery (24-72 hours)**
- Restore services from clean backups
- Re-enable systems incrementally
- Monitor for re-infection
- Verify normal operations

**5. Post-Incident (1-2 weeks)**
- Document incident timeline
- Conduct root cause analysis
- Update security controls
- Communicate with stakeholders
- File regulatory reports (if required)

### Emergency Contacts

**Internal:**
- Development Lead: [contact]
- DevOps Lead: [contact]
- Security Lead: [contact]

**External:**
- Hosting Provider: [Vercel/AWS Support]
- Database Provider: [provider support]
- Payment Processor: [Stripe Support]

### Communication Plan

**For users (if data breach):**
- Email notification within 72 hours
- Public statement on status page
- Regular updates until resolved

**For regulators (if GDPR/CCPA applies):**
- Notify within 72 hours (GDPR)
- File breach report with relevant authorities

---

## References

### Security Standards

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **OWASP API Security**: https://owasp.org/www-project-api-security/
- **CWE Top 25**: https://cwe.mitre.org/top25/
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework

### Tools & Resources

- **Security Headers**: https://securityheaders.com
- **Mozilla Observatory**: https://observatory.mozilla.org
- **OWASP ZAP**: https://www.zaproxy.org/
- **SSL Labs**: https://www.ssllabs.com/
- **Have I Been Pwned**: https://haveibeenpwned.com/

### Compliance

- **GDPR** (EU): https://gdpr.eu/
- **CCPA** (California): https://oag.ca.gov/privacy/ccpa
- **PCI DSS** (Payments): https://www.pcisecuritystandards.org/
- **SOC 2**: https://www.aicpa.org/soc

---

**Last Updated:** January 12, 2026  
**Version:** 1.0  
**Maintained By:** Security Team  
**Next Review:** February 12, 2026
