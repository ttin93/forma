/* Configurator management — list, builder canvas, preview, version history */

// ───────── Configurators list (grid view)
const ConfigList = () => (
  <AppShell active="cfg" crumb={['Configurators']} actions={
    <>
      <Btn kind="secondary" size="sm" icon={I.upload}>Import</Btn>
      <Btn kind="primary" size="sm" icon={I.plus}>New configurator</Btn>
    </>
  }>
    <PageHeader
      title="Configurators"
      desc="Each configurator is a buyer-facing flow you can embed anywhere. Duplicate to A/B test, archive to retire."
      tabs={[
        { label: 'All', count: 6, active: true },
        { label: 'Published', count: 4 },
        { label: 'Drafts', count: 1 },
        { label: 'Archived', count: 1 },
      ]}
    />
    <PageBody>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Input prefix={I.search} placeholder="Search configurators…" style={{ width: 280 }} />
        <Btn kind="secondary" size="sm" icon={I.filter}>Status: All</Btn>
        <Btn kind="secondary" size="sm" icon={I.filter}>Product: All</Btn>
        <Btn kind="secondary" size="sm" iconRight={I.chevD}>Sort: Most leads</Btn>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4, border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-2)', padding: 2 }}>
          <button className="btn-reset" style={{ width: 28, height: 24, display: 'grid', placeItems: 'center', background: '#0a0a0a', color: '#fff', borderRadius: 4 }}>{I.grid}</button>
          <button className="btn-reset" style={{ width: 28, height: 24, display: 'grid', placeItems: 'center', color: 'var(--c-text-3)' }}>{I.list}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { name: 'Pergola Classic',       v: 'v4.2',  status: 'live', leads: 128, views: 4218, conv: 3.0, ts: 'Updated 2h ago' },
          { name: 'Pergola Bioclimatic',   v: 'v3.7',  status: 'live', leads: 92, views: 3884, conv: 2.4, ts: 'Updated yesterday' },
          { name: 'Carport Lite',          v: 'v3.1',  status: 'live', leads: 38, views: 2012, conv: 1.9, ts: 'Updated 3d ago' },
          { name: 'Custom Garage',         v: 'v2.0',  status: 'live', leads: 17, views: 1442, conv: 1.2, ts: 'Updated 5d ago' },
          { name: 'Sliding Doors v2',      v: 'v1.0 draft', status: 'draft', leads: 9, views: 862, conv: 1.0, ts: 'Started Mon' },
          { name: 'Modular Sauna (2024)',  v: 'v2.4',  status: 'archived', leads: 0, views: 0, conv: 0, ts: 'Archived Jan 8' },
        ].map(c => (
          <Card key={c.name} pad={0} style={{ overflow: 'hidden' }}>
            <div style={{ height: 160, background: c.status === 'archived' ? 'var(--c-surface)' : '#fafafa', borderBottom: '1px solid var(--c-line)', display: 'grid', placeItems: 'center', position: 'relative' }}>
              <PergolaSVG width={220} height={130} color={c.status === 'archived' ? '#a3a3a3' : '#0a0a0a'} lineOnly />
              <div style={{ position: 'absolute', top: 10, left: 10 }}>
                <Badge kind={c.status === 'live' ? 'live' : c.status === 'draft' ? 'new' : 'off'} size="sm">
                  {c.status === 'live' ? '● Live' : c.status === 'draft' ? 'Draft' : 'Archived'}
                </Badge>
              </div>
              <div style={{ position: 'absolute', top: 10, right: 10 }}>
                <button className="btn-reset" style={{ width: 24, height: 24, background: '#fff', border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)', display: 'grid', placeItems: 'center', color: 'var(--c-text-2)' }}>{I.more}</button>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: '-0.01em' }}>{c.name}</div>
                <div style={{ fontSize: 11.5, fontFamily: 'var(--f-mono)', color: 'var(--c-muted)' }}>{c.v}</div>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>{c.ts}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--c-line)', fontSize: 12 }}>
                {[['Leads', c.leads], ['Views', c.views.toLocaleString()], ['Conv.', c.conv + '%']].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ color: 'var(--c-muted)', fontSize: 10.5, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
                    <div style={{ fontFamily: 'var(--f-mono)', fontWeight: 500, fontSize: 14, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageBody>
  </AppShell>
);

// ───────── Builder canvas
const ConfigBuilder = () => (
  <AppShell active="cfg" search={false}
    crumb={['Configurators', 'Pergola Classic', 'Builder']}
    actions={
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Badge kind="live" size="sm">● Live · v4.2</Badge>
        <Btn kind="ghost" size="sm" icon={I.history}>History</Btn>
        <Btn kind="secondary" size="sm" icon={I.eye}>Preview</Btn>
        <Btn kind="primary" size="sm" iconRight={I.arrR}>Publish</Btn>
      </div>
    }
  >
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 320px', height: '100%' }}>
      {/* LEFT — Steps & flow */}
      <div style={{ borderRight: '1px solid var(--c-line)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-line)' }}>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Flow</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>7 steps</div>
            <button className="btn-reset" style={{ width: 22, height: 22, border: '1px solid var(--c-line-2)', borderRadius: 4, display: 'grid', placeItems: 'center', color: 'var(--c-text-2)' }}>{I.plus}</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          {[
            { n: '01', label: 'Model selection', sub: '3 options', active: false },
            { n: '02', label: 'Dimensions', sub: 'W × D × H · sliders', active: true },
            { n: '03', label: 'Roof type', sub: 'Conditional', active: false },
            { n: '04', label: 'Sides & blinds', sub: 'Optional', active: false },
            { n: '05', label: 'Color & finish', sub: '7 swatches', active: false },
            { n: '06', label: 'Add-ons', sub: '11 items', active: false },
            { n: '07', label: 'Contact & submit', sub: 'Lead capture', active: false },
          ].map(s => (
            <div key={s.n} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
              borderRadius: 'var(--r-2)', cursor: 'pointer',
              background: s.active ? 'var(--c-surface-2)' : 'transparent',
              border: s.active ? '1px solid var(--c-line)' : '1px solid transparent',
              marginBottom: 4,
            }}>
              <span style={{ cursor: 'grab', color: 'var(--c-muted)', fontSize: 12 }}>⋮⋮</span>
              <span style={{ fontSize: 10.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', width: 18 }}>{s.n}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{s.sub}</div>
              </div>
            </div>
          ))}
          <button className="btn-reset" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', width: '100%', fontSize: 12.5, color: 'var(--c-text-2)', border: '1px dashed var(--c-line-3)', borderRadius: 'var(--r-2)', marginTop: 4 }}>
            {I.plus} Add step
          </button>
        </div>
        <div style={{ borderTop: '1px solid var(--c-line)', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Logic</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['If W ≥ 5m', '→ add Reinforced post'],
              ['If Roof = Bioclimatic', '→ show Rain sensor'],
              ['If Wood finish', '→ hide LED strip'],
            ].map(([a, b]) => (
              <div key={a} style={{ fontSize: 11.5, padding: '7px 8px', background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)', fontFamily: 'var(--f-mono)' }}>
                <div>{a}</div>
                <div style={{ color: 'var(--c-text-3)', marginTop: 2 }}>{b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER — Canvas */}
      <div style={{ background: 'var(--c-surface)', overflow: 'auto', padding: 24, position: 'relative' }}>
        {/* Canvas toolbar */}
        <div style={{ position: 'absolute', top: 14, left: 24, right: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge size="sm">Step 02 · Dimensions</Badge>
            <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Editing buyer-facing view</span>
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-2)', padding: 2, fontSize: 12 }}>
            {['Desktop', 'Tablet', 'Mobile'].map((v, i) => (
              <button key={v} className="btn-reset" style={{
                padding: '4px 10px', borderRadius: 4,
                background: i === 0 ? '#0a0a0a' : 'transparent',
                color: i === 0 ? '#fff' : 'var(--c-text-2)', fontWeight: 500,
              }}>{v}</button>
            ))}
          </div>
        </div>

        {/* Buyer-facing card */}
        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 760, background: '#fff', border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-3)', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,.05)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--c-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>Step 2 of 7</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{ width: 22, height: 3, background: i <= 1 ? '#0a0a0a' : '#e3e3e3' }} />
                ))}
              </div>
            </div>
            <div style={{ padding: 28 }}>
              <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>How big should it be?</h3>
              <p style={{ fontSize: 13, color: 'var(--c-text-3)', margin: '4px 0 24px' }}>We'll show realistic limits based on the model you picked.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-2)', height: 220, display: 'grid', placeItems: 'center', position: 'relative' }}>
                  <PergolaSVG width={280} height={180} />
                  <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>3D preview</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {[
                    ['Width',  4.20, 3.0, 6.0, 'm'],
                    ['Depth',  3.50, 2.5, 5.0, 'm'],
                    ['Height', 2.40, 2.2, 3.2, 'm'],
                  ].map(([l, v, min, max, u]) => (
                    <div key={l}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{l}</span>
                        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 13 }}>{v} {u}</span>
                      </div>
                      <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
                        <div style={{ height: 4, background: '#ececec', borderRadius: 4, width: '100%', overflow: 'hidden' }}>
                          <div style={{ width: `${(v - min) / (max - min) * 100}%`, height: '100%', background: '#0a0a0a' }} />
                        </div>
                        <div style={{ position: 'absolute', left: `calc(${(v - min) / (max - min) * 100}% - 8px)`, width: 16, height: 16, borderRadius: 16, background: '#fff', border: '1.5px solid #0a0a0a' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>
                        <span>{min} {u}</span>
                        <span>{max} {u}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--c-line)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-reset" style={{ fontSize: 13, color: 'var(--c-text-2)' }}>← Back</button>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>Running total</span>
                <span style={{ fontSize: 22, fontFamily: 'var(--f-mono)', fontWeight: 500 }}>€4,820</span>
                <button className="btn-reset" style={{ background: '#0a0a0a', color: '#fff', padding: '8px 18px', borderRadius: 'var(--r-2)', fontSize: 13, fontWeight: 500 }}>Continue →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Inspector */}
      <div style={{ borderLeft: '1px solid var(--c-line)', overflow: 'auto' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-line)' }}>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inspector</div>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 4 }}>Width · slider</div>
        </div>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--c-line)', fontSize: 12 }}>
          {['Field', 'Pricing', 'Validation', 'Logic'].map((t, i) => (
            <button key={t} className="btn-reset" style={{
              flex: 1, padding: '10px 8px', fontWeight: 500,
              color: i === 0 ? 'var(--c-ink)' : 'var(--c-text-3)',
              borderBottom: i === 0 ? '1.5px solid #0a0a0a' : '1.5px solid transparent', marginBottom: -1,
            }}>{t}</button>
          ))}
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Label" value="Width" full />
          <Input label="Internal key" prefix="$" value="width" full />
          <Input label="Help text" value="Outer-to-outer dimension, including beams." full />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Input label="Min" suffix="m" value="3.0" />
            <Input label="Max" suffix="m" value="6.0" />
            <Input label="Step" suffix="m" value="0.10" />
          </div>
          <Input label="Default" suffix="m" value="4.20" full />

          <div style={{ borderTop: '1px solid var(--c-line)', paddingTop: 14, marginTop: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-2)', marginBottom: 8 }}>Pricing formula</div>
            <div style={{ background: '#0a0a0a', color: '#e3e3e3', borderRadius: 'var(--r-2)', padding: 12, fontFamily: 'var(--f-mono)', fontSize: 12, lineHeight: 1.55 }}>
              <span style={{ color: '#a3a3a3' }}>// per m² area</span>{'\n'}
              <span style={{ color: '#fff' }}>price += </span>
              <span style={{ color: '#0a0a0a', background: '#fff', padding: '0 4px', borderRadius: 3 }}>$width</span>
              <span style={{ color: '#fff' }}> * </span>
              <span style={{ color: '#0a0a0a', background: '#fff', padding: '0 4px', borderRadius: 3 }}>$depth</span>
              <span style={{ color: '#fff' }}> * </span>
              <span style={{ color: '#fff' }}>320.00</span>
              <span style={{ color: '#a3a3a3' }}>  // €/m²</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', marginTop: 6 }}>Test result: <span style={{ color: 'var(--c-ink)' }}>4.20 × 3.50 × €320 = €4,704</span></div>
          </div>

          <div style={{ borderTop: '1px solid var(--c-line)', paddingTop: 14, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ToggleRow label="Show in summary" on />
            <ToggleRow label="Required field" on />
            <ToggleRow label="Affect price" on />
            <ToggleRow label="Track in analytics" on />
          </div>
        </div>
      </div>
    </div>
  </AppShell>
);

const ToggleRow = ({ label, on }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
    <span>{label}</span>
    <span style={{ width: 30, height: 18, borderRadius: 18, background: on ? '#0a0a0a' : '#d4d4d4', position: 'relative', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 14 : 2, width: 14, height: 14, borderRadius: 14, background: '#fff' }} />
    </span>
  </div>
);

// ───────── Buyer preview / configurator detail tab
const ConfigPreview = () => (
  <AppShell active="cfg" search={false}
    crumb={['Configurators', 'Pergola Classic', 'Preview']}
    actions={
      <>
        <Btn kind="ghost" size="sm" icon={I.reload}>Refresh</Btn>
        <Btn kind="ghost" size="sm" icon={I.share}>Share preview link</Btn>
        <Btn kind="secondary" size="sm" icon={I.edit}>Edit</Btn>
        <Btn kind="primary" size="sm">Publish</Btn>
      </>
    }
  >
    <PageHeader
      eyebrow="Pergola Classic · v4.2 draft"
      title={<span>Preview</span>}
      desc="See exactly what a buyer would see. Switch devices, try different inputs, and step through to the submit screen."
      tabs={[
        { label: 'Overview' },
        { label: 'Builder' },
        { label: 'Preview', active: true },
        { label: 'Pricing rules', count: 11 },
        { label: 'Lead routing' },
        { label: 'Versions', count: 14 },
        { label: 'Settings' },
      ]}
    />
    <PageBody>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Phone-frame preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-pill)', padding: 3 }}>
            {['Desktop', 'Tablet', 'Mobile'].map((v, i) => (
              <button key={v} className="btn-reset" style={{
                padding: '6px 14px', borderRadius: 'var(--r-pill)', fontSize: 12,
                background: i === 0 ? '#0a0a0a' : 'transparent',
                color: i === 0 ? '#fff' : 'var(--c-text-2)', fontWeight: 500,
              }}>{v}</button>
            ))}
          </div>
          <div style={{ width: '100%', background: '#fff', border: '1px solid var(--c-line)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,.05)' }}>
            <div style={{ height: 28, background: '#f7f7f7', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6 }}>
              {[1,2,3].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: 8, border: '1px solid var(--c-line-3)' }} />)}
              <div style={{ flex: 1, fontSize: 10, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textAlign: 'center' }}>sunpergola.si/configurator</div>
            </div>
            <div style={{ height: 480, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0a0a0a', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 500 }}>SP</div>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>SunPergola — Pergola Classic</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} style={{ width: 28, height: 4, background: i <= 4 ? '#0a0a0a' : '#e3e3e3' }} />
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
                <div style={{ background: 'var(--c-surface)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                  <PergolaSVG width={360} height={240} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step 05 / 07</div>
                    <h3 style={{ fontSize: 22, fontWeight: 500, margin: '4px 0 0' }}>Pick a color</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      ['#0a0a0a', 'Anthracite'],
                      ['#3a3a3a', 'Graphite'],
                      ['#7a7a7a', 'Quartz'],
                      ['#c9c9c9', 'Stone'],
                      ['#e8e3da', 'Cream'],
                      ['#ffffff', 'White'],
                      ['#5b3520', 'Walnut'],
                      ['#1b1b1b', 'Matt black'],
                    ].map(([c, n], i) => (
                      <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                        <div style={{ width: '100%', aspectRatio: '1', background: c, border: i === 0 ? '2px solid #0a0a0a' : '1px solid var(--c-line-2)', borderRadius: 6 }} />
                        <span style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', color: i === 0 ? 'var(--c-ink)' : 'var(--c-text-3)' }}>{n}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>Running price</div>
                      <div style={{ fontSize: 24, fontWeight: 500, fontFamily: 'var(--f-mono)' }}>€4,820</div>
                    </div>
                    <button className="btn-reset" style={{ background: '#0a0a0a', color: '#fff', padding: '10px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>Continue →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card pad={18}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>This session</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
              {[
                ['Model', 'Classic'],
                ['Width', '4.20 m'],
                ['Depth', '3.50 m'],
                ['Height', '2.40 m'],
                ['Roof', 'Manual louvre'],
                ['Sides', '3-sided · drop-blinds'],
                ['Color', 'Anthracite #0A0A0A'],
                ['Add-ons', 'LED strip · Heater (2)'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--c-line)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--c-text-3)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--f-mono)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--c-line)' }}>
              <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Total</span>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 22, fontWeight: 500 }}>€4,820</span>
            </div>
          </Card>

          <Card pad={18}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Rules triggered</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['width × depth × €320/m²', '+€4,704'],
                ['LED strip add-on', '+€140'],
                ['Heater × 2', '+€420'],
                ['Anthracite — no upcharge', '€0'],
                ['Promo: First-week buyer', '−€444'],
              ].map(([r, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--f-mono)' }}>
                  <span style={{ color: 'var(--c-text-2)' }}>{r}</span>
                  <span style={{ color: v.startsWith('−') ? 'var(--c-text)' : 'var(--c-text)' }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card pad={18}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Share preview</div>
            <Input value="forma.studio/p/pgl-cl-r4QkLm" suffix={<span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontFamily: 'var(--f-mono)', cursor: 'pointer' }}>{I.copy} Copy</span>} full />
            <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', marginTop: 8 }}>Anyone with the link can test this draft. Submissions don't trigger emails.</div>
          </Card>
        </div>
      </div>
    </PageBody>
  </AppShell>
);

Object.assign(window, { ConfigList, ConfigBuilder, ConfigPreview });
