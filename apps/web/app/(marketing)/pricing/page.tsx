import Link from 'next/link';
import { Wordmark, Btn, Badge } from '@/components/ui';

const plans = [
  {
    name: 'Starter',
    price: '€49',
    period: '/month',
    desc: 'For manufacturers just getting started.',
    features: ['1 configurator', '100 leads/month', '2 seats', 'PDF quotes', 'Email support'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '€149',
    period: '/month',
    desc: 'Most popular. For growing teams.',
    features: ['10 configurators', '500 leads/month', '5 seats', 'PDF quotes', 'Webhooks & API', 'Analytics', 'CRM integrations', 'Priority support'],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Scale',
    price: '€499',
    period: '/month',
    desc: 'For high-volume manufacturers.',
    features: ['Unlimited configurators', '2,000 leads/month', '20 seats', 'Everything in Growth', 'SAML SSO', 'Custom domains', 'Dedicated CSM', 'SLA 99.99%'],
    cta: 'Talk to sales',
    highlight: false,
  },
];

const compare = [
  ['Configurators', '1', '10', 'Unlimited'],
  ['Leads / month', '100', '500', '2,000'],
  ['Seats', '2', '5', '20'],
  ['PDF quotes', '✓', '✓', '✓'],
  ['Webhooks', '—', '✓', '✓'],
  ['API access', '—', '✓', '✓'],
  ['Analytics', '—', '✓', '✓'],
  ['CRM sync', '—', '✓', '✓'],
  ['White-label embed', '—', '✓', '✓'],
  ['SAML SSO', '—', '—', '✓'],
  ['Custom domains', '—', '—', '✓'],
];

export default function PricingPage() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: '#fff', color: '#171717', minHeight: '100vh' }}>
      <nav style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', borderBottom: '1px solid var(--color-line)', position: 'sticky', top: 0, background: '#fff', zIndex: 100 }}>
        <Wordmark size={18} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/sign-in"><Btn variant="secondary" size="sm">Sign in</Btn></Link>
          <Link href="/sign-up"><Btn variant="primary" size="sm">Start free →</Btn></Link>
        </div>
      </nav>

      <section style={{ padding: '80px 48px 60px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Pricing</div>
        <h1 style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1.0, margin: '0 0 16px' }}>
          Simple,{' '}
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>transparent</span>
          {' '}pricing.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--color-text-3)', margin: '0 auto', maxWidth: 480 }}>
          14-day free trial on all plans. No card required. Cancel anytime.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 1000, margin: '0 auto', padding: '0 48px 80px' }}>
        {plans.map(p => (
          <div key={p.name} style={{
            padding: 32, border: p.highlight ? '1.5px solid #0a0a0a' : '1px solid var(--color-line)',
            borderRadius: 'var(--radius-3)', background: p.highlight ? '#fafafa' : '#fff',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            {p.highlight && <div style={{ alignSelf: 'flex-start' }}><Badge kind="new" size="sm">Most popular</Badge></div>}
            <div>
              <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--color-text-3)' }}>{p.desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.04em', fontFamily: 'var(--font-mono)' }}>{p.price}</span>
              <span style={{ fontSize: 14, color: 'var(--color-text-3)' }}>{p.period}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {p.features.map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--color-text-2)' }}>
                  <span>✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href={p.name === 'Scale' ? '/contact' : '/sign-up'}>
              <Btn variant={p.highlight ? 'primary' : 'secondary'} size="md" full>{p.cta}</Btn>
            </Link>
          </div>
        ))}
      </div>

      {/* Compare table */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 48px 100px' }}>
        <h2 style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.025em', marginBottom: 32, textAlign: 'center' }}>Full comparison</h2>
        <div style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-3)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-line)', background: 'var(--color-surface)' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, color: 'var(--color-text-3)', fontWeight: 500 }}>Feature</th>
                {plans.map(p => (
                  <th key={p.name} style={{ padding: '12px 20px', textAlign: 'center', fontSize: 13, fontWeight: 500 }}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compare.map(([feat, ...vals], i) => (
                <tr key={String(feat)} style={{ borderBottom: i < compare.length - 1 ? '1px solid var(--color-line)' : 'none' }}>
                  <td style={{ padding: '12px 20px', fontSize: 13.5 }}>{feat}</td>
                  {vals.map((v, j) => (
                    <td key={j} style={{ padding: '12px 20px', textAlign: 'center', fontSize: 13, fontFamily: v === '✓' || v === '—' ? 'inherit' : 'var(--font-mono)', color: v === '—' ? 'var(--color-line-3)' : 'var(--color-ink)' }}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
