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

const STATUS_OPTIONS: { value: LeadStatus; label: string; sl: string }[] = [
  { value: 'new',        label: 'New',       sl: 'Novo' },
  { value: 'contacted',  label: 'Contacted', sl: 'Kontaktirano' },
  { value: 'qualified',  label: 'Qualified', sl: 'Kvalificirano' },
  { value: 'quoted',     label: 'Quoted',    sl: 'Ponudba poslana' },
  { value: 'won',        label: 'Won',       sl: 'Pridobljeno' },
  { value: 'lost',       label: 'Lost',      sl: 'Izgubljeno' },
  { value: 'spam',       label: 'Spam',      sl: 'Spam' },
];

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('sl-SI', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('sl-SI', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ravnokar';
  if (m < 60) return `pred ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `pred ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `pred ${d} dni`;
  return fmtDate(iso);
}

function InitialAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: size,
      background: '#0a0a0a', color: '#fff',
      display: 'grid', placeItems: 'center',
      fontSize: size * 0.35, fontWeight: 600, letterSpacing: '-0.02em',
      flexShrink: 0, fontFamily: 'var(--font-sans)',
    }}>
      {initials}
    </div>
  );
}

function eventLabel(type: string, payload: unknown): string {
  const p = payload as Record<string, unknown>;
  switch (type) {
    case 'created': return `Povpraševanje oddano${p?.source ? ` s strani ${p.source}` : ''}`;
    case 'status_changed': return `Status spremenjen: ${p?.from} → ${p?.to}`;
    default: return type.replace(/_/g, ' ');
  }
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newTag, setNewTag] = useState('');

  const fetchLead = useCallback(async () => {
    const res = await fetch(`/api/v1/leads/${id}`);
    if (!res.ok) { router.push('/leads/inbox'); return; }
    setLead(await res.json() as Lead);
  }, [id, router]);

  const fetchEvents = useCallback(async () => {
    const res = await fetch(`/api/v1/leads/${id}/events`);
    if (res.ok) setEvents(await res.json() as LeadEvent[]);
  }, [id]);

  useEffect(() => { fetchLead(); fetchEvents(); }, [fetchLead, fetchEvents]);

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

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    const tag = newTag.trim();
    if (!tag || !lead || lead.tags.includes(tag)) { setNewTag(''); return; }
    await patch({ tags: [...lead.tags, tag] });
    setNewTag('');
  }

  async function removeTag(tag: string) {
    if (!lead) return;
    await patch({ tags: lead.tags.filter(t => t !== tag) });
  }

  if (!lead) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 13, color: 'var(--color-text-3)' }}>
        Nalagam…
      </div>
    );
  }

  const contact = lead.contact;
  const displayName = contact.name ?? contact.email ?? `#${id.slice(0, 8)}`;
  const configEntries = Object.entries(lead.configState).filter(([k]) =>
    !['name', 'email', 'phone', 'city', 'company', 'message'].includes(k)
  );
  const message = lead.configState['message'] as string | undefined;
  const currentStatusObj = STATUS_OPTIONS.find(o => o.value === lead.status) ?? STATUS_OPTIONS[0];

  return (
    <div data-screen-label="Lead Detail" style={{ height: '100%', overflowY: 'auto', background: 'var(--color-surface)' }}>
      {/* Top nav bar */}
      <div style={{
        height: 48, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--color-line)', background: '#fff',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href="/leads/inbox" style={{ fontSize: 12.5, color: 'var(--color-text-3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Povpraševanja
        </Link>
        <span style={{ width: 1, height: 16, background: 'var(--color-line)' }} />
        <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-ink)' }}>{displayName}</span>
        {lead.hot && (
          <span style={{ fontSize: 10, background: '#0a0a0a', color: '#fff', padding: '1px 5px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>HOT</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {lead.pdfUrl && (
            <a href={lead.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: 'var(--color-text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)' }}>
              ↓ PDF
            </a>
          )}
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtMoney(lead.totalCents, lead.currency)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 32px 80px' }}>

        {/* Header — who is this person */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 28 }}>
          <InitialAvatar name={displayName} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 500, letterSpacing: '-0.025em' }}>{displayName}</h1>
              {lead.hot && (
                <span style={{ fontSize: 11, background: '#fff3cd', color: '#92400e', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>Vroča stranka</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 7, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {contact.email && (
                <a href={`mailto:${contact.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--color-text-3)', textDecoration: 'none' }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.2"/><path d="M2 4l6 5 6-5" stroke="currentColor" strokeWidth="1.2"/></svg>
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--color-text-3)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 4-2 1.5C6 9 7 10 8.5 11.5l1.5-2L14 11v3a1 1 0 01-1 1C5 15 1 11 1 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/></svg>
                  {contact.phone}
                </a>
              )}
              {(contact.city ?? lead.ipCountry) && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 2a5 5 0 015 5c0 3.5-5 9-5 9S3 10.5 3 7a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.2"/></svg>
                  {contact.city}{contact.city && lead.ipCountry ? ', ' : ''}{lead.ipCountry}
                </span>
              )}
              {contact.company && <span>{contact.company}</span>}
              <span style={{ color: 'var(--color-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{timeAgo(lead.submittedAt)}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Vrednost
            </div>
            <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.025em', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
              {fmtMoney(lead.totalCents, lead.currency)}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {contact.email && (
            <a href={`mailto:${contact.email}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 18px',
              background: '#0a0a0a', color: '#fff', borderRadius: 'var(--radius-2)',
              fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12v9H2V4z" stroke="currentColor" strokeWidth="1.3"/><path d="M2 4l6 5 6-5" stroke="currentColor" strokeWidth="1.3"/></svg>
              Odgovori po e-pošti
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px',
              background: '#fff', color: 'var(--color-ink)', borderRadius: 'var(--radius-2)',
              fontSize: 13.5, fontWeight: 400, textDecoration: 'none',
              border: '1px solid var(--color-line-2)',
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 4-2 1.5C6 9 7 10 8.5 11.5l1.5-2L14 11v3a1 1 0 01-1 1C5 15 1 11 1 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/></svg>
              Pokliči
            </a>
          )}
          <div style={{ flex: 1 }} />
          {/* Status dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--color-text-3)' }}>Status:</span>
            <select
              value={lead.status}
              onChange={e => changeStatus(e.target.value as LeadStatus)}
              disabled={updatingStatus}
              style={{
                height: 38, padding: '0 10px', border: '1px solid var(--color-line-2)',
                borderRadius: 'var(--radius-2)', fontSize: 13, background: '#fff',
                color: 'var(--color-ink)', cursor: updatingStatus ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.sl}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer message (if available) */}
        {message && (
          <div style={{ marginBottom: 28, padding: '20px 24px', background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-3)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Sporočilo stranke
            </div>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--color-text)', fontStyle: 'italic' }}>
              "{message}"
            </p>
          </div>
        )}

        {/* Configuration card */}
        {configEntries.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 12px', color: 'var(--color-ink)' }}>
              Kar je stranka konfigurirala
            </h2>
            <div style={{ background: '#fff', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-3)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {configEntries.map(([key, value], i) => (
                  <div key={key} style={{
                    display: 'flex', justifyContent: 'space-between',
                    paddingBottom: i < configEntries.length - 1 ? 8 : 0,
                    borderBottom: i < configEntries.length - 1 ? '1px dashed var(--color-line)' : 'none',
                    fontSize: 13.5,
                  }}>
                    <span style={{ color: 'var(--color-text-3)', textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontFamily: typeof value === 'number' ? 'var(--font-mono)' : undefined, fontWeight: 500 }}>
                      {Array.isArray(value) ? (value as string[]).join(', ') : String(value ?? '')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price total */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-line)', background: 'var(--color-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Skupaj</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                  {fmtMoney(lead.totalCents, lead.currency)}
                </span>
              </div>

              {/* Pricing breakdown toggle */}
              {lead.pricingBreakdown.length > 0 && (
                <div style={{ borderTop: '1px solid var(--color-line)' }}>
                  <button
                    onClick={() => setShowBreakdown(v => !v)}
                    style={{
                      all: 'unset', width: '100%', padding: '12px 20px',
                      fontSize: 12.5, color: 'var(--color-text-3)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      fontFamily: 'var(--font-mono)', boxSizing: 'border-box' as const,
                    }}
                  >
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: showBreakdown ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Pokaži razdelitev cene
                  </button>
                  {showBreakdown && (
                    <div style={{ borderTop: '1px solid var(--color-line)', padding: '12px 0' }}>
                      {lead.pricingBreakdown.map((line, i, arr) => (
                        <div key={i} style={{
                          display: 'flex', padding: '8px 20px', justifyContent: 'space-between',
                          background: line.kind === 'vat' ? 'var(--color-surface)' : undefined,
                          borderTop: line.kind === 'vat' ? '1px solid var(--color-line)' : undefined,
                          fontSize: 13,
                        }}>
                          <span style={{ color: 'var(--color-text-2)' }}>{line.label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
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
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {(lead.tags.length > 0 || true) && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {lead.tags.map(tag => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 12, background: 'var(--color-surface-2)', color: 'var(--color-text-2)',
                  padding: '3px 10px', borderRadius: 999, border: '1px solid var(--color-line)',
                }}>
                  {tag}
                  <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text-3)', fontSize: 14, lineHeight: 1, display: 'flex' }}>×</button>
                </span>
              ))}
              <form onSubmit={addTag} style={{ display: 'inline-flex', gap: 4 }}>
                <input
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="+ Dodaj oznako…"
                  style={{
                    height: 26, padding: '0 10px', border: '1px dashed var(--color-line-3)',
                    borderRadius: 999, fontSize: 12, outline: 'none', background: 'transparent',
                    color: 'var(--color-text-3)', fontFamily: 'inherit', width: newTag ? 'auto' : 120,
                  }}
                />
              </form>
            </div>
          </div>
        )}

        {/* Footer meta */}
        <div style={{ paddingTop: 20, borderTop: '1px solid var(--color-line)', display: 'flex', gap: 28, fontSize: 12, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
          <span>#{id.slice(0, 8)}</span>
          {lead.source && <span>Vir · {lead.source}</span>}
          {lead.referrer && <span>Referrer · {lead.referrer}</span>}
          <span>{fmtDate(lead.submittedAt)}</span>
          {lead.pdfUrl && (
            <a href={lead.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-ink)', textDecoration: 'none', marginLeft: 'auto' }}>
              ↓ Prenesi PDF
            </a>
          )}
        </div>

        {/* History toggle */}
        {events.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <button
              onClick={() => setShowHistory(v => !v)}
              style={{ all: 'unset', fontSize: 12.5, color: 'var(--color-text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)' }}
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Zgodovina ({events.length})
            </button>
            {showHistory && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {events.map((evt, i) => (
                  <div key={evt.id} style={{ display: 'flex', gap: 12, paddingBottom: i < events.length - 1 ? 12 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-line-3)', border: '2px solid var(--color-surface)', flexShrink: 0, marginTop: 4, zIndex: 1 }} />
                      {i < events.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--color-line)', marginTop: 2 }} />}
                    </div>
                    <div style={{ paddingTop: 2 }}>
                      <div style={{ fontSize: 13, color: 'var(--color-text-2)', marginBottom: 2 }}>{eventLabel(evt.type, evt.payload)}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{fmtDate(evt.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
