// ─── Refs & Values ───────────────────────────────────────────
export type Ref = `$${string}`;
export type Value = string | number | boolean;

// ─── Conditions ──────────────────────────────────────────────
export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { eq: [Ref, Value] }
  | { neq: [Ref, Value] }
  | { gt: [Ref, number] }
  | { gte: [Ref, number] }
  | { lt: [Ref, number] }
  | { lte: [Ref, number] }
  | { in: [Ref, Value[]] }
  | { matches: [Ref, string] };

// ─── Formulas ────────────────────────────────────────────────
export type Formula =
  | number
  | { ref: Ref }
  | { times: Formula[] }
  | { plus: Formula[] }
  | { minus: [Formula, Formula] }
  | { div: [Formula, Formula] }
  | { table: { lookup: Ref; cases: Array<[Value, Formula]>; default?: Formula } }
  | { area: { width: Ref; depth: Ref } }
  | { perOption: { ref: Ref; prices: Record<string, number> } };

// ─── Pricing ─────────────────────────────────────────────────
export type PricingRule =
  | { id: string; kind: 'base'; formula: Formula; label: string; visibleInBreakdown?: boolean }
  | { id: string; kind: 'add'; when: Condition; formula: Formula; label: string }
  | { id: string; kind: 'multiply'; when: Condition; factor: number; label: string }
  | { id: string; kind: 'discount'; when: Condition; formula: Formula; label: string }
  | { id: string; kind: 'vat'; rate: number; label: string };

// ─── Scoring ─────────────────────────────────────────────────
export interface ScoringRule {
  id: string;
  when: Condition;
  points: number;
  reason: string;
}

// ─── Options ─────────────────────────────────────────────────
export interface PriceFragment {
  amount: number;
  currency: string;
}

export interface Option {
  id: string;
  label: string;
  sublabel?: string;
  price?: PriceFragment;
}

export interface SwatchOption extends Option {
  color: string;
}

export interface ImageOption extends Option {
  imageUrl: string;
}

// ─── Fields ──────────────────────────────────────────────────
export type FieldType =
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

export interface FieldBase {
  id: string;
  type: FieldType;
  label: string;
  help?: string;
  required?: boolean;
  showInSummary?: boolean;
  affectsPrice?: boolean;
  visibleIf?: Condition;
  validateWith?: Condition;
}

export type Field =
  | (FieldBase & { type: 'number-slider'; min: number; max: number; step: number; default: number; unit: string })
  | (FieldBase & { type: 'number-input'; min?: number; max?: number; step?: number; default?: number; unit?: string })
  | (FieldBase & { type: 'text'; maxLength?: number; default?: string })
  | (FieldBase & { type: 'email' })
  | (FieldBase & { type: 'phone'; defaultRegion?: string })
  | (FieldBase & { type: 'select'; options: Option[]; default?: string })
  | (FieldBase & { type: 'multi-select'; options: Option[]; default?: string[] })
  | (FieldBase & { type: 'radio'; options: Option[]; default?: string; columns?: number })
  | (FieldBase & { type: 'swatch'; options: SwatchOption[]; default?: string })
  | (FieldBase & { type: 'checkbox'; default?: boolean })
  | (FieldBase & { type: 'quantity'; min?: number; max?: number; default?: number })
  | (FieldBase & { type: 'image-pick'; options: ImageOption[]; default?: string })
  | (FieldBase & { type: 'address'; countries?: string[] })
  | (FieldBase & { type: 'date'; min?: string; max?: string });

// ─── Steps ───────────────────────────────────────────────────
export interface Step {
  id: string;
  label: string;
  description?: string;
  fields: Field[];
  visibleIf?: Condition;
  layout?: 'split-preview' | 'single' | 'grid';
}

// ─── Branding ────────────────────────────────────────────────
export interface Branding {
  primaryColor?: string;
  logoUrl?: string;
  fontFamily?: string;
}

// ─── Routing ─────────────────────────────────────────────────
export interface RoutingHints {
  defaultAssigneeId?: string;
}

// ─── Pergola Settings ─────────────────────────────────────────
export interface PergolaEncType {
  enabled: boolean;
  priceBase: number;
  pricePerM: number;
}

export interface PergolaAddonItem {
  id: string;
  title: string;
  description: string;
  unit: string;
  pricePerUnit: number;
  minQty: number;
  maxQty: number;
}

export interface PergolaColorCat {
  enabled: boolean;
  surcharge: number;
}

export interface PergolaSettings {
  basePrice: number;
  baseSqm: number;
  pricePerSqm: number;
  slats: { enabled: boolean };
  dims: { enabled: boolean; minW: number; maxW: number; minD: number; maxD: number };
  walls: { enabled: boolean; discountPerWall: number };
  posts: { enabled: boolean; maxPerSide: number; pricePerPost: number };
  colors: {
    enabled: boolean;
    standard: PergolaColorCat;
    ral: PergolaColorCat;
    wood: PergolaColorCat;
    special: PergolaColorCat;
  };
  enclosures: {
    enabled: boolean;
    zipScreen: PergolaEncType;
    movableSlats: PergolaEncType;
    slidingGlass: PergolaEncType;
    fixedGlass: PergolaEncType;
    ventPanel: PergolaEncType;
    metalPanel: PergolaEncType;
  };
  lights: {
    enabled: boolean;
    ledEdge: { enabled: boolean; pricePerM: number };
    ledStructure: { enabled: boolean; price: number };
  };
  electrical: {
    enabled: boolean;
    nello: { enabled: boolean; price: number };
    somfy: { enabled: boolean; price: number };
  };
  addons: {
    enabled: boolean;
    items: PergolaAddonItem[];
  };
}

// ─── Root Schema ─────────────────────────────────────────────
export interface ConfiguratorSchema {
  version: 1;
  id: string;
  name: string;
  currency: string;
  locale: string;
  steps: Step[];
  pricing: PricingRule[];
  scoring: ScoringRule[];
  routing?: RoutingHints;
  branding?: Branding;
  pergolaSettings?: PergolaSettings;
}

// ─── Engine Output ───────────────────────────────────────────
export interface PricingBreakdownItem {
  ruleId: string;
  label: string;
  amount: number;
  kind: PricingRule['kind'];
}

export interface EvaluateResult {
  visibleSteps: Step[];
  visibleFields: Record<string, Field[]>;
  errors: Record<string, string>;
  pricing: {
    breakdown: PricingBreakdownItem[];
    subtotal: number;
    vat: number;
    total: number;
    currency: string;
  };
  score: {
    total: number;
    hot: boolean;
    reasons: Array<{ ruleId: string; points: number; reason: string }>;
  };
}
