# AUTH-MULTITENANT.md

Forma is multi-tenant. Workspaces never see each other's data, ever.

## Identity primitives

- **User** — a person, identified by email. One user can belong to many workspaces.
- **Workspace** — the unit of billing, branding, and data isolation. Contains configurators, leads, customers, etc.
- **Membership** — `(workspace_id, user_id, role)`. Role-based access.

## Auth provider

We use **Lucia v3**, not NextAuth. Reasons:
- Session-scoped extra data (`active_workspace_id`)
- Custom OAuth flows for SAML/SSO on Scale plan
- Plain Postgres adapter, no proprietary tables

## Sign-in methods (MVP)

1. Email + password (Argon2id-hashed)
2. Google OAuth
3. Magic link (Resend-delivered)

Future (Scale plan): SAML SSO via Boundary or in-house, OIDC.

## Sessions

```ts
type Session = {
  id: string;
  userId: string;
  activeWorkspaceId: string | null;  // user can switch between WS they're a member of
  expiresAt: Date;                   // 30 days, rolling
};
```

Cookie: `forma_session=<id>`, `HttpOnly`, `Secure`, `SameSite=Lax`,
`Domain=.forma.studio`.

## Switching workspaces

`POST /v1/me/active-workspace { workspaceId }` — server checks the user has
a membership in the workspace, updates `sessions.active_workspace_id`.
The admin app's sidebar workspace switcher (canvas: `Sidebar` top section)
calls this.

## Deriving `workspaceId` on the server

```ts
// packages/services/_ctx.ts
export async function ctxFromRequest(req: Request): Promise<Ctx> {
  const session = await lucia.validateSession(req);
  if (!session) throw new UnauthorisedError();
  const workspaceId = session.activeWorkspaceId;
  if (!workspaceId) throw new ForbiddenError('No active workspace');
  // Set the Postgres GUC so RLS policies activate.
  await db.execute(sql`select set_config('app.workspace_id', ${workspaceId}, true)`);
  return { db, userId: session.userId, workspaceId, session };
}
```

**Every route in `/api/v1/*` MUST start with `const ctx = await ctxFromRequest(req)`.**
Linter rule + CI test enforces this.

## Roles & permissions

| Role     | Build | Publish | Read leads | Reply | Billing | Team mgmt |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|
| owner    | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin    | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| editor   | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| sales    | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| viewer   | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |

Permissions live in `packages/services/auth/permissions.ts`:

```ts
export const can = {
  'configurator.publish': ['owner', 'admin', 'editor'],
  'lead.reply': ['owner', 'admin', 'editor', 'sales'],
  'billing.manage': ['owner', 'admin'],
  ...
};
```

Each service call asserts: `assertPermission(ctx, 'lead.reply')`.

## RLS (defense in depth)

See DATA-MODEL.md. Every workspace-scoped table has:

```sql
create policy ws_isolation on TABLE
  using (workspace_id = current_setting('app.workspace_id', true)::text);
```

The `app.workspace_id` setting is set per-request by `ctxFromRequest`. If
application code forgets to scope a query, RLS still blocks the read.

## Test for it

`packages/db/tests/rls.test.ts` exercises every workspace-scoped table:
1. Insert rows for workspace A and workspace B
2. Set `app.workspace_id = A`
3. Assert `SELECT *` returns only A's rows
4. Assert `UPDATE … WHERE id = B's row` affects 0 rows

This test must pass in CI.

## Service-account context (for jobs)

Inngest workers don't have a session. They derive `workspaceId` from the
event payload and call `ctxFromService(workspaceId)` instead. This skips
permission checks but still sets the RLS GUC.

```ts
export async function ctxFromService(workspaceId: string): Promise<ServiceCtx> {
  await db.execute(sql`select set_config('app.workspace_id', ${workspaceId}, true)`);
  return { db, workspaceId, userId: 'system' };
}
```

## Onboarding flow

1. `POST /v1/auth/sign-up` creates `users` row + a fresh `workspaces` row +
   `memberships(role=owner)` + sends email verification.
2. Onboarding wizard (canvas: `02 · Auth & onboarding` → `Onb1`, `Onb2`)
   collects:
   - industry → seeds `workspaces.industry` and a starter configurator from a template
   - branding → patches workspace
   - team → sends invite emails (creates `memberships` with `joined_at: null` until accepted)
3. Final step: shows the embed snippet.

## Invites

`POST /v1/workspaces/:id/invite` creates a `memberships` row with
`joined_at = null` and sends a magic-link email. Clicking the link:
- If the email matches an existing user → log them in + activate the membership.
- If not → opens the sign-up page with email pre-filled; on submit, membership activates.

## SSO (Scale plan only)

`integrations` row of kind `sso-saml` with the IdP metadata. Sign-in for
any user whose email matches the workspace's enforced domain (e.g.
`*@alpenwerk.at`) is routed to the IdP. Out of MVP scope; stub the page
in Settings → Security.

## Audit log

Every "important" action writes to `audit_log` (table not in DATA-MODEL.md
yet; add it in the v2 migration):

```sql
audit_log (
  id text primary key, workspace_id text not null,
  actor_user_id text, action text not null, target_kind text, target_id text,
  ip text, user_agent text, payload jsonb, created_at timestamptz default now()
)
```

Important actions: `configurator.published`, `member.invited`,
`member.role_changed`, `webhook.created`, `api_key.created`,
`subscription.*`, `lead.deleted`, `domain.added`.

Surface at Settings → Activity log.
