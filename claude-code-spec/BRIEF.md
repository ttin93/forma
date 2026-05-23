# Forma — Build Brief for Claude Code

> You are building **Forma**, a B2B SaaS platform that lets manufacturers
> (pergolas, windows, kitchens, carports, saunas) build product configurators
> and embed them on their own websites. End buyers configure a product and
> submit; the manufacturer gets a lead in the admin panel with full specs,
> a PDF quote, and CRM sync.
>
> The pixel-perfect visual reference lives in `../Forma — Full Application.html`
> (and its supporting `.jsx` files). **Open it. Study it.** Every screen,
> component, color, microcopy and table shape you need is in there.
>
> This folder (`claude-code-spec/`) contains the technical contract:
> data model, API, configurator JSON schema, embed protocol, integrations,
> and the phased roadmap.

## Read these in order

1. `CLAUDE.md`              — conventions, do/don't, code style
2. `ARCHITECTURE.md`        — stack and infra
3. `DATA-MODEL.md`          — Postgres schema (source of truth)
4. `AUTH-MULTITENANT.md`    — workspaces, roles, RLS
5. `CONFIGURATOR-SCHEMA.md` — the configurator JSON spec and runtime
6. `EMBED-PROTOCOL.md`      — how `embed.js` boots and talks home
7. `API.md`                 — every endpoint, request/response shape
8. `INTEGRATIONS.md`        — Stripe, email, webhooks, CRMs
9. `ROADMAP.md`             — what to build first, second, third

## The product, in one paragraph

A manufacturer signs up → picks an industry template → drags steps in the
visual builder (model, dimensions, color, add-ons, contact) → wires pricing
rules ("if width ≥ 5m add reinforced post +€280") → publishes → copies one
`<script>` snippet onto their site → buyers configure live → submit triggers
a lead in the manufacturer's inbox + PDF + webhook + CRM sync. The
manufacturer pays Forma a monthly fee tied to lead volume.

## Three audiences in one product

| Audience | Surface | Lives at |
|---|---|---|
| **Forma owner** (you) | — | Stripe dashboard, ops scripts |
| **Manufacturer** (customer) | Admin app | `app.forma.studio` |
| **Buyer** (manufacturer's customer) | Embedded configurator | iframe on `*.manufacturer.com` |

The split matters: **the manufacturer never sees the buyer's bare data
without auth; the buyer never sees Forma branding** (white-label embed).

## Non-negotiables

- **Monorepo** with `apps/web` (Next.js admin + marketing), `apps/embed`
  (vanilla TS bundle for embed.js), `packages/db`, `packages/configurator-engine`,
  `packages/ui` (shared React components).
- **Row-level security** on every customer-data table. A workspace cannot
  see another workspace's data, period. Tested in CI.
- **No Forma branding in the embed**. White-label on every paid plan.
- **Configurator definitions are immutable per version.** Publishing creates
  a new version; the embed always loads a pinned version.
- **All money in cents (integers)**. Currency is per-workspace.
- **All times in UTC.** Display in workspace timezone in the UI only.
- **GDPR**: every PII row has a `deleted_at` column; hard-delete script runs
  30 days later. Customer-facing data export endpoint must work.

## What "done" means for the MVP

A manufacturer can sign up, build a working pergola configurator, embed it
on a test page, receive a real submitted lead in their inbox with PDF + email +
webhook, view dashboard analytics, invite teammates, get billed by Stripe.
Everything else is v2.

Read `ROADMAP.md` for the phased acceptance criteria.
