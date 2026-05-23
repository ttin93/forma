'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/AppShell';
import { Badge, Btn, Card, Input } from '@/components/ui';

type Configurator = {
  id: string;
  slug: string;
  name: string;
  status: string;
  liveVersionId: string | null;
  createdAt: string;
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function ConfiguratorsPage() {
  const router = useRouter();
  const [cfgs, setCfgs] = useState<Configurator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const slugEdited = useRef(false);

  async function load() {
    const res = await fetch('/api/v1/configurators');
    if (res.ok) setCfgs(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function onNameChange(val: string) {
    setNewName(val);
    if (!slugEdited.current) setNewSlug(slugify(val));
  }

  async function create() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch('/api/v1/configurators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), slug: newSlug || slugify(newName) }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/configurators/${id}/builder`);
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed' }));
      alert(err.error ?? 'Failed to create configurator');
      setCreating(false);
    }
  }

  async function deleteConfigurator(id: string, name: string) {
    if (!confirm(`Archive "${name}"? It will no longer appear in this list.`)) return;
    setDeleting(id);
    await fetch(`/api/v1/configurators/${id}`, { method: 'DELETE' });
    setDeleting(null);
    load();
  }

  function closeModal() {
    setShowNew(false);
    setNewName('');
    setNewSlug('');
    slugEdited.current = false;
  }

  return (
    <div data-screen-label="Configurators — Grid">
      <PageHeader
        title="Configurators"
        desc="Manage your product configurators. Each one generates leads and a quote PDF."
        actions={
          <Btn variant="primary" size="sm" onClick={() => setShowNew(true)}>+ New configurator</Btn>
        }
      />

      <div style={{ padding: '28px 32px' }}>
        {loading ? (
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {cfgs.map(c => (
              <Card key={c.id} pad={0} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 140, background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--color-line)' }}>
                  <svg viewBox="0 0 200 100" width="180" height="90" fill="none" stroke="var(--color-line-3)" strokeWidth="1">
                    <rect x="10" y="20" width="180" height="6" />
                    <rect x="10" y="26" width="6" height="64" />
                    <rect x="184" y="26" width="6" height="64" />
                    {Array.from({ length: 10 }).map((_, i) => (
                      <rect key={i} x={10 + i * 19} y="20" width="5" height="20" />
                    ))}
                  </svg>
                </div>
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>/{c.slug}</div>
                    </div>
                    <Badge kind={c.status === 'live' ? 'live' : 'neutral'} size="sm">{c.status}</Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/configurators/${c.id}/builder`} style={{ flex: 1 }}>
                      <Btn variant="secondary" size="sm" full>Edit</Btn>
                    </Link>
                    <Btn variant="ghost" size="sm" disabled={deleting === c.id} onClick={() => deleteConfigurator(c.id, c.name)}>
                      {deleting === c.id ? '…' : 'Archive'}
                    </Btn>
                  </div>
                </div>
              </Card>
            ))}

            <button
              onClick={() => setShowNew(true)}
              style={{ all: 'unset', border: '1px dashed var(--color-line-3)', borderRadius: 'var(--radius-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 240, cursor: 'pointer', color: 'var(--color-text-3)' }}
            >
              <div style={{ width: 40, height: 40, border: '1px solid var(--color-line-3)', borderRadius: 'var(--radius-2)', display: 'grid', placeItems: 'center', fontSize: 20 }}>+</div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-2)' }}>New configurator</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Start blank or pick a template</div>
            </button>
          </div>
        )}
      </div>

      {showNew && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 32, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>New configurator</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13.5, color: 'var(--color-text-3)' }}>Give it a name — you can change it any time.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Name"
                placeholder="e.g. Pergola Classic"
                value={newName}
                onChange={e => onNameChange(e.target.value)}
                full
              />
              <Input
                label="URL slug"
                prefix="/"
                placeholder="pergola-classic"
                value={newSlug}
                onChange={e => { slugEdited.current = true; setNewSlug(e.target.value.replace(/[^a-z0-9-]/g, '')); }}
                full
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={closeModal} disabled={creating}>Cancel</Btn>
              <Btn variant="primary" disabled={!newName.trim() || creating} onClick={create}>
                {creating ? 'Creating…' : 'Create & open builder →'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
