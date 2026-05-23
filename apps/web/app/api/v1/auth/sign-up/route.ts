import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { Scrypt } from 'lucia';
import { db } from '@/lib/db';
import { lucia } from '@/lib/auth';
import { users, workspaces, memberships } from '@forma/db';
import { cookies } from 'next/headers';
import { ulid } from '@/lib/ulid';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  name: z.string().min(1).max(100),
  company: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { email, password, name, company } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const passwordHash = await new Scrypt().hash(password);
  const userId = ulid('u_');
  const workspaceId = ulid('ws_');
  const membershipId = ulid('mb_');

  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 48);
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id: userId, email: normalizedEmail, name, passwordHash });
    await tx.insert(workspaces).values({ id: workspaceId, slug: `${slug}-${userId.slice(-4)}`, name: company, plan: 'trial', trialEndsAt });
    await tx.insert(memberships).values({ id: membershipId, workspaceId, userId, role: 'owner', joinedAt: new Date() });
  });

  const session = await lucia.createSession(userId, { activeWorkspaceId: workspaceId });
  const cookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, cookie.value, cookie.attributes);

  return NextResponse.json({ ok: true, workspaceId }, { status: 201 });
}
