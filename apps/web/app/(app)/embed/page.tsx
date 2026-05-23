'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/AppShell';
import { Badge, Btn } from '@/components/ui';

type Cfg = { id: string; name: string; slug: string; status: string };
type ApiKey = { id: string; name: string; prefix: string; scopes: string[]; lastUsedAt: string | null; createdAt: string };
type Webhook = { id: string; url: string; events: string[]; enabled: boolean; createdAt: string };

const PLATFORMS = [
  { name: 'WordPress', sub: 'Najpogosteje' },
  { name: 'Shopify', sub: '' },
  { name: 'Webflow', sub: '' },
  { name: 'Wix', sub: '' },
  { name: 'Squarespace', sub: '' },
  { name: 'Plain HTML', sub: 'Za razvijalce' },
  { name: 'Drugo', sub: '' },
  { name: 'Pomoč', sub: 'Pišite nam' },
];

const WEBHOOK_EVENTS = ['lead.created', 'lead.updated', 'lead.status_changed'];

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'ravnokar';
  if (m < 60) return `${m}m nazaj`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h nazaj`;
  return `${Math.floor(h / 24)}d nazaj`;
}

function CodeBox({ snippet, label }: { snippet: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ background: '#0a0a0a', borderRadius: 'var(--radius-3)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #171717', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: 8, background: '#3a3a3a' }} />)}
        </div>
        {label && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#737373' }}>{label}</span>}
      </div>
      <pre style={{ padding: '20px 24px', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, color: '#e3e3e3', margin: 0, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {snippet}
      </pre>
      <div style={{ padding: 14, borderTop: '1px solid #171717', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={copy}
          style={{
            padding: '8px 20px', fontSize: 13, fontWeight: 500,
            color: '#0a0a0a', background: copied ? '#d1fae5' : '#fff',
            borderRadius: 'var(--radius-2)', border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background .2s',
          }}
        >
          {copied ? '✓ Skopirano!' : 'Kopiraj kodo'}
        </button>
      </div>
    </div>
  );
}

export default function EmbedPage() {
  const [cfgs, setCfgs] = useState<Cfg[]>([]);
  const [selectedCfgId, setSelectedCfgId] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [advancedLoaded, setAdvancedLoaded] = useState(false);

  // New key state
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  // New webhook state
  const [showNewWh, setShowNewWh] = useState(false);
  const [newWhUrl, setNewWhUrl] = useState('');
  const [newWhEvents, setNewWhEvents] = useState<string[]>(['lead.created']);
  const [creatingWh, setCreatingWh] = useState(false);
  const [deletingWh, setDeletingWh] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/configurators').then(r => r.ok ? r.json() : []).then((data: Cfg[]) => {
      setCfgs(data);
      const live = data.find(c => c.status === 'live') ?? data[0];
      if (live) setSelectedCfgId(live.id);
    });
  }, []);

  async function loadAdvanced() {
    if (advancedLoaded) return;
    const [kr, wr] = await Promise.all([
      fetch('/api/v1/embed/keys'),
      fetch('/api/v1/embed/webhooks'),
    ]);
    if (kr.ok) setKeys(await kr.json());
    if (wr.ok) setWebhooks(await wr.json());
    setAdvancedLoaded(true);
  }

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
      fetch('/api/v1/embed/keys').then(r => r.ok ? r.json() : []).then(setKeys);
    }
    setCreatingKey(false);
  }

  async function revokeKey(id: string) {
    if (!confirm('Prekliči ta API ključ? Tega ni mogoče razveljaviti.')) return;
    setRevoking(id);
    await fetch(`/api/v1/embed/keys/${id}`, { method: 'DELETE' });
    setRevoking(null);
    fetch('/api/v1/embed/keys').then(r => r.ok ? r.json() : []).then(setKeys);
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
      fetch('/api/v1/embed/webhooks').then(r => r.ok ? r.json() : []).then(setWebhooks);
    } else {
      const err = await res.json().catch(() => ({ error: 'Neveljaven URL' }));
      alert(err.error ?? 'Napaka');
    }
    setCreatingWh(false);
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Izbriši ta webhook?')) return;
    setDeletingWh(id);
    await fetch(`/api/v1/embed/webhooks/${id}`, { method: 'DELETE' });
    setDeletingWh(null);
    fetch('/api/v1/embed/webhooks').then(r => r.ok ? r.json() : []).then(setWebhooks);
  }

  const selectedCfg = cfgs.find(c => c.id === selectedCfgId) ?? cfgs[0];
  const snippet = selectedCfg
    ? `<script async\n  src="https://cdn.forma.studio/embed.js"\n  data-config="${selectedCfg.id}"></script>`
    : `<script async\n  src="https://cdn.forma.studio/embed.js"\n  data-config="TVOJ_KONFIGURATOR_ID"></script>`;

  return (
    <div data-screen-label="Embed & API" style={{ padding: '0 0 80px' }}>
      <PageHeader
        title="Postavi na svojo stran"
        desc="Skopiraj kodo in jo prilepi na stran, kjer želiš da se pojavi konfigurator."
      />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 32px 0' }}>

        {/* Configurator selector (if multiple) */}
        {cfgs.length > 1 && (
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Konfigurator:</span>
            <select
              value={selectedCfgId ?? ''}
              onChange={e => setSelectedCfgId(e.target.value)}
              style={{ height: 32, padding: '0 10px', border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', fontSize: 13, background: '#fff', cursor: 'pointer' }}
            >
              {cfgs.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.status !== 'live' ? `(${c.status})` : ''}</option>
              ))}
            </select>
            {selectedCfg && (
              <Badge kind={selectedCfg.status === 'live' ? 'live' : 'neutral'} size="sm">
                {selectedCfg.status === 'live' ? '● Objavljeno' : selectedCfg.status}
              </Badge>
            )}
          </div>
        )}

        {/* Big code box */}
        <CodeBox
          snippet={snippet}
          label={selectedCfg ? `${selectedCfg.name} · ${selectedCfg.status === 'live' ? 'objavljeno' : selectedCfg.status}` : undefined}
        />

        {/* Where to paste */}
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 6px', letterSpacing: '-0.015em' }}>
            Ne znaš, kam prilepiti?
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', margin: '0 0 16px' }}>
            Izberi svojo platformo in pokažemo ti korak po korak navodilo.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {PLATFORMS.map((p, i) => (
              <button
                key={p.name}
                style={{
                  padding: '14px 16px', border: '1px solid var(--color-line-2)',
                  borderRadius: 'var(--radius-2)', display: 'flex', flexDirection: 'column',
                  gap: 4, textAlign: 'left', cursor: 'pointer',
                  background: i === 0 ? 'var(--color-surface)' : '#fff',
                  fontFamily: 'inherit',
                }}
                onClick={() => alert(`Navodila za ${p.name} — pridejo kmalu!`)}
              >
                <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-ink)' }}>{p.name}</span>
                {p.sub && <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{p.sub}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 hint */}
        <div style={{ marginTop: 40, padding: 18, background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', fontSize: 13.5, color: 'var(--color-text-3)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--color-ink)', fontWeight: 500 }}>Korak 2 od 2:</strong> Ko si prilepil kodo, odpri svojo stran in preveri da se konfigurator prikaže. Vse konfiguracije so živijo v Forma — ni potrebe po nadaljnji namestitvi.
        </div>

        {/* Advanced collapse */}
        <details
          style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--color-line)' }}
          onToggle={e => { if ((e.target as HTMLDetailsElement).open) loadAdvanced(); }}
        >
          <summary style={{ fontSize: 13, color: 'var(--color-text-3)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform .15s', transform: 'rotate(0deg)' }}>
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)', fontWeight: 500 }}>Napredno</span>
            <span style={{ color: 'var(--color-muted)' }}>· API ključi, webhooki, povezave z drugimi orodji</span>
          </summary>

          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* API Keys */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>API ključi</div>
                <Btn variant="secondary" size="sm" onClick={() => setShowNewKey(true)}>+ Nov ključ</Btn>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: '0 0 12px' }}>Za branje leadov iz lastnih sistemov.</p>
              {!advancedLoaded ? (
                <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Nalagam…</div>
              ) : keys.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--color-muted)', padding: '12px 0' }}>Ni API ključev.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {keys.map(k => (
                    <div key={k.id} style={{ padding: '10px 12px', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{k.name}</span>
                        <Btn variant="ghost" size="sm" disabled={revoking === k.id} onClick={() => revokeKey(k.id)}>
                          {revoking === k.id ? '…' : 'Prekliči'}
                        </Btn>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-3)' }}>{k.prefix}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 4 }}>
                        {k.lastUsedAt ? `Zadnja uporaba ${timeAgo(k.lastUsedAt)}` : 'Še ni bil uporabljen'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Webhooks */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Webhooki</div>
                <Btn variant="secondary" size="sm" onClick={() => setShowNewWh(true)}>+ Dodaj</Btn>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: '0 0 12px' }}>Pošlji lead podatke v real-timu v tvoje sisteme.</p>
              {!advancedLoaded ? (
                <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Nalagam…</div>
              ) : webhooks.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--color-muted)', padding: '12px 0' }}>Ni webhookov.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {webhooks.map(wh => (
                    <div key={wh.id} style={{ padding: '10px 12px', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', background: '#fff', display: 'flex', gap: 10 }}>
                      <Badge kind={wh.enabled ? 'live' : 'neutral'} size="sm">{wh.enabled ? '●' : '○'}</Badge>
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
            </div>
          </div>
        </details>
      </div>

      {/* New API key modal */}
      {showNewKey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget && !creatingKey) setShowNewKey(false); }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 32, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>Nov API ključ</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--color-text-3)' }}>Poimenuj ga, da veš za kaj ga uporabljaš.</p>
            <input
              autoFocus value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
              placeholder="npr. CRM sync, Produkcija"
              style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 13.5, border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', outline: 'none', boxSizing: 'border-box' as const }}
              onKeyDown={e => e.key === 'Enter' && createKey()}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setShowNewKey(false)} disabled={creatingKey}>Prekliči</Btn>
              <Btn variant="primary" disabled={!newKeyName.trim() || creatingKey} onClick={createKey}>
                {creatingKey ? 'Ustvarjam…' : 'Ustvari ključ'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Revealed key */}
      {revealedKey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 32, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>Skopiraj API ključ</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'var(--color-text-3)' }}>To je edinkrat ko vidiš celoten ključ. Shrani ga na varno mesto.</p>
            <div style={{ background: '#0a0a0a', borderRadius: 'var(--radius-2)', padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: '#e3e3e3', wordBreak: 'break-all', marginBottom: 12 }}>
              {revealedKey}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => navigator.clipboard?.writeText(revealedKey)}>Kopiraj</Btn>
              <Btn variant="primary" onClick={() => setRevealedKey(null)}>Končano</Btn>
            </div>
          </div>
        </div>
      )}

      {/* New webhook modal */}
      {showNewWh && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget && !creatingWh) setShowNewWh(false); }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 32, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>Nov webhook</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--color-text-3)' }}>Pošljemo ti podpisane JSON podatke za vsak izbrani dogodek.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 6 }}>URL</div>
                <input
                  autoFocus value={newWhUrl} onChange={e => setNewWhUrl(e.target.value)}
                  placeholder="https://tvoja-stran.si/webhook"
                  style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 13.5, border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', outline: 'none', boxSizing: 'border-box' as const }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 8 }}>Dogodki</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {WEBHOOK_EVENTS.map(ev => (
                    <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={newWhEvents.includes(ev)}
                        onChange={e => setNewWhEvents(prev => e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev))} />
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setShowNewWh(false)} disabled={creatingWh}>Prekliči</Btn>
              <Btn variant="primary" disabled={!newWhUrl.trim() || newWhEvents.length === 0 || creatingWh} onClick={createWebhook}>
                {creatingWh ? 'Shranjujem…' : 'Dodaj webhook'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
