'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/AppShell';
import { Btn, Card, Input } from '@/components/ui';

export default function SecurityPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const row: React.CSSProperties = { marginBottom: 16 };

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (form.newPassword.length < 10) {
      setError('New password must be at least 10 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/v1/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to update password.'); return; }
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-screen-label="Settings — Security">
      <PageHeader title="Security" desc="Manage your password and account security." />
      <div style={{ padding: '28px 32px', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>

        <Card pad={24}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: 'var(--color-ink)' }}>
            Change password
          </div>
          <form onSubmit={handleChangePassword}>
            <div style={row}>
              <Input
                label="Current password"
                type="password"
                value={form.currentPassword}
                onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                full
              />
            </div>
            <div style={row}>
              <Input
                label="New password"
                type="password"
                hint="At least 10 characters"
                value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                full
              />
            </div>
            <div style={{ ...row, marginBottom: 20 }}>
              <Input
                label="Confirm new password"
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                full
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-2)', fontSize: 13, color: '#b91c1c', marginBottom: 16 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-2)', fontSize: 13, color: '#15803d', marginBottom: 16 }}>
                Password updated successfully.
              </div>
            )}

            <Btn variant="primary" size="sm" disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}>
              {saving ? 'Saving…' : 'Update password'}
            </Btn>
          </form>
        </Card>

        <Card pad={24}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--color-ink)' }}>Active sessions</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 16, lineHeight: 1.5 }}>
            Sessions are managed automatically. Signing out from all devices invalidates all active sessions.
          </div>
          <Btn
            variant="secondary"
            size="sm"
            onClick={async () => {
              await fetch('/api/v1/auth/sign-out', { method: 'POST' });
              window.location.href = '/sign-in';
            }}
          >
            Sign out from all devices
          </Btn>
        </Card>

      </div>
    </div>
  );
}
