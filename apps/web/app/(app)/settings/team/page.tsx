import { PageHeader } from '@/components/AppShell';
import { Card, Badge, Btn, Avatar } from '@/components/ui';

const members = [
  { name: 'Aleš Kovač', email: 'ales@sunpergola.si', role: 'owner', joined: 'Jan 15, 2026', avatar: 'AK' },
  { name: 'Nina Prijatelj', email: 'nina@sunpergola.si', role: 'editor', joined: 'Feb 3, 2026', avatar: 'NP' },
  { name: 'Boštjan Zore', email: 'bostjan@sunpergola.si', role: 'sales', joined: 'Mar 18, 2026', avatar: 'BZ' },
];

export default function TeamPage() {
  return (
    <div data-screen-label="Settings — Team">
      <PageHeader title="Team" desc="Manage team members and lead routing rules." />
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card pad={0}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Members <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-muted)', marginLeft: 6 }}>3 / 5</span></div>
            <Btn variant="primary" size="sm">+ Invite teammate</Btn>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-line)' }}>
                {['Member', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={i} style={{ borderBottom: i < members.length - 1 ? '1px solid var(--color-line)' : 'none' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={m.name} size={28} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <Badge kind={m.role === 'owner' ? 'live' : 'neutral'} size="sm">{m.role}</Badge>
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--color-text-3)' }}>{m.joined}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {m.role !== 'owner' && <Btn variant="ghost" size="sm">Change role</Btn>}
                      {m.role !== 'owner' && <Btn variant="ghost" size="sm">Remove</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card pad={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Lead routing rules</div>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: '4px 0 0' }}>Auto-assign leads to specific team members based on configurator, value or location.</p>
            </div>
            <Btn variant="secondary" size="sm">+ Add rule</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { priority: 1, match: 'Value ≥ €10,000', action: 'Assign to Aleš Kovač', enabled: true },
              { priority: 2, match: 'Configurator: Pergola XL', action: 'Assign to Aleš Kovač', enabled: true },
              { priority: 3, match: 'Source contains "google-ads"', action: 'Round-robin: Nina, Boštjan', enabled: true },
              { priority: 4, match: 'Catch-all', action: 'Round-robin: all members', enabled: true },
            ].map((rule, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', minWidth: 16 }}>#{rule.priority}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--color-text-2)' }}>If <strong>{rule.match}</strong> → {rule.action}</span>
                </div>
                <Badge kind="live" size="sm">on</Badge>
                <Btn variant="ghost" size="sm">Edit</Btn>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
