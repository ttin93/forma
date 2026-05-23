# API.md

All endpoints are versioned under `/v1`. Two surfaces:

- **`/api/v1/*`** — authed REST for the admin app + customers' own integrations
- **`/api/public/v1/*`** — unauthenticated, called by `embed.js` (CORS-allowed from any origin)
- **`/api/internal/v1/*`** — same host as the admin, called by background jobs

All responses: `Content-Type: application/json; charset=utf-8`.
All errors:
```jsonc
{ "error": { "code": "VALIDATION_FAILED", "message": "...", "fields": { "email": "Must be a valid email" } } }
```

## Authentication

Two methods:

### Session cookie (admin app)
`Cookie: forma_session=...` (Lucia-issued). Workspace is derived from
`sessions.active_workspace_id`. Can be switched with `POST /v1/me/active-workspace`.

### API key (customer integrations)
`Authorization: Bearer fk_live_…` Workspace and scopes derive from `api_keys`.

## Resources

### Workspaces

```
GET    /v1/workspaces                          # workspaces the user belongs to
POST   /v1/workspaces                          # create one (signup flow)
GET    /v1/workspaces/:id
PATCH  /v1/workspaces/:id
POST   /v1/workspaces/:id/invite               # { emails: string[], role: Role, message?: string }
```

### Configurators

```
GET    /v1/configurators                        # ?status=draft|live|archived
POST   /v1/configurators                        # { name, industry?, templateId? }
GET    /v1/configurators/:id                    # incl. live + draft version
PATCH  /v1/configurators/:id                    # name, status, slug
DELETE /v1/configurators/:id                    # archives; hard-delete via job

GET    /v1/configurators/:id/versions
POST   /v1/configurators/:id/versions           # { schema: ConfiguratorSchema }
                                                # creates a draft version
POST   /v1/configurators/:id/versions/:vid/publish
                                                # promotes draft → live_version_id
POST   /v1/configurators/:id/versions/:vid/rollback

GET    /v1/configurators/:id/domains
POST   /v1/configurators/:id/domains            # { host }
DELETE /v1/configurators/:id/domains/:host
POST   /v1/configurators/:id/domains/:host/verify
```

### Leads

```
GET    /v1/leads                                # ?status=&q=&configuratorId=&assigneeId=&from=&to=&page=&limit=
GET    /v1/leads/:id
PATCH  /v1/leads/:id                            # status, assignee_id, tags, score
POST   /v1/leads/:id/notes                      # { body }
POST   /v1/leads/:id/messages                   # { channel, to, subject, bodyHtml }
POST   /v1/leads/:id/resend-quote               # re-renders PDF + emails buyer
POST   /v1/leads/:id/duplicate
DELETE /v1/leads/:id                            # GDPR delete: anonymises immediately, hard-deletes after 30d
```

### Customers (aggregated buyers)

```
GET    /v1/customers
GET    /v1/customers/:id
POST   /v1/customers                            # manual add
PATCH  /v1/customers/:id
```

### Analytics

```
GET    /v1/analytics/overview?from=&to=         # KPI block: sessions, submissions, total_value, conv_rate
GET    /v1/analytics/funnel?configuratorId=&from=&to=
GET    /v1/analytics/series?metric=sessions&granularity=hour&from=&to=
GET    /v1/analytics/top-configurations?configuratorId=&from=&to=&limit=8
GET    /v1/analytics/heatmap?configuratorId=&xField=width&yField=depth
GET    /v1/analytics/geo?from=&to=
```

### Embed / API keys

```
GET    /v1/api-keys
POST   /v1/api-keys                             # { name, scopes }   →  { id, key (only once!) }
DELETE /v1/api-keys/:id

GET    /v1/webhooks
POST   /v1/webhooks                             # { url, events[] }
PATCH  /v1/webhooks/:id
DELETE /v1/webhooks/:id
GET    /v1/webhooks/:id/deliveries              # last 50, with retry status
POST   /v1/webhooks/:id/deliveries/:dlv/retry

GET    /v1/integrations
POST   /v1/integrations/:kind/connect           # OAuth handshake
DELETE /v1/integrations/:id
```

### Team & settings

```
GET    /v1/team/members
PATCH  /v1/team/members/:userId                 # role
DELETE /v1/team/members/:userId                 # remove from workspace
GET    /v1/team/routing-rules
POST   /v1/team/routing-rules
PATCH  /v1/team/routing-rules/:id               # incl. reorder via priority
DELETE /v1/team/routing-rules/:id

GET    /v1/billing/plan
GET    /v1/billing/usage
GET    /v1/billing/invoices
POST   /v1/billing/upgrade                      # { plan: 'growth'|'scale', interval: 'monthly'|'annual' }
POST   /v1/billing/portal                       # returns Stripe billing portal URL
POST   /v1/billing/cancel                       # { reason?, feedback? }
```

### Auth

```
POST   /v1/auth/sign-up                         # { email, password, name, workspaceName }
POST   /v1/auth/sign-in                         # { email, password }
POST   /v1/auth/sign-in/google                  # OAuth flow start
GET    /v1/auth/callback/google
POST   /v1/auth/magic-link                      # { email }
GET    /v1/auth/magic-link/verify?token=
POST   /v1/auth/sign-out
GET    /v1/me                                   # current user + active workspace
POST   /v1/me/active-workspace                  # { workspaceId }
```

## Public endpoints (called by embed.js)

```
GET    /public/v1/configurators/:slug?version=  # public schema + branding only
POST   /public/v1/configurators/:slug/submit    # see EMBED-PROTOCOL.md
GET    /public/v1/configurators/:slug/quote/:ref/pdf
                                                # public quote PDF (signed URL)
POST   /public/v1/track                         # batch analytics events
```

CORS for `/public/v1/*`:
- `Access-Control-Allow-Origin: *` (we only accept reads from any origin)
- POST endpoints validate `Origin` host is in `configurator_domains`

## Webhook payloads

`POST <webhook.url>` with:
```
Content-Type: application/json
X-Forma-Event: lead.created
X-Forma-Delivery: dlv_01H…
X-Forma-Timestamp: 1716412800
X-Forma-Signature: t=1716412800,v1=hmac_sha256(secret, "1716412800.<body>")
```

Events:
- `lead.created`
- `lead.status_changed`        (payload includes `from`, `to`)
- `lead.assigned`
- `lead.replied`
- `configurator.published`
- `subscription.upgraded` / `subscription.downgraded`

Each delivery is retried with exponential backoff: 1m, 5m, 30m, 2h, 12h
(5 attempts). Failed-after-all → `webhook_deliveries.delivered_at = null`,
shown in the Embed & API page (canvas: `EmbedPage` → "Webhooks" card).

## Pagination

```
?page=1&limit=50
→ { data: [...], page: 1, limit: 50, total: 1284 }
```
Max `limit` is 200.

## Rate limits

| Surface | Limit |
|---|---|
| `/v1/*` (session) | 600/min/user |
| `/v1/*` (API key) | 60/min/key (Starter), 600/min (Growth+) |
| `/public/v1/*/submit` | 1/min/IP, 10/hour/IP |
| `/public/v1/track` | 60/min/IP |

Headers on every response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
`X-RateLimit-Reset`.

## Idempotency

`POST` endpoints accept `Idempotency-Key: <uuid>`. Same key + same body
within 24h returns the original response. Different body = 409.

## OpenAPI

Generate `apps/web/openapi.yaml` from the Zod schemas via `zod-to-openapi`.
Publish a Stoplight Elements docs page at `forma.studio/docs/api`.
