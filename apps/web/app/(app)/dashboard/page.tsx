'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/AppShell';
import { Stat, Card, Badge, Btn } from '@/components/ui';

type Contact = { name?: string; email?: string };

type RecentLead = {
  id: string;
  status: string;
  hot: boolean | null;
  totalCents: number;
  currency: string;
  contact: Contact;
  configuratorId: string;
  submittedAt: string;
};

type TopCfg = {
  configuratorId: string;
  name: string;
  leads: number;
  revenue: number;
};

type DashData = {
  totalLeads: number;
  newLeads: number;
  pipeline: number;
  configuratorsCount: number;
  recentLeads: RecentLead[];
  topConfigurators: TopCfg[];
};

function fmtMoney(cents: number, currency = 'EUR') {
  const amount = cents / 100;
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}k`;
  return `€${amount.toFixed(0)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_KIND: Record<string, 'new' | 'live' | 'off' | 'neutral'> = {
  new: 'new', won: 'live', lost: 'off',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/dashboard').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setData(d);
      setLoading(false);
    });
  }, []);

  const totalLeads = data?.totalLeads ?? 0;
  const pipeline = data?.pipeline ?? 0;
  const newLeads = data?.newLeads ?? 0;
  const cfgCount = data?.configuratorsCount ?? 0;

  return (
    <div data-screen-label="Dashboard" style={{ padding: '0 0 40px' }}>
      <PageHeader
        title="Dashboard"
        desc="Your workspace overview for the last 30 days."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm">Last 30 days</Btn>
          </div>
        }
      />

      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <Stat label="Total leads" value={loading ? '—' : String(totalLeads)} sub="Last 30 days" />
          <Stat label="New leads" value={loading ? '—' : String(newLeads)} sub="Awaiting contact" />
          <Stat label="Configurators" value={loading ? '—' : String(cfgCount)} sub="Active" />
          <Stat label="Revenue pipeline" value={loading ? '—' : fmtMoney(pipeline)} sub="Open + quoted" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 12 }}>
          <Card pad={0}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Recent leads</div>
              <Link href="/leads/inbox">
                <Btn variant="ghost" size="sm">View all →</Btn>
              </Link>
            </div>
            {loading ? (
              <div style={{ padding: 24, fontSize: 13, color: 'var(--color-muted)' }}>Loading…</div>
            ) : data?.recentLeads.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--color-muted)' }}>
                No leads yet. <Link href="/configurators" style={{ color: 'var(--color-ink)', borderBottom: '1px solid currentColor' }}>Create a configurator →</Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-line)' }}>
                    {['Contact', 'Value', 'Status', 'Time'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentLeads ?? []).map((l, i) => (
                    <tr key={l.id} style={{ borderBottom: i < (data?.recentLeads.length ?? 0) - 1 ? '1px solid var(--color-line)' : 'none', cursor: 'pointer' }}
                      onClick={() => window.location.href = `/leads/${l.id}`}>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{l.contact?.name ?? '—'}</div>
                          {l.hot && <span style={{ fontSize: 9, background: '#0a0a0a', color: '#fff', borderRadius: 3, padding: '1px 4px', fontFamily: 'var(--font-mono)' }}>HOT</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{l.contact?.email ?? ''}</div>
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{fmtMoney(l.totalCents, l.currency)}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <Badge kind={STATUS_KIND[l.status] ?? 'neutral'} size="sm">{l.status}</Badge>
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{timeAgo(l.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card pad={0}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-line)', fontSize: 13.5, fontWeight: 500 }}>Top configurators</div>
            {loading ? (
              <div style={{ padding: 24, fontSize: 13, color: 'var(--color-muted)' }}>Loading…</div>
            ) : (data?.topConfigurators ?? []).length === 0 ? (
              <div style={{ padding: 24, fontSize: 13, color: 'var(--color-muted)', textAlign: 'center' }}>No data yet</div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {(data?.topConfigurators ?? []).map((c, i, arr) => (
                  <div key={c.configuratorId} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < arr.length - 1 ? '1px solid var(--color-line)' : 'none' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', minWidth: 16 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{c.leads} leads</div>
                    </div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{fmtMoney(c.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
