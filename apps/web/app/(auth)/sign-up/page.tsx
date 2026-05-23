'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wordmark, Btn, Input } from '@/components/ui';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', company: '', password: '', agreed: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.agreed) { setError('You must agree to the Terms and Privacy Policy.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, name: `${form.firstName} ${form.lastName}`.trim(), company: form.company }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong');
      } else {
        router.push('/onboarding');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.05fr' }}>
      {/* Left */}
      <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <Wordmark size={17} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.025em', margin: 0 }}>Create your workspace</h1>
              <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', margin: '6px 0 0' }}>Two minutes. No card. First configurator before lunch.</p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="First name" placeholder="Aleš" value={form.firstName} onChange={set('firstName')} required />
                <Input label="Last name" placeholder="Kovač" value={form.lastName} onChange={set('lastName')} required />
              </div>
              <Input label="Work email" placeholder="you@company.com" type="email" value={form.email} onChange={set('email')} full required />
              <Input label="Company" placeholder="Your company" value={form.company} onChange={set('company')} full required />
              <Input label="Password" placeholder="At least 10 characters" type="password" value={form.password} onChange={set('password')} hint="Use 10+ characters, with at least one symbol." full required minLength={10} />
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--color-text-3)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.agreed} onChange={set('agreed')} style={{ marginTop: 2 }} />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" style={{ color: 'var(--color-ink)', borderBottom: '1px solid currentColor' }}>Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" style={{ color: 'var(--color-ink)', borderBottom: '1px solid currentColor' }}>Privacy Policy</Link>.
                </span>
              </label>
              {error && <p style={{ fontSize: 12.5, color: '#ef4444', margin: 0 }}>{error}</p>}
              <Btn type="submit" variant="primary" size="lg" full disabled={loading}>
                {loading ? 'Creating workspace…' : 'Create workspace →'}
              </Btn>
              <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                Or continue with Google · Microsoft · SAML SSO
              </p>
            </form>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>© 2026 Forma Studio</span>
          <span>hello@forma.studio</span>
        </div>
      </div>

      {/* Right */}
      <div style={{ background: '#0a0a0a', color: '#fff', padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, fontSize: 12.5, color: '#a3a3a3' }}>
          <span>Have an account?</span>
          <Link href="/sign-in" style={{ color: '#fff', borderBottom: '1px solid #fff' }}>Sign in</Link>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#a3a3a3', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>What you'll get</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              ['14 days free', 'Full Growth plan, no card required'],
              ['Onboarding call', 'A real human walks you through your first configurator'],
              ['Migration help', 'We import your price sheet if you send it over'],
              ['Cancel anytime', 'No annual commitment'],
            ].map(([t, d]) => (
              <li key={t} style={{ display: 'flex', gap: 12 }}>
                <span style={{ marginTop: 2, color: '#fff', flexShrink: 0 }}>✓</span>
                <div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{t}</div>
                  <div style={{ fontSize: 12.5, color: '#a3a3a3' }}>{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 360 180" width="360" height="180" fill="none" stroke="white" strokeWidth="1">
            <rect x="20" y="30" width="320" height="8" />
            <rect x="20" y="38" width="8" height="132" />
            <rect x="332" y="38" width="8" height="132" />
            {Array.from({ length: 18 }).map((_, i) => (
              <rect key={i} x={18 + i * 18} y="30" width="6" height="35" />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
