import { PageHeader } from '@/components/AppShell';
import { Badge, Btn, Card } from '@/components/ui';

const leads = [
  { id: 'L-0234', name: 'Marko Novak', company: 'Novak d.o.o.', cfg: 'Pergola Classic', val: '€4,820', score: 87, status: 'new', hot: true, src: 'sunpergola.si', t: '2 min ago' },
  { id: 'L-0233', name: 'Petra Kovač', company: 'Kovač Gradnje', cfg: 'Pergola Pro', val: '€7,140', score: 72, status: 'contacted', hot: false, src: 'google-ads', t: '1h ago' },
  { id: 'L-0232', name: 'Andrej Zupan', company: 'Private', cfg: 'Pergola Classic', val: '€3,960', score: 61, status: 'qualified', hot: false, src: 'sunpergola.si', t: '3h ago' },
  { id: 'L-0231', name: 'Maja Krajnc', company: 'Krajnc vrtnarstvo', cfg: 'Pergola XL', val: '€11,200', score: 95, status: 'quoted', hot: true, src: 'sunpergola.si/garden', t: '1d ago' },
  { id: 'L-0230', name: 'Rok Horvat', company: 'RH Nepremičnine', cfg: 'Pergola Classic', val: '€4,380', score: 54, status: 'won', hot: false, src: 'facebook', t: '2d ago' },
  { id: 'L-0229', name: 'Tina Bernik', company: 'Private', cfg: 'Pergola Mini', val: '€1,840', score: 32, status: 'lost', hot: false, src: 'sunpergola.si', t: '3d ago' },
];

function ScorePill({ score }: { score: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 20, background: score >= 80 ? '#0a0a0a' : score >= 60 ? '#525252' : 'var(--color-surface)', color: score >= 60 ? '#fff' : 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, borderRadius: 3 }}>
      {score}
    </span>
  );
}

export default function LeadsInboxPage() {
  return (
    <div data-screen-label="Leads — Inbox">
      <PageHeader
        title="Leads"
        desc="All submissions from your embedded configurators."
        tabs={[
          { label: 'Inbox', href: '/leads/inbox', count: 23 },
          { label: 'Pipeline', href: '/leads/pipeline' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm">Filter</Btn>
            <Btn variant="secondary" size="sm">Export CSV</Btn>
          </div>
        }
      />
      <div style={{ padding: '20px 32px' }}>
        <Card pad={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-line)' }}>
                {['', 'ID', 'Contact', 'Configurator', 'Value', 'Score', 'Status', 'Source', 'Time', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => (
                <tr key={i} style={{ borderBottom: i < leads.length - 1 ? '1px solid var(--color-line)' : 'none', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="checkbox" style={{ margin: 0 }} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>
                    {l.id}
                    {l.hot && <span style={{ marginLeft: 6, fontSize: 9, background: '#0a0a0a', color: '#fff', borderRadius: 3, padding: '1px 4px', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>HOT</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{l.company}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--color-text-2)' }}>{l.cfg}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{l.val}</td>
                  <td style={{ padding: '12px 16px' }}><ScorePill score={l.score} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge kind={l.status === 'new' ? 'new' : l.status === 'won' ? 'live' : l.status === 'lost' ? 'off' : 'neutral'} size="sm">
                      {l.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-3)' }}>{l.src}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{l.t}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Btn variant="ghost" size="sm">View →</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
