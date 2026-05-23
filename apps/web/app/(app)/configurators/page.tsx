import { PageHeader } from '@/components/AppShell';
import { Badge, Btn, Card } from '@/components/ui';
import Link from 'next/link';

const cfgs = [
  { id: 'cfg-001', name: 'Pergola Classic', slug: 'pergola-classic', status: 'live', leads: 147, views: 3204, cr: '4.2%', updated: '2 days ago' },
  { id: 'cfg-002', name: 'Pergola Pro', slug: 'pergola-pro', status: 'live', leads: 89, views: 2341, cr: '3.8%', updated: '4 days ago' },
  { id: 'cfg-003', name: 'Pergola XL', slug: 'pergola-xl', status: 'live', leads: 34, views: 667, cr: '5.1%', updated: '1 week ago' },
  { id: 'cfg-004', name: 'Pergola Mini', slug: 'pergola-mini', status: 'draft', leads: 0, views: 0, cr: '—', updated: '3 hours ago' },
];

export default function ConfiguratorsPage() {
  return (
    <div data-screen-label="Configurators — Grid">
      <PageHeader
        title="Configurators"
        desc="Manage your product configurators. Each one generates leads and a quote PDF."
        actions={
          <Btn variant="primary" size="sm">+ New configurator</Btn>
        }
      />
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {cfgs.map(c => (
            <Card key={c.id} pad={0} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Preview area */}
              <div style={{ height: 160, background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--color-line)' }}>
                <svg viewBox="0 0 200 100" width="200" height="100" fill="none" stroke="var(--color-line-3)" strokeWidth="1">
                  <rect x="10" y="20" width="180" height="6" />
                  <rect x="10" y="26" width="6" height="64" />
                  <rect x="184" y="26" width="6" height="64" />
                  {Array.from({ length: 10 }).map((_, i) => (
                    <rect key={i} x={10 + i * 19} y="20" width="5" height="20" />
                  ))}
                </svg>
              </div>
              {/* Info */}
              <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>/{c.slug}</div>
                  </div>
                  <Badge kind={c.status === 'live' ? 'live' : 'neutral'} size="sm">{c.status}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '12px 0', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
                  {[['Leads', c.leads], ['Views', c.views], ['CR', c.cr]].map(([l, v]) => (
                    <div key={String(l)}>
                      <div style={{ fontSize: 10.5, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                      <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/configurators/${c.id}/builder`} style={{ flex: 1 }}>
                    <Btn variant="secondary" size="sm" full>Edit</Btn>
                  </Link>
                  <Btn variant="ghost" size="sm">Share</Btn>
                  <Btn variant="ghost" size="sm">⋯</Btn>
                </div>
              </div>
            </Card>
          ))}

          {/* New card */}
          <button style={{ all: 'unset', border: '1px dashed var(--color-line-3)', borderRadius: 'var(--radius-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, height: 280, cursor: 'pointer', color: 'var(--color-text-3)' }}>
            <div style={{ width: 40, height: 40, border: '1px solid var(--color-line-3)', borderRadius: 'var(--radius-2)', display: 'grid', placeItems: 'center', fontSize: 20 }}>+</div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-2)' }}>New configurator</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Start blank or pick a template</div>
          </button>
        </div>
      </div>
    </div>
  );
}
