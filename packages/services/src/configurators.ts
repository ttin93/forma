import { eq, and, desc, max, sql, count } from 'drizzle-orm';
import { configurators, configuratorVersions, configuratorDomains, leads } from '@forma/db';
import type { ConfiguratorSchema } from '@forma/types';
import type { ServiceCtx } from './types';

function ulid(prefix = ''): string {
  const ts = Date.now().toString(36).padStart(8, '0').toUpperCase();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map(b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[b & 31])
    .join('');
  return prefix + ts + rand;
}

export interface AdminConfiguratorData {
  id: string;
  workspaceId: string;
  slug: string;
  name: string;
  status: string;
  liveVersionId: string | null;
  latestVersion: {
    id: string;
    version: number;
    status: string;
    schema: ConfiguratorSchema;
  } | null;
}

export async function getAdminConfigurator(
  ctx: ServiceCtx,
  configuratorId: string,
): Promise<AdminConfiguratorData | null> {
  const [cfg] = await ctx.db
    .select()
    .from(configurators)
    .where(and(eq(configurators.id, configuratorId), eq(configurators.workspaceId, ctx.workspaceId)))
    .limit(1);

  if (!cfg) return null;

  const [latest] = await ctx.db
    .select()
    .from(configuratorVersions)
    .where(eq(configuratorVersions.configuratorId, configuratorId))
    .orderBy(desc(configuratorVersions.version))
    .limit(1);

  return {
    id: cfg.id,
    workspaceId: cfg.workspaceId,
    slug: cfg.slug,
    name: cfg.name,
    status: cfg.status,
    liveVersionId: cfg.liveVersionId,
    latestVersion: latest
      ? { id: latest.id, version: latest.version, status: latest.status, schema: latest.schema as ConfiguratorSchema }
      : null,
  };
}

export async function saveDraft(
  ctx: ServiceCtx,
  configuratorId: string,
  schema: ConfiguratorSchema,
  name?: string,
): Promise<{ versionId: string; version: number }> {
  // Check ownership
  const [cfg] = await ctx.db
    .select({ id: configurators.id, name: configurators.name })
    .from(configurators)
    .where(and(eq(configurators.id, configuratorId), eq(configurators.workspaceId, ctx.workspaceId)))
    .limit(1);

  if (!cfg) throw new Error('Configurator not found');

  // Update name if provided
  if (name && name !== cfg.name) {
    await ctx.db.update(configurators).set({ name }).where(eq(configurators.id, configuratorId));
  }

  // Find the latest existing draft version to update, or create a new one
  const [existingDraft] = await ctx.db
    .select({ id: configuratorVersions.id, version: configuratorVersions.version })
    .from(configuratorVersions)
    .where(and(eq(configuratorVersions.configuratorId, configuratorId), eq(configuratorVersions.status, 'draft')))
    .orderBy(desc(configuratorVersions.version))
    .limit(1);

  if (existingDraft) {
    await ctx.db
      .update(configuratorVersions)
      .set({ schema })
      .where(eq(configuratorVersions.id, existingDraft.id));
    return { versionId: existingDraft.id, version: existingDraft.version };
  }

  // Get max version number
  const [maxRow] = await ctx.db
    .select({ maxV: max(configuratorVersions.version) })
    .from(configuratorVersions)
    .where(eq(configuratorVersions.configuratorId, configuratorId));

  const nextVersion = (maxRow?.maxV ?? 0) + 1;
  const versionId = ulid('ver_');

  await ctx.db.insert(configuratorVersions).values({
    id: versionId,
    configuratorId,
    workspaceId: ctx.workspaceId,
    version: nextVersion,
    status: 'draft',
    schema,
  });

  return { versionId, version: nextVersion };
}

export async function publishLatest(
  ctx: ServiceCtx,
  configuratorId: string,
): Promise<void> {
  const [cfg] = await ctx.db
    .select({ id: configurators.id })
    .from(configurators)
    .where(and(eq(configurators.id, configuratorId), eq(configurators.workspaceId, ctx.workspaceId)))
    .limit(1);

  if (!cfg) throw new Error('Configurator not found');

  const [draft] = await ctx.db
    .select({ id: configuratorVersions.id })
    .from(configuratorVersions)
    .where(and(eq(configuratorVersions.configuratorId, configuratorId), eq(configuratorVersions.status, 'draft')))
    .orderBy(desc(configuratorVersions.version))
    .limit(1);

  if (!draft) throw new Error('No draft to publish');

  const now = new Date();
  await ctx.db
    .update(configuratorVersions)
    .set({ status: 'published', publishedAt: now, publishedBy: ctx.userId ?? null })
    .where(eq(configuratorVersions.id, draft.id));

  await ctx.db
    .update(configurators)
    .set({ status: 'live', liveVersionId: draft.id })
    .where(eq(configurators.id, configuratorId));
}

export async function createConfigurator(
  ctx: ServiceCtx,
  input: { name: string; slug: string },
): Promise<{ id: string }> {
  const id = ulid('cfg_');
  await ctx.db.insert(configurators).values({
    id,
    workspaceId: ctx.workspaceId,
    slug: input.slug,
    name: input.name,
    status: 'draft',
  });
  return { id };
}

export async function listConfigurators(ctx: ServiceCtx) {
  const leadCounts = ctx.db
    .$with('lead_counts')
    .as(
      ctx.db
        .select({ configuratorId: leads.configuratorId, n: count().as('n') })
        .from(leads)
        .where(sql`${leads.deletedAt} IS NULL`)
        .groupBy(leads.configuratorId),
    );

  return ctx.db
    .with(leadCounts)
    .select({
      id: configurators.id,
      slug: configurators.slug,
      name: configurators.name,
      status: configurators.status,
      liveVersionId: configurators.liveVersionId,
      createdAt: configurators.createdAt,
      leadCount: sql<number>`COALESCE(${leadCounts.n}, 0)`.mapWith(Number),
    })
    .from(configurators)
    .leftJoin(leadCounts, eq(leadCounts.configuratorId, configurators.id))
    .where(and(eq(configurators.workspaceId, ctx.workspaceId), sql`${configurators.archivedAt} IS NULL`))
    .orderBy(desc(configurators.createdAt));
}

export async function unpublishConfigurator(
  ctx: ServiceCtx,
  configuratorId: string,
): Promise<void> {
  const [cfg] = await ctx.db
    .select({ id: configurators.id })
    .from(configurators)
    .where(and(eq(configurators.id, configuratorId), eq(configurators.workspaceId, ctx.workspaceId)))
    .limit(1);

  if (!cfg) throw new Error('Configurator not found');

  await ctx.db
    .update(configurators)
    .set({ status: 'draft', liveVersionId: null })
    .where(eq(configurators.id, configuratorId));
}

export async function listDomains(ctx: ServiceCtx, configuratorId: string) {
  const [cfg] = await ctx.db
    .select({ id: configurators.id })
    .from(configurators)
    .where(and(eq(configurators.id, configuratorId), eq(configurators.workspaceId, ctx.workspaceId)))
    .limit(1);

  if (!cfg) throw new Error('Configurator not found');

  return ctx.db
    .select({ id: configuratorDomains.id, host: configuratorDomains.host, verifiedAt: configuratorDomains.verifiedAt })
    .from(configuratorDomains)
    .where(eq(configuratorDomains.configuratorId, configuratorId));
}

export async function addDomain(
  ctx: ServiceCtx,
  configuratorId: string,
  host: string,
): Promise<{ id: string }> {
  const [cfg] = await ctx.db
    .select({ id: configurators.id })
    .from(configurators)
    .where(and(eq(configurators.id, configuratorId), eq(configurators.workspaceId, ctx.workspaceId)))
    .limit(1);

  if (!cfg) throw new Error('Configurator not found');

  const id = ulid('dom_');
  await ctx.db.insert(configuratorDomains).values({
    id,
    configuratorId,
    workspaceId: ctx.workspaceId,
    host,
  });
  return { id };
}

export async function removeDomain(
  ctx: ServiceCtx,
  configuratorId: string,
  domainId: string,
): Promise<void> {
  await ctx.db
    .delete(configuratorDomains)
    .where(
      and(
        eq(configuratorDomains.id, domainId),
        eq(configuratorDomains.configuratorId, configuratorId),
        eq(configuratorDomains.workspaceId, ctx.workspaceId),
      ),
    );
}
