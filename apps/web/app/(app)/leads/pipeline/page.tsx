'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost' | 'spam';

interface LeadCard {
  id: string;
  status: LeadStatus;
  hot: boolean;
  score: number;
  totalCents: number;
  currency: string;
  contact: { name?: string; email?: string; company?: string };
  configuratorId: string;
  submittedAt: string;
  tags: string[];
}

const COLUMNS: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: '#3b82f6' },
  { key: 'contacted', label: 'Contacted', color: '#8b5cf6' },
  { key: 'qualified', label: 'Qualified', color: '#f59e0b' },
  { key: 'quoted', label: 'Quoted', color: '#f97316' },
  { key: 'won', label: 'Won', color: '#16a34a' },
  { key: 'lost', label: 'Lost', color: '#9ca3af' },
];

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('sl-SI', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function LeadCardView({
  lead,
  onDrop,
}: {
  lead: LeadCard;
  onDrop?: (targetStatus: LeadStatus) => void;
}) {
  const name = (lead.contact as Record<string, string>).name ?? (lead.contact as Record<string, string>).email ?? 'Unknown';
  const company = (lead.contact as Record<string, string>).company;

  return (
    <Link
      href={`/leads/${lead.id}`}
      draggable
      onDragStart={e => e.dataTransfer.setData('leadId', lead.id)}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div style={{
        background: '#fff', border: '1px solid var(--color-line)',
        borderRadius: 'var(--radius-2)', padding: '12px 14px',
        cursor: 'pointer', transition: 'box-shadow 0.1s',
        borderLeft: lead.hot ? '3px solid #f97316' : '1px solid var(--color-line)',
      }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.3 }}>{name}</div>
            {company && <div style={{ fontSize: 11.5, color: 'var(--color-text-3)', marginTop: 2 }}>{company}</div>}
          </div>
          {lead.hot && (
            <span style={{ fontSize: 11, background: '#fff7ed', color: '#ea580c', padding: '1px 5px', borderRadius: 4, fontWeight: 600, flexShrink: 0 }}>
              HOT
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtMoney(lead.totalCents, lead.currency)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{timeAgo(lead.submittedAt)}</span>
        </div>
        {lead.score > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ height: 3, background: 'var(--color-line)', borderRadius: 2 }}>
              <div style={{ height: 3, background: '#3b82f6', borderRadius: 2, width: `${Math.min(100, lead.score)}%` }} />
            </div>
          </div>
        )}
        {lead.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {lead.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{ fontSize: 10.5, background: 'var(--color-surface-2)', color: 'var(--color-text-2)', padding: '1px 6px', borderRadius: 3 }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function KanbanColumn({
  column,
  leads,
  onDrop,
}: {
  column: (typeof COLUMNS)[number];
  leads: LeadCard[];
  onDrop: (leadId: string, status: LeadStatus) => void;
}) {
  const [over, setOver] = useState(false);
  const total = leads.reduce((s, l) => s + l.totalCents, 0);
  const currency = leads[0]?.currency ?? 'EUR';

  return (
    <div
      style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', minHeight: 0 }}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault();
        setOver(false);
        const leadId = e.dataTransfer.getData('leadId');
        if (leadId) onDrop(leadId, column.key);
      }}
    >
      {/* Column header */}
      <div style={{
        padding: '0 4px 10px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: column.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)' }}>{column.label}</span>
        <span style={{
          fontSize: 11, background: 'var(--color-surface-2)', color: 'var(--color-text-3)',
          borderRadius: 999, padding: '0 6px', lineHeight: '18px',
        }}>
          {leads.length}
        </span>
        {leads.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtMoney(total, currency)}
          </span>
        )}
      </div>

      {/* Drop area */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
        padding: '4px 2px', borderRadius: 'var(--radius-2)',
        background: over ? 'var(--color-surface-2)' : 'transparent',
        transition: 'background 0.1s',
        minHeight: 60,
      }}>
        {leads.map(lead => (
          <LeadCardView key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && !over && (
          <div style={{ fontSize: 12, color: 'var(--color-text-3)', textAlign: 'center', paddingTop: 12 }}>
            No leads
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<LeadCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const url = new URL('/api/v1/leads', location.href);
    url.searchParams.set('limit', '200');
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json() as { data: LeadCard[] };
      setLeads(json.data.filter(l => l.status !== 'spam'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDrop(leadId: string, targetStatus: LeadStatus) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: targetStatus } : l));
    await fetch(`/api/v1/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus }),
    });
  }

  const filtered = search.trim()
    ? leads.filter(l => {
        const q = search.toLowerCase();
        const c = l.contact as Record<string, string>;
        return (
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.company ?? '').toLowerCase().includes(q)
        );
      })
    : leads;

  const byStatus = (status: LeadStatus) => filtered.filter(l => l.status === status);

  return (
    <div data-screen-label="Leads Pipeline" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        height: 52, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--color-line)', background: '#fff', flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', marginRight: 8 }}>Pipeline</span>
        <input
          type="search"
          placeholder="Search leads…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: 220, height: 30, padding: '0 10px', border: '1px solid var(--color-line-2)',
            borderRadius: 'var(--radius-2)', fontSize: 13, outline: 'none', color: 'var(--color-ink)',
          }}
        />
        <Link href="/leads/inbox" style={{
          marginLeft: 'auto', fontSize: 13, color: 'var(--color-text-3)', textDecoration: 'none',
        }}>
          ← Inbox
        </Link>
      </div>

      {/* Board */}
      {loading ? (
        <div style={{ padding: 32, fontSize: 13, color: 'var(--color-text-3)' }}>Loading…</div>
      ) : (
        <div style={{
          flex: 1, overflowX: 'auto', overflowY: 'hidden',
          display: 'flex', gap: 16, padding: '20px 24px', alignItems: 'stretch',
        }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.key}
              column={col}
              leads={byStatus(col.key)}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
