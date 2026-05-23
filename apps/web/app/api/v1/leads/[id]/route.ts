import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { getLead, patchLead } from '@forma/services';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const { id } = await params;
  const lead = await getLead({ db, workspaceId }, id);
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ...lead, totalCents: Number(lead.totalCents) });
}

const patchSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'spam']).optional(),
  assigneeId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  score: z.number().int().optional(),
  hot: z.boolean().optional(),
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

  const raw = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await patchLead({ db, workspaceId, userId: session.userId }, id, parsed.data);
  } catch (err) {
    if (err instanceof Error && err.message === 'Lead not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
