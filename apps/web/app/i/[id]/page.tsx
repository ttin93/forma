'use client';

import React, { use, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { PergolaConfig, EnclosureType, EnclosureSegment, CameraView, LEDSides } from '@/components/Pergola3D';
import type { PergolaSettings, PergolaAddonItem } from '@forma/types';

const Pergola3D = dynamic(
  () => import('@/components/Pergola3D').then(m => ({ default: m.Pergola3D })),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(175deg,#e8edf2,#d6dde6)' }}>
        <div style={{ width: 28, height: 28, border: '2px solid #c8d0d8', borderTopColor: '#5a7a8a', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      </div>
    ),
  }
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublicCfg {
  id: string;
  version: string;
  schema: {
    name: string;
    currency: string;
    pergolaSettings?: PergolaSettings;
  };
  branding: { primary: string | null; logoUrl: string | null; font: string | null };
}

type SlatsType = 'flat' | 'wavy';
type ElecPkg   = 'nello' | 'somfy' | 'none';
type ColorCat  = 'standard' | 'ral' | 'wood' | 'special';
type SlatsCat  = 'standard' | 'ral' | 'special';

interface ColorOption { id: string; name: string; hex: string }
interface SelectedColor { category: ColorCat | SlatsCat; id: string; name: string; hex: string }
interface EncSeg { type: EnclosureType; colorHex: string; colorName: string }
interface PostEntry { enabled: boolean; offset: number }

interface PConfig {
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
  addonQty: Record<string, number>;
}

interface ContactForm { name: string; email: string; phone: string; city: string }

// ── Color data ────────────────────────────────────────────────────────────────

const COLORS: Record<ColorCat, ColorOption[]> = {
  standard: [
    { id: 'ral-7016', name: 'RAL 7016 Antracit', hex: '#383E42' },
    { id: 'sand',     name: 'Pesek',              hex: '#B8A88A' },
    { id: 'white',    name: 'Bela',               hex: '#F1F0EA' },
    { id: 'titanium', name: 'Titanij',            hex: '#8E9097' },
  ],
  ral: [
    { id: 'ral-9016', name: 'RAL 9016 Bela',    hex: '#F7F9F0' },
    { id: 'ral-7015', name: 'RAL 7015 Skrilnata', hex: '#4D5057' },
    { id: 'ral-6005', name: 'RAL 6005 Zelena',  hex: '#2E4B3A' },
    { id: 'ral-5010', name: 'RAL 5010 Modra',   hex: '#0E4F9E' },
    { id: 'ral-3009', name: 'RAL 3009 Rdeča',   hex: '#8E3623' },
    { id: 'ral-8004', name: 'RAL 8004 Opečna',  hex: '#8D4E2C' },
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
const NULL_ENC: EncSeg = { type: 'none', colorHex: '#383E42', colorName: 'Antracit' };

// ── Default pergola settings (fallback when admin hasn't configured yet) ──────

function defaultPS(): PergolaSettings {
  return {
    basePrice: 8200, baseSqm: 12.0, pricePerSqm: 420,
    slats: { enabled: true },
    dims:  { enabled: true, minW: 2000, maxW: 8000, minD: 1500, maxD: 5000 },
    walls: { enabled: true, discountPerWall: 60 },
    posts: { enabled: true, maxPerSide: 2, pricePerPost: 220 },
    colors: {
      enabled: true,
      standard: { enabled: true, surcharge: 0 },
      ral:      { enabled: true, surcharge: 180 },
      wood:     { enabled: true, surcharge: 340 },
      special:  { enabled: false, surcharge: 580 },
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
        { id: 'heating', title: 'Infrardeči grelec',    description: 'Stropni IR grelec za pergolo', unit: 'kos', pricePerUnit: 980, minQty: 0, maxQty: 4 },
        { id: 'coating', title: 'Premium zaščitni premaz', description: 'Dodatna UV zaščita',         unit: 'kos', pricePerUnit: 210, minQty: 0, maxQty: 1 },
        { id: 'snow',    title: 'Snežna zaščita',       description: 'Ojačitev za sneg',              unit: 'kos', pricePerUnit: 380, minQty: 0, maxQty: 1 },
      ],
    },
  };
}

// ── Config defaults ───────────────────────────────────────────────────────────

function defaultConfig(ps: PergolaSettings): PConfig {
  const addonQty: Record<string, number> = {};
  ps.addons.items.forEach(a => { addonQty[a.id] = a.minQty; });
  return {
    width: 4000, depth: 3000, height: 240,
    slatsType: 'flat',
    houseWalls: { front: false, back: true, left: false, right: false },
    additionalPosts: {
      front: { enabled: false, offset: 0.5 },
      rear:  { enabled: false, offset: 0.5 },
      left:  { enabled: false, offset: 0.5 },
      right: { enabled: false, offset: 0.5 },
    },
    structureColor: DEFAULT_STRUCT,
    slatsColor: DEFAULT_SLATS,
    sideEnclosures: {
      front: [NULL_ENC, NULL_ENC], back: [NULL_ENC, NULL_ENC],
      left:  [NULL_ENC, NULL_ENC], right: [NULL_ENC, NULL_ENC],
    },
    ledEdgeEnabled: false, ledEdgeSides: { front: true, back: true, left: true, right: true },
    ledStructureEnabled: false,
    electricalPackage: 'none',
    heatersEnabled: false,
    addonQty,
  };
}

// ── Pricing ───────────────────────────────────────────────────────────────────

interface LineItem { label: string; amount: number }

function encKey(t: EnclosureType): keyof Omit<PergolaSettings['enclosures'], 'enabled'> | null {
  if (t === 'none') return null;
  const map: Record<string, keyof Omit<PergolaSettings['enclosures'], 'enabled'>> = {
    'zip-screen':        'zipScreen',
    'movable-slats':     'movableSlats',
    'sliding-glass':     'slidingGlass',
    'fixed-glass':       'fixedGlass',
    'ventilation-panel': 'ventPanel',
    'metal-panel':       'metalPanel',
  };
  return map[t] ?? null;
}

function calcBreakdown(c: PConfig, ps: PergolaSettings): LineItem[] {
  const items: LineItem[] = [];
  const areaM2 = (c.width / 1000) * (c.depth / 1000);
  items.push({ label: 'Osnovna cena', amount: ps.basePrice });
  const areaDiff = areaM2 - ps.baseSqm;
  if (Math.abs(areaDiff) > 0.01)
    items.push({ label: `Površina (${areaM2.toFixed(2)} m²)`, amount: Math.round(areaDiff * ps.pricePerSqm) });
  if (ps.walls.enabled) {
    const wallCount = Object.values(c.houseWalls).filter(Boolean).length;
    if (wallCount > 0)
      items.push({ label: `Stene hiše (${wallCount}×)`, amount: -(wallCount * ps.walls.discountPerWall) });
  }
  if (ps.posts.enabled) {
    const postCount = Object.values(c.additionalPosts).filter(p => p.enabled).length;
    if (postCount > 0)
      items.push({ label: `Dodatni stebri (${postCount}×)`, amount: postCount * ps.posts.pricePerPost });
  }
  if (ps.colors.enabled) {
    const scAdj = ps.colors[c.structureColor.category as ColorCat]?.surcharge ?? 0;
    if (scAdj > 0) items.push({ label: `Barva konstr. (${c.structureColor.name})`, amount: scAdj });
    const slAdj = (ps.colors as unknown as Record<string, { surcharge: number }>)[c.slatsColor.category]?.surcharge ?? 0;
    if (slAdj > 0) items.push({ label: `Barva lamel (${c.slatsColor.name})`, amount: slAdj });
  }
  if (ps.enclosures.enabled) {
    const sides = ['front', 'back', 'left', 'right'] as const;
    const sideLabels = { front: 'Spredaj', back: 'Zadaj', left: 'Levo', right: 'Desno' };
    const dimForSide = (s: typeof sides[number]) => (s === 'left' || s === 'right') ? c.depth / 1000 : c.width / 1000;
    sides.forEach(side => {
      c.sideEnclosures[side].forEach(seg => {
        if (seg.type === 'none') return;
        const k = encKey(seg.type);
        if (!k) return;
        const enc = ps.enclosures[k];
        if (!enc.enabled) return;
        const len = dimForSide(side) / 2;
        items.push({ label: `Zapora ${sideLabels[side]}`, amount: Math.round(enc.priceBase + enc.pricePerM * len) });
      });
    });
  }
  if (ps.lights.enabled) {
    if (c.ledEdgeEnabled && ps.lights.ledEdge.enabled) {
      const ledSides = Object.entries(c.ledEdgeSides).filter(([, v]) => v);
      const totalM = ledSides.reduce((acc, [s]) => {
        return acc + ((s === 'left' || s === 'right') ? c.depth / 1000 : c.width / 1000);
      }, 0);
      items.push({ label: `LED rob (${totalM.toFixed(1)} m)`, amount: Math.round(totalM * ps.lights.ledEdge.pricePerM) });
    }
    if (c.ledStructureEnabled && ps.lights.ledStructure.enabled)
      items.push({ label: 'LED konstrukcija', amount: ps.lights.ledStructure.price });
  }
  if (ps.electrical.enabled && c.electricalPackage !== 'none') {
    const pkg = c.electricalPackage === 'nello' ? ps.electrical.nello : ps.electrical.somfy;
    if (pkg.enabled) items.push({ label: c.electricalPackage === 'nello' ? 'Nello Smart Motor' : 'Somfy Motorization', amount: pkg.price });
  }
  if (ps.addons.enabled) {
    ps.addons.items.forEach(a => {
      const qty = c.addonQty[a.id] ?? 0;
      if (qty > 0) items.push({ label: `${a.title} (${qty}× ${a.unit})`, amount: qty * a.pricePerUnit });
    });
  }
  return items;
}

function calcTotal(c: PConfig, ps: PergolaSettings): number {
  return calcBreakdown(c, ps).reduce((s, i) => s + i.amount, 0);
}

function fmtEur(v: number): string {
  return new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

// ── Mini UI helpers ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 40, height: 22, borderRadius: 11, cursor: 'pointer', flexShrink: 0, position: 'relative', transition: 'background .15s', background: checked ? '#1a1a1a' : '#d1d5db' }}
    >
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </div>
  );
}

function ColorSwatch({ opt, selected, onSelect }: { opt: ColorOption; selected: boolean; onSelect: () => void }) {
  return (
    <div onClick={onSelect} title={opt.name} style={{
      width: 32, height: 32, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
      background: opt.hex,
      outline: selected ? '2px solid #1a1a1a' : '2px solid transparent',
      outlineOffset: 2,
      boxShadow: selected ? '0 0 0 1px #fff inset' : 'none',
      transition: 'outline .1s',
    }} />
  );
}

// ── Step sections ─────────────────────────────────────────────────────────────

function SlatsSection({ config, setConfig }: { config: PConfig; setConfig: (p: Partial<PConfig>) => void }) {
  return (
    <div className="ps-section">
      <div className="ps-row-2">
        {(['flat', 'wavy'] as SlatsType[]).map(t => (
          <button key={t} onClick={() => setConfig({ slatsType: t })} className={`ps-opt-card${config.slatsType === t ? ' active' : ''}`}>
            <div className="ps-opt-icon">{t === 'flat' ? '▬' : '∿'}</div>
            <div className="ps-opt-label">{t === 'flat' ? 'Ravne lamele' : 'Valovite lamele'}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DimsSection({ config, setConfig, ps }: { config: PConfig; setConfig: (p: Partial<PConfig>) => void; ps: PergolaSettings }) {
  const { minW, maxW, minD, maxD } = ps.dims;
  return (
    <div className="ps-section">
      <div className="ps-field">
        <div className="ps-field-row">
          <label className="ps-label">Širina</label>
          <span className="ps-val-badge">{(config.width / 10).toFixed(0)} cm</span>
        </div>
        <input type="range" className="ps-range" min={minW} max={maxW} step={50}
          value={config.width} onChange={e => setConfig({ width: +e.target.value })} />
        <div className="ps-range-bounds"><span>{(minW / 10).toFixed(0)} cm</span><span>{(maxW / 10).toFixed(0)} cm</span></div>
      </div>
      <div className="ps-field">
        <div className="ps-field-row">
          <label className="ps-label">Globina</label>
          <span className="ps-val-badge">{(config.depth / 10).toFixed(0)} cm</span>
        </div>
        <input type="range" className="ps-range" min={minD} max={maxD} step={50}
          value={config.depth} onChange={e => setConfig({ depth: +e.target.value })} />
        <div className="ps-range-bounds"><span>{(minD / 10).toFixed(0)} cm</span><span>{(maxD / 10).toFixed(0)} cm</span></div>
      </div>
    </div>
  );
}

function WallsSection({ config, setConfig }: { config: PConfig; setConfig: (p: Partial<PConfig>) => void }) {
  const sides: (keyof PConfig['houseWalls'])[] = ['front', 'back', 'left', 'right'];
  const labels = { front: 'Spredaj', back: 'Zadaj', left: 'Levo', right: 'Desno' };
  return (
    <div className="ps-section">
      <p className="ps-hint">Označite stranice, kjer je pergola pritrjena na steno hiše (popust na ceno).</p>
      <div className="ps-row-2">
        {sides.map(s => (
          <button key={s} onClick={() => setConfig({ houseWalls: { ...config.houseWalls, [s]: !config.houseWalls[s] } })}
            className={`ps-opt-card${config.houseWalls[s] ? ' active' : ''}`}>
            <div className="ps-opt-label">{labels[s]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PostsSection({ config, setConfig, ps }: { config: PConfig; setConfig: (p: Partial<PConfig>) => void; ps: PergolaSettings }) {
  const sides: (keyof PConfig['additionalPosts'])[] = ['front', 'rear', 'left', 'right'];
  const labels = { front: 'Spredaj', rear: 'Zadaj', left: 'Levo', right: 'Desno' };
  return (
    <div className="ps-section">
      <p className="ps-hint">Dodajte vmesne stebre za večje razpone.</p>
      <div className="ps-row-2">
        {sides.map(s => {
          const entry = config.additionalPosts[s];
          return (
            <button key={s} onClick={() => setConfig({ additionalPosts: { ...config.additionalPosts, [s]: { ...entry, enabled: !entry.enabled } } })}
              className={`ps-opt-card${entry.enabled ? ' active' : ''}`}>
              <div className="ps-opt-label">{labels[s]}</div>
              <div className="ps-opt-sub">+{ps.posts.pricePerPost} €</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorsSection({ config, setConfig, ps }: { config: PConfig; setConfig: (p: Partial<PConfig>) => void; ps: PergolaSettings }) {
  const [structTab, setStructTab] = useState<ColorCat>('standard');
  const [slatsTab, setSlatsTab]   = useState<SlatsCat>('standard');
  const enabledCats = (['standard','ral','wood','special'] as ColorCat[]).filter(c => ps.colors[c]?.enabled);
  const enabledSlatsCats = (['standard','ral','special'] as SlatsCat[]).filter(c => {
    if (c === 'standard') return ps.colors.standard.enabled;
    if (c === 'ral') return ps.colors.ral.enabled;
    return ps.colors.special.enabled;
  });
  return (
    <div className="ps-section">
      <div className="ps-subsec">
        <div className="ps-sublabel">Barva konstrukcije</div>
        <div className="ps-tabs">
          {enabledCats.map(cat => (
            <button key={cat} onClick={() => setStructTab(cat)} className={`ps-tab${structTab === cat ? ' active' : ''}`}>
              {cat === 'standard' ? 'Standard' : cat === 'ral' ? 'RAL' : cat === 'wood' ? 'Les' : 'Special'}
            </button>
          ))}
        </div>
        <div className="ps-swatches">
          {(COLORS[structTab] ?? []).map(opt => (
            <ColorSwatch key={opt.id} opt={opt} selected={config.structureColor.id === opt.id}
              onSelect={() => setConfig({ structureColor: { category: structTab, ...opt } })} />
          ))}
        </div>
        {config.structureColor.id && (
          <div className="ps-color-name">{config.structureColor.name}</div>
        )}
      </div>
      <div className="ps-subsec">
        <div className="ps-sublabel">Barva lamel</div>
        <div className="ps-tabs">
          {enabledSlatsCats.map(cat => (
            <button key={cat} onClick={() => setSlatsTab(cat)} className={`ps-tab${slatsTab === cat ? ' active' : ''}`}>
              {cat === 'standard' ? 'Standard' : cat === 'ral' ? 'RAL' : 'Special'}
            </button>
          ))}
        </div>
        <div className="ps-swatches">
          {(SLATS_COLORS[slatsTab] ?? []).map(opt => (
            <ColorSwatch key={opt.id} opt={opt} selected={config.slatsColor.id === opt.id}
              onSelect={() => setConfig({ slatsColor: { category: slatsTab, ...opt } })} />
          ))}
        </div>
        {config.slatsColor.id && (
          <div className="ps-color-name">{config.slatsColor.name}</div>
        )}
      </div>
    </div>
  );
}

const ENC_OPTIONS: { type: EnclosureType; label: string; desc: string }[] = [
  { type: 'none',              label: 'Brez',                desc: 'Odprta stranica' },
  { type: 'zip-screen',        label: 'ZIP Screen',          desc: 'Senčilo z vodili' },
  { type: 'movable-slats',     label: 'Premične lamele',     desc: 'Aluminijaste lamele' },
  { type: 'sliding-glass',     label: 'Drsno steklo',        desc: 'Drsni stekleni panel' },
  { type: 'fixed-glass',       label: 'Fiksno steklo',       desc: 'Fiksni stekleni panel' },
  { type: 'ventilation-panel', label: 'Ventilacijski panel', desc: 'S prezračevanjem' },
  { type: 'metal-panel',       label: 'Kovinski panel',      desc: 'Polni aluminij' },
];

function EnclosuresSection({ config, setConfig, ps }: { config: PConfig; setConfig: (p: Partial<PConfig>) => void; ps: PergolaSettings }) {
  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'left' | 'right'>('front');
  const [activeSegment, setActiveSegment] = useState<0 | 1>(0);
  const sideLabels = { front: 'Spredaj', back: 'Zadaj', left: 'Levo', right: 'Desno' };

  const enabledOptions = ENC_OPTIONS.filter(o => {
    if (o.type === 'none') return true;
    const k = encKey(o.type);
    if (!k) return false;
    return ps.enclosures[k].enabled;
  });

  const setSegType = (t: EnclosureType) => {
    const segs = [...config.sideEnclosures[activeSide]] as [EncSeg, EncSeg];
    segs[activeSegment] = { ...segs[activeSegment], type: t };
    setConfig({ sideEnclosures: { ...config.sideEnclosures, [activeSide]: segs } });
  };

  const current = config.sideEnclosures[activeSide][activeSegment];

  return (
    <div className="ps-section">
      <div className="ps-tabs" style={{ marginBottom: 12 }}>
        {(['front','back','left','right'] as const).map(s => (
          <button key={s} onClick={() => setActiveSide(s)} className={`ps-tab${activeSide === s ? ' active' : ''}`}>
            {sideLabels[s]}
          </button>
        ))}
      </div>
      <div className="ps-tabs" style={{ marginBottom: 12 }}>
        <button onClick={() => setActiveSegment(0)} className={`ps-tab${activeSegment === 0 ? ' active' : ''}`}>Segment 1</button>
        <button onClick={() => setActiveSegment(1)} className={`ps-tab${activeSegment === 1 ? ' active' : ''}`}>Segment 2</button>
      </div>
      <div className="ps-enc-grid">
        {enabledOptions.map(o => (
          <button key={o.type} onClick={() => setSegType(o.type)} className={`ps-enc-opt${current.type === o.type ? ' active' : ''}`}>
            <div className="ps-enc-label">{o.label}</div>
            <div className="ps-enc-desc">{o.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function LightsSection({ config, setConfig, ps }: { config: PConfig; setConfig: (p: Partial<PConfig>) => void; ps: PergolaSettings }) {
  const sides: (keyof LEDSides)[] = ['front', 'back', 'left', 'right'];
  const labels = { front: 'Spredaj', back: 'Zadaj', left: 'Levo', right: 'Desno' };
  return (
    <div className="ps-section">
      {ps.lights.ledEdge.enabled && (
        <div className="ps-subsec">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <Toggle checked={config.ledEdgeEnabled} onChange={v => setConfig({ ledEdgeEnabled: v })} />
            <div>
              <div className="ps-sublabel" style={{ marginBottom: 2 }}>LED rob (notranji)</div>
              <div className="ps-hint" style={{ margin: 0 }}>Osvetlitev vzdolž notranjih robov strehe</div>
            </div>
          </div>
          {config.ledEdgeEnabled && (
            <div className="ps-row-2">
              {sides.map(s => (
                <button key={s} onClick={() => setConfig({ ledEdgeSides: { ...config.ledEdgeSides, [s]: !config.ledEdgeSides[s] } })}
                  className={`ps-opt-card small${config.ledEdgeSides[s] ? ' active' : ''}`}>
                  {labels[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {ps.lights.ledStructure.enabled && (
        <div className="ps-subsec">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle checked={config.ledStructureEnabled} onChange={v => setConfig({ ledStructureEnabled: v })} />
            <div>
              <div className="ps-sublabel" style={{ marginBottom: 2 }}>LED zunanja konstrukcija</div>
              <div className="ps-hint" style={{ margin: 0 }}>Ambientalna osvetlitev zunanje konstrukcije</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ElectricalSection({ config, setConfig, ps }: { config: PConfig; setConfig: (p: Partial<PConfig>) => void; ps: PergolaSettings }) {
  const options = ([
    { id: 'none'  as ElecPkg, label: 'Brez',               desc: 'Ročno upravljanje',          price: 0,                         available: true },
    { id: 'nello' as ElecPkg, label: 'Nello Smart Motor',  desc: 'Motorizacija + app control',  price: ps.electrical.nello.price, available: ps.electrical.nello.enabled },
    { id: 'somfy' as ElecPkg, label: 'Somfy Motorization', desc: 'Premium motorizacija',        price: ps.electrical.somfy.price, available: ps.electrical.somfy.enabled },
  ]).filter(o => o.available);
  return (
    <div className="ps-section">
      <div className="ps-row-1">
        {options.map(o => (
          <button key={o.id} onClick={() => setConfig({ electricalPackage: o.id })}
            className={`ps-opt-card horiz${config.electricalPackage === o.id ? ' active' : ''}`}>
            <div style={{ flex: 1 }}>
              <div className="ps-opt-label">{o.label}</div>
              <div className="ps-opt-sub">{o.desc}</div>
            </div>
            {o.price > 0 && <div className="ps-opt-price">+{fmtEur(o.price)}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

function AddonsSection({ config, setConfig, ps }: { config: PConfig; setConfig: (p: Partial<PConfig>) => void; ps: PergolaSettings }) {
  const items = ps.addons.items;
  return (
    <div className="ps-section">
      {items.map(item => {
        const qty = config.addonQty[item.id] ?? item.minQty;
        return (
          <div key={item.id} className="ps-addon-row">
            <div className="ps-addon-info">
              <div className="ps-addon-title">{item.title}</div>
              {item.description && <div className="ps-addon-desc">{item.description}</div>}
              <div className="ps-addon-price">{fmtEur(item.pricePerUnit)} / {item.unit}</div>
            </div>
            <div className="ps-qty">
              <button className="ps-qty-btn" disabled={qty <= item.minQty}
                onClick={() => {
                  const next = Math.max(item.minQty, qty - 1);
                  setConfig({ addonQty: { ...config.addonQty, [item.id]: next } });
                }}>−</button>
              <span className="ps-qty-val">{qty}</span>
              <button className="ps-qty-btn" disabled={qty >= item.maxQty}
                onClick={() => {
                  const next = Math.min(item.maxQty, qty + 1);
                  setConfig({ addonQty: { ...config.addonQty, [item.id]: next } });
                }}>+</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContactSection({ contact, setContact }: { contact: ContactForm; setContact: (p: Partial<ContactForm>) => void }) {
  return (
    <div className="ps-section">
      <div className="ps-field"><label className="ps-label">Ime in priimek *</label>
        <input className="ps-input" value={contact.name} onChange={e => setContact({ name: e.target.value })} placeholder="Janez Novak" /></div>
      <div className="ps-field"><label className="ps-label">E-mail *</label>
        <input className="ps-input" type="email" value={contact.email} onChange={e => setContact({ email: e.target.value })} placeholder="janez@email.si" /></div>
      <div className="ps-field"><label className="ps-label">Telefon</label>
        <input className="ps-input" type="tel" value={contact.phone} onChange={e => setContact({ phone: e.target.value })} placeholder="+386 40 123 456" /></div>
      <div className="ps-field"><label className="ps-label">Kraj</label>
        <input className="ps-input" value={contact.city} onChange={e => setContact({ city: e.target.value })} placeholder="Ljubljana" /></div>
    </div>
  );
}

// ── Camera view tabs ──────────────────────────────────────────────────────────

const CAM_VIEWS: { id: CameraView; label: string }[] = [
  { id: '3D', label: '3D' }, { id: 'Front', label: 'Spredaj' },
  { id: 'Side', label: 'Stran' }, { id: 'Top', label: 'Zgoraj' },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [apiCfg, setApiCfg]     = useState<PublicCfg | null>(null);
  const [loadErr, setLoadErr]   = useState('');
  const [ps, setPs]             = useState<PergolaSettings>(defaultPS);
  const [config, setConfig]     = useState<PConfig>(() => defaultConfig(defaultPS()));
  const [stepIdx, setStepIdx]   = useState(0);
  const [cameraView, setCameraView] = useState<CameraView>('3D');
  const [contact, setContact]   = useState<ContactForm>({ name: '', email: '', phone: '', city: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitErr, setSubmitErr]   = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const updateConfig = useCallback((patch: Partial<PConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  const updateContact = useCallback((patch: Partial<ContactForm>) => {
    setContact(prev => ({ ...prev, ...patch }));
  }, []);

  // Load configurator
  useEffect(() => {
    const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
    fetch(`/api/v1/public/configurators/${id}${preview ? '?preview=1' : ''}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: PublicCfg) => {
        if (d.branding.primary) document.documentElement.style.setProperty('--c', d.branding.primary);
        if (d.branding.font) document.documentElement.style.setProperty('--fp', `"${d.branding.font}", ui-sans-serif, sans-serif`);
        document.title = d.schema.name;
        const loadedPs = d.schema.pergolaSettings ?? defaultPS();
        setApiCfg(d);
        setPs(loadedPs);
        setConfig(defaultConfig(loadedPs));
      })
      .catch(() => setLoadErr('Konfiguratorja ni mogoče naložiti.'));
  }, [id]);

  // Build steps from enabled sections
  const steps = useMemo((): { id: string; title: string; content: React.ReactNode }[] => {
    const list: { id: string; title: string; content: React.ReactNode }[] = [];
    if (ps.slats.enabled)
      list.push({ id: 'slats', title: 'Tip lamel', content: <SlatsSection config={config} setConfig={updateConfig} /> });
    if (ps.dims.enabled)
      list.push({ id: 'dims', title: 'Dimenzije', content: <DimsSection config={config} setConfig={updateConfig} ps={ps} /> });
    if (ps.walls.enabled)
      list.push({ id: 'walls', title: 'Stene hiše', content: <WallsSection config={config} setConfig={updateConfig} /> });
    if (ps.posts.enabled)
      list.push({ id: 'posts', title: 'Stebri', content: <PostsSection config={config} setConfig={updateConfig} ps={ps} /> });
    if (ps.colors.enabled)
      list.push({ id: 'colors', title: 'Barve', content: <ColorsSection config={config} setConfig={updateConfig} ps={ps} /> });
    if (ps.enclosures.enabled)
      list.push({ id: 'enclosures', title: 'Bočne zapore', content: <EnclosuresSection config={config} setConfig={updateConfig} ps={ps} /> });
    if (ps.lights.enabled)
      list.push({ id: 'lights', title: 'Razsvetljava', content: <LightsSection config={config} setConfig={updateConfig} ps={ps} /> });
    if (ps.electrical.enabled)
      list.push({ id: 'electrical', title: 'Električni paket', content: <ElectricalSection config={config} setConfig={updateConfig} ps={ps} /> });
    if (ps.addons.enabled && ps.addons.items.length > 0)
      list.push({ id: 'addons', title: 'Dodatki', content: <AddonsSection config={config} setConfig={updateConfig} ps={ps} /> });
    list.push({ id: 'contact', title: 'Kontakt', content: <ContactSection contact={contact} setContact={updateContact} /> });
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ps, config, contact]);

  const totalSteps = steps.length;
  const isLast = stepIdx === totalSteps - 1;

  const pergolaConfig = useMemo((): PergolaConfig => ({
    width: config.width / 10,
    depth: config.depth / 10,
    height: config.height / 10,
    slatsType: config.slatsType,
    lamelleAngle: 0,
    houseWalls: config.houseWalls,
    additionalPosts: config.additionalPosts,
    structureColor: config.structureColor.hex,
    slatsColor: config.slatsColor.hex,
    sideEnclosures: {
      front: config.sideEnclosures.front as [EnclosureSegment, EnclosureSegment],
      back:  config.sideEnclosures.back  as [EnclosureSegment, EnclosureSegment],
      left:  config.sideEnclosures.left  as [EnclosureSegment, EnclosureSegment],
      right: config.sideEnclosures.right as [EnclosureSegment, EnclosureSegment],
    },
    ledEdgeEnabled: config.ledEdgeEnabled,
    ledEdgeSides: config.ledEdgeSides,
    ledStructureEnabled: config.ledStructureEnabled,
    heatersEnabled: ps.addons.items.some(a => a.id === 'heating') && (config.addonQty['heating'] ?? 0) > 0,
  }), [config, ps]);

  const total = useMemo(() => calcTotal(config, ps), [config, ps]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!contact.name.trim() || !contact.email.trim()) {
      setSubmitErr('Prosimo vnesite ime in e-mail naslov.');
      return;
    }
    if (!apiCfg) return;
    setSubmitting(true);
    setSubmitErr('');
    try {
      const state: Record<string, unknown> = {
        width: config.width, depth: config.depth, height: config.height,
        slatsType: config.slatsType,
        houseWalls: config.houseWalls,
        additionalPosts: config.additionalPosts,
        structureColor: config.structureColor,
        slatsColor: config.slatsColor,
        sideEnclosures: config.sideEnclosures,
        ledEdgeEnabled: config.ledEdgeEnabled, ledEdgeSides: config.ledEdgeSides,
        ledStructureEnabled: config.ledStructureEnabled,
        electricalPackage: config.electricalPackage,
        addonQty: config.addonQty,
        estimatedTotal: total,
        breakdown: calcBreakdown(config, ps),
      };
      const res = await fetch(`/api/v1/public/configurators/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: apiCfg.version, state, contact }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSubmitted(true);
    } catch (e) {
      setSubmitErr('Napaka pri pošiljanju. Prosimo poskusite znova.');
    } finally {
      setSubmitting(false);
    }
  }, [contact, apiCfg, config, total, ps, id]);

  // ── Render ──

  if (loadErr) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f2ec' }}>
      <div style={{ textAlign: 'center', color: '#737373' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 15 }}>{loadErr}</div>
      </div>
    </div>
  );

  if (!apiCfg) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f2ec' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #c8d0d8', borderTopColor: '#5a7a8a', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  );

  if (submitted) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f2ec', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>✓</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: '#171717' }}>Povpraševanje poslano!</div>
      <div style={{ fontSize: 15, color: '#737373', textAlign: 'center', maxWidth: 360 }}>
        Hvala, {contact.name.split(' ')[0]}. Kontaktirali vas bomo v najkrajšem možnem času.
      </div>
      <button
        onClick={() => { setSubmitted(false); setStepIdx(0); setConfig(defaultConfig(ps)); setContact({ name:'',email:'',phone:'',city:'' }); setSubmitErr(''); }}
        style={{ marginTop: 8, padding: '10px 24px', border: '1px solid #e3e3e3', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer', color: '#525252' }}
      >
        ← Konfiguriraj znova
      </button>
    </div>
  );

  const currentStep = steps[stepIdx];

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        body{overflow:hidden}
        #papp{display:flex;flex-direction:column;height:100svh;background:#f5f2ec;font-family:var(--fp,ui-sans-serif,system-ui,sans-serif)}
        /* Stepper */
        #papp-stepper{display:flex;align-items:center;gap:0;padding:0 16px;height:52px;background:#fff;border-bottom:1px solid #e8e4dc;overflow-x:auto;flex-shrink:0;scrollbar-width:none}
        #papp-stepper::-webkit-scrollbar{display:none}
        .ps-step{display:flex;align-items:center;gap:6px;padding:0 10px;cursor:pointer;white-space:nowrap;flex-shrink:0;border-bottom:2px solid transparent;height:100%;transition:border-color .15s}
        .ps-step.active{border-bottom-color:#1a1a1a}
        .ps-step.done{opacity:.7}
        .ps-step-num{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;background:#e8e4dc;color:#737373;flex-shrink:0;transition:background .15s,color .15s}
        .ps-step.active .ps-step-num{background:#1a1a1a;color:#fff}
        .ps-step.done .ps-step-num{background:#d1fae5;color:#059669}
        .ps-step-label{font-size:12.5px;font-weight:500;color:#525252}
        .ps-step.active .ps-step-label{color:#171717}
        .ps-sep{width:14px;height:1px;background:#d4d0c8;flex-shrink:0}
        /* Content area */
        #papp-body{flex:1;display:grid;grid-template-columns:1.2fr 1fr;overflow:hidden;min-height:0}
        /* 3D panel */
        #papp-3d{display:flex;flex-direction:column;position:relative;background:linear-gradient(175deg,#e8edf2,#d6dde6);overflow:hidden}
        .p3d-canvas{flex:1;min-height:0}
        .p3d-camtabs{position:absolute;top:10px;left:50%;transform:translateX(-50%);display:flex;gap:4px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);border-radius:20px;padding:3px;box-shadow:0 2px 8px rgba(0,0,0,.12)}
        .p3d-camtab{border:none;background:none;padding:4px 12px;font-size:12px;font-weight:500;color:#525252;cursor:pointer;border-radius:16px;transition:background .15s,color .15s;font-family:inherit}
        .p3d-camtab.active{background:#1a1a1a;color:#fff}
        .p3d-areabar{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:12px;background:rgba(255,255,255,.88);backdrop-filter:blur(8px);border-radius:20px;padding:5px 14px;font-size:12px;color:#525252;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.1)}
        .p3d-areabar b{color:#171717;font-weight:600;font-family:ui-monospace,monospace}
        /* Form panel */
        #papp-form{display:flex;flex-direction:column;background:#fff;border-left:1px solid #e8e4dc;overflow:hidden}
        .pf-head{padding:16px 20px 12px;border-bottom:1px solid #f0ece4;flex-shrink:0}
        .pf-title{font-size:16px;font-weight:600;color:#171717}
        .pf-sub{font-size:12.5px;color:#737373;margin-top:3px}
        .pf-scroll{flex:1;overflow-y:auto;padding:4px 0}
        /* Price bar */
        #papp-pricebar{display:flex;align-items:center;gap:12px;padding:12px 20px;background:#fff;border-top:1px solid #e8e4dc;flex-shrink:0}
        .ppb-price{flex:1}
        .ppb-label{font-size:11px;color:#a3a3a3;text-transform:uppercase;letter-spacing:.06em}
        .ppb-val{font-size:20px;font-weight:700;color:#171717;font-family:ui-monospace,monospace;letter-spacing:-.02em}
        .ppb-back{padding:0 18px;height:40px;border:1px solid #e3e3e3;background:#fff;border-radius:8px;font-size:13.5px;font-weight:500;cursor:pointer;color:#525252;font-family:inherit;transition:background .15s}
        .ppb-back:hover{background:#f5f2ec}
        .ppb-next{padding:0 20px;height:40px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:13.5px;font-weight:500;cursor:pointer;font-family:inherit;transition:background .15s}
        .ppb-next:hover{background:#333}
        .ppb-next:disabled{opacity:.55;cursor:default}
        /* Section content */
        .ps-section{padding:16px 20px}
        .ps-field{margin-bottom:14px}
        .ps-field-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
        .ps-label{font-size:13px;font-weight:500;color:#374151}
        .ps-val-badge{font-size:13px;font-weight:600;font-family:ui-monospace,monospace;background:#f5f2ec;border-radius:6px;padding:2px 8px;color:#1a1a1a}
        .ps-range{width:100%;accent-color:#1a1a1a;height:4px;cursor:pointer}
        .ps-range-bounds{display:flex;justify-content:space-between;font-size:11px;color:#a3a3a3;margin-top:3px}
        .ps-hint{font-size:12.5px;color:#737373;margin-bottom:12px;line-height:1.5}
        .ps-row-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .ps-row-1{display:flex;flex-direction:column;gap:8px}
        .ps-opt-card{border:1.5px solid #e8e4dc;border-radius:10px;padding:12px 14px;cursor:pointer;background:#fff;text-align:left;transition:border-color .15s,background .15s;font-family:inherit}
        .ps-opt-card.active{border-color:#1a1a1a;background:#f8f8f8}
        .ps-opt-card.horiz{display:flex;align-items:center;gap:12px}
        .ps-opt-card.small{padding:8px 10px;font-size:12.5px}
        .ps-opt-icon{font-size:20px;margin-bottom:6px;color:#374151}
        .ps-opt-label{font-size:13px;font-weight:500;color:#171717}
        .ps-opt-sub{font-size:12px;color:#737373;margin-top:2px}
        .ps-opt-price{font-size:13px;font-weight:600;font-family:ui-monospace,monospace;color:#059669;white-space:nowrap}
        .ps-tabs{display:flex;gap:4px;flex-wrap:wrap}
        .ps-tab{padding:5px 12px;border:1px solid #e8e4dc;border-radius:20px;background:#fff;font-size:12.5px;font-weight:500;color:#525252;cursor:pointer;font-family:inherit;transition:all .15s}
        .ps-tab.active{background:#1a1a1a;color:#fff;border-color:#1a1a1a}
        .ps-swatches{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
        .ps-color-name{font-size:11.5px;color:#737373;margin-top:8px}
        .ps-subsec{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f0ece4}
        .ps-subsec:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
        .ps-sublabel{font-size:13px;font-weight:600;color:#171717;margin-bottom:8px}
        .ps-enc-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .ps-enc-opt{border:1.5px solid #e8e4dc;border-radius:8px;padding:10px 12px;cursor:pointer;background:#fff;text-align:left;font-family:inherit;transition:border-color .15s,background .15s}
        .ps-enc-opt.active{border-color:#1a1a1a;background:#f8f8f8}
        .ps-enc-label{font-size:12.5px;font-weight:500;color:#171717}
        .ps-enc-desc{font-size:11.5px;color:#737373;margin-top:2px}
        .ps-addon-row{display:flex;align-items:flex-start;gap:12px;padding:14px 20px;border-bottom:1px solid #f0ece4}
        .ps-addon-row:last-child{border-bottom:none}
        .ps-addon-info{flex:1}
        .ps-addon-title{font-size:13.5px;font-weight:500;color:#171717}
        .ps-addon-desc{font-size:12px;color:#737373;margin-top:2px}
        .ps-addon-price{font-size:12.5px;font-weight:600;color:#059669;margin-top:4px;font-family:ui-monospace,monospace}
        .ps-qty{display:flex;align-items:center;gap:8px;margin-top:2px}
        .ps-qty-btn{width:28px;height:28px;border:1.5px solid #e3e3e3;border-radius:6px;background:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;color:#374151;font-family:inherit;transition:background .1s}
        .ps-qty-btn:hover:not(:disabled){background:#f5f2ec}
        .ps-qty-btn:disabled{opacity:.4;cursor:default}
        .ps-qty-val{font-size:15px;font-weight:600;font-family:ui-monospace,monospace;min-width:20px;text-align:center;color:#171717}
        .ps-input{width:100%;border:1.5px solid #e3e3e3;border-radius:8px;padding:9px 12px;font-size:13.5px;font-family:inherit;outline:none;background:#fff;margin-top:4px;transition:border-color .15s}
        .ps-input:focus{border-color:#1a1a1a}
        .ps-err{color:#dc2626;font-size:12.5px;margin-top:8px;padding:0 20px}
        @media(max-width:780px){
          #papp-body{grid-template-columns:1fr;grid-template-rows:45vh 1fr}
          .p3d-camtabs{top:6px}
          .p3d-areabar{bottom:6px}
        }
      `}</style>

      <div id="papp">
        {/* ── Stepper ── */}
        <div id="papp-stepper">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              {i > 0 && <div className="ps-sep" />}
              <div
                className={`ps-step${i === stepIdx ? ' active' : ''}${i < stepIdx ? ' done' : ''}`}
                onClick={() => i < stepIdx && setStepIdx(i)}
              >
                <div className="ps-step-num">{i < stepIdx ? '✓' : i + 1}</div>
                <div className="ps-step-label">{step.title}</div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* ── Body ── */}
        <div id="papp-body">
          {/* 3D panel */}
          <div id="papp-3d">
            <div className="p3d-canvas">
              <Pergola3D cfg={pergolaConfig} cameraView={cameraView} />
            </div>
            <div className="p3d-camtabs">
              {CAM_VIEWS.map(v => (
                <button key={v.id} className={`p3d-camtab${cameraView === v.id ? ' active' : ''}`} onClick={() => setCameraView(v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
            <div className="p3d-areabar">
              <span><b>{(config.width / 10).toFixed(0)}</b> cm šir.</span>
              <span><b>{(config.depth / 10).toFixed(0)}</b> cm glob.</span>
              <span><b>{((config.width / 1000) * (config.depth / 1000)).toFixed(1)}</b> m²</span>
            </div>
          </div>

          {/* Form panel */}
          <div id="papp-form">
            <div className="pf-head">
              <div className="pf-title">{currentStep.title}</div>
              <div className="pf-sub">Korak {stepIdx + 1} od {totalSteps}</div>
            </div>
            <div className="pf-scroll" ref={formRef}>
              {currentStep.content}
              {submitErr && <div className="ps-err">{submitErr}</div>}
            </div>
            {/* Price bar */}
            <div id="papp-pricebar">
              <div className="ppb-price">
                <div className="ppb-label">Ocenjena cena</div>
                <div className="ppb-val">{fmtEur(total)}</div>
              </div>
              {stepIdx > 0 && (
                <button className="ppb-back" onClick={() => { setStepIdx(s => s - 1); formRef.current?.scrollTo(0, 0); }}>
                  ← Nazaj
                </button>
              )}
              {!isLast ? (
                <button className="ppb-next" onClick={() => { setStepIdx(s => s + 1); formRef.current?.scrollTo(0, 0); }}>
                  Naprej →
                </button>
              ) : (
                <button className="ppb-next" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? 'Pošiljam...' : 'Pošlji povpraševanje →'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

