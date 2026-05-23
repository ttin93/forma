'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wordmark, Btn, Input } from '@/components/ui';

function PergolaSVG() {
  return (
    <svg viewBox="0 0 360 200" width="360" height="200" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25">
      <rect x="20" y="40" width="320" height="10" />
      <rect x="20" y="50" width="10" height="140" />
      <rect x="330" y="50" width="10" height="140" />
      <rect x="80" y="50" width="8" height="140" />
      <rect x="272" y="50" width="8" height="140" />
      {Array.from({ length: 16 }).map((_, i) => (
        <rect key={i} x={20 + i * 21} y="40" width="8" height="40" />
      ))}
      <line x1="20" y1="100" x2="340" y2="100" strokeDasharray="4 4" />
    </svg>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Invalid credentials');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.05fr' }}>
      {/* Left — form */}
      <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <Wordmark size={17} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.025em', margin: 0 }}>Welcome back</h1>
              <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', margin: '6px 0 0' }}>Sign in to your Forma workspace.</p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Btn type="button" variant="secondary" size="lg" full>Continue with Google</Btn>
              <Btn type="button" variant="secondary" size="lg" full>Continue with Microsoft</Btn>
              <Btn type="button" variant="secondary" size="lg" full>Continue with SSO</Btn>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0', fontSize: 11.5, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--color-line)' }} />
                <span>OR EMAIL</span>
                <div style={{ flex: 1, height: 1, background: 'var(--color-line)' }} />
              </div>
              <Input label="Email" placeholder="you@company.com" type="email" value={email} onChange={e => setEmail(e.target.value)} full required />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)' }}>Password</span>
                  <Link href="/forgot-password" style={{ fontSize: 11.5, color: 'var(--color-text-2)', borderBottom: '1px solid currentColor' }}>Forgot?</Link>
                </div>
                <Input placeholder="••••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} full required />
              </div>
              {error && <p style={{ fontSize: 12.5, color: '#ef4444', margin: 0 }}>{error}</p>}
              <Btn type="submit" variant="primary" size="lg" full disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in →'}
              </Btn>
              <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--color-text-3)', margin: 0 }}>
                Don't have an account?{' '}
                <Link href="/sign-up" style={{ color: 'var(--color-ink)', borderBottom: '1px solid currentColor' }}>Get started free</Link>
              </p>
            </form>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>© 2026 Forma Studio</span>
          <span>hello@forma.studio</span>
        </div>
      </div>

      {/* Right — visual */}
      <div style={{ background: '#0a0a0a', color: '#fff', padding: 40, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, fontSize: 12.5, color: '#a3a3a3' }}>
          <span>Don't have an account?</span>
          <Link href="/sign-up" style={{ color: '#fff', borderBottom: '1px solid #fff' }}>Get started</Link>
        </div>
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-pill)', fontSize: 11, fontFamily: 'var(--font-mono)', color: '#a3a3a3', marginBottom: 20 }}>
            <span style={{ width: 5, height: 5, borderRadius: 5, background: '#a3a3a3' }} />
            CUSTOMER · ALPENWERK
          </span>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 36, lineHeight: 1.2, letterSpacing: '-0.01em', color: '#fff', margin: '0 0 28px' }}>
            "The configurator paid for itself in 9&nbsp;days. Now we'd quote nothing without&nbsp;it."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 36, background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#fff' }}>MZ</div>
            <div>
              <div style={{ fontSize: 13.5, color: '#fff' }}>Marko Zupančič</div>
              <div style={{ fontSize: 12, color: '#a3a3a3' }}>Co-founder, Alpenwerk Pergolas</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, fontSize: 12, color: '#a3a3a3', fontFamily: 'var(--font-mono)' }}>
          <span>SOC 2 Type II</span>
          <span>GDPR</span>
          <span>99.98% uptime</span>
        </div>
      </div>
    </div>
  );
}
