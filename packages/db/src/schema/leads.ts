import { pgTable, text, timestamp, integer, jsonb, boolean, bigint } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { workspaces, users } from './auth';
import { configurators, configuratorVersions } from './configurators';

export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  company: text('company'),
  city: text('city'),
  country: text('country'),
  newsletterOptIn: boolean('newsletter_opt_in').default(false),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  ltvCents: bigint('ltv_cents', { mode: 'bigint' }).default(sql`0`),
  configCount: integer('config_count').default(0),
  purchaseCount: integer('purchase_count').default(0),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const leads = pgTable('leads', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  configuratorId: text('configurator_id').notNull().references(() => configurators.id),
  versionId: text('version_id').notNull().references(() => configuratorVersions.id),
  customerId: text('customer_id').references(() => customers.id),
  status: text('status').default('new').notNull(), // 'new'|'contacted'|'qualified'|'quoted'|'won'|'lost'|'spam'
  score: integer('score').default(0),
  hot: boolean('hot').default(false),
  assigneeId: text('assignee_id').references(() => users.id),
  totalCents: bigint('total_cents', { mode: 'bigint' }).notNull(),
  currency: text('currency').notNull(),
  pricingBreakdown: jsonb('pricing_breakdown').notNull(),
  configState: jsonb('config_state').notNull(),
  contact: jsonb('contact').notNull(),
  source: text('source'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  ipCountry: text('ip_country'),
  pdfUrl: text('pdf_url'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  firstRepliedAt: timestamp('first_replied_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  tags: text('tags').array().default([]),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const leadEvents = pgTable('lead_events', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull(),
  type: text('type').notNull(),
  actorUserId: text('actor_user_id').references(() => users.id),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const leadNotes = pgTable('lead_notes', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull(),
  authorId: text('author_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const leadMessages = pgTable('lead_messages', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull(),
  direction: text('direction').notNull(), // 'inbound'|'outbound'
  channel: text('channel').notNull(), // 'email'|'configurator'|'note'
  fromAddress: text('from_address'),
  toAddress: text('to_address'),
  subject: text('subject'),
  bodyHtml: text('body_html'),
  bodyText: text('body_text'),
  attachments: jsonb('attachments').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const routingRules = pgTable('routing_rules', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  priority: integer('priority').notNull(),
  enabled: boolean('enabled').default(true),
  match: jsonb('match').notNull(),
  action: jsonb('action').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
