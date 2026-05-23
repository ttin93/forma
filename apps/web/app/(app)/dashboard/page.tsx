import { PageHeader } from '@/components/AppShell';
import { Stat, Card, Spark, Badge } from '@/components/ui';
import { Btn } from '@/components/ui';

const sparkData = [12, 18, 14, 22, 19, 28, 24, 31, 29, 36, 33, 41];

const recentLeads = [
  { id: 'L-0234', name: 'Marko Novak', cfg: 'Pergola Classic', val: '€4,820', status: 'new', hot: true, t: '2 min ago' },
  { id: 'L-0233', name: 'Petra Kovač', cfg: 'Pergola Pro', val: '€7,140', status: 'contacted', hot: false, t: '1h ago' },
  { id: 'L-0232', name: 'Andrej Zupan', cfg: 'Pergola Classic', val: '€3,960', status: 'qualified', hot: false, t: '3h ago' },
  { id: 'L-0231', name: 'Maja Krajnc', cfg: 'Pergola XL', val: '€11,200', status: 'quoted', hot: true, t: '1d ago' },
  { id: 'L-0230', name: 'Rok Horvat', cfg: 'Pergola Classic', val: '€4,380', status: 'won', hot: false, t: '2d ago' },
];

const statusColors: Record<string, string> = {
  new: '#0a0a0a', contacted: '#525252', qualified: '#525252', quoted: '#0a0a0a', won: '#0a0a0a', lost: '#d4d4d4',
};

const topCfgs = [
  { name: 'Pergola Classic', leads: 147, cr: '4.2%', revenue: '€421k' },
  { name: 'Pergola Pro', leads: 89, cr: '3.8%', revenue: '€312k' },
  { name: 'Pergola XL', leads: 34, cr: '5.1%', revenue: '€189k' },
  { name: 'Pergola Mini', leads: 21, cr: '2.9%', revenue: '€58k' },
];

export default function DashboardPage() {
  return (
    <div data-screen-label="Dashboard" style={{ padding: '0 0 40px' }}>
      <PageHeader
        title="Dashboard"
        desc="Your workspace overview for the last 30 days."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm">Export CSV</Btn>
            <Btn variant="secondary" size="sm">Last 30 days ↓</Btn>
          </div>
        }
      />

      <div style={{ padding: '28px 32px' }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <Stat label="Total leads" value="291" delta="12%" deltaKind="pos" sub="Last 30 days" />
          <Stat label="Avg lead value" value="€4,820" delta="8%" deltaKind="pos" sub="Per submission" />
          <Stat label="Conversion rate" value="3.7%" delta="0.3%" deltaKind="pos" sub="Starts → submits" />
          <Stat label="Revenue pipeline" value="€980k" delta="21%" deltaKind="pos" sub="Open + quoted" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {/* Sessions sparkline card */}
          <Card pad={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 500 }}>Configurator sessions</div>
                <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 4, fontFamily: 'var(--font-mono)' }}>7,841</div>
              </div>
              <Badge kind="live">↑ 18% vs prev</Badge>
            </div>
            <Spark data={sparkData} height={60} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>May 1</span><span>May 8</span><span>May 15</span><span>May 22</span>
            </div>
          </Card>

          {/* Funnel card */}
          <Card pad={20}>
            <div style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 500, marginBottom: 16 }}>Conversion funnel</div>
            {[
              { label: 'Viewed configurator', n: 7841, pct: 100 },
              { label: 'Started step 1', n: 5230, pct: 67 },
              { label: 'Reached pricing', n: 2940, pct: 38 },
              { label: 'Submitted lead', n: 291, pct: 3.7 },
            ].map((row, i) => (
              <div key={i} style={{ marginBottom: i < 3 ? 12 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ color: 'var(--color-text-2)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>{row.n.toLocaleString()} · {row.pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--color-line)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${row.pct}%`, height: '100%', background: '#0a0a0a', opacity: 0.1 + (row.pct / 100) * 0.9 }} />
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 12 }}>
          {/* Recent leads */}
          <Card pad={0}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Recent leads</div>
              <Btn variant="ghost" size="sm">View all →</Btn>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-line)' }}>
                  {['ID', 'Name', 'Configurator', 'Value', 'Status', 'Time'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((l, i) => (
                  <tr key={i} style={{ borderBottom: i < recentLeads.length - 1 ? '1px solid var(--color-line)' : 'none' }}>
                    <td style={{ padding: '12px 20px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>
                      {l.id}
                      {l.hot && <span style={{ marginLeft: 6, fontSize: 10, background: '#0a0a0a', color: '#fff', borderRadius: 3, padding: '1px 4px', fontFamily: 'var(--font-mono)' }}>HOT</span>}
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 500 }}>{l.name}</td>
                    <td style={{ padding: '12px 20px', fontSize: 12.5, color: 'var(--color-text-2)' }}>{l.cfg}</td>
                    <td style={{ padding: '12px 20px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{l.val}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <Badge kind={l.status === 'new' ? 'new' : l.status === 'won' ? 'live' : 'neutral'} size="sm">
                        {l.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{l.t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Top configurators */}
          <Card pad={0}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-line)', fontSize: 13.5, fontWeight: 500 }}>Top configurators</div>
            <div style={{ padding: '8px 0' }}>
              {topCfgs.map((c, i) => (
                <div key={i} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < topCfgs.length - 1 ? '1px solid var(--color-line)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', minWidth: 16 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{c.leads} leads · {c.cr} CR</div>
                  </div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{c.revenue}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
