import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
    capture_pageview: false, // We'll manually capture pageviews
    capture_pageleave: true,
    autocapture: false, // Manual event tracking for better control
  });
}

export { posthog };

/**
 * Track page view
 */
export function trackPageView(pageName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  posthog.capture('$pageview', { page: pageName, ...properties });
}

/**
 * Identify user
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  posthog.identify(userId, properties);
}

/**
 * Track custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  posthog.capture(eventName, properties);
}

/**
 * Reset user identity (on logout)
 */
export function resetAnalytics() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}
