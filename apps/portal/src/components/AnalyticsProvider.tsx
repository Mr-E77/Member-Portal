'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { posthog, identifyUser, trackPageView } from '@/lib/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Track page views
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname, {
        search: searchParams?.toString(),
      });
    }
  }, [pathname, searchParams]);

  // Identify user
  useEffect(() => {
    if (session?.user) {
      identifyUser(session.user.id || session.user.email || '', {
        email: session.user.email,
        name: session.user.name,
        membershipTier: (session.user as any).membershipTier,
      });
    }
  }, [session]);

  return <>{children}</>;
}
