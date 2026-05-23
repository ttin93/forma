import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { Scrypt } from 'lucia';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { users } from '@forma/db';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, 'New password must be at least 10 characters'),
});

export async function PATCH(req: NextRequest) {
  const { session, user } = await getSession();
  if (!session || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const [dbUser] = await db.select({ passwordHash: users.passwordHash })
    .from(users).where(eq(users.id, user.id)).limit(1);

  if (!dbUser?.passwordHash) {
    return NextResponse.json({ error: 'No password set on this account' }, { status: 400 });
  }

  const valid = await new Scrypt().verify(dbUser.passwordHash, parsed.data.currentPassword);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  const newHash = await new Scrypt().hash(parsed.data.newPassword);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
