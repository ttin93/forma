# CONFIGURATOR-SCHEMA.md

This is the core IP of Forma. Read it twice. The configurator engine
(`packages/configurator-engine`) lives and dies by this format.

## Top-level shape

```ts
// packages/types/configurator.ts
export interface ConfiguratorSchema {
  version: 1;                       // schema-spec version (not configurator version)
  id: string;                       // matches configurators.id
  name: string;
  currency: string;                 // 'EUR'
  locale: string;                   // 'sl-SI'
  steps: Step[];                    // ordered
  pricing: PricingRule[];           // applied after every input change
  scoring: ScoringRule[];           // applied at submit
  routing?: RoutingHints;           // optional, also enforced server-side
  branding?: Branding;              // overrides workspace-level brand
}

export interface Step {
  id: string;                       // 'dimensions'
  label: string;                    // 'Dimensions'
  description?: string;
  fields: Field[];
  visibleIf?: Condition;            // step-level conditional show
  layout?: 'split-preview' | 'single' | 'grid';
}
```

## Field types

All fields share a base:

```ts
interface FieldBase {
  id: string;                       // 'width' — referenced as $width in formulas
  type: FieldType;
  label: string;
  help?: string;
  required?: boolean;
  showInSummary?: boolean;          // default true
  affectsPrice?: boolean;           // default true
  visibleIf?: Condition;
  validateWith?: Condition;         // must evaluate true
}

type FieldType =
  | 'number-slider'
  | 'number-input'
  | 'text'
  | 'email'
  | 'phone'
  | 'select'
  | 'multi-select'
  | 'radio'
  | 'swatch'
  | 'checkbox'
  | 'quantity'
  | 'image-pick'
  | 'address'
  | 'date';
```

Per-type specifics:

```ts
type Field =
  | (FieldBase & { type: 'number-slider'; min: number; max: number; step: number; default: number; unit: string })
  | (FieldBase & { type: 'number-input';  min?: number; max?: number; step?: number; default?: number; unit?: string })
  | (FieldBase & { type: 'text';          maxLength?: number; default?: string })
  | (FieldBase & { type: 'email' })
  | (FieldBase & { type: 'phone'; defaultRegion?: string })
  | (FieldBase & { type: 'select';        options: Option[]; default?: string })
  | (FieldBase & { type: 'multi-select';  options: Option[]; default?: string[] })
  | (FieldBase & { type: 'radio';         options: Option[]; default?: string; columns?: number })
  | (FieldBase & { type: 'swatch';        options: SwatchOption[]; default?: string })
  | (FieldBase & { type: 'checkbox';      default?: boolean })
  | (FieldBase & { type: 'quantity';      min?: number; max?: number; default?: number })
  | (FieldBase & { type: 'image-pick';    options: ImageOption[]; default?: string })
  | (FieldBase & { type: 'address';       countries?: string[] })
  | (FieldBase & { type: 'date';          min?: string; max?: string });

interface Option { id: string; label: string; sublabel?: string; price?: PriceFragment }
interface SwatchOption extends Option { color: string }            // '#0a0a0a'
interface ImageOption extends Option { imageUrl: string }
```

## Conditions

A small algebra. Evaluated against the current `state: Record<fieldId, value>`.

```ts
type Condition =
  | { all: Condition[] }                              // AND
  | { any: Condition[] }                              // OR
  | { not: Condition }                                //
  | { eq: [Ref, Value] }                              // $width === 4.2
  | { neq: [Ref, Value] }
  | { gt: [Ref, number] } | { gte: [Ref, number] }
  | { lt: [Ref, number] } | { lte: [Ref, number] }
  | { in: [Ref, Value[]] }                            // $color in ['anthracite','black']
  | { matches: [Ref, string] };                       // regex on string

type Ref = `$${string}`;                              // '$width'
type Value = string | number | boolean;
```

## Pricing

Pricing is **declarative, not imperative**. We never evaluate user-supplied
JavaScript. Every rule is a `PricingRule` with a condition and an action.

```ts
type PricingRule =
  | { id: string; kind: 'base';      formula: Formula; label: string; visibleInBreakdown?: boolean }
  | { id: string; kind: 'add';       when: Condition; formula: Formula; label: string }
  | { id: string; kind: 'multiply';  when: Condition; factor: number; label: string }
  | { id: string; kind: 'discount';  when: Condition; formula: Formula; label: string }
  | { id: string; kind: 'vat';       rate: number; label: string };      // applied last

type Formula =
  | number                                            // 4704 (cents-or-currency-units; see "Units" below)
  | { ref: Ref }                                      // value of a field
  | { times: Formula[] }                              // $width * $depth * 320
  | { plus: Formula[] }
  | { minus: [Formula, Formula] }
  | { div: [Formula, Formula] }
  | { table: { lookup: Ref; cases: Array<[Value, Formula]>; default?: Formula } }
  | { area: { width: Ref; depth: Ref } }              // sugar: $w * $d
  | { perOption: { ref: Ref; prices: Record<string, number> } }; // per-option price map
```

### Units

- Formulas operate in **currency-major-units as numbers** (e.g. EUR `123.45`).
- The engine multiplies by 100 and rounds to integer **cents** at the end.
- Length fields use the field's `unit` (m, mm, cm). The engine never converts; the formula author writes the math in the same unit as the slider.

### Evaluation order

1. Apply all `base` rules → `subtotal_pre`
2. Apply `add` rules where `when` matches, sum → `additions`
3. Apply `multiply` rules where `when` matches, multiply through → `subtotal_post`
4. Apply `discount` rules where `when` matches, subtract → `subtotal_net`
5. Apply `vat` rate → `vat_amount`
6. `total = round(subtotal_net + vat_amount, 0_cents)`

Every triggered rule contributes one line to `pricing_breakdown` in
`leads.pricing_breakdown`. The buyer sees this list on the summary screen
(see `enduser.jsx` → `EndUser3`).

### Example — pergola classic

```jsonc
{
  "pricing": [
    { "id": "base-area", "kind": "base", "label": "Base · €320/m²",
      "formula": { "times": [{ "area": { "width": "$width", "depth": "$depth" } }, 320] } },

    { "id": "color", "kind": "add", "label": "Color",
      "when": { "neq": ["$color", "anthracite"] },
      "formula": { "perOption": { "ref": "$color", "prices": { "walnut": 280, "white": 0, "stone": 0 } } } },

    { "id": "reinforced-post", "kind": "add", "label": "Reinforced post (W ≥ 5m)",
      "when": { "gte": ["$width", 5] }, "formula": 280 },

    { "id": "led", "kind": "add", "label": "LED strip",
      "when": { "eq": ["$led", true] }, "formula": 140 },

    { "id": "heater", "kind": "add", "label": "Heater",
      "when": { "gt": ["$heaters", 0] },
      "formula": { "times": [{ "ref": "$heaters" }, 210] } },

    { "id": "promo", "kind": "discount", "label": "First-week buyer",
      "when": { "matches": ["$promo", "^FIRSTWK[0-9]+$"] }, "formula": 444 },

    { "id": "vat", "kind": "vat", "label": "VAT (22%)", "rate": 0.22 }
  ]
}
```

## Scoring (heat / qualification)

Same shape as pricing but additive on a 0–100 score:

```ts
type ScoringRule = { id: string; when: Condition; points: number; reason: string };
```

Score ≥ 70 → `hot = true`. The score and the contributing rules become
visible on the lead detail page (canvas: `Lead detail` → `Score` card).

## Routing

Routing rules in `routing_rules` table (see DATA-MODEL.md) are first-match.
The schema itself can declare *hints* (default assignee) but actual routing
is workspace-wide, not per-configurator.

## Engine API

```ts
// packages/configurator-engine
export function evaluate(
  schema: ConfiguratorSchema,
  state: Record<string, unknown>
): {
  visibleSteps: Step[];
  visibleFields: Record<string, Field[]>;          // by stepId
  errors: Record<string, string>;                  // by fieldId
  pricing: {
    breakdown: Array<{ ruleId: string; label: string; amount: number; kind: PricingRule['kind'] }>;
    subtotal: number;     // cents
    vat: number;          // cents
    total: number;        // cents
    currency: string;
  };
  score: { total: number; hot: boolean; reasons: Array<{ ruleId: string; points: number; reason: string }> };
};
```

The engine is **pure and deterministic**. Same `(schema, state)` → same
output. **Heavily snapshot-tested.**

## Builder UI ↔ schema mapping

The visual builder (canvas: `04 · Configurators — ConfigBuilder`) is a
WYSIWYG editor over this JSON. Drag a step = push to `schema.steps`.
Edit pricing in the inspector = push to `schema.pricing`. The inspector's
"Pricing formula" text box (canvas shows it with `$width * $depth * 320`)
must compile down to the `Formula` AST above. Provide a tiny parser:

```
EXPR    := SUM
SUM     := PRODUCT (('+'|'-') PRODUCT)*
PRODUCT := UNARY (('*'|'/') UNARY)*
UNARY   := '-'? PRIMARY
PRIMARY := NUMBER | REF | '(' EXPR ')' | FUNC
REF     := '$' IDENT
FUNC    := IDENT '(' (EXPR (',' EXPR)*)? ')'    // area($w, $d), table(...), perOption(...)
```

Round-trip: parse text → `Formula` AST → serialise back to canonical text.
If round-trip fails, the inspector shows a parse error inline.

## Versioning rules

- Publishing creates a **new** `configurator_versions` row, schema frozen.
- Edits to a published version create a **draft** copy with `status = 'draft'`.
- The embed always loads `configurators.live_version_id`.
- A "Rollback to v3.7" creates a new version copying v3.7's schema.

## What NOT to put in the schema

- No user-supplied JavaScript. Ever.
- No CSS / HTML overrides. Branding goes through `branding: Branding`.
- No outbound HTTP. The engine is pure.
- No PII. The schema is shared publicly via `embed.js`; PII is in submissions.
