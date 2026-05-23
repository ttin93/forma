import { pgTable, text, timestamp, integer, jsonb, unique, boolean } from 'drizzle-orm/pg-core';
import { workspaces } from './auth';
import { users } from './auth';

export const configurators = pgTable('configurators', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  status: text('status').default('draft').notNull(), // 'draft'|'live'|'archived'
  liveVersionId: text('live_version_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (t) => [unique().on(t.workspaceId, t.slug)]);

export const configuratorVersions = pgTable('configurator_versions', {
  id: text('id').primaryKey(),
  configuratorId: text('configurator_id').notNull().references(() => configurators.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull(),
  version: integer('version').notNull(),
  status: text('status').default('draft').notNull(), // 'draft'|'published'|'rolled-back'
  schema: jsonb('schema').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishedBy: text('published_by').references(() => users.id),
  rollbackOf: text('rollback_of'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [unique().on(t.configuratorId, t.version)]);

export const configuratorDomains = pgTable('configurator_domains', {
  id: text('id').primaryKey(),
  configuratorId: text('configurator_id').notNull().references(() => configurators.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull(),
  host: text('host').notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
}, (t) => [unique().on(t.configuratorId, t.host)]);

export const configuratorOverrides = pgTable('configurator_overrides', {
  id: text('id').primaryKey(),
  configuratorId: text('configurator_id').notNull().references(() => configurators.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull(),
  key: text('key').notNull(),
  value: jsonb('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
