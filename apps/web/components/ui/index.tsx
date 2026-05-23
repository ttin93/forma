'use client';

import React from 'react';

// ─── Wordmark ───────────────────────────────────────────────
export function Wordmark({ size = 16 }: { size?: number }) {
  return (
    <span
      className="font-sans font-semibold text-ink"
      style={{ fontSize: size, letterSpacing: '-0.04em', display: 'inline-flex', alignItems: 'baseline' }}
    >
      Forma
      <span
        style={{
          width: size * 0.35,
          height: size * 0.35,
          display: 'inline-block',
          background: '#000',
          marginLeft: 2,
          verticalAlign: '1px',
        }}
      />
    </span>
  );
}

// ─── Button ────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'invert';
type BtnSize = 'sm' | 'md' | 'lg';

const btnBase =
  'inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap cursor-pointer border transition-colors';

const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-ink text-white border-ink hover:bg-[#1a1a1a]',
  secondary: 'bg-white text-ink border-line-3 hover:border-line-2',
  ghost: 'bg-transparent text-text border-transparent hover:bg-surface',
  danger: 'bg-white text-ink border-line-3 hover:border-line-2',
  invert: 'bg-white text-ink border-white hover:bg-surface',
};

const btnSizes: Record<BtnSize, string> = {
  sm: 'text-[12.5px] px-[10px] h-[26px] rounded-[var(--radius-1)]',
  md: 'text-[13.5px] px-[14px] h-[32px] rounded-[var(--radius-2)]',
  lg: 'text-[14.5px] px-[18px] h-[40px] rounded-[var(--radius-2)]',
};

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  full?: boolean;
}

export function Btn({ children, variant = 'primary', size = 'md', icon, iconRight, full, className = '', ...rest }: BtnProps) {
  return (
    <button
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

// ─── Badge ─────────────────────────────────────────────────
type BadgeKind = 'neutral' | 'live' | 'new' | 'warn' | 'off';

const dotColors: Record<BadgeKind, string> = {
  neutral: '#a3a3a3',
  live: '#0a0a0a',
  new: '#0a0a0a',
  warn: '#737373',
  off: '#d4d4d4',
};

export function Badge({ children, kind = 'neutral', dot = true, size = 'md' }: {
  children: React.ReactNode;
  kind?: BadgeKind;
  dot?: boolean;
  size?: 'sm' | 'md';
}) {
  const sz = size === 'sm'
    ? { fontSize: 10.5, padding: '2px 7px', height: 18 }
    : { fontSize: 11.5, padding: '3px 8px', height: 22 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-text-2)',
      background: 'var(--color-surface)', border: '1px solid var(--color-line)',
      borderRadius: 'var(--radius-pill)', textTransform: 'uppercase', letterSpacing: '0.04em',
      ...sz,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 5, background: dotColors[kind], flexShrink: 0 }} />}
      {children}
    </span>
  );
}

// ─── Avatar ────────────────────────────────────────────────
export function Avatar({ name = '?', size = 28, src }: { name?: string; size?: number; src?: string }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  if (src) {
    return (
      <img src={src} alt={name}
        style={{ width: size, height: size, borderRadius: size, objectFit: 'cover', border: '1px solid var(--color-line)' }} />
    );
  }
  return (
    <span style={{
      width: size, height: size, borderRadius: size,
      background: '#0a0a0a', color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: Math.round(size * 0.36),
      letterSpacing: '0.02em', flexShrink: 0,
    }}>
      {initials}
    </span>
  );
}

// ─── Input ─────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  adornStart?: React.ReactNode;
  adornEnd?: React.ReactNode;
  full?: boolean;
  error?: string;
}

export function Input({ label, hint, adornStart, adornEnd, full, error, className = '', ...rest }: InputProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, width: full ? '100%' : 'auto' }}>
      {label && (
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)' }}>{label}</span>
      )}
      <span style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: `1px solid ${error ? '#ef4444' : 'var(--color-line-2)'}`,
        borderRadius: 'var(--radius-2)',
        background: '#fff', padding: '0 12px', height: 36,
      }}>
        {adornStart && <span style={{ color: 'var(--color-muted)' }}>{adornStart}</span>}
        <input
          style={{
            border: 0, outline: 0, background: 'transparent', flex: 1,
            fontFamily: 'inherit', fontSize: 13.5, color: 'var(--color-text)', minWidth: 0,
          }}
          className={className}
          {...rest}
        />
        {adornEnd && <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>{adornEnd}</span>}
      </span>
      {(hint || error) && (
        <span style={{ fontSize: 11.5, color: error ? '#ef4444' : 'var(--color-muted)' }}>
          {error ?? hint}
        </span>
      )}
    </label>
  );
}

// ─── Card ──────────────────────────────────────────────────
export function Card({ children, pad = 20, className = '', style }: {
  children: React.ReactNode;
  pad?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--color-line)',
      borderRadius: 'var(--radius-3)', padding: pad, ...style,
    }} className={className}>
      {children}
    </div>
  );
}

// ─── Stat KPI ──────────────────────────────────────────────
export function Stat({ label, value, delta, deltaKind = 'pos', sub }: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaKind?: 'pos' | 'neg';
  sub?: string;
}) {
  return (
    <Card pad={18} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 500 }}>{label}</span>
        {delta && (
          <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: deltaKind === 'pos' ? 'var(--color-text)' : 'var(--color-muted)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {deltaKind === 'pos' ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </Card>
  );
}

// ─── Sparkline ─────────────────────────────────────────────
export function Spark({ data = [], height = 36 }: { data: number[]; height?: number }) {
  const w = 200, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const r = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / r) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      <polygon points={area} fill="#0a0a0a" opacity="0.05" />
      <polyline points={pts} fill="none" stroke="#0a0a0a" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Icons ─────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = 1.5 }: { d: React.ReactNode; size?: number; stroke?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    {d}
  </svg>
);

export const Icons = {
  home:     <Icon d={<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>} />,
  cube:     <Icon d={<><path d="M12 3l9 5v8l-9 5-9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v10" /></>} />,
  inbox:    <Icon d={<><path d="M3 13h5l2 3h4l2-3h5" /><path d="M5 5h14l2 8v6H3v-6z" /></>} />,
  users:    <Icon d={<><circle cx="9" cy="9" r="3.5" /><path d="M2 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /><circle cx="17" cy="7" r="2.5" /><path d="M15 14c3.3 0 6 2 6 5" /></>} />,
  chart:    <Icon d={<><path d="M3 21h18" /><path d="M6 17V9" /><path d="M11 17V5" /><path d="M16 17v-6" /></>} />,
  code:     <Icon d={<><path d="M8 8l-5 4 5 4" /><path d="M16 8l5 4-5 4" /><path d="M14 4l-4 16" /></>} />,
  gear:     <Icon d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 16.7l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7.1 4l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>} />,
  plus:     <Icon d={<><path d="M12 5v14" /><path d="M5 12h14" /></>} />,
  search:   <Icon d={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>} />,
  bell:     <Icon d={<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" /><path d="M10 21a2 2 0 0 0 4 0" /></>} />,
  chevR:    <Icon d={<><path d="M9 6l6 6-6 6" /></>} />,
  chevD:    <Icon d={<><path d="M6 9l6 6 6-6" /></>} />,
  chevL:    <Icon d={<><path d="M15 6l-6 6 6 6" /></>} />,
  arrR:     <Icon d={<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>} />,
  check:    <Icon d={<><path d="M4 12l5 5L20 6" /></>} />,
  x:        <Icon d={<><path d="M5 5l14 14" /><path d="M19 5L5 19" /></>} />,
  credit:   <Icon d={<><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 11h20" /></>} />,
  more:     <Icon d={<><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>} />,
  edit:     <Icon d={<><path d="M4 20h4l11-11-4-4L4 16v4z" /></>} />,
  trash:    <Icon d={<><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>} />,
  filter:   <Icon d={<><path d="M3 5h18l-7 9v6l-4-2v-4z" /></>} />,
  download: <Icon d={<><path d="M12 3v14" /><path d="M6 11l6 6 6-6" /><path d="M4 21h16" /></>} />,
};
