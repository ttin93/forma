import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { users, memberships, workspaces } from '@forma/db';

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'sales', 'viewer']),
});

function ulid(prefix = '') {
  const ts = Date.now().toString(36).padStart(8, '0').toUpperCase();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map(b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[b & 31])
    .join('');
  return prefix + ts + rand;
}

export async function POST(req: NextRequest) {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  const inviterId = session?.userId;
  if (!workspaceId || !inviterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { email, role } = parsed.data;

  // Check membership cap (max 5 on current plan)
  const [ws] = await db.select({ plan: workspaces.plan }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  const existingMembers = await db.select({ id: memberships.id }).from(memberships).where(eq(memberships.workspaceId, workspaceId));
  if (existingMembers.length >= 5 && ws?.plan === 'trial') {
    return NextResponse.json({ error: 'Team member limit reached. Upgrade your plan to add more members.' }, { status: 403 });
  }

  // Find or create user
  let [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    const newUserId = ulid('usr_');
    await db.insert(users).values({ id: newUserId, email, name: null });
    user = { id: newUserId };
  }

  // Check if already a member
  const [existing] = await db.select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, user.id)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: 'This user is already a team member.' }, { status: 409 });
  }

  const membershipId = ulid('mbr_');
  await db.insert(memberships).values({
    id: membershipId,
    workspaceId,
    userId: user.id,
    role,
    invitedBy: inviterId,
    invitedAt: new Date(),
  });

  return NextResponse.json({ ok: true, memberId: membershipId });
}
