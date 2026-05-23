'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/AppShell';
import { Btn, Card, Input } from '@/components/ui';

type WorkspaceSettings = {
  name: string;
  industry: string | null;
  currency: string;
  locale: string;
  timezone: string;
  brandPrimary: string | null;
  brandLogoUrl: string | null;
  brandFont: string | null;
};

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HRK'];
const LOCALES = ['en-US', 'en-GB', 'sl-SI', 'de-DE', 'fr-FR', 'it-IT', 'es-ES', 'nl-NL', 'pl-PL', 'cs-CZ'];
const TIMEZONES = [
  'Europe/Ljubljana', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Rome',
  'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Warsaw', 'Europe/Prague', 'America/New_York',
  'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC',
];

const selectStyle: React.CSSProperties = {
  height: 36, padding: '0 10px', fontSize: 13, border: '1px solid var(--color-line-2)',
  borderRadius: 'var(--radius-2)', background: '#fff', cursor: 'pointer', width: '100%',
};

export default function WorkspaceSettingsPage() {
  const [form, setForm] = useState<WorkspaceSettings>({
    name: '', industry: '', currency: 'EUR', locale: 'sl-SI', timezone: 'Europe/Ljubljana',
    brandPrimary: '#0a0a0a', brandLogoUrl: '', brandFont: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/workspaces/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setForm({
          name: d.name ?? '',
          industry: d.industry ?? '',
          currency: d.currency ?? 'EUR',
          locale: d.locale ?? 'sl-SI',
          timezone: d.timezone ?? 'Europe/Ljubljana',
          brandPrimary: d.brandPrimary ?? '#0a0a0a',
          brandLogoUrl: d.brandLogoUrl ?? '',
          brandFont: d.brandFont ?? '',
        });
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/v1/workspaces/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        industry: form.industry || undefined,
        currency: form.currency,
        locale: form.locale,
        timezone: form.timezone,
        brandPrimary: form.brandPrimary || undefined,
        brandLogoUrl: form.brandLogoUrl || undefined,
        brandFont: form.brandFont || undefined,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to save' }));
      setError(err.error ?? 'Failed to save');
    }
    setSaving(false);
  }

  const field = (key: keyof WorkspaceSettings) => ({
    value: String(form[key] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  if (loading) {
    return (
      <div data-screen-label="Settings — Workspace">
        <PageHeader title="Workspace" desc="Brand and localization settings for your workspace." />
        <div style={{ padding: '28px 32px', fontSize: 13, color: 'var(--color-muted)' }}>Loading…</div>
      </div>
    );
  }

  return (
    <div data-screen-label="Settings — Workspace">
      <PageHeader
        title="Workspace"
        desc="Brand and localization settings for your workspace."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && <span style={{ fontSize: 12.5, color: '#16a34a' }}>Saved ✓</span>}
            {error && <span style={{ fontSize: 12.5, color: '#e53e3e' }}>{error}</span>}
            <Btn variant="primary" size="sm" disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save changes'}
            </Btn>
          </div>
        }
      />
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>

        <Card pad={24}>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 16 }}>General</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Workspace name" placeholder="My Company" full {...field('name')} />
            <Input label="Industry" placeholder="e.g. Construction, Furniture, Outdoor" full {...field('industry')} />
          </div>
        </Card>

        <Card pad={24}>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 16 }}>Branding</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-2)' }}>Primary color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="color"
                  value={form.brandPrimary ?? '#0a0a0a'}
                  onChange={e => setForm(prev => ({ ...prev, brandPrimary: e.target.value }))}
                  style={{ width: 40, height: 36, border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', cursor: 'pointer', padding: 2 }}
                />
                <input
                  type="text"
                  value={form.brandPrimary ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, brandPrimary: e.target.value }))}
                  placeholder="#0a0a0a"
                  style={{ height: 36, padding: '0 10px', fontSize: 13, border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', width: 120, fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
            <Input label="Logo URL" placeholder="https://example.com/logo.png" full {...field('brandLogoUrl')} />
            <Input label="Font family" placeholder="e.g. Geist, Inter" full {...field('brandFont')} />
          </div>
        </Card>

        <Card pad={24}>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 16 }}>Localization</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-2)' }}>Currency</label>
              <select value={form.currency} onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))} style={selectStyle}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-2)' }}>Locale</label>
              <select value={form.locale} onChange={e => setForm(prev => ({ ...prev, locale: e.target.value }))} style={selectStyle}>
                {LOCALES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6, color: 'var(--color-text-2)' }}>Timezone</label>
              <select value={form.timezone} onChange={e => setForm(prev => ({ ...prev, timezone: e.target.value }))} style={selectStyle}>
                {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
