/* Auth & onboarding screens */

// ───────── Sign in / Sign up
const AuthSplit = ({ children, side }) => (
  <div className="marketing" style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.05fr' }}>
    {/* Left — form */}
    <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column' }}>
      <Wordmark size={17} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>{children}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>
        <span>© 2026 Forma Studio</span>
        <span>Need help? hello@forma.studio</span>
      </div>
    </div>
    {/* Right — visual */}
    <div style={{ background: '#0a0a0a', color: '#fff', padding: 40, position: 'relative', overflow: 'hidden' }}>
      {side}
    </div>
  </div>
);

const AuthSignIn = () => (
  <AuthSplit side={
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, fontSize: 12.5, color: '#a3a3a3' }}>
        <span>Don't have an account?</span>
        <span style={{ color: '#fff', borderBottom: '1px solid #fff' }}>Get started</span>
      </div>
      <div>
        <Badge kind="off">Customer · Alpenwerk</Badge>
        <p className="serif" style={{ fontSize: 36, lineHeight: 1.2, letterSpacing: '-0.01em', color: '#fff', margin: '20px 0 0' }}>
          “The configurator paid for itself in 9&nbsp;days. Now we'd quote nothing without&nbsp;it.”
        </p>
        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name="Marko Zupančič" size={36} />
          <div>
            <div style={{ fontSize: 13.5, color: '#fff' }}>Marko Zupančič</div>
            <div style={{ fontSize: 12, color: '#a3a3a3' }}>Co-founder, Alpenwerk Pergolas</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 32, fontSize: 12, color: '#a3a3a3', fontFamily: 'var(--f-mono)' }}>
        <span>SOC 2 Type II</span>
        <span>GDPR</span>
        <span>99.98% uptime</span>
      </div>
    </div>
  }>
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.025em', margin: 0 }}>Welcome back</h1>
      <p style={{ fontSize: 13.5, color: 'var(--c-text-3)', margin: '6px 0 0' }}>Sign in to your Forma workspace.</p>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Btn kind="secondary" size="lg" full icon={<svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M23 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6.2c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.2z"/><path fill="currentColor" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21 7.6 23.5 12 23.5z"/></svg>}>Continue with Google</Btn>
      <Btn kind="secondary" size="lg" full>Continue with Microsoft</Btn>
      <Btn kind="secondary" size="lg" full>Continue with SSO</Btn>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0', fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--c-line)' }} />
      <span>OR EMAIL</span>
      <div style={{ flex: 1, height: 1, background: 'var(--c-line)' }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input label="Email" placeholder="you@company.com" value="ales@sunpergola.si" full />
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-2)' }}>Password</span>
          <a style={{ fontSize: 11.5, color: 'var(--c-text-2)', borderBottom: '1px solid currentColor' }}>Forgot?</a>
        </div>
        <Input placeholder="••••••••••" full />
      </div>
      <Btn kind="primary" size="lg" full iconRight={I.arrR}>Sign in</Btn>
    </div>
  </AuthSplit>
);

const AuthSignUp = () => (
  <AuthSplit side={
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, fontSize: 12.5, color: '#a3a3a3' }}>
        <span>Have an account?</span>
        <span style={{ color: '#fff', borderBottom: '1px solid #fff' }}>Sign in</span>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#a3a3a3', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>What you'll get</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            ['14 days free', 'Full Growth plan, no card required'],
            ['Onboarding call', 'A real human walks you through your first configurator'],
            ['Migration help', 'We import your price sheet if you send it over'],
            ['Cancel anytime', 'No annual commitment'],
          ].map(([t, d]) => (
            <li key={t} style={{ display: 'flex', gap: 12 }}>
              <span style={{ marginTop: 2, color: '#fff' }}>{I.check}</span>
              <div>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{t}</div>
                <div style={{ fontSize: 12.5, color: '#a3a3a3' }}>{d}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <PergolaSVG width={360} height={200} color="#fff" lineOnly />
    </div>
  }>
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.025em', margin: 0 }}>Create your workspace</h1>
      <p style={{ fontSize: 13.5, color: 'var(--c-text-3)', margin: '6px 0 0' }}>Two minutes. No card. First configurator before lunch.</p>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="First name" placeholder="Aleš" value="Aleš" />
        <Input label="Last name" placeholder="Kovač" value="Kovač" />
      </div>
      <Input label="Work email" placeholder="you@company.com" value="ales@sunpergola.si" full />
      <Input label="Company" placeholder="Your company" value="SunPergola d.o.o." full />
      <Input label="Password" placeholder="At least 10 characters" hint="Use 10+ characters, with at least one symbol." full />
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--c-text-3)', marginTop: 4 }}>
        <span style={{ width: 14, height: 14, border: '1px solid var(--c-line-3)', borderRadius: 3, display: 'inline-block', marginTop: 1, flexShrink: 0 }} />
        I agree to the <span style={{ color: 'var(--c-ink)', borderBottom: '1px solid currentColor' }}>Terms</span> and <span style={{ color: 'var(--c-ink)', borderBottom: '1px solid currentColor' }}>Privacy Policy</span>.
      </label>
      <Btn kind="primary" size="lg" full iconRight={I.arrR}>Create workspace</Btn>
      <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', marginTop: 8 }}>
        Or continue with Google · Microsoft · SAML SSO
      </div>
    </div>
  </AuthSplit>
);

// ───────── Onboarding wizard (3 steps shown across one artboard)
const OnbStep = ({ n, total, title, desc, children, primary = 'Continue' }) => (
  <div className="marketing" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
    <header style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid var(--c-line)' }}>
      <Wordmark size={17} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)' }}>
        <span>Step {n} / {total}</span>
        <div style={{ width: 200, height: 4, background: 'var(--c-line)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${(n / total) * 100}%`, height: '100%', background: '#0a0a0a' }} />
        </div>
        <a style={{ color: 'var(--c-text-2)' }}>Skip setup</a>
      </div>
    </header>
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 32px', overflow: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Onboarding</div>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: 0 }}>{title}</h1>
        {desc && <p style={{ fontSize: 15, color: 'var(--c-text-3)', margin: '8px 0 0', maxWidth: 560 }}>{desc}</p>}
        <div style={{ marginTop: 36 }}>{children}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          {n > 1 ? <Btn kind="secondary" icon={I.chevL}>Back</Btn> : <span/>}
          <Btn kind="primary" iconRight={I.arrR}>{primary}</Btn>
        </div>
      </div>
    </main>
  </div>
);

const Onb1 = () => (
  <OnbStep n={1} total={4} title="Pick your product type" desc="We'll spin up a template optimised for your industry. You can change everything later.">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {[
        { t: 'Pergolas & shading', d: '23 templates', active: true },
        { t: 'Windows & doors', d: '18 templates' },
        { t: 'Modular kitchens', d: '12 templates' },
        { t: 'Carports & garages', d: '8 templates' },
        { t: 'Saunas & wellness', d: '6 templates' },
        { t: 'Something else', d: 'Start from scratch' },
      ].map(c => (
        <div key={c.t} style={{
          padding: 18, border: c.active ? '1.5px solid #0a0a0a' : '1px solid var(--c-line-2)',
          borderRadius: 'var(--r-3)', cursor: 'pointer', background: c.active ? '#fafafa' : '#fff',
          height: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ width: 24, height: 24, border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{c.t}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)' }}>{c.d}</div>
          </div>
        </div>
      ))}
    </div>
  </OnbStep>
);

const Onb2 = () => (
  <OnbStep n={2} total={4} title="Bring your brand" desc="Forma inherits your brand on the buyer's side so it feels like a native part of your site.">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Brand name" value="SunPergola" full />
        <Input label="Customer-facing website" value="https://sunpergola.si" full />
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-2)', marginBottom: 6 }}>Logo</div>
          <div style={{ border: '1px dashed var(--c-line-3)', borderRadius: 'var(--r-2)', padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--r-2)', background: '#0a0a0a', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-mono)', fontWeight: 500 }}>SP</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>sunpergola-logo.svg</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>48 × 48 · SVG · 4.2 KB</div>
            </div>
            <Btn kind="ghost" size="sm">Replace</Btn>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-2)', marginBottom: 6 }}>Primary brand color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-2)' }}>
            <div style={{ width: 22, height: 22, borderRadius: 4, background: '#0a0a0a' }} />
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 13 }}>#0A0A0A</span>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 4 }}>
              {['#0a0a0a','#1f1f1f','#0d4734','#5b3520','#8a1313'].map(c => (
                <div key={c} style={{ width: 22, height: 22, borderRadius: 4, background: c, border: '1px solid rgba(0,0,0,.06)' }} />
              ))}
            </div>
          </div>
        </div>
        <Input label="Brand font" value="Inter (auto-detected from sunpergola.si)" suffix={<span>Edit</span>} full />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Live preview</div>
        <div style={{ border: '1px solid var(--c-line)', borderRadius: 'var(--r-3)', overflow: 'hidden' }}>
          <div style={{ background: '#fff', padding: 14, borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 4, background: '#0a0a0a', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-mono)', fontSize: 10, fontWeight: 500 }}>SP</div>
            <span style={{ fontSize: 13, fontWeight: 500 }}>SunPergola</span>
          </div>
          <div style={{ padding: 18, background: '#fff' }}>
            <div style={{ fontSize: 11.5, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)', marginBottom: 4 }}>STEP 02</div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Configure dimensions</div>
            <PergolaSVG width={260} height={140} />
            <div style={{ height: 36, background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, fontSize: 12.5, fontWeight: 500, marginTop: 12 }}>Continue</div>
          </div>
        </div>
      </div>
    </div>
  </OnbStep>
);

Object.assign(window, { AuthSignIn, AuthSignUp, Onb1, Onb2 });
