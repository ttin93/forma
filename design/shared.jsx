/* Shared components for Forma design system.
   Pure black & white, no color accents, minimal radii, hairline borders.
   Built for a 1440×900 artboard scale. */

const Icon = ({ d, size = 16, stroke = 1.5, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>{d}</svg>
);

const I = {
  home:      <Icon d={<><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>} />,
  cube:      <Icon d={<><path d="M12 3l9 5v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v10"/></>} />,
  inbox:     <Icon d={<><path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/></>} />,
  users:     <Icon d={<><circle cx="9" cy="9" r="3.5"/><path d="M2 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/><circle cx="17" cy="7" r="2.5"/><path d="M15 14c3.3 0 6 2 6 5"/></>} />,
  chart:     <Icon d={<><path d="M3 21h18"/><path d="M6 17V9"/><path d="M11 17V5"/><path d="M16 17v-6"/><path d="M21 17v-3"/></>} />,
  code:      <Icon d={<><path d="M8 8l-5 4 5 4"/><path d="M16 8l5 4-5 4"/><path d="M14 4l-4 16"/></>} />,
  gear:      <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 16.7l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7.1 4l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>} />,
  plus:      <Icon d={<><path d="M12 5v14"/><path d="M5 12h14"/></>} />,
  search:    <Icon d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>} />,
  bell:      <Icon d={<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></>} />,
  chevR:     <Icon d={<><path d="M9 6l6 6-6 6"/></>} />,
  chevD:     <Icon d={<><path d="M6 9l6 6 6-6"/></>} />,
  chevU:     <Icon d={<><path d="M6 15l6-6 6 6"/></>} />,
  chevL:     <Icon d={<><path d="M15 6l-6 6 6 6"/></>} />,
  arrUR:     <Icon d={<><path d="M7 17L17 7"/><path d="M8 7h9v9"/></>} />,
  arrR:      <Icon d={<><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>} />,
  arrDown:   <Icon d={<><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></>} />,
  arrUp:     <Icon d={<><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></>} />,
  check:     <Icon d={<><path d="M4 12l5 5L20 6"/></>} />,
  x:         <Icon d={<><path d="M5 5l14 14"/><path d="M19 5L5 19"/></>} />,
  filter:    <Icon d={<><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>} />,
  sort:      <Icon d={<><path d="M7 4v16"/><path d="M3 8l4-4 4 4"/><path d="M17 20V4"/><path d="M13 16l4 4 4-4"/></>} />,
  more:      <Icon d={<><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></>} />,
  edit:      <Icon d={<><path d="M4 20h4l11-11-4-4L4 16v4z"/></>} />,
  trash:     <Icon d={<><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></>} />,
  copy:      <Icon d={<><rect x="8" y="8" width="13" height="13" rx="1"/><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h4"/></>} />,
  download:  <Icon d={<><path d="M12 3v14"/><path d="M6 11l6 6 6-6"/><path d="M4 21h16"/></>} />,
  share:     <Icon d={<><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4"/><path d="M8 13l8 4"/></>} />,
  eye:       <Icon d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>} />,
  mail:      <Icon d={<><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 6l9 7 9-7"/></>} />,
  phone:     <Icon d={<><path d="M5 4h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a1 1 0 0 1-1 1A18 18 0 0 1 4 5a1 1 0 0 1 1-1z"/></>} />,
  globe:     <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>} />,
  layers:    <Icon d={<><path d="M12 3l10 5-10 5L2 8z"/><path d="M2 13l10 5 10-5"/><path d="M2 18l10 5 10-5"/></>} />,
  sparkle:   <Icon d={<><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2"/></>} />,
  link:      <Icon d={<><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>} />,
  credit:    <Icon d={<><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 11h20"/></>} />,
  shield:    <Icon d={<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></>} />,
  bolt:      <Icon d={<><path d="M13 3L4 14h7l-1 7 9-11h-7z"/></>} />,
  grid:      <Icon d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>} />,
  list:      <Icon d={<><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>} />,
  clock:     <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />,
  star:      <Icon d={<><path d="M12 3l3 6 6 1-4.5 4 1 6.5L12 17l-5.5 3.5 1-6.5L3 10l6-1z"/></>} />,
  building:  <Icon d={<><rect x="4" y="3" width="16" height="18"/><path d="M8 8h2M8 12h2M8 16h2M14 8h2M14 12h2M14 16h2"/></>} />,
  cursor:    <Icon d={<><path d="M5 3l5 17 3-7 7-3z"/></>} />,
  ruler:     <Icon d={<><path d="M3 15L15 3l6 6L9 21z"/><path d="M7 11l2 2M9 9l2 2M11 7l2 2M13 5l2 2"/></>} />,
  palette:   <Icon d={<><path d="M12 3a9 9 0 0 0 0 18c1 0 2-1 2-2 0-1-1-1-1-2 0-1 1-2 2-2h2a4 4 0 0 0 4-4 9 9 0 0 0-9-8z"/><circle cx="7" cy="11" r="1"/><circle cx="9" cy="7" r="1"/><circle cx="14" cy="7" r="1"/><circle cx="17" cy="11" r="1"/></>} />,
  upload:    <Icon d={<><path d="M12 17V3"/><path d="M6 9l6-6 6 6"/><path d="M4 21h16"/></>} />,
  reload:    <Icon d={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>} />,
  play:      <Icon d={<><path d="M6 4l14 8-14 8z"/></>} />,
  history:   <Icon d={<><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></>} />,
};

// ───────── Wordmark
const Wordmark = ({ size = 16 }) => (
  <span className="wordmark" style={{ fontSize: size, letterSpacing: '-0.04em', display: 'inline-flex', alignItems: 'baseline' }}>
    Forma<span className="dot" style={{ width: size * 0.35, height: size * 0.35, display: 'inline-block', background: '#000', marginLeft: 2 }}></span>
  </span>
);

// ───────── Button
const Btn = ({ children, kind = 'primary', size = 'md', icon, iconRight, full, ...rest }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--f-sans)', fontWeight: 500, letterSpacing: '-0.01em',
    border: '1px solid transparent', cursor: 'pointer',
    borderRadius: 'var(--r-2)', transition: 'background .12s, border-color .12s',
    whiteSpace: 'nowrap', userSelect: 'none',
    width: full ? '100%' : 'auto',
  };
  const sizes = {
    sm: { fontSize: 12.5, padding: '5px 10px', height: 26 },
    md: { fontSize: 13.5, padding: '7px 14px', height: 32 },
    lg: { fontSize: 14.5, padding: '10px 18px', height: 40 },
  };
  const kinds = {
    primary: { background: '#0a0a0a', color: '#fff', borderColor: '#0a0a0a' },
    secondary:{ background: '#fff', color: '#0a0a0a', borderColor: 'var(--c-line-3)' },
    ghost:    { background: 'transparent', color: 'var(--c-text)', borderColor: 'transparent' },
    danger:   { background: '#fff', color: '#0a0a0a', borderColor: 'var(--c-line-3)' },
    invert:   { background: '#fff', color: '#0a0a0a', borderColor: '#fff' },
  };
  return (
    <button className="btn-reset" style={{ ...base, ...sizes[size], ...kinds[kind] }} {...rest}>
      {icon}{children}{iconRight}
    </button>
  );
};

// ───────── Badge
const Badge = ({ children, kind = 'neutral', dot, size='md' }) => {
  const dotColor = { neutral: '#a3a3a3', live: '#0a0a0a', new: '#0a0a0a', warn: '#737373', off: '#d4d4d4' }[kind] || '#a3a3a3';
  const sz = size === 'sm' ? { fontSize: 10.5, padding: '2px 7px', height: 18 } : { fontSize: 11.5, padding: '3px 8px', height: 22 };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--f-mono)', fontWeight: 500, color: 'var(--c-text-2)',
      background: 'var(--c-surface)', border: '1px solid var(--c-line)',
      borderRadius: 'var(--r-pill)', textTransform: 'uppercase', letterSpacing: '0.04em',
      ...sz }}>
      {dot !== false && <span style={{ width: 5, height: 5, borderRadius: 5, background: dotColor }} />}
      {children}
    </span>
  );
};

// ───────── Avatar
const Avatar = ({ name = '?', size = 28, src }) => {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  if (src) return <img src={src} style={{ width: size, height: size, borderRadius: size, objectFit: 'cover', border: '1px solid var(--c-line)' }} alt={name} />;
  return (
    <span style={{ width: size, height: size, borderRadius: size,
      background: '#0a0a0a', color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--f-mono)', fontWeight: 500, fontSize: Math.round(size * 0.36),
      letterSpacing: '0.02em', flexShrink: 0 }}>{initials}</span>
  );
};

// ───────── Input
const Input = ({ label, hint, suffix, prefix, value, placeholder, full, ...rest }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, width: full ? '100%' : 'auto' }}>
    {label && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-2)' }}>{label}</span>}
    <span style={{
      display: 'flex', alignItems: 'center', gap: 8,
      border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-2)',
      background: '#fff', padding: '0 12px', height: 36,
    }}>
      {prefix && <span style={{ color: 'var(--c-muted)' }}>{prefix}</span>}
      <input value={value} placeholder={placeholder} readOnly
        style={{ border: 0, outline: 0, background: 'transparent', flex: 1, fontFamily: 'inherit', fontSize: 13.5, color: 'var(--c-text)', minWidth: 0 }}
        {...rest} />
      {suffix && <span style={{ color: 'var(--c-muted)', fontSize: 12 }}>{suffix}</span>}
    </span>
    {hint && <span style={{ fontSize: 11.5, color: 'var(--c-muted)' }}>{hint}</span>}
  </label>
);

// ───────── Card
const Card = ({ children, pad = 20, style }) => (
  <div style={{
    background: '#fff', border: '1px solid var(--c-line)',
    borderRadius: 'var(--r-3)', padding: pad, ...style,
  }}>{children}</div>
);

// ───────── KPI Stat
const Stat = ({ label, value, delta, deltaKind = 'pos', sub, sparkData }) => (
  <Card pad={18} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--c-text-3)', fontWeight: 500 }}>{label}</span>
      {delta && (
        <span style={{ fontSize: 11.5, fontFamily: 'var(--f-mono)', color: deltaKind === 'pos' ? 'var(--c-text)' : 'var(--c-muted)',
          display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          {deltaKind === 'pos' ? '↑' : '↓'} {delta}
        </span>
      )}
    </div>
    <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, fontFeatureSettings: '"tnum"' }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>{sub}</div>}
    {sparkData && <Spark data={sparkData} />}
  </Card>
);

// ───────── Spark line
const Spark = ({ data = [], height = 36, color = '#0a0a0a' }) => {
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
      <polygon points={area} fill="#0a0a0a" opacity="0.05"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
};

// ───────── Bar chart
const Bars = ({ data, height = 180, labels }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, paddingTop: 8 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', height: `${(v / max) * 100}%`, background: i === data.length - 1 ? '#0a0a0a' : '#171717', minHeight: 2, borderRadius: '2px 2px 0 0' }} />
          {labels && <span style={{ fontSize: 10, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
};

// ───────── Line chart with grid
const LineChart = ({ series, height = 200, labels = [] }) => {
  // series: [{ data: [...], color, name, dashed }]
  const w = 600, h = height, pad = 28;
  const all = series.flatMap(s => s.data);
  const max = Math.max(...all), min = Math.min(...all, 0);
  const r = max - min || 1;
  const xStep = (w - pad * 2) / (series[0].data.length - 1);

  const toPath = (data) => data.map((v, i) => {
    const x = pad + i * xStep;
    const y = h - pad - ((v - min) / r) * (h - pad * 2);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const gridY = [0, 0.25, 0.5, 0.75, 1].map(t => h - pad - t * (h - pad * 2));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      {gridY.map((y, i) => (
        <line key={i} x1={pad} x2={w - pad} y1={y} y2={y} stroke="#ececec" strokeWidth="1" />
      ))}
      {gridY.map((y, i) => (
        <text key={'t'+i} x={6} y={y + 3} fontSize="9" fill="#a3a3a3" fontFamily="Geist Mono">
          {Math.round(min + (1 - i / 4) * r)}
        </text>
      ))}
      {labels.map((l, i) => (
        <text key={'x'+i} x={pad + i * xStep} y={h - 6} fontSize="9" fill="#a3a3a3" fontFamily="Geist Mono" textAnchor="middle">{l}</text>
      ))}
      {series.map((s, i) => (
        <g key={i}>
          <path d={toPath(s.data)} fill="none" stroke={s.color || '#0a0a0a'} strokeWidth="1.5"
            strokeDasharray={s.dashed ? '4 3' : 'none'} />
        </g>
      ))}
    </svg>
  );
};

// ───────── Donut
const Donut = ({ value = 70, size = 88, stroke = 8, label }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ececec" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#0a0a0a" strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c - (c * value / 100)} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--f-mono)', fontSize: 14, fontWeight: 500 }}>
        {label ?? `${value}%`}
      </div>
    </div>
  );
};

// ───────── Sidebar
const SideItem = ({ icon, children, active, badge, sub, indent }) => (
  <a style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: indent ? '6px 10px 6px 36px' : '7px 10px',
    borderRadius: 'var(--r-2)', cursor: 'pointer',
    color: active ? 'var(--c-ink)' : 'var(--c-text-2)',
    background: active ? 'var(--c-surface-2)' : 'transparent',
    fontSize: 13, fontWeight: active ? 500 : 400,
  }}>
    {icon && <span style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: active ? 1 : 0.8 }}>{icon}</span>}
    <span style={{ flex: 1 }}>{children}</span>
    {badge && <span style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'var(--c-text-3)', background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 'var(--r-pill)', padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{badge}</span>}
  </a>
);

const Sidebar = ({ active = 'dash' }) => (
  <aside style={{
    width: 232, flexShrink: 0, height: '100%',
    borderRight: '1px solid var(--c-line)', background: '#fff',
    display: 'flex', flexDirection: 'column',
  }}>
    {/* Workspace switcher */}
    <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--c-line)' }}>
      <button className="btn-reset" style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '6px 8px', borderRadius: 'var(--r-2)', cursor: 'pointer',
      }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: '#0a0a0a', color: '#fff',
          display: 'grid', placeItems: 'center', fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 600 }}>SP</div>
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-ink)' }}>SunPergola d.o.o.</div>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>Growth · 3 seats</div>
        </div>
        <span style={{ color: 'var(--c-muted)' }}>{I.chevD}</span>
      </button>
    </div>

    <nav style={{ flex: 1, overflow: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <SideItem icon={I.home} active={active === 'dash'}>Dashboard</SideItem>
      <SideItem icon={I.cube} active={active === 'cfg'} badge="4">Configurators</SideItem>
      <SideItem icon={I.inbox} active={active === 'leads'} badge="23">Leads</SideItem>
      <SideItem icon={I.users} active={active === 'cust'}>Customers</SideItem>
      <SideItem icon={I.chart} active={active === 'analytics'}>Analytics</SideItem>
      <SideItem icon={I.code} active={active === 'embed'}>Embed & API</SideItem>

      <div style={{ fontSize: 10.5, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
        fontFamily: 'var(--f-mono)', padding: '18px 10px 6px' }}>Workspace</div>
      <SideItem icon={I.users} active={active === 'team'}>Team</SideItem>
      <SideItem icon={I.credit} active={active === 'billing'}>Billing</SideItem>
      <SideItem icon={I.gear} active={active === 'settings'}>Settings</SideItem>
    </nav>

    <div style={{ borderTop: '1px solid var(--c-line)', padding: 14 }}>
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)', padding: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-ink)', marginBottom: 4 }}>Growth · 73% of leads used</div>
        <div style={{ height: 4, background: '#ececec', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: '73%', height: '100%', background: '#0a0a0a' }} />
        </div>
        <button className="btn-reset" style={{ fontSize: 11.5, color: 'var(--c-ink)', borderBottom: '1px solid currentColor', paddingBottom: 1 }}>Upgrade plan →</button>
      </div>
    </div>
  </aside>
);

// ───────── Top Bar
const TopBar = ({ crumb = [], actions, search }) => (
  <header style={{
    height: 52, flexShrink: 0,
    borderBottom: '1px solid var(--c-line)', background: '#fff',
    display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
      {crumb.map((c, i) => (
        <React.Fragment key={i}>
          <span style={{ fontSize: 13, color: i === crumb.length - 1 ? 'var(--c-ink)' : 'var(--c-text-3)', fontWeight: i === crumb.length - 1 ? 500 : 400 }}>{c}</span>
          {i < crumb.length - 1 && <span style={{ color: 'var(--c-line-3)', fontSize: 11 }}>/</span>}
        </React.Fragment>
      ))}
    </div>
    {search !== false && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8,
        height: 30, padding: '0 10px', border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-2)',
        background: 'var(--c-surface)', width: 240,
      }}>
        <span style={{ color: 'var(--c-muted)' }}>{I.search}</span>
        <span style={{ fontSize: 12.5, color: 'var(--c-muted)', flex: 1 }}>Search anything…</span>
        <span style={{ fontSize: 10.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', border: '1px solid var(--c-line)', padding: '0 4px', borderRadius: 3 }}>⌘K</span>
      </div>
    )}
    {actions}
    <button className="btn-reset" style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', color: 'var(--c-text-2)', borderRadius: 'var(--r-2)' }}>
      <div style={{ position: 'relative' }}>{I.bell}<span style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, background: '#0a0a0a', borderRadius: 6 }} /></div>
    </button>
    <Avatar name="Aleš K." size={28} />
  </header>
);

// ───────── App shell wrapper
const AppShell = ({ active, crumb, search, actions, children, style }) => (
  <div className="app" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--c-bg)', ...style }}>
    <Sidebar active={active} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <TopBar crumb={crumb} actions={actions} search={search} />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--c-bg)' }}>
        {children}
      </main>
    </div>
  </div>
);

// ───────── Page wrapper with title
const PageHeader = ({ eyebrow, title, desc, actions, tabs }) => (
  <div style={{ padding: '28px 32px 0' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: tabs ? 24 : 28 }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{eyebrow}</div>}
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--c-ink)' }}>{title}</h1>
        {desc && <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--c-text-3)', maxWidth: 640 }}>{desc}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
    {tabs && (
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--c-line)', marginTop: 4 }}>
        {tabs.map((t, i) => (
          <button key={i} className="btn-reset" style={{
            padding: '10px 14px', fontSize: 13,
            color: t.active ? 'var(--c-ink)' : 'var(--c-text-3)', fontWeight: t.active ? 500 : 400,
            borderBottom: t.active ? '1.5px solid #0a0a0a' : '1.5px solid transparent',
            marginBottom: -1,
          }}>{t.label}{t.count != null && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>{t.count}</span>}</button>
        ))}
      </div>
    )}
  </div>
);

Object.assign(window, {
  Icon, I, Wordmark, Btn, Badge, Avatar, Input, Card, Stat, Spark, Bars, LineChart, Donut,
  Sidebar, SideItem, TopBar, AppShell, PageHeader,
});
