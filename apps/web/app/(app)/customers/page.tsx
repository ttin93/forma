'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/AppShell';
import { Card, Btn } from '@/components/ui';

type Customer = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  country: string | null;
  city: string | null;
  configCount: number | null;
  ltvCents: number;
  lastSeenAt: string;
};

function fmtMoney(cents: number) {
  const amount = cents / 100;
  if (amount === 0) return '—';
  return `€${amount.toLocaleString('en-EU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/customers').then(r => r.ok ? r.json() : []).then(d => {
      setCustomers(d);
      setLoading(false);
    });
  }, []);

  return (
    <div data-screen-label="Customers">
      <PageHeader
        title="Customers"
        desc="Buyers who have submitted at least one lead. Aggregated across all configurators."
      />
      <div style={{ padding: '28px 32px' }}>
        <Card pad={0}>
          {loading ? (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--color-muted)' }}>Loading…</div>
          ) : customers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: 'var(--color-muted)' }}>
              No customers yet. Customers appear once a lead is submitted via a configurator.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-line)' }}>
                  {['Customer', 'Submissions', 'LTV', 'Last seen', 'Country'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < customers.length - 1 ? '1px solid var(--color-line)' : 'none', cursor: 'pointer' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name ?? '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{c.email}</div>
                      {c.company && <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{c.company}</div>}
                    </td>
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{c.configCount ?? 0}</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>{fmtMoney(c.ltvCents)}</td>
                    <td style={{ padding: '12px 20px', fontSize: 12.5, color: 'var(--color-text-3)' }}>{timeAgo(c.lastSeenAt)}</td>
                    <td style={{ padding: '12px 20px', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>{c.country ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
