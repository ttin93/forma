# DATA-MODEL.md

Source of truth for the Postgres schema. Drizzle definitions live in
`packages/db/schema/*.ts` and must mirror this doc.

**Rules:**
- All ids are `text` ULID (lexicographic-sortable, 26 chars)
- All timestamps `timestamptz`, default `now()`
- All money in `bigint` cents + a `currency text` sibling column
- Every customer-owned table has `workspace_id` + RLS policy
- Every PII row has nullable `deleted_at` (soft delete) — hard-delete after 30d via job

## Tenancy

```sql
-- A signup creates one workspace and one membership.
workspaces (
  id              text primary key,           -- ws_01H...
  slug            text unique not null,       -- sunpergola
  name            text not null,              -- "SunPergola d.o.o."
  industry        text,                       -- 'pergola' | 'window' | 'kitchen' | 'carport' | 'sauna' | 'other'
  currency        text not null default 'EUR',
  locale          text not null default 'sl-SI',
  timezone        text not null default 'Europe/Ljubljana',
  brand_primary   text default '#0a0a0a',
  brand_logo_url  text,
  brand_font      text,                       -- inherited from site, otherwise this
  custom_domain   text,                       -- pergolas.maker.com  (for white-label iframe)
  plan            text not null default 'trial',  -- 'trial'|'starter'|'growth'|'scale'|'cancelled'
  trial_ends_at   timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
)

users (
  id              text primary key,
  email           text unique not null,
  name            text,
  avatar_url      text,
  password_hash   text,                       -- null if SSO-only
  email_verified_at timestamptz,
  two_fa_secret   text,
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz
)

memberships (
  id              text primary key,
  workspace_id    text not null references workspaces(id) on delete cascade,
  user_id         text not null references users(id) on delete cascade,
  role            text not null,              -- 'owner'|'admin'|'editor'|'sales'|'viewer'
  invited_by      text references users(id),
  invited_at      timestamptz,
  joined_at       timestamptz,
  created_at      timestamptz not null default now(),
  unique (workspace_id, user_id)
)

sessions (                                    -- Lucia
  id              text primary key,
  user_id         text not null references users(id) on delete cascade,
  active_workspace_id text references workspaces(id),
  expires_at      timestamptz not null
)
```

## Configurators

```sql
-- A configurator has many versions; embeds load a pinned version.
configurators (
  id              text primary key,
  workspace_id    text not null references workspaces(id) on delete cascade,
  slug            text not null,              -- 'pergola-classic'
  name            text not null,
  status          text not null default 'draft',  -- 'draft'|'live'|'archived'
  -- Pointer to the currently-published version. embed.js loads this.
  live_version_id text,
  created_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (workspace_id, slug)
)

-- Each publish creates a new immutable version. Schema is in CONFIGURATOR-SCHEMA.md.
configurator_versions (
  id              text primary key,
  configurator_id text not null references configurators(id) on delete cascade,
  workspace_id    text not null,              -- denorm for RLS
  version         int not null,               -- 1, 2, 3...
  status          text not null default 'draft',  -- 'draft'|'published'|'rolled-back'
  schema          jsonb not null,             -- full configurator JSON
  published_at    timestamptz,
  published_by    text references users(id),
  rollback_of     text references configurator_versions(id),
  created_at      timestamptz not null default now(),
  unique (configurator_id, version)
)

-- Per-configurator overrides applied without bumping a version (banners, promo codes).
configurator_overrides (
  id              text primary key,
  configurator_id text not null references configurators(id) on delete cascade,
  workspace_id    text not null,
  key             text not null,              -- 'banner-text'|'promo-code'|...
  value           jsonb not null,
  created_at      timestamptz not null default now()
)

-- Allowed domains for the embed (CORS + Referer enforcement).
configurator_domains (
  id              text primary key,
  configurator_id text not null references configurators(id) on delete cascade,
  workspace_id    text not null,
  host            text not null,              -- 'sunpergola.si' (no scheme, no path)
  verified_at     timestamptz,
  unique (configurator_id, host)
)
```

## Leads & submissions

```sql
-- A "lead" is one buyer's submission. Same buyer submitting twice = two leads
-- but one customer (via dedupe on email).
leads (
  id              text primary key,           -- L-... (display form derived)
  workspace_id    text not null,
  configurator_id text not null references configurators(id),
  version_id      text not null references configurator_versions(id),
  customer_id     text references customers(id),
  status          text not null default 'new',  -- 'new'|'contacted'|'qualified'|'quoted'|'won'|'lost'|'spam'
  score           int default 0,              -- 0..100
  hot             boolean default false,
  assignee_id     text references users(id),
  total_cents     bigint not null,
  currency        text not null,
  pricing_breakdown jsonb not null,           -- itemised lines from rule eval
  config_state    jsonb not null,             -- the raw answers (width=4.2, color='anthracite', ...)
  contact         jsonb not null,             -- { name, email, phone, city, postcode, notes }
  source          text,                       -- 'sunpergola.si/garden' | 'google-ads' | ...
  user_agent      text,
  referrer        text,
  ip_country      text,                       -- 'SI' (no full IP stored)
  pdf_url         text,
  submitted_at    timestamptz not null default now(),
  first_replied_at timestamptz,
  closed_at       timestamptz,
  tags            text[] default '{}',
  deleted_at      timestamptz
)

-- Aggregate view of buyers (one row per email per workspace).
customers (
  id              text primary key,
  workspace_id    text not null,
  email           text not null,
  name            text,
  phone           text,
  company         text,
  city            text,
  country         text,
  newsletter_opt_in boolean default false,
  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  ltv_cents       bigint default 0,
  config_count    int default 0,
  purchase_count  int default 0,
  deleted_at      timestamptz,
  unique (workspace_id, email)
)

lead_events (                                 -- activity timeline
  id              text primary key,
  lead_id         text not null references leads(id) on delete cascade,
  workspace_id    text not null,
  type            text not null,              -- 'created'|'scored'|'assigned'|'replied'|'status_changed'|'note'|'webhook_sent'|'crm_synced'
  actor_user_id   text references users(id),  -- null = system
  payload         jsonb,
  created_at      timestamptz not null default now()
)

lead_notes (
  id              text primary key,
  lead_id         text not null references leads(id) on delete cascade,
  workspace_id    text not null,
  author_id       text not null references users(id),
  body            text not null,
  created_at      timestamptz not null default now()
)

lead_messages (                               -- the conversation tab
  id              text primary key,
  lead_id         text not null references leads(id) on delete cascade,
  workspace_id    text not null,
  direction       text not null,              -- 'inbound'|'outbound'
  channel         text not null,              -- 'email'|'configurator'|'note'
  from_address    text,
  to_address      text,
  subject         text,
  body_html       text,
  body_text       text,
  attachments     jsonb default '[]',
  created_at      timestamptz not null default now()
)

-- Routing rules — see "Lead routing" in the Settings → Team page in the canvas.
routing_rules (
  id              text primary key,
  workspace_id    text not null,
  priority        int not null,
  enabled         boolean default true,
  match           jsonb not null,             -- { configurator_id?, value_gte?, city_in?, source_contains? }
  action          jsonb not null,             -- { assign_to_user_id? | round_robin_pool: [user_id...] }
  created_at      timestamptz not null default now()
)
```

## Analytics events (high-volume; consider Postgres for MVP, ClickHouse later)

```sql
-- Hot path: a single insert per pageview, step-shown, step-submitted.
analytics_events (
  id              bigserial primary key,
  workspace_id    text not null,
  configurator_id text not null,
  version_id      text not null,
  session_id      text not null,              -- buyer's session (anonymous, cookie-less; use sessionStorage uuid)
  event           text not null,              -- 'view'|'step.shown'|'step.submitted'|'price.changed'|'submitted'|'dropped'
  step_id         text,
  payload         jsonb,
  ts              timestamptz not null default now(),
  ua_device       text,                       -- 'desktop'|'tablet'|'mobile'
  ua_country      text,
  utm             jsonb
);
create index on analytics_events (workspace_id, ts);
create index on analytics_events (configurator_id, event, ts);
```

## Integrations

```sql
api_keys (
  id              text primary key,
  workspace_id    text not null,
  name            text not null,
  prefix          text not null,              -- 'fk_live_a1b2c3' (shown in UI)
  hash            text not null,              -- bcrypt of the full key
  scopes          text[] not null default '{leads:read}',
  last_used_at    timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now()
)

webhooks (
  id              text primary key,
  workspace_id    text not null,
  url             text not null,
  events          text[] not null default '{lead.created}',
  secret          text not null,              -- HMAC-SHA256 signing key
  enabled         boolean default true,
  created_at      timestamptz not null default now()
)

webhook_deliveries (
  id              text primary key,
  webhook_id      text not null references webhooks(id) on delete cascade,
  workspace_id    text not null,
  event           text not null,
  payload         jsonb not null,
  status_code     int,
  response_body   text,
  attempts        int default 1,
  delivered_at    timestamptz,
  next_retry_at   timestamptz,
  created_at      timestamptz not null default now()
)

integrations (                                -- Pipedrive, HubSpot, Slack, etc.
  id              text primary key,
  workspace_id    text not null,
  kind            text not null,              -- 'pipedrive'|'hubspot'|'salesforce'|'slack'|'zapier'|'mailchimp'|'gmail'
  config          jsonb not null,             -- { api_key (encrypted), pipeline_id, ... }
  enabled         boolean default true,
  created_at      timestamptz not null default now()
)
```

## Billing

```sql
-- Usage counters (rolled up nightly to a billing_periods row).
usage_counters (
  workspace_id    text not null,
  period_start    date not null,              -- billing period start
  leads_count     int default 0,
  configurators_count int default 0,
  active_seats    int default 0,
  primary key (workspace_id, period_start)
)

invoices (                                    -- mirror of Stripe invoices for fast UI
  id              text primary key,
  workspace_id    text not null,
  stripe_invoice_id text not null unique,
  number          text not null,              -- INV-2026-118
  status          text not null,              -- 'paid'|'open'|'void'|'uncollectible'
  amount_cents    bigint not null,
  currency        text not null,
  period_start    date,
  period_end      date,
  issued_at       timestamptz,
  paid_at         timestamptz,
  pdf_url         text
)
```

## Row-Level Security (RLS)

**Every table with `workspace_id`** gets:

```sql
alter table TABLE enable row level security;

-- Read/write only rows in workspaces you're a member of.
create policy ws_isolation on TABLE
  for all
  using (
    workspace_id = current_setting('app.workspace_id', true)::text
  );
```

The Drizzle client sets `app.workspace_id` per request via:
```sql
select set_config('app.workspace_id', $1, true);
```

This is **defense in depth**. Application code MUST ALSO scope every query
to `workspaceId` from the session. RLS is the safety net, not the primary
guard.

See `AUTH-MULTITENANT.md` for how `workspaceId` is derived.

## Migrations

- Drizzle Kit, one migration per PR
- Migrations run automatically on Vercel preview deploys
- Down-migrations not maintained (forward-only); destructive changes go
  through two-step deploy (add column → backfill → drop)
