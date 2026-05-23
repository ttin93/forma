import { type NextRequest, NextResponse } from 'next/server';
import { eq, and, gte, count, sum, sql, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { leads, configurators } from '@forma/db';

export async function GET(req: NextRequest) {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '365', 10) || 365;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const baseWhere = and(
    eq(leads.workspaceId, workspaceId),
    gte(leads.submittedAt, since),
    sql`${leads.deletedAt} IS NULL`,
  );

  const [summaryRows, byStatusRows, bySourceRows, byCfgRows, monthlyRows] = await Promise.all([
    // Summary stats
    db.select({
      total: count(),
      revenue: sum(leads.totalCents),
      won: sql<number>`COUNT(*) FILTER (WHERE ${leads.status} = 'won')`.mapWith(Number),
    }).from(leads).where(baseWhere),

    // By status
    db.select({
      status: leads.status,
      n: count(),
      revenue: sum(leads.totalCents),
    }).from(leads).where(baseWhere).groupBy(leads.status),

    // By source (top 8)
    db.select({
      source: leads.source,
      n: count(),
      revenue: sum(leads.totalCents),
    }).from(leads).where(baseWhere).groupBy(leads.source).orderBy(sql`count(*) DESC`).limit(8),

    // By configurator
    db.select({
      configuratorId: leads.configuratorId,
      n: count(),
      revenue: sum(leads.totalCents),
    }).from(leads).where(baseWhere).groupBy(leads.configuratorId).orderBy(sql`count(*) DESC`).limit(6),

    // Monthly breakdown (last 12 months regardless of filter)
    db.select({
      month: sql<string>`to_char(${leads.submittedAt}, 'YYYY-MM')`.mapWith(String),
      n: count(),
      revenue: sum(leads.totalCents),
    })
      .from(leads)
      .where(and(
        eq(leads.workspaceId, workspaceId),
        gte(leads.submittedAt, new Date(new Date().setFullYear(new Date().getFullYear() - 1))),
        sql`${leads.deletedAt} IS NULL`,
      ))
      .groupBy(sql`to_char(${leads.submittedAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${leads.submittedAt}, 'YYYY-MM')`),
  ]);

  // Resolve configurator names
  const cfgIds = byCfgRows.map(r => r.configuratorId);
  const cfgNames: Record<string, string> = {};
  if (cfgIds.length > 0) {
    const cfgs = await db
      .select({ id: configurators.id, name: configurators.name })
      .from(configurators)
      .where(eq(configurators.workspaceId, workspaceId));
    cfgs.forEach(c => { cfgNames[c.id] = c.name; });
  }

  const s = summaryRows[0];
  const totalLeads = Number(s?.total ?? 0);
  const totalRevenue = Number(s?.revenue ?? 0);
  const wonLeads = Number(s?.won ?? 0);

  // Fill in missing months with 0
  const monthMap: Record<string, { leads: number; revenue: number }> = {};
  monthlyRows.forEach(r => {
    monthMap[r.month] = { leads: Number(r.n), revenue: Number(r.revenue ?? 0) };
  });
  const monthly: { month: string; label: string; leads: number; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short' });
    monthly.push({ month: key, label, leads: monthMap[key]?.leads ?? 0, revenue: monthMap[key]?.revenue ?? 0 });
  }

  return NextResponse.json({
    days,
    summary: {
      totalLeads,
      totalRevenue,
      avgValue: totalLeads > 0 ? Math.round(totalRevenue / totalLeads) : 0,
      wonLeads,
      winRate: totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0,
    },
    monthly,
    byStatus: byStatusRows.map(r => ({
      status: r.status,
      count: Number(r.n),
      revenue: Number(r.revenue ?? 0),
    })),
    bySource: bySourceRows.map(r => ({
      source: r.source ?? 'direct',
      count: Number(r.n),
      revenue: Number(r.revenue ?? 0),
    })),
    topConfigurators: byCfgRows.map(r => ({
      id: r.configuratorId,
      name: cfgNames[r.configuratorId] ?? r.configuratorId,
      count: Number(r.n),
      revenue: Number(r.revenue ?? 0),
    })),
  });
}
