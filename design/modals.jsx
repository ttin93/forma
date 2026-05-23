/* Modals, popovers, toasts — shown over a faded backdrop */

// Backdrop wrapper for modal artboards (artboard size already set on canvas).
const ModalStage = ({ children, dim = 0.55 }) => (
  <div className="modal-bg" style={{
    width: '100%', height: '100%',
    background: `rgba(10,10,10,${dim})`,
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    fontFamily: 'var(--f-sans)',
  }}>{children}</div>
);

const ModalShell = ({ children, w = 480, title, desc, onClose, footer }) => (
  <div style={{
    width: w, background: '#fff', borderRadius: 'var(--r-3)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex', flexDirection: 'column', maxHeight: '90%',
  }}>
    {(title || desc) && (
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && <h2 style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em', margin: 0, color: 'var(--c-ink)' }}>{title}</h2>}
          {desc && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--c-text-3)' }}>{desc}</p>}
        </div>
        <button className="btn-reset" style={{ width: 28, height: 28, borderRadius: 'var(--r-2)', display: 'grid', placeItems: 'center', color: 'var(--c-text-3)' }}>{I.x}</button>
      </div>
    )}
    <div style={{ padding: title ? '20px 24px' : '24px 24px', overflow: 'auto', flex: 1 }}>{children}</div>
    {footer && (
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--c-line)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, background: 'var(--c-surface)', borderRadius: '0 0 var(--r-3) var(--r-3)' }}>{footer}</div>
    )}
  </div>
);

// ───────── 1. Delete confirm (destructive)
const ModalDelete = () => (
  <ModalStage>
    <ModalShell w={440}
      title="Delete Pergola Classic v4.2?"
      desc="The configurator and its 14 versions will be archived for 30 days, then permanently removed."
      footer={<>
        <Btn kind="ghost">Cancel</Btn>
        <Btn kind="primary" style={{ background: '#0a0a0a' }}>Yes, delete</Btn>
      </>}
    >
      <div style={{ padding: 16, background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--c-text-3)' }}>Configurator</span><span style={{ fontFamily: 'var(--f-mono)' }}>Pergola Classic</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--c-text-3)' }}>Created</span><span style={{ fontFamily: 'var(--f-mono)' }}>Apr 2024 · 19 months ago</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--c-text-3)' }}>Submissions to date</span><span style={{ fontFamily: 'var(--f-mono)' }}>1,284</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--c-text-3)' }}>Embedded on</span><span style={{ fontFamily: 'var(--f-mono)' }}>3 domains</span></div>
      </div>
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-2)', display: 'block', marginBottom: 6 }}>Type "Pergola Classic" to confirm</label>
        <Input value="Pergola Classic" full />
      </div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, fontSize: 12.5, color: 'var(--c-text-2)' }}>
        <span style={{ width: 16, height: 16, borderRadius: 3, border: '1.5px solid #0a0a0a', background: '#0a0a0a', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10, marginTop: 1 }}>✓</span>
        I understand 3 embedded snippets on production sites will stop working.
      </label>
    </ModalShell>
  </ModalStage>
);

// ───────── 2. Invite teammate
const ModalInvite = () => (
  <ModalStage>
    <ModalShell w={520}
      title="Invite teammates"
      desc="3 of 3 seats used on Growth. Adding seats adds €19/month each."
      footer={<>
        <Btn kind="ghost">Cancel</Btn>
        <Btn kind="primary" iconRight={I.arrR}>Send invites · €19/mo more</Btn>
      </>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-2)', display: 'block', marginBottom: 6 }}>Email addresses</label>
          <div style={{ minHeight: 80, border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-2)', padding: 10, display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' }}>
            {['milos@sunpergola.si', 'pia@sunpergola.si'].map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 'var(--r-pill)', fontSize: 12, fontFamily: 'var(--f-mono)' }}>
                {t}
                <span style={{ color: 'var(--c-text-3)', cursor: 'pointer' }}>×</span>
              </span>
            ))}
            <span style={{ flex: 1, minWidth: 120, fontSize: 13, color: 'var(--c-muted)' }}>Add another…</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', marginTop: 6 }}>Separate with comma or Enter. Up to 20 at a time.</div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text-2)', display: 'block', marginBottom: 6 }}>Role</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { n: 'Admin',  d: 'Full access', sel: false },
              { n: 'Editor', d: 'Build & publish', sel: true },
              { n: 'Sales',  d: 'Leads only', sel: false },
              { n: 'Viewer', d: 'Read-only', sel: false },
            ].map(r => (
              <label key={r.n} style={{
                padding: 12, border: r.sel ? '1.5px solid #0a0a0a' : '1px solid var(--c-line-2)',
                borderRadius: 'var(--r-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 14, height: 14, borderRadius: 14, border: r.sel ? '4px solid #0a0a0a' : '1.5px solid var(--c-line-3)', background: '#fff' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.n}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--c-text-3)' }}>{r.d}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Input label="Add a personal note (optional)" placeholder="Hey team — joining you on the new pergola configurator." full />
      </div>
    </ModalShell>
  </ModalStage>
);

// ───────── 3. Share embed code
const ModalShare = () => (
  <ModalStage>
    <ModalShell w={580}
      title="Share & embed"
      desc="Pergola Classic · v4.2 · Live"
      footer={<>
        <Btn kind="ghost" icon={I.share}>Send to dev team</Btn>
        <div style={{ flex: 1 }} />
        <Btn kind="primary" icon={I.copy}>Copy snippet</Btn>
      </>}
    >
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--c-line)', marginBottom: 18 }}>
        {['Embed', 'Direct link', 'QR code', 'iFrame'].map((t, i) => (
          <button key={t} className="btn-reset" style={{
            padding: '8px 12px', fontSize: 12.5, fontWeight: 500,
            color: i === 0 ? 'var(--c-ink)' : 'var(--c-text-3)',
            borderBottom: i === 0 ? '1.5px solid #0a0a0a' : '1.5px solid transparent', marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>
      <div style={{ background: '#0a0a0a', color: '#e3e3e3', borderRadius: 'var(--r-2)', padding: 16, fontFamily: 'var(--f-mono)', fontSize: 12, lineHeight: 1.55, position: 'relative' }}>
{`<script async
  src="https://cdn.forma.studio/embed.js"
  data-config="pgl-cl-r4QkLm"
  data-host="sunpergola.si"></script>

<div id="forma-pergola-classic"></div>`}
        <button className="btn-reset" style={{ position: 'absolute', top: 10, right: 10, padding: '4px 10px', fontSize: 11, background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 4, fontFamily: 'var(--f-mono)' }}>Copy</button>
      </div>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Pixel width" value="100%" suffix="px or %" />
        <Input label="Min height" value="720" suffix="px" />
      </div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, fontSize: 12.5, color: 'var(--c-text-2)' }}>
        <span style={{ width: 16, height: 16, borderRadius: 3, background: '#0a0a0a', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10, marginTop: 1 }}>✓</span>
        Inherit fonts from sunpergola.si (recommended)
      </label>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 8, fontSize: 12.5, color: 'var(--c-text-2)' }}>
        <span style={{ width: 16, height: 16, borderRadius: 3, border: '1.5px solid var(--c-line-3)', background: '#fff', marginTop: 1 }} />
        Lazy load (delay until in view)
      </label>
    </ModalShell>
  </ModalStage>
);

// ───────── 4. Upgrade plan
const ModalUpgrade = () => (
  <ModalStage>
    <ModalShell w={680}
      title="You've hit your Growth plan limit"
      desc="364 of 500 leads used this month, with 16 days to go. Upgrade to keep collecting."
      footer={<>
        <Btn kind="ghost">Remind me later</Btn>
        <Btn kind="primary" iconRight={I.arrR}>Upgrade to Scale · €379/mo</Btn>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-2)', padding: 18 }}>
          <Badge size="sm">Current</Badge>
          <div style={{ fontSize: 18, fontWeight: 500, marginTop: 8 }}>Growth</div>
          <div style={{ fontSize: 24, fontFamily: 'var(--f-mono)', fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6 }}>€119<span style={{ fontSize: 13, color: 'var(--c-muted)' }}>/mo</span></div>
          <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 6 }}>500 leads · 4 configurators · 3 seats</div>
        </div>
        <div style={{ border: '1.5px solid #0a0a0a', borderRadius: 'var(--r-2)', padding: 18, position: 'relative', background: 'var(--c-surface)' }}>
          <Badge kind="new" size="sm">Recommended</Badge>
          <div style={{ fontSize: 18, fontWeight: 500, marginTop: 8 }}>Scale</div>
          <div style={{ fontSize: 24, fontFamily: 'var(--f-mono)', fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6 }}>€379<span style={{ fontSize: 13, color: 'var(--c-muted)' }}>/mo</span></div>
          <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 6 }}>2,500 leads · unlimited configurators · 10 seats</div>
        </div>
      </div>
      <div style={{ marginTop: 18, padding: 14, background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)' }}>
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>What changes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
          {[
            ['Monthly leads', '500', '2,500'],
            ['Lead overage rate', '€0.20', '€0.10'],
            ['Configurators', '4', 'Unlimited'],
            ['Team seats', '3', '10'],
            ['API access', '—', '✓'],
            ['SSO · SAML', '—', '✓'],
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', fontFamily: 'var(--f-mono)' }}>
              <span style={{ color: 'var(--c-text-2)', fontFamily: 'var(--f-sans)' }}>{r[0]}</span>
              <span style={{ color: 'var(--c-muted)' }}>{r[1]}</span>
              <span style={{ color: 'var(--c-ink)', fontWeight: 500 }}>{r[2]}</span>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  </ModalStage>
);

// ───────── 5. Command palette (Cmd+K)
const ModalCmdK = () => (
  <ModalStage dim={0.5}>
    <div style={{ width: 580, background: '#fff', borderRadius: 'var(--r-3)', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--c-text-3)' }}>{I.search}</span>
        <input value="lara" readOnly style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 15, color: 'var(--c-text)' }} />
        <span style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', border: '1px solid var(--c-line)', padding: '2px 6px', borderRadius: 4 }}>ESC</span>
      </div>
      <div style={{ padding: 8, maxHeight: 460, overflow: 'auto' }}>
        <div style={{ padding: '8px 10px 4px', fontSize: 10.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Leads · 3 matches</div>
        {[
          { t: 'Lara Bregar', s: 'Pergola Classic · €4,820 · 2 min ago', sel: true, ico: I.inbox },
          { t: 'Lara Trček',  s: 'Carport Lite · €3,260 · 3 days ago',    ico: I.inbox },
          { t: 'Lars Müller', s: 'Pergola Bioclimatic · €7,640 · 1 wk ago', ico: I.inbox },
        ].map(r => (
          <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 'var(--r-2)', background: r.sel ? '#0a0a0a' : 'transparent', color: r.sel ? '#fff' : 'var(--c-text)' }}>
            <span style={{ color: r.sel ? '#a3a3a3' : 'var(--c-text-3)' }}>{r.ico}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.t}</div>
              <div style={{ fontSize: 11.5, color: r.sel ? '#a3a3a3' : 'var(--c-text-3)', fontFamily: 'var(--f-mono)' }}>{r.s}</div>
            </div>
            {r.sel && <span style={{ fontSize: 11, color: '#fff', fontFamily: 'var(--f-mono)' }}>↵ Open</span>}
          </div>
        ))}
        <div style={{ padding: '12px 10px 4px', fontSize: 10.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actions</div>
        {[
          ['Go to Leads inbox', '⌘L', I.inbox],
          ['Create new configurator', '⌘N', I.plus],
          ['Invite teammate', '⌘I', I.users],
          ['View embed snippet', '⌘E', I.code],
        ].map(([t, k, ico]) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 'var(--r-2)' }}>
            <span style={{ color: 'var(--c-text-3)' }}>{ico}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{t}</span>
            <span style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', border: '1px solid var(--c-line)', padding: '1px 6px', borderRadius: 4 }}>{k}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--c-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', background: 'var(--c-surface)' }}>
        <span>↑↓ to navigate · ↵ to open · ⌘K to close</span>
        <span>Forma Search v2</span>
      </div>
    </div>
  </ModalStage>
);

// ───────── 6. Quick lead preview (slide-over)
const ModalQuickLead = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'flex-end', background: 'rgba(10,10,10,0.45)' }}>
    <div style={{ width: 460, background: '#fff', height: '100%', boxShadow: '-12px 0 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name="Lara Bregar" size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Lara Bregar</div>
            <Badge kind="new" size="sm">Hot</Badge>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)' }}>L-2841 · 2 min ago · sunpergola.si/garden</div>
        </div>
        <button className="btn-reset" style={{ width: 28, height: 28, color: 'var(--c-text-3)' }}>{I.x}</button>
      </div>
      <div style={{ padding: 22, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 'var(--r-3)', padding: 18 }}>
          <PergolaSVG width={400} height={200} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Configuration</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12.5 }}>
            {[
              ['Model',   'Pergola Classic'],
              ['Size',    '4.20 × 3.50 × 2.40m'],
              ['Roof',    'Manual louvre'],
              ['Sides',   '3 drop-blinds'],
              ['Color',   'Anthracite'],
              ['Add-ons', 'LED, heater ×2, install'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--c-line)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--c-text-3)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--f-mono)' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--c-line)' }}>
            <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Estimate</span>
            <span style={{ fontSize: 22, fontFamily: 'var(--f-mono)', fontWeight: 500 }}>€4,820</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Contact</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{I.mail}lara.bregar@gmail.com</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{I.phone}<span style={{ fontFamily: 'var(--f-mono)' }}>+386 41 218 462</span></div>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--c-line)', padding: 16, display: 'flex', gap: 8 }}>
        <Btn kind="secondary" size="md" full>Open detail →</Btn>
        <Btn kind="primary" size="md" full icon={I.mail}>Reply</Btn>
      </div>
    </div>
  </div>
);

// ───────── 7. Filter builder popover
const ModalFilter = () => (
  <ModalStage dim={0.4}>
    <div style={{ width: 560, background: '#fff', borderRadius: 'var(--r-3)', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Filter leads</div>
        <span style={{ fontSize: 12, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)' }}>3 rules · matches 18 of 142</span>
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['Status', 'is any of', 'New, Contacted', I.inbox],
          ['Value',  'is greater than', '€4,000', I.bolt],
          ['City',   'matches', 'Ljubljana OR Kranj OR Bled', I.globe],
        ].map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 110px 110px 1fr 24px', gap: 6, alignItems: 'center', padding: 8, background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)' }}>
            <span style={{ color: 'var(--c-text-3)' }}>{r[3]}</span>
            <button className="btn-reset" style={{ fontSize: 12.5, padding: '5px 8px', background: '#fff', border: '1px solid var(--c-line-2)', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{r[0]} <span style={{ color: 'var(--c-muted)' }}>▾</span></button>
            <button className="btn-reset" style={{ fontSize: 12, padding: '5px 8px', background: '#fff', border: '1px solid var(--c-line-2)', borderRadius: 4, color: 'var(--c-text-2)', fontFamily: 'var(--f-mono)' }}>{r[1]}</button>
            <span style={{ fontSize: 12, padding: '5px 8px', background: '#fff', border: '1px solid var(--c-line-2)', borderRadius: 4, fontFamily: 'var(--f-mono)' }}>{r[2]}</span>
            <button className="btn-reset" style={{ color: 'var(--c-text-3)' }}>{I.x}</button>
          </div>
        ))}
        <button className="btn-reset" style={{ padding: 10, fontSize: 12.5, border: '1px dashed var(--c-line-3)', borderRadius: 'var(--r-2)', color: 'var(--c-text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {I.plus} Add filter rule
        </button>
      </div>
      <div style={{ padding: '12px 18px', background: 'var(--c-surface)', borderTop: '1px solid var(--c-line)', display: 'flex', justifyContent: 'space-between' }}>
        <Btn kind="ghost" size="sm">Clear all</Btn>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn kind="secondary" size="sm">Save as view</Btn>
          <Btn kind="primary" size="sm">Apply</Btn>
        </div>
      </div>
    </div>
  </ModalStage>
);

// ───────── 8. Notifications stack
const ModalNotifs = () => (
  <div style={{ width: '100%', height: '100%', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 10, background: 'rgba(245,245,245,0.6)' }}>
    {/* Background app hint */}
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'rgba(0,0,0,0.15)', fontFamily: 'var(--f-mono)', fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      App in background
    </div>
    {[
      { ico: I.inbox, h: 'New lead — Lara Bregar', d: 'Pergola Classic · €4,820 · just now', cta: 'Open', dark: true },
      { ico: I.check, h: 'Webhook delivered', d: 'pipedrive.com responded 200 OK in 142ms', cta: 'View' },
      { ico: I.bolt, h: 'Pricing rule updated', d: 'Reinforced post threshold changed to W ≥ 4.8m', cta: 'Undo' },
    ].map((n, i) => (
      <div key={i} style={{
        width: 360, background: n.dark ? '#0a0a0a' : '#fff', color: n.dark ? '#fff' : 'var(--c-text)',
        border: n.dark ? 'none' : '1px solid var(--c-line)', borderRadius: 'var(--r-3)', padding: 14,
        display: 'flex', gap: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--r-2)', background: n.dark ? '#171717' : 'var(--c-surface)', display: 'grid', placeItems: 'center', color: n.dark ? '#fff' : 'var(--c-text-2)', flexShrink: 0 }}>{n.ico}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{n.h}</div>
          <div style={{ fontSize: 11.5, color: n.dark ? '#a3a3a3' : 'var(--c-text-3)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>{n.d}</div>
        </div>
        <button className="btn-reset" style={{ fontSize: 12, fontWeight: 500, color: n.dark ? '#fff' : 'var(--c-ink)', borderBottom: '1px solid currentColor', alignSelf: 'flex-start', marginTop: 6 }}>{n.cta}</button>
        <button className="btn-reset" style={{ position: 'absolute', top: 6, right: 8, color: n.dark ? '#a3a3a3' : 'var(--c-muted)', width: 18, height: 18, display: 'grid', placeItems: 'center' }}>×</button>
      </div>
    ))}
  </div>
);

// ───────── 9. Empty state / first lead celebration
const ModalEmpty = () => (
  <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--f-sans)' }}>
    <div style={{ textAlign: 'center', maxWidth: 460 }}>
      <div style={{ width: 96, height: 96, borderRadius: 96, background: 'var(--c-surface)', border: '1px solid var(--c-line)', display: 'grid', placeItems: 'center', margin: '0 auto 24px', color: 'var(--c-text-2)' }}>
        <Icon d={<><path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/></>} size={36} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>No leads yet</div>
      <h2 className="serif" style={{ fontSize: 36, fontWeight: 400, letterSpacing: '-0.015em', margin: '8px 0 0' }}>
        Your inbox is&nbsp;<span className="italic">empty.</span>
      </h2>
      <p style={{ fontSize: 14, color: 'var(--c-text-3)', lineHeight: 1.55, margin: '12px 0 0' }}>
        Publish your first configurator and embed the snippet on your site. Leads will arrive here, formatted and scored, the moment buyers hit submit.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 28 }}>
        <Btn kind="secondary" icon={I.code}>Copy embed snippet</Btn>
        <Btn kind="primary" iconRight={I.arrR}>Publish your first configurator</Btn>
      </div>
      <div style={{ marginTop: 32, fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>
        Or <a style={{ color: 'var(--c-ink)', borderBottom: '1px solid currentColor' }}>book a setup call</a> — we'll embed it for you, free.
      </div>
    </div>
  </div>
);

Object.assign(window, {
  ModalDelete, ModalInvite, ModalShare, ModalUpgrade,
  ModalCmdK, ModalQuickLead, ModalFilter, ModalNotifs, ModalEmpty,
});
