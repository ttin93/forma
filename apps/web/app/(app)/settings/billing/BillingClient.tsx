'use client';

import { useState } from 'react';

interface Props {
  isOnPaidPlan: boolean;
  subscriptionId: string | null;
  portalOnly?: boolean;
}

export default function BillingClient({ isOnPaidPlan, subscriptionId, portalOnly }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpgrade() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/v1/billing/checkout', { method: 'POST' });
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? 'Failed to create checkout');
      setLoading(false);
    }
  }

  async function handlePortal() {
    if (!subscriptionId) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/v1/billing/portal', { method: 'POST' });
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      window.open(url, '_blank');
    } else {
      setError('Could not open customer portal');
    }
    setLoading(false);
  }

  if (portalOnly) {
    return (
      <button
        onClick={handlePortal}
        disabled={loading || !subscriptionId}
        style={{ marginTop: 8, fontSize: 13, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
      >
        {loading ? 'Opening…' : 'Open customer portal →'}
      </button>
    );
  }

  if (isOnPaidPlan) {
    return (
      <button
        onClick={handlePortal}
        disabled={loading}
        style={{
          height: 32, padding: '0 14px', borderRadius: 'var(--radius-2)',
          border: '1px solid var(--color-line-2)', background: '#fff',
          fontSize: 13, color: 'var(--color-ink)', cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? '…' : 'Manage'}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        style={{
          height: 36, padding: '0 18px', borderRadius: 'var(--radius-2)',
          border: 'none', background: '#0a0a0a', color: '#fff',
          fontSize: 13, fontWeight: 500, cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Redirecting…' : 'Upgrade to Growth →'}
      </button>
      {error && <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>}
    </div>
  );
}
