import { eq, and, desc, ilike, or, count, sql } from 'drizzle-orm';
import {
  leads, customers, leadEvents, configurators, configuratorVersions, routingRules,
} from '@forma/db';
import { evaluate } from '@forma/configurator-engine';
import type { ConfiguratorSchema } from '@forma/types';
import type { ServiceCtx, Paginated } from './types';

// ── ulid helper (inline to keep services dep-free from apps/web) ──────
function ulid(prefix = ''): string {
  const ts = Date.now().toString(36).padStart(8, '0').toUpperCase();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map(b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[b & 31])
    .join('');
  return prefix + ts + rand;
}

// ── Lead reference (human-readable, per workspace) ────────────────────
function makeLeadRef(workspaceSlug: string, leadNumber: number): string {
  return `${workspaceSlug.slice(0, 4).toUpperCase()}-${new Date().getFullYear()}-L${leadNumber}`;
}

// ── Types ─────────────────────────────────────────────────────────────

export interface CreateLeadInput {
  configuratorId: string;
  versionId: string;
  state: Record<string, unknown>;
  contact: {
    name: string;
    email: string;
    phone?: string;
    city?: string;
    consent?: boolean;
  };
  meta: {
    host: string;
    path: string;
    referrer?: string;
    userAgent?: string;
    ipCountry?: string;
  };
  sessionId?: string;
}

export interface LeadRow {
  id: string;
  workspaceId: string;
  configuratorId: string;
  versionId: string;
  customerId: string | null;
  status: string;
  score: number | null;
  hot: boolean | null;
  assigneeId: string | null;
  totalCents: bigint;
  currency: string;
  pricingBreakdown: unknown;
  configState: unknown;
  contact: unknown;
  source: string | null;
  referrer: string | null;
  pdfUrl: string | null;
  submittedAt: Date;
  tags: string[] | null;
}

export interface LeadFilters {
  status?: string;
  q?: string;
  configuratorId?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
}

// ── Look up routing rule → assignee ──────────────────────────────────

async function resolveAssignee(
  ctx: ServiceCtx,
  configState: Record<string, unknown>,
): Promise<string | null> {
  const rules = await ctx.db
    .select()
    .from(routingRules)
    .where(and(eq(routingRules.workspaceId, ctx.workspaceId), eq(routingRules.enabled, true)))
    .orderBy(routingRules.priority);

  for (const rule of rules) {
    const action = rule.action as { assigneeId?: string };
    if (action.assigneeId) return action.assigneeId;
  }
  return null;
}

// ── createLead ────────────────────────────────────────────────────────

export async function createLead(
  ctx: ServiceCtx,
  input: CreateLeadInput,
): Promise<{ leadId: string; leadRef: string; totalCents: bigint; currency: string }> {
  // Load the configurator version schema
  const [ver] = await ctx.db
    .select({ schema: configuratorVersions.schema })
    .from(configuratorVersions)
    .where(eq(configuratorVersions.id, input.versionId))
    .limit(1);

  if (!ver) throw new Error('Configurator version not found');

  const schema = ver.schema as ConfiguratorSchema;

  // Server-side evaluate — never trust client pricing
  const evalResult = evaluate(schema, input.state);
  const { total, currency, breakdown } = evalResult.pricing;
  const { total: score, hot } = evalResult.score;

  // Upsert customer
  const existingCustomers = await ctx.db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.workspaceId, ctx.workspaceId), eq(customers.email, input.contact.email.toLowerCase())))
    .limit(1);

  let customerId: string;
  if (existingCustomers.length > 0) {
    customerId = existingCustomers[0].id;
    await ctx.db
      .update(customers)
      .set({ name: input.contact.name, phone: input.contact.phone ?? undefined, lastSeenAt: new Date(), configCount: sql`${customers.configCount} + 1` })
      .where(eq(customers.id, customerId));
  } else {
    customerId = ulid('cust_');
    await ctx.db.insert(customers).values({
      id: customerId,
      workspaceId: ctx.workspaceId,
      email: input.contact.email.toLowerCase(),
      name: input.contact.name,
      phone: input.contact.phone ?? null,
      city: input.contact.city ?? null,
    });
  }

  // Resolve assignee
  const assigneeId = await resolveAssignee(ctx, input.state);

  // Count existing leads for ref numbering
  const [countRow] = await ctx.db
    .select({ n: count() })
    .from(leads)
    .where(eq(leads.workspaceId, ctx.workspaceId));
  const leadNumber = (countRow?.n ?? 0) + 1;

  // Get workspace slug for ref
  const leadId = ulid('lead_');
  const leadRef = makeLeadRef(ctx.workspaceId.slice(-4), Number(leadNumber));

  // Create lead
  await ctx.db.insert(leads).values({
    id: leadId,
    workspaceId: ctx.workspaceId,
    configuratorId: input.configuratorId,
    versionId: input.versionId,
    customerId,
    status: 'new',
    score,
    hot,
    assigneeId,
    totalCents: BigInt(total),
    currency,
    pricingBreakdown: breakdown,
    configState: input.state,
    contact: input.contact,
    source: input.meta.host,
    referrer: input.meta.referrer ?? null,
    userAgent: input.meta.userAgent ?? null,
    ipCountry: input.meta.ipCountry ?? null,
    tags: [],
  });

  // Record creation event
  await ctx.db.insert(leadEvents).values({
    id: ulid('evt_'),
    leadId,
    workspaceId: ctx.workspaceId,
    type: 'created',
    payload: { source: input.meta.host, sessionId: input.sessionId },
  });

  return { leadId, leadRef, totalCents: BigInt(total), currency };
}

// ── getLead ───────────────────────────────────────────────────────────

export async function getLead(ctx: ServiceCtx, leadId: string): Promise<LeadRow | null> {
  const [row] = await ctx.db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.workspaceId, ctx.workspaceId)))
    .limit(1);
  return row ?? null;
}

// ── listLeads ─────────────────────────────────────────────────────────

export async function listLeads(
  ctx: ServiceCtx,
  filters: LeadFilters = {},
): Promise<Paginated<LeadRow>> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(200, filters.limit ?? 50);
  const offset = (page - 1) * limit;

  const conditions = [
    eq(leads.workspaceId, ctx.workspaceId),
    sql`${leads.deletedAt} IS NULL`,
  ];

  if (filters.status) conditions.push(eq(leads.status, filters.status));
  if (filters.configuratorId) conditions.push(eq(leads.configuratorId, filters.configuratorId));
  if (filters.assigneeId) conditions.push(eq(leads.assigneeId, filters.assigneeId));
  if (filters.q) {
    // Search in contact JSON
    conditions.push(sql`${leads.contact}::text ILIKE ${'%' + filters.q + '%'}`);
  }

  const where = and(...conditions);

  const [rows, [totalRow]] = await Promise.all([
    ctx.db.select().from(leads).where(where).orderBy(desc(leads.submittedAt)).limit(limit).offset(offset),
    ctx.db.select({ n: count() }).from(leads).where(where),
  ]);

  return { data: rows, page, limit, total: Number(totalRow?.n ?? 0) };
}

// ── patchLead ─────────────────────────────────────────────────────────

export interface PatchLeadInput {
  status?: string;
  assigneeId?: string | null;
  tags?: string[];
  score?: number;
  hot?: boolean;
}

export async function patchLead(
  ctx: ServiceCtx,
  leadId: string,
  input: PatchLeadInput,
): Promise<void> {
  const existing = await getLead(ctx, leadId);
  if (!existing) throw new Error('Lead not found');

  await ctx.db
    .update(leads)
    .set({
      ...(input.status !== undefined && { status: input.status }),
      ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.score !== undefined && { score: input.score }),
      ...(input.hot !== undefined && { hot: input.hot }),
    })
    .where(and(eq(leads.id, leadId), eq(leads.workspaceId, ctx.workspaceId)));

  if (input.status && input.status !== existing.status) {
    await ctx.db.insert(leadEvents).values({
      id: ulid('evt_'),
      leadId,
      workspaceId: ctx.workspaceId,
      type: 'status_changed',
      actorUserId: ctx.userId ?? null,
      payload: { from: existing.status, to: input.status },
    });
  }
}

// ── getLeadEvents ─────────────────────────────────────────────────────

export interface LeadEventRow {
  id: string;
  type: string;
  actorUserId: string | null;
  payload: unknown;
  createdAt: Date;
}

export async function getLeadEvents(
  ctx: ServiceCtx,
  leadId: string,
): Promise<LeadEventRow[]> {
  return ctx.db
    .select({
      id: leadEvents.id,
      type: leadEvents.type,
      actorUserId: leadEvents.actorUserId,
      payload: leadEvents.payload,
      createdAt: leadEvents.createdAt,
    })
    .from(leadEvents)
    .where(and(eq(leadEvents.leadId, leadId), eq(leadEvents.workspaceId, ctx.workspaceId)))
    .orderBy(desc(leadEvents.createdAt));
}

// ── getPublicConfigurator ─────────────────────────────────────────────

export interface PublicConfiguratorData {
  id: string;
  version: string;
  schema: ConfiguratorSchema;
  branding: { primary: string | null; logoUrl: string | null; font: string | null };
  allowedHosts: string[];
}

export async function getPublicConfigurator(
  db: ServiceCtx['db'],
  configuratorId: string,
): Promise<PublicConfiguratorData | null> {
  const [cfg] = await db
    .select({
      id: configurators.id,
      status: configurators.status,
      liveVersionId: configurators.liveVersionId,
    })
    .from(configurators)
    .where(eq(configurators.id, configuratorId))
    .limit(1);

  if (!cfg || cfg.status !== 'live' || !cfg.liveVersionId) return null;

  const [ver] = await db
    .select({ id: configuratorVersions.id, schema: configuratorVersions.schema })
    .from(configuratorVersions)
    .where(eq(configuratorVersions.id, cfg.liveVersionId))
    .limit(1);

  if (!ver) return null;

  return {
    id: cfg.id,
    version: ver.id,
    schema: ver.schema as ConfiguratorSchema,
    branding: { primary: null, logoUrl: null, font: null },
    allowedHosts: [],
  };
}
