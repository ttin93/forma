import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { Scrypt } from 'lucia';
import { db } from '@/lib/db';
import { lucia } from '@/lib/auth';
import { users, memberships } from '@forma/db';
import { cookies } from 'next/headers';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const valid = await new Scrypt().verify(user.passwordHash, password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Resolve the user's active workspace (first membership, owner preferred)
  const userMemberships = await db
    .select({ workspaceId: memberships.workspaceId, role: memberships.role })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(5);

  const ownerMs = userMemberships.find(m => m.role === 'owner');
  const activeWorkspaceId = (ownerMs ?? userMemberships[0])?.workspaceId ?? null;

  const session = await lucia.createSession(user.id, { active_workspace_id: activeWorkspaceId });
  const cookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, cookie.value, cookie.attributes);

  return NextResponse.json({ ok: true });
}
