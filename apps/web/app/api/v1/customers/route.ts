import { NextResponse } from 'next/server';
import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { customers } from '@forma/db';

export async function GET() {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.select({
    id: customers.id,
    email: customers.email,
    name: customers.name,
    company: customers.company,
    country: customers.country,
    city: customers.city,
    configCount: customers.configCount,
    purchaseCount: customers.purchaseCount,
    ltvCents: customers.ltvCents,
    firstSeenAt: customers.firstSeenAt,
    lastSeenAt: customers.lastSeenAt,
  }).from(customers)
    .where(and(eq(customers.workspaceId, workspaceId), sql`${customers.deletedAt} IS NULL`))
    .orderBy(desc(customers.lastSeenAt));

  return NextResponse.json(rows.map(c => ({ ...c, ltvCents: Number(c.ltvCents ?? 0) })));
}
