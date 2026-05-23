# ARCHITECTURE.md

## High-level

```
                          ┌────────────────────────────────────┐
                          │   forma.studio  (marketing)        │
                          │   app.forma.studio  (admin)        │
                          │   ──────── Next.js / Vercel ──────│
                          │                                    │
   ┌──────────┐   embed   │   ┌──────────────┐                 │
   │ buyer    │──iframe──▶│   │  Postgres    │  Drizzle ORM    │
   │ on       │           │   │  Supabase    │                 │
   │ *.maker  │◀──post────│   │  + Row-Level │                 │
   │  .com    │   message │   │  Security    │                 │
   └──────────┘           │   └──────────────┘                 │
        │                 │          │                         │
        │ loads           │          ▼                         │
        ▼                 │   ┌──────────────┐                 │
  ┌──────────┐            │   │   Inngest    │  jobs           │
  │ embed.js │  fetch     │   │  (workers)   │  ───────────────│
  │ <30KB    │──config────▶│   └──────────────┘
  │ on CDN   │  submit────▶│       │      │
  └──────────┘            │       ▼      ▼
                          │   Resend   Stripe    R2/S3
                          │   (email)  (billing) (assets/PDFs)
                          └────────────────────────────────────┘
```

## Domains

- `forma.studio`        — marketing site (Next.js public routes)
- `app.forma.studio`    — admin app (Next.js authed routes)
- `cdn.forma.studio`    — static `embed.js` + iframe app (R2 + Cloudflare)
- `api.forma.studio`    — alias for app.forma.studio's `/api/v1` (rate-limited, CORS-allowed)
- `*.forma.app`         — optional per-workspace iframe host (for cookie isolation)

## Why a separate domain for the embed

The embed runs inside an iframe on the manufacturer's site. We need:
1. Third-party cookies (or postMessage-only state) for session continuity
2. CORS isolation so a misbehaving manufacturer site can't poke our admin
3. CDN edge caching of `embed.js` and configurator JSON

Hosting on `cdn.forma.studio` keeps the admin's auth cookies invisible to the embed and vice versa.

## Environments

- **dev** — local docker-compose (Postgres + minio), `.env.local`
- **preview** — every PR gets a Vercel preview + ephemeral Supabase branch
- **staging** — `staging.forma.studio`, mirrors prod data weekly
- **prod** — `forma.studio`

## Background jobs (Inngest)

Every async side-effect goes through Inngest. Each event has a typed
schema in `packages/types/events.ts`. Functions in `apps/web/inngest/*`.

Key event flows:

- `lead.submitted` → `email.send-acknowledgement` → `pdf.render-quote` → `email.send-to-owner` → `webhook.dispatch` → `crm.sync`
- `subscription.usage.tick` (every hour) → `billing.report-overage`
- `gdpr.delete-requested` (after 30d) → `db.hard-delete`

## Why these tech choices

| Choice | Why |
|---|---|
| Next.js App Router | Server Components for fast admin pages; one app handles marketing + admin |
| Drizzle | Type-safe SQL without ORM overhead; easy to drop to raw SQL for analytics |
| Lucia (not NextAuth) | We need workspace-scoped sessions and SSO; NextAuth fights this |
| Inngest (not BullMQ) | Hosted, free tier covers MVP, replays + observability for free |
| Supabase Postgres + RLS | Row-level security as defense-in-depth; we still scope queries in code |
| Resend | React Email + cheap + good deliverability |
| Cloudflare R2 | S3-compatible, no egress fees (PDFs get downloaded a lot) |
| Vanilla TS embed | React is too big and we don't control the host page's React version |

## What we DON'T use (and why)

- **No Redis** in MVP. Postgres `LISTEN/NOTIFY` covers the real-time admin needs.
- **No Kafka/RabbitMQ**. Inngest is enough.
- **No microservices**. One Next.js app + one embed bundle, until proven otherwise.
- **No GraphQL**. REST + Zod is simpler and matches our needs.
- **No Sentry yet**. Stick to Inngest replays + structured logs; add Sentry when we have real users.
