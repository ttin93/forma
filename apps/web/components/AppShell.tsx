'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, Icons, Wordmark } from './ui';

function SideItem({ href, icon, children, badge }: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: number | string;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
      borderRadius: 'var(--radius-2)', cursor: 'pointer',
      color: active ? 'var(--color-ink)' : 'var(--color-text-2)',
      background: active ? 'var(--color-surface-2)' : 'transparent',
      fontSize: 13, fontWeight: active ? 500 : 400,
      textDecoration: 'none',
    }}>
      <span style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: active ? 1 : 0.7 }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{children}</span>
      {badge != null && (
        <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-pill)', padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function Sidebar({ workspace }: { workspace: { name: string; plan: string; seats: number } }) {
  return (
    <aside style={{
      width: 232, flexShrink: 0, height: '100%',
      borderRight: '1px solid var(--color-line)', background: '#fff',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Workspace switcher */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--color-line)' }}>
        <button style={{
          all: 'unset', display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '6px 8px', borderRadius: 'var(--radius-2)', cursor: 'pointer',
        }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: '#0a0a0a', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>
            {workspace.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              {workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)} · {workspace.seats} seat{workspace.seats !== 1 ? 's' : ''}
            </div>
          </div>
          <span style={{ color: 'var(--color-muted)', display: 'flex' }}>{Icons.chevD}</span>
        </button>
      </div>

      <nav style={{ flex: 1, overflow: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SideItem href="/dashboard" icon={Icons.home}>Dashboard</SideItem>
        <SideItem href="/configurators" icon={Icons.cube} badge={4}>Configurators</SideItem>
        <SideItem href="/leads" icon={Icons.inbox} badge={23}>Leads</SideItem>
        <SideItem href="/customers" icon={Icons.users}>Customers</SideItem>
        <SideItem href="/analytics" icon={Icons.chart}>Analytics</SideItem>
        <SideItem href="/embed" icon={Icons.code}>Embed & API</SideItem>

        <div style={{ fontSize: 10.5, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', padding: '18px 10px 6px' }}>
          Workspace
        </div>
        <SideItem href="/settings/team" icon={Icons.users}>Team</SideItem>
        <SideItem href="/settings/billing" icon={Icons.credit}>Billing</SideItem>
        <SideItem href="/settings/workspace" icon={Icons.gear}>Settings</SideItem>
      </nav>

      <div style={{ borderTop: '1px solid var(--color-line)', padding: 14 }}>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 4 }}>
            {workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)} · 73% of leads used
          </div>
          <div style={{ height: 4, background: 'var(--color-line)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: '73%', height: '100%', background: '#0a0a0a' }} />
          </div>
          <Link href="/settings/billing" style={{ fontSize: 11.5, color: 'var(--color-ink)', borderBottom: '1px solid currentColor', paddingBottom: 1 }}>
            Upgrade plan →
          </Link>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ crumb, actions }: { crumb?: string[]; actions?: React.ReactNode }) {
  return (
    <header style={{
      height: 52, flexShrink: 0,
      borderBottom: '1px solid var(--color-line)', background: '#fff',
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        {crumb?.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: i === crumb.length - 1 ? 'var(--color-ink)' : 'var(--color-text-3)', fontWeight: i === crumb.length - 1 ? 500 : 400 }}>
              {c}
            </span>
            {i < crumb.length - 1 && <span style={{ color: 'var(--color-line-3)', fontSize: 11 }}>/</span>}
          </span>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 30, padding: '0 10px', border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', background: 'var(--color-surface)', width: 240 }}>
        <span style={{ color: 'var(--color-muted)', display: 'flex' }}>{Icons.search}</span>
        <span style={{ fontSize: 12.5, color: 'var(--color-muted)', flex: 1 }}>Search anything…</span>
        <span style={{ fontSize: 10.5, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', border: '1px solid var(--color-line)', padding: '0 4px', borderRadius: 3 }}>⌘K</span>
      </div>

      {actions}

      <button style={{ all: 'unset', width: 30, height: 30, display: 'grid', placeItems: 'center', color: 'var(--color-text-2)', borderRadius: 'var(--radius-2)', cursor: 'pointer', position: 'relative' }}>
        {Icons.bell}
        <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, background: '#0a0a0a', borderRadius: 6 }} />
      </button>
      <Avatar name="User" size={28} />
    </header>
  );
}

export function AppShell({ children, crumb, actions, workspace }: {
  children: React.ReactNode;
  crumb?: string[];
  actions?: React.ReactNode;
  workspace?: { name: string; plan: string; seats: number };
}) {
  const ws = workspace ?? { name: 'Workspace', plan: 'trial', seats: 1 };
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: 'var(--color-bg)', overflow: 'hidden' }}>
      <Sidebar workspace={ws} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar crumb={crumb} actions={actions} />
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--color-surface)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, desc, actions, tabs }: {
  eyebrow?: string;
  title: string;
  desc?: string;
  actions?: React.ReactNode;
  tabs?: { label: string; href: string; count?: number }[];
}) {
  const pathname = usePathname();
  return (
    <div style={{ padding: '28px 32px 0', background: '#fff', borderBottom: tabs ? 'none' : '1px solid var(--color-line)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: tabs ? 24 : 28 }}>
        <div>
          {eyebrow && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              {eyebrow}
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--color-ink)' }}>{title}</h1>
          {desc && <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--color-text-3)', maxWidth: 640 }}>{desc}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      {tabs && (
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--color-line)' }}>
          {tabs.map((t, i) => {
            const active = pathname === t.href || (i === 0 && (pathname === '/leads' || pathname === '/leads/'));
            return (
              <Link key={i} href={t.href} style={{
                padding: '10px 14px', fontSize: 13,
                color: active ? 'var(--color-ink)' : 'var(--color-text-3)',
                fontWeight: active ? 500 : 400,
                borderBottom: active ? '1.5px solid #0a0a0a' : '1.5px solid transparent',
                marginBottom: -1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {t.label}
                {t.count != null && <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{t.count}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
