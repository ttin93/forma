'use client';

import { use, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { PergolaConfig, EnclosureType, EnclosureSegment, CameraView, LEDSides } from '@/components/Pergola3D';

const Pergola3D = dynamic(
  () => import('@/components/Pergola3D').then(m => ({ default: m.Pergola3D })),
  { ssr: false, loading: () => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(175deg,#e8edf2,#d6dde6)' }}><div style={{ width: 28, height: 28, border: '2px solid #c8d0d8', borderTopColor: '#5a7a8a', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div> }
);

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

// ── Types ──────────────────────────────────────────────────────────────────────

interface PublicCfg {
  id: string; version: string;
  schema: { name: string; currency: string };
  branding: { primary: string | null; logoUrl: string | null; font: string | null };
}

type SlatsType   = 'flat' | 'wavy';
type ElecPkg     = 'nello' | 'somfy';
type ColorCat    = 'standard' | 'ral' | 'wood' | 'special';
type SlatsCat    = 'standard' | 'ral' | 'special';
interface ColorOption { id: string; name: string; hex: string }
interface SelectedColor { category: ColorCat | SlatsCat; id: string; name: string; hex: string }
interface EncSeg { type: EnclosureType; colorHex: string; colorName: string }
interface PostEntry { enabled: boolean; offset: number }

interface PConfig {
  // Dimensions (mm)
  width: number; depth: number; height: number;
  slatsType: SlatsType;
  houseWalls: { front: boolean; back: boolean; left: boolean; right: boolean };
  additionalPosts: { front: PostEntry; rear: PostEntry; left: PostEntry; right: PostEntry };
  structureColor: SelectedColor;
  slatsColor: SelectedColor;
  sideEnclosures: { front: [EncSeg, EncSeg]; back: [EncSeg, EncSeg]; left: [EncSeg, EncSeg]; right: [EncSeg, EncSeg] };
  ledEdgeEnabled: boolean;
  ledEdgeSides: LEDSides;
  ledStructureEnabled: boolean;
  electricalPackage: ElecPkg;
  heatersEnabled: boolean;
  premiumCoatingEnabled: boolean;
  snowLoadEnabled: boolean;
}

// ── Color data ──────────────────────────────────────────────────────────────────

const COLORS: Record<ColorCat, ColorOption[]> = {
  standard: [
    { id: 'ral-7016', name: 'RAL 7016 Antracit',  hex: '#383E42' },
    { id: 'sand',     name: 'Pesek',               hex: '#B8A88A' },
    { id: 'white',    name: 'Bela',                hex: '#F1F0EA' },
    { id: 'titanium', name: 'Titanij',             hex: '#8E9097' },
  ],
  ral: [
    { id: 'ral-9016', name: 'RAL 9016 Bela',       hex: '#F7F9F0' },
    { id: 'ral-7015', name: 'RAL 7015 Skrilnata',  hex: '#4D5057' },
    { id: 'ral-6005', name: 'RAL 6005 Zelena',     hex: '#2E4B3A' },
    { id: 'ral-5010', name: 'RAL 5010 Modra',      hex: '#0E4F9E' },
    { id: 'ral-3009', name: 'RAL 3009 Rdeča',      hex: '#8E3623' },
    { id: 'ral-8004', name: 'RAL 8004 Opečna',     hex: '#8D4E2C' },
  ],
  wood: [
    { id: 'teak',   name: 'Teak',  hex: '#8B6914' },
    { id: 'oak',    name: 'Hrast', hex: '#B8860B' },
    { id: 'walnut', name: 'Oreh',  hex: '#5C3D1E' },
  ],
  special: [
    { id: 'champagne', name: 'Šampanjec', hex: '#C4A664' },
    { id: 'bronze',    name: 'Bron',      hex: '#6B4226' },
    { id: 'copper',    name: 'Baker',     hex: '#B87333' },
  ],
};
const SLATS_COLORS: Record<SlatsCat, ColorOption[]> = {
  standard: COLORS.standard,
  ral:      COLORS.ral,
  special:  COLORS.special,
};

const DEFAULT_STRUCT: SelectedColor = { category: 'standard', id: 'ral-7016', name: 'RAL 7016 Antracit', hex: '#383E42' };
const DEFAULT_SLATS:  SelectedColor = { category: 'standard', id: 'ral-7016', name: 'RAL 7016 Antracit', hex: '#383E42' };

// ── Pricing ──────────────────────────────────────────────────────────────────────

const BASE_PRICE   = 8200;
const BASE_SQM     = 12.0;
const PER_SQM      = 420;
const POST_PRICE   = 220;
const WALL_DISC    = -60;
const SOMFY_PRICE  = 520;
const LED_EDGE_PM  = 38;    // per meter
const LED_STRUCT   = 420;   // flat fee
const HEATER_PRICE = 980;
const COATING_PRICE= 210;
const SNOW_PRICE   = 380;
const COLOR_SURCHARGE: Record<string, number> = { standard: 0, ral: 180, wood: 340, special: 580 };
const ENC_PRICE: Record<string, { base: number; perM: number }> = {
  'zip-screen':        { base: 360, perM: 82 },
  'movable-slats':     { base: 400, perM: 98 },
  'sliding-glass':     { base: 620, perM: 140 },
  'fixed-glass':       { base: 460, perM: 108 },
  'ventilation-panel': { base: 320, perM: 68 },
  'metal-panel':       { base: 290, perM: 60 },
};

interface LineItem { label: string; amount: number }

function calcBreakdown(c: PConfig): LineItem[] {
  const items: LineItem[] = [];
  const areaM2 = (c.width / 1000) * (c.depth / 1000);
  items.push({ label: 'Osnovna cena', amount: BASE_PRICE });
  const areaDiff = areaM2 - BASE_SQM;
  if (Math.abs(areaDiff) > 0.01)
    items.push({ label: `Površina (${areaM2.toFixed(2)} m²)`, amount: Math.round(areaDiff * PER_SQM) });
  const wallCount = Object.values(c.houseWalls).filter(Boolean).length;
  if (wallCount > 0)
    items.push({ label: `Stene hiše (${wallCount}×)`, amount: wallCount * WALL_DISC });
  const postCount = Object.values(c.additionalPosts).filter(p => p.enabled).length;
  if (postCount > 0)
    items.push({ label: `Dodatni stebri (${postCount}×)`, amount: postCount * POST_PRICE });
  const scAdj = COLOR_SURCHARGE[c.structureColor.category] ?? 0;
  if (scAdj > 0) items.push({ label: `Barva konstr. (${c.structureColor.name})`, amount: scAdj });
  const slAdj = COLOR_SURCHARGE[c.slatsColor.category] ?? 0;
  if (slAdj > 0) items.push({ label: `Barva lamel (${c.slatsColor.name})`, amount: slAdj });
  const sides = ['front','back','left','right'] as const;
  const sideLabels = { front: 'Spredaj', back: 'Zadaj', left: 'Levo', right: 'Desno' };
  sides.forEach(side => {
    const span = (side === 'front' || side === 'back') ? c.width / 1000 : c.depth / 1000;
    c.sideEnclosures[side].forEach((seg, si) => {
      if (seg.type === 'none') return;
      const p = ENC_PRICE[seg.type];
      if (!p) return;
      items.push({ label: `Zapora ${sideLabels[side]}${si > 0 ? ' (2)' : ''}`, amount: Math.round(p.base + p.perM * span) });
    });
  });
  if (c.electricalPackage === 'somfy')
    items.push({ label: 'Somfy io paket', amount: SOMFY_PRICE });
  if (c.ledEdgeEnabled) {
    const W = c.width / 1000; const D = c.depth / 1000;
    const m = (c.ledEdgeSides.front ? W : 0) + (c.ledEdgeSides.back ? W : 0) + (c.ledEdgeSides.left ? D : 0) + (c.ledEdgeSides.right ? D : 0);
    if (m > 0) items.push({ label: `LED notranji (${m.toFixed(1)} m)`, amount: Math.round(m * LED_EDGE_PM) });
  }
  if (c.ledStructureEnabled) items.push({ label: 'LED zunanji (robovi)', amount: LED_STRUCT });
  if (c.heatersEnabled)         items.push({ label: 'Infrardeči grelci (2×)', amount: HEATER_PRICE });
  if (c.premiumCoatingEnabled)  items.push({ label: 'Premium zaščitni premaz', amount: COATING_PRICE });
  if (c.snowLoadEnabled)        items.push({ label: 'Ojačitev za sneg', amount: SNOW_PRICE });
  return items;
}

function calcTotal(c: PConfig) { return calcBreakdown(c).reduce((s, i) => s + i.amount, 0); }
function fmtEur(n: number) { return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }); }

// ── Helpers ──────────────────────────────────────────────────────────────────────

function postMsg(type: string, payload?: unknown) {
  try { window.parent.postMessage({ type: `__forma:${type}`, payload }, '*'); } catch {}
}
function defaultSeg(): EncSeg { return { type: 'none', colorHex: '#383E42', colorName: 'Antracit' }; }
function defaultSide(): [EncSeg, EncSeg] { return [defaultSeg(), defaultSeg()]; }
function defaultConfig(): PConfig {
  return {
    width: 4200, depth: 3000, height: 2500,
    slatsType: 'flat',
    houseWalls: { front: false, back: false, left: false, right: false },
    additionalPosts: {
      front: { enabled: false, offset: 0 },
      rear:  { enabled: false, offset: 0 },
      left:  { enabled: false, offset: 0 },
      right: { enabled: false, offset: 0 },
    },
    structureColor: DEFAULT_STRUCT,
    slatsColor:     DEFAULT_SLATS,
    sideEnclosures: { front: defaultSide(), back: defaultSide(), left: defaultSide(), right: defaultSide() },
    ledEdgeEnabled: false,
    ledEdgeSides: { front: true, back: true, left: true, right: true },
    ledStructureEnabled: false,
    electricalPackage: 'nello',
    heatersEnabled: false,
    premiumCoatingEnabled: false,
    snowLoadEnabled: false,
  };
}

// ── CSS ──────────────────────────────────────────────────────────────────────────

const CSS = `
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;font-family:var(--fp,ui-sans-serif,system-ui,sans-serif);font-size:14px;color:#171717;background:#f0f2f5;line-height:1.5;-webkit-font-smoothing:antialiased}
:root{--c:#111827;--cl:#f3f4f6;--cl2:#e5e7eb;--cs:#f8fafc;--ct:#6b7280;--cm:#9ca3af;--r2:8px;--r3:12px}
#pergola-app{display:flex;height:100vh;overflow:hidden;background:#f0f2f5}
.f-3d-col{flex:1;display:flex;flex-direction:column;position:relative;min-width:0}
.f-3d-tabs{display:flex;align-items:center;gap:4px;padding:8px 12px;background:#fff;border-bottom:1px solid var(--cl2);flex-shrink:0}
.f-3d-tab{padding:5px 12px;border-radius:6px;border:none;font-size:12px;cursor:pointer;font-family:inherit;transition:all .12s;background:transparent;color:var(--ct)}
.f-3d-tab:hover:not(.act){background:var(--cl)}
.f-3d-tab.act{background:var(--c);color:#fff}
.f-3d-canvas{flex:1;min-height:0;position:relative}
.f-3d-bar{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;background:#fff;border-top:1px solid var(--cl2);font-size:12px;flex-shrink:0;color:var(--ct)}
.f-3d-bar-val{font-family:ui-monospace,monospace;color:#374151}
.f-ar-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;background:rgba(17,24,39,.85);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;backdrop-filter:blur(8px);transition:opacity .15s;margin-left:auto}
.f-ar-btn:hover:not(:disabled){opacity:.8}
.f-ar-btn:disabled{opacity:.45;cursor:default}
.f-sidebar{width:380px;flex-shrink:0;display:flex;flex-direction:column;background:#fff;border-left:1px solid var(--cl2);overflow:hidden}
.f-sidebar-hdr{padding:18px 20px;background:var(--c);flex-shrink:0}
.f-sidebar-name{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1.15;margin-bottom:3px}
.f-sidebar-sub{font-size:11px;color:#6b7280;display:flex;align-items:center;gap:6px}
.f-sidebar-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.4)}
.f-sidebar-scroll{flex:1;overflow-y:auto;background:#f8f9fa}
.f-sidebar-scroll::-webkit-scrollbar{width:4px}
.f-sidebar-scroll::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:2px}
.f-step{border-bottom:1px solid var(--cl)}
.f-step-hdr{display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;transition:background .1s;text-align:left;width:100%;border:none;background:transparent;font-family:inherit}
.f-step-hdr:hover{background:#f9fafb}
.f-step-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;transition:all .15s}
.f-step-num.open{background:var(--c);color:#fff}
.f-step-num.closed{background:var(--cl);color:var(--cm)}
.f-step-title{font-size:13px;font-weight:700;color:#111827;flex:1;min-width:0;text-align:left}
.f-step-summary{font-size:11px;color:var(--cm);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.f-step-chev{flex-shrink:0;color:#d1d5db;transition:transform .2s}
.f-step-chev.open{transform:rotate(180deg);color:var(--ct)}
.f-step-body{margin:0 16px 14px;border-left:3px solid var(--c);border-radius:0 0 10px 10px}
.f-step-inner{padding:14px 14px;background:#fff;border:1px solid var(--cl);border-top:none;border-radius:0 0 10px 10px}
.f-pricebar{flex-shrink:0;background:#fff;border-top:1px solid var(--cl2);padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.f-price-lbl{font-size:10px;font-family:ui-monospace,monospace;color:var(--cm);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
.f-price-val{font-size:22px;font-weight:700;font-family:ui-monospace,monospace;letter-spacing:-.02em;color:var(--c);line-height:1}
.f-price-sub{font-size:11px;color:var(--ct);margin-top:2px}
.f-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;font-size:13.5px;font-weight:600;height:40px;padding:0 20px;border-radius:8px;border:none;cursor:pointer;transition:opacity .15s,background .15s;white-space:nowrap}
.f-btn:disabled{opacity:.45;cursor:default}
.f-btn-p{background:var(--c);color:#fff}
.f-btn-p:hover:not(:disabled){opacity:.85}
.f-btn-g{background:#fff;color:#374151;border:1px solid var(--cl2)}
.f-btn-g:hover:not(:disabled){background:var(--cl)}
input[type=range]{width:100%;appearance:none;height:4px;background:var(--cl2);border-radius:2px;outline:none;cursor:pointer;accent-color:var(--c)}
input[type=range]::-webkit-slider-thumb{appearance:none;width:18px;height:18px;border-radius:50%;background:var(--c);cursor:pointer;border:3px solid #fff;box-shadow:0 0 0 1px var(--c)}
.f-toggle-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:2px solid var(--cl);cursor:pointer;transition:all .12s;width:100%;background:#fff;font-family:inherit;text-align:left}
.f-toggle-row.on{border-color:var(--c);background:var(--cs)}
.f-toggle-row:hover:not(.on){border-color:#d1d5db;background:#fafafa}
.f-toggle-check{width:20px;height:20px;border-radius:50%;border:2px solid #d1d5db;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s}
.f-toggle-row.on .f-toggle-check{background:var(--c);border-color:var(--c)}
.f-toggle-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;background:var(--cl)}
.f-toggle-row.on .f-toggle-icon{background:#e2e8f0}
.f-dir-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.f-dir-btn{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;border:2px solid var(--cl);cursor:pointer;transition:all .12s;background:#fff;font-family:inherit;text-align:left}
.f-dir-btn.on{border-color:var(--c);background:var(--cs)}
.f-dir-btn:hover:not(.on){border-color:#d1d5db}
.f-dir-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;transition:all .12s;background:var(--cl);color:var(--cm)}
.f-dir-btn.on .f-dir-icon{background:var(--c);color:#fff}
.f-enc-row{border-radius:10px;overflow:hidden;border:2px solid var(--cl)}
.f-enc-row.on{border-color:var(--c)}
.f-enc-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#fff}
.f-enc-row.on .f-enc-hdr{background:var(--cs)}
.f-enc-body{padding:10px 12px;background:var(--cs);border-top:1px solid var(--cl)}
.f-swatch-row{display:flex;gap:8px;flex-wrap:wrap}
.f-swatch{width:28px;height:28px;border-radius:50%;cursor:pointer;border:2.5px solid var(--cl2);transition:all .12s}
.f-swatch.on{transform:scale(1.18);box-shadow:0 0 0 2px #fff,0 0 0 4px var(--c)}
.f-tabs{display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap}
.f-tab{padding:4px 10px;border-radius:20px;border:1px solid var(--cl2);font-size:11px;font-weight:700;cursor:pointer;transition:all .12s;background:#fff;color:var(--ct)}
.f-tab.on{background:var(--c);border-color:var(--c);color:#fff}
.f-notice{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;background:var(--cs);border:1px solid var(--cl2);font-size:11px;color:#374151;margin-top:10px}
.f-modal-overlay{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;padding:16px}
@media(min-width:640px){.f-modal-overlay{align-items:center}}
.f-modal{background:#fff;border-radius:16px;width:100%;max-width:360px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.f-modal-hdr{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--cl)}
.f-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:16px;max-height:280px;overflow-y:auto}
.f-modal-opt{display:flex;align-items:flex-start;gap:8px;padding:10px;border-radius:10px;border:2px solid var(--cl);cursor:pointer;transition:all .12s;background:#fff;text-align:left;font-family:inherit}
.f-modal-opt.on{border-color:var(--c);background:var(--cs)}
.f-modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--cl)}
.f-fi{height:38px;padding:0 12px;border:1px solid var(--cl2);border-radius:8px;font-family:inherit;font-size:14px;color:#171717;background:#fff;outline:none;width:100%;transition:border-color .15s}
.f-fi:focus{border-color:var(--c);box-shadow:0 0 0 3px rgba(17,24,39,.08)}
.f-fi.err{border-color:#ef4444}
.f-label{font-size:12.5px;font-weight:600;color:#374151;margin-bottom:5px;display:block}
.f-help{font-size:11.5px;color:var(--cm);margin-bottom:5px}
.f-ferr{font-size:11.5px;color:#ef4444;margin-top:3px}
.f-fgroup{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}
.f-pkg{padding:14px;border-radius:10px;border:2px solid var(--cl);cursor:pointer;transition:all .12s;background:#fff;text-align:left;font-family:inherit;width:100%}
.f-pkg.on{border-color:var(--c);background:var(--cs)}
.f-pkg:hover:not(.on){border-color:#d1d5db}
.f-fld{display:flex;flex-direction:column;gap:14px}
.fld{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;color:var(--ct)}
.fsp{width:28px;height:28px;border:2px solid var(--cl2);border-top-color:var(--c);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.f-success{display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 32px 64px;max-width:600px;margin:0 auto;width:100%}
.f-success-icon{width:56px;height:56px;border-radius:50%;background:var(--c);color:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
.f-success h2{font-size:24px;font-weight:700;letter-spacing:-.025em;margin:0 0 8px;line-height:1.2}
.f-success p{font-size:14px;color:var(--ct);margin:0 0 8px;max-width:380px;line-height:1.6}
.f-ref{font-family:ui-monospace,monospace;font-size:12px;color:var(--cm);background:var(--cs);border:1px solid var(--cl);border-radius:6px;padding:4px 12px;margin-bottom:24px}
.f-est-card{padding:16px 20px;border:1px solid var(--cl);border-radius:12px;margin-bottom:24px;width:100%;text-align:left;background:#fff}
.f-est-lbl{font-size:11px;color:var(--cm);font-family:ui-monospace,monospace;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.f-est-val{font-size:24px;font-weight:700;font-family:ui-monospace,monospace;letter-spacing:-.02em}
.f-nxt{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%}
.f-nxt-card{padding:14px;border:1px solid var(--cl);border-radius:12px;text-align:left;background:#fff}
.f-nxt-n{font-size:10px;font-family:ui-monospace,monospace;color:var(--cm);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
.f-nxt-t{font-size:13px;font-weight:600;margin-bottom:3px}
.f-nxt-d{font-size:11.5px;color:var(--ct);line-height:1.4}
.f-reset-btn{margin-top:24px}
.f-ar-overlay{position:fixed;inset:0;z-index:9999;background:#111;display:flex;flex-direction:column}
.f-ar-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.12);flex-shrink:0}
.f-ar-title{font-size:14px;font-weight:500;color:#fff}
.f-ar-close{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}
.f-ar-hint{padding:8px 20px 12px;text-align:center;font-size:12px;color:#666;flex-shrink:0}
@media(max-width:900px){
  #pergola-app{flex-direction:column}
  .f-sidebar{width:100%;height:55vh;border-left:none;border-top:1px solid var(--cl2)}
  .f-sidebar-hdr{padding:12px 16px}
  .f-sidebar-name{font-size:15px}
  .f-3d-col{height:45vh;min-height:220px}
}
@media(max-width:500px){
  .f-nxt{grid-template-columns:1fr}
  .f-success{padding:32px 16px 48px}
  .f-pricebar{gap:8px}
  .f-price-val{font-size:18px}
}
`;

// ── Accordion step component ──────────────────────────────────────────────────────

function AccStep({ index, title, summary, open, onToggle, children }: {
  index: number; title: string; summary: string;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const stepRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && stepRef.current) {
      setTimeout(() => stepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    }
  }, [open]);
  return (
    <div className="f-step" ref={stepRef}>
      <button className="f-step-hdr" onClick={onToggle}>
        <div className={`f-step-num ${open ? 'open' : 'closed'}`}>{index}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div className="f-step-title">{title}</div>
          {!open && <div className="f-step-summary">{summary}</div>}
        </div>
        <svg className={`f-step-chev ${open ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="f-step-body">
          <div className="f-step-inner">{children}</div>
        </div>
      )}
    </div>
  );
}

// ── Small shared sub-components ──────────────────────────────────────────────────

function CheckSvg() {
  return <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

// ── Section: Slats type ──────────────────────────────────────────────────────────

function SlatsSection({ cfg, update }: { cfg: PConfig; update: (p: Partial<PConfig>) => void }) {
  const opts = [
    { value: 'wavy' as SlatsType, label: 'Valovite lamele', desc: 'Anatomska oblika · vodotesno' },
    { value: 'flat' as SlatsType, label: 'Ravne lamele',    desc: 'Klasične ravne plošče' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {opts.map(o => (
        <button key={o.value} onClick={() => update({ slatsType: o.value })}
          style={{ border: `2px solid ${cfg.slatsType === o.value ? '#111827' : '#f3f4f6'}`, background: cfg.slatsType === o.value ? '#111827' : '#fff', color: cfg.slatsType === o.value ? '#fff' : '#374151', borderRadius: 10, padding: '12px 10px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 3, color: cfg.slatsType === o.value ? '#fff' : '#111827' }}>{o.label}</div>
          <div style={{ fontSize: 10, color: cfg.slatsType === o.value ? 'rgba(255,255,255,.6)' : '#9ca3af' }}>{o.desc}</div>
        </button>
      ))}
    </div>
  );
}

// ── Section: Dimensions ──────────────────────────────────────────────────────────

function DimSlider({ label, unit, value, min, max, step, onChange }: {
  label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>{label}</span>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'ui-monospace,monospace', letterSpacing: '-.02em', color: '#111827' }}>{(value/10).toFixed(0)} <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{unit}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', fontFamily: 'ui-monospace,monospace' }}>
        <span>{(min/10).toFixed(0)} {unit}</span><span>{(max/10).toFixed(0)} {unit}</span>
      </div>
    </div>
  );
}

function DimsSection({ cfg, update }: { cfg: PConfig; update: (p: Partial<PConfig>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DimSlider label="Širina" unit="cm" value={cfg.width} min={2000} max={8000} step={100} onChange={v => update({ width: v })} />
      <DimSlider label="Globina" unit="cm" value={cfg.depth} min={1500} max={6000} step={100} onChange={v => update({ depth: v })} />
      <DimSlider label="Višina" unit="cm" value={cfg.height} min={2200} max={3500} step={50}  onChange={v => update({ height: v })} />
    </div>
  );
}

// ── Section: House walls ──────────────────────────────────────────────────────────

function WallsSection({ cfg, update }: { cfg: PConfig; update: (p: Partial<PConfig>) => void }) {
  const sides: { key: keyof typeof cfg.houseWalls; label: string; icon: string }[] = [
    { key: 'back',  label: 'Zadaj',   icon: '↑' },
    { key: 'front', label: 'Spredaj', icon: '↓' },
    { key: 'left',  label: 'Levo',    icon: '←' },
    { key: 'right', label: 'Desno',   icon: '→' },
  ];
  const activeCount = Object.values(cfg.houseWalls).filter(Boolean).length;
  return (
    <div>
      <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 10, lineHeight: 1.5, marginTop: 0 }}>
        Izberi strani, ki mejijo na steno hiše. Stebri se samodejno odstranijo.
      </p>
      <div className="f-dir-grid">
        {sides.map(({ key, label, icon }) => {
          const on = cfg.houseWalls[key];
          return (
            <button key={key} className={`f-dir-btn${on ? ' on' : ''}`}
              onClick={() => update({ houseWalls: { ...cfg.houseWalls, [key]: !on } })}>
              <div className="f-dir-icon">{icon}</div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>{label}</span>
              <div style={{ marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%', border: `2px solid ${on ? '#111827' : '#d1d5db'}`, background: on ? '#111827' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {on && <CheckSvg />}
              </div>
            </button>
          );
        })}
      </div>
      {activeCount > 0 && (
        <div className="f-notice">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {activeCount === 1 ? '1 stena aktivna' : `${activeCount} stene aktivne`} — stebri odstranjeni
        </div>
      )}
    </div>
  );
}

// ── Section: Additional posts ────────────────────────────────────────────────────

function PostsSection({ cfg, update }: { cfg: PConfig; update: (p: Partial<PConfig>) => void }) {
  const sides: { key: keyof typeof cfg.additionalPosts; label: string }[] = [
    { key: 'front', label: 'Spredaj' },
    { key: 'rear',  label: 'Zadaj'   },
    { key: 'left',  label: 'Levo'    },
    { key: 'right', label: 'Desno'   },
  ];
  const wallMap: Record<string, keyof typeof cfg.houseWalls> = { front: 'front', rear: 'back', left: 'left', right: 'right' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 6px', lineHeight: 1.5 }}>
        Dodaj steber na katerikoli stranici in ga pozicioniraj vzdolž osi.
      </p>
      {sides.map(({ key, label }) => {
        if (cfg.houseWalls[wallMap[key]]) return null;
        const post = cfg.additionalPosts[key];
        const maxOff = ((key === 'front' || key === 'rear') ? cfg.width : cfg.depth) / 2 - 300;
        const setPost = (p: Partial<PostEntry>) =>
          update({ additionalPosts: { ...cfg.additionalPosts, [key]: { ...post, ...p } } });
        return (
          <div key={key} className={`f-enc-row${post.enabled ? ' on' : ''}`}>
            <div className="f-enc-hdr">
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>{label}</span>
              <button onClick={() => setPost({ enabled: !post.enabled, offset: 0 })}
                style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${post.enabled ? '#111827' : '#d1d5db'}`, background: post.enabled ? '#111827' : '#fff', color: post.enabled ? '#fff' : '#6b7280', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {post.enabled ? '✓ Vklopljeno' : '+ Dodaj'}
              </button>
            </div>
            {post.enabled && (
              <div className="f-enc-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>
                  <span>levo ← → desno</span>
                  <span style={{ fontFamily: 'ui-monospace,monospace', color: '#4b5563' }}>{post.offset > 0 ? '+' : ''}{post.offset} mm</span>
                </div>
                <input type="range" min={-maxOff} max={maxOff} step={10} value={post.offset} onChange={e => setPost({ offset: Number(e.target.value) })} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Section: Colors ───────────────────────────────────────────────────────────────

function ColorPicker({ label, selected, isSlatsPicker, onChange }: {
  label: string; selected: SelectedColor; isSlatsPicker?: boolean;
  onChange: (c: SelectedColor) => void;
}) {
  const [tab, setTab] = useState<string>(selected.category);
  const structTabs = ['standard','ral','wood','special'] as ColorCat[];
  const slatsTabs  = ['standard','ral','special'] as SlatsCat[];
  const tabs = isSlatsPicker ? slatsTabs : structTabs;
  const colors: ColorOption[] = isSlatsPicker
    ? (SLATS_COLORS[tab as SlatsCat] ?? [])
    : (COLORS[tab as ColorCat] ?? []);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: selected.hex, border: '2px solid #e5e7eb', flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>{label}</span>
        <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</span>
      </div>
      <div className="f-tabs">
        {tabs.map(t => (
          <button key={t} className={`f-tab${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>
            {t === 'standard' ? 'Standard' : t === 'ral' ? 'RAL' : t === 'wood' ? 'Les' : 'Special'}
          </button>
        ))}
      </div>
      <div className="f-swatch-row">
        {colors.map(c => (
          <button key={c.id} title={c.name} onClick={() => onChange({ category: tab as ColorCat, id: c.id, name: c.name, hex: c.hex })}>
            <div className={`f-swatch${selected.id === c.id ? ' on' : ''}`} style={{ background: c.hex }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorsSection({ cfg, update }: { cfg: PConfig; update: (p: Partial<PConfig>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ColorPicker label="Barva konstrukcije" selected={cfg.structureColor} onChange={c => update({ structureColor: c })} />
      <div style={{ borderTop: '1px solid #f3f4f6' }} />
      <ColorPicker label="Barva lamel" selected={cfg.slatsColor} isSlatsPicker onChange={c => update({ slatsColor: c })} />
    </div>
  );
}

// ── Section: Side enclosures ──────────────────────────────────────────────────────

const ENC_OPTIONS: { value: EnclosureType; label: string; desc: string }[] = [
  { value: 'zip-screen',        label: 'ZIP Screen',          desc: 'Zložljivo platno' },
  { value: 'movable-slats',     label: 'Premične lamele',     desc: 'Vrtljive aluminijaste' },
  { value: 'sliding-glass',     label: 'Drsno steklo',        desc: 'Drsni stekleni paneli' },
  { value: 'fixed-glass',       label: 'Fiksno steklo',       desc: 'Nepremično steklo' },
  { value: 'ventilation-panel', label: 'Ventilacijski panel', desc: 'Horizontalne žaluzije' },
  { value: 'metal-panel',       label: 'Kovinski panel',      desc: 'Polne kovinske plošče' },
];
const ENC_COLORS = [
  { hex: '#383E42', name: 'Antracit' }, { hex: '#1a1a1a', name: 'Črna' },
  { hex: '#F1F0EA', name: 'Bela' },     { hex: '#C0C0C0', name: 'Srebrna' },
  { hex: '#B8A88A', name: 'Pesek' },    { hex: '#8B7355', name: 'Les' },
];

function EncModal({ initialType, onConfirm, onCancel }: {
  initialType: EnclosureType; onConfirm: (t: EnclosureType) => void; onCancel: () => void;
}) {
  const [sel, setSel] = useState<EnclosureType>(initialType === 'none' ? 'zip-screen' : initialType);
  return (
    <div className="f-modal-overlay" onClick={onCancel}>
      <div className="f-modal" onClick={e => e.stopPropagation()}>
        <div className="f-modal-hdr">
          <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Tip zapore</span>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>✕</button>
        </div>
        <div className="f-modal-grid">
          {ENC_OPTIONS.map(o => (
            <button key={o.value} className={`f-modal-opt${sel === o.value ? ' on' : ''}`} onClick={() => setSel(o.value)}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{o.label}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{o.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="f-modal-foot">
          <button className="f-btn f-btn-g" style={{ height: 36, fontSize: 12.5 }} onClick={onCancel}>Prekliči</button>
          <button className="f-btn f-btn-p" style={{ height: 36, fontSize: 12.5 }} onClick={() => onConfirm(sel)}>Potrdi</button>
        </div>
      </div>
    </div>
  );
}

function EncSegRow({ seg, label, onChange }: { seg: EncSeg; label: string; onChange: (s: Partial<EncSeg>) => void }) {
  const [modal, setModal] = useState(false);
  const on = seg.type !== 'none';
  const opt = ENC_OPTIONS.find(o => o.value === seg.type);
  return (
    <div className={`f-enc-row${on ? ' on' : ''}`}>
      <div className="f-enc-hdr">
        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#4b5563' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {on && <button onClick={() => onChange({ type: 'none' })} style={{ fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px 4px' }} onMouseEnter={e => (e.currentTarget.style.color='#ef4444')} onMouseLeave={e => (e.currentTarget.style.color='#9ca3af')}>✕</button>}
          <button onClick={() => setModal(true)}
            style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${on ? '#e5e7eb' : '#111827'}`, background: on ? '#fff' : '#111827', color: on ? '#374151' : '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {on ? 'Zamenjaj' : '+ Dodaj'}
          </button>
        </div>
      </div>
      {on && opt && (
        <div className="f-enc-body">
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: '#374151' }}>{opt.label}</div>
          <div className="f-swatch-row">
            {ENC_COLORS.map(c => (
              <button key={c.hex} title={c.name} onClick={() => onChange({ colorHex: c.hex, colorName: c.name })}>
                <div className={`f-swatch${seg.colorHex === c.hex ? ' on' : ''}`} style={{ background: c.hex }} />
              </button>
            ))}
          </div>
        </div>
      )}
      {modal && <EncModal initialType={seg.type} onConfirm={t => { onChange({ type: t }); setModal(false); }} onCancel={() => setModal(false)} />}
    </div>
  );
}

function EnclosuresSection({ cfg, update }: { cfg: PConfig; update: (p: Partial<PConfig>) => void }) {
  const sides: { key: keyof typeof cfg.sideEnclosures; label: string; wallKey: keyof typeof cfg.houseWalls; postKey: keyof typeof cfg.additionalPosts }[] = [
    { key: 'front', label: 'Sprednja stran', wallKey: 'front', postKey: 'front' },
    { key: 'back',  label: 'Zadnja stran',   wallKey: 'back',  postKey: 'rear'  },
    { key: 'left',  label: 'Leva stran',     wallKey: 'left',  postKey: 'left'  },
    { key: 'right', label: 'Desna stran',    wallKey: 'right', postKey: 'right' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
        Dodaj steklene panele, ZIP zaslone, lamele ali kovinske plošče.
      </p>
      {sides.map(({ key, label, wallKey, postKey }) => {
        if (cfg.houseWalls[wallKey]) return null;
        const hasPost = cfg.additionalPosts[postKey]?.enabled;
        const segs = cfg.sideEnclosures[key];
        const setSeg = (idx: 0 | 1, s: Partial<EncSeg>) => {
          const entry: [EncSeg, EncSeg] = [{ ...segs[0] }, { ...segs[1] }];
          entry[idx] = { ...entry[idx], ...s };
          update({ sideEnclosures: { ...cfg.sideEnclosures, [key]: entry } });
        };
        return (
          <div key={key}>
            <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: 6 }}>{label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: hasPost ? '1fr 1fr' : '1fr', gap: 6 }}>
              <EncSegRow seg={segs[0]} label={hasPost ? 'Odsek 1' : 'Celotna stran'} onChange={s => setSeg(0, s)} />
              {hasPost && <EncSegRow seg={segs[1]} label="Odsek 2" onChange={s => setSeg(1, s)} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Section: Lighting ──────────────────────────────────────────────────────────────

function SidesGrid({ sides, houseWalls, onToggle }: { sides: LEDSides; houseWalls: typeof defaultConfig['prototype']['houseWalls']; onToggle: (k: keyof LEDSides) => void }) {
  const entries: { key: keyof LEDSides; label: string }[] = [
    { key: 'front', label: 'Spredaj' }, { key: 'back', label: 'Zadaj' },
    { key: 'left',  label: 'Levo'    }, { key: 'right', label: 'Desno' },
  ];
  return (
    <div style={{ padding: '8px 12px 10px', background: '#f8fafc', borderTop: '1px solid #f3f4f6' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', marginBottom: 6 }}>IZBERI STRANI</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
        {entries.map(({ key, label }) => {
          const disabled = (houseWalls as Record<string, boolean>)[key] ?? false;
          const active = sides[key];
          return (
            <button key={key} onClick={() => !disabled && onToggle(key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: `1.5px solid ${disabled ? '#f3f4f6' : active ? '#111827' : '#e5e7eb'}`, background: disabled ? '#f9fafb' : active ? '#111827' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, fontFamily: 'inherit' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, border: `1.5px solid ${active && !disabled ? '#fff' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {active && !disabled && <CheckSvg />}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: disabled ? '#9ca3af' : active ? '#fff' : '#6b7280' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LightsSection({ cfg, update }: { cfg: PConfig; update: (p: Partial<PConfig>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className={`f-enc-row${cfg.ledEdgeEnabled ? ' on' : ''}`}>
        <button className="f-enc-hdr" style={{ width: '100%', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: cfg.ledEdgeEnabled ? '#f8fafc' : '#fff', border: 'none' }} onClick={() => update({ ledEdgeEnabled: !cfg.ledEdgeEnabled })}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.ledEdgeEnabled ? '#e2e8f0' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💡</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Notranji LED trak</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Pod strešnimi nosilci · 38 €/m</div>
          </div>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${cfg.ledEdgeEnabled ? '#111827' : '#d1d5db'}`, background: cfg.ledEdgeEnabled ? '#111827' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {cfg.ledEdgeEnabled && <CheckSvg />}
          </div>
        </button>
        {cfg.ledEdgeEnabled && (
          <SidesGrid sides={cfg.ledEdgeSides} houseWalls={cfg.houseWalls}
            onToggle={k => update({ ledEdgeSides: { ...cfg.ledEdgeSides, [k]: !cfg.ledEdgeSides[k] } })} />
        )}
      </div>
      <div className={`f-enc-row${cfg.ledStructureEnabled ? ' on' : ''}`}>
        <button className="f-enc-hdr" style={{ width: '100%', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: cfg.ledStructureEnabled ? '#f8fafc' : '#fff', border: 'none' }} onClick={() => update({ ledStructureEnabled: !cfg.ledStructureEnabled })}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.ledStructureEnabled ? '#e2e8f0' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✨</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Zunanji LED trak</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Na zunanjih robovih strehe · 420 €</div>
          </div>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${cfg.ledStructureEnabled ? '#111827' : '#d1d5db'}`, background: cfg.ledStructureEnabled ? '#111827' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {cfg.ledStructureEnabled && <CheckSvg />}
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Section: Electrical ──────────────────────────────────────────────────────────

const PAKETI = [
  {
    value: 'nello' as ElecPkg, label: 'Nello', price: 'Vključeno', badge: null,
    features: ['Električni motor za odpiranje lamel', 'Upravljanje z daljinskim upravljalnikom', 'Ročna override funkcija'],
  },
  {
    value: 'somfy' as ElecPkg, label: 'Somfy io', price: '+ 520 €', badge: 'Priporočeno',
    features: ['Električni motor Somfy io (tihi, 15-letna garancija)', 'Senzor vetra — samodejno zapre lamele ob nevihtah', 'Senzor dežja — zaščita pred mokrenjem', 'Upravljanje prek mobilne aplikacije (iOS / Android)', 'Združljivo z Google Home & Apple HomeKit'],
  },
];

function ElectricalSection({ cfg, update }: { cfg: PConfig; update: (p: Partial<PConfig>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9ca3af', marginBottom: 4 }}>Električni paket</div>
      {PAKETI.map(pkg => {
        const on = cfg.electricalPackage === pkg.value;
        return (
          <button key={pkg.value} className={`f-pkg${on ? ' on' : ''}`} onClick={() => update({ electricalPackage: pkg.value })}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#111827' }}>{pkg.label}</span>
                {pkg.badge && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: '#111827', color: '#fff' }}>{pkg.badge}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: on ? '#111827' : '#9ca3af' }}>{pkg.price}</span>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${on ? '#111827' : '#d1d5db'}`, background: on ? '#111827' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
              </div>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {pkg.features.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
                  <span style={{ marginTop: 1, color: on ? '#111827' : '#d1d5db', flexShrink: 0 }}>•</span>{f}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

// ── Section: Add-ons ────────────────────────────────────────────────────────────

function AddonsSection({ cfg, update }: { cfg: PConfig; update: (p: Partial<PConfig>) => void }) {
  const addons = [
    { key: 'heatersEnabled' as const,         icon: '🔥', title: 'Infrardeči grelci',     desc: '2 enoti pod strešno konstrukcijo · 2.000 W vsak', price: '+ 980 €' },
    { key: 'premiumCoatingEnabled' as const,   icon: '🛡️', title: 'Premium zaščitni premaz', desc: 'Antikorozijska + UV zaščita · 25+ let življenjske dobe', price: '+ 210 €' },
    { key: 'snowLoadEnabled' as const,         icon: '❄️', title: 'Ojačitev za sneg',      desc: 'Do 200 kg/m² · obvezno za gorska področja', price: '+ 380 €' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {addons.map(({ key, icon, title, desc, price }) => {
        const on = cfg[key];
        return (
          <button key={key} className={`f-toggle-row${on ? ' on' : ''}`} onClick={() => update({ [key]: !on })}>
            <div className="f-toggle-icon">{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{title}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, lineHeight: 1.35 }}>{desc}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: on ? '#111827' : '#9ca3af' }}>{price}</span>
              <div className="f-toggle-check">{on && <CheckSvg />}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Section: Contact form ─────────────────────────────────────────────────────────

interface ContactState { name: string; email: string; phone: string; city: string; }
interface ContactErrors { name?: string; email?: string; }

function ContactSection({ contact, setContact, errors }: {
  contact: ContactState; setContact: (c: Partial<ContactState>) => void; errors: ContactErrors;
}) {
  return (
    <div className="f-fld">
      <p style={{ margin: 0, fontSize: 11.5, color: '#6b7280', lineHeight: 1.5 }}>
        Vnesite podatke in pošljemo vam podrobno ponudbo po e-pošti.
      </p>
      <div className="f-fgroup">
        <label className="f-label">Ime in priimek <span style={{ color: '#ef4444' }}>*</span></label>
        <input className={`f-fi${errors.name ? ' err' : ''}`} placeholder="Jana Novak" value={contact.name} onChange={e => setContact({ name: e.target.value })} />
        {errors.name && <span className="f-ferr">{errors.name}</span>}
      </div>
      <div className="f-fgroup">
        <label className="f-label">E-pošta <span style={{ color: '#ef4444' }}>*</span></label>
        <input className={`f-fi${errors.email ? ' err' : ''}`} type="email" placeholder="jana@example.com" value={contact.email} onChange={e => setContact({ email: e.target.value })} />
        {errors.email && <span className="f-ferr">{errors.email}</span>}
      </div>
      <div className="f-fgroup">
        <label className="f-label">Telefon</label>
        <input className="f-fi" type="tel" placeholder="+386 31 123 456" value={contact.phone} onChange={e => setContact({ phone: e.target.value })} />
      </div>
      <div className="f-fgroup" style={{ marginBottom: 0 }}>
        <label className="f-label">Kraj</label>
        <input className="f-fi" placeholder="Ljubljana" value={contact.city} onChange={e => setContact({ city: e.target.value })} />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────────

export default function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [apiCfg, setApiCfg] = useState<PublicCfg | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [config, setConfig] = useState<PConfig>(defaultConfig);
  const [contact, setContactState] = useState<ContactState>({ name: '', email: '', phone: '', city: '' });
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [openStep, setOpenStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [leadRef, setLeadRef] = useState('');
  const [submitErr, setSubmitErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cameraView, setCameraView] = useState<CameraView>('3D');
  const [arUrl, setArUrl] = useState<string | null>(null);
  const [arLoading, setArLoading] = useState(false);
  const exportGlbRef = useRef<(() => Promise<Blob>) | null>(null);
  const styleRef = useRef(false);

  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
    fetch(`/api/v1/public/configurators/${id}${preview ? '?preview=1' : ''}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: PublicCfg) => {
        if (d.branding.primary) document.documentElement.style.setProperty('--c', d.branding.primary);
        if (d.branding.font) document.documentElement.style.setProperty('--fp', `"${d.branding.font}", ui-sans-serif, sans-serif`);
        document.title = d.schema.name;
        setApiCfg(d);
      })
      .catch(() => setLoadErr('Ta konfigurator ni na voljo.'));
  }, [id]);

  const update = useCallback((patch: Partial<PConfig>) => setConfig(prev => ({ ...prev, ...patch })), []);
  const setContact = useCallback((patch: Partial<ContactState>) => setContactState(prev => ({ ...prev, ...patch })), []);

  // Notify parent
  useEffect(() => {
    const total = calcTotal(config);
    postMsg('resize', { height: document.body.scrollHeight });
    postMsg('price', { total: total * 100, currency: 'EUR' });
  });

  // Convert PConfig (mm) → PergolaConfig (cm) for 3D
  const pergolaConfig: PergolaConfig = useMemo(() => ({
    width:  config.width / 10,
    depth:  config.depth / 10,
    height: config.height / 10,
    structureColor: config.structureColor.hex,
    slatsColor:     config.slatsColor.hex,
    slatsType:      config.slatsType,
    lamelleAngle:   0,
    houseWalls:     config.houseWalls,
    additionalPosts: config.additionalPosts,
    sideEnclosures: {
      front: config.sideEnclosures.front as [EnclosureSegment, EnclosureSegment],
      back:  config.sideEnclosures.back  as [EnclosureSegment, EnclosureSegment],
      left:  config.sideEnclosures.left  as [EnclosureSegment, EnclosureSegment],
      right: config.sideEnclosures.right as [EnclosureSegment, EnclosureSegment],
    },
    ledEdgeEnabled:     config.ledEdgeEnabled,
    ledEdgeSides:       config.ledEdgeSides,
    ledStructureEnabled: config.ledStructureEnabled,
    heatersEnabled:     config.heatersEnabled,
  }), [config]);

  const total = calcTotal(config);
  const areaM2 = (config.width / 1000) * (config.depth / 1000);

  async function handleSubmit() {
    // Validate contact
    const errs: ContactErrors = {};
    if (!contact.name.trim()) errs.name = 'Vnesite ime';
    if (!contact.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errs.email = 'Vnesite veljavno e-pošto';
    if (Object.keys(errs).length > 0) { setContactErrors(errs); return; }
    setContactErrors({});
    if (!apiCfg || submitting) return;
    setSubmitting(true); setSubmitErr('');
    try {
      const state: Record<string, unknown> = {
        width: config.width, depth: config.depth, height: config.height,
        slats_type: config.slatsType,
        structure_color: config.structureColor.hex, structure_color_name: config.structureColor.name,
        slats_color: config.slatsColor.hex,         slats_color_name: config.slatsColor.name,
        house_wall_front: config.houseWalls.front,  house_wall_back: config.houseWalls.back,
        house_wall_left:  config.houseWalls.left,   house_wall_right: config.houseWalls.right,
        post_front: config.additionalPosts.front.enabled, post_rear: config.additionalPosts.rear.enabled,
        post_left:  config.additionalPosts.left.enabled,  post_right: config.additionalPosts.right.enabled,
        enc_front_type: config.sideEnclosures.front[0].type,
        enc_back_type:  config.sideEnclosures.back[0].type,
        enc_left_type:  config.sideEnclosures.left[0].type,
        enc_right_type: config.sideEnclosures.right[0].type,
        electrical_package: config.electricalPackage,
        led_edge_enabled: config.ledEdgeEnabled,
        led_structure_enabled: config.ledStructureEnabled,
        heaters_enabled: config.heatersEnabled,
        premium_coating: config.premiumCoatingEnabled,
        snow_load: config.snowLoadEnabled,
        name: contact.name, email: contact.email,
        phone: contact.phone || undefined, city: contact.city || undefined,
      };
      const res = await fetch(`/api/v1/public/configurators/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: apiCfg.version, state, contact: { name: contact.name, email: contact.email, phone: contact.phone || undefined, city: contact.city || undefined } }),
      });
      const text = await res.text();
      let json: Record<string, unknown> = {};
      try { if (text.trim()) json = JSON.parse(text); } catch {}
      if (!res.ok) throw new Error(String(json.error ?? `Server error (${res.status})`));
      setLeadRef(String(json.ref ?? ''));
      setSubmitted(true);
      postMsg('submitted', { leadRef: json.ref });
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : 'Napaka pri oddaji. Prosimo poskusite znova.');
    } finally { setSubmitting(false); }
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
          s.setAttribute('data-mv', '1'); s.onload = () => resolve(); s.onerror = () => reject(new Error('model-viewer load failed'));
          document.head.appendChild(s);
        });
      }
      const blob = await exportGlbRef.current();
      const url = URL.createObjectURL(blob);
      setArUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    } catch (e) { console.error('AR export failed', e); }
    finally { setArLoading(false); }
  }

  function closeAr() { setArUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; }); }

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loadErr) {
    return <div id="pergola-app" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ color: '#737373', fontSize: 14, margin: 0 }}>{loadErr}</p>
    </div>;
  }
  if (!apiCfg) {
    return <div id="pergola-app" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 12 }}>
      <div className="fsp" /><p style={{ color: '#737373', margin: 0 }}>Nalagam…</p>
    </div>;
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    const name = contact.name.split(' ')[0];
    return (
      <div id="pergola-app" style={{ overflow: 'auto', flexDirection: 'column' }}>
        <div className="f-success">
          <div className="f-success-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M4 12l5 5L20 6"/></svg>
          </div>
          <h2>Hvala, {name}!</h2>
          <p>Vaša zahteva je prejeta. Pošljemo vam podrobno ponudbo po e-pošti.</p>
          {leadRef && <div className="f-ref">Ref: {leadRef}</div>}
          {total > 0 && (
            <div className="f-est-card">
              <div className="f-est-lbl">Vaša ocena</div>
              <div className="f-est-val">{fmtEur(total)}</div>
            </div>
          )}
          <div className="f-nxt">
            {[
              { n: '01', t: 'Pregled konfiguracije', d: 'Naša ekipa pregleda vašo konfiguracijo in pripravi ponudbo.' },
              { n: '02', t: 'Prejmete ponudbo',      d: 'Podrobna PDF ponudba po e-pošti v 1 delovnem dnevu.' },
              { n: '03', t: 'Brezplačen posvet',     d: 'Rezervirajte klic za pogovor o projektu in prilagoditvah.' },
            ].map(s => (
              <div key={s.n} className="f-nxt-card">
                <div className="f-nxt-n">{s.n}</div>
                <div className="f-nxt-t">{s.t}</div>
                <div className="f-nxt-d">{s.d}</div>
              </div>
            ))}
          </div>
          <button className="f-btn f-btn-g f-reset-btn" onClick={() => {
            setSubmitted(false); setLeadRef(''); setSubmitErr('');
            setConfig(defaultConfig()); setContactState({ name: '', email: '', phone: '', city: '' }); setOpenStep(0);
          }}>← Konfiguriraj znova</button>
        </div>
      </div>
    );
  }

  // ── Accordion steps data ───────────────────────────────────────────────────
  const wallCount  = Object.values(config.houseWalls).filter(Boolean).length;
  const postCount  = Object.values(config.additionalPosts).filter(p => p.enabled).length;
  const encCount   = Object.values(config.sideEnclosures).flat().filter(s => s.type !== 'none').length;
  const ledParts   = [...(config.ledEdgeEnabled ? ['Notranji'] : []), ...(config.ledStructureEnabled ? ['Zunanji'] : [])];
  const addonCount = [config.heatersEnabled, config.premiumCoatingEnabled, config.snowLoadEnabled].filter(Boolean).length;

  const STEPS = [
    { title: 'Tip lamel',        summary: config.slatsType === 'wavy' ? 'Valovite lamele' : 'Ravne lamele', content: <SlatsSection cfg={config} update={update} /> },
    { title: 'Dimenzije',        summary: `${(config.width/1000).toFixed(2)} × ${(config.depth/1000).toFixed(2)} × ${(config.height/1000).toFixed(2)} m`, content: <DimsSection cfg={config} update={update} /> },
    { title: 'Stene hiše',       summary: wallCount > 0 ? `${wallCount} sten${wallCount === 1 ? 'a' : 'e'}` : 'Brez', content: <WallsSection cfg={config} update={update} /> },
    { title: 'Dodatni stebri',   summary: postCount > 0 ? `${postCount} steber` : 'Brez', content: <PostsSection cfg={config} update={update} /> },
    { title: 'Barve',            summary: `${config.structureColor.name} · ${config.slatsColor.name}`, content: <ColorsSection cfg={config} update={update} /> },
    { title: 'Bočne zapore',     summary: encCount > 0 ? `${encCount} zapora${encCount !== 1 ? 'e' : ''}` : 'Brez', content: <EnclosuresSection cfg={config} update={update} /> },
    { title: 'Razsvetljava',     summary: ledParts.length > 0 ? ledParts.join(' · ') + ' LED' : 'Brez', content: <LightsSection cfg={config} update={update} /> },
    { title: 'Električni paket', summary: config.electricalPackage === 'somfy' ? 'Somfy io' : 'Nello', content: <ElectricalSection cfg={config} update={update} /> },
    { title: 'Dodatki',          summary: addonCount > 0 ? `${addonCount} dodatek` : 'Brez', content: <AddonsSection cfg={config} update={update} /> },
    { title: 'Vaša ponudba',     summary: 'Ime, e-pošta, telefon', content: <ContactSection contact={contact} setContact={setContact} errors={contactErrors} /> },
  ];

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div id="pergola-app">

      {/* 3D panel */}
      <div className="f-3d-col">
        <div className="f-3d-tabs">
          {(['Front','Side','Top','3D'] as CameraView[]).map(v => (
            <button key={v} className={`f-3d-tab${cameraView === v ? ' act' : ''}`} onClick={() => setCameraView(v)}>{v}</button>
          ))}
          <button className="f-ar-btn" onClick={handleAR} disabled={arLoading} title="Poglej pergolo v AR">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            {arLoading ? 'Pripravljam…' : 'AR'}
          </button>
        </div>
        <div className="f-3d-canvas">
          <Pergola3D cfg={pergolaConfig} exportRef={exportGlbRef} cameraView={cameraView} style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="f-3d-bar">
          <span>Površina</span>
          <span className="f-3d-bar-val">{(config.width/1000).toFixed(2)} × {(config.depth/1000).toFixed(2)} m = <strong>{areaM2.toFixed(2)} m²</strong></span>
        </div>
      </div>

      {/* Sidebar */}
      <div className="f-sidebar">
        <div className="f-sidebar-hdr">
          <div className="f-sidebar-name">{apiCfg.schema.name}</div>
          <div className="f-sidebar-sub">
            <span className="f-sidebar-dot" />
            <span>3D predogled v živo</span>
          </div>
        </div>

        <div className="f-sidebar-scroll">
          <div style={{ paddingTop: 4, paddingBottom: 4 }}>
            {STEPS.map((step, i) => (
              <AccStep key={i} index={i + 1} title={step.title} summary={step.summary}
                open={openStep === i} onToggle={() => setOpenStep(prev => prev === i ? -1 : i)}>
                {step.content}
              </AccStep>
            ))}
          </div>
        </div>

        <div className="f-pricebar">
          <div>
            <div className="f-price-lbl">Ocena cene · z DDV</div>
            <div className="f-price-val">{fmtEur(total)}</div>
            <div className="f-price-sub">Končna ponudba po e-pošti</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            {submitErr && <div style={{ fontSize: 11, color: '#ef4444', maxWidth: 160, textAlign: 'right' }}>{submitErr}</div>}
            <button className="f-btn f-btn-p" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Pošiljam…' : 'Pošlji povpraševanje →'}
            </button>
          </div>
        </div>
      </div>

      {/* AR overlay */}
      {arUrl && (
        <div className="f-ar-overlay">
          <div className="f-ar-topbar">
            <span className="f-ar-title">AR — Vaša pergola v prostoru</span>
            <button className="f-ar-close" onClick={closeAr}>×</button>
          </div>
          <model-viewer src={arUrl} ar="" ar-modes="scene-viewer webxr quick-look" camera-controls="" shadow-intensity="1" alt="Pergola" style={{ width: '100%', flex: 1, background: '#1a1a1a' }} />
          <div className="f-ar-hint">Tapnite gumb AR · deluje na Android (ARCore) in iOS (Quick Look)</div>
        </div>
      )}
    </div>
  );
}
