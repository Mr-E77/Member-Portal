'use client';

import { useState, useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Subscription {
  id: string;
  currentTier: string;
  status: string;
  startDate: string;
  renewalDate: string | null;
  canceledAt: string | null;
}

export function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscription');
      const data = await response.json();

      if (response.ok) {
        setSubscriptions(data.subscriptions || []);
      } else {
        setError(data.error || 'Failed to load subscriptions');
      }
    } catch (err) {
      setError('An error occurred while loading subscriptions');
      Sentry.captureException(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription? You will lose access to premium features.')) {
      return;
    }

    setCanceling(subscriptionId);
    Sentry.addBreadcrumb({
      category: 'subscription',
      message: 'User initiated subscription cancellation',
      level: 'info',
    });

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh subscriptions
        await fetchSubscriptions();
        alert('Subscription canceled successfully. You will retain access until the end of your billing period.');
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError('An error occurred while canceling subscription');
      Sentry.captureException(err);
    } finally {
      setCanceling(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">Loading subscriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">No active subscriptions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Subscriptions</h3>
      
      {subscriptions.map((subscription) => (
        <div
          key={subscription.id}
          className="rounded-lg border border-gray-200 p-6 space-y-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold capitalize">
                {subscription.currentTier.replace('tier', 'Tier ')}
              </h4>
              <p className="text-sm text-gray-600">
                Status:{' '}
                <span
                  className={
                    subscription.status === 'active'
                      ? 'text-green-600 font-medium'
                      : subscription.status === 'past_due'
                      ? 'text-yellow-600 font-medium'
                      : 'text-gray-600'
                  }
                >
                  {subscription.status}
                </span>
              </p>
            </div>

            {subscription.status === 'active' && !subscription.canceledAt && (
              <button
                onClick={() => handleCancel(subscription.id)}
                disabled={canceling === subscription.id}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canceling === subscription.id ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Start Date</p>
              <p className="font-medium">
                {new Date(subscription.startDate).toLocaleDateString()}
              </p>
            </div>

            {subscription.renewalDate && (
              <div>
                <p className="text-gray-500">
                  {subscription.canceledAt ? 'Access Until' : 'Next Billing'}
                </p>
                <p className="font-medium">
                  {new Date(subscription.renewalDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {subscription.canceledAt && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ This subscription has been canceled. You will retain access until{' '}
                {subscription.renewalDate
                  ? new Date(subscription.renewalDate).toLocaleDateString()
                  : 'the end of your billing period'}
                .
              </p>
            </div>
          )}

          {subscription.status === 'past_due' && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">
                ⚠️ Payment failed. Please update your payment method to continue your subscription.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
