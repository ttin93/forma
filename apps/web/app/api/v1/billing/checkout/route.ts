import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { users } from '@forma/db';
import { createCheckoutUrl } from '@forma/services';
import { eq } from 'drizzle-orm';

export async function POST(_req: NextRequest) {
  const { session } = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'No active workspace' }, { status: 403 });

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  if (!storeId || !variantId) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 });
  }

  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const checkoutUrl = await createCheckoutUrl(
      { db, workspaceId },
      {
        userEmail: user.email,
        userName: user.name ?? user.email,
        storeId,
        variantId,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      },
    );
    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    if (err instanceof Error) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
