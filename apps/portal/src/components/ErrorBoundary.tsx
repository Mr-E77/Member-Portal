'use client';

import * as Sentry from '@sentry/nextjs';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorBoundary({ children, fallback }: Props) {
  return (
    <Sentry.ErrorBoundary
      fallback={
        fallback || (
          <div className="flex min-h-screen items-center justify-center bg-red-50">
            <div className="rounded-lg bg-white p-8 shadow-lg">
              <h1 className="mb-4 text-2xl font-bold text-red-600">
                Something went wrong
              </h1>
              <p className="mb-6 text-gray-700">
                We're sorry for the inconvenience. Our team has been notified and is
                working on a fix.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="rounded bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      }
      showDialog
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
