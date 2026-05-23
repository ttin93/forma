'use client';

import { use, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { evaluate } from '@forma/configurator-engine';
import type { ConfiguratorSchema, Field, Step, EvaluateResult } from '@forma/types';
import type { PergolaConfig, EnclosureType, EnclosureSegment } from '@/components/Pergola3D';

const Pergola3D = dynamic(
  () => import('@/components/Pergola3D').then(m => ({ default: m.Pergola3D })),
  { ssr: false, loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(175deg,#e8edf2,#d6dde6)' }}><div style={{ width: 28, height: 28, border: '2px solid #c8d0d8', borderTopColor: '#5a7a8a', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div> }
);

// model-viewer web component — no @types package exists
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': {
        src?: string; ar?: string; 'ar-modes'?: string;
        'camera-controls'?: string; 'shadow-intensity'?: string;
        alt?: string; style?: import('react').CSSProperties; id?: string; className?: string;
      };
    }
  }
}

const PERGOLA_3D_IDS = new Set([
  'width','sirina','širina','depth','globina','height','visina','višina',
  'color','barva','barva_okvirja','frame_color','structure_color','slats_color',
  'slats_type','lamelle_angle',
  'house_wall_front','house_wall_back','house_wall_left','house_wall_right',
  'post_front','post_rear','post_left','post_right',
  'enc_front_type','enc_back_type','enc_left_type','enc_right_type',
]);

function hasPergola3DFields(schema: ConfiguratorSchema): boolean {
  return schema.steps.some(s => s.fields.some(f => PERGOLA_3D_IDS.has(f.id)));
}

const VALID_ENC = new Set(['none','zip-screen','movable-slats','sliding-glass','fixed-glass','ventilation-panel','metal-panel']);

function extractPergolaConfig(st: Record<string, unknown>): PergolaConfig {
  const n = (keys: string[], fallback: number) => {
    for (const k of keys) {
      if (typeof st[k] === 'number') return st[k] as number;
      if (typeof st[k] === 'string' && st[k] !== '' && !isNaN(Number(st[k]))) return Number(st[k]);
    }
    return fallback;
  };
  const s = (keys: string[], fallback: string) => {
    for (const k of keys) if (typeof st[k] === 'string' && st[k]) return st[k] as string;
    return fallback;
  };
  const b = (...keys: string[]) => keys.some(k => Boolean(st[k]));
  const enc = (key: string): EnclosureType => {
    const v = st[key];
    return (typeof v === 'string' && VALID_ENC.has(v)) ? v as EnclosureType : 'none';
  };
  const seg = (typeKey: string, colorKey?: string): EnclosureSegment => ({
    type: enc(typeKey),
    colorHex: s(colorKey ? [colorKey, 'structure_color', 'color'] : ['structure_color', 'color'], '#383E42'),
  });
  const side = (typeKey: string, colorKey?: string): [EnclosureSegment, EnclosureSegment] =>
    [seg(typeKey, colorKey), seg(typeKey, colorKey)];

  return {
    width:  n(['width','sirina','širina'], 400),
    depth:  n(['depth','globina'], 300),
    height: n(['height','visina','višina'], 250),
    structureColor: s(['structure_color','color','barva','barva_okvirja','frame_color'], '#383E42'),
    slatsColor:     s(['slats_color','color','barva'], '#383E42'),
    slatsType:      st['slats_type'] === 'wavy' ? 'wavy' : 'flat',
    lamelleAngle:   n(['lamelle_angle','kot_lamel','angle'], 0),
    houseWalls: {
      front: b('house_wall_front'),
      back:  b('house_wall_back'),
      left:  b('house_wall_left'),
      right: b('house_wall_right'),
    },
    additionalPosts: {
      front: { enabled: b('post_front'), offset: n(['post_front_offset'], 0) },
      rear:  { enabled: b('post_rear'),  offset: n(['post_rear_offset'],  0) },
      left:  { enabled: b('post_left'),  offset: n(['post_left_offset'],  0) },
      right: { enabled: b('post_right'), offset: n(['post_right_offset'], 0) },
    },
    sideEnclosures: {
      front: side('enc_front_type', 'enc_front_color'),
      back:  side('enc_back_type',  'enc_back_color'),
      left:  side('enc_left_type',  'enc_left_color'),
      right: side('enc_right_type', 'enc_right_color'),
    },
  };
}

// ── Types ─────────────────────────────────────────────────────
interface PublicCfg {
  id: string;
  version: string;
  schema: ConfiguratorSchema;
  branding: { primary: string | null; logoUrl: string | null; font: string | null };
}

// ── Helpers ──────────────────────────────────────────────────
function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: currency || 'EUR', maximumFractionDigits: 0,
  }).format(cents / 100);
}

function postMsg(type: string, payload?: unknown) {
  try { window.parent.postMessage({ type: `__forma:${type}`, payload }, '*'); } catch {}
}

// ── CSS injected once ─────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;font-family:var(--fp,ui-sans-serif,system-ui,sans-serif);font-size:14px;color:#171717;background:#fff;line-height:1.5;-webkit-font-smoothing:antialiased}
:root{--c:#0a0a0a;--cl:#ececec;--cl2:#e3e3e3;--cs:#fafafa;--ct:#737373;--cm:#a3a3a3;--r2:6px;--r3:10px}
#forma-app{display:flex;flex-direction:column;min-height:100vh}
/* Stepper */
.fst{display:flex;align-items:center;padding:14px 32px;border-bottom:1px solid var(--cl);overflow-x:auto;scrollbar-width:none;background:#fff;flex-shrink:0}
.fst::-webkit-scrollbar{display:none}
.fss{display:flex;align-items:center;gap:7px;flex-shrink:0}
.fsn{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0;border:1px solid var(--cl2);background:#fff;color:var(--ct);transition:all .15s}
.fss.done .fsn{background:#16a34a;border-color:#16a34a;color:#fff}
.fss.active .fsn{background:var(--c);border-color:var(--c);color:#fff}
.fsl{font-size:12.5px;color:var(--ct);white-space:nowrap;transition:color .15s}
.fss.active .fsl{color:#171717;font-weight:500}
.fsc{width:24px;height:1px;background:var(--cl2);flex-shrink:0;margin:0 3px}
/* Body */
.fbd{display:flex;flex:1;min-height:0}
.f3d{flex:1.4;min-width:0;overflow:hidden;position:relative}
.frpanel{flex:1;display:flex;min-width:0;min-height:0;overflow:hidden;max-width:560px}
.fmn{flex:1;overflow-y:auto;padding:32px 40px 110px;min-width:0}
.fsb{width:272px;flex-shrink:0;border-left:1px solid var(--cl);background:var(--cs);overflow-y:auto;padding:24px 20px;display:flex;flex-direction:column;gap:14px}
/* Step header */
.fsh h2{font-size:22px;font-weight:600;letter-spacing:-.025em;margin:0 0 6px;line-height:1.2}
.fsh p{font-size:14px;color:var(--ct);margin:0 0 24px}
/* Fields */
.ffl{display:flex;flex-direction:column;gap:20px;max-width:540px}
.ffe{display:flex;flex-direction:column;gap:7px}
.fla{font-size:13px;font-weight:500;color:#525252}
.fhp{font-size:12px;color:var(--cm)}
.ferr{font-size:12px;color:#ef4444}
.req{color:#ef4444}
/* Inputs */
.fi{height:38px;padding:0 12px;border:1px solid var(--cl2);border-radius:var(--r2);font-family:inherit;font-size:14px;color:#171717;background:#fff;outline:none;width:100%;transition:border-color .15s}
.fi:focus{border-color:var(--c)}
.fsel{height:38px;padding:0 32px 0 12px;border:1px solid var(--cl2);border-radius:var(--r2);font-family:inherit;font-size:14px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center;appearance:none;outline:none;cursor:pointer;width:100%}
/* Slider */
.fslr{display:flex;flex-direction:column;gap:8px}
.fscv{font-size:20px;font-weight:700;font-family:ui-monospace,monospace;letter-spacing:-.02em}
.fslb{display:flex;justify-content:space-between;font-size:12px;color:var(--ct);font-family:ui-monospace,monospace}
input[type=range]{width:100%;appearance:none;height:4px;background:var(--cl2);border-radius:2px;outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{appearance:none;width:20px;height:20px;border-radius:50%;background:var(--c);cursor:pointer;border:3px solid #fff;box-shadow:0 0 0 1px var(--c)}
/* Radio */
.frg{display:grid;gap:8px}
.frb{display:flex;flex-direction:column;gap:3px;padding:12px 14px;border:1px solid var(--cl2);border-radius:var(--r2);background:#fff;cursor:pointer;font-family:inherit;text-align:left;transition:all .12s}
.frb:hover{border-color:#d4d4d4;background:var(--cs)}
.frb.act{border-color:var(--c);box-shadow:0 0 0 1px var(--c)}
.frbn{font-weight:500;font-size:13.5px}
.frbs{font-size:12px;color:var(--ct)}
.frbp{font-size:12px;font-family:ui-monospace,monospace;color:#525252;margin-top:3px}
/* Swatch */
.fsws{display:flex;gap:10px;flex-wrap:wrap}
.fsw{width:34px;height:34px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:transform .1s,box-shadow .1s}
.fsw:hover{transform:scale(1.1)}
.fsw.act{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--c)}
/* Checkbox */
.fcw{display:flex;align-items:flex-start;gap:12px;cursor:pointer;padding:12px 14px;border:1px solid var(--cl2);border-radius:var(--r2);transition:border-color .15s}
.fcw.act{border-color:var(--c)}
.fck{width:18px;height:18px;accent-color:var(--c);cursor:pointer;flex-shrink:0;margin-top:1px}
/* Multi-select */
.fmo{display:flex;flex-direction:column;gap:6px}
.fmop{display:flex;align-items:center;gap:12px;padding:11px 14px;border:1px solid var(--cl2);border-radius:var(--r2);cursor:pointer;transition:border-color .15s;background:#fff;user-select:none}
.fmop.act{border-color:var(--c)}
.fmcb{width:18px;height:18px;border:1px solid var(--cl2);border-radius:3px;background:#fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .12s}
.fmop.act .fmcb{background:var(--c);border-color:var(--c)}
/* Qty stepper */
.fqst{display:inline-flex;align-items:center;border:1px solid var(--cl2);border-radius:var(--r2);overflow:hidden}
.fqb{width:38px;height:38px;border:none;background:var(--cs);font-size:18px;color:#171717;cursor:pointer;display:flex;align-items:center;justify-content:center}
.fqb:hover:not(:disabled){background:var(--cl)}
.fqb:disabled{color:var(--cm);cursor:default}
.fqn{min-width:48px;text-align:center;font-family:ui-monospace,monospace;font-size:15px;border-left:1px solid var(--cl2);border-right:1px solid var(--cl2);padding:0 10px;line-height:38px}
/* Image pick */
.fig{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}
.fib{display:flex;flex-direction:column;align-items:center;gap:0;border:1px solid var(--cl2);border-radius:var(--r2);background:#fff;cursor:pointer;overflow:hidden;transition:border-color .15s}
.fib.act{border-color:var(--c);box-shadow:0 0 0 1px var(--c)}
.fib img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
.fib span{font-size:12px;color:#525252;text-align:center;padding:6px 8px}
/* Pricing sidebar */
.fpt{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.06em;font-family:ui-monospace,monospace;color:var(--cm);margin-bottom:4px}
.fptv{font-size:26px;font-weight:700;font-family:ui-monospace,monospace;letter-spacing:-.025em;line-height:1}
.fpvat{font-size:11.5px;color:var(--cm);margin:4px 0 14px}
.fpbd{display:flex;flex-direction:column;gap:7px;padding-top:12px;border-top:1px solid var(--cl)}
.fpbr{display:flex;justify-content:space-between;font-size:13px;color:#525252;gap:8px}
.fpbr.disc{color:#16a34a}
.fpbl{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fpba{font-family:ui-monospace,monospace;flex-shrink:0}
.fpsb{display:flex;justify-content:space-between;font-size:14px;font-weight:600;padding-top:10px;border-top:1px solid var(--cl);margin-top:4px}
.fpsba{font-family:ui-monospace,monospace}
/* Footer */
.fft{position:fixed;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:14px 40px;background:#fff;border-top:1px solid var(--cl);gap:16px;z-index:20}
.fpr{display:flex;flex-direction:column}
.fprl{font-size:10.5px;color:var(--cm);text-transform:uppercase;letter-spacing:.06em;font-family:ui-monospace,monospace;line-height:1;margin-bottom:3px}
.fprv{font-size:21px;font-weight:700;letter-spacing:-.025em;font-family:ui-monospace,monospace;line-height:1}
.fprvat{font-size:11px;color:var(--cm);margin-top:2px}
.fnv{display:flex;gap:8px;align-items:center}
/* Buttons */
.fbtn{display:inline-flex;align-items:center;gap:6px;font-family:inherit;font-size:13.5px;font-weight:500;height:38px;padding:0 18px;border-radius:var(--r2);border:1px solid transparent;cursor:pointer;white-space:nowrap;transition:opacity .15s,background .15s}
.fbtn:disabled{opacity:.45;cursor:default}
.fbtn-p{background:var(--c);color:#fff;border-color:var(--c);font-size:14px;height:40px;padding:0 22px}
.fbtn-p:hover:not(:disabled){opacity:.87}
.fbtn-g{background:transparent;color:#525252;border-color:var(--cl2)}
.fbtn-g:hover:not(:disabled){background:var(--cs)}
/* Loading / Error */
.fld{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;gap:16px;color:var(--ct);flex:1}
.fsp{width:28px;height:28px;border:2px solid var(--cl2);border-top-color:var(--c);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
/* Success */
.fscs{flex:1;display:flex;flex-direction:column;align-items:center;padding:56px 32px 80px;max-width:620px;margin:0 auto;width:100%;text-align:center}
.fsci{width:60px;height:60px;border-radius:50%;background:var(--c);color:#fff;font-size:30px;display:flex;align-items:center;justify-content:center;margin-bottom:22px}
.fscs h2{font-size:24px;font-weight:600;letter-spacing:-.025em;margin:0 0 8px;line-height:1.2}
.fscs p{font-size:14px;color:var(--ct);margin:0 0 8px;max-width:380px}
.fscr{font-family:ui-monospace,monospace;font-size:12px;color:var(--cm);background:var(--cs);border:1px solid var(--cl);border-radius:var(--r2);padding:5px 12px;margin-bottom:28px;letter-spacing:.04em}
.fsnxt{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%;margin-top:28px}
.fsnc{padding:14px;border:1px solid var(--cl);border-radius:var(--r2);text-align:left}
.fsnci{font-size:10.5px;font-family:ui-monospace,monospace;color:var(--cm);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
.fsncT{font-size:13px;font-weight:500;margin-bottom:3px}
.fsncd{font-size:12px;color:var(--ct);line-height:1.4}
.ferrbanner{padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:var(--r2);font-size:13px;color:#b91c1c;margin-bottom:18px}
/* Custom quote section */
.fcqs{margin-top:24px;padding:20px;border:1px solid var(--cl2);border-radius:var(--r3);background:var(--cs)}
.fcqs-h{display:flex;align-items:flex-start;gap:14px;margin-bottom:14px}
.fcqs-icon{width:40px;height:40px;border-radius:50%;background:var(--c);color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.fcqs-title{font-size:15px;font-weight:600;margin:0 0 3px;letter-spacing:-.015em}
.fcqs-sub{font-size:13px;color:var(--ct);margin:0}
.fcqs-badge{display:inline-block;font-size:10.5px;font-family:ui-monospace,monospace;font-weight:600;color:#92400e;background:#fef3c7;border:1px solid #fcd34d;border-radius:3px;padding:2px 7px;letter-spacing:.03em;margin-left:8px;vertical-align:middle}
.fcqs-txt{width:100%;min-height:80px;border:1px solid var(--cl2);border-radius:var(--r2);padding:10px 12px;font-family:inherit;font-size:13.5px;resize:vertical;outline:none;line-height:1.5;background:#fff;box-sizing:border-box;margin-bottom:12px}
.fcqs-txt:focus{border-color:var(--c)}
.fcqs-ph{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fcqs-prev{width:56px;height:56px;border-radius:var(--r2);object-fit:cover;border:1px solid var(--cl2);flex-shrink:0}
.fcqs-lbl{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid var(--cl2);border-radius:var(--r2);cursor:pointer;font-size:13px;color:#525252;background:#fff;transition:border-color .15s;font-family:inherit}
.fcqs-lbl:hover{border-color:#d4d4d4}
.fcqs-rm{font-size:12px;color:var(--cm);background:none;border:none;cursor:pointer;padding:4px 6px;font-family:inherit}
/* AR viewer */
.f3d-ar-btn{position:absolute;bottom:14px;right:14px;display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:rgba(10,10,10,.78);color:#fff;border:none;border-radius:var(--r2);font-size:12.5px;font-weight:500;cursor:pointer;font-family:inherit;backdrop-filter:blur(8px);z-index:10;transition:opacity .15s;letter-spacing:.01em}
.f3d-ar-btn:hover:not(:disabled){opacity:.82}
.f3d-ar-btn:disabled{opacity:.5;cursor:default}
.f3d-ar-btn-m{display:none}
.f3d-ar-overlay{position:fixed;inset:0;z-index:9999;background:#111;display:flex;flex-direction:column}
.f3d-ar-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.12);flex-shrink:0}
.f3d-ar-title{font-size:14.5px;font-weight:500;color:#fff;letter-spacing:-.01em}
.f3d-ar-close{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;font-family:inherit}
.f3d-ar-hint{padding:10px 20px 14px;text-align:center;font-size:12px;color:#666;flex-shrink:0}
@media(max-width:960px){.f3d{display:none!important}.frpanel{max-width:none!important;flex:1!important}.f3d-ar-btn-m{display:inline-flex}}
@media(max-width:700px){.fsb{display:none}.fmn{padding:24px 20px 100px}.fft{padding:12px 20px}.fst{padding:12px 20px}.fsl{display:none}.fsnxt{grid-template-columns:1fr}.fscs{padding:40px 20px 80px}}
`;

// ── Field renderer ────────────────────────────────────────────

function fmtPrice(p: { amount: number; currency: string }) {
  return fmt(p.amount * 100, p.currency);
}

function FieldComp({ field, value, onChange, error }: {
  field: Field; value: unknown; onChange: (v: unknown) => void; error?: string;
}) {
  switch (field.type) {
    case 'number-slider': {
      const v = typeof value === 'number' ? value : field.default;
      return (
        <div className="fslr">
          <div className="fscv">{v} {field.unit}</div>
          <input type="range" min={field.min} max={field.max} step={field.step} value={v}
            onChange={e => onChange(parseFloat(e.target.value))} />
          <div className="fslb"><span>{field.min} {field.unit}</span><span>{field.max} {field.unit}</span></div>
        </div>
      );
    }
    case 'number-input': {
      const v = typeof value === 'number' ? value : (field.default ?? 0);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="number" className="fi" style={{ width: 120 }} min={field.min} max={field.max}
            step={field.step ?? 1} value={v} onChange={e => onChange(parseFloat(e.target.value))} />
          {field.unit && <span style={{ fontSize: 13, color: 'var(--cm)' }}>{field.unit}</span>}
        </div>
      );
    }
    case 'quantity': {
      const v = typeof value === 'number' ? value : (field.default ?? 0);
      return (
        <div className="fqst">
          <button className="fqb" disabled={v <= (field.min ?? 0)} onClick={() => onChange(v - 1)}>−</button>
          <span className="fqn">{v}</span>
          <button className="fqb" disabled={field.max !== undefined && v >= field.max} onClick={() => onChange(v + 1)}>+</button>
        </div>
      );
    }
    case 'text':
      return <input type="text" className="fi" value={String(value ?? '')} onChange={e => onChange(e.target.value)} />;
    case 'email':
      return <input type="email" className="fi" value={String(value ?? '')} placeholder="email@example.com" onChange={e => onChange(e.target.value)} />;
    case 'phone':
      return <input type="tel" className="fi" value={String(value ?? '')} onChange={e => onChange(e.target.value)} />;
    case 'select':
      return (
        <select className="fsel" value={String(value ?? '')} onChange={e => onChange(e.target.value)}>
          <option value="">Select…</option>
          {field.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      );
    case 'radio': {
      const v = typeof value === 'string' ? value : (field.default ?? '');
      const cols = field.columns ?? 2;
      return (
        <div className="frg" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {field.options.map(o => (
            <button key={o.id} className={`frb${v === o.id ? ' act' : ''}`} onClick={() => onChange(o.id)}>
              <span className="frbn">{o.label}</span>
              {o.sublabel && <span className="frbs">{o.sublabel}</span>}
              {o.price && <span className="frbp">+{fmtPrice(o.price)}</span>}
            </button>
          ))}
        </div>
      );
    }
    case 'swatch': {
      const v = typeof value === 'string' ? value : (field.default ?? '');
      return (
        <div>
          <div className="fsws">
            {field.options.map(o => (
              <button key={o.id} className={`fsw${v === o.id ? ' act' : ''}`}
                style={{ background: o.color }} title={o.label}
                onClick={() => onChange(o.id)} />
            ))}
          </div>
          {v && <div style={{ fontSize: 12.5, color: '#525252', marginTop: 6 }}>
            {field.options.find(o => o.id === v)?.label}
          </div>}
        </div>
      );
    }
    case 'checkbox': {
      const v = typeof value === 'boolean' ? value : (field.default ?? false);
      return (
        <label className={`fcw${v ? ' act' : ''}`} onClick={() => onChange(!v)}>
          <input type="checkbox" className="fck" checked={v} onChange={() => {}} />
          <span style={{ fontSize: 13.5 }}>{field.label}</span>
        </label>
      );
    }
    case 'multi-select': {
      const v = new Set(Array.isArray(value) ? value as string[] : (field.default ?? []));
      return (
        <div className="fmo">
          {field.options.map(o => {
            const on = v.has(o.id);
            return (
              <div key={o.id} className={`fmop${on ? ' act' : ''}`} onClick={() => {
                const next = new Set(v);
                on ? next.delete(o.id) : next.add(o.id);
                onChange(Array.from(next));
              }}>
                <div className="fmcb">
                  {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M4 12l5 5L20 6"/></svg>}
                </div>
                <span style={{ fontSize: 13.5 }}>{o.label}</span>
              </div>
            );
          })}
        </div>
      );
    }
    case 'image-pick': {
      const v = typeof value === 'string' ? value : (field.default ?? '');
      return (
        <div className="fig">
          {field.options.map(o => (
            <button key={o.id} className={`fib${v === o.id ? ' act' : ''}`} onClick={() => onChange(o.id)}>
              <img src={o.imageUrl} alt={o.label} loading="lazy" />
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      );
    }
    case 'date':
      return <input type="date" className="fi" value={String(value ?? '')} min={field.min} max={field.max} onChange={e => onChange(e.target.value)} />;
    default:
      return <input type="text" className="fi" value={String(value ?? '')} onChange={e => onChange(e.target.value)} />;
  }
}

// ── Main page ─────────────────────────────────────────────────

export default function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [cfg, setCfg] = useState<PublicCfg | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [state, setState] = useState<Record<string, unknown>>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [leadRef, setLeadRef] = useState('');
  const [submitErr, setSubmitErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [arUrl, setArUrl] = useState<string | null>(null);
  const [arLoading, setArLoading] = useState(false);
  const exportGlbRef = useRef<(() => Promise<Blob>) | null>(null);
  const styleRef = useRef(false);

  // Inject isolated CSS once
  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);

  // Load schema from public API (preview=1 bypasses live-only check for admins)
  useEffect(() => {
    const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
    fetch(`/api/v1/public/configurators/${id}${preview ? '?preview=1' : ''}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: PublicCfg) => {
        // Apply branding CSS vars
        if (d.branding.primary) {
          document.documentElement.style.setProperty('--c', d.branding.primary);
        }
        if (d.branding.font) {
          document.documentElement.style.setProperty('--fp', `"${d.branding.font}", ui-sans-serif, sans-serif`);
        }
        document.title = d.schema.name;
        setCfg(d);
      })
      .catch(() => setLoadErr('This configurator is not available.'));
  }, [id]);

  const schema = cfg?.schema ?? null;
  const result: EvaluateResult | null = schema ? evaluate(schema, state) : null;
  const visibleSteps = result?.visibleSteps ?? [];
  const currentStep = visibleSteps[stepIdx] ?? null;
  const visibleFields = currentStep ? (result?.visibleFields[currentStep.id] ?? []) : [];

  const show3d = useMemo(() => schema ? hasPergola3DFields(schema) : false, [schema]);
  const pergolaConfig = useMemo(() => extractPergolaConfig(state), [state]);

  const onChange = useCallback((fieldId: string, value: unknown) => {
    setState(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  // Notify parent of resize + price
  useEffect(() => {
    postMsg('resize', { height: document.body.scrollHeight });
    if (result) postMsg('price', { total: result.pricing.total, currency: result.pricing.currency });
  });

  async function handleSubmit() {
    if (!cfg || !result || submitting) return;
    setSubmitting(true);
    setSubmitErr('');
    try {
      const submitState: Record<string, unknown> = { ...state };
      if (customText.trim()) submitState._custom_request_text = customText.trim();
      if (customPhoto) submitState._custom_request_photo = customPhoto;
      const res = await fetch(`/api/v1/public/configurators/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: cfg.version, state: submitState }),
      });
      const text = await res.text();
      let json: Record<string, unknown> = {};
      try { if (text.trim()) json = JSON.parse(text); } catch { /* non-JSON body, use empty */ }
      if (!res.ok) throw new Error(String(json.error ?? `Server error (${res.status})`))
      setLeadRef(String(json.ref ?? ''));
      setSubmitted(true);
      postMsg('submitted', { leadRef: json.ref });
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAR() {
    if (arLoading || !exportGlbRef.current) return;
    setArLoading(true);
    try {
      if (typeof customElements !== 'undefined' && !customElements.get('model-viewer')) {
        await new Promise<void>((resolve, reject) => {
          if (document.querySelector('script[data-mv]')) { resolve(); return; }
          const s = document.createElement('script');
          s.type = 'module';
          s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
          s.setAttribute('data-mv', '1');
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('model-viewer load failed'));
          document.head.appendChild(s);
        });
      }
      const blob = await exportGlbRef.current();
      const url = URL.createObjectURL(blob);
      setArUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    } catch (e) {
      console.error('AR export failed', e);
    } finally {
      setArLoading(false);
    }
  }

  function closeAr() {
    setArUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
  }

  // ── Loading ───────────────────────────────────────────────
  if (loadErr) {
    return (
      <div id="forma-app">
        <div className="fld">
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ color: '#737373', fontSize: 14 }}>{loadErr}</p>
        </div>
      </div>
    );
  }

  if (!cfg || !schema || !result) {
    return (
      <div id="forma-app">
        <div className="fld"><div className="fsp" /><p style={{ color: '#737373' }}>Loading…</p></div>
      </div>
    );
  }

  if (!schema.steps?.length) {
    return (
      <div id="forma-app">
        <div className="fld"><p style={{ color: '#737373' }}>This configurator has no steps yet.</p></div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────
  if (submitted) {
    const name = String(state.name ?? state.full_name ?? state.first_name ?? '');
    const greeting = name ? `Thanks, ${name.split(' ')[0]}.` : 'Thank you!';
    const total = result.pricing.total > 0 ? fmt(result.pricing.total, result.pricing.currency || schema.currency) : '';
    return (
      <div id="forma-app">
        <div className="fscs">
          <div className="fsci">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M4 12l5 5L20 6"/></svg>
          </div>
          <h2>{greeting}</h2>
          <p>Your quote request has been received. We&apos;ll get back to you with a personalised quote.</p>
          {leadRef && <div className="fscr">Ref: {leadRef}</div>}
          {total && (
            <div style={{ padding: '14px 20px', border: '1px solid #ececec', borderRadius: 10, marginBottom: 24, width: '100%', textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: '#a3a3a3', fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Your estimate</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'ui-monospace,monospace', letterSpacing: '-.02em' }}>{total}</div>
            </div>
          )}
          <div className="fsnxt">
            {[
              { n: '01', t: 'Review your design', d: 'Our team will review your configuration and prepare a quote.' },
              { n: '02', t: 'Receive your quote', d: 'Detailed PDF quote by email within 1 business day.' },
              { n: '03', t: 'Free consultation', d: 'Book a free call to discuss your project and customisations.' },
            ].map(s => (
              <div key={s.n} className="fsnc">
                <div className="fsnci">{s.n}</div>
                <div className="fsncT">{s.t}</div>
                <div className="fsncd">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isLast = stepIdx === visibleSteps.length - 1;
  const pricing = result.pricing;

  // ── Main configurator ─────────────────────────────────────
  return (
    <div id="forma-app">
      {/* Stepper */}
      {visibleSteps.length > 1 && (
        <div className="fst">
          {visibleSteps.map((s, i) => (
            <>
              {i > 0 && <div key={`c${i}`} className="fsc" />}
              <div key={s.id} className={`fss${i < stepIdx ? ' done' : i === stepIdx ? ' active' : ''}`}>
                <div className="fsn">
                  {i < stepIdx
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12l5 5L20 6"/></svg>
                    : i + 1}
                </div>
                <span className="fsl">{s.label}</span>
              </div>
            </>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="fbd">

        {/* 3D viewer — only for configurators with dimensional fields */}
        {show3d && (
          <div className="f3d">
            <Pergola3D cfg={pergolaConfig} exportRef={exportGlbRef} />
            <button className="f3d-ar-btn" onClick={handleAR} disabled={arLoading} title="Poglej pergolo v svojem prostoru">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              {arLoading ? 'Pripravljam…' : 'Poglej v AR'}
            </button>
          </div>
        )}

        {/* Form + pricing panel */}
        <div className={show3d ? 'frpanel' : 'fbd'} style={show3d ? undefined : { flex: 1 }}>
          <div className="fmn">
            {submitErr && <div className="ferrbanner">{submitErr}</div>}

            {currentStep && (
              <>
                <div className="fsh">
                  <h2>{currentStep.label}</h2>
                  {currentStep.description && <p>{currentStep.description}</p>}
                </div>
                <div className="ffl">
                  {visibleFields.map(field => {
                    const isCheck = field.type === 'checkbox';
                    const err = result.errors[field.id];
                    return (
                      <div key={field.id} className="ffe">
                        {!isCheck && (
                          <label className="fla">
                            {field.label}
                            {field.required && <span className="req"> *</span>}
                          </label>
                        )}
                        {!isCheck && field.help && <span className="fhp">{field.help}</span>}
                        <FieldComp field={field} value={state[field.id]} onChange={v => onChange(field.id, v)} error={err} />
                        {err && state[field.id] !== undefined && <span className="ferr">{err}</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Individualna ponudba — only on last step */}
                {isLast && (
                  <div className="fcqs">
                    <div className="fcqs-h">
                      <div className="fcqs-icon">✦</div>
                      <div>
                        <p className="fcqs-title">
                          Posebna zahteva?
                          <span className="fcqs-badge">Odgovor v 48h</span>
                        </p>
                        <p className="fcqs-sub">Pošljite sliko ali opis — naredimo individualno ponudbo po vaši meri.</p>
                      </div>
                    </div>
                    <textarea
                      className="fcqs-txt"
                      placeholder="Opišite svojo posebno zahtevo (npr. nestandardne dimenzije, posebna barva, specifična montaža…)"
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                    />
                    <div className="fcqs-ph">
                      {customPhoto && <img src={customPhoto} className="fcqs-prev" alt="" />}
                      <label className="fcqs-lbl">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        {customPhoto ? 'Zamenjaj sliko' : 'Priloži sliko (neobvezno)'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = evt => setCustomPhoto((evt.target?.result as string) ?? null);
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                      {customPhoto && (
                        <button className="fcqs-rm" onClick={() => setCustomPhoto(null)}>× Odstrani</button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pricing sidebar */}
          {pricing.total > 0 && (
            <div className="fsb">
              <div className="fpt">Estimated price</div>
              <div className="fptv">{fmt(pricing.total, pricing.currency || schema.currency)}</div>
              <div className="fpvat">{pricing.vat > 0 ? `incl. ${fmt(pricing.vat, pricing.currency || schema.currency)} VAT` : 'excl. VAT'}</div>
              {pricing.breakdown.length > 0 && (
                <div className="fpbd">
                  {pricing.breakdown.map((item, i) => (
                    <div key={i} className={`fpbr${item.kind === 'discount' ? ' disc' : ''}`}>
                      <span className="fpbl">{item.label}</span>
                      <span className="fpba">
                        {item.kind === 'discount' ? '−' : ''}{fmt(Math.abs(item.amount), pricing.currency || schema.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="fpsb">
                    <span>Total</span>
                    <span className="fpsba">{fmt(pricing.total, pricing.currency || schema.currency)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fft">
        <div className="fpr" id="fp-display">
          <span className="fprl">Estimated price</span>
          <span className="fprv">{pricing.total > 0 ? fmt(pricing.total, pricing.currency || schema.currency) : '—'}</span>
          {pricing.vat > 0 && <span className="fprvat">incl. VAT</span>}
        </div>
        <div className="fnv">
          {show3d && (
            <button className="fbtn fbtn-g f3d-ar-btn-m" onClick={handleAR} disabled={arLoading} title="Poglej v AR">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              {arLoading ? '…' : 'AR'}
            </button>
          )}
          {stepIdx > 0 && (
            <button className="fbtn fbtn-g" onClick={() => setStepIdx(i => i - 1)}>← Back</button>
          )}
          {isLast ? (
            <button className="fbtn fbtn-p" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Sending…' : 'Get my quote →'}
            </button>
          ) : (
            <button className="fbtn fbtn-p" onClick={() => setStepIdx(i => i + 1)}>Continue →</button>
          )}
        </div>
      </div>

      {/* AR overlay — model-viewer web component loaded lazily from CDN */}
      {arUrl && (
        <div className="f3d-ar-overlay">
          <div className="f3d-ar-topbar">
            <span className="f3d-ar-title">AR — Vaša pergola v prostoru</span>
            <button className="f3d-ar-close" onClick={closeAr} aria-label="Zapri">×</button>
          </div>
          <model-viewer
            src={arUrl}
            ar=""
            ar-modes="scene-viewer webxr quick-look"
            camera-controls=""
            shadow-intensity="1"
            alt="Vaša konfigurirana pergola"
            style={{ width: '100%', flex: 1, background: '#1a1a1a' }}
          />
          <div className="f3d-ar-hint">
            Tapnite gumb AR v ogledalniku · deluje na Android (ARCore) in iOS (Quick Look)
          </div>
        </div>
      )}
    </div>
  );
}
