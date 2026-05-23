import { PageHeader } from '@/components/AppShell';
import { Card, Stat, Badge } from '@/components/ui';
import { Btn } from '@/components/ui';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const sessionsData = [320, 410, 390, 520, 480, 670, 610, 780, 720, 860, 810, 980];

function Bars({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, paddingTop: 8 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', height: `${(v / max) * 100}%`, background: i === data.length - 1 ? '#0a0a0a' : '#e3e3e3', minHeight: 2, borderRadius: '2px 2px 0 0' }} />
          <span style={{ fontSize: 9, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div data-screen-label="Analytics">
      <PageHeader
        title="Analytics"
        desc="Sessions, funnel, geo breakdown and heatmap."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm">All configurators ↓</Btn>
            <Btn variant="secondary" size="sm">Last 12 months ↓</Btn>
          </div>
        }
      />
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Stat label="Total sessions" value="7,841" delta="18%" deltaKind="pos" sub="All configurators" />
          <Stat label="Avg session time" value="4:23" delta="12%" deltaKind="pos" sub="Minutes" />
          <Stat label="Step completion" value="67%" delta="3%" deltaKind="pos" sub="Step 1 → end" />
          <Stat label="Submit rate" value="3.7%" delta="0.3%" deltaKind="pos" sub="Of all sessions" />
        </div>

        <Card pad={20}>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 16 }}>Monthly sessions</div>
          <Bars data={sessionsData} labels={monthLabels} />
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Card pad={20}>
            <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 16 }}>Step-by-step funnel</div>
            {[
              { step: 'Step 1 — Model select', n: 7841, pct: 100 },
              { step: 'Step 2 — Dimensions', n: 5802, pct: 74 },
              { step: 'Step 3 — Color & material', n: 4190, pct: 53 },
              { step: 'Step 4 — Add-ons', n: 2940, pct: 38 },
              { step: 'Step 5 — Contact', n: 1120, pct: 14 },
              { step: 'Submitted', n: 291, pct: 3.7 },
            ].map((row, i) => (
              <div key={i} style={{ marginBottom: i < 5 ? 14 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ color: 'var(--color-text-2)' }}>{row.step}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>{row.n.toLocaleString()} · {row.pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--color-line)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${row.pct}%`, height: '100%', background: '#0a0a0a' }} />
                </div>
              </div>
            ))}
          </Card>

          <Card pad={20}>
            <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 16 }}>Top sources</div>
            {[
              { src: 'sunpergola.si', sessions: 4120, pct: 53 },
              { src: 'google-ads', sessions: 1840, pct: 23 },
              { src: 'facebook', sessions: 980, pct: 13 },
              { src: 'direct', sessions: 620, pct: 8 },
              { src: 'other', sessions: 281, pct: 3 },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 4 ? 14 : 0 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', minWidth: 16 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                    <span>{row.src}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>{row.sessions.toLocaleString()} · {row.pct}%</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--color-line)', borderRadius: 3 }}>
                    <div style={{ width: `${row.pct}%`, height: '100%', background: '#0a0a0a' }} />
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <Card pad={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Top configurations</div>
            <Badge kind="neutral" size="sm">May 2026</Badge>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-line)' }}>
                {['Configuration', 'Submissions', 'Avg value', 'Share'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { cfg: 'Anthracite · 4×3m · LED', n: 48, avg: '€4,820', share: '16%' },
                { cfg: 'White · 3×3m · Motor', n: 39, avg: '€3,960', share: '13%' },
                { cfg: 'Anthracite · 5×4m · LED+Motor', n: 31, avg: '€7,140', share: '11%' },
                { cfg: 'Oak · 4×3m · Standard', n: 28, avg: '€4,240', share: '9%' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: i < 3 ? '1px solid var(--color-line)' : 'none' }}>
                  <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--color-text-2)' }}>{row.cfg}</td>
                  <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{row.n}</td>
                  <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>{row.avg}</td>
                  <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-3)' }}>{row.share}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
