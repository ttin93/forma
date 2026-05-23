/* End-user pergola configurator — the buyer-facing flow that gets embedded
   on the manufacturer's site. Three states: dimensions, summary, submitted. */

// Branded shell mimicking the manufacturer's own site (sunpergola.si).
const SiteShell = ({ children, brand = 'SunPergola' }) => (
  <div className="marketing" style={{ width: '100%', minHeight: '100%', background: '#f6f4ef', display: 'flex', flexDirection: 'column' }}>
    <header style={{ background: '#fff', borderBottom: '1px solid var(--c-line)', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0a0a0a', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 500 }}>SP</div>
        <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em' }}>{brand}</span>
      </div>
      <nav style={{ display: 'flex', gap: 22, flex: 1 }}>
        {['Pergolas', 'Carports', 'Window Solutions', 'Gallery', 'Pricing', 'Contact'].map(t => (
          <a key={t} style={{ fontSize: 13, color: 'var(--c-text-2)' }}>{t}</a>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, color: 'var(--c-text-3)' }}>
        <span style={{ fontFamily: 'var(--f-mono)' }}>+386 1 234 56 78</span>
        <Btn kind="primary" size="sm">Get a quote</Btn>
      </div>
    </header>
    <div style={{ flex: 1, padding: '32px 32px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: 1080, width: '100%' }}>{children}</div>
    </div>
    <footer style={{ background: '#0a0a0a', color: '#a3a3a3', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontFamily: 'var(--f-mono)' }}>
      <span>© SunPergola d.o.o. 2026</span>
      <span style={{ opacity: 0.5 }}>Configurator by forma.studio · powered by Forma</span>
    </footer>
  </div>
);

// Shared chrome — stepper + summary card.
const Stepper = ({ step, total = 7 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
    <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step {step} / {total}</div>
    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 4, background: i < step ? '#0a0a0a' : '#e0ddd5', borderRadius: 0 }} />
      ))}
    </div>
    <a style={{ fontSize: 12, color: 'var(--c-text-2)', borderBottom: '1px solid var(--c-text-3)' }}>Save & exit</a>
  </div>
);

const PriceBar = ({ price = 4820, breakdown }) => (
  <div style={{
    position: 'sticky', bottom: 0, background: '#fff',
    border: '1px solid var(--c-line)', borderRadius: 'var(--r-3)',
    padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 24, boxShadow: '0 -8px 24px rgba(0,0,0,0.05)',
  }}>
    <div>
      <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Running total · incl. VAT</div>
      <div style={{ fontSize: 26, fontFamily: 'var(--f-mono)', fontWeight: 500, letterSpacing: '-0.02em' }}>€{price.toLocaleString()}</div>
      <div style={{ fontSize: 11.5, color: 'var(--c-text-3)' }}>Estimate — final quote arrives by email</div>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <Btn kind="secondary" icon={I.chevL}>Back</Btn>
      <Btn kind="primary" iconRight={I.arrR}>Continue</Btn>
    </div>
  </div>
);

// ───────── 1. Dimensions step
const EndUser1 = () => (
  <SiteShell>
    {/* Page title */}
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Build your pergola</div>
      <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '6px 0 0' }}>Pergola Classic <span className="serif italic" style={{ color: 'var(--c-text-3)' }}>— configure</span></h1>
    </div>
    <Stepper step={2} />

    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
      {/* LEFT — preview */}
      <div style={{ background: '#fff', border: '1px solid var(--c-line)', borderRadius: 'var(--r-3)', overflow: 'hidden' }}>
        <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--c-line)' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['Front', 'Side', 'Top', '3D'].map((t, i) => (
              <button key={t} className="btn-reset" style={{
                padding: '4px 10px', fontSize: 11.5, borderRadius: 'var(--r-2)',
                background: i === 0 ? '#0a0a0a' : 'transparent', color: i === 0 ? '#fff' : 'var(--c-text-2)',
                fontFamily: 'var(--f-mono)', fontWeight: 500,
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, color: 'var(--c-text-3)' }}>
            <button className="btn-reset" style={{ width: 22, height: 22, border: '1px solid var(--c-line-2)', borderRadius: 4, display: 'grid', placeItems: 'center' }}>{I.plus}</button>
            <button className="btn-reset" style={{ width: 22, height: 22, border: '1px solid var(--c-line-2)', borderRadius: 4, display: 'grid', placeItems: 'center' }}>—</button>
            <button className="btn-reset" style={{ width: 22, height: 22, border: '1px solid var(--c-line-2)', borderRadius: 4, display: 'grid', placeItems: 'center' }}>{I.reload}</button>
          </div>
        </div>
        <div style={{ aspectRatio: '4/3', background: '#fafafa', display: 'grid', placeItems: 'center', position: 'relative' }}>
          <PergolaSVG width={420} height={280} />
          <div style={{ position: 'absolute', bottom: 14, left: 14, fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'var(--c-muted)' }}>SCALE 1:42 · DRAG TO ROTATE</div>
        </div>
        <div style={{ borderTop: '1px solid var(--c-line)', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
          <span style={{ color: 'var(--c-text-3)' }}>Area</span>
          <span style={{ fontFamily: 'var(--f-mono)' }}>4.20 × 3.50m = <strong style={{ fontWeight: 500, color: 'var(--c-ink)' }}>14.70 m²</strong></span>
        </div>
      </div>

      {/* RIGHT — controls */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em', margin: 0 }}>How big should your pergola be?</h2>
        <p style={{ fontSize: 13.5, color: 'var(--c-text-3)', margin: '6px 0 24px' }}>Drag the sliders to set outer dimensions. We'll show realistic limits for the Classic model.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {[
            ['Width',  4.20, 3.0, 6.0, 'm'],
            ['Depth',  3.50, 2.5, 5.0, 'm'],
            ['Height', 2.40, 2.2, 3.2, 'm'],
          ].map(([l, v, min, max, u]) => (
            <div key={l}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{l}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn-reset" style={{ width: 28, height: 28, border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-2)', display: 'grid', placeItems: 'center', color: 'var(--c-text-2)' }}>−</button>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 15, fontWeight: 500, minWidth: 60, textAlign: 'center' }}>{v} {u}</span>
                  <button className="btn-reset" style={{ width: 28, height: 28, border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-2)', display: 'grid', placeItems: 'center', color: 'var(--c-text-2)' }}>+</button>
                </div>
              </div>
              <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
                <div style={{ height: 4, background: '#e0ddd5', borderRadius: 4, width: '100%', overflow: 'hidden' }}>
                  <div style={{ width: `${(v - min) / (max - min) * 100}%`, height: '100%', background: '#0a0a0a' }} />
                </div>
                <div style={{ position: 'absolute', left: `calc(${(v - min) / (max - min) * 100}% - 11px)`, width: 22, height: 22, borderRadius: 22, background: '#fff', border: '2px solid #0a0a0a', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', marginTop: 4 }}>
                <span>{min} {u}</span>
                <span>{max} {u}</span>
              </div>
            </div>
          ))}

          {/* Tip card */}
          <div style={{ background: '#fff', border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)', padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--c-text-2)', marginTop: 1 }}>{I.bolt}</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>Tip — measure twice</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 2 }}>Width and depth are <em>outer</em> dimensions. Need a different size? <a style={{ borderBottom: '1px solid currentColor', color: 'var(--c-ink)' }}>Talk to us</a>.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PriceBar price={4820} />
  </SiteShell>
);

// ───────── 2. Add-ons + summary
const EndUser2 = () => (
  <SiteShell>
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Build your pergola</div>
      <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '6px 0 0' }}>Pergola Classic <span className="serif italic" style={{ color: 'var(--c-text-3)' }}>— add-ons</span></h1>
    </div>
    <Stepper step={6} />

    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em', margin: '0 0 4px' }}>Make it yours</h2>
        <p style={{ fontSize: 13.5, color: 'var(--c-text-3)', margin: '0 0 24px' }}>Optional extras. Hover any item for installation details.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'LED strip · top frame',          desc: 'Warm white, dimmable, 5m total',          price: 140, qty: 1, on: true },
            { name: 'Patio heater · ceiling-mounted', desc: '2.0 kW infrared, IP54',                   price: 210, qty: 2, on: true },
            { name: 'Rain sensor · auto-close',       desc: 'Closes louvres when wet',                 price: 180, qty: 0, on: false },
            { name: 'Side blind · drop',              desc: 'Per side, anthracite acrylic',            price: 320, qty: 3, on: true },
            { name: 'Wall mounting bracket set',      desc: 'For attaching to existing wall',          price:  80, qty: 0, on: false },
            { name: 'Outdoor speaker (Bluetooth)',    desc: 'Stereo pair, weatherproof',               price: 290, qty: 0, on: false },
            { name: 'Professional installation',      desc: 'Includes site visit and concrete check', price: 420, qty: 1, on: true },
          ].map((a, i) => (
            <label key={a.name} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr 90px 70px', gap: 14, padding: 14,
              background: '#fff', border: a.on ? '1.5px solid #0a0a0a' : '1px solid var(--c-line)',
              borderRadius: 'var(--r-2)', alignItems: 'center', cursor: 'pointer',
            }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, border: a.on ? '0' : '1px solid var(--c-line-3)', background: a.on ? '#0a0a0a' : '#fff', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10 }}>{a.on && '✓'}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>{a.desc}</div>
              </div>
              {a.on && a.qty > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <button className="btn-reset" style={{ width: 22, height: 22, border: '1px solid var(--c-line-2)', borderRadius: 4 }}>−</button>
                  <span style={{ fontFamily: 'var(--f-mono)', minWidth: 16, textAlign: 'center' }}>{a.qty}</span>
                  <button className="btn-reset" style={{ width: 22, height: 22, border: '1px solid var(--c-line-2)', borderRadius: 4 }}>+</button>
                </div>
              ) : <span />}
              <span style={{ textAlign: 'right', fontFamily: 'var(--f-mono)', fontWeight: 500, color: a.on ? 'var(--c-ink)' : 'var(--c-text-3)' }}>+€{a.price}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
        <div style={{ background: '#fff', border: '1px solid var(--c-line)', borderRadius: 'var(--r-3)', overflow: 'hidden' }}>
          <div style={{ padding: 20, background: '#fafafa', borderBottom: '1px solid var(--c-line)' }}>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your configuration</div>
            <PergolaSVG width={320} height={160} />
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
              {[
                ['Model',     'Classic'],
                ['Size',      '4.20 × 3.50 × 2.40m'],
                ['Area',      '14.70 m²'],
                ['Roof',      'Manual louvre'],
                ['Sides',     '3-sided · drop-blinds'],
                ['Color',     'Anthracite'],
                ['Add-ons',   '4 selected'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--c-line)', paddingBottom: 7 }}>
                  <span style={{ color: 'var(--c-text-3)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--f-mono)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--c-line)' }}>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>Estimated total · incl. VAT</div>
                <div style={{ fontSize: 28, fontFamily: 'var(--f-mono)', fontWeight: 500, letterSpacing: '-0.02em' }}>€5,720</div>
              </div>
            </div>
            <Btn kind="primary" size="lg" full style={{ marginTop: 16 }} iconRight={I.arrR}>Continue — get your quote</Btn>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textAlign: 'center', marginTop: 10 }}>
              We'll save your design — no signup needed
            </div>
          </div>
        </div>
      </div>
    </div>
  </SiteShell>
);

// ───────── 3. Submitted / thank-you
const EndUser3 = () => (
  <SiteShell>
    <div style={{ maxWidth: 720, margin: '40px auto 0', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 56, background: '#0a0a0a', color: '#fff', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
        <Icon d={<><path d="M4 12l5 5L20 6"/></>} size={26} stroke={2.5}/>
      </div>
      <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quote ref. <span style={{ color: 'var(--c-ink)' }}>SP-2026-L2841</span></div>
      <h1 style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.025em', margin: '8px 0 0' }}>
        Thanks, Lara. <span className="serif italic" style={{ color: 'var(--c-text-3)' }}>Your quote is on the way.</span>
      </h1>
      <p style={{ fontSize: 15, color: 'var(--c-text-3)', lineHeight: 1.55, margin: '14px auto 0', maxWidth: 540 }}>
        We've received your Pergola Classic configuration and emailed a copy to <strong style={{ color: 'var(--c-ink)' }}>lara.bregar@gmail.com</strong>. Aleš from our team will reply with a formal offer within one business day.
      </p>
    </div>

    {/* Recap card */}
    <div style={{ maxWidth: 720, margin: '40px auto 0', background: '#fff', border: '1px solid var(--c-line)', borderRadius: 'var(--r-3)', overflow: 'hidden' }}>
      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
        <PergolaSVG width={320} height={200} />
        <div>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your design</div>
          <h3 style={{ fontSize: 20, fontWeight: 500, margin: '6px 0 0' }}>Pergola Classic · 4.20 × 3.50m</h3>
          <div style={{ fontSize: 13, color: 'var(--c-text-3)', marginTop: 4 }}>Anthracite · manual louvre · 3 drop-blinds · 4 add-ons</div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>Estimate</span>
            <span style={{ fontSize: 28, fontFamily: 'var(--f-mono)', fontWeight: 500, letterSpacing: '-0.02em' }}>€5,720</span>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--c-line)', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
        <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>What happens next</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn kind="secondary" size="sm" icon={I.download}>Download PDF</Btn>
          <Btn kind="secondary" size="sm" icon={I.share}>Share configuration</Btn>
          <Btn kind="primary" size="sm" icon={I.clock}>Book a 15-min call</Btn>
        </div>
      </div>
    </div>

    {/* Next steps */}
    <div style={{ maxWidth: 720, margin: '32px auto 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {[
        { n: '01', t: 'We review your design',  d: 'Aleš checks site constraints (within 4 hours)' },
        { n: '02', t: 'You receive a formal quote', d: 'Itemised PDF + lead times, by email' },
        { n: '03', t: 'Free site visit if you like', d: 'We come, measure, finalise. No commitment.' },
      ].map(s => (
        <div key={s.n} style={{ padding: 16, background: '#fff', border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)' }}>
          <div style={{ fontSize: 10.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>{s.n}</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 6 }}>{s.t}</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 4 }}>{s.d}</div>
        </div>
      ))}
    </div>
  </SiteShell>
);

Object.assign(window, { EndUser1, EndUser2, EndUser3, SiteShell });
