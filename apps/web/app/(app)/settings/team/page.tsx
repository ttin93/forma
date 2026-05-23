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

const INVITE_ROLES = ['editor', 'sales', 'viewer', 'admin'] as const;

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'sales' | 'viewer' | 'admin'>('editor');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

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

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    const res = await fetch('/api/v1/workspaces/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    if (res.ok) {
      setInviteSuccess(true);
      setInviteEmail('');
      load();
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed' }));
      setInviteError(err.error ?? 'Failed to invite');
    }
    setInviting(false);
  }

  function closeInvite() {
    setShowInvite(false);
    setInviteEmail('');
    setInviteError(null);
    setInviteSuccess(false);
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
            <Btn variant="primary" size="sm" onClick={() => setShowInvite(true)}>+ Invite teammate</Btn>
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

      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) closeInvite(); }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 32, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>Invite teammate</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13.5, color: 'var(--color-text-3)' }}>They'll be added to your workspace immediately.</p>

            {inviteSuccess ? (
              <div>
                <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-2)', fontSize: 13.5, color: '#15803d', marginBottom: 20 }}>
                  ✓ Teammate added successfully.
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Btn variant="secondary" onClick={() => setInviteSuccess(false)}>Invite another</Btn>
                  <Btn variant="primary" onClick={closeInvite}>Done</Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-2)' }}>Email address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendInvite()}
                    placeholder="colleague@example.com"
                    style={{ width: '100%', height: 36, padding: '0 10px', fontSize: 13, border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', boxSizing: 'border-box' }}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-2)' }}>Role</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as typeof inviteRole)}
                    style={{ width: '100%', height: 36, padding: '0 10px', fontSize: 13, border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', background: '#fff', cursor: 'pointer' }}>
                    {INVITE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {inviteError && (
                  <div style={{ fontSize: 12.5, color: '#e53e3e' }}>{inviteError}</div>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                  <Btn variant="secondary" onClick={closeInvite} disabled={inviting}>Cancel</Btn>
                  <Btn variant="primary" disabled={!inviteEmail.trim() || inviting} onClick={sendInvite}>
                    {inviting ? 'Inviting…' : 'Send invite'}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
