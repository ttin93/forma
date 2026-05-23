import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { listConfigurators, createConfigurator } from '@forma/services';

export async function GET(_req: NextRequest) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const data = await listConfigurators({ db, workspaceId });
  return NextResponse.json(data);
}

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
});

export async function POST(req: NextRequest) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const result = await createConfigurator({ db, workspaceId }, parsed.data);
  return NextResponse.json(result, { status: 201 });
}
