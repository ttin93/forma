/* Marketing site screens — Forma */

// ───────── Marketing Nav
const MarkNav = () => (
  <header style={{
    height: 64, display: 'flex', alignItems: 'center', padding: '0 48px',
    borderBottom: '1px solid var(--c-line)', background: '#fff', gap: 32,
  }}>
    <Wordmark size={17} />
    <nav style={{ display: 'flex', gap: 24, flex: 1 }}>
      {['Product', 'Configurators', 'Solutions', 'Pricing', 'Customers', 'Docs'].map(t => (
        <a key={t} style={{ fontSize: 13.5, color: 'var(--c-text-2)', cursor: 'pointer' }}>{t}</a>
      ))}
    </nav>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <a style={{ fontSize: 13.5, color: 'var(--c-text-2)', cursor: 'pointer' }}>Sign in</a>
      <Btn kind="primary" size="sm">Start free trial</Btn>
    </div>
  </header>
);

const MarkFooter = () => (
  <footer style={{ borderTop: '1px solid var(--c-line)', background: '#fafafa', padding: '40px 48px 24px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 32 }}>
      <div>
        <Wordmark size={18} />
        <p style={{ fontSize: 12.5, color: 'var(--c-text-3)', marginTop: 12, lineHeight: 1.55, maxWidth: 260 }}>
          The configurator platform for window, door, pergola and modular product manufacturers.
        </p>
      </div>
      {[
        { h: 'Product', l: ['Builder', 'Pricing rules', 'Lead routing', 'Analytics', 'API'] },
        { h: 'Industries', l: ['Pergolas', 'Windows & doors', 'Kitchens', 'Garages', 'Saunas'] },
        { h: 'Resources', l: ['Documentation', 'Changelog', 'Integrations', 'Status', 'Security'] },
        { h: 'Company', l: ['About', 'Customers', 'Careers', 'Contact', 'Legal'] },
      ].map(c => (
        <div key={c.h}>
          <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', marginBottom: 12 }}>{c.h}</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {c.l.map(li => <li key={li} style={{ fontSize: 12.5, color: 'var(--c-text-2)' }}>{li}</li>)}
          </ul>
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 18, borderTop: '1px solid var(--c-line)', fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>
      <span>© 2026 Forma Studio d.o.o.  ·  Ljubljana</span>
      <span>v4.12 ·  All systems normal</span>
    </div>
  </footer>
);

// ───────── 1. Landing
const MarkLanding = () => (
  <div className="marketing" style={{ width: '100%', minHeight: '100%' }}>
    <MarkNav />

    {/* Hero */}
    <section style={{ padding: '88px 48px 64px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <Badge kind="new">New</Badge>
        <span style={{ fontSize: 12.5, color: 'var(--c-text-3)' }}>v4 — Visual rule builder & multi-step pricing</span>
        <span style={{ color: 'var(--c-muted)' }}>{I.arrR}</span>
      </div>
      <h1 style={{
        fontSize: 76, lineHeight: 0.98, letterSpacing: '-0.035em',
        fontWeight: 500, margin: 0, color: 'var(--c-ink)', maxWidth: 1100,
      }}>
        Turn every product page into a&nbsp;<span className="serif italic" style={{ fontWeight: 400 }}>quote machine.</span>
      </h1>
      <p style={{ fontSize: 19, lineHeight: 1.5, color: 'var(--c-text-2)', maxWidth: 620, marginTop: 28 }}>
        Forma is the configurator platform for manufacturers who sell custom-built products.
        Build the configurator, embed one line of code, and watch hot leads with full specs arrive in your inbox.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 36, alignItems: 'center' }}>
        <Btn kind="primary" size="lg" iconRight={I.arrR}>Start 14-day trial</Btn>
        <Btn kind="secondary" size="lg" icon={I.play}>Watch demo · 2 min</Btn>
        <span style={{ fontSize: 12.5, color: 'var(--c-muted)', marginLeft: 8 }}>No credit card · Cancel anytime</span>
      </div>

      {/* Hero panel mock */}
      <div style={{
        marginTop: 56, border: '1px solid var(--c-line-2)', borderRadius: 12,
        background: '#fff', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
      }}>
        <div style={{ height: 32, background: '#f7f7f7', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: 9, border: '1px solid var(--c-line-3)' }} />)}
          <div style={{ flex: 1, height: 18, background: '#fff', border: '1px solid var(--c-line)', borderRadius: 4, fontSize: 10.5, color: 'var(--c-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-mono)' }}>app.forma.studio/builder/pergola-classic</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 280px', height: 380, fontSize: 12 }}>
          <div style={{ borderRight: '1px solid var(--c-line)', padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', color: 'var(--c-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>Steps</div>
            {['Model', 'Dimensions', 'Roof', 'Sides', 'Color', 'Add-ons', 'Summary'].map((s,i) => (
              <div key={s} style={{ padding: '6px 8px', fontSize: 12, borderRadius: 4, background: i === 1 ? '#f5f5f5' : 'transparent', color: i <= 1 ? 'var(--c-ink)' : 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--c-muted)' }}>{String(i+1).padStart(2,'0')}</span>
                {s}
              </div>
            ))}
          </div>
          <div style={{ padding: 24, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PergolaSVG width={420} height={300} />
          </div>
          <div style={{ borderLeft: '1px solid var(--c-line)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dimensions</div>
            {[['Width', '4.20 m'], ['Depth', '3.50 m'], ['Height', '2.40 m']].map(([k,v]) => (
              <div key={k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--c-text-2)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--f-mono)' }}>{v}</span>
                </div>
                <div style={{ height: 4, background: '#ececec', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', background: '#0a0a0a' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--c-line)', paddingTop: 12 }}>
              <div style={{ fontSize: 10.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>Estimated price</div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', fontFamily: 'var(--f-mono)' }}>€4,820</div>
              <div style={{ fontSize: 10.5, color: 'var(--c-muted)' }}>Excl. installation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted by */}
      <div style={{ marginTop: 64, display: 'flex', alignItems: 'center', gap: 36 }}>
        <span style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trusted by 1,400+ manufacturers</span>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6 }}>
          {['ALPENWERK', 'NOSTRA · DOM', 'KONO LIVING', 'MERIDIAN&Co', 'PERGOLA Bros', 'STEEL+OAK'].map(b => (
            <span key={b} className="serif" style={{ fontSize: 18, letterSpacing: '-0.02em', color: 'var(--c-text-2)' }}>{b}</span>
          ))}
        </div>
      </div>
    </section>

    {/* Big stat band */}
    <section style={{ borderTop: '1px solid var(--c-line)', borderBottom: '1px solid var(--c-line)', background: '#fafafa', padding: '56px 48px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 48 }}>
        {[
          ['+312%', 'more qualified leads per month vs. contact form'],
          ['11 min', 'average time to first configured quote'],
          ['€18.4M', 'in pipeline configured on Forma last quarter'],
          ['2.6×', 'higher close rate from configurator leads'],
        ].map(([n, d]) => (
          <div key={n}>
            <div style={{ fontSize: 48, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--c-ink)' }}>{n}</div>
            <div style={{ fontSize: 13, color: 'var(--c-text-3)', marginTop: 12, maxWidth: 220, lineHeight: 1.45 }}>{d}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Three-up features */}
    <section style={{ padding: '96px 48px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ marginBottom: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Platform</div>
          <h2 style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.025em', margin: 0, maxWidth: 720 }}>
            Built for makers who quote in&nbsp;<span className="serif italic">millimeters</span>, not&nbsp;clicks.
          </h2>
        </div>
        <Btn kind="ghost" iconRight={I.arrR}>See all features</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid var(--c-line)' }}>
        {[
          { ico: I.ruler, t: 'Visual builder', d: 'Drag steps, set conditional logic, plug in your pricing formulas. No code, no devs.' },
          { ico: I.bolt, t: 'Real-time pricing', d: 'Customers see prices that match your spreadsheets, with rules for materials, finishes and volumes.' },
          { ico: I.inbox, t: 'Lead routing', d: 'Every submission lands in the right inbox with full specs, a PDF quote and CRM sync.' },
          { ico: I.code, t: 'One-line embed', d: 'Drop a snippet on Shopify, WordPress, Webflow or vanilla HTML. Lives inside your site.' },
          { ico: I.shield, t: 'Brand-native', d: 'Inherits your fonts and colors. No banner ads, no "powered by", clean white-label.' },
          { ico: I.chart, t: 'Funnel analytics', d: 'See where buyers drop off, what configurations sell, and which channels convert.' },
        ].map((f, i) => (
          <div key={f.t} style={{
            padding: 28, borderRight: i % 3 !== 2 ? '1px solid var(--c-line)' : 'none',
            borderBottom: i < 3 ? '1px solid var(--c-line)' : 'none',
          }}>
            <div style={{ width: 36, height: 36, border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-2)', display: 'grid', placeItems: 'center', marginBottom: 20 }}>{f.ico}</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: '-0.015em' }}>{f.t}</h3>
            <p style={{ fontSize: 13.5, color: 'var(--c-text-3)', lineHeight: 1.55, margin: '8px 0 0' }}>{f.d}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Two-up — Builder + End-user demos */}
    <section style={{ padding: '0 48px 96px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ border: '1px solid var(--c-line)', borderRadius: 12, padding: 32, background: '#fff' }}>
          <Badge>For you · the maker</Badge>
          <h3 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '16px 0 8px' }}>Configure the configurator.</h3>
          <p style={{ fontSize: 13.5, color: 'var(--c-text-3)', margin: 0, maxWidth: 440 }}>Steps, fields, rules and pricing — all in a visual canvas you can hand to the sales team without flinching.</p>
          <div style={{ marginTop: 24, height: 220, background: '#fafafa', border: '1px solid var(--c-line)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['IF', 'width', '>', '5m'],
              ['THEN', 'add', 'Reinforced post', '+€280'],
              ['IF', 'roof', '=', 'Bioclimatic'],
              ['THEN', 'add', 'Rain sensor', '+€140'],
              ['ELSE', 'show', 'Manual louvre', ''],
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11.5, fontFamily: 'var(--f-mono)', alignItems: 'center' }}>
                {row.map((r, j) => (
                  <span key={j} style={{
                    padding: '3px 7px', border: '1px solid var(--c-line)', borderRadius: 4,
                    background: ['IF','THEN','ELSE'].includes(r) ? '#0a0a0a' : '#fff',
                    color: ['IF','THEN','ELSE'].includes(r) ? '#fff' : 'var(--c-text)',
                  }}>{r}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ border: '1px solid var(--c-line)', borderRadius: 12, padding: 32, background: '#0a0a0a', color: '#fff' }}>
          <Badge kind="off">For them · the buyer</Badge>
          <h3 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '16px 0 8px', color: '#fff' }}>Pick, price, submit.</h3>
          <p style={{ fontSize: 13.5, color: '#a3a3a3', margin: 0, maxWidth: 440 }}>End buyers see a clean configurator that matches your brand. They submit their dream pergola — you get an inbox-ready lead.</p>
          <div style={{ marginTop: 24, height: 220, background: '#171717', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PergolaSVG width={320} height={180} color="#fff" lineOnly />
          </div>
        </div>
      </div>
    </section>

    {/* Testimonial */}
    <section style={{ padding: '96px 48px', borderTop: '1px solid var(--c-line)', background: '#fff' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 28 }}>Customer · Alpenwerk Pergolas</div>
        <p className="serif" style={{ fontSize: 40, lineHeight: 1.2, letterSpacing: '-0.01em', margin: 0, color: 'var(--c-ink)' }}>
          “We used to spend three hours quoting a pergola from a&nbsp;phone&nbsp;call. Now the quote arrives <span className="italic">already configured</span>, with a PDF — we just sign.”
        </p>
        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <Avatar name="Marko Zupančič" size={40} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Marko Zupančič</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Co-founder, Alpenwerk · 18 employees</div>
          </div>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section style={{ padding: '80px 48px', background: '#fafafa', borderTop: '1px solid var(--c-line)', borderBottom: '1px solid var(--c-line)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <h2 style={{ fontSize: 48, fontWeight: 500, letterSpacing: '-0.03em', margin: 0, maxWidth: 640 }}>
          Your first lead before&nbsp;<span className="serif italic">lunch.</span>
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Btn kind="primary" size="lg" iconRight={I.arrR}>Start 14-day trial</Btn>
          <Btn kind="secondary" size="lg">Book a demo</Btn>
        </div>
      </div>
    </section>

    <MarkFooter />
  </div>
);

// Hand-drawn pergola line illustration — used in hero and several places.
const PergolaSVG = ({ width = 400, height = 280, color = '#0a0a0a', lineOnly = false }) => (
  <svg viewBox="0 0 400 280" width={width} height={height} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    {/* Ground line */}
    <line x1="20" y1="248" x2="380" y2="248" stroke={color} strokeWidth="0.8" opacity="0.5" />
    {/* Slats / roof */}
    <g>
      <rect x="60" y="70" width="280" height="8" />
      {Array.from({ length: 13 }).map((_, i) => (
        <line key={i} x1={70 + i * 21} y1="78" x2={70 + i * 21} y2="100" />
      ))}
      <rect x="60" y="100" width="280" height="6" />
    </g>
    {/* Posts */}
    <line x1="68" y1="106" x2="68" y2="248" />
    <line x1="332" y1="106" x2="332" y2="248" />
    <line x1="200" y1="106" x2="200" y2="248" opacity="0.4" strokeDasharray="2 3" />
    {/* Beam */}
    <line x1="60" y1="106" x2="340" y2="106" strokeWidth="0.6" />
    {/* Floor */}
    <line x1="40" y1="252" x2="360" y2="252" strokeWidth="0.6" opacity="0.6" />
    {/* Dimension lines */}
    {!lineOnly && (
      <g stroke={color} strokeWidth="0.6" opacity="0.7" fontSize="9" fontFamily="Geist Mono" fill={color}>
        <line x1="60" y1="266" x2="340" y2="266" />
        <line x1="60" y1="262" x2="60" y2="270" />
        <line x1="340" y1="262" x2="340" y2="270" />
        <text x="200" y="278" textAnchor="middle" stroke="none">4200 mm</text>
        <line x1="354" y1="78" x2="354" y2="248" />
        <line x1="350" y1="78" x2="358" y2="78" />
        <line x1="350" y1="248" x2="358" y2="248" />
        <text x="370" y="170" stroke="none" transform="rotate(-90 370 170)" textAnchor="middle">2400</text>
      </g>
    )}
  </svg>
);

// ───────── 2. Pricing page
const MarkPricing = () => (
  <div className="marketing" style={{ width: '100%', minHeight: '100%' }}>
    <MarkNav />
    <section style={{ padding: '88px 48px 48px', maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Pricing</div>
      <h1 style={{ fontSize: 64, lineHeight: 1, letterSpacing: '-0.035em', fontWeight: 500, margin: 0 }}>
        One product, three sizes.
      </h1>
      <p style={{ fontSize: 17, color: 'var(--c-text-3)', maxWidth: 560, margin: '20px auto 0' }}>
        Pay for the qualified leads you actually receive — not seats, not impressions, not page views.
      </p>
      <div style={{ display: 'inline-flex', marginTop: 32, background: '#fff', border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-pill)', padding: 3, fontSize: 13 }}>
        <button className="btn-reset" style={{ padding: '6px 16px', borderRadius: 'var(--r-pill)', background: '#0a0a0a', color: '#fff', fontWeight: 500 }}>Monthly</button>
        <button className="btn-reset" style={{ padding: '6px 16px', borderRadius: 'var(--r-pill)', color: 'var(--c-text-2)' }}>Annual <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, marginLeft: 4 }}>−20%</span></button>
      </div>
    </section>

    <section style={{ padding: '24px 48px 80px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '1px solid var(--c-line)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        {[
          { name: 'Starter', tag: 'For solo makers', price: 39, leads: '100', cfg: '1 configurator', items: ['Visual builder', 'Email lead delivery', 'PDF quote export', 'Forma branding', 'Community support'] },
          { name: 'Growth', tag: 'Most teams', price: 119, leads: '500', cfg: '4 configurators', items: ['Everything in Starter', 'No Forma branding', '3 seats', 'Pricing rules', 'Webhooks · Zapier · CRM', 'A/B testing'], hi: true },
          { name: 'Scale', tag: 'For dealer networks', price: 379, leads: '2,500', cfg: 'Unlimited', items: ['Everything in Growth', 'Multi-brand workspaces', 'SSO · SAML', 'Audit log', 'API access', 'SLA · priority support'] },
        ].map((p) => (
          <div key={p.name} style={{
            padding: 28, borderRight: p.name !== 'Scale' ? '1px solid var(--c-line)' : 'none',
            background: p.hi ? '#0a0a0a' : '#fff', color: p.hi ? '#fff' : 'var(--c-text)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 12.5, color: p.hi ? '#a3a3a3' : 'var(--c-text-3)' }}>{p.tag}</div>
              </div>
              {p.hi && <Badge kind="off">Recommended</Badge>}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 48, fontWeight: 500, letterSpacing: '-0.03em', fontFamily: 'var(--f-mono)' }}>€{p.price}</span>
              <span style={{ fontSize: 13, color: p.hi ? '#a3a3a3' : 'var(--c-muted)' }}>/ month</span>
            </div>
            <div style={{ fontSize: 12.5, color: p.hi ? '#a3a3a3' : 'var(--c-text-3)', marginTop: 4, fontFamily: 'var(--f-mono)' }}>{p.leads} leads · {p.cfg}</div>
            <Btn kind={p.hi ? 'invert' : 'secondary'} size="md" full style={{ marginTop: 18 }}>
              Start {p.name} trial
            </Btn>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {p.items.map(it => (
                <div key={it} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <span style={{ color: p.hi ? '#fff' : 'var(--c-ink)' }}>{I.check}</span>
                  <span style={{ color: p.hi ? '#e3e3e3' : 'var(--c-text)' }}>{it}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Compare table */}
      <div style={{ marginTop: 64 }}>
        <h2 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 24px' }}>Compare plans</h2>
        <div style={{ border: '1px solid var(--c-line)', borderRadius: 10, overflow: 'hidden' }}>
          {[
            ['Configurators', '1', '4', 'Unlimited'],
            ['Monthly leads', '100', '500', '2,500'],
            ['Lead overage', '€0.40', '€0.20', '€0.10'],
            ['Team seats', '1', '3', '10'],
            ['Pricing rules engine', '—', '✓', '✓'],
            ['Webhooks · Zapier', '—', '✓', '✓'],
            ['API access', '—', '—', '✓'],
            ['SSO · SAML', '—', '—', '✓'],
            ['Custom domain', '—', '✓', '✓'],
            ['Remove Forma branding', '—', '✓', '✓'],
            ['Dedicated CSM', '—', '—', '✓'],
          ].map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderTop: i ? '1px solid var(--c-line)' : 'none', fontSize: 13.5 }}>
              {row.map((c, j) => (
                <div key={j} style={{
                  padding: '13px 20px', color: j === 0 ? 'var(--c-text)' : 'var(--c-text-2)',
                  fontFamily: j === 0 ? 'var(--f-sans)' : 'var(--f-mono)',
                  fontWeight: j === 0 ? 500 : 400, textAlign: j === 0 ? 'left' : 'center',
                  background: j === 2 ? 'var(--c-surface)' : '#fff',
                }}>{c}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
    <MarkFooter />
  </div>
);

Object.assign(window, { MarkLanding, MarkPricing, PergolaSVG, MarkNav, MarkFooter });
