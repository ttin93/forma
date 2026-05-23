import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { getWorkspace, getSubscriptionPortalUrl } from '@forma/services';

export async function POST(_req: NextRequest) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const ws = await getWorkspace({ db, workspaceId });
  if (!ws?.lsSubscriptionId) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
  }

  try {
    const url = await getSubscriptionPortalUrl(ws.lsSubscriptionId);
    if (!url) return NextResponse.json({ error: 'Portal URL not available' }, { status: 404 });
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof Error) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
