'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/AppShell';
import { Card, Badge, Btn, Avatar } from '@/components/ui';

type Member = {
  id: string;
  role: string;
  joinedAt: string | null;
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
};

const ROLES = ['admin', 'editor', 'sales', 'viewer'] as const;
type Role = typeof ROLES[number];

const ROLE_BADGE: Record<string, 'live' | 'neutral' | 'warn'> = {
  owner: 'live',
  admin: 'warn',
  editor: 'neutral',
  sales: 'neutral',
  viewer: 'neutral',
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/v1/workspaces/members');
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function changeRole(memberId: string, role: Role) {
    setChangingRole(memberId);
    await fetch(`/api/v1/workspaces/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setChangingRole(null);
    load();
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remove this team member?')) return;
    setRemoving(memberId);
    await fetch(`/api/v1/workspaces/members/${memberId}`, { method: 'DELETE' });
    setRemoving(null);
    load();
  }

  return (
    <div data-screen-label="Settings — Team">
      <PageHeader title="Team" desc="Manage team members and lead routing rules." />
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card pad={0}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>
              Members{' '}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-muted)', marginLeft: 6 }}>
                {members.length} / 5
              </span>
            </div>
            <Btn variant="primary" size="sm">+ Invite teammate</Btn>
          </div>
          {loading ? (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--color-muted)' }}>Loading…</div>
          ) : (
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
                  <tr key={m.id} style={{ borderBottom: i < members.length - 1 ? '1px solid var(--color-line)' : 'none' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={m.name ?? m.email} size={28} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name ?? '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {m.role === 'owner' ? (
                        <Badge kind="live" size="sm">owner</Badge>
                      ) : (
                        <select
                          value={m.role}
                          disabled={changingRole === m.id}
                          onChange={e => changeRole(m.id, e.target.value as Role)}
                          style={{
                            padding: '3px 8px', borderRadius: 'var(--radius-2)',
                            border: '1px solid var(--color-line-2)', fontSize: 12,
                            background: '#fff', cursor: 'pointer',
                          }}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--color-text-3)' }}>
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {m.role !== 'owner' && (
                        <Btn
                          variant="ghost"
                          size="sm"
                          disabled={removing === m.id}
                          onClick={() => removeMember(m.id)}
                        >
                          Remove
                        </Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card pad={20}>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 8 }}>
            Need more seats?{' '}
            <a href="/settings/billing" style={{ color: 'var(--color-ink)', borderBottom: '1px solid currentColor', textDecoration: 'none' }}>
              Upgrade your plan →
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
