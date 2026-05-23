import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { lucia } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ ok: true });

  await lucia.invalidateSession(session.id);
  const blank = lucia.createBlankSessionCookie();
  const cookieStore = await cookies();
  cookieStore.set(blank.name, blank.value, blank.attributes);

  return NextResponse.json({ ok: true });
}
