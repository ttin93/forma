import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { removeDomain } from '@forma/services';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; domainId: string }> },
) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const { id, domainId } = await params;

  try {
    await removeDomain({ db, workspaceId }, id, domainId);
  } catch (err) {
    if (err instanceof Error) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  return new NextResponse(null, { status: 204 });
}
