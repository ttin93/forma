'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/AppShell';
import { Btn, Card } from '@/components/ui';

interface NotifSettings {
  notifEmailLead: boolean;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: on ? '#0a0a0a' : '#d4d4d4', position: 'relative',
        transition: 'background .15s', padding: 0, flexShrink: 0,
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 10, background: '#fff',
        position: 'absolute', top: 2, left: on ? 22 : 2, transition: 'left .15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

function NotifRow({ label, desc, on, onChange }: {
  label: string; desc: string; on: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, padding: '16px 0', borderBottom: '1px solid var(--color-line)' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 12.5, color: 'var(--color-text-3)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <Toggle on={on} onClick={() => onChange(!on)} />
    </div>
  );
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotifSettings>({ notifEmailLead: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/v1/workspaces/me')
      .then(r => r.json())
      .then((d: NotifSettings & Record<string, unknown>) => {
        setSettings({ notifEmailLead: d.notifEmailLead ?? true });
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/v1/workspaces/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-screen-label="Settings — Notifications">
      <PageHeader title="Notifications" desc="Choose which emails and alerts you receive." />
      <div style={{ padding: '28px 32px', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>

        <Card pad={24}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--color-ink)' }}>Email</div>
          <div style={{ fontSize: 12.5, color: 'var(--color-text-3)', marginBottom: 4 }}>
            Sent to the workspace owner or assigned team member.
          </div>

          {loading ? (
            <div style={{ padding: '20px 0', color: 'var(--color-muted)', fontSize: 13 }}>Loading…</div>
          ) : (
            <>
              <NotifRow
                label="New lead notification"
                desc="Receive an email every time a customer submits a configuration request."
                on={settings.notifEmailLead}
                onChange={v => setSettings(s => ({ ...s, notifEmailLead: v }))}
              />
              <div style={{ paddingTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Btn variant="primary" size="sm" disabled={saving} onClick={save}>
                  {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
                </Btn>
                {saved && <span style={{ fontSize: 12.5, color: '#16a34a' }}>Changes saved.</span>}
              </div>
            </>
          )}
        </Card>

        <Card pad={24}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--color-ink)' }}>Webhooks</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)', lineHeight: 1.5 }}>
            Webhook delivery is configured per endpoint in{' '}
            <a href="/embed" style={{ color: 'var(--color-ink)', textDecoration: 'underline' }}>Embed → Webhooks</a>.
            Each webhook independently selects which events to receive.
          </div>
        </Card>

      </div>
    </div>
  );
}
