import { cookies } from 'next/headers';
import { lucia } from './auth';
import { cache } from 'react';

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return { user: null, session: null };

  const result = await lucia.validateSession(sessionId);

  try {
    const cookieStore2 = await cookies();
    if (result.session?.fresh) {
      const sessionCookie = lucia.createSessionCookie(result.session.id);
      cookieStore2.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    if (!result.session) {
      const blankCookie = lucia.createBlankSessionCookie();
      cookieStore2.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
    }
  } catch {
    // headers already sent, ignore
  }

  return result;
});
