import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { workspaces } from '@forma/db';

export async function GET() {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [ws] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      industry: workspaces.industry,
      currency: workspaces.currency,
      locale: workspaces.locale,
      timezone: workspaces.timezone,
      brandPrimary: workspaces.brandPrimary,
      brandLogoUrl: workspaces.brandLogoUrl,
      brandFont: workspaces.brandFont,
      plan: workspaces.plan,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!ws) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(ws);
}

const schema = z.object({
  name: z.string().min(1).max(200).optional(),
  industry: z.string().max(60).optional(),
  brandPrimary: z.string().max(20).optional(),
  brandLogoUrl: z.string().url().optional().or(z.literal('')),
  brandFont: z.string().max(60).optional(),
  currency: z.string().max(10).optional(),
  locale: z.string().max(20).optional(),
  timezone: z.string().max(60).optional(),
});

export async function PATCH(req: NextRequest) {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  await db.update(workspaces).set(parsed.data).where(eq(workspaces.id, workspaceId));
  return NextResponse.json({ ok: true });
}
