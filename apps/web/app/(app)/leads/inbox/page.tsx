'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/AppShell';
import { Badge, Btn, Card } from '@/components/ui';

type Contact = { name?: string; email?: string; company?: string };

type Lead = {
  id: string;
  status: string;
  hot: boolean | null;
  score: number | null;
  totalCents: number;
  currency: string;
  contact: Contact;
  configuratorId: string;
  source: string | null;
  submittedAt: string;
};

const STATUS_OPTIONS = ['', 'new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'spam'];

function ScorePill({ score }: { score: number | null }) {
  const s = score ?? 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 20, background: s >= 80 ? '#0a0a0a' : s >= 60 ? '#525252' : 'var(--color-surface)', color: s >= 60 ? '#fff' : 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, borderRadius: 3 }}>
      {s}
    </span>
  );
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

function fmtMoney(cents: number) {
  return `€${(cents / 100).toLocaleString('en-EU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function LeadsInboxPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (statusFilter) params.set('status', statusFilter);
    if (q.trim()) params.set('q', q.trim());
    const res = await fetch(`/api/v1/leads?${params}`);
    if (res.ok) {
      const json = await res.json();
      setLeads(json.data ?? []);
      setTotal(json.total ?? 0);
    }
    setLoading(false);
  }, [page, statusFilter, q]);

  useEffect(() => { load(); }, [load]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  const newCount = leads.filter(l => l.status === 'new').length;

  return (
    <div data-screen-label="Leads — Inbox">
      <PageHeader
        title="Leads"
        desc="All submissions from your embedded configurators."
        tabs={[
          { label: 'Inbox', href: '/leads/inbox', count: total },
          { label: 'Pipeline', href: '/leads/pipeline' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <form onSubmit={onSearch} style={{ display: 'flex', gap: 8 }}>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search by name or email…"
                style={{ height: 32, padding: '0 10px', fontSize: 13, border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', width: 220, outline: 'none' }}
              />
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ height: 32, padding: '0 8px', fontSize: 13, border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', background: '#fff', cursor: 'pointer' }}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
              </select>
            </form>
          </div>
        }
      />
      <div style={{ padding: '20px 32px' }}>
        <Card pad={0}>
          {loading ? (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--color-muted)' }}>Loading…</div>
          ) : leads.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: 'var(--color-muted)' }}>
              {statusFilter || q ? 'No leads match your filters.' : 'No leads yet. Embed a configurator on your site to start receiving leads.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-line)' }}>
                  {['Contact', 'Value', 'Score', 'Status', 'Source', 'Time', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((l, i) => (
                  <tr
                    key={l.id}
                    style={{ borderBottom: i < leads.length - 1 ? '1px solid var(--color-line)' : 'none', cursor: 'pointer' }}
                    onClick={() => router.push(`/leads/${l.id}`)}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{l.contact?.name ?? '—'}</div>
                        {l.hot && <span style={{ fontSize: 9, background: '#0a0a0a', color: '#fff', borderRadius: 3, padding: '1px 4px', fontFamily: 'var(--font-mono)' }}>HOT</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{l.contact?.email ?? ''}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{fmtMoney(l.totalCents)}</td>
                    <td style={{ padding: '12px 16px' }}><ScorePill score={l.score} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge kind={l.status === 'new' ? 'new' : l.status === 'won' ? 'live' : l.status === 'lost' ? 'off' : 'neutral'} size="sm">
                        {l.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-3)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.source ?? '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{timeAgo(l.submittedAt)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Btn variant="ghost" size="sm">View →</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && total > 50 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: 'var(--color-text-3)' }}>
              <span>Showing {leads.length} of {total}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
                <Btn variant="ghost" size="sm" disabled={leads.length < 50} onClick={() => setPage(p => p + 1)}>Next →</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
