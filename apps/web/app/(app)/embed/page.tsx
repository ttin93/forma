'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/AppShell';
import { Card, Badge, Btn } from '@/components/ui';

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
};

type Webhook = {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
};

const WEBHOOK_EVENTS = ['lead.created', 'lead.updated', 'lead.status_changed'];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function EmbedPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [webhooksLoading, setWebhooksLoading] = useState(true);

  // New key modal
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  // New webhook modal
  const [showNewWh, setShowNewWh] = useState(false);
  const [newWhUrl, setNewWhUrl] = useState('');
  const [newWhEvents, setNewWhEvents] = useState<string[]>(['lead.created']);
  const [creatingWh, setCreatingWh] = useState(false);

  const [revoking, setRevoking] = useState<string | null>(null);
  const [deletingWh, setDeletingWh] = useState<string | null>(null);

  async function loadKeys() {
    setKeysLoading(true);
    const res = await fetch('/api/v1/embed/keys');
    if (res.ok) setKeys(await res.json());
    setKeysLoading(false);
  }

  async function loadWebhooks() {
    setWebhooksLoading(true);
    const res = await fetch('/api/v1/embed/webhooks');
    if (res.ok) setWebhooks(await res.json());
    setWebhooksLoading(false);
  }

  useEffect(() => { loadKeys(); loadWebhooks(); }, []);

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    const res = await fetch('/api/v1/embed/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setRevealedKey(data.key);
      setShowNewKey(false);
      setNewKeyName('');
      loadKeys();
    }
    setCreatingKey(false);
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    setRevoking(id);
    await fetch(`/api/v1/embed/keys/${id}`, { method: 'DELETE' });
    setRevoking(null);
    loadKeys();
  }

  async function createWebhook() {
    if (!newWhUrl.trim()) return;
    setCreatingWh(true);
    const res = await fetch('/api/v1/embed/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newWhUrl.trim(), events: newWhEvents }),
    });
    if (res.ok) {
      setShowNewWh(false);
      setNewWhUrl('');
      setNewWhEvents(['lead.created']);
      loadWebhooks();
    } else {
      const err = await res.json().catch(() => ({ error: 'Invalid URL' }));
      alert(err.error ?? 'Failed');
    }
    setCreatingWh(false);
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Delete this webhook?')) return;
    setDeletingWh(id);
    await fetch(`/api/v1/embed/webhooks/${id}`, { method: 'DELETE' });
    setDeletingWh(null);
    loadWebhooks();
  }

  const snippet = `<script
  src="https://cdn.forma.studio/embed.js"
  data-workspace="YOUR_WORKSPACE_SLUG"
  data-config="YOUR_CONFIGURATOR_SLUG"
  async>
</script>`;

  return (
    <div data-screen-label="Embed & API">
      <PageHeader title="Embed & API" desc="Manage how your configurators appear on external sites." />

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Embed snippet */}
        <Card pad={24}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Embed snippet</div>
          <p style={{ fontSize: 13, color: 'var(--color-text-3)', margin: '0 0 16px' }}>
            Paste this inside the <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--color-surface)', padding: '1px 5px', borderRadius: 3 }}>&lt;body&gt;</code> of your page, replacing the slugs with your own.
          </p>
          <div style={{ background: '#0a0a0a', borderRadius: 'var(--radius-2)', padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: '#e3e3e3', lineHeight: 1.65, overflow: 'auto', marginBottom: 12 }}>
            <pre style={{ margin: 0 }}>{snippet}</pre>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" onClick={() => navigator.clipboard?.writeText(snippet)}>Copy snippet</Btn>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* API keys */}
          <Card pad={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>API keys</div>
              <Btn variant="secondary" size="sm" onClick={() => setShowNewKey(true)}>+ New key</Btn>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: '0 0 16px' }}>Use API keys to read leads and configurator data from your own systems.</p>
            {keysLoading ? (
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Loading…</div>
            ) : keys.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-muted)', textAlign: 'center', padding: '16px 0' }}>No API keys yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {keys.map(k => (
                  <div key={k.id} style={{ padding: '10px 12px', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{k.name}</span>
                      <Btn variant="ghost" size="sm" disabled={revoking === k.id} onClick={() => revokeKey(k.id)}>
                        {revoking === k.id ? '…' : 'Revoke'}
                      </Btn>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-3)' }}>{k.prefix}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 4 }}>
                      {k.lastUsedAt ? `Last used ${timeAgo(k.lastUsedAt)}` : 'Never used'} · {k.scopes.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Webhooks */}
          <Card pad={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Webhooks</div>
              <Btn variant="secondary" size="sm" onClick={() => setShowNewWh(true)}>+ Add webhook</Btn>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: '0 0 16px' }}>Push lead events to your systems in real time with signed HMAC payloads.</p>
            {webhooksLoading ? (
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Loading…</div>
            ) : webhooks.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-muted)', textAlign: 'center', padding: '16px 0' }}>No webhooks configured.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {webhooks.map(wh => (
                  <div key={wh.id} style={{ padding: '10px 12px', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ marginTop: 2 }}><Badge kind={wh.enabled ? 'live' : 'neutral'} size="sm">{wh.enabled ? 'active' : 'off'}</Badge></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wh.url}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 3 }}>{wh.events.join(', ')}</div>
                    </div>
                    <Btn variant="ghost" size="sm" disabled={deletingWh === wh.id} onClick={() => deleteWebhook(wh.id)}>
                      {deletingWh === wh.id ? '…' : '×'}
                    </Btn>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New API key modal */}
      {showNewKey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget && !creatingKey) setShowNewKey(false); }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 32, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>New API key</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13.5, color: 'var(--color-text-3)' }}>Give it a descriptive name so you know what it's used for.</p>
            <input
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="e.g. CRM sync, Production"
              style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 13.5, border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', outline: 'none', boxSizing: 'border-box' }}
              onKeyDown={e => e.key === 'Enter' && createKey()}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setShowNewKey(false)} disabled={creatingKey}>Cancel</Btn>
              <Btn variant="primary" disabled={!newKeyName.trim() || creatingKey} onClick={createKey}>
                {creatingKey ? 'Creating…' : 'Create key'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Revealed key modal */}
      {revealedKey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 32, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>Copy your API key</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'var(--color-text-3)' }}>This is the only time you'll see the full key. Store it somewhere safe.</p>
            <div style={{ background: '#0a0a0a', borderRadius: 'var(--radius-2)', padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: '#e3e3e3', wordBreak: 'break-all', marginBottom: 12 }}>
              {revealedKey}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => navigator.clipboard?.writeText(revealedKey)}>Copy</Btn>
              <Btn variant="primary" onClick={() => setRevealedKey(null)}>Done</Btn>
            </div>
          </div>
        </div>
      )}

      {/* New webhook modal */}
      {showNewWh && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget && !creatingWh) setShowNewWh(false); }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 32, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>New webhook</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--color-text-3)' }}>We'll POST a signed JSON payload to this URL for each selected event.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 6 }}>Endpoint URL</div>
                <input
                  value={newWhUrl}
                  onChange={e => setNewWhUrl(e.target.value)}
                  placeholder="https://your-site.com/webhook"
                  style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 13.5, border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 8 }}>Events</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {WEBHOOK_EVENTS.map(ev => (
                    <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newWhEvents.includes(ev)}
                        onChange={e => setNewWhEvents(prev => e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev))}
                      />
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setShowNewWh(false)} disabled={creatingWh}>Cancel</Btn>
              <Btn variant="primary" disabled={!newWhUrl.trim() || newWhEvents.length === 0 || creatingWh} onClick={createWebhook}>
                {creatingWh ? 'Saving…' : 'Add webhook'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
