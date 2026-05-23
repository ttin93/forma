# INTEGRATIONS.md

## Stripe (billing)

### Products & prices

Create in Stripe dashboard, then sync IDs to env vars:

```
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_GROWTH_MONTHLY=price_...
STRIPE_PRICE_GROWTH_ANNUAL=price_...
STRIPE_PRICE_SCALE_MONTHLY=price_...
STRIPE_PRICE_SCALE_ANNUAL=price_...
STRIPE_PRICE_OVERAGE_LEAD=price_...      # metered, per-lead overage
STRIPE_PRICE_EXTRA_SEAT=price_...        # €19/seat, see ModalInvite in canvas
```

### Subscription model

One subscription per workspace, with:
- Plan price (base)
- Optional overage line item (metered)
- Optional extra seats line item (per-seat)

### Flows

| Action | Result |
|---|---|
| Sign-up | `workspaces.plan = 'trial'`, `trial_ends_at = now + 14d`, no Stripe customer yet |
| Trial expiry without upgrade | Plan → `cancelled`, configurators stop serving (embed returns "Configurator unavailable") |
| Upgrade | Create Stripe customer + subscription; checkout via Stripe Checkout. Webhook `checkout.session.completed` → set `plan`, `stripe_*_id` |
| Cancel | Stripe portal; webhook `customer.subscription.deleted` → set `plan = 'cancelled'`, deactivate at period end |
| Overage | Nightly job counts leads per workspace; if over plan limit, report usage to Stripe metered line item |

### Webhook handler

`POST /api/webhooks/stripe` — verify signature, route on event type:
- `customer.subscription.created` | `.updated` | `.deleted`
- `invoice.paid` | `.finalized` → upsert `invoices` row
- `checkout.session.completed` → activate workspace

Always 200-OK quickly; offload work to Inngest.

## Resend (transactional email)

Templates live in `packages/email/templates/*.tsx` (React Email).

| Template | Trigger |
|---|---|
| `welcome.tsx`               | After sign-up |
| `email-verify.tsx`          | After sign-up + on resend |
| `magic-link.tsx`            | Magic-link login |
| `invite.tsx`                | Teammate invited |
| `lead-buyer-ack.tsx`        | Buyer confirmation (post-submit) — branded with workspace logo + colors |
| `lead-owner-notify.tsx`     | Lead notification to assignee, with config summary + quote attached |
| `lead-reply.tsx`            | Manufacturer's reply to buyer (renders the manufacturer-typed body) |
| `quote.tsx` (PDF)           | The PDF itself (React PDF) — also attached to `lead-buyer-ack` |
| `trial-ending.tsx`          | 3 days, 1 day before trial end |
| `usage-80-percent.tsx`      | When leads cross 80% of plan |
| `invoice-paid.tsx`          | After Stripe `invoice.paid` |

### From addresses

- `noreply@forma.studio` — Forma system mails
- `quotes@<workspace.slug>.forma.studio` — buyer-facing replies (we set up MX, DKIM, SPF via Resend Domains API on workspace create — but **only on paid plans**)

### Inbound parsing

Replies from buyers to `quotes@…` are parsed by Resend → `POST /api/webhooks/email/inbound` → matched to lead by `lead_messages.id` in the email's `In-Reply-To` header → inserts a new `lead_messages` row (`direction: 'inbound'`).

## Webhooks (outbound)

See API.md → "Webhook payloads".

Implementation: when an event fires, an Inngest function fanouts to all
`webhooks` rows where `events` contains the event. Each fanout creates a
`webhook_deliveries` row, then attempts POST. On non-2xx or timeout (10s),
schedules a retry at `now + backoff[attempt]`.

UI: each webhook has a "Test" button that fires a synthetic `lead.created`
to the URL.

## CRM integrations

Common shape per integration:

```ts
type Integration = {
  kind: 'pipedrive' | 'hubspot' | 'salesforce' | 'slack' | 'gmail' | 'mailchimp';
  install: (workspaceId, oauthCode) => Promise<void>;
  uninstall: (integrationId) => Promise<void>;
  onLeadCreated?: (ctx: ServiceCtx, lead: Lead) => Promise<void>;
  onLeadStatusChanged?: (ctx: ServiceCtx, lead: Lead, from: Status, to: Status) => Promise<void>;
};
```

MVP ships **Pipedrive** + **Slack** + **Zapier** (via outgoing webhooks)
+ **Gmail** (OAuth for "send replies from your Gmail").

### Pipedrive — onLeadCreated

```
POST https://{company}.pipedrive.com/v1/deals?api_token=...
{
  "title": "Pergola Classic — Lara Bregar",
  "value": 4820,
  "currency": "EUR",
  "person_id": <created or matched by email>,
  "stage_id": <integration.config.stage_id>,
  "custom_field_<config>": "<JSON of config_state>"
}
```

### Slack — onLeadCreated

Posts a card to a channel selected during install. See canvas: notification
toast style.

### Zapier

Generic outgoing webhook with a documented payload schema published at
`forma.studio/docs/zapier`.

## Calendar (Google Calendar / Outlook)

Out of MVP scope. The "Book a 15-min call" button on the buyer thank-you
screen (canvas: `EndUser3`) v1 just sends an internal email — v2 books a
real slot via Cal.com or Google Calendar API.

## File storage (R2)

- `assets/{workspaceId}/...` — logos, swatch images, brand uploads
- `quotes/{workspaceId}/{leadId}.pdf` — rendered quotes (signed URL, 30-day expiry)
- `imports/{workspaceId}/...` — CSV imports for price sheets

All `s3.putObject` calls go through `packages/services/storage.ts`.

## Cloudflare Turnstile (anti-spam)

Site key & secret per env. Token sent in every buyer submit. Validated
server-side in `/public/v1/configurators/:slug/submit`.

## Sentry / observability — POST-MVP

For MVP, structured logs to stdout (`pino`). Vercel logs cover this.
After 100 paying workspaces, add Sentry for browser errors + Axiom for
backend logs.

## Env vars (canonical list)

```
# auth
LUCIA_SECRET=

# db
DATABASE_URL=
DATABASE_URL_UNPOOLED=        # for migrations

# stripe
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MONTHLY=...

# email
RESEND_API_KEY=
RESEND_INBOUND_SIGNING_SECRET=

# storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET=
R2_BUCKET=

# jobs
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# embed
EMBED_PUBLIC_KEY=             # for signing public configurator JSON if needed
CDN_HOST=cdn.forma.studio

# captcha
TURNSTILE_SECRET=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=

# integrations
PIPEDRIVE_CLIENT_ID=
PIPEDRIVE_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
```

`.env.example` should mirror this list with placeholder values.
