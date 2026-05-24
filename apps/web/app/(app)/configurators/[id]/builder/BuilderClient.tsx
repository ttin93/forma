'use client';

import { useCallback, useReducer, useState } from 'react';
import { Badge, Btn, Card, Icons } from '@/components/ui';
import type {
  ConfiguratorSchema, Step, Field, FieldType,
  PricingRule, ScoringRule, Condition, Formula, Option, SwatchOption,
  PergolaSettings, PergolaAddonItem, PergolaEncType,
} from '@forma/types';

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'fields' | 'pricing' | 'scoring' | 'json' | 'pergola';

interface BuilderState {
  schema: ConfiguratorSchema;
  name: string;
  selectedStepIdx: number;
  selectedFieldId: string | null;
  tab: Tab;
  dirty: boolean;
  saving: boolean;
  publishing: boolean;
  saveError: string | null;
}

type Action =
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'SELECT_STEP'; idx: number }
  | { type: 'SELECT_FIELD'; id: string | null }
  | { type: 'ADD_STEP' }
  | { type: 'DELETE_STEP'; idx: number }
  | { type: 'UPDATE_STEP'; idx: number; patch: Partial<Step> }
  | { type: 'MOVE_STEP'; idx: number; dir: -1 | 1 }
  | { type: 'ADD_FIELD'; stepIdx: number; fieldType: FieldType }
  | { type: 'DELETE_FIELD'; stepIdx: number; fieldId: string }
  | { type: 'UPDATE_FIELD'; stepIdx: number; fieldId: string; patch: Partial<Field> }
  | { type: 'MOVE_FIELD'; stepIdx: number; fieldId: string; dir: -1 | 1 }
  | { type: 'ADD_PRICING_RULE'; kind: PricingRule['kind'] }
  | { type: 'DELETE_PRICING_RULE'; id: string }
  | { type: 'UPDATE_PRICING_RULE'; id: string; patch: Partial<PricingRule> }
  | { type: 'ADD_SCORING_RULE' }
  | { type: 'DELETE_SCORING_RULE'; id: string }
  | { type: 'UPDATE_SCORING_RULE'; id: string; patch: Partial<ScoringRule> }
  | { type: 'SET_JSON'; raw: string }
  | { type: 'SET_PERGOLA'; settings: PergolaSettings }
  | { type: 'REPLACE_STEPS'; steps: Step[] }
  | { type: 'REPLACE_PRICING'; rules: PricingRule[] }
  | { type: 'SET_SAVING'; value: boolean }
  | { type: 'SET_PUBLISHING'; value: boolean }
  | { type: 'SAVED' }
  | { type: 'SAVE_ERROR'; message: string };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function labelToId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || uid();
}

function defaultField(type: FieldType, id: string, label: string): Field {
  const base = { id, label, required: false };
  switch (type) {
    case 'number-slider': return { ...base, type, min: 0, max: 100, step: 1, default: 10, unit: 'm' };
    case 'number-input':  return { ...base, type, default: 0 };
    case 'select':        return { ...base, type, options: [] };
    case 'multi-select':  return { ...base, type, options: [] };
    case 'radio':         return { ...base, type, options: [] };
    case 'swatch':        return { ...base, type, options: [] };
    case 'image-pick':    return { ...base, type, options: [] };
    case 'checkbox':      return { ...base, type, default: false };
    case 'quantity':      return { ...base, type, min: 0, max: 100, default: 1 };
    default:              return { ...base, type } as Field;
  }
}

function reducer(state: BuilderState, action: Action): BuilderState {
  const dirty = (s: BuilderState): BuilderState => ({ ...s, dirty: true, saveError: null });

  switch (action.type) {
    case 'SET_NAME':
      return dirty({ ...state, name: action.name });

    case 'SET_TAB':
      return { ...state, tab: action.tab, selectedFieldId: null };

    case 'SELECT_STEP':
      return { ...state, selectedStepIdx: action.idx, selectedFieldId: null };

    case 'SELECT_FIELD':
      return { ...state, selectedFieldId: action.id };

    case 'ADD_STEP': {
      const n = state.schema.steps.length + 1;
      const newStep: Step = { id: `step-${uid()}`, label: `Step ${n}`, fields: [] };
      const steps = [...state.schema.steps, newStep];
      return dirty({ ...state, schema: { ...state.schema, steps }, selectedStepIdx: steps.length - 1, selectedFieldId: null });
    }

    case 'DELETE_STEP': {
      const steps = state.schema.steps.filter((_, i) => i !== action.idx);
      const idx = Math.min(state.selectedStepIdx, Math.max(0, steps.length - 1));
      return dirty({ ...state, schema: { ...state.schema, steps }, selectedStepIdx: idx, selectedFieldId: null });
    }

    case 'UPDATE_STEP': {
      const steps = state.schema.steps.map((s, i) =>
        i === action.idx ? { ...s, ...action.patch } : s
      );
      return dirty({ ...state, schema: { ...state.schema, steps } });
    }

    case 'MOVE_STEP': {
      const steps = [...state.schema.steps];
      const j = action.idx + action.dir;
      if (j < 0 || j >= steps.length) return state;
      [steps[action.idx], steps[j]] = [steps[j], steps[action.idx]];
      return dirty({ ...state, schema: { ...state.schema, steps }, selectedStepIdx: j });
    }

    case 'ADD_FIELD': {
      const id = uid();
      const field = defaultField(action.fieldType, id, `New ${action.fieldType}`);
      const steps = state.schema.steps.map((s, i) =>
        i === action.stepIdx ? { ...s, fields: [...s.fields, field] } : s
      );
      return dirty({ ...state, schema: { ...state.schema, steps }, selectedFieldId: field.id });
    }

    case 'DELETE_FIELD': {
      const steps = state.schema.steps.map((s, i) =>
        i === action.stepIdx ? { ...s, fields: s.fields.filter(f => f.id !== action.fieldId) } : s
      );
      return dirty({ ...state, schema: { ...state.schema, steps }, selectedFieldId: null });
    }

    case 'UPDATE_FIELD': {
      const steps = state.schema.steps.map((s, i) =>
        i === action.stepIdx
          ? { ...s, fields: s.fields.map(f => f.id === action.fieldId ? { ...f, ...action.patch } as Field : f) }
          : s
      );
      return dirty({ ...state, schema: { ...state.schema, steps } });
    }

    case 'MOVE_FIELD': {
      const step = state.schema.steps[action.stepIdx];
      const idx = step.fields.findIndex(f => f.id === action.fieldId);
      const j = idx + action.dir;
      if (j < 0 || j >= step.fields.length) return state;
      const fields = [...step.fields];
      [fields[idx], fields[j]] = [fields[j], fields[idx]];
      const steps = state.schema.steps.map((s, i) => i === action.stepIdx ? { ...s, fields } : s);
      return dirty({ ...state, schema: { ...state.schema, steps } });
    }

    case 'ADD_PRICING_RULE': {
      const id = uid();
      let rule: PricingRule;
      switch (action.kind) {
        case 'base':     rule = { id, kind: 'base', formula: 0, label: 'Base price' }; break;
        case 'add':      rule = { id, kind: 'add', when: { eq: ['$field', 'value'] }, formula: 0, label: 'Add-on' }; break;
        case 'multiply': rule = { id, kind: 'multiply', when: { eq: ['$field', 'value'] }, factor: 1, label: 'Multiplier' }; break;
        case 'discount': rule = { id, kind: 'discount', when: { eq: ['$field', 'value'] }, formula: 0, label: 'Discount' }; break;
        case 'vat':      rule = { id, kind: 'vat', rate: 0.22, label: 'VAT (22%)' }; break;
        default:         return state;
      }
      return dirty({ ...state, schema: { ...state.schema, pricing: [...state.schema.pricing, rule] } });
    }

    case 'DELETE_PRICING_RULE':
      return dirty({ ...state, schema: { ...state.schema, pricing: state.schema.pricing.filter(r => r.id !== action.id) } });

    case 'UPDATE_PRICING_RULE': {
      const pricing = state.schema.pricing.map(r =>
        r.id === action.id ? { ...r, ...action.patch } as PricingRule : r
      );
      return dirty({ ...state, schema: { ...state.schema, pricing } });
    }

    case 'ADD_SCORING_RULE': {
      const rule: ScoringRule = { id: uid(), when: { neq: ['$field', ''] }, points: 10, reason: 'Has field' };
      return dirty({ ...state, schema: { ...state.schema, scoring: [...state.schema.scoring, rule] } });
    }

    case 'DELETE_SCORING_RULE':
      return dirty({ ...state, schema: { ...state.schema, scoring: state.schema.scoring.filter(r => r.id !== action.id) } });

    case 'UPDATE_SCORING_RULE': {
      const scoring = state.schema.scoring.map(r =>
        r.id === action.id ? { ...r, ...action.patch } as ScoringRule : r
      );
      return dirty({ ...state, schema: { ...state.schema, scoring } });
    }

    case 'SET_JSON': {
      try {
        const schema = JSON.parse(action.raw) as ConfiguratorSchema;
        return { ...state, schema, dirty: true, saveError: null };
      } catch {
        return state;
      }
    }

    case 'REPLACE_STEPS':
      return dirty({ ...state, schema: { ...state.schema, steps: action.steps }, selectedStepIdx: 0, selectedFieldId: null });
    case 'REPLACE_PRICING':
      return dirty({ ...state, schema: { ...state.schema, pricing: action.rules } });
    case 'SET_PERGOLA':   return dirty({ ...state, schema: { ...state.schema, pergolaSettings: action.settings } });
    case 'SET_SAVING':    return { ...state, saving: action.value };
    case 'SET_PUBLISHING':return { ...state, publishing: action.value };
    case 'SAVED':         return { ...state, dirty: false, saving: false, saveError: null };
    case 'SAVE_ERROR':    return { ...state, saving: false, saveError: action.message };
    default:              return state;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

const S = {
  // layout
  fill:     { display: 'flex', flexDirection: 'column' as const, height: '100%', overflow: 'hidden' },
  row:      { display: 'flex', flex: 1, overflow: 'hidden' },
  col:      (w: number | string) => ({ width: w, flexShrink: 0, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', borderRight: '1px solid var(--color-line)' }),
  scroll:   { flex: 1, overflowY: 'auto' as const },
  // toolbar
  toolbar:  { height: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid var(--color-line)', background: '#fff', flexShrink: 0 },
  // section headers
  secHead:  { fontSize: 10.5, color: 'var(--color-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', fontWeight: 500, padding: '12px 14px 6px' },
  // clickable rows
  row1: (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer',
    background: active ? 'var(--color-surface-2)' : 'transparent',
    borderLeft: active ? '2px solid #0a0a0a' : '2px solid transparent',
    fontSize: 13, fontWeight: active ? 500 : 400, color: 'var(--color-text)',
  } as React.CSSProperties),
  // labels / inputs
  lbl:  { fontSize: 11.5, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 4, display: 'block' },
  inp:  { width: '100%', border: '1px solid var(--color-line-2)', borderRadius: 4, padding: '5px 9px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' as const },
  inpSm:{ border: '1px solid var(--color-line-2)', borderRadius: 4, padding: '4px 7px', fontSize: 12.5, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' as const },
  sel:  { width: '100%', border: '1px solid var(--color-line-2)', borderRadius: 4, padding: '5px 9px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' as const },
  frow: { marginBottom: 12 },
  // icon button
  iconBtn: { all: 'unset' as const, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, cursor: 'pointer', color: 'var(--color-text-3)' },
  // tag chip
  chip: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 3, padding: '1px 6px', color: 'var(--color-text-3)' },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function SRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={S.frow}>
      <label style={S.lbl}>{label}</label>
      {children}
    </div>
  );
}

function InlineText({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      style={S.inp}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function InlineNum({ value, onChange, min, max, step }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      style={{ ...S.inp, width: '100%' }}
      value={value}
      min={min}
      max={max}
      step={step ?? 1}
      onChange={e => onChange(Number(e.target.value))}
    />
  );
}

function ConditionEditor({ value, onChange, allFields }: {
  value: Condition | undefined;
  onChange: (c: Condition | undefined) => void;
  allFields: Field[];
}) {
  const raw = JSON.stringify(value ?? {}, null, 2);
  const [jsonMode, setJsonMode] = useState(false);

  // Try to detect "simple" condition
  const simple = value && 'eq' in value && Array.isArray((value as { eq: unknown[] }).eq)
    ? { op: 'eq', ref: ((value as { eq: [string, unknown] }).eq[0] as string).replace(/^\$/, ''), val: String((value as { eq: [string, unknown] }).eq[1]) }
    : value && 'neq' in value && Array.isArray((value as { neq: unknown[] }).neq)
    ? { op: 'neq', ref: ((value as { neq: [string, unknown] }).neq[0] as string).replace(/^\$/, ''), val: String((value as { neq: [string, unknown] }).neq[1]) }
    : value && 'gt' in value && Array.isArray((value as { gt: unknown[] }).gt)
    ? { op: 'gt', ref: ((value as { gt: [string, unknown] }).gt[0] as string).replace(/^\$/, ''), val: String((value as { gt: [string, unknown] }).gt[1]) }
    : null;

  if (jsonMode) {
    return (
      <div>
        <textarea
          style={{ ...S.inp, minHeight: 80, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
          defaultValue={raw}
          onBlur={e => {
            try { onChange(JSON.parse(e.target.value) as Condition); } catch { /* keep old */ }
          }}
        />
        <button style={{ ...S.iconBtn, fontSize: 11.5, marginTop: 4, color: 'var(--color-text-3)', width: 'auto', padding: '2px 6px' }} onClick={() => setJsonMode(false)}>simple mode</button>
      </div>
    );
  }

  const ops = [
    { value: 'always', label: 'Always' },
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'gt', label: 'Greater than' },
    { value: 'gte', label: 'Greater than or equal' },
  ];
  const currentOp = value === undefined ? 'always' : (simple?.op ?? 'custom');

  const buildCond = (op: string, ref: string, val: string): Condition => {
    const r = `$${ref}` as `$${string}`;
    const v: string | number = isNaN(Number(val)) ? val : Number(val);
    if (op === 'eq')  return { eq:  [r, v as string | number] };
    if (op === 'neq') return { neq: [r, v as string | number] };
    if (op === 'gt')  return { gt:  [r, v as number] };
    if (op === 'gte') return { gte: [r, v as number] };
    return { eq: [r, v as string | number] };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <select
          style={{ ...S.sel, flex: '0 0 auto', width: 'auto' }}
          value={currentOp === 'custom' ? 'eq' : currentOp}
          onChange={e => {
            if (e.target.value === 'always') { onChange(undefined); }
            else { onChange(buildCond(e.target.value, simple?.ref ?? 'field', simple?.val ?? '')); }
          }}
        >
          {ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {currentOp !== 'always' && (
          <>
            <select
              style={{ ...S.sel, flex: 1 }}
              value={simple?.ref ?? ''}
              onChange={e => onChange(buildCond(currentOp, e.target.value, simple?.val ?? ''))}
            >
              <option value="">— field —</option>
              {allFields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <input
              style={{ ...S.inpSm, flex: 1 }}
              value={simple?.val ?? ''}
              placeholder="value"
              onChange={e => onChange(buildCond(currentOp, simple?.ref ?? '', e.target.value))}
            />
          </>
        )}
      </div>
      <button style={{ ...S.iconBtn, fontSize: 11, width: 'auto', padding: '1px 5px', color: 'var(--color-muted)' }} onClick={() => setJsonMode(true)}>json editor</button>
    </div>
  );
}

function FormulaEditor({ value, onChange }: { value: Formula; onChange: (f: Formula) => void }) {
  const raw = JSON.stringify(value, null, 2);

  // Detect simple number
  if (typeof value === 'number') {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="number"
          style={{ ...S.inpSm, width: 100 }}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>€ fixed amount</span>
      </div>
    );
  }

  return (
    <div>
      <textarea
        style={{ ...S.inp, minHeight: 80, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}
        defaultValue={raw}
        onBlur={e => {
          try { onChange(JSON.parse(e.target.value) as Formula); } catch { /* keep old */ }
        }}
      />
      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
        Supported: number, {`{"ref":"$field"}`}, {`{"area":{"width":"$w","depth":"$d"}}`}, {`{"times":[...]}`}
      </div>
    </div>
  );
}

function OptionsEditor({ options, onChange }: {
  options: Option[] | SwatchOption[];
  onChange: (opts: Option[]) => void;
}) {
  const isSwatchLike = options.length > 0 && 'color' in options[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {options.map((opt, i) => (
        <div key={opt.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isSwatchLike && (
            <input type="color" value={(opt as SwatchOption).color ?? '#000000'}
              style={{ width: 28, height: 26, padding: 1, border: '1px solid var(--color-line)', borderRadius: 3, cursor: 'pointer' }}
              onChange={e => {
                const updated = [...options] as SwatchOption[];
                updated[i] = { ...updated[i] as SwatchOption, color: e.target.value };
                onChange(updated);
              }}
            />
          )}
          <input
            style={{ ...S.inpSm, flex: '0 0 80px', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}
            value={opt.id}
            placeholder="id"
            onChange={e => {
              const updated = [...options];
              updated[i] = { ...updated[i], id: e.target.value };
              onChange(updated);
            }}
          />
          <input
            style={{ ...S.inpSm, flex: 1 }}
            value={opt.label}
            placeholder="Label"
            onChange={e => {
              const updated = [...options];
              updated[i] = { ...updated[i], label: e.target.value };
              onChange(updated);
            }}
          />
          <button style={S.iconBtn} onClick={() => onChange(options.filter((_, j) => j !== i))} title="Remove">×</button>
        </div>
      ))}
      <button
        style={{ ...S.iconBtn, width: 'auto', padding: '3px 8px', fontSize: 12, color: 'var(--color-text-2)', border: '1px dashed var(--color-line)', borderRadius: 4 }}
        onClick={() => {
          const id = uid();
          const newOpt: Option | SwatchOption = isSwatchLike
            ? { id, label: 'Option', color: '#888888' }
            : { id, label: 'Option' };
          onChange([...options, newOpt]);
        }}
      >+ Option</button>
    </div>
  );
}

// ── Field property panel ───────────────────────────────────────────────────

function FieldPanel({ field, stepIdx, allFields, dispatch }: {
  field: Field;
  stepIdx: number;
  allFields: Field[];
  dispatch: React.Dispatch<Action>;
}) {
  const up = (patch: Partial<Field>) =>
    dispatch({ type: 'UPDATE_FIELD', stepIdx, fieldId: field.id, patch });

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={S.chip}>{field.type}</span>
        <button style={S.iconBtn} onClick={() => dispatch({ type: 'DELETE_FIELD', stepIdx, fieldId: field.id })} title="Delete field">
          {Icons.trash}
        </button>
      </div>

      <SRow label="Label">
        <InlineText value={field.label} onChange={v => up({ label: v })} />
      </SRow>

      <SRow label="Field ID">
        <input
          style={S.inp}
          value={field.id}
          onChange={e => up({ id: e.target.value })}
          placeholder="field_id"
        />
      </SRow>

      <div style={{ ...S.frow, display: 'flex', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={field.required ?? false} onChange={e => up({ required: e.target.checked })} />
          Required
        </label>
      </div>

      <SRow label="Help text">
        <InlineText value={field.help ?? ''} onChange={v => up({ help: v || undefined })} placeholder="Optional hint…" />
      </SRow>

      {/* Type-specific props */}
      {(field.type === 'number-slider') && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div><label style={S.lbl}>Min</label><InlineNum value={field.min} onChange={v => up({ min: v } as Partial<Field>)} /></div>
            <div><label style={S.lbl}>Max</label><InlineNum value={field.max} onChange={v => up({ max: v } as Partial<Field>)} /></div>
            <div><label style={S.lbl}>Step</label><InlineNum value={field.step} step={0.1} onChange={v => up({ step: v } as Partial<Field>)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div><label style={S.lbl}>Default</label><InlineNum value={field.default} step={0.1} onChange={v => up({ default: v } as Partial<Field>)} /></div>
            <div><label style={S.lbl}>Unit</label><InlineText value={field.unit} onChange={v => up({ unit: v } as Partial<Field>)} /></div>
          </div>
        </>
      )}

      {(field.type === 'number-input' || field.type === 'quantity') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div><label style={S.lbl}>Min</label><InlineNum value={field.min ?? 0} onChange={v => up({ min: v } as Partial<Field>)} /></div>
          <div><label style={S.lbl}>Max</label><InlineNum value={field.max ?? 100} onChange={v => up({ max: v } as Partial<Field>)} /></div>
          <div><label style={S.lbl}>Default</label><InlineNum value={field.default ?? 0} onChange={v => up({ default: v } as Partial<Field>)} /></div>
        </div>
      )}

      {field.type === 'checkbox' && (
        <SRow label="Default value">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={(field.default ?? false) as boolean} onChange={e => up({ default: e.target.checked } as Partial<Field>)} />
            Checked by default
          </label>
        </SRow>
      )}

      {(field.type === 'select' || field.type === 'radio' || field.type === 'multi-select') && (
        <SRow label="Options">
          <OptionsEditor
            options={field.options}
            onChange={opts => up({ options: opts } as Partial<Field>)}
          />
        </SRow>
      )}

      {field.type === 'swatch' && (
        <SRow label="Colour options">
          <OptionsEditor
            options={field.options as SwatchOption[]}
            onChange={opts => up({ options: opts } as Partial<Field>)}
          />
        </SRow>
      )}

      <SRow label="Visible when">
        <ConditionEditor
          value={field.visibleIf}
          onChange={c => up({ visibleIf: c })}
          allFields={allFields.filter(f => f.id !== field.id)}
        />
      </SRow>
    </div>
  );
}

// ── Pricing tab ────────────────────────────────────────────────────────────

function PricingTab({ rules, allFields, dispatch }: {
  rules: PricingRule[];
  allFields: Field[];
  dispatch: React.Dispatch<Action>;
}) {
  const kindOpts: PricingRule['kind'][] = ['base', 'add', 'multiply', 'discount', 'vat'];

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rules.map(rule => (
        <div key={rule.id} style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ ...S.chip, background: '#0a0a0a', color: '#fff', border: 'none' }}>{rule.kind}</span>
            <input
              style={{ ...S.inpSm, flex: 1 }}
              value={rule.label}
              onChange={e => dispatch({ type: 'UPDATE_PRICING_RULE', id: rule.id, patch: { label: e.target.value } as Partial<PricingRule> })}
              placeholder="Label"
            />
            <button style={S.iconBtn} onClick={() => dispatch({ type: 'DELETE_PRICING_RULE', id: rule.id })}>{Icons.trash}</button>
          </div>

          {rule.kind === 'vat' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={S.lbl}>Rate</label>
              <InlineNum
                value={rule.rate * 100}
                min={0} max={100} step={1}
                onChange={v => dispatch({ type: 'UPDATE_PRICING_RULE', id: rule.id, patch: { rate: v / 100 } as Partial<PricingRule> })}
              />
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>%</span>
            </div>
          )}

          {rule.kind === 'multiply' && (
            <>
              <div style={S.frow}>
                <label style={S.lbl}>Condition</label>
                <ConditionEditor
                  value={rule.when}
                  onChange={c => dispatch({ type: 'UPDATE_PRICING_RULE', id: rule.id, patch: { when: c } as Partial<PricingRule> })}
                  allFields={allFields}
                />
              </div>
              <div style={S.frow}>
                <label style={S.lbl}>Factor (e.g. 1.1 = +10%)</label>
                <InlineNum
                  value={rule.factor}
                  min={0} step={0.01}
                  onChange={v => dispatch({ type: 'UPDATE_PRICING_RULE', id: rule.id, patch: { factor: v } as Partial<PricingRule> })}
                />
              </div>
            </>
          )}

          {(rule.kind === 'base' || rule.kind === 'add' || rule.kind === 'discount') && (
            <>
              {(rule.kind === 'add' || rule.kind === 'discount') && (
                <div style={S.frow}>
                  <label style={S.lbl}>Condition</label>
                  <ConditionEditor
                    value={rule.when}
                    onChange={c => dispatch({ type: 'UPDATE_PRICING_RULE', id: rule.id, patch: { when: c } as Partial<PricingRule> })}
                    allFields={allFields}
                  />
                </div>
              )}
              <div style={S.frow}>
                <label style={S.lbl}>Formula</label>
                <FormulaEditor
                  value={rule.formula}
                  onChange={f => dispatch({ type: 'UPDATE_PRICING_RULE', id: rule.id, patch: { formula: f } as Partial<PricingRule> })}
                />
              </div>
            </>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
        {kindOpts.map(k => (
          <Btn key={k} variant="secondary" size="sm" onClick={() => dispatch({ type: 'ADD_PRICING_RULE', kind: k })}>
            + {k}
          </Btn>
        ))}
      </div>
    </div>
  );
}

// ── Scoring tab ────────────────────────────────────────────────────────────

function ScoringTab({ rules, allFields, dispatch }: {
  rules: ScoringRule[];
  allFields: Field[];
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rules.map(rule => (
        <div key={rule.id} style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>+{rule.points}pts</span>
            <input
              style={{ ...S.inpSm, flex: 1 }}
              value={rule.reason}
              placeholder="Reason"
              onChange={e => dispatch({ type: 'UPDATE_SCORING_RULE', id: rule.id, patch: { reason: e.target.value } })}
            />
            <InlineNum
              value={rule.points}
              min={0} max={100}
              onChange={v => dispatch({ type: 'UPDATE_SCORING_RULE', id: rule.id, patch: { points: v } })}
            />
            <button style={S.iconBtn} onClick={() => dispatch({ type: 'DELETE_SCORING_RULE', id: rule.id })}>{Icons.trash}</button>
          </div>
          <div>
            <label style={S.lbl}>Trigger when</label>
            <ConditionEditor
              value={rule.when}
              onChange={c => c && dispatch({ type: 'UPDATE_SCORING_RULE', id: rule.id, patch: { when: c } })}
              allFields={allFields}
            />
          </div>
        </div>
      ))}
      <Btn variant="secondary" size="sm" onClick={() => dispatch({ type: 'ADD_SCORING_RULE' })}>
        + Add scoring rule
      </Btn>
    </div>
  );
}

// ── Field type picker ──────────────────────────────────────────────────────

const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: 'number-slider', label: 'Slider' },
  { type: 'number-input',  label: 'Number' },
  { type: 'text',          label: 'Text' },
  { type: 'email',         label: 'Email' },
  { type: 'phone',         label: 'Phone' },
  { type: 'select',        label: 'Dropdown' },
  { type: 'radio',         label: 'Radio' },
  { type: 'multi-select',  label: 'Multi-select' },
  { type: 'swatch',        label: 'Colour swatch' },
  { type: 'checkbox',      label: 'Checkbox' },
  { type: 'quantity',      label: 'Quantity' },
  { type: 'image-pick',    label: 'Image pick' },
  { type: 'date',          label: 'Date' },
  { type: 'address',       label: 'Address' },
];

// ── Getting started guide ──────────────────────────────────────────────────

function GettingStarted({ onDismiss }: { onDismiss: () => void }) {
  const steps = [
    { n: '1', title: 'Add steps', desc: 'Steps = pages the customer fills out. E.g. "Model", "Dimensions", "Contact".' },
    { n: '2', title: 'Add fields to each step', desc: 'Sliders, dropdowns, radio buttons, swatches… Click a field to edit its options.' },
    { n: '3', title: 'Set up pricing rules', desc: 'Go to the Pricing tab. Add a base price, then conditional add-ons or multipliers.' },
    { n: '4', title: 'Preview & Publish', desc: 'Use the Preview tab to test the flow. Hit Publish to make it live.' },
  ];
  return (
    <div style={{ margin: '0 16px 12px', padding: '14px 16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-2)', position: 'relative' }}>
      <button onClick={onDismiss} style={{ position: 'absolute', top: 10, right: 10, all: 'unset', cursor: 'pointer', color: '#64748b', fontSize: 16, lineHeight: 1 }}>×</button>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#0369a1', marginBottom: 10 }}>Getting started</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#0369a1', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>{s.n}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0c4a6e' }}>{s.title}</div>
              <div style={{ fontSize: 11.5, color: '#0369a1', marginTop: 1 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Simplified mode helpers ────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  'number-slider': 'Drsnik', 'number-input': 'Številka', 'text': 'Besedilo',
  'email': 'E-pošta', 'phone': 'Telefon', 'select': 'Spustni seznam',
  'multi-select': 'Večkratna izbira', 'radio': 'Radio gumbi', 'swatch': 'Barve',
  'checkbox': 'Potrditveno polje', 'quantity': 'Količina',
  'image-pick': 'Izbira slike', 'date': 'Datum', 'address': 'Naslov',
};

function conditionToText(cond: Condition | undefined, allFields: Field[]): string {
  if (!cond) return 'vedno';
  const lookup = (ref: string) => allFields.find(f => f.id === ref.replace(/^\$/, ''))?.label ?? ref.replace(/^\$/, '');
  if ('eq' in cond)  { const [r, v] = (cond as { eq: [string, unknown] }).eq;  return `če ${lookup(r as string)} = ${v}`; }
  if ('neq' in cond) { const [r, v] = (cond as { neq: [string, unknown] }).neq; return `če ${lookup(r as string)} ≠ ${v}`; }
  if ('gt' in cond)  { const [r, v] = (cond as { gt: [string, unknown] }).gt;  return `če ${lookup(r as string)} > ${v}`; }
  if ('gte' in cond) { const [r, v] = (cond as { gte: [string, unknown] }).gte; return `če ${lookup(r as string)} ≥ ${v}`; }
  return 'posebni pogoj';
}

function formulaToText(formula: Formula): string {
  if (typeof formula === 'number') return `€${formula}`;
  if (typeof formula === 'object' && formula !== null) {
    if ('area' in formula) return '= površina × cena';
    if ('times' in formula) return '= izračun';
    if ('ref' in formula) return '= vrednost polja';
  }
  return '= formula';
}

// ── Simplified field card ──────────────────────────────────────────────────

function SimpleFieldCard({ field, stepIdx, dispatch }: {
  field: Field; stepIdx: number; dispatch: React.Dispatch<Action>;
}) {
  const up = (patch: Partial<Field>) => dispatch({ type: 'UPDATE_FIELD', stepIdx, fieldId: field.id, patch });
  const hasOpts = ['select', 'multi-select', 'radio', 'swatch', 'image-pick'].includes(field.type);
  const opts = hasOpts ? ((field as Field & { options: (Option | SwatchOption)[] }).options ?? []) : [];

  return (
    <div style={{ padding: '12px 14px', background: '#fff', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: (hasOpts || ['number-slider','number-input','quantity'].includes(field.type)) ? 10 : 0 }}>
        <span style={{ ...S.chip, background: 'var(--color-surface-2)', flexShrink: 0 }}>{FIELD_LABELS[field.type] ?? field.type}</span>
        <input
          value={field.label}
          onChange={e => up({ label: e.target.value })}
          style={{ flex: 1, fontSize: 14, fontWeight: 500, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit' }}
          placeholder="Ime polja…"
        />
        {field.required && <span style={{ fontSize: 10.5, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>*</span>}
        <button style={S.iconBtn} title="Izbriši" onClick={() => dispatch({ type: 'DELETE_FIELD', stepIdx, fieldId: field.id })}>{Icons.trash}</button>
      </div>

      {field.type === 'number-slider' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--color-text-3)' }}>
          <span>od</span>
          <input type="number" value={(field as Field & { min: number }).min} onChange={e => up({ min: Number(e.target.value) } as Partial<Field>)} style={{ ...S.inpSm, width: 60 }} />
          <span>do</span>
          <input type="number" value={(field as Field & { max: number }).max} onChange={e => up({ max: Number(e.target.value) } as Partial<Field>)} style={{ ...S.inpSm, width: 60 }} />
          <span>enota</span>
          <input value={(field as Field & { unit?: string }).unit ?? ''} onChange={e => up({ unit: e.target.value } as Partial<Field>)} style={{ ...S.inpSm, width: 44 }} placeholder="m" />
        </div>
      )}
      {(field.type === 'number-input' || field.type === 'quantity') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--color-text-3)' }}>
          <span>od</span>
          <input type="number" value={(field as Field & { min?: number }).min ?? 0} onChange={e => up({ min: Number(e.target.value) } as Partial<Field>)} style={{ ...S.inpSm, width: 60 }} />
          <span>do</span>
          <input type="number" value={(field as Field & { max?: number }).max ?? 100} onChange={e => up({ max: Number(e.target.value) } as Partial<Field>)} style={{ ...S.inpSm, width: 60 }} />
        </div>
      )}
      {hasOpts && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {opts.map((opt, i) => (
            <div key={opt.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 6px 3px 8px', background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 4 }}>
              {field.type === 'swatch' && (
                <span style={{ width: 10, height: 10, borderRadius: 2, background: (opt as SwatchOption).color ?? '#888', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 12 }}>{opt.label}</span>
              <button style={{ ...S.iconBtn, width: 14, height: 14 }} onClick={() => up({ options: opts.filter((_, j) => j !== i) } as Partial<Field>)}>×</button>
            </div>
          ))}
          <button
            style={{ padding: '3px 8px', border: '1px dashed var(--color-line-3)', borderRadius: 4, fontSize: 12, color: 'var(--color-text-3)', cursor: 'pointer', background: 'transparent' }}
            onClick={() => {
              const id = Math.random().toString(36).slice(2, 8);
              const nOpt = field.type === 'swatch' ? { id, label: 'Nova barva', color: '#888888' } : { id, label: 'Nova možnost' };
              up({ options: [...opts, nOpt] } as Partial<Field>);
            }}
          >+ Dodaj</button>
        </div>
      )}
      {['text', 'email', 'phone', 'address', 'date'].includes(field.type) && (
        <span style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>
          Stranka {field.type === 'email' ? 'vpiše e-pošto' : field.type === 'phone' ? 'vpiše telefon' : field.type === 'address' ? 'vpiše naslov' : field.type === 'date' ? 'izbere datum' : 'vpiše besedilo'}
        </span>
      )}
    </div>
  );
}

// ── Simplified step section ────────────────────────────────────────────────

function SimpleStepSection({ step, stepIdx, state, dispatch, isLast }: {
  step: Step; stepIdx: number; state: BuilderState; dispatch: React.Dispatch<Action>; isLast: boolean;
}) {
  const [showAddField, setShowAddField] = useState(false);
  return (
    <section style={{ marginTop: 36 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', flexShrink: 0 }}>
          {String(stepIdx + 1).padStart(2, '0')}
        </span>
        <input
          value={step.label}
          onChange={e => dispatch({ type: 'UPDATE_STEP', idx: stepIdx, patch: { label: e.target.value } })}
          style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.015em', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', flex: 1 }}
          placeholder="Ime koraka…"
        />
        <div style={{ display: 'flex', gap: 2 }}>
          {stepIdx > 0 && <button style={S.iconBtn} onClick={() => dispatch({ type: 'MOVE_STEP', idx: stepIdx, dir: -1 })} title="Gor">↑</button>}
          {!isLast && <button style={S.iconBtn} onClick={() => dispatch({ type: 'MOVE_STEP', idx: stepIdx, dir: 1 })} title="Dol">↓</button>}
          {state.schema.steps.length > 1 && <button style={{ ...S.iconBtn, color: 'var(--color-text-3)' }} onClick={() => dispatch({ type: 'DELETE_STEP', idx: stepIdx })} title="Izbriši">×</button>}
        </div>
      </div>
      <div style={{ marginLeft: 32 }}>
        {step.fields.length === 0 && !showAddField && (
          <div style={{ padding: '10px 0', fontSize: 13, color: 'var(--color-muted)', fontStyle: 'italic' }}>Brez polj — dodaj jih spodaj.</div>
        )}
        {step.fields.map(field => (
          <SimpleFieldCard key={field.id} field={field} stepIdx={stepIdx} dispatch={dispatch} />
        ))}
        {showAddField ? (
          <div style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', background: '#fff', padding: 14, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10, color: 'var(--color-text-2)' }}>Izberi tip polja</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {FIELD_TYPES.map(ft => (
                <button key={ft.type} style={{ padding: '7px 8px', border: '1px solid var(--color-line)', borderRadius: 4, fontSize: 12, cursor: 'pointer', background: '#fff', fontFamily: 'inherit', textAlign: 'left' as const }}
                  onClick={() => { dispatch({ type: 'ADD_FIELD', stepIdx, fieldType: ft.type }); setShowAddField(false); }}>
                  {ft.label}
                </button>
              ))}
            </div>
            <button style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-3)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowAddField(false)}>Prekliči</button>
          </div>
        ) : (
          <button onClick={() => setShowAddField(true)}
            style={{ fontSize: 13, color: 'var(--color-text-3)', background: 'none', border: '1px dashed var(--color-line-3)', borderRadius: 'var(--radius-2)', padding: '8px 14px', cursor: 'pointer', width: '100%', textAlign: 'left' as const }}>
            + Dodaj polje
          </button>
        )}
      </div>
    </section>
  );
}

// ── Simplified pricing section ─────────────────────────────────────────────

function SimplePricingSection({ rules, allFields, dispatch }: {
  rules: PricingRule[]; allFields: Field[]; dispatch: React.Dispatch<Action>;
}) {
  const kindOpts: PricingRule['kind'][] = ['base', 'add', 'multiply', 'discount', 'vat'];
  return (
    <section>
      <div style={{ marginLeft: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rules.length === 0 && (
          <div style={{ padding: '10px 0', fontSize: 13, color: 'var(--color-muted)', fontStyle: 'italic' }}>Brez cenovnih pravil — uporabi nastavitve zgoraj ali dodaj ročno.</div>
        )}
        {rules.map(rule => (
          <div key={rule.id} style={{ padding: '12px 14px', background: '#fff', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...S.chip, background: '#0a0a0a', color: '#fff', border: 'none', flexShrink: 0 }}>{rule.kind}</span>
            <div style={{ flex: 1, fontSize: 13.5 }}>
              {rule.kind === 'base' && (
                <span style={{ color: 'var(--color-text-2)' }}>
                  Osnovna cena:&nbsp;
                  <input type="number" style={{ ...S.inpSm, width: 80, display: 'inline-block' }}
                    value={typeof rule.formula === 'number' ? rule.formula : ''}
                    onChange={e => dispatch({ type: 'UPDATE_PRICING_RULE', id: rule.id, patch: { formula: Number(e.target.value) } as Partial<PricingRule> })} />
                  &nbsp;€
                </span>
              )}
              {rule.kind === 'vat' && (
                <span style={{ color: 'var(--color-text-2)' }}>
                  DDV:&nbsp;
                  <input type="number" style={{ ...S.inpSm, width: 56, display: 'inline-block' }}
                    value={Math.round(rule.rate * 100)}
                    onChange={e => dispatch({ type: 'UPDATE_PRICING_RULE', id: rule.id, patch: { rate: Number(e.target.value) / 100 } as Partial<PricingRule> })} />
                  &nbsp;%
                </span>
              )}
              {(rule.kind === 'add' || rule.kind === 'discount') && (
                <span>
                  <span style={{ color: 'var(--color-text-3)', fontSize: 12.5 }}>{conditionToText(rule.when, allFields)}</span>
                  {' → '}
                  <span style={{ fontWeight: 500 }}>{rule.kind === 'discount' ? '−' : '+'}{formulaToText(rule.formula)}</span>
                </span>
              )}
              {rule.kind === 'multiply' && (
                <span>
                  <span style={{ color: 'var(--color-text-3)', fontSize: 12.5 }}>{conditionToText(rule.when, allFields)}</span>
                  {' → ×'}<span style={{ fontWeight: 500 }}>{rule.factor}</span>
                </span>
              )}
            </div>
            <input value={rule.label} onChange={e => dispatch({ type: 'UPDATE_PRICING_RULE', id: rule.id, patch: { label: e.target.value } as Partial<PricingRule> })}
              placeholder="Oznaka…" style={{ ...S.inpSm, width: 120, fontSize: 11.5 }} />
            <button style={S.iconBtn} onClick={() => dispatch({ type: 'DELETE_PRICING_RULE', id: rule.id })}>{Icons.trash}</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 4 }}>
          {kindOpts.map(k => (
            <button key={k} onClick={() => dispatch({ type: 'ADD_PRICING_RULE', kind: k })}
              style={{ padding: '5px 12px', border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', fontSize: 12.5, cursor: 'pointer', background: '#fff', fontFamily: 'inherit', color: 'var(--color-text-2)' }}>
              + {k === 'base' ? 'Osnovna cena' : k === 'add' ? 'Doplačilo' : k === 'discount' ? 'Popust' : k === 'multiply' ? 'Množilnik' : 'DDV'}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pergola Tab ───────────────────────────────────────────────────────────

function defaultPS(): PergolaSettings {
  return {
    basePrice: 8200, baseSqm: 12.0, pricePerSqm: 420,
    slats: { enabled: true },
    dims: { enabled: true, minW: 2000, maxW: 8000, minD: 1500, maxD: 5000, minH: 200, maxH: 350 },
    walls: { enabled: true, discountPerWall: 60 },
    posts: { enabled: false, maxPerSide: 2, pricePerPost: 220 },
    colors: {
      enabled: true,
      standard: { enabled: true, surcharge: 0 },
      ral: { enabled: true, surcharge: 180 },
      wood: { enabled: true, surcharge: 340 },
      special: { enabled: false, surcharge: 580 },
    },
    enclosures: {
      enabled: true,
      zipScreen:    { enabled: true,  priceBase: 360, pricePerM: 82 },
      movableSlats: { enabled: true,  priceBase: 400, pricePerM: 98 },
      slidingGlass: { enabled: true,  priceBase: 620, pricePerM: 140 },
      fixedGlass:   { enabled: false, priceBase: 460, pricePerM: 108 },
      ventPanel:    { enabled: false, priceBase: 320, pricePerM: 68 },
      metalPanel:   { enabled: false, priceBase: 290, pricePerM: 60 },
    },
    lights: {
      enabled: true,
      ledEdge:      { enabled: true, pricePerM: 38 },
      ledStructure: { enabled: true, price: 420 },
    },
    electrical: {
      enabled: true,
      nello: { enabled: false, price: 320 },
      somfy: { enabled: true,  price: 520 },
    },
    addons: {
      enabled: true,
      items: [
        { id: 'heating', title: 'Infrardeči grelec',   description: 'Stropni IR grelec za pergolo', unit: 'kos', pricePerUnit: 980, minQty: 1, maxQty: 4 },
        { id: 'coating', title: 'Premium zaščitni premaz', description: 'Dodatna UV zaščita',       unit: 'kos', pricePerUnit: 210, minQty: 1, maxQty: 1 },
        { id: 'snow',    title: 'Snežna zaščita',      description: 'Ojačitev za sneg',             unit: 'kos', pricePerUnit: 380, minQty: 1, maxQty: 1 },
      ],
    },
  };
}

function PToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', flexShrink: 0, position: 'relative', transition: 'background .15s', background: checked ? '#0a0a0a' : '#d1d5db' }}
    >
      <div style={{ position: 'absolute', top: 3, left: checked ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
    </div>
  );
}

function PSH({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: enabled ? '#f0faf0' : 'var(--color-surface)', borderBottom: '1px solid var(--color-line)' }}>
      <PToggle checked={enabled} onChange={onToggle} />
      <span style={{ fontSize: 13, fontWeight: 600, color: enabled ? 'var(--color-ink)' : 'var(--color-muted)' }}>{label}</span>
    </div>
  );
}

function PergolaTab({ schema, dispatch }: { schema: ConfiguratorSchema; dispatch: React.Dispatch<Action> }) {
  const [ps, setPs] = useState<PergolaSettings>(() => (schema as ConfiguratorSchema & { pergolaSettings?: PergolaSettings }).pergolaSettings ?? defaultPS());

  const update = useCallback((updater: (prev: PergolaSettings) => PergolaSettings) => {
    setPs(prev => {
      const next = updater(prev);
      dispatch({ type: 'SET_PERGOLA', settings: next });
      return next;
    });
  }, [dispatch]);

  const set = useCallback((path: string[], value: unknown) => {
    update(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as Record<string, unknown>;
      let obj = copy;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]] as Record<string, unknown>;
      obj[path[path.length - 1]] = value;
      return copy as unknown as PergolaSettings;
    });
  }, [update]);

  const addAddon = () => update(prev => ({
    ...prev,
    addons: { ...prev.addons, items: [...prev.addons.items, { id: Math.random().toString(36).slice(2), title: 'Nova opcija', description: '', unit: 'kos', pricePerUnit: 0, minQty: 0, maxQty: 1 }] },
  }));
  const updAddon = (id: string, patch: Partial<PergolaAddonItem>) => update(prev => ({
    ...prev, addons: { ...prev.addons, items: prev.addons.items.map(a => a.id === id ? { ...a, ...patch } : a) },
  }));
  const delAddon = (id: string) => update(prev => ({
    ...prev, addons: { ...prev.addons, items: prev.addons.items.filter(a => a.id !== id) },
  }));

  const ENC_ROWS: [keyof Omit<typeof ps.enclosures, 'enabled'>, string][] = [
    ['zipScreen', 'ZIP Screen'], ['movableSlats', 'Premične lamele'], ['slidingGlass', 'Drsno steklo'],
    ['fixedGlass', 'Fiksno steklo'], ['ventPanel', 'Ventilacijski panel'], ['metalPanel', 'Kovinski panel'],
  ];

  return (
    <div style={{ ...S.scroll, padding: 0 }}>
      {/* Base pricing */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-line)' }}>
        <div style={S.secHead}>Osnovna cena</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <SRow label="Osnovna cena (€)"><InlineNum value={ps.basePrice} onChange={v => set(['basePrice'], v)} min={0} /></SRow>
          <SRow label="Osnova m² (m²)"><InlineNum value={ps.baseSqm} onChange={v => set(['baseSqm'], v)} min={0} step={0.1} /></SRow>
          <SRow label="€ / m² razlike"><InlineNum value={ps.pricePerSqm} onChange={v => set(['pricePerSqm'], v)} min={0} /></SRow>
        </div>
      </div>

      {/* 1 Slats */}
      <div style={{ borderBottom: '1px solid var(--color-line)' }}>
        <PSH label="1. Tip lamel" enabled={ps.slats.enabled} onToggle={v => set(['slats','enabled'], v)} />
      </div>

      {/* 2 Dims */}
      <div style={{ borderBottom: '1px solid var(--color-line)' }}>
        <PSH label="2. Dimenzije" enabled={ps.dims.enabled} onToggle={v => set(['dims','enabled'], v)} />
        {ps.dims.enabled && (
          <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <SRow label="Min. širina (mm)"><InlineNum value={ps.dims.minW} onChange={v => set(['dims','minW'], v)} min={500} /></SRow>
            <SRow label="Max. širina (mm)"><InlineNum value={ps.dims.maxW} onChange={v => set(['dims','maxW'], v)} max={15000} /></SRow>
            <SRow label="Min. globina (mm)"><InlineNum value={ps.dims.minD} onChange={v => set(['dims','minD'], v)} min={500} /></SRow>
            <SRow label="Max. globina (mm)"><InlineNum value={ps.dims.maxD} onChange={v => set(['dims','maxD'], v)} max={10000} /></SRow>
            <SRow label="Min. višina (cm)"><InlineNum value={ps.dims.minH ?? 200} onChange={v => set(['dims','minH'], v)} min={150} max={400} /></SRow>
            <SRow label="Max. višina (cm)"><InlineNum value={ps.dims.maxH ?? 350} onChange={v => set(['dims','maxH'], v)} min={150} max={500} /></SRow>
          </div>
        )}
      </div>

      {/* 3 Walls */}
      <div style={{ borderBottom: '1px solid var(--color-line)' }}>
        <PSH label="3. Stene hiše" enabled={ps.walls.enabled} onToggle={v => set(['walls','enabled'], v)} />
        {ps.walls.enabled && (
          <div style={{ padding: '10px 14px' }}>
            <SRow label="Popust na steno (€, pozitivno = odbitek)">
              <InlineNum value={ps.walls.discountPerWall} onChange={v => set(['walls','discountPerWall'], v)} min={0} />
            </SRow>
          </div>
        )}
      </div>

      {/* 4 Posts */}
      <div style={{ borderBottom: '1px solid var(--color-line)' }}>
        <PSH label="4. Dodatni stebri" enabled={ps.posts.enabled} onToggle={v => set(['posts','enabled'], v)} />
        {ps.posts.enabled && (
          <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <SRow label="Max. stebrov/stranico"><InlineNum value={ps.posts.maxPerSide} onChange={v => set(['posts','maxPerSide'], v)} min={1} max={5} /></SRow>
            <SRow label="Cena/steber (€)"><InlineNum value={ps.posts.pricePerPost} onChange={v => set(['posts','pricePerPost'], v)} min={0} /></SRow>
          </div>
        )}
      </div>

      {/* 5 Colors */}
      <div style={{ borderBottom: '1px solid var(--color-line)' }}>
        <PSH label="5. Barve" enabled={ps.colors.enabled} onToggle={v => set(['colors','enabled'], v)} />
        {ps.colors.enabled && (
          <div style={{ padding: '10px 14px' }}>
            {(['standard','ral','wood','special'] as const).map(cat => {
              const labels = { standard: 'Standard', ral: 'RAL', wood: 'Les', special: 'Special' };
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <PToggle checked={ps.colors[cat].enabled} onChange={v => set(['colors', cat, 'enabled'], v)} />
                  <span style={{ fontSize: 12.5, width: 65 }}>{labels[cat]}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--color-text-3)', flex: 1 }}>Doplačilo (€):</span>
                  <input type="number" style={{ ...S.inpSm, width: 80 }} value={ps.colors[cat].surcharge}
                    onChange={e => set(['colors', cat, 'surcharge'], Number(e.target.value))} min={0} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6 Enclosures */}
      <div style={{ borderBottom: '1px solid var(--color-line)' }}>
        <PSH label="6. Bočne zapore" enabled={ps.enclosures.enabled} onToggle={v => set(['enclosures','enabled'], v)} />
        {ps.enclosures.enabled && (
          <div style={{ padding: '10px 14px' }}>
            {ENC_ROWS.map(([key, label]) => {
              const enc = ps.enclosures[key] as PergolaEncType;
              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <PToggle checked={enc.enabled} onChange={v => set(['enclosures', key, 'enabled'], v)} />
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{label}</span>
                  </div>
                  {enc.enabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, paddingLeft: 44 }}>
                      <SRow label="Osnovna cena (€)"><InlineNum value={enc.priceBase} onChange={v => set(['enclosures', key, 'priceBase'], v)} min={0} /></SRow>
                      <SRow label="Cena / meter (€)"><InlineNum value={enc.pricePerM} onChange={v => set(['enclosures', key, 'pricePerM'], v)} min={0} /></SRow>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7 Lights */}
      <div style={{ borderBottom: '1px solid var(--color-line)' }}>
        <PSH label="7. Razsvetljava" enabled={ps.lights.enabled} onToggle={v => set(['lights','enabled'], v)} />
        {ps.lights.enabled && (
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <PToggle checked={ps.lights.ledEdge.enabled} onChange={v => set(['lights','ledEdge','enabled'], v)} />
              <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>LED rob (notranji)</span>
            </div>
            {ps.lights.ledEdge.enabled && (
              <div style={{ paddingLeft: 44, marginBottom: 8 }}>
                <SRow label="Cena €/meter"><InlineNum value={ps.lights.ledEdge.pricePerM} onChange={v => set(['lights','ledEdge','pricePerM'], v)} min={0} /></SRow>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <PToggle checked={ps.lights.ledStructure.enabled} onChange={v => set(['lights','ledStructure','enabled'], v)} />
              <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>LED zunanja konstrukcija</span>
            </div>
            {ps.lights.ledStructure.enabled && (
              <div style={{ paddingLeft: 44 }}>
                <SRow label="Fiksna cena (€)"><InlineNum value={ps.lights.ledStructure.price} onChange={v => set(['lights','ledStructure','price'], v)} min={0} /></SRow>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8 Electrical */}
      <div style={{ borderBottom: '1px solid var(--color-line)' }}>
        <PSH label="8. Električni paket" enabled={ps.electrical.enabled} onToggle={v => set(['electrical','enabled'], v)} />
        {ps.electrical.enabled && (
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <PToggle checked={ps.electrical.nello.enabled} onChange={v => set(['electrical','nello','enabled'], v)} />
              <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>Nello Smart Motor</span>
              {ps.electrical.nello.enabled && (
                <input type="number" style={{ ...S.inpSm, width: 80 }} value={ps.electrical.nello.price}
                  onChange={e => set(['electrical','nello','price'], Number(e.target.value))} min={0} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PToggle checked={ps.electrical.somfy.enabled} onChange={v => set(['electrical','somfy','enabled'], v)} />
              <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>Somfy Motorization</span>
              {ps.electrical.somfy.enabled && (
                <input type="number" style={{ ...S.inpSm, width: 80 }} value={ps.electrical.somfy.price}
                  onChange={e => set(['electrical','somfy','price'], Number(e.target.value))} min={0} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 9 Addons */}
      <div>
        <PSH label="9. Dodatki" enabled={ps.addons.enabled} onToggle={v => set(['addons','enabled'], v)} />
        {ps.addons.enabled && (
          <div style={{ padding: '10px 14px' }}>
            {ps.addons.items.map((item, idx) => (
              <div key={item.id} style={{ border: '1px solid var(--color-line)', borderRadius: 6, padding: '10px 12px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-3)' }}>Dodatek #{idx + 1}</span>
                  <button onClick={() => delAddon(item.id)} style={{ ...S.iconBtn, color: '#ef4444', fontSize: 14 }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <SRow label="Naziv">
                    <input style={S.inp} value={item.title} onChange={e => updAddon(item.id, { title: e.target.value })} />
                  </SRow>
                  <SRow label="Enota (kos, m², ...)">
                    <input style={S.inp} value={item.unit} onChange={e => updAddon(item.id, { unit: e.target.value })} />
                  </SRow>
                </div>
                <SRow label="Opis">
                  <input style={S.inp} value={item.description} onChange={e => updAddon(item.id, { description: e.target.value })} />
                </SRow>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <SRow label="Cena / enoto (€)"><InlineNum value={item.pricePerUnit} onChange={v => updAddon(item.id, { pricePerUnit: v })} min={0} /></SRow>
                  <SRow label="Min. količina"><InlineNum value={item.minQty} onChange={v => updAddon(item.id, { minQty: v })} min={0} /></SRow>
                  <SRow label="Max. količina"><InlineNum value={item.maxQty} onChange={v => updAddon(item.id, { maxQty: v })} min={1} /></SRow>
                </div>
              </div>
            ))}
            <button
              onClick={addAddon}
              style={{ width: '100%', padding: '8px', border: '1px dashed var(--color-line-2)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12.5, color: 'var(--color-text-3)' }}
            >
              + Dodaj dodatek
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Simple mode full view ──────────────────────────────────────────────────

function SimpleModeView({ state, dispatch, configuratorStatus }: {
  state: BuilderState; dispatch: React.Dispatch<Action>; configuratorStatus: string;
}) {
  const allFields = state.schema.steps.flatMap(s => s.fields);
  const [showPergola, setShowPergola] = useState(true);
  const [showPricingTool, setShowPricingTool] = useState(true);
  return (
    <div style={{ flex: 1, overflowY: 'auto' as const, background: '#fff' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 32px 100px' }}>
        {/* Pergola tool */}
        {showPergola ? (
          <div style={{ marginBottom: 24 }}>
            <PergolaTool state={state} dispatch={dispatch} onClose={() => setShowPergola(false)} />
          </div>
        ) : (
          <button onClick={() => setShowPergola(true)}
            style={{ marginBottom: 20, fontSize: 11.5, color: 'var(--color-text-3)', background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            ⚙ Pergola nastavitve
          </button>
        )}
        {/* Product title */}
        <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--color-line)', marginBottom: 8 }}>
          <div style={{ fontSize: 10.5, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>
            Vaš produkt
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              value={state.name}
              onChange={e => dispatch({ type: 'SET_NAME', name: e.target.value })}
              style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.025em', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', flex: 1 }}
              placeholder="Ime vašega produkta…"
            />
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', flexShrink: 0,
              background: configuratorStatus === 'live' ? '#dcfce7' : 'var(--color-surface)',
              color: configuratorStatus === 'live' ? '#16a34a' : 'var(--color-muted)',
              border: `1px solid ${configuratorStatus === 'live' ? '#bbf7d0' : 'var(--color-line)'}`,
            }}>
              {configuratorStatus === 'live' ? '● Objavljeno' : configuratorStatus}
            </span>
          </div>
        </div>

        {/* Steps */}
        {state.schema.steps.length === 0 && (
          <div style={{ marginTop: 40, padding: '32px 0', textAlign: 'center' as const, color: 'var(--color-muted)', fontSize: 13 }}>
            <div style={{ fontSize: 24, marginBottom: 10, opacity: 0.2 }}>+</div>
            Začni z dodajanjem prvega koraka — npr. "Dimenzije", "Barve", "Streha", "Dodatki".
          </div>
        )}
        {state.schema.steps.map((step, stepIdx) => (
          <SimpleStepSection key={step.id} step={step} stepIdx={stepIdx} state={state} dispatch={dispatch}
            isLast={stepIdx === state.schema.steps.length - 1} />
        ))}
        <div style={{ marginTop: 20, marginLeft: 32 }}>
          <button onClick={() => dispatch({ type: 'ADD_STEP' })}
            style={{ fontSize: 13, color: 'var(--color-text-2)', background: 'none', border: '1.5px dashed var(--color-line)', borderRadius: 'var(--radius-2)', padding: '10px 16px', cursor: 'pointer', width: '100%', textAlign: 'left' as const }}>
            + Dodaj korak (npr. "Dimenzije", "Barve", "Streha", "Dodatki"…)
          </button>
        </div>

        {/* Pricing tool */}
        <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--color-line)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>€</span>
            <h2 style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.015em', margin: 0 }}>Cennik</h2>
            <button onClick={() => setShowPricingTool(v => !v)}
              style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--color-text-3)', background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {showPricingTool ? 'Skrij nastavitve' : '⚙ Cenik nastavitve'}
            </button>
          </div>
          {showPricingTool && (
            <div style={{ marginBottom: 20 }}>
              <PergolaPricingTool state={state} dispatch={dispatch} />
            </div>
          )}
        </div>

        {/* Pricing rules (manual edit) */}
        <SimplePricingSection rules={state.schema.pricing} allFields={allFields} dispatch={dispatch} />

        {/* Advanced note */}
        <details style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--color-line)' }}>
          <summary style={{ fontSize: 12.5, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Napredno · pogoji vidnosti, scoring, JSON
          </summary>
          <p style={{ marginTop: 10, fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Preklopite na "Napredno" pogled z gumbom spodaj desno za dostop do naprednega urejevalnika.
          </p>
        </details>
      </div>
    </div>
  );
}

// ── Pergola Setup Tool ─────────────────────────────────────────────────────

interface DimConfig {
  mode: 'slider' | 'preset';
  min: number; max: number; def: number;
  presets: number[];
}

interface PToolCfg {
  width: DimConfig;
  depth: DimConfig;
  height: DimConfig;
}

function dimField(id: string, label: string, dim: DimConfig): Field {
  if (dim.mode === 'preset' && dim.presets.length > 0) {
    return {
      id, type: 'radio', label, required: false,
      options: dim.presets.map(v => ({
        id: String(v),
        label: `${(v / 100).toFixed(2).replace(/\.?0+$/, '')} m`,
      })),
      default: String(dim.presets[0]),
    } as Field;
  }
  return { id, type: 'number-slider', label, min: dim.min, max: dim.max, step: 10, default: dim.def, unit: 'cm', required: false } as Field;
}

const ENC_OPTIONS: Option[] = [
  { id: 'none',               label: 'Brez' },
  { id: 'zip-screen',         label: 'Zip screen' },
  { id: 'movable-slats',      label: 'Premične lamele' },
  { id: 'sliding-glass',      label: 'Drsno steklo' },
  { id: 'fixed-glass',        label: 'Fiksno steklo' },
  { id: 'ventilation-panel',  label: 'Prezračevalna plošča' },
  { id: 'metal-panel',        label: 'Kovinska plošča' },
];

const COLOR_OPTIONS: SwatchOption[] = [
  { id: '#383E42', label: 'Antracit',   color: '#383E42' },
  { id: '#5a5a5a', label: 'Temno siva', color: '#5a5a5a' },
  { id: '#8a8a8a', label: 'Srebrna',    color: '#8a8a8a' },
  { id: '#f0f0f0', label: 'Bela',       color: '#f0f0f0' },
  { id: '#6B4A2E', label: 'Les',        color: '#6B4A2E' },
];

function buildPergolaSteps(feat: {
  dimensions: boolean; roof: boolean; installation: boolean;
  posts: boolean; enclosures: boolean; colors: boolean;
  contact: boolean; notes: boolean;
}, cfg: PToolCfg): Step[] {
  const steps: Step[] = [];

  if (feat.dimensions) {
    steps.push({
      id: 'dimenzije', label: 'Dimenzije', fields: [
        dimField('width',  'Širina',  cfg.width),
        dimField('depth',  'Globina', cfg.depth),
        dimField('height', 'Višina',  cfg.height),
      ],
    });
  }

  if (feat.roof) {
    steps.push({
      id: 'streha', label: 'Streha', fields: [
        { id: 'slats_type', type: 'radio', label: 'Tip lamel', required: false,
          options: [{ id: 'flat', label: 'Ravne lamele' }, { id: 'wavy', label: 'Valovite lamele' }],
          default: 'flat', columns: 2 } as Field,
        { id: 'lamelle_angle', type: 'number-slider', label: 'Odprtost lamel', min: 0, max: 90, step: 5, default: 0, unit: '°', required: false } as Field,
      ],
    });
  }

  if (feat.installation) {
    steps.push({
      id: 'montaza', label: 'Montaža', fields: [
        { id: 'house_wall_back',  type: 'checkbox', label: 'Pritrditev na hišo — zadaj', required: false } as Field,
        { id: 'house_wall_left',  type: 'checkbox', label: 'Pritrditev na hišo — levo',  required: false } as Field,
        { id: 'house_wall_right', type: 'checkbox', label: 'Pritrditev na hišo — desno', required: false } as Field,
        { id: 'house_wall_front', type: 'checkbox', label: 'Pritrditev na hišo — spredaj', required: false } as Field,
      ],
    });
  }

  if (feat.posts) {
    const pf = (id: string, label: string, offId: string) => ([
      { id, type: 'checkbox', label, required: false } as Field,
      { id: offId, type: 'number-slider', label: `Odmik — ${label.toLowerCase()}`, min: -200, max: 200, step: 10, default: 0, unit: 'cm', required: false,
        visibleIf: { eq: [`$${id}` as `$${string}`, true] } } as Field,
    ]);
    steps.push({
      id: 'stebri', label: 'Dodatni stebri', fields: [
        ...pf('post_front', 'Dodaten steber spredaj',  'post_front_offset'),
        ...pf('post_rear',  'Dodaten steber zadaj',   'post_rear_offset'),
        ...pf('post_left',  'Dodaten steber levo',    'post_left_offset'),
        ...pf('post_right', 'Dodaten steber desno',   'post_right_offset'),
      ],
    });
  }

  if (feat.enclosures) {
    steps.push({
      id: 'stranice', label: 'Stranice', fields: [
        { id: 'enc_front_type', type: 'select', label: 'Stranica spredaj', required: false, options: ENC_OPTIONS, default: 'none' } as Field,
        { id: 'enc_back_type',  type: 'select', label: 'Stranica zadaj',   required: false, options: ENC_OPTIONS, default: 'none' } as Field,
        { id: 'enc_left_type',  type: 'select', label: 'Stranica levo',    required: false, options: ENC_OPTIONS, default: 'none' } as Field,
        { id: 'enc_right_type', type: 'select', label: 'Stranica desno',   required: false, options: ENC_OPTIONS, default: 'none' } as Field,
      ],
    });
  }

  if (feat.colors) {
    steps.push({
      id: 'barve', label: 'Barve', fields: [
        { id: 'structure_color', type: 'swatch', label: 'Barva okvirja', required: false, options: COLOR_OPTIONS, default: '#383E42' } as Field,
        { id: 'slats_color',     type: 'swatch', label: 'Barva lamel',   required: false, options: COLOR_OPTIONS, default: '#383E42' } as Field,
      ],
    });
  }

  if (feat.contact) {
    const fields: Field[] = [
      { id: 'name',  type: 'text',  label: 'Ime in priimek', required: true },
      { id: 'email', type: 'email', label: 'E-pošta',        required: true },
      { id: 'phone', type: 'phone', label: 'Telefon',        required: false },
    ];
    if (feat.notes) {
      fields.push({ id: 'notes', type: 'text', label: 'Opombe (posebne zahteve)', required: false });
    }
    steps.push({ id: 'kontakt', label: 'Kontakt', fields });
  }

  return steps;
}

// Defined at module level so React never remounts them on parent re-render
function PToolToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? '#0a0a0a' : '#d4d4d4', position: 'relative', transition: 'background .15s', padding: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 9, background: '#fff',
        position: 'absolute', top: 2, left: on ? 20 : 2, transition: 'left .15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

function PToolDimRow({ label, dimKey, cfg, onChange }: {
  label: string;
  dimKey: 'width' | 'depth' | 'height';
  cfg: PToolCfg;
  onChange: (k: 'width' | 'depth' | 'height', v: DimConfig) => void;
}) {
  const dim = cfg[dimKey];
  const [newVal, setNewVal] = useState('');

  const inp: React.CSSProperties = {
    width: 72, border: '1px solid var(--color-line-2)', borderRadius: 4,
    padding: '5px 8px', fontSize: 13, fontFamily: 'var(--font-mono)',
    outline: 'none', background: '#fff', boxSizing: 'border-box' as const, textAlign: 'center' as const,
  };

  function addPreset() {
    const v = parseInt(newVal, 10);
    if (v > 0 && !dim.presets.includes(v)) {
      onChange(dimKey, { ...dim, presets: [...dim.presets, v].sort((a, b) => a - b) });
      setNewVal('');
    }
  }

  return (
    <div style={{ paddingLeft: 50, marginTop: 10, paddingBottom: 10, borderBottom: '1px solid var(--color-line-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, color: 'var(--color-text-3)', width: 60 }}>{label}</span>
        <div style={{ display: 'inline-flex', background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 4, overflow: 'hidden' }}>
          {(['slider', 'preset'] as const).map(m => (
            <button key={m} type="button"
              onClick={() => onChange(dimKey, { ...dim, mode: m })}
              style={{
                padding: '3px 10px', fontSize: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: dim.mode === m ? '#0a0a0a' : 'transparent',
                color: dim.mode === m ? '#fff' : 'var(--color-text-3)',
              }}>
              {m === 'slider' ? 'Slider' : 'Preseti'}
            </button>
          ))}
        </div>
      </div>

      {dim.mode === 'slider' && (
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', gap: 10 }}>
          <span />
          {([['Min', 'min'], ['Max', 'max'], ['Privzeto', 'def']] as [string, keyof DimConfig][]).map(([lbl, k]) => (
            <label key={k} style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
              <span style={{ fontSize: 10.5, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{lbl} cm</span>
              <input type="number" value={dim[k] as number}
                onChange={e => onChange(dimKey, { ...dim, [k]: parseInt(e.target.value, 10) || 0 })}
                style={inp} />
            </label>
          ))}
        </div>
      )}

      {dim.mode === 'preset' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 8 }}>
            {dim.presets.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--color-muted)', fontStyle: 'italic' }}>Brez presetov — dodaj spodaj.</span>
            )}
            {dim.presets.map((v, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 6px 3px 8px', background: '#fff', border: '1px solid var(--color-line)', borderRadius: 4, fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>
                {v} cm
                <button type="button"
                  onClick={() => onChange(dimKey, { ...dim, presets: dim.presets.filter((_, j) => j !== i) })}
                  style={{ all: 'unset' as const, cursor: 'pointer', color: 'var(--color-muted)', fontSize: 14, lineHeight: 1, paddingLeft: 2 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="number" placeholder="npr. 300"
              value={newVal}
              onChange={e => setNewVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPreset(); } }}
              style={{ ...inp, width: 90 }} />
            <button type="button" onClick={addPreset}
              style={{ height: 30, padding: '0 10px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Dodaj
            </button>
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>cm</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PergolaTool({ state, dispatch, onClose }: {
  state: BuilderState; dispatch: React.Dispatch<Action>; onClose: () => void;
}) {
  const allIds = new Set(state.schema.steps.flatMap(s => s.fields.map(f => f.id)));
  const existingWidth = state.schema.steps.flatMap(s => s.fields).find(f => f.id === 'width') as (Field & { min?: number; max?: number; default?: number }) | undefined;

  const [feat, setFeat] = useState({
    dimensions:   true,
    roof:         true,
    installation: true,
    posts:        true,
    enclosures:   true,
    colors:       true,
    contact:      true,
    notes:        allIds.has('notes'),
  });

  const [cfg, setCfg] = useState<PToolCfg>({
    width:  { mode: 'slider', min: existingWidth?.min ?? 200, max: existingWidth?.max ?? 600, def: existingWidth?.default ?? 400, presets: [] },
    depth:  { mode: 'slider', min: 200, max: 500, def: 300, presets: [] },
    height: { mode: 'slider', min: 220, max: 320, def: 250, presets: [] },
  });

  const [flash, setFlash] = useState(false);

  function apply() {
    const steps = buildPergolaSteps(feat, cfg);
    dispatch({ type: 'REPLACE_STEPS', steps });
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }

  const tog   = (k: keyof typeof feat) => setFeat(f => ({ ...f, [k]: !f[k] }));
  const onDim = (k: 'width' | 'depth' | 'height', v: DimConfig) => setCfg(c => ({ ...c, [k]: v }));

  const row = (label: string, k: keyof typeof feat, sub?: React.ReactNode) => (
    <div key={k} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => tog(k)}>
        <PToolToggle on={feat[k]} onClick={() => tog(k)} />
        <span style={{ fontSize: 13.5, fontWeight: 500, color: feat[k] ? 'var(--color-ink)' : 'var(--color-text-3)', userSelect: 'none' }}>{label}</span>
      </div>
      {feat[k] && sub && <div style={{ marginTop: 6 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ background: '#f8f9fa', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-line)', background: '#fff' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-2)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontFamily: 'var(--font-mono)' }}>
          ⬡ Pergola konfigurator
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ ...S.iconBtn, fontSize: 16 }}>×</button>
      </div>

      <div style={{ padding: '0 16px' }}>
        {row('Dimenzije — širina, globina, višina', 'dimensions',
          <>
            <PToolDimRow label="Širina"  dimKey="width"  cfg={cfg} onChange={onDim} />
            <PToolDimRow label="Globina" dimKey="depth"  cfg={cfg} onChange={onDim} />
            <PToolDimRow label="Višina"  dimKey="height" cfg={cfg} onChange={onDim} />
          </>
        )}
        {row('Streha — tip lamel + kot odprtosti', 'roof')}
        {row('Montaža — pritrditev na hišo (po straneh)', 'installation')}
        {row('Dodatni stebri — po straneh z odmikom', 'posts')}
        {row('Stranice — vrsta zapore po straneh', 'enclosures')}
        {row('Barve — okvir in lamele ločeno', 'colors')}
        {row('Kontakt — ime, e-pošta, telefon', 'contact')}
        {feat.contact && row('Opomba stranke (posebne zahteve)', 'notes')}
      </div>

      <div style={{ padding: '14px 16px', background: '#fff', borderTop: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={apply} style={{
          height: 36, padding: '0 20px', background: flash ? '#16a34a' : '#0a0a0a', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-2)', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s', flexShrink: 0,
        }}>
          {flash ? '✓ Posodobljeno!' : 'Posodobi konfigurator →'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.4 }}>Prepiše korake · cenik se ohrani</span>
      </div>
    </div>
  );
}

// ── Pergola Pricing Tool ──────────────────────────────────────────────────

interface PPriceCfg {
  base: number;
  sqm: number;
  post: number;
  side: number;
  vat: number;
}

function PergolaPricingTool({ state, dispatch }: {
  state: BuilderState; dispatch: React.Dispatch<Action>;
}) {
  const existing = state.schema.pricing;
  const existingBase = existing.find(r => r.kind === 'base');
  const existingVat  = existing.find(r => r.kind === 'vat');

  const [cfg, setCfg] = useState<PPriceCfg>({
    base: typeof existingBase?.formula === 'number' ? existingBase.formula : 0,
    sqm:  0,
    post: 0,
    side: 0,
    vat:  existingVat ? Math.round(existingVat.rate * 100) : 22,
  });
  const [flash, setFlash] = useState(false);

  const sideFields = state.schema.steps.flatMap(s => s.fields).filter(f =>
    f.id.startsWith('enc_') && f.id.endsWith('_type')
  );

  function apply() {
    const rules: PricingRule[] = [];

    rules.push({ id: uid(), kind: 'base', formula: cfg.base, label: 'Osnovna cena' });

    if (cfg.sqm > 0) {
      rules.push({
        id: uid(), kind: 'add',
        when: { gte: ['$width' as `$${string}`, 0] },
        formula: { times: [{ div: [{ area: { width: '$width' as `$${string}`, depth: '$depth' as `$${string}` } }, 10000] }, cfg.sqm] },
        label: `Cena za m² (${cfg.sqm} €/m²)`,
      });
    }

    if (cfg.post > 0) {
      rules.push({
        id: uid(), kind: 'add',
        when: { gte: ['$extra_posts_w' as `$${string}`, 1] },
        formula: { times: [{ ref: '$extra_posts_w' as `$${string}` }, cfg.post] },
        label: `Cena za steber (${cfg.post} €/kos)`,
      });
    }

    if (cfg.side > 0) {
      for (const f of sideFields) {
        rules.push({
          id: uid(), kind: 'add',
          when: { neq: [`$${f.id}` as `$${string}`, 'none'] },
          formula: cfg.side,
          label: `${f.label} (${cfg.side} €)`,
        });
      }
    }

    if (cfg.vat > 0) {
      rules.push({ id: uid(), kind: 'vat', rate: cfg.vat / 100, label: `DDV (${cfg.vat}%)` });
    }

    dispatch({ type: 'REPLACE_PRICING', rules });
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }

  const onNum = (k: keyof PPriceCfg, v: string) => setCfg(c => ({ ...c, [k]: parseFloat(v) || 0 }));

  const inp: React.CSSProperties = {
    width: 90, border: '1px solid var(--color-line-2)', borderRadius: 4,
    padding: '5px 8px', fontSize: 13, fontFamily: 'var(--font-mono)',
    outline: 'none', background: '#fff', boxSizing: 'border-box' as const, textAlign: 'right' as const,
  };

  const priceRow = (label: string, k: keyof PPriceCfg, unit: string, hint?: string) => (
    <div key={k} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--color-line)' }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{hint}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="number" min={0} value={cfg[k]} onChange={e => onNum(k, e.target.value)} style={inp} />
        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{unit}</span>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f8f9fa', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-line)', background: '#fff' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-2)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontFamily: 'var(--font-mono)' }}>
          € Cenik — nastavitve
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Prepiše cenovna pravila</span>
      </div>
      <div style={{ padding: '0 16px' }}>
        {priceRow('Osnovna cena', 'base', '€')}
        {priceRow('Cena za m²', 'sqm', '€/m²', 'širina × globina ÷ 10000')}
        {priceRow('Cena za steber', 'post', '€/kos', 'extra_posts_w × cena')}
        {priceRow('Cena za stranico', 'side', '€', 'vsaka vklopljena stranica')}
        {priceRow('DDV', 'vat', '%')}
      </div>
      {sideFields.length === 0 && cfg.side > 0 && (
        <div style={{ margin: '0 16px 8px', fontSize: 11.5, color: '#92400e', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 4, padding: '6px 10px' }}>
          Najprej posodobi konfigurator (zgoraj) in vključi &ldquo;Stranice&rdquo;, da se dodajo polja za zapore.
        </div>
      )}
      <div style={{ padding: '14px 16px', background: '#fff', borderTop: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={apply} style={{
          height: 36, padding: '0 20px', background: flash ? '#16a34a' : '#0a0a0a', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-2)', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s', flexShrink: 0,
        }}>
          {flash ? '✓ Cenik posodobljen!' : 'Posodobi cenik →'}
        </button>
      </div>
    </div>
  );
}

// ── Mode toggle pill ───────────────────────────────────────────────────────

function ModePill({ mode, onChange }: { mode: 'simple' | 'advanced'; onChange: (m: 'simple' | 'advanced') => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 28, zIndex: 50,
      background: '#0a0a0a', padding: 3, borderRadius: 999,
      display: 'inline-flex', boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      fontSize: 12, fontWeight: 500,
    }}>
      {(['simple', 'advanced'] as const).map(k => (
        <button key={k} onClick={() => onChange(k)} style={{
          all: 'unset' as const, padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
          background: mode === k ? '#fff' : 'transparent',
          color: mode === k ? '#0a0a0a' : '#a3a3a3',
          transition: 'all .12s', fontFamily: 'var(--font-sans)',
        }}>
          {k === 'simple' ? 'Enostavno' : 'Napredno'}
        </button>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function BuilderClient({
  configuratorId,
  configuratorName,
  configuratorStatus,
  initialSchema,
}: {
  configuratorId: string;
  configuratorName: string;
  configuratorStatus: string;
  initialSchema: ConfiguratorSchema;
}) {
  const [state, dispatch] = useReducer(reducer, {
    schema: initialSchema,
    name: configuratorName,
    selectedStepIdx: 0,
    selectedFieldId: null,
    tab: 'fields',
    dirty: false,
    saving: false,
    publishing: false,
    saveError: null,
  });

  const [showAddField, setShowAddField] = useState(false);
  const [showGuide, setShowGuide] = useState(() => initialSchema.steps.length === 0);
  const [upgradeInfo, setUpgradeInfo] = useState<{ message: string; limit: number } | null>(null);
  const [simpleMode, setSimpleMode] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const shareUrl = `https://forma.gudweb.si/i/${configuratorId}`;

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  const allFields = state.schema.steps.flatMap(s => s.fields);
  const selectedStep = state.schema.steps[state.selectedStepIdx];
  const selectedField = selectedStep?.fields.find(f => f.id === state.selectedFieldId) ?? null;

  const handleSave = useCallback(async () => {
    dispatch({ type: 'SET_SAVING', value: true });
    try {
      const res = await fetch(`/api/v1/configurators/${configuratorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: state.name, schema: state.schema }),
      });
      if (!res.ok) throw new Error(await res.text());
      dispatch({ type: 'SAVED' });
    } catch (err) {
      dispatch({ type: 'SAVE_ERROR', message: err instanceof Error ? err.message : 'Save failed' });
    }
  }, [configuratorId, state.name, state.schema]);

  const handlePublish = useCallback(async () => {
    dispatch({ type: 'SET_SAVING', value: true });
    try {
      const saveRes = await fetch(`/api/v1/configurators/${configuratorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: state.name, schema: state.schema }),
      });
      if (!saveRes.ok) throw new Error(await saveRes.text());

      dispatch({ type: 'SET_PUBLISHING', value: true });
      const pubRes = await fetch(`/api/v1/configurators/${configuratorId}/publish`, { method: 'POST' });
      if (!pubRes.ok) {
        const body = await pubRes.json().catch(() => ({})) as { error?: string; message?: string; limit?: number };
        if (body.error === 'plan_limit') {
          setUpgradeInfo({ message: body.message ?? 'Upgrade your plan to publish more configurators.', limit: body.limit ?? 1 });
          dispatch({ type: 'SET_SAVING', value: false });
          return;
        }
        throw new Error(body.message ?? `Publish failed (${pubRes.status})`);
      }
      dispatch({ type: 'SAVED' });
    } catch (err) {
      dispatch({ type: 'SAVE_ERROR', message: err instanceof Error ? err.message : 'Publish failed' });
    } finally {
      dispatch({ type: 'SET_PUBLISHING', value: false });
    }
  }, [configuratorId, state.name, state.schema]);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'fields', label: 'Steps & Fields' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'scoring', label: 'Scoring' },
    { id: 'json', label: 'JSON' },
    { id: 'pergola', label: 'Pergola' },
  ];

  return (
    <div style={S.fill}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <input
          style={{ ...S.inpSm, width: 220, fontWeight: 500 }}
          value={state.name}
          onChange={e => dispatch({ type: 'SET_NAME', name: e.target.value })}
        />
        <Badge kind={configuratorStatus === 'live' ? 'live' : 'neutral'} size="sm">
          {configuratorStatus}
        </Badge>
        <div style={{ flex: 1 }} />

        {/* Tabs — only in advanced mode */}
        {!simpleMode && (
          <div style={{ display: 'flex', gap: 2, background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', padding: 2 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => dispatch({ type: 'SET_TAB', tab: t.id })}
                style={{
                  all: 'unset', padding: '3px 12px', fontSize: 12.5, cursor: 'pointer', borderRadius: 3,
                  background: state.tab === t.id ? '#fff' : 'transparent',
                  color: state.tab === t.id ? 'var(--color-ink)' : 'var(--color-text-3)',
                  fontWeight: state.tab === t.id ? 500 : 400,
                  boxShadow: state.tab === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >{t.label}</button>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />
        <button
          onClick={copyLink}
          style={{ fontSize: 12, color: copiedLink ? '#16a34a' : 'var(--color-text-3)', background: 'none', border: '1px solid var(--color-line)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .15s', flexShrink: 0 }}
        >
          {copiedLink ? '✓ Kopirano!' : 'Kopiraj link'}
        </button>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: 'var(--color-text-3)', textDecoration: 'none', border: '1px solid var(--color-line)', borderRadius: 4, padding: '4px 10px', lineHeight: '1.6', flexShrink: 0 }}
        >
          ↗ Odpri
        </a>
        <button
          onClick={() => setShowPreview(v => !v)}
          style={{ fontSize: 12, color: showPreview ? 'var(--color-ink)' : 'var(--color-text-3)', background: showPreview ? 'var(--color-surface-2)' : 'none', border: '1px solid var(--color-line)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
        >
          {showPreview ? '✕ Zapri' : '▣ Predogled'}
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--color-line)', flexShrink: 0 }} />
        {state.saveError && <span style={{ fontSize: 12, color: '#ef4444' }}>{state.saveError}</span>}
        <Btn variant="secondary" size="sm" onClick={handleSave} disabled={state.saving || !state.dirty}>
          {state.saving && !state.publishing ? 'Saving…' : state.dirty ? 'Save draft' : 'Saved'}
        </Btn>
        <Btn variant="primary" size="sm" onClick={handlePublish} disabled={state.saving}>
          {state.publishing ? 'Publishing…' : 'Publish'}
        </Btn>
      </div>

      {/* Content row: editor + optional live preview pane */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Simple mode */}
      {simpleMode && (
        <SimpleModeView state={state} dispatch={dispatch} configuratorStatus={configuratorStatus} />
      )}

      {/* Advanced content */}
      {!simpleMode && state.tab === 'fields' && (
        <div style={{ ...S.row, flex: 1 }}>
          {/* Steps column */}
          <div style={{ ...S.col(200), background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 6px' }}>
              <span style={S.secHead}>Steps</span>
              <button
                onClick={() => setShowGuide(v => !v)}
                title="Getting started guide"
                style={{ ...S.iconBtn, fontSize: 11, color: '#0369a1', fontFamily: 'var(--font-mono)' }}
              >?</button>
            </div>
            {showGuide && <GettingStarted onDismiss={() => setShowGuide(false)} />}
            <div style={S.scroll}>
              {state.schema.steps.length === 0 && (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 12.5 }}>
                  No steps yet.<br />
                  <span style={{ color: 'var(--color-text-3)' }}>Click "Add step" below to start.</span>
                </div>
              )}
              {state.schema.steps.map((step, i) => (
                <div
                  key={step.id}
                  style={S.row1(i === state.selectedStepIdx)}
                  onClick={() => dispatch({ type: 'SELECT_STEP', idx: i })}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{step.fields.length}</span>
                  <span style={{ display: 'flex', gap: 2 }}>
                    <button style={S.iconBtn} onClick={e => { e.stopPropagation(); dispatch({ type: 'MOVE_STEP', idx: i, dir: -1 }); }}>↑</button>
                    <button style={S.iconBtn} onClick={e => { e.stopPropagation(); dispatch({ type: 'MOVE_STEP', idx: i, dir: 1 }); }}>↓</button>
                    {state.schema.steps.length > 1 && (
                      <button style={S.iconBtn} onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_STEP', idx: i }); }}>×</button>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--color-line)' }}>
              <Btn variant="secondary" size="sm" full onClick={() => dispatch({ type: 'ADD_STEP' })}>
                + Add step
              </Btn>
            </div>
          </div>

          {/* Fields column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>
            {!selectedStep && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: 13, textAlign: 'center', padding: 32 }}>
                Add a step on the left to begin
              </div>
            )}
            {selectedStep && (
              <>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-line)', background: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    style={{ ...S.inpSm, flex: 1, fontWeight: 500 }}
                    value={selectedStep.label}
                    onChange={e => dispatch({ type: 'UPDATE_STEP', idx: state.selectedStepIdx, patch: { label: e.target.value } })}
                    placeholder="Step name (e.g. Dimensions)"
                  />
                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{selectedStep.fields.length} field{selectedStep.fields.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ ...S.scroll, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedStep.fields.map(field => (
                    <div
                      key={field.id}
                      onClick={() => dispatch({ type: 'SELECT_FIELD', id: field.id })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                        background: state.selectedFieldId === field.id ? '#fff' : '#fff',
                        border: `1px solid ${state.selectedFieldId === field.id ? '#0a0a0a' : 'var(--color-line)'}`,
                        borderRadius: 'var(--radius-2)', cursor: 'pointer',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{field.label}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                          <span style={S.chip}>{field.type}</span>
                          <span style={{ ...S.chip, fontFamily: 'var(--font-mono)' }}>{field.id}</span>
                          {field.required && <span style={{ ...S.chip, background: 'var(--color-ink)', color: '#fff', border: 'none' }}>required</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button style={S.iconBtn} onClick={e => { e.stopPropagation(); dispatch({ type: 'MOVE_FIELD', stepIdx: state.selectedStepIdx, fieldId: field.id, dir: -1 }); }}>↑</button>
                        <button style={S.iconBtn} onClick={e => { e.stopPropagation(); dispatch({ type: 'MOVE_FIELD', stepIdx: state.selectedStepIdx, fieldId: field.id, dir: 1 }); }}>↓</button>
                      </div>
                    </div>
                  ))}

                  {selectedStep.fields.length === 0 && !showAddField && (
                    <div style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 12.5 }}>
                      No fields yet — click <strong>+ Add field</strong> below.
                    </div>
                  )}

                  {/* Add field */}
                  {showAddField ? (
                    <div style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', background: '#fff', padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: 'var(--color-text-2)' }}>Choose field type</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                        {FIELD_TYPES.map(ft => (
                          <button
                            key={ft.type}
                            style={{ ...S.iconBtn, width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid var(--color-line)', borderRadius: 4, justifyContent: 'flex-start' }}
                            onClick={() => {
                              dispatch({ type: 'ADD_FIELD', stepIdx: state.selectedStepIdx, fieldType: ft.type });
                              setShowAddField(false);
                            }}
                          >
                            {ft.label}
                          </button>
                        ))}
                      </div>
                      <Btn variant="ghost" size="sm" style={{ marginTop: 8 }} onClick={() => setShowAddField(false)}>Cancel</Btn>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddField(true)}
                      style={{ padding: '10px 12px', border: '1px dashed var(--color-line-3)', borderRadius: 'var(--radius-2)', fontSize: 13, color: 'var(--color-text-3)', cursor: 'pointer', background: 'transparent', textAlign: 'left' as const }}
                    >
                      + Add field
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Properties column */}
          <div style={{ ...S.col(300), borderRight: 'none', background: '#fff' }}>
            {selectedField ? (
              <>
                <div style={S.secHead}>Field properties</div>
                <div style={S.scroll}>
                  <FieldPanel
                    field={selectedField}
                    stepIdx={state.selectedStepIdx}
                    allFields={allFields}
                    dispatch={dispatch}
                  />
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
                  <div style={{ fontSize: 20, marginBottom: 8, opacity: 0.4 }}>←</div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 6 }}>No field selected</div>
                  <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                    Click any field in the middle column<br />to edit its label, options, and visibility.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!simpleMode && state.tab === 'pricing' && (
        <div style={{ ...S.scroll, padding: 0 }}>
          <PricingTab rules={state.schema.pricing} allFields={allFields} dispatch={dispatch} />
        </div>
      )}

      {!simpleMode && state.tab === 'scoring' && (
        <div style={{ ...S.scroll, padding: 0 }}>
          <ScoringTab rules={state.schema.scoring} allFields={allFields} dispatch={dispatch} />
        </div>
      )}

      {!simpleMode && state.tab === 'json' && (
        <div style={{ flex: 1, overflow: 'hidden', padding: 20, background: 'var(--color-surface)' }}>
          <textarea
            style={{
              width: '100%', height: '100%', fontFamily: 'var(--font-mono)', fontSize: 12.5,
              background: '#0a0a0a', color: '#e3e3e3', border: 'none', outline: 'none',
              borderRadius: 'var(--radius-2)', padding: 20, resize: 'none', lineHeight: 1.65,
              boxSizing: 'border-box',
            }}
            value={JSON.stringify(state.schema, null, 2)}
            onChange={e => dispatch({ type: 'SET_JSON', raw: e.target.value })}
            spellCheck={false}
          />
        </div>
      )}

      {!simpleMode && state.tab === 'pergola' && (
        <PergolaTab schema={state.schema} dispatch={dispatch} />
      )}

        </div>{/* end editor column */}

        {/* Live preview pane */}
        {showPreview && (
          <div style={{ width: 420, flexShrink: 0, borderLeft: '1px solid var(--color-line)', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
            <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', borderBottom: '1px solid var(--color-line)', background: '#fff', flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)' }}>Predogled</span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>· nazadnje shranjena verzija</span>
              <div style={{ flex: 1 }} />
              <button
                onClick={async () => { await handleSave(); setPreviewKey(k => k + 1); }}
                style={{ fontSize: 11.5, color: 'var(--color-text-3)', background: 'none', border: '1px solid var(--color-line)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ↺ Osveži
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11.5, color: 'var(--color-text-3)', textDecoration: 'none', border: '1px solid var(--color-line)', borderRadius: 4, padding: '3px 8px', lineHeight: '1.6' }}
              >
                ↗ Odpri
              </a>
            </div>
            <iframe
              key={previewKey}
              src={`/i/${configuratorId}?preview=1`}
              style={{ flex: 1, border: 'none', width: '100%' }}
              title="Predogled konfiguratora"
            />
          </div>
        )}
      </div>{/* end content row */}

      {/* Mode toggle pill */}
      <ModePill mode={simpleMode ? 'simple' : 'advanced'} onChange={m => setSimpleMode(m === 'simple')} />

      {/* Upgrade modal */}
      {upgradeInfo && (
        <>
          <style>{`@keyframes _upgrade_pulse{0%,100%{box-shadow:0 0 0 0 rgba(10,10,10,0.35)}50%{box-shadow:0 0 0 7px rgba(10,10,10,0)}}`}</style>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setUpgradeInfo(null)}>
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: '32px 28px', maxWidth: 400, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 8 }}>
                Plan limit reached
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', margin: '0 0 16px', lineHeight: 1.6 }}>
                {upgradeInfo.message}
              </p>
              <div style={{ margin: '0 0 24px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-3)' }}>Live configurators</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#ef4444', fontWeight: 600 }}>
                    {upgradeInfo.limit} / {upgradeInfo.limit}
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--color-line)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#ef4444', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a
                  href="/settings/billing"
                  style={{
                    display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 18px',
                    background: '#0a0a0a', color: '#fff', borderRadius: 'var(--radius-2)',
                    fontSize: 13, fontWeight: 500, textDecoration: 'none',
                    animation: '_upgrade_pulse 2s ease-in-out infinite',
                  }}
                >
                  Upgrade plan →
                </a>
                <button
                  onClick={() => setUpgradeInfo(null)}
                  style={{ height: 36, padding: '0 18px', border: '1px solid var(--color-line-2)', background: '#fff', borderRadius: 'var(--radius-2)', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
