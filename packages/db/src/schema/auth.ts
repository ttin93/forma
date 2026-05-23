import { pgTable, text, timestamp, boolean, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  twoFaSecret: text('two_fa_secret'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  industry: text('industry'),
  currency: text('currency').default('EUR').notNull(),
  locale: text('locale').default('sl-SI').notNull(),
  timezone: text('timezone').default('Europe/Ljubljana').notNull(),
  brandPrimary: text('brand_primary').default('#0a0a0a'),
  brandLogoUrl: text('brand_logo_url'),
  brandFont: text('brand_font'),
  customDomain: text('custom_domain'),
  notifEmailLead: boolean('notif_email_lead').default(true).notNull(),
  plan: text('plan').default('trial').notNull(), // 'trial'|'growth'|'pro'|'expired'
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  // Lemon Squeezy billing
  lsCustomerId: text('ls_customer_id'),
  lsSubscriptionId: text('ls_subscription_id'),
  lsStatus: text('ls_status'), // 'active'|'cancelled'|'expired'|'paused'|'on_trial'
  lsRenewsAt: timestamp('ls_renews_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const memberships = pgTable('memberships', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'owner'|'admin'|'editor'|'sales'|'viewer'
  invitedBy: text('invited_by').references(() => users.id),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [unique().on(t.workspaceId, t.userId)]);

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  activeWorkspaceId: text('active_workspace_id').references(() => workspaces.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
