'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Wordmark, Btn, Input } from '@/components/ui';

const industries = [
  { id: 'pergola', label: 'Pergolas & shading', templates: 23 },
  { id: 'window', label: 'Windows & doors', templates: 18 },
  { id: 'kitchen', label: 'Modular kitchens', templates: 12 },
  { id: 'carport', label: 'Carports & garages', templates: 8 },
  { id: 'sauna', label: 'Saunas & wellness', templates: 6 },
  { id: 'other', label: 'Something else', templates: null },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [industry, setIndustry] = useState('');
  const [brand, setBrand] = useState({ name: '', website: '', color: '#0a0a0a', logoName: '' });
  const [saving, setSaving] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function saveAndGo() {
    setSaving(true);
    try {
      await fetch('/api/v1/workspaces/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: industry || undefined,
          name: brand.name || undefined,
          brandPrimary: brand.color,
        }),
      });
    } catch { /* non-critical */ } finally {
      setSaving(false);
    }
    router.push('/dashboard');
  }

  function StepHeader() {
    return (
      <header style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid var(--color-line)', background: '#fff' }}>
        <Wordmark size={17} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>Step {step} / {totalSteps}</span>
          <div style={{ width: 200, height: 4, background: 'var(--color-line)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(step / totalSteps) * 100}%`, height: '100%', background: '#0a0a0a', transition: 'width 0.3s' }} />
          </div>
          <button style={{ all: 'unset', color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 12 }} onClick={saveAndGo}>
            Skip setup
          </button>
        </div>
      </header>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <StepHeader />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 32px', overflow: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Onboarding</div>

          {step === 1 && (
            <>
              <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '0 0 8px' }}>Pick your product type</h1>
              <p style={{ fontSize: 15, color: 'var(--color-text-3)', margin: '0 0 36px', maxWidth: 560 }}>We'll spin up a template optimised for your industry. You can change everything later.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {industries.map(c => {
                  const selected = industry === c.id;
                  return (
                    <button key={c.id} onClick={() => setIndustry(c.id)} style={{
                      all: 'unset', padding: 18,
                      border: selected ? '1.5px solid #0a0a0a' : '1px solid var(--color-line-2)',
                      borderRadius: 'var(--radius-3)', cursor: 'pointer',
                      background: selected ? '#fafafa' : '#fff',
                      height: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    }}>
                      <div style={{
                        width: 24, height: 24,
                        border: selected ? 'none' : '1px solid var(--color-line)',
                        borderRadius: 'var(--radius-2)',
                        background: selected ? '#0a0a0a' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 14, fontWeight: 700,
                      }}>
                        {selected ? '✓' : ''}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{c.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                          {c.templates ? `${c.templates} templates` : 'Start from scratch'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '0 0 8px' }}>Bring your brand</h1>
              <p style={{ fontSize: 15, color: 'var(--color-text-3)', margin: '0 0 36px', maxWidth: 560 }}>Forma inherits your brand on the buyer's side so it feels like a native part of your site.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Input label="Brand name" value={brand.name} onChange={e => setBrand(b => ({ ...b, name: e.target.value }))} full />
                  <Input label="Customer-facing website" placeholder="https://your-company.com" value={brand.website} onChange={e => setBrand(b => ({ ...b, website: e.target.value }))} full />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 6 }}>Logo</div>
                    <div style={{ border: '1px dashed var(--color-line-3)', borderRadius: 'var(--radius-2)', padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-2)', background: '#0a0a0a', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                        {brand.name.slice(0, 2).toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {brand.logoName || 'Upload logo'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>SVG, PNG or JPG · max 2 MB</div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/svg+xml,image/png,image/jpeg"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setBrand(b => ({ ...b, logoName: file.name }));
                        }}
                      />
                      <Btn variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>Browse</Btn>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 6 }}>Primary brand color</div>
                    <div
                      onClick={() => colorInputRef.current?.click()}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', cursor: 'pointer' }}
                    >
                      <div style={{ width: 22, height: 22, borderRadius: 4, background: brand.color, border: '1px solid var(--color-line)' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{brand.color.toUpperCase()}</span>
                      <span style={{ fontSize: 12, color: 'var(--color-muted)', marginLeft: 'auto' }}>Click to change</span>
                      <input
                        ref={colorInputRef}
                        type="color"
                        value={brand.color}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                        onChange={e => setBrand(b => ({ ...b, color: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                {/* Preview */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 10 }}>Preview</div>
                  <div style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-3)', overflow: 'hidden' }}>
                    <div style={{ background: brand.color, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#fff', fontWeight: 600 }}>
                        {brand.name.slice(0, 2).toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{brand.name || 'Your Brand'}</span>
                    </div>
                    <div style={{ padding: 16, background: '#f9f9f9' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 8 }}>Configure your product</div>
                      <div style={{ height: 8, background: 'var(--color-line)', borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '0 0 8px' }}>Invite your team</h1>
              <p style={{ fontSize: 15, color: 'var(--color-text-3)', margin: '0 0 36px', maxWidth: 560 }}>Optional — add teammates now or later from Settings → Team.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 12 }}>
                    <Input placeholder="colleague@company.com" type="email" full />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', border: '1px solid var(--color-line-2)', borderRadius: 'var(--radius-2)', height: 36, fontSize: 13.5, color: 'var(--color-text-3)', cursor: 'pointer' }}>
                      <span style={{ flex: 1 }}>Editor</span>
                      <span>↓</span>
                    </div>
                  </div>
                ))}
                <Btn variant="ghost" size="sm" style={{ alignSelf: 'flex-start' }}>+ Add another</Btn>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', margin: '0 0 8px' }}>You're all set!</h1>
              <p style={{ fontSize: 15, color: 'var(--color-text-3)', margin: '0 0 36px', maxWidth: 560 }}>Your workspace is ready. Let's build your first configurator.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { n: '01', title: 'Build a configurator', desc: 'Use the visual builder to add steps, fields, and pricing rules.', href: '/configurators/new' },
                  { n: '02', title: 'Embed on your site', desc: 'Copy a single <script> tag onto your website.', href: '/embed' },
                  { n: '03', title: 'Receive your first lead', desc: 'Watch leads arrive in your inbox with full specs and PDF quote.', href: '/leads' },
                ].map(item => (
                  <Link key={item.n} href={item.href} style={{ display: 'flex', gap: 16, padding: 20, border: '1px solid var(--color-line)', borderRadius: 'var(--radius-3)', textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-muted)', minWidth: 28 }}>{item.n}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 4 }}>{item.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
            {step > 1 ? (
              <Btn variant="secondary" onClick={() => setStep(s => s - 1)}>← Back</Btn>
            ) : <span />}
            {step < totalSteps ? (
              <Btn variant="primary" onClick={() => setStep(s => s + 1)}>Continue →</Btn>
            ) : (
              <Btn variant="primary" disabled={saving} onClick={saveAndGo}>
                {saving ? 'Saving…' : 'Go to dashboard →'}
              </Btn>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
