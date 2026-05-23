# How to hand this off to Claude Code

You have two things to give Claude Code:

1. **The visual spec** — this whole project, especially `Forma — Full Application.html` and its supporting `.jsx` files.
2. **The technical spec** — everything in `claude-code-spec/`.

## Step-by-step instructions

### 1. Create a new project for the codebase

Don't build inside this design project. Make a fresh repo:

```bash
mkdir forma && cd forma
git init
```

### 2. Copy the spec folder into the new repo

Drop the entire `claude-code-spec/` folder at the root of the new repo:

```
forma/
  claude-code-spec/
    BRIEF.md
    CLAUDE.md
    ARCHITECTURE.md
    DATA-MODEL.md
    AUTH-MULTITENANT.md
    CONFIGURATOR-SCHEMA.md
    EMBED-PROTOCOL.md
    API.md
    INTEGRATIONS.md
    ROADMAP.md
```

Then **move/rename** `claude-code-spec/CLAUDE.md` to the repo root as just `CLAUDE.md`. Claude Code reads project-root `CLAUDE.md` automatically on every session.

```
forma/
  CLAUDE.md                        ← was claude-code-spec/CLAUDE.md
  claude-code-spec/                ← keep the rest here
    BRIEF.md
    ARCHITECTURE.md
    ...
```

### 3. Copy the design canvas too

Put a copy of the visuals next to the spec. Claude Code can open HTML files and read JSX.

```
forma/
  design/
    Forma — Full Application.html
    tokens.css
    shared.jsx
    marketing.jsx
    auth.jsx
    dashboard.jsx
    configurator.jsx
    leads.jsx
    embed-settings.jsx
    enduser.jsx
    modals.jsx
```

### 4. The first prompt to Claude Code

Open the repo in your terminal, run `claude`, and start with this:

> Read `CLAUDE.md` and `claude-code-spec/BRIEF.md` first. Then open
> `design/Forma — Full Application.html` in a browser so you understand
> the visual language. Don't start coding yet — give me a one-page
> summary of what you understood and ask me any blocking questions
> before we begin Phase 0 from `claude-code-spec/ROADMAP.md`.

This forces Claude Code to ground itself in the spec before generating code.

### 5. Then go phase by phase

Each phase in `ROADMAP.md` has acceptance criteria. After a phase:

> We just finished Phase 2 (Configurator engine). Show me:
> 1. The test report from `pnpm --filter configurator-engine test`
> 2. The fixture you used for pergola-classic.json
> 3. A diff of files changed
>
> Then we'll do Phase 3.

### 6. When stuck, point at the canvas

If Claude Code's UI doesn't match what you want:

> Open `design/Forma — Full Application.html` and look at the
> `ConfigBuilder` artboard (it's in section 04). The inspector panel on
> the right has tabs Field / Pricing / Validation / Logic. Yours is
> missing the Logic tab — add it back, matching the visual exactly.

Claude Code can read your JSX and HTML and lift exact values.

### 7. What NOT to ask Claude Code to do

- **Don't** ask it to "design a better dashboard" — the design is locked, it should implement.
- **Don't** ask for "more features" outside the spec — discuss with me (the design partner) first, then update the spec, then hand back to Claude Code.
- **Don't** ask it to deploy to production — you do that, after manual smoke tests.

## What I (this design tool) can do during the build

If you hit a screen the canvas doesn't cover, come back here:

- "Make me a screen for X (bulk import CSV, email template, error page, etc)"
- "Add a modal for Y"
- "Show me what the mobile version of Z would look like"

I'll add it to the canvas, then you screenshot/copy it into the same
`design/` folder in the build repo, and tell Claude Code to implement
based on the new file.

## Realistic outcome

With this spec + canvas + Claude Code:
- **Phase 0–2** (scaffold, auth, engine) → ~1 week
- **Phase 3–5** (embed + inbox + builder) → ~2 weeks
- **Phase 6–8** (analytics, billing, team) → ~1.5 weeks
- **Phase 9–10** (marketing, polish, go-live) → ~3 days

Total: **~5 weeks to a paid-customer-ready MVP**. Without specs this thorough, double or triple it.

## One more thing — keep CLAUDE.md updated

As you build, anything Claude Code keeps getting wrong (uses NextAuth
instead of Lucia, uses `any`, puts logic in components, etc.) → add a
line to `CLAUDE.md` under "DON'T". Claude Code re-reads it every session.
