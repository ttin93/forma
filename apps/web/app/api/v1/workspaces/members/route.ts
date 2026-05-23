import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { memberships, users } from '@forma/db';

export async function GET() {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({
      id: memberships.id,
      role: memberships.role,
      joinedAt: memberships.joinedAt,
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.workspaceId, workspaceId));

  return NextResponse.json(rows);
}
