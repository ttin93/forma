import Link from 'next/link';
import { Wordmark, Btn, Badge } from '@/components/ui';

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: '#fff', color: '#171717' }}>
      {/* Nav */}
      <nav style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', borderBottom: '1px solid var(--color-line)', position: 'sticky', top: 0, background: '#fff', zIndex: 100 }}>
        <Wordmark size={18} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {['Product', 'Pricing', 'Docs', 'Blog'].map(l => (
            <Link key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: 13.5, color: 'var(--color-text-2)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/sign-in"><Btn variant="secondary" size="sm">Sign in</Btn></Link>
          <Link href="/sign-up"><Btn variant="primary" size="sm">Start free trial →</Btn></Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '120px 48px 100px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}><Badge kind="new">New — visual builder 2.0</Badge></div>
        <h1 style={{ fontSize: 72, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1.0, margin: '24px 0', maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
          Turn product specs into{' '}
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>qualified leads.</span>
        </h1>
        <p style={{ fontSize: 20, color: 'var(--color-text-3)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.55 }}>
          Forma lets manufacturers build embeddable product configurators in minutes.
          Buyers configure, you receive a lead with specs, pricing, and a PDF quote.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/sign-up"><Btn variant="primary" size="lg">Start free — 14 days →</Btn></Link>
          <Link href="/demo"><Btn variant="secondary" size="lg">See live demo</Btn></Link>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--color-muted)', marginTop: 16, fontFamily: 'var(--font-mono)' }}>
          No credit card required · Cancel anytime
        </p>
      </section>

      {/* Social proof band */}
      <div style={{ borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)', padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, background: 'var(--color-surface)' }}>
        {[
          ['1,200+', 'Manufacturers'],
          ['4.8M', 'Configurations served'],
          ['€120M', 'Leads generated'],
          ['99.98%', 'Uptime SLA'],
        ].map(([n, l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)' }}>{n}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <section style={{ padding: '100px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 16 }}>Features</div>
        <h2 style={{ fontSize: 48, fontWeight: 500, letterSpacing: '-0.03em', textAlign: 'center', margin: '0 0 64px', lineHeight: 1.1 }}>
          Everything a manufacturer needs<br />
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>out of the box.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: '1px solid var(--color-line)', borderRadius: 'var(--radius-3)', overflow: 'hidden' }}>
          {[
            { n: '01', title: 'Visual builder', desc: 'Drag-and-drop steps, live preview, formula pricing — no code needed.' },
            { n: '02', title: 'Embed anywhere', desc: 'One <script> tag on any website, CMS, or landing page. White-label.' },
            { n: '03', title: 'PDF quote', desc: 'Every lead gets a branded PDF quote with full spec breakdown, auto-emailed.' },
            { n: '04', title: 'Lead inbox', desc: 'All submissions in one place with scoring, assignment and pipeline view.' },
            { n: '05', title: 'Analytics', desc: 'Funnel, session heatmap, top configurations, geographic breakdown.' },
            { n: '06', title: 'CRM sync', desc: 'Pipedrive, HubSpot, Salesforce — leads sync automatically via webhooks.' },
          ].map(f => (
            <div key={f.n} style={{ padding: '32px', background: '#fff', borderRight: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', marginBottom: 12 }}>{f.n}</div>
              <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: 'var(--color-text-3)', lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section style={{ padding: '80px 48px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 40, lineHeight: 1.2, letterSpacing: '-0.01em', margin: '0 0 32px' }}>
          "The configurator paid for itself in 9 days. Now we'd quote nothing without it."
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 40, background: '#0a0a0a', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>MZ</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Marko Zupančič</div>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-3)' }}>Co-founder, Alpenwerk Pergolas</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 48px', background: '#0a0a0a', textAlign: 'center' }}>
        <h2 style={{ fontSize: 52, fontWeight: 500, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 16px', lineHeight: 1.0 }}>
          Start your free trial<br />
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>today.</span>
        </h2>
        <p style={{ fontSize: 16, color: '#a3a3a3', margin: '0 0 36px' }}>14 days, full Growth plan, no card required.</p>
        <Link href="/sign-up"><Btn variant="invert" size="lg">Create workspace →</Btn></Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-line)', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
        <span>© 2026 Forma Studio d.o.o.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Security', 'Status'].map(l => (
            <Link key={l} href={`/${l.toLowerCase()}`} style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
