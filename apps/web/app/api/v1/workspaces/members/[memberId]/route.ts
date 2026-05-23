import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { memberships } from '@forma/db';

const patchSchema = z.object({
  role: z.enum(['admin', 'editor', 'sales', 'viewer']),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { memberId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  const [target] = await db.select().from(memberships)
    .where(and(eq(memberships.id, memberId), eq(memberships.workspaceId, workspaceId))).limit(1);
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (target.role === 'owner') return NextResponse.json({ error: 'Cannot change owner role' }, { status: 403 });

  await db.update(memberships).set({ role: parsed.data.role })
    .where(and(eq(memberships.id, memberId), eq(memberships.workspaceId, workspaceId)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { memberId } = await params;
  const [target] = await db.select().from(memberships)
    .where(and(eq(memberships.id, memberId), eq(memberships.workspaceId, workspaceId))).limit(1);
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (target.role === 'owner') return NextResponse.json({ error: 'Cannot remove owner' }, { status: 403 });

  await db.delete(memberships)
    .where(and(eq(memberships.id, memberId), eq(memberships.workspaceId, workspaceId)));

  return NextResponse.json({ ok: true });
}
