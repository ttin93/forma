'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost' | 'spam';

interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  company?: string;
}

interface PricingLine {
  kind: string;
  label: string;
  amount?: number;
  rate?: number;
  factor?: number;
}

interface Lead {
  id: string;
  status: LeadStatus;
  hot: boolean;
  score: number;
  totalCents: number;
  currency: string;
  contact: ContactInfo;
  configState: Record<string, unknown>;
  pricingBreakdown: PricingLine[];
  configuratorId: string;
  versionId: string;
  assigneeId: string | null;
  tags: string[];
  source: string | null;
  referrer: string | null;
  ipCountry: string | null;
  submittedAt: string;
  pdfUrl: string | null;
}

interface LeadEvent {
  id: string;
  type: string;
  actorUserId: string | null;
  payload: unknown;
  createdAt: string;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: '#3b82f6' },
  { value: 'contacted', label: 'Contacted', color: '#8b5cf6' },
  { value: 'qualified', label: 'Qualified', color: '#f59e0b' },
  { value: 'quoted', label: 'Quoted', color: '#f97316' },
  { value: 'won', label: 'Won', color: '#16a34a' },
  { value: 'lost', label: 'Lost', color: '#9ca3af' },
  { value: 'spam', label: 'Spam', color: '#ef4444' },
];

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('sl-SI', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('sl-SI', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function eventLabel(type: string, payload: unknown): string {
  const p = payload as Record<string, unknown>;
  switch (type) {
    case 'created': return `Lead submitted from ${p?.source ?? 'unknown'}`;
    case 'status_changed': return `Status changed: ${p?.from} → ${p?.to}`;
    default: return type.replace(/_/g, ' ');
  }
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const s = STATUS_OPTIONS.find(o => o.value === status) ?? STATUS_OPTIONS[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 999, fontSize: 12, fontWeight: 500,
      color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}33`,
    }}>
      {s.label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', background: '#fff', overflow: 'hidden' }}>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px solid var(--color-line)' }}>
      <span style={{ width: 120, fontSize: 12.5, color: 'var(--color-text-3)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--color-ink)' }}>{value}</span>
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [togglingHot, setTogglingHot] = useState(false);
  const [newTag, setNewTag] = useState('');

  const fetchLead = useCallback(async () => {
    const res = await fetch(`/api/v1/leads/${id}`);
    if (!res.ok) { router.push('/leads/inbox'); return; }
    const data = await res.json() as Lead;
    setLead(data);
  }, [id, router]);

  const fetchEvents = useCallback(async () => {
    const res = await fetch(`/api/v1/leads/${id}/events`);
    if (res.ok) setEvents(await res.json() as LeadEvent[]);
  }, [id]);

  useEffect(() => {
    fetchLead();
    fetchEvents();
  }, [fetchLead, fetchEvents]);

  async function patch(updates: Partial<{ status: LeadStatus; hot: boolean; tags: string[] }>) {
    await fetch(`/api/v1/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await fetchLead();
    await fetchEvents();
  }

  async function changeStatus(status: LeadStatus) {
    if (!lead || status === lead.status) return;
    setUpdatingStatus(true);
    await patch({ status });
    setUpdatingStatus(false);
  }

  async function toggleHot() {
    if (!lead) return;
    setTogglingHot(true);
    await patch({ hot: !lead.hot });
    setTogglingHot(false);
  }

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    const tag = newTag.trim();
    if (!tag || !lead) return;
    if (lead.tags.includes(tag)) { setNewTag(''); return; }
    await patch({ tags: [...lead.tags, tag] });
    setNewTag('');
  }

  async function removeTag(tag: string) {
    if (!lead) return;
    await patch({ tags: lead.tags.filter(t => t !== tag) });
  }

  if (!lead) {
    return <div style={{ padding: '40px 32px', fontSize: 13, color: 'var(--color-text-3)' }}>Loading…</div>;
  }

  const contact = lead.contact;
  const configEntries = Object.entries(lead.configState).filter(([k]) => !['name', 'email', 'phone', 'city', 'company'].includes(k));

  return (
    <div data-screen-label="Lead Detail" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar */}
      <div style={{
        height: 52, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--color-line)', background: '#fff', flexShrink: 0,
      }}>
        <Link href="/leads/inbox" style={{ fontSize: 12.5, color: 'var(--color-text-3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Back
        </Link>
        <span style={{ width: 1, height: 16, background: 'var(--color-line)' }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>
          {contact.name ?? contact.email ?? id}
        </span>
        <StatusBadge status={lead.status} />
        {lead.hot && (
          <span style={{ fontSize: 11, background: '#fff7ed', color: '#ea580c', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>HOT</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleHot}
            disabled={togglingHot}
            style={{
              height: 30, padding: '0 12px', borderRadius: 'var(--radius-2)',
              border: '1px solid var(--color-line-2)',
              background: lead.hot ? '#fff7ed' : '#fff',
              color: lead.hot ? '#ea580c' : 'var(--color-text-2)',
              fontSize: 12.5, cursor: 'pointer',
            }}
          >
            {lead.hot ? '🔥 Hot' : 'Mark hot'}
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtMoney(lead.totalCents, lead.currency)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', gap: 0 }}>
        {/* Main column */}
        <div style={{ flex: 1, padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0 }}>

          {/* Contact */}
          <Section title="Contact">
            <Card>
              <Row label="Name" value={contact.name} />
              <Row label="Email" value={contact.email} />
              <Row label="Phone" value={contact.phone} />
              <Row label="Company" value={contact.company} />
              <Row label="City" value={contact.city} />
              <Row label="Country" value={lead.ipCountry} />
              <Row label="Source" value={lead.source} />
              <Row label="Referrer" value={lead.referrer} />
            </Card>
          </Section>

          {/* Configuration */}
          {configEntries.length > 0 && (
            <Section title="Configuration">
              <Card>
                {configEntries.map(([key, value], i) => (
                  <div key={key} style={{ display: 'flex', padding: '10px 16px', borderBottom: i < configEntries.length - 1 ? '1px solid var(--color-line)' : 'none' }}>
                    <span style={{ width: 160, fontSize: 12.5, color: 'var(--color-text-3)', flexShrink: 0, textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--color-ink)', fontFamily: typeof value === 'number' ? 'var(--font-mono)' : undefined }}>
                      {Array.isArray(value) ? (value as string[]).join(', ') : String(value ?? '')}
                    </span>
                  </div>
                ))}
              </Card>
            </Section>
          )}

          {/* Pricing breakdown */}
          <Section title="Pricing">
            <Card>
              {(lead.pricingBreakdown as PricingLine[]).map((line, i, arr) => (
                <div key={i} style={{
                  display: 'flex', padding: '10px 16px', justifyContent: 'space-between',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-line)' : 'none',
                  background: line.kind === 'vat' ? 'var(--color-surface)' : undefined,
                }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{line.label}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
                    {line.amount !== undefined
                      ? fmtMoney(line.amount, lead.currency)
                      : line.rate !== undefined
                        ? `${(line.rate * 100).toFixed(0)}%`
                        : line.factor !== undefined
                          ? `×${line.factor}`
                          : '—'}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', padding: '12px 16px', justifyContent: 'space-between', borderTop: '2px solid var(--color-line)', background: 'var(--color-surface)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>Total</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtMoney(lead.totalCents, lead.currency)}
                </span>
              </div>
            </Card>
          </Section>

          {/* Timeline */}
          <Section title="Timeline">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {events.length === 0 ? (
                <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>No events yet.</span>
              ) : (
                events.map((evt, i) => (
                  <div key={evt.id} style={{ display: 'flex', gap: 12, paddingBottom: i < events.length - 1 ? 14 : 0, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-line-3)', border: '2px solid #fff', flexShrink: 0, marginTop: 4, zIndex: 1 }} />
                      {i < events.length - 1 && (
                        <div style={{ width: 1, flex: 1, background: 'var(--color-line)', marginTop: 2 }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 2 }}>
                      <div style={{ fontSize: 13, color: 'var(--color-ink)', marginBottom: 2 }}>
                        {eventLabel(evt.type, evt.payload)}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--color-text-3)' }}>{fmtDate(evt.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid var(--color-line)', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', background: 'var(--color-surface)' }}>

          {/* Status */}
          <Section title="Status">
            <select
              value={lead.status}
              onChange={e => changeStatus(e.target.value as LeadStatus)}
              disabled={updatingStatus}
              style={{
                width: '100%', height: 34, padding: '0 10px', border: '1px solid var(--color-line-2)',
                borderRadius: 'var(--radius-2)', fontSize: 13, background: '#fff', color: 'var(--color-ink)',
                cursor: updatingStatus ? 'wait' : 'pointer',
              }}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Section>

          {/* Score */}
          {(lead.score ?? 0) > 0 && (
            <Section title="Score">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--color-line)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: 6, background: '#3b82f6', width: `${Math.min(100, lead.score)}%`, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', width: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {lead.score}
                </span>
              </div>
            </Section>
          )}

          {/* Tags */}
          <Section title="Tags">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {lead.tags.map(tag => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11.5, background: 'var(--color-surface-2)', color: 'var(--color-text-2)',
                  padding: '2px 8px', borderRadius: 4,
                }}>
                  {tag}
                  <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text-3)', lineHeight: 1, fontSize: 13 }}>×</button>
                </span>
              ))}
              {lead.tags.length === 0 && <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>No tags</span>}
            </div>
            <form onSubmit={addTag} style={{ display: 'flex', gap: 6 }}>
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add tag…"
                style={{
                  flex: 1, height: 28, padding: '0 8px', border: '1px solid var(--color-line-2)',
                  borderRadius: 4, fontSize: 12, outline: 'none',
                }}
              />
              <button type="submit" disabled={!newTag.trim()} style={{
                height: 28, padding: '0 10px', border: '1px solid var(--color-line-2)', background: '#fff',
                borderRadius: 4, fontSize: 12, cursor: !newTag.trim() ? 'not-allowed' : 'pointer', opacity: !newTag.trim() ? 0.5 : 1,
              }}>
                Add
              </button>
            </form>
          </Section>

          {/* Meta */}
          <Section title="Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Submitted</span>
                <span style={{ fontSize: 12, color: 'var(--color-ink)' }}>{fmtDate(lead.submittedAt)}</span>
              </div>
              {lead.pdfUrl && (
                <a href={lead.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}>
                  Download PDF
                </a>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
