'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import * as Sentry from '@sentry/nextjs';

interface UpgradeButtonProps {
  tierId: string;
  tierName: string;
  currentTier: string;
  disabled?: boolean;
}

export function UpgradeButton({
  tierId,
  tierName,
  currentTier,
  disabled = false,
}: UpgradeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentTier = currentTier === tierId;

  const handleUpgrade = async () => {
    if (isCurrentTier) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      Sentry.addBreadcrumb({
        message: `Attempting upgrade to tier: ${tierName}`,
        category: 'payment',
        level: 'info',
      });

      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tierId,
          tierName,
          successUrl: `${window.location.origin}/dashboard?upgrade=success`,
          cancelUrl: `${window.location.origin}/dashboard?upgrade=canceled`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      Sentry.captureException(err, {
        context: 'tier-upgrade',
        tierId,
        tierName,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleUpgrade}
        disabled={disabled || isCurrentTier || loading}
        className={`px-4 py-2 rounded font-semibold transition ${
          isCurrentTier
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : disabled || loading
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? 'Processing...' : isCurrentTier ? 'Current Tier' : 'Upgrade'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
