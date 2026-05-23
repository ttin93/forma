import { NextResponse } from 'next/server';
import { eq, and, gte, count, sum, sql, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { leads, configurators } from '@forma/db';

export async function GET() {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const since30d = new Date();
  since30d.setDate(since30d.getDate() - 30);

  const [totalLeads, newLeadsCount, pipeline, cfgCount, recentLeads, topCfgs] = await Promise.all([
    db.select({ n: count() }).from(leads).where(
      and(eq(leads.workspaceId, workspaceId), gte(leads.submittedAt, since30d), sql`${leads.deletedAt} IS NULL`),
    ),
    db.select({ n: count() }).from(leads).where(
      and(eq(leads.workspaceId, workspaceId), eq(leads.status, 'new'), sql`${leads.deletedAt} IS NULL`),
    ),
    db.select({ total: sum(leads.totalCents) }).from(leads).where(
      and(
        eq(leads.workspaceId, workspaceId),
        sql`${leads.status} IN ('new','contacted','qualified','quoted')`,
        sql`${leads.deletedAt} IS NULL`,
      ),
    ),
    db.select({ n: count() }).from(configurators).where(
      and(eq(configurators.workspaceId, workspaceId), sql`${configurators.archivedAt} IS NULL`),
    ),
    db.select({
      id: leads.id,
      status: leads.status,
      hot: leads.hot,
      totalCents: leads.totalCents,
      currency: leads.currency,
      contact: leads.contact,
      configuratorId: leads.configuratorId,
      submittedAt: leads.submittedAt,
    }).from(leads)
      .where(and(eq(leads.workspaceId, workspaceId), sql`${leads.deletedAt} IS NULL`))
      .orderBy(desc(leads.submittedAt))
      .limit(8),
    db.select({
      configuratorId: leads.configuratorId,
      n: count(),
      revenue: sum(leads.totalCents),
    }).from(leads)
      .where(and(eq(leads.workspaceId, workspaceId), sql`${leads.deletedAt} IS NULL`))
      .groupBy(leads.configuratorId)
      .orderBy(sql`count(*) DESC`)
      .limit(5),
  ]);

  const cfgIds = topCfgs.map(r => r.configuratorId);
  const cfgNames: Record<string, string> = {};
  if (cfgIds.length > 0) {
    const cfgRows = await db.select({ id: configurators.id, name: configurators.name })
      .from(configurators)
      .where(eq(configurators.workspaceId, workspaceId));
    cfgRows.forEach(r => { cfgNames[r.id] = r.name; });
  }

  return NextResponse.json({
    totalLeads: Number(totalLeads[0]?.n ?? 0),
    newLeads: Number(newLeadsCount[0]?.n ?? 0),
    pipeline: Number(pipeline[0]?.total ?? 0),
    configuratorsCount: Number(cfgCount[0]?.n ?? 0),
    recentLeads: recentLeads.map(l => ({ ...l, totalCents: Number(l.totalCents) })),
    topConfigurators: topCfgs.map(r => ({
      configuratorId: r.configuratorId,
      name: cfgNames[r.configuratorId] ?? r.configuratorId,
      leads: Number(r.n),
      revenue: Number(r.revenue ?? 0),
    })),
  });
}
