import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { getWorkspace, isWorkspaceActive } from '@forma/services';
import { AppShell } from '@/components/AppShell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, session } = await getSession();
  if (!user) redirect('/sign-in');

  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) redirect('/onboarding');

  const ws = await getWorkspace({ db, workspaceId });
  if (!ws) redirect('/onboarding');

  // Paywall: trial expired + no active subscription → force to billing
  // (allow /settings/billing so the user can actually upgrade)
  if (!isWorkspaceActive(ws)) {
    // This check only runs for non-billing pages; billing page renders freely
    return (
      <AppShell workspace={{ name: ws.name, plan: ws.plan, seats: ws.seats }}>
        <PaywallBanner workspaceName={ws.name} />
      </AppShell>
    );
  }

  return (
    <AppShell workspace={{ name: ws.name, plan: ws.plan, seats: ws.seats }}>
      {children}
    </AppShell>
  );
}

function PaywallBanner({ workspaceName }: { workspaceName: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: 40, textAlign: 'center',
    }}>
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Trial ended
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.025em', margin: '0 0 12px' }}>
          {workspaceName}'s trial has expired
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)', margin: '0 0 28px' }}>
          Your 14-day free trial is over. Choose a plan to keep building configurators and receiving leads.
        </p>
        <a
          href="/settings/billing"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 40, padding: '0 20px',
            background: '#0a0a0a', color: '#fff',
            borderRadius: 'var(--radius-2)', fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          View plans →
        </a>
      </div>
    </div>
  );
}
