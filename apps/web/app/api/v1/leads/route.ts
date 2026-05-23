import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { listLeads } from '@forma/services';

export async function GET(req: NextRequest) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
  const limit = Math.min(200, parseInt(sp.get('limit') ?? '50', 10));

  const result = await listLeads(
    { db, workspaceId },
    {
      status: sp.get('status') ?? undefined,
      q: sp.get('q') ?? undefined,
      configuratorId: sp.get('configuratorId') ?? undefined,
      assigneeId: sp.get('assigneeId') ?? undefined,
      page,
      limit,
    },
  );

  return NextResponse.json({
    ...result,
    data: result.data.map(l => ({ ...l, totalCents: Number(l.totalCents) })),
  });
}
