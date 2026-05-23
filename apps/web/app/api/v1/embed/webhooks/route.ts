import { type NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { webhooks } from '@forma/db';

export async function GET() {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.select({
    id: webhooks.id,
    url: webhooks.url,
    events: webhooks.events,
    enabled: webhooks.enabled,
    createdAt: webhooks.createdAt,
  }).from(webhooks).where(eq(webhooks.workspaceId, workspaceId));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  try { new URL(body.url); } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  const id = `wh_${randomBytes(8).toString('hex')}`;
  const secret = `whsec_${randomBytes(32).toString('hex')}`;
  const events = Array.isArray(body.events) ? body.events : ['lead.created'];

  await db.insert(webhooks).values({ id, workspaceId, url: body.url, events, secret, enabled: true });

  return NextResponse.json({ id, url: body.url, events, enabled: true, secret }, { status: 201 });
}
