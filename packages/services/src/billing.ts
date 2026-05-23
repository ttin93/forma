import { eq } from 'drizzle-orm';
import { workspaces, memberships } from '@forma/db';
import type { DB } from '@forma/db';
import type { ServiceCtx } from './types';

const LS_API = 'https://api.lemonsqueezy.com/v1';

function lsHeaders() {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error('LEMONSQUEEZY_API_KEY is not set');
  return {
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    Authorization: `Bearer ${key}`,
  };
}

// ── getWorkspace ──────────────────────────────────────────────────────

export interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  trialEndsAt: Date | null;
  lsStatus: string | null;
  lsSubscriptionId: string | null;
  lsRenewsAt: Date | null;
  seats: number;
}

export async function getWorkspace(ctx: ServiceCtx): Promise<WorkspaceData | null> {
  const [ws] = await ctx.db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      plan: workspaces.plan,
      trialEndsAt: workspaces.trialEndsAt,
      lsStatus: workspaces.lsStatus,
      lsSubscriptionId: workspaces.lsSubscriptionId,
      lsRenewsAt: workspaces.lsRenewsAt,
    })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1);

  if (!ws) return null;

  const seatRows = await ctx.db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.workspaceId, ctx.workspaceId));

  return { ...ws, seats: seatRows.length };
}

// ── isWorkspaceActive ─────────────────────────────────────────────────

export function isWorkspaceActive(ws: WorkspaceData): boolean {
  if (ws.lsStatus === 'active' || ws.lsStatus === 'on_trial') return true;
  if (ws.plan === 'trial' && ws.trialEndsAt && ws.trialEndsAt > new Date()) return true;
  if (ws.plan !== 'trial' && ws.plan !== 'expired') return true;
  return false;
}

// ── createCheckoutUrl ─────────────────────────────────────────────────

export async function createCheckoutUrl(
  ctx: ServiceCtx,
  input: {
    userEmail: string;
    userName: string;
    storeId: string | number;
    variantId: string | number;
    appUrl: string;
  },
): Promise<string> {
  const res = await fetch(`${LS_API}/checkouts`, {
    method: 'POST',
    headers: lsHeaders(),
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: input.userEmail,
            name: input.userName,
            custom: { workspace_id: ctx.workspaceId },
          },
          checkout_options: { embed: false },
          product_options: {
            redirect_url: `${input.appUrl}/settings/billing?upgraded=1`,
            receipt_button_text: 'Go to Forma',
            receipt_thank_you_note: 'Your workspace is now on the Growth plan.',
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: String(input.storeId) } },
          variant: { data: { type: 'variants', id: String(input.variantId) } },
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Lemon Squeezy checkout failed: ${res.status} ${body}`);
  }

  const json = await res.json() as { data: { attributes: { url: string } } };
  const url = json.data?.attributes?.url;
  if (!url) throw new Error('No checkout URL in Lemon Squeezy response');
  return url;
}

// ── getSubscriptionPortalUrl ──────────────────────────────────────────

export async function getSubscriptionPortalUrl(subscriptionId: string): Promise<string | null> {
  const res = await fetch(`${LS_API}/subscriptions/${subscriptionId}`, {
    headers: lsHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json() as { data: { attributes: { urls: { customer_portal: string } } } };
  return json.data?.attributes?.urls?.customer_portal ?? null;
}

// ── processSubscriptionEvent ──────────────────────────────────────────

interface LsSubscriptionAttributes {
  status: string;
  customer_id: number;
  renews_at: string | null;
  ends_at: string | null;
}

export async function processSubscriptionEvent(
  db: DB,
  eventName: string,
  subscriptionId: string,
  attributes: LsSubscriptionAttributes,
  workspaceId: string,
): Promise<void> {
  const lsStatus = attributes.status;

  let plan = 'growth';
  if (lsStatus === 'expired' || lsStatus === 'unpaid') plan = 'expired';

  await db
    .update(workspaces)
    .set({
      lsSubscriptionId: subscriptionId,
      lsCustomerId: String(attributes.customer_id),
      lsStatus,
      lsRenewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
      plan,
    })
    .where(eq(workspaces.id, workspaceId));
}
