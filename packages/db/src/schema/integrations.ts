import { pgTable, text, timestamp, boolean, jsonb, integer, bigint, date, serial } from 'drizzle-orm/pg-core';
import { workspaces } from './auth';

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  name: text('name').notNull(),
  prefix: text('prefix').notNull(),
  hash: text('hash').notNull(),
  scopes: text('scopes').array().default(['leads:read']).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const webhooks = pgTable('webhooks', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  url: text('url').notNull(),
  events: text('events').array().default(['lead.created']).notNull(),
  secret: text('secret').notNull(),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: text('id').primaryKey(),
  webhookId: text('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull(),
  event: text('event').notNull(),
  payload: jsonb('payload').notNull(),
  statusCode: integer('status_code'),
  responseBody: text('response_body'),
  attempts: integer('attempts').default(1),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const integrations = pgTable('integrations', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  kind: text('kind').notNull(),
  config: jsonb('config').notNull(),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  configuratorId: text('configurator_id').notNull(),
  versionId: text('version_id').notNull(),
  sessionId: text('session_id').notNull(),
  event: text('event').notNull(), // 'view'|'step.shown'|'step.submitted'|'submitted'|'dropped'
  stepId: text('step_id'),
  payload: jsonb('payload'),
  ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
  uaDevice: text('ua_device'),
  uaCountry: text('ua_country'),
  utm: jsonb('utm'),
});

export const usageCounters = pgTable('usage_counters', {
  workspaceId: text('workspace_id').notNull(),
  periodStart: date('period_start').notNull(),
  leadsCount: integer('leads_count').default(0),
  configuratorsCount: integer('configurators_count').default(0),
  activeSeats: integer('active_seats').default(0),
});

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  stripeInvoiceId: text('stripe_invoice_id').unique().notNull(),
  number: text('number').notNull(),
  status: text('status').notNull(), // 'paid'|'open'|'void'|'uncollectible'
  amountCents: bigint('amount_cents', { mode: 'bigint' }).notNull(),
  currency: text('currency').notNull(),
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  pdfUrl: text('pdf_url'),
});
