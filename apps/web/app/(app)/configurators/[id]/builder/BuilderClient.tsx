'use client';

import { useCallback, useReducer, useState } from 'react';
import { Badge, Btn, Card, Icons } from '@/components/ui';
import type {
  ConfiguratorSchema, Step, Field, FieldType,
  PricingRule, ScoringRule, Condition, Formula, Option, SwatchOption,
} from '@forma/types';

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'fields' | 'pricing' | 'scoring' | 'json';

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
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

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
        const body = await pubRes.json().catch(() => ({})) as { error?: string; message?: string };
        if (body.error === 'plan_limit') {
          setUpgradeMsg(body.message ?? 'Upgrade your plan to publish more configurators.');
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

        {/* Tabs */}
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

        <div style={{ flex: 1 }} />
        {state.saveError && <span style={{ fontSize: 12, color: '#ef4444' }}>{state.saveError}</span>}
        <Btn variant="secondary" size="sm" onClick={handleSave} disabled={state.saving || !state.dirty}>
          {state.saving && !state.publishing ? 'Saving…' : state.dirty ? 'Save draft' : 'Saved'}
        </Btn>
        <Btn variant="primary" size="sm" onClick={handlePublish} disabled={state.saving}>
          {state.publishing ? 'Publishing…' : 'Publish'}
        </Btn>
      </div>

      {/* Content */}
      {state.tab === 'fields' && (
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

      {state.tab === 'pricing' && (
        <div style={{ ...S.scroll, padding: 0 }}>
          <PricingTab rules={state.schema.pricing} allFields={allFields} dispatch={dispatch} />
        </div>
      )}

      {state.tab === 'scoring' && (
        <div style={{ ...S.scroll, padding: 0 }}>
          <ScoringTab rules={state.schema.scoring} allFields={allFields} dispatch={dispatch} />
        </div>
      )}

      {state.tab === 'json' && (
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

      {/* Upgrade modal */}
      {upgradeMsg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setUpgradeMsg(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: '32px 28px', maxWidth: 400, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>🚀</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 8 }}>
              Plan limit reached
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', margin: '0 0 24px', lineHeight: 1.6 }}>
              {upgradeMsg}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <a
                href="/settings/billing"
                style={{
                  display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 18px',
                  background: '#0a0a0a', color: '#fff', borderRadius: 'var(--radius-2)',
                  fontSize: 13, fontWeight: 500, textDecoration: 'none',
                }}
              >
                Upgrade plan →
              </a>
              <button
                onClick={() => setUpgradeMsg(null)}
                style={{ height: 36, padding: '0 18px', border: '1px solid var(--color-line-2)', background: '#fff', borderRadius: 'var(--radius-2)', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
