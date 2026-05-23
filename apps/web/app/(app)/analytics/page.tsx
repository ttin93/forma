'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/AppShell';
import { Card, Stat } from '@/components/ui';

interface MonthPoint { month: string; label: string; leads: number; revenue: number }
interface StatusRow { status: string; count: number; revenue: number }
interface SourceRow { source: string; count: number; revenue: number }
interface CfgRow { id: string; name: string; count: number; revenue: number }

interface AnalyticsData {
  days: number;
  summary: {
    totalLeads: number;
    totalRevenue: number;
    avgValue: number;
    wonLeads: number;
    winRate: number;
  };
  monthly: MonthPoint[];
  byStatus: StatusRow[];
  bySource: SourceRow[];
  topConfigurators: CfgRow[];
}

const RANGE_OPTIONS = [
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 12 months', days: 365 },
  { label: 'All time', days: 3650 },
];

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6', contacted: '#8b5cf6', qualified: '#f59e0b',
  quoted: '#f97316', won: '#16a34a', lost: '#9ca3af', spam: '#ef4444',
};

function fmtMoney(cents: number) {
  const amount = cents / 100;
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}k`;
  return `€${amount.toFixed(0)}`;
}

function Bars({ data, onHover }: { data: MonthPoint[]; onHover?: (p: MonthPoint | null) => void }) {
  const max = Math.max(...data.map(d => d.leads), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div
          key={d.month}
          title={`${d.label}: ${d.leads} leads · ${fmtMoney(d.revenue)}`}
          onMouseEnter={() => onHover?.(d)}
          onMouseLeave={() => onHover?.(null)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end', cursor: 'default' }}
        >
          <div style={{
            width: '100%',
            height: `${Math.max((d.leads / max) * 100, d.leads > 0 ? 2 : 0)}%`,
            background: i === data.length - 1 ? '#0a0a0a' : '#e3e3e3',
            minHeight: d.leads > 0 ? 2 : 0,
            borderRadius: '2px 2px 0 0',
            transition: 'background .1s',
          }} />
          <span style={{ fontSize: 9, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(365);
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<MonthPoint | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    const res = await fetch(`/api/v1/analytics?days=${d}`);
    if (res.ok) setData(await res.json() as AnalyticsData);
    setLoading(false);
  }, []);

  useEffect(() => { load(days); }, [load, days]);

  const currentRange = RANGE_OPTIONS.find(o => o.days === days) ?? RANGE_OPTIONS[2];
  const s = data?.summary;

  const totalSource = data?.bySource.reduce((a, r) => a + r.count, 0) ?? 0;
  const totalStatus = data?.byStatus.reduce((a, r) => a + r.count, 0) ?? 0;

  return (
    <div data-screen-label="Analytics" style={{ padding: '0 0 40px' }}>
      <PageHeader
        title="Analytics"
        desc="Lead volume, revenue, and source breakdown."
        actions={
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPicker(p => !p)}
              style={{
                height: 32, padding: '0 12px', borderRadius: 'var(--radius-2)',
                border: '1px solid var(--color-line-2)', background: '#fff',
                fontSize: 13, color: 'var(--color-ink)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {currentRange.label}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showPicker && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setShowPicker(false)} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  background: '#fff', border: '1px solid var(--color-line)',
                  borderRadius: 'var(--radius-2)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  zIndex: 10, minWidth: 160, overflow: 'hidden',
                }}>
                  {RANGE_OPTIONS.map(opt => (
                    <button
                      key={opt.days}
                      onClick={() => { setDays(opt.days); setShowPicker(false); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '9px 14px', fontSize: 13, border: 'none', cursor: 'pointer',
                        color: 'var(--color-ink)',
                        fontWeight: opt.days === days ? 600 : 400,
                        background: opt.days === days ? 'var(--color-surface)' : 'transparent',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        }
      />

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Stat label="Total leads" value={loading ? '—' : String(s?.totalLeads ?? 0)} sub={currentRange.label} />
          <Stat label="Total revenue" value={loading ? '—' : fmtMoney(s?.totalRevenue ?? 0)} sub="Pipeline value" />
          <Stat label="Avg deal value" value={loading ? '—' : fmtMoney(s?.avgValue ?? 0)} sub="Per lead" />
          <Stat label="Win rate" value={loading ? '—' : `${s?.winRate ?? 0}%`} sub={`${s?.wonLeads ?? 0} won`} />
        </div>

        {/* Monthly chart */}
        <Card pad={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Monthly leads</div>
              {hoveredMonth && (
                <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>
                  <strong style={{ color: 'var(--color-ink)' }}>{hoveredMonth.label}</strong>
                  {' · '}{hoveredMonth.leads} leads{' · '}{fmtMoney(hoveredMonth.revenue)}
                </div>
              )}
            </div>
            {loading && <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Loading…</span>}
          </div>
          {!loading && (data?.monthly ?? []).every(m => m.leads === 0) ? (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              No leads in this period
            </div>
          ) : (
            <Bars data={data?.monthly ?? Array(12).fill({ month: '', label: '—', leads: 0, revenue: 0 })} onHover={setHoveredMonth} />
          )}
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Status distribution */}
          <Card pad={20}>
            <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 16 }}>By status</div>
            {loading ? (
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Loading…</div>
            ) : (data?.byStatus ?? []).length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>No data</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(data?.byStatus ?? [])
                  .sort((a, b) => b.count - a.count)
                  .map(row => {
                    const pct = totalStatus > 0 ? Math.round((row.count / totalStatus) * 100) : 0;
                    const color = STATUS_COLORS[row.status] ?? '#9ca3af';
                    return (
                      <div key={row.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                          <span style={{ color: 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
                            {row.status}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>
                            {row.count} · {pct}%
                          </span>
                        </div>
                        <div style={{ height: 4, background: 'var(--color-line)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>

          {/* Top sources */}
          <Card pad={20}>
            <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 16 }}>Top sources</div>
            {loading ? (
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Loading…</div>
            ) : (data?.bySource ?? []).length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>No data</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(data?.bySource ?? []).map((row, i) => {
                  const pct = totalSource > 0 ? Math.round((row.count / totalSource) * 100) : 0;
                  return (
                    <div key={row.source} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', minWidth: 16 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{row.source}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', flexShrink: 0 }}>{row.count} · {pct}%</span>
                        </div>
                        <div style={{ height: 3, background: 'var(--color-line)', borderRadius: 3 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#0a0a0a' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Top configurators */}
        {(data?.topConfigurators ?? []).length > 0 && (
          <Card pad={0}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-line)', fontSize: 13.5, fontWeight: 500 }}>
              Top configurators
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-line)' }}>
                  {['Configurator', 'Leads', 'Revenue', 'Avg value'].map(h => (
                    <th key={h} style={{ padding: '9px 20px', textAlign: 'left', fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.topConfigurators ?? []).map((row, i, arr) => (
                  <tr key={row.id} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-line)' : 'none' }}>
                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 500 }}>{row.name}</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{row.count}</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>{fmtMoney(row.revenue)}</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-3)' }}>
                      {row.count > 0 ? fmtMoney(Math.round(row.revenue / row.count)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

      </div>
    </div>
  );
}
