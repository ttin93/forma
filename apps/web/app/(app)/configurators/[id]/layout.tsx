'use client';

import Link from 'next/link';
import { use } from 'react';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/ui';

export default function ConfiguratorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const base = `/configurators/${id}`;

  const tabs = [
    { label: 'Builder', href: `${base}/builder`, icon: Icons.edit },
    { label: 'Settings', href: `${base}/settings`, icon: Icons.gear },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-nav bar */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 2,
        borderBottom: '1px solid var(--color-line)', background: '#fff', flexShrink: 0,
      }}>
        <Link href="/configurators" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12.5, color: 'var(--color-text-3)', textDecoration: 'none', marginRight: 12,
        }}>
          {Icons.chevL} All configurators
        </Link>
        <span style={{ width: 1, height: 16, background: 'var(--color-line)', margin: '0 8px' }} />
        {tabs.map(t => {
          const active = pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: active ? 500 : 400,
              color: active ? 'var(--color-ink)' : 'var(--color-text-3)',
              padding: '6px 12px', borderRadius: 'var(--radius-2)',
              background: active ? 'var(--color-surface-2)' : 'transparent',
              textDecoration: 'none',
            }}>
              <span style={{ opacity: active ? 1 : 0.6, display: 'inline-flex' }}>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}
