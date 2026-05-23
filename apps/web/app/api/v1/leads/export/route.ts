import { type NextRequest, NextResponse } from 'next/server';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { leads, configurators } from '@forma/db';

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const { session } = await getSession();
  const workspaceId = session?.activeWorkspaceId;
  if (!workspaceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '0', 10);
  const conditions = [
    eq(leads.workspaceId, workspaceId),
    sql`${leads.deletedAt} IS NULL`,
  ];
  if (days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    conditions.push(gte(leads.submittedAt, since));
  }

  const rows = await db
    .select({
      id: leads.id,
      status: leads.status,
      hot: leads.hot,
      totalCents: leads.totalCents,
      currency: leads.currency,
      contact: leads.contact,
      configState: leads.configState,
      source: leads.source,
      referrer: leads.referrer,
      ipCountry: leads.ipCountry,
      submittedAt: leads.submittedAt,
      configuratorId: leads.configuratorId,
    })
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.submittedAt))
    .limit(10000);

  const cfgIds = [...new Set(rows.map(r => r.configuratorId))];
  const cfgNames: Record<string, string> = {};
  if (cfgIds.length > 0) {
    const cfgs = await db
      .select({ id: configurators.id, name: configurators.name })
      .from(configurators)
      .where(eq(configurators.workspaceId, workspaceId));
    cfgs.forEach(c => { cfgNames[c.id] = c.name; });
  }

  const headers = ['ID', 'Status', 'Hot', 'Name', 'Email', 'Phone', 'City', 'Total', 'Currency', 'Configurator', 'Source', 'Country', 'Submitted'];
  const csvRows = rows.map(r => {
    const c = (r.contact ?? {}) as Record<string, unknown>;
    return [
      r.id,
      r.status,
      r.hot ? 'yes' : 'no',
      c.name,
      c.email,
      c.phone,
      c.city,
      (Number(r.totalCents) / 100).toFixed(2),
      r.currency,
      cfgNames[r.configuratorId] ?? r.configuratorId,
      r.source,
      r.ipCountry,
      new Date(r.submittedAt).toISOString(),
    ].map(csvEscape).join(',');
  });

  const csv = [headers.join(','), ...csvRows].join('\n');
  const filename = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
