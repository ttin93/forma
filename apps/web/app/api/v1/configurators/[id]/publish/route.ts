import { type NextRequest, NextResponse } from 'next/server';
import { eq, and, count, sql } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { publishLatest, getWorkspace } from '@forma/services';
import { configurators } from '@forma/db';

const PLAN_LIMITS: Record<string, number> = {
  trial: 1, starter: 3, growth: 10, pro: 999, enterprise: 999,
};

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const { id } = await params;

  // Check how many live configurators this workspace already has (excluding the one being published)
  const ws = await getWorkspace({ db, workspaceId });
  const limit = PLAN_LIMITS[ws?.plan ?? 'trial'] ?? 1;

  const [{ n }] = await db
    .select({ n: count() })
    .from(configurators)
    .where(and(
      eq(configurators.workspaceId, workspaceId),
      eq(configurators.status, 'live'),
      sql`${configurators.id} != ${id}`,
    ));

  if (Number(n) >= limit) {
    return NextResponse.json(
      {
        error: 'plan_limit',
        message: `Your ${ws?.plan ?? 'trial'} plan allows ${limit} live configurator${limit !== 1 ? 's' : ''}. Upgrade to publish more.`,
        limit,
      },
      { status: 402 },
    );
  }

  try {
    await publishLatest({ db, workspaceId, userId: session.userId }, id);
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
