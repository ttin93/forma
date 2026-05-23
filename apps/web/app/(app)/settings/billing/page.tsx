import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { getWorkspace } from '@forma/services';
import { PageHeader } from '@/components/AppShell';
import { Badge } from '@/components/ui';
import BillingClient from './BillingClient';

export default async function BillingPage() {
  const { session } = await getSession();
  if (!session) redirect('/sign-in');
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) redirect('/onboarding');

  const ws = await getWorkspace({ db, workspaceId });
  if (!ws) redirect('/onboarding');

  const isOnPaidPlan = ws.lsStatus === 'active' || ws.lsStatus === 'on_trial';
  const trialDaysLeft = ws.trialEndsAt
    ? Math.max(0, Math.ceil((ws.trialEndsAt.getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div data-screen-label="Settings — Billing">
      <PageHeader title="Billing" desc="Manage your subscription, usage, and invoices." />
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 780 }}>

        {/* Current plan */}
        <div style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', background: '#fff', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Current plan
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--color-ink)' }}>
                  {isOnPaidPlan ? 'Growth' : ws.plan === 'trial' ? 'Trial' : 'Expired'}
                </span>
                {isOnPaidPlan ? (
                  <Badge kind="live">Active</Badge>
                ) : ws.plan === 'trial' && (trialDaysLeft ?? 0) > 0 ? (
                  <Badge kind="warn">{trialDaysLeft}d left</Badge>
                ) : (
                  <Badge kind="off">Expired</Badge>
                )}
              </div>
              {isOnPaidPlan && ws.lsRenewsAt && (
                <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
                  Renews {ws.lsRenewsAt.toLocaleDateString('sl-SI', { dateStyle: 'long' })}
                </div>
              )}
              {!isOnPaidPlan && ws.plan === 'trial' && (
                <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
                  {(trialDaysLeft ?? 0) > 0
                    ? `Trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''}`
                    : 'Trial has ended — upgrade to continue'}
                </div>
              )}
            </div>
            <BillingClient
              isOnPaidPlan={isOnPaidPlan}
              subscriptionId={ws.lsSubscriptionId}
            />
          </div>

          {!isOnPaidPlan && (
            <div style={{ marginTop: 20, padding: '16px', borderTop: '1px solid var(--color-line)', background: 'var(--color-surface)', borderRadius: 'var(--radius-2)', marginBottom: -8 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 8 }}>Growth — €149/month</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  '500 leads / month',
                  '5 team seats',
                  '10 configurators',
                  'Email notifications + PDF quotes',
                  'Webhook integrations',
                  'Priority support',
                ].map(f => (
                  <li key={f} style={{ fontSize: 13, color: 'var(--color-text-2)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Payment method / invoices note */}
        {isOnPaidPlan && (
          <div style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', background: '#fff', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-line)', fontSize: 13.5, fontWeight: 500 }}>
              Manage subscription
            </div>
            <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--color-text-3)' }}>
              To update your payment method, download invoices, or cancel, use the customer portal.
              <br />
              <BillingClient
                isOnPaidPlan={isOnPaidPlan}
                subscriptionId={ws.lsSubscriptionId}
                portalOnly
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
