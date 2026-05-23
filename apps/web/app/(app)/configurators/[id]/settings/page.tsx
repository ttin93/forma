'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface Domain {
  id: string;
  host: string;
  verifiedAt: string | null;
}

interface ConfiguratorInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
}

const CDN_HOST = process.env.NEXT_PUBLIC_CDN_HOST ?? 'cdn.forma.studio';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    live: { label: 'Live', color: '#16a34a', bg: '#f0fdf4' },
    draft: { label: 'Draft', color: '#92400e', bg: '#fffbeb' },
    archived: { label: 'Archived', color: '#525252', bg: '#f5f5f5' },
  };
  const s = map[status] ?? map.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px',
      borderRadius: 999, fontSize: 12, fontWeight: 500,
      color: s.color, background: s.bg, border: `1px solid ${s.color}33`,
    }}>
      {status === 'live' && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      )}
      {s.label}
    </span>
  );
}

export default function ConfiguratorSettingsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [info, setInfo] = useState<ConfiguratorInfo | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newHost, setNewHost] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchInfo = useCallback(async () => {
    const res = await fetch(`/api/v1/configurators/${id}`);
    if (!res.ok) return;
    const data = await res.json() as { id: string; name: string; slug: string; status: string };
    setInfo({ id: data.id, name: data.name, slug: data.slug, status: data.status });
  }, [id]);

  const fetchDomains = useCallback(async () => {
    const res = await fetch(`/api/v1/configurators/${id}/domains`);
    if (!res.ok) return;
    const data = await res.json() as Domain[];
    setDomains(data);
  }, [id]);

  useEffect(() => {
    fetchInfo();
    fetchDomains();
  }, [fetchInfo, fetchDomains]);

  async function toggleStatus() {
    if (!info) return;
    setToggling(true);
    const endpoint = info.status === 'live' ? 'unpublish' : 'publish';
    const res = await fetch(`/api/v1/configurators/${id}/${endpoint}`, { method: 'POST' });
    if (res.ok) await fetchInfo();
    setToggling(false);
  }

  async function addDomain(e: React.FormEvent) {
    e.preventDefault();
    const host = newHost.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!host) return;
    setAdding(true);
    setAddError('');
    const res = await fetch(`/api/v1/configurators/${id}/domains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host }),
    });
    if (res.ok) {
      setNewHost('');
      await fetchDomains();
    } else {
      const data = await res.json() as { error?: string };
      setAddError(data.error ?? 'Failed to add domain');
    }
    setAdding(false);
  }

  async function removeDomain(domainId: string) {
    await fetch(`/api/v1/configurators/${id}/domains/${domainId}`, { method: 'DELETE' });
    setDomains(prev => prev.filter(d => d.id !== domainId));
  }

  const embedSnippet = info
    ? `<script src="https://${CDN_HOST}/embed.js" data-configurator="${info.slug}" async></script>`
    : '';

  function copySnippet() {
    navigator.clipboard.writeText(embedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!info) {
    return (
      <div style={{ padding: '40px 32px', color: 'var(--color-text-3)', fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  return (
    <div data-screen-label="Configurator Settings" style={{
      padding: '32px', maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 32,
    }}>

      {/* Status section */}
      <section>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 16px' }}>
          Status
        </h2>
        <div style={{
          border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)',
          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>{info.name}</span>
              <StatusBadge status={info.status} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>slug: {info.slug}</span>
          </div>
          <button
            onClick={toggleStatus}
            disabled={toggling || info.status === 'archived'}
            style={{
              height: 32, padding: '0 16px', borderRadius: 'var(--radius-2)',
              border: '1px solid',
              borderColor: info.status === 'live' ? '#d1d5db' : 'var(--color-ink)',
              background: info.status === 'live' ? '#fff' : 'var(--color-ink)',
              color: info.status === 'live' ? 'var(--color-ink)' : '#fff',
              fontSize: 13, fontWeight: 500, cursor: toggling ? 'wait' : 'pointer',
              opacity: info.status === 'archived' ? 0.5 : 1,
            }}
          >
            {toggling ? '…' : info.status === 'live' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
        {info.status === 'draft' && (
          <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: '8px 0 0' }}>
            Publishing makes this configurator accessible via the embed script.
          </p>
        )}
      </section>

      {/* Allowed domains */}
      <section>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 4px' }}>
          Allowed domains
        </h2>
        <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: '0 0 16px' }}>
          The embed will only render on these domains. Leave empty to allow all origins.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', overflow: 'hidden', background: '#fff' }}>
          {domains.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--color-text-3)' }}>
              No domains — embed is allowed on all origins.
            </div>
          ) : (
            domains.map((d, i) => (
              <div
                key={d.id}
                style={{
                  padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderTop: i > 0 ? '1px solid var(--color-line)' : 'none',
                }}
              >
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>
                  {d.host}
                </span>
                <button
                  onClick={() => removeDomain(d.id)}
                  style={{
                    fontSize: 12, color: 'var(--color-text-3)', background: 'none', border: 'none',
                    cursor: 'pointer', padding: '2px 4px', borderRadius: 4,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-3)')}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={addDomain} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            type="text"
            value={newHost}
            onChange={e => setNewHost(e.target.value)}
            placeholder="example.com"
            style={{
              flex: 1, height: 34, padding: '0 12px', border: '1px solid var(--color-line-2)',
              borderRadius: 'var(--radius-2)', fontSize: 13, outline: 'none',
              fontFamily: 'var(--font-mono)', color: 'var(--color-ink)',
            }}
          />
          <button
            type="submit"
            disabled={adding || !newHost.trim()}
            style={{
              height: 34, padding: '0 14px', borderRadius: 'var(--radius-2)',
              border: '1px solid var(--color-line-2)', background: '#fff',
              fontSize: 13, fontWeight: 500, color: 'var(--color-ink)',
              cursor: adding || !newHost.trim() ? 'not-allowed' : 'pointer',
              opacity: !newHost.trim() ? 0.5 : 1,
            }}
          >
            {adding ? '…' : 'Add'}
          </button>
        </form>
        {addError && (
          <p style={{ fontSize: 12, color: '#dc2626', margin: '6px 0 0' }}>{addError}</p>
        )}
      </section>

      {/* Embed snippet */}
      <section>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 4px' }}>
          Embed snippet
        </h2>
        <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: '0 0 12px' }}>
          Paste this into the <code style={{ fontFamily: 'var(--font-mono)' }}>&lt;head&gt;</code> or before the closing{' '}
          <code style={{ fontFamily: 'var(--font-mono)' }}>&lt;/body&gt;</code> tag of your website.
        </p>
        <div style={{ position: 'relative' }}>
          <pre style={{
            margin: 0, padding: '14px 16px', background: '#0a0a0a', color: '#e5e7eb',
            borderRadius: 'var(--radius-2)', fontSize: 12.5, fontFamily: 'var(--font-mono)',
            overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {embedSnippet}
          </pre>
          <button
            onClick={copySnippet}
            style={{
              position: 'absolute', top: 10, right: 10, height: 26, padding: '0 10px',
              borderRadius: 4, border: '1px solid #374151', background: '#1f2937',
              color: copied ? '#4ade80' : '#d1d5db', fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: '8px 0 0' }}>
          The configurator will render inside an iframe at the location where you place the script.
          Use <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>data-width</code> and{' '}
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>data-height</code> attributes to control sizing.
        </p>
      </section>

    </div>
  );
}
