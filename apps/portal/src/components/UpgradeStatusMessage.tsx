'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function UpgradeStatusMessage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('upgrade');
  const [visible, setVisible] = useState(!!status);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible || !status) {
    return null;
  }

  if (status === 'success') {
    return (
      <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
        <h3 className="font-semibold mb-1">Upgrade Successful!</h3>
        <p className="text-sm">Your tier has been upgraded. Refreshing page...</p>
      </div>
    );
  }

  if (status === 'canceled') {
    return (
      <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-yellow-800">
        <h3 className="font-semibold mb-1">Upgrade Canceled</h3>
        <p className="text-sm">You've canceled the upgrade. No charges were made.</p>
      </div>
    );
  }

  return null;
}
