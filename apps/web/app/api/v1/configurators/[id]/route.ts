import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { getAdminConfigurator, saveDraft } from '@forma/services';
import { configurators } from '@forma/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const { id } = await params;
  const data = await getAdminConfigurator({ db, workspaceId }, id);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  schema: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { name, schema } = parsed.data;
  if (!schema) return NextResponse.json({ error: 'schema required' }, { status: 400 });

  const result = await saveDraft(
    { db, workspaceId },
    id,
    schema as unknown as Parameters<typeof saveDraft>[2],
    name,
  );
  return NextResponse.json(result);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const { id } = await params;
  const [cfg] = await db.select({ id: configurators.id }).from(configurators)
    .where(and(eq(configurators.id, id), eq(configurators.workspaceId, workspaceId))).limit(1);
  if (!cfg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.update(configurators).set({ archivedAt: new Date(), status: 'draft', liveVersionId: null })
    .where(and(eq(configurators.id, id), eq(configurators.workspaceId, workspaceId)));

  return NextResponse.json({ ok: true });
}
