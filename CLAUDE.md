# CLAUDE.md — Conventions for this repo

Read this before writing any code. These are not preferences, they are rules.

## Stack

- **Runtime**: Node 20 LTS, pnpm 9
- **Frontend**: Next.js 14 App Router (`apps/web`) + React 18 + TypeScript strict
- **Styling**: Tailwind v3 + CSS variables (see "Design tokens" below). NO CSS-in-JS.
- **Forms**: React Hook Form + Zod for validation
- **Server state**: TanStack Query
- **DB**: Postgres 16 (Supabase or Neon), Drizzle ORM
- **Auth**: Lucia v3 (email/password + Google OAuth + magic link). NOT NextAuth.
- **Background jobs**: Inngest (webhooks, email, PDF rendering)
- **File storage**: S3-compatible (R2 in prod, local in dev)
- **Payments**: Stripe (subscriptions + metered billing)
- **Email transactional**: Resend (with React Email templates)
- **PDF**: `@react-pdf/renderer`
- **Embed bundle**: Vite + vanilla TS, output a single `embed.js` < 30KB gzipped

## Code style

- TypeScript strict: no `any`, no `as unknown as X`, no `// @ts-ignore` without a paired `// FIXME(why):`
- Server Components by default. Add `"use client"` only when needed (interactivity, browser APIs).
- API routes live in `apps/web/app/api/**/route.ts`. They are thin: parse → validate (Zod) → call a service in `packages/services/*` → return.
- Business logic lives in `packages/services/*`, not in routes or components. Services receive a `ctx: { db, workspaceId, userId }` and return data or throw typed errors.
- Naming: `camelCase` for variables/functions, `PascalCase` for components/types, `snake_case` for DB columns (Drizzle handles the mapping).
- File names: `kebab-case` for everything except React components (`PascalCase.tsx`).

## Design tokens

Pull the visual language from `tokens.css` in the parent project. Recreate it
as Tailwind config + a `globals.css`. Required tokens:

```ts
// tailwind.config.ts (excerpt)
colors: {
  ink: '#0a0a0a', text: '#171717', 'text-2': '#525252', 'text-3': '#737373',
  muted: '#a3a3a3', line: '#ececec', 'line-2': '#e3e3e3', 'line-3': '#d4d4d4',
  surface: '#fafafa', 'surface-2': '#f5f5f5',
}
fontFamily: {
  sans: ['Geist', 'ui-sans-serif', 'system-ui'],
  mono: ['Geist Mono', 'ui-monospace', 'monospace'],
  serif: ['Instrument Serif', 'serif'],
}
```

- Hairline borders (`border-line`), small radii (3/6/10px), almost no shadows.
- Numerics use mono font + `tabular-nums`.
- The serif italic is used **only as accent** in marketing headlines.

## Component library

Build a shared `packages/ui` with these primitives, mirroring the ones in
`shared.jsx`:

- `<Btn variant="primary|secondary|ghost|invert" size="sm|md|lg" />`
- `<Badge kind="neutral|live|new|warn|off" size="sm|md" />`
- `<Avatar name|src size={...} />`
- `<Input label hint prefix suffix />` (uses RHF under the hood)
- `<Card pad={20} />`, `<Stat label value delta sparkData />`
- `<DataTable>` with sticky head, checkbox col, row actions
- `<Modal>`, `<SlideOver>`, `<CommandPalette>`
- `<Sidebar>`, `<TopBar>`, `<AppShell>` (admin only)

The marketing site and admin app share these.

## DO

- Treat the design canvas as the spec. If anything is ambiguous, **match what's on screen** before improvising.
- Write tests for the configurator engine (`packages/configurator-engine`) and pricing rules. Vitest, snapshot the rule evaluator output.
- Add `data-screen-label` to the top of each admin page (matches what's in the canvas) so future agents can find them.
- Keep the embed bundle dependency-free except for one tiny preact/htm if absolutely needed. **NO React in the embed.**
- Validate every external input with Zod. Reject early.
- Log structured JSON to stdout in prod. No `console.log("here")` ever — use `logger.debug({ leadId }, "received lead")`.

## DON'T

- **Don't reach for shadcn-ui.** We have a custom design system; shadcn's defaults will fight it. Lift component shapes from the canvas instead.
- **Don't use NextAuth.** Lucia is in the spec because we need workspace-scoped sessions and SSO later.
- **Don't put business logic in React Server Components.** RSC fetches data; services own logic.
- **Don't store money as `number`** — use `bigint` cents and a `Money({ amount, currency })` helper for display.
- **Don't put the embed on the same domain as the admin app.** Embed serves from `cdn.forma.studio`; admin from `app.forma.studio`. Different cookies, different CORS.
- **Don't trust workspace_id from the client.** Always derive it from the session.

## Folder layout

```
apps/
  web/                     # Next.js (marketing + admin)
    app/
      (marketing)/         # public site, no auth
        layout.tsx
        page.tsx           # landing
        pricing/
        ...
      (app)/               # authed admin
        layout.tsx         # AppShell with Sidebar+TopBar
        dashboard/
        configurators/[id]/{builder,preview,settings}/
        leads/{inbox,pipeline,[id]}/
        customers/
        analytics/
        embed/
        settings/{workspace,team,billing,notifications,security}/
      (auth)/
        sign-in/
        sign-up/
        onboarding/[step]/
      api/
        v1/                # public REST (versioned)
        internal/          # for embed.js (no public docs)
        webhooks/stripe/
  embed/                   # vanilla TS, builds to embed.js
    src/
      index.ts             # entry — installs the iframe
      iframe-app/          # the actual configurator UI inside the iframe
packages/
  db/                      # Drizzle schema + migrations
  configurator-engine/     # rule evaluator, pricing engine, validators
  ui/                      # shared React components
  services/                # business logic (leads, billing, configurators…)
  email/                   # React Email templates
  types/                   # shared TS types (incl. configurator JSON)
infra/
  docker-compose.yml       # local Postgres + S3 (minio)
```

## When you start a session

1. Read `BRIEF.md` (the parent doc).
2. Read the spec file relevant to what you're building.
3. Open the design canvas, find the screen, **screenshot it for yourself** if helpful.
4. Implement the smallest end-to-end vertical slice first (DB → service → API → page). Then iterate.
5. Run `pnpm test` and `pnpm typecheck` before claiming done.
