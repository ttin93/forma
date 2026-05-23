'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { evaluate } from '@forma/configurator-engine';
import type { ConfiguratorSchema, Field, Step, EvaluateResult } from '@forma/types';
import { Btn } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminCfg {
  id: string;
  name: string;
  status: string;
  latestVersion: { schema: ConfiguratorSchema } | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

// ── Field renderers ──────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  const baseInput: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: 14,
    border: `1px solid ${error ? '#e53e3e' : 'var(--color-line-2)'}`,
    borderRadius: 'var(--radius-2)', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  switch (field.type) {
    case 'number-slider':
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--color-text-2)' }}>
            <span>{field.min} {field.unit}</span>
            <strong>{String(value)} {field.unit}</strong>
            <span>{field.max} {field.unit}</span>
          </div>
          <input
            type="range" min={field.min} max={field.max} step={field.step}
            value={Number(value)}
            onChange={e => onChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#0a0a0a' }}
          />
        </div>
      );

    case 'number-input':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="number" min={field.min} max={field.max} step={field.step ?? 1}
            value={Number(value)} onChange={e => onChange(Number(e.target.value))}
            style={{ ...baseInput, width: 120 }} />
          {field.unit && <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{field.unit}</span>}
        </div>
      );

    case 'quantity':
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', overflow: 'hidden' }}>
          <button onClick={() => onChange(Math.max(field.min ?? 0, Number(value) - 1))}
            style={{ width: 36, height: 36, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-2)' }}>−</button>
          <span style={{ width: 48, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500 }}>{String(value)}</span>
          <button onClick={() => onChange(field.max ? Math.min(field.max, Number(value) + 1) : Number(value) + 1)}
            style={{ width: 36, height: 36, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-2)' }}>+</button>
        </div>
      );

    case 'text':
      return <input type="text" value={String(value ?? '')} onChange={e => onChange(e.target.value)} style={baseInput} />;

    case 'email':
      return <input type="email" value={String(value ?? '')} onChange={e => onChange(e.target.value)} style={baseInput} placeholder="email@example.com" />;

    case 'phone':
      return <input type="tel" value={String(value ?? '')} onChange={e => onChange(e.target.value)} style={baseInput} placeholder="+386 ..." />;

    case 'checkbox':
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#0a0a0a', cursor: 'pointer' }} />
          <span style={{ fontSize: 14 }}>{field.label}</span>
        </label>
      );

    case 'select':
      return (
        <select value={String(value ?? '')} onChange={e => onChange(e.target.value)}
          style={{ ...baseInput, cursor: 'pointer', background: '#fff' }}>
          <option value="">Select…</option>
          {field.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      );

    case 'radio':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${field.columns ?? 1}, 1fr)`, gap: 8 }}>
          {field.options.map(o => {
            const checked = value === o.id;
            return (
              <label key={o.id} onClick={() => onChange(o.id)} style={{
                border: `1px solid ${checked ? '#0a0a0a' : 'var(--color-line-2)'}`,
                borderRadius: 'var(--radius-2)', padding: '10px 14px', cursor: 'pointer',
                background: checked ? '#0a0a0a' : '#fff', color: checked ? '#fff' : 'inherit',
                transition: 'all .12s',
              }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{o.label}</div>
                {o.sublabel && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{o.sublabel}</div>}
                {o.price && <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 4, opacity: 0.85 }}>+{fmtMoney(o.price.amount, o.price.currency)}</div>}
              </label>
            );
          })}
        </div>
      );

    case 'swatch':
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {field.options.map(o => {
            const checked = value === o.id;
            return (
              <button key={o.id} onClick={() => onChange(o.id)} title={o.label} style={{
                width: 36, height: 36, borderRadius: '50%', background: o.color,
                border: checked ? '3px solid #0a0a0a' : '2px solid var(--color-line-2)',
                cursor: 'pointer', boxShadow: checked ? '0 0 0 2px #fff, 0 0 0 4px #0a0a0a' : 'none',
                transition: 'all .12s',
              }} />
            );
          })}
        </div>
      );

    case 'multi-select':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {field.options.map(o => {
            const selected = Array.isArray(value) && (value as string[]).includes(o.id);
            return (
              <label key={o.id} onClick={() => {
                const arr = Array.isArray(value) ? (value as string[]) : [];
                onChange(selected ? arr.filter(x => x !== o.id) : [...arr, o.id]);
              }} style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                padding: '8px 12px', border: `1px solid ${selected ? '#0a0a0a' : 'var(--color-line-2)'}`,
                borderRadius: 'var(--radius-2)', background: selected ? '#f5f5f5' : '#fff',
              }}>
                <div style={{ width: 16, height: 16, border: `1px solid ${selected ? '#0a0a0a' : 'var(--color-line-2)'}`, borderRadius: 3, background: selected ? '#0a0a0a' : '#fff', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                  {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M4 12l5 5L20 6"/></svg>}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{o.label}</span>
              </label>
            );
          })}
        </div>
      );

    case 'image-pick':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {field.options.map(o => {
            const checked = value === o.id;
            return (
              <button key={o.id} onClick={() => onChange(o.id)} style={{
                all: 'unset', cursor: 'pointer', border: `2px solid ${checked ? '#0a0a0a' : 'var(--color-line-2)'}`,
                borderRadius: 'var(--radius-2)', overflow: 'hidden', textAlign: 'center',
              }}>
                <img src={o.imageUrl} alt={o.label} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '6px 8px', fontSize: 12, fontWeight: checked ? 600 : 400 }}>{o.label}</div>
              </button>
            );
          })}
        </div>
      );

    case 'date':
      return <input type="date" value={String(value ?? '')} min={field.min} max={field.max} onChange={e => onChange(e.target.value)} style={baseInput} />;

    case 'address':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="Street address" style={baseInput} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input placeholder="City" style={baseInput} />
            <input placeholder="Postal code" style={baseInput} />
          </div>
        </div>
      );

    default:
      return <input type="text" value={String(value ?? '')} onChange={e => onChange(e.target.value)} style={baseInput} />;
  }
}

// ── Step view ─────────────────────────────────────────────────────────────────

function StepView({
  step,
  fields,
  state,
  errors,
  onChange,
}: {
  step: Step;
  fields: Field[];
  state: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (id: string, v: unknown) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {fields.map(field => {
        if (field.type === 'checkbox') {
          return (
            <div key={field.id}>
              <FieldInput field={field} value={state[field.id]} onChange={v => onChange(field.id, v)} error={errors[field.id]} />
              {field.help && <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>{field.help}</div>}
              {errors[field.id] && <div style={{ fontSize: 12, color: '#e53e3e', marginTop: 4 }}>{errors[field.id]}</div>}
            </div>
          );
        }
        return (
          <div key={field.id}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--color-text)' }}>
              {field.label}
              {field.required && <span style={{ color: '#e53e3e', marginLeft: 2 }}>*</span>}
            </label>
            {field.help && <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 8 }}>{field.help}</div>}
            <FieldInput field={field} value={state[field.id]} onChange={v => onChange(field.id, v)} error={errors[field.id]} />
            {errors[field.id] && <div style={{ fontSize: 12, color: '#e53e3e', marginTop: 4 }}>{errors[field.id]}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── Pricing panel ─────────────────────────────────────────────────────────────

function PricingPanel({ result }: { result: EvaluateResult }) {
  const { pricing } = result;
  if (!pricing.breakdown.length && pricing.total === 0) return null;

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-3)', padding: '16px 20px', fontSize: 13 }}>
      <div style={{ fontWeight: 500, marginBottom: 10, fontSize: 13.5 }}>Pricing summary</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {pricing.breakdown.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: item.kind === 'discount' ? '#16a34a' : 'var(--color-text-2)' }}>
            <span>{item.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {item.kind === 'discount' ? '−' : ''}{fmtMoney(Math.abs(item.amount), pricing.currency)}
            </span>
          </div>
        ))}
        {pricing.vat > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-3)' }}>
            <span>VAT</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtMoney(pricing.vat, pricing.currency)}</span>
          </div>
        )}
      </div>
      <div style={{ borderTop: '1px solid var(--color-line)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 15 }}>
        <span>Total</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtMoney(pricing.total, pricing.currency)}</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [cfg, setCfg] = useState<AdminCfg | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<Record<string, unknown>>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/configurators/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCfg(d); setLoading(false); });
  }, [id]);

  const schema = cfg?.latestVersion?.schema ?? null;

  const result = schema ? evaluate(schema, state) : null;
  const visibleSteps = result?.visibleSteps ?? [];
  const currentStep = visibleSteps[stepIdx] ?? null;
  const visibleFields = currentStep ? (result?.visibleFields[currentStep.id] ?? []) : [];

  const onChange = useCallback((fieldId: string, value: unknown) => {
    setState(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const canGoNext = stepIdx < visibleSteps.length - 1;
  const canGoPrev = stepIdx > 0;

  const stepErrors = currentStep
    ? Object.fromEntries(
        Object.entries(result?.errors ?? {}).filter(([k]) =>
          visibleFields.some(f => f.id === k),
        ),
      )
    : {};

  const hasStepErrors = Object.keys(stepErrors).length > 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, fontSize: 13, color: 'var(--color-muted)' }}>
        Loading…
      </div>
    );
  }

  if (!schema || !schema.steps?.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
        <div style={{ fontSize: 36 }}>🔧</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>No steps yet</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Add steps and fields in the Builder tab, then come back to preview.</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 8, letterSpacing: '-0.02em' }}>Request submitted!</div>
        <div style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: 24 }}>
          This is a preview — no actual lead was created.
        </div>
        {result && <PricingPanel result={result} />}
        <div style={{ marginTop: 24 }}>
          <Btn variant="secondary" onClick={() => { setSubmitted(false); setStepIdx(0); setState({}); }}>
            ← Reset preview
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main configurator area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        {/* Preview banner */}
        <div style={{
          marginBottom: 24, padding: '8px 14px', background: '#fef9c3', border: '1px solid #fde047',
          borderRadius: 'var(--radius-2)', fontSize: 12, color: '#713f12', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>Preview mode — changes are not saved. No leads created.</span>
          <button onClick={() => setShowJson(v => !v)} style={{ all: 'unset', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', textDecoration: 'underline' }}>
            {showJson ? 'Hide JSON' : 'Show state JSON'}
          </button>
        </div>

        {showJson && (
          <pre style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', padding: 16, fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 24, overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
            {JSON.stringify(state, null, 2)}
          </pre>
        )}

        {/* Step progress */}
        {visibleSteps.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 28, alignItems: 'center' }}>
            {visibleSteps.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center',
                  fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                  background: i < stepIdx ? '#16a34a' : i === stepIdx ? '#0a0a0a' : 'var(--color-surface)',
                  color: i <= stepIdx ? '#fff' : 'var(--color-text-3)',
                  border: `1px solid ${i <= stepIdx ? 'transparent' : 'var(--color-line-2)'}`,
                }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12, color: i === stepIdx ? 'var(--color-ink)' : 'var(--color-text-3)', fontWeight: i === stepIdx ? 500 : 400 }}>
                  {s.label}
                </span>
                {i < visibleSteps.length - 1 && (
                  <div style={{ width: 20, height: 1, background: 'var(--color-line-2)', marginLeft: 4 }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Current step */}
        {currentStep && (
          <div style={{ maxWidth: 620 }}>
            <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 6 }}>{currentStep.label}</h2>
            {currentStep.description && (
              <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: 24 }}>{currentStep.description}</p>
            )}
            <StepView
              step={currentStep}
              fields={visibleFields}
              state={state}
              errors={stepErrors}
              onChange={onChange}
            />

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
              <Btn variant="secondary" disabled={!canGoPrev} onClick={() => setStepIdx(i => i - 1)}>
                ← Back
              </Btn>
              {canGoNext ? (
                <Btn variant="primary" onClick={() => setStepIdx(i => i + 1)}>
                  Next →
                </Btn>
              ) : (
                <Btn variant="primary" onClick={() => setSubmitted(true)}>
                  Submit request →
                </Btn>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pricing sidebar */}
      {result && result.pricing.total > 0 && (
        <div style={{
          width: 280, borderLeft: '1px solid var(--color-line)', padding: '32px 24px',
          background: 'var(--color-surface)', overflowY: 'auto', flexShrink: 0,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>{schema.name}</div>
          <PricingPanel result={result} />
          {result.score.total > 0 && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#fff', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)' }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Lead score</div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{result.score.total}</div>
              {result.score.hot && <div style={{ fontSize: 11, color: '#fff', background: '#0a0a0a', borderRadius: 2, padding: '1px 5px', display: 'inline-block', marginTop: 4, fontFamily: 'var(--font-mono)' }}>HOT</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
