# ROADMAP.md

Build order. Don't skip ahead. Each phase is shippable on its own.

## Phase 0 — Scaffold (½ day)

- [ ] Init pnpm monorepo: `apps/web`, `apps/embed`, `packages/db`, `packages/configurator-engine`, `packages/ui`, `packages/services`, `packages/email`, `packages/types`.
- [ ] Next.js 14 App Router, Tailwind with the token palette from `CLAUDE.md`.
- [ ] Drizzle + Postgres (docker-compose).
- [ ] Lucia auth scaffolded with email/password.
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint` in CI.
- [ ] One smoke test: `app.forma.studio/dashboard` renders for a logged-in user.

**Done when:** `pnpm dev` boots admin + embed + Postgres, you can register and see the empty dashboard.

---

## Phase 1 — Schema, auth, workspaces (2–3 days)

- [ ] Implement all DATA-MODEL.md tables that are workspace-scoped.
- [ ] RLS policies + the rls.test.ts test from AUTH-MULTITENANT.md.
- [ ] Sign-up + sign-in + sign-out (canvas: `AuthSignIn`, `AuthSignUp`).
- [ ] Workspace create on sign-up; switcher in sidebar.
- [ ] Onboarding wizard step 1 + step 2 (canvas: `Onb1`, `Onb2`).
- [ ] `/v1/me`, `/v1/workspaces`, `/v1/me/active-workspace`.
- [ ] AppShell with Sidebar+TopBar matching the canvas, all nav items present (most route to empty `Coming soon` pages).

**Done when:** A new user can sign up, land on a freshly-created workspace's empty dashboard with the right sidebar.

---

## Phase 2 — Configurator engine (3–4 days)

> This is the hardest part. Build it standalone and test the hell out of it before any UI.

- [ ] `packages/configurator-engine`:
  - Types from CONFIGURATOR-SCHEMA.md (ConfiguratorSchema, Field, Condition, PricingRule, Formula).
  - `evaluate(schema, state)` pure function.
  - 30+ snapshot tests covering: visibility logic, pricing math, scoring, VAT, multi-rule order.
  - Formula text parser + serialiser, round-trip-tested.
- [ ] Bundle the engine for the embed (vite, esm + cjs).
- [ ] One "fixture" configurator: pergola-classic.json (use the visuals from the canvas as the test scenario).

**Done when:** `evaluate(pergolaClassic, { width: 4.2, depth: 3.5, color: 'anthracite', led: true })` returns `total = €4,820` matching the canvas mock.

---

## Phase 3 — Embed runtime (3 days)

- [ ] `apps/embed/src/index.ts` — the host-side script:
  - Reads `data-config`, validates `data-host`, builds the iframe URL.
  - Auto-resize ResizeObserver bridge.
  - postMessage protocol from EMBED-PROTOCOL.md.
- [ ] Iframe app (vanilla TS in same monorepo):
  - Fetches public schema (`GET /public/v1/configurators/:slug`).
  - Renders steps in vanilla TS (no React). Reuse the visual look from canvas → `EndUser1`/`EndUser2`/`EndUser3`.
  - Calls `evaluate` on every change, posts `__forma:price`.
  - Submit path with Turnstile + honeypot.
- [ ] `apps/embed/playground/index.html` — a fake manufacturer page.
- [ ] `POST /public/v1/configurators/:slug/submit` server endpoint that re-runs `evaluate` and creates a lead.

**Done when:** Playground page loads pergola configurator, user can go through all steps, submit, and see a row in `leads` table with correct pricing breakdown.

---

## Phase 4 — Lead inbox + detail (2 days)

- [ ] Pages: Inbox (table), Pipeline (kanban), Lead detail. Match canvas pixel-by-pixel for desktop.
- [ ] `/v1/leads*` endpoints.
- [ ] Inngest job: `lead.submitted` → render PDF (`packages/email/templates/quote.tsx`) → upload to R2 → send `lead-buyer-ack` + `lead-owner-notify` emails.
- [ ] Lead score = sum of triggered `scoring` rules.

**Done when:** Submitting via embed playground triggers an email to the manufacturer's owner address with a PDF quote attached, and the lead appears in the inbox with the right score.

---

## Phase 5 — Configurator builder UI (4–5 days)

> The big one. Builds the schema visually.

- [ ] Configurators list page (canvas: `ConfigList`).
- [ ] Builder canvas (canvas: `ConfigBuilder`): three-pane layout, drag-reorder steps, inspector with field/pricing/validation/logic tabs.
- [ ] Pricing formula editor: text input with the parser from Phase 2, error highlighting.
- [ ] Preview pane (canvas: `ConfigPreview`): live render of the in-progress schema using the same iframe app from Phase 3, with a "session inspector" sidebar.
- [ ] Versioning: every "Publish" creates a `configurator_versions` row and flips `live_version_id`.
- [ ] Per-step preview device toggle (desktop/tablet/mobile).

**Done when:** A manufacturer can create a new configurator from blank, add 4–5 steps with sliders/swatches, set pricing rules, publish it, and embed it on the playground page.

---

## Phase 6 — Embed management & analytics (3 days)

- [ ] Embed page (canvas: `EmbedPage`): copy snippet, domains, webhooks, API keys, integrations grid.
- [ ] Domain verification: meta tag or DNS TXT.
- [ ] Webhook delivery system with Inngest retries.
- [ ] API key issue + revoke.
- [ ] Analytics events ingestion (`/public/v1/track`) — embed sends `view`, `step.shown`, `step.submitted`, `submitted`, `dropped`.
- [ ] Analytics pages (canvas: `Analytics`, `Dashboard`): build the SQL aggregations directly against `analytics_events` for MVP.

**Done when:** Embed has a working domains allowlist, a working Slack webhook delivers a lead notification, and the dashboard shows real numbers from real submissions.

---

## Phase 7 — Billing (2–3 days)

- [ ] Stripe Checkout flow for upgrade.
- [ ] Webhook handler (`/api/webhooks/stripe`) for all relevant events.
- [ ] Settings → Billing page (canvas: `SettingsBilling`).
- [ ] Usage counters job (hourly): count leads, configurators, seats; update `usage_counters`.
- [ ] Overage reporting job (hourly): if leads_count > plan_limit, report to Stripe metered price.
- [ ] Trial expiry job: warn 3d/1d before, then cancel + freeze configurators.

**Done when:** A workspace can upgrade from trial → Growth via Stripe Checkout, see the invoice in their list, and Stripe metered billing kicks in when they cross 500 leads.

---

## Phase 8 — Team, customers, settings polish (2 days)

- [ ] Team page (canvas: `SettingsTeam`): invite, change role, remove, lead routing rules.
- [ ] Customers page (canvas: `Customers`): aggregated view, drilldown to that customer's leads.
- [ ] Settings: workspace, branding, notifications, security, GDPR.
- [ ] All modals from canvas: `ModalDelete`, `ModalInvite`, `ModalShare`, `ModalUpgrade`, `ModalCmdK`, `ModalQuickLead`, `ModalFilter`, `ModalNotifs`, `ModalEmpty`.
- [ ] Command palette (⌘K) wired to search leads, configurators, settings actions.

**Done when:** A workspace owner can invite two teammates with different roles, set up routing rules so a hot lead goes to a specific person, and the new teammate sees the right lead in their queue.

---

## Phase 9 — Marketing site (1–2 days)

- [ ] Landing, Pricing pages from canvas (`MarkLanding`, `MarkPricing`).
- [ ] Docs index (route to Mintlify/Stoplight later).
- [ ] Customer story / case study templates.

**Done when:** `forma.studio` shows the marketing site, `Start trial` button goes to `/sign-up`.

---

## Phase 10 — Go-live checklist

- [ ] OG images for marketing, app routes
- [ ] Sitemap + robots.txt
- [ ] All env vars set in Vercel + Cloudflare
- [ ] Stripe products & prices live
- [ ] Resend domain verified, DKIM ok
- [ ] Cloudflare Turnstile site keys live
- [ ] RLS test passing
- [ ] Manual buyer-to-quote flow tested 5x with different configurations
- [ ] One real pilot customer onboarded end-to-end (you, with one fake pergola maker)
- [ ] Status page (stub at `status.forma.studio`)

## What's intentionally out of scope for v1

- SAML SSO (Scale plan gate, ship later)
- Multi-currency per workspace (single-currency only)
- A/B testing (mocked in UI, real engine v2)
- Mobile apps (everything responsive on web)
- White-label custom domains for the embed (use cdn.forma.studio everywhere)
- ClickHouse for analytics (Postgres aggregates are fine until 10k WS)
- Dealer / multi-brand workspaces (Scale feature, hide tab)

## Estimate (one experienced engineer, full-time)

| Phase | Days |
|---|---:|
| 0 — Scaffold | 0.5 |
| 1 — Schema/auth/WS | 3 |
| 2 — Engine | 4 |
| 3 — Embed | 3 |
| 4 — Inbox | 2 |
| 5 — Builder | 5 |
| 6 — Embed mgmt/analytics | 3 |
| 7 — Billing | 3 |
| 8 — Team/settings | 2 |
| 9 — Marketing | 2 |
| 10 — Go-live | 1 |
| **Total** | **~28 working days** |

Realistic with one engineer + Claude Code pair-programming: **5–6 weeks**
to a paid-customer-ready MVP. Without Claude Code: 10–12.
