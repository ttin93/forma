import { type NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { processSubscriptionEvent } from '@forma/services';

const SUBSCRIPTION_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_expired',
  'subscription_paused',
  'subscription_unpaused',
]);

export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-signature') ?? '';

  // Verify HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { meta, data } = payload as {
    meta: { event_name: string; custom_data?: { workspace_id?: string } };
    data: {
      id: string;
      attributes: {
        status: string;
        customer_id: number;
        renews_at: string | null;
        ends_at: string | null;
      };
    };
  };

  const eventName = meta?.event_name;

  if (SUBSCRIPTION_EVENTS.has(eventName)) {
    const workspaceId = meta?.custom_data?.workspace_id;
    if (!workspaceId) {
      // Log and accept — could be a subscription from another flow
      return NextResponse.json({ ok: true, skipped: 'no workspace_id' });
    }

    await processSubscriptionEvent(
      db,
      eventName,
      data.id,
      data.attributes,
      workspaceId,
    );
  }

  return NextResponse.json({ ok: true });
}
