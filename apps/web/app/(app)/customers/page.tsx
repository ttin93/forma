import { PageHeader } from '@/components/AppShell';
import { Card, Badge, Btn } from '@/components/ui';

const customers = [
  { name: 'Marko Novak', email: 'marko@novak.si', company: 'Novak d.o.o.', configs: 3, ltv: '€14,460', lastSeen: '2 min ago', country: 'SI' },
  { name: 'Petra Kovač', email: 'petra@kovac.si', company: 'Kovač Gradnje', configs: 2, ltv: '€14,280', lastSeen: '1h ago', country: 'SI' },
  { name: 'Maja Krajnc', email: 'maja@krajnc.si', company: 'Krajnc vrtnarstvo', configs: 1, ltv: '€11,200', lastSeen: '1d ago', country: 'SI' },
  { name: 'Stefan Müller', email: 'stefan@muller.de', company: 'Müller Haus GmbH', configs: 2, ltv: '€9,840', lastSeen: '3d ago', country: 'DE' },
  { name: 'Andrej Zupan', email: 'andrej@gmail.com', company: 'Private', configs: 1, ltv: '€3,960', lastSeen: '3h ago', country: 'SI' },
];

export default function CustomersPage() {
  return (
    <div data-screen-label="Customers">
      <PageHeader
        title="Customers"
        desc="Buyers who have submitted at least one lead. Aggregated across all configurators."
        actions={<Btn variant="secondary" size="sm">Export CSV</Btn>}
      />
      <div style={{ padding: '28px 32px' }}>
        <Card pad={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-line)' }}>
                {['Customer', 'Submissions', 'LTV', 'Last seen', 'Country', ''].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={i} style={{ borderBottom: i < customers.length - 1 ? '1px solid var(--color-line)' : 'none', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{c.email}</div>
                    {c.company !== 'Private' && <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{c.company}</div>}
                  </td>
                  <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{c.configs}</td>
                  <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>{c.ltv}</td>
                  <td style={{ padding: '12px 20px', fontSize: 12.5, color: 'var(--color-text-3)' }}>{c.lastSeen}</td>
                  <td style={{ padding: '12px 20px', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>{c.country}</td>
                  <td style={{ padding: '12px 20px' }}>
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
