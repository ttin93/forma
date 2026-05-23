# EMBED-PROTOCOL.md

`embed.js` is the script the manufacturer pastes onto their site. It must be:

- **Tiny** (< 30KB gzipped, target 18KB)
- **Dependency-free** (no React on the host page)
- **Brand-invisible** (no Forma logo, no analytics beacons to anywhere not under our domain)
- **Resilient** (host page CSS must not break it)
- **Secure** (cannot exfiltrate workspace data to the host page)

It lives in `apps/embed/` and builds to a single `dist/embed.js` served from
`cdn.forma.studio`.

## What gets pasted on the host page

```html
<script async
  src="https://cdn.forma.studio/embed.js"
  data-config="cfg_01HXYZ..."
  data-host="sunpergola.si"></script>

<div id="forma-pergola-classic"></div>
```

The script:
1. Reads `data-config` (the configurator slug or id, must be public).
2. Verifies `window.location.host` matches one of the configurator's `configurator_domains`. If not, renders an error box and stops.
3. Creates an iframe pointing to `https://cdn.forma.studio/iframe/cfg_01HXYZ.../v/{liveVersionId}?host=…&parentOrigin=…`.
4. Inserts it into the **next sibling** `<div id="forma-…">`, or if missing, just after the script tag.
5. Sets initial iframe size to width:100%, height: 720px (configurable via `data-min-height`).
6. Starts the postMessage bridge.

## Why an iframe?

- **CSS isolation**: host page CSS won't bleed into the configurator.
- **JS isolation**: host page can't read configurator state or buyer PII.
- **Origin separation**: the iframe is on `cdn.forma.studio`, so its cookies/localStorage are scoped to us, not the host.
- **Trust boundary**: the host can't impersonate the buyer or tamper with submissions.

## postMessage protocol

Every message is `{ type: '__forma:…', payload, requestId? }`. The
`parentOrigin` query param ensures we only accept messages from the host
that loaded us, and only post messages to that origin.

### Iframe → host

| `type` | When | Payload |
|---|---|---|
| `__forma:ready`        | After bundle boots | `{ height: number }` |
| `__forma:resize`       | Content height changed | `{ height: number }` |
| `__forma:price`        | Pricing recalculated | `{ total: number, currency: string }` (no breakdown) |
| `__forma:step-changed` | Buyer navigated steps | `{ stepIndex: number, stepId: string }` |
| `__forma:submitted`    | Lead created successfully | `{ leadRef: string }` (no PII) |
| `__forma:exit`         | Buyer clicked "Save & exit" | `{ savedAt: string }` |
| `__forma:error`        | Recoverable error | `{ code: string, message: string }` |

### Host → iframe (optional, for advanced installs)

| `type` | Effect |
|---|---|
| `__forma:set-prefill`    | Pre-fill fields (e.g. from a CRM link). Payload: `{ values: Record<string, Value> }` |
| `__forma:set-locale`     | Switch language. Payload: `{ locale: 'sl-SI' \| 'en-US' \| ... }` |
| `__forma:reset`          | Reset to step 1 |
| `__forma:goto`           | Jump to step. Payload: `{ stepId: string }` |

The default snippet only listens to the iframe → host direction; advanced
manufacturers can opt in to host → iframe by adding `data-events="true"`.

## Bootstrap (inside the iframe)

The iframe app is also vanilla TS (built from the same monorepo). On boot
it:

1. Reads `?config=…&version=…` from URL.
2. Fetches `GET https://api.forma.studio/v1/public/configurators/:configSlug?version=…`:
   ```jsonc
   {
     "id": "cfg_01HXYZ...",
     "version": "v_01H...",
     "schema": { /* full ConfiguratorSchema, see CONFIGURATOR-SCHEMA.md */ },
     "branding": { "primary": "#0a0a0a", "logoUrl": null, "font": "Inter" }
   }
   ```
   This endpoint is **publicly cacheable** (Cache-Control: public, max-age=300, stale-while-revalidate=3600).

3. Renders the first step.
4. On every field change, runs `evaluate(schema, state)` (the same engine from `packages/configurator-engine`) and posts `__forma:price` upward.
5. Persists `state` to `sessionStorage` keyed by `configId` so refresh doesn't lose progress.

## Submission

When the buyer clicks "Get my quote" on the contact step:

```
POST https://api.forma.studio/v1/public/configurators/:configSlug/submit
Content-Type: application/json
Origin: https://cdn.forma.studio
Referer: https://sunpergola.si/...

{
  "version": "v_01H...",
  "state": { /* answers */ },
  "contact": { "name": "Lara Bregar", "email": "...", "phone": "...", "city": "...", "consent": true },
  "meta": { "host": "sunpergola.si", "path": "/garden", "referrer": "...", "utm": { ... } },
  "captcha": "<turnstile-token>",
  "sessionId": "<sessionStorage uuid>"
}
```

Server:
1. Validates Origin (must be on cdn.forma.studio).
2. Validates Turnstile token.
3. Re-runs `evaluate(schema, state)` server-side. **Trusts only the server-computed price**, not anything from the client.
4. Looks up routing rule → assignee.
5. Creates `leads` row + `lead_events('created')`.
6. Fires Inngest `lead.submitted` event → email + PDF + webhooks.
7. Returns `{ leadRef: "SP-2026-L2841", redirectUrl?: string }`.

## Anti-abuse

- Per-configurator rate limit: **10 submits/IP/hour, 1 submit/IP/min**.
- Per-configurator soft cap: **500 submits/configurator/day** (then we shadow-queue and Slack-ping ops).
- Turnstile (Cloudflare) on every submit.
- Honeypot field: `<input name="company_address_2" tabindex="-1" autocomplete="off">`. Non-empty = silently drop.
- Bayesian spam scoring on `contact.name + contact.notes`.

## Sizing & responsiveness

The iframe auto-resizes by sending `__forma:resize` whenever its
`document.body.scrollHeight` changes (ResizeObserver). The host listener
sets `iframe.style.height = payload.height + 'px'`.

Cap: never exceed `data-max-height` (default `none`). If the host page is
short, the embed gets a `height: 100vh` minimum.

## White-label specifics

- **No `Powered by Forma`** anywhere in the embed UI (it's in the admin app only).
- The iframe `<title>` is set to `${schema.name}` — never "Forma".
- Default font is whatever the host page sets via `data-inherit-font="true"` (parsed from the document's computed style). Otherwise schema.branding.font.

## Versioning & cache busting

- `embed.js` itself is fingerprinted: `https://cdn.forma.studio/embed-{hash}.js`. The script tag uses a stable `embed.js` alias served with `Cache-Control: max-age=600`; behind it sits a 302 to the fingerprinted file.
- Configurator JSON cached for 5 minutes. Publishing a new version invalidates the cache via Cloudflare Workers' KV purge.

## Testing the embed in isolation

`apps/embed/playground/index.html` renders a fake manufacturer page with
the snippet, so you can iterate without ngrok.

```bash
pnpm --filter embed dev      # vite dev server at localhost:4500
pnpm --filter embed test     # vitest + playwright
```
