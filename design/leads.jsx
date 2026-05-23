/* Leads — inbox table, kanban pipeline, lead detail */

// Fake lead set, used by all three views.
const LEADS = [
  { id: 'L-2841', name: 'Lara Bregar',    co: 'private',                cfg: 'Pergola Classic',     val: 4820, status: 'new',         t: '2 min', flag: 'hot',  city: 'Ljubljana',   src: 'sunpergola.si/garden' },
  { id: 'L-2840', name: 'Marko Hribernik',co: 'Hribernik Gradnje d.o.o.',cfg: 'Pergola Bioclimatic',val: 8420, status: 'contacted',   t: '14 min',flag: 'hot',  city: 'Kranj',       src: 'google ads · brand' },
  { id: 'L-2839', name: 'Jure Petek',     co: 'private',                cfg: 'Pergola Bioclimatic', val: 7640, status: 'new',         t: '38 min',flag: '',     city: 'Maribor',     src: 'instagram' },
  { id: 'L-2838', name: 'Anja Štrukelj',  co: 'private',                cfg: 'Carport Lite',        val: 3260, status: 'qualified',   t: '1 h',   flag: '',     city: 'Koper',       src: 'sunpergola.si' },
  { id: 'L-2837', name: 'Boris Šuštar',   co: 'Šuštar Holiday Homes',   cfg: 'Pergola Classic ×3',  val: 13860, status: 'quoted',     t: '2 h',   flag: 'hot',  city: 'Bled',        src: 'referral · partner' },
  { id: 'L-2836', name: 'Saša Tomič',     co: 'private',                cfg: 'Pergola Classic',     val: 4180, status: 'qualified',   t: '4 h',   flag: '',     city: 'Novo mesto',  src: 'sunpergola.si/blog' },
  { id: 'L-2835', name: 'Tim Vrhovnik',   co: 'private',                cfg: 'Pergola Bioclimatic', val: 6420, status: 'won',         t: '6 h',   flag: '',     city: 'Celje',       src: 'google ads' },
  { id: 'L-2834', name: 'Nina Korošec',   co: 'NK Apartments',          cfg: 'Carport Lite ×2',     val: 6520, status: 'contacted',   t: '8 h',   flag: '',     city: 'Portorož',    src: 'sunpergola.si' },
  { id: 'L-2833', name: 'Mihael Žagar',   co: 'private',                cfg: 'Pergola Classic',     val: 4640, status: 'lost',        t: 'yesterday', flag: '',  city: 'Domžale',    src: 'instagram' },
  { id: 'L-2832', name: 'Petra Hočevar',  co: 'private',                cfg: 'Pergola Bioclimatic', val: 7220, status: 'quoted',      t: 'yesterday', flag: '', city: 'Velenje',     src: 'google organic' },
];

const statusBadge = (s) => {
  const map = {
    new:        { dot: '#0a0a0a', label: 'New' },
    contacted:  { dot: '#737373', label: 'Contacted' },
    qualified:  { dot: '#525252', label: 'Qualified' },
    quoted:     { dot: '#171717', label: 'Quoted' },
    won:        { dot: '#0a0a0a', label: 'Won' },
    lost:       { dot: '#d4d4d4', label: 'Lost' },
  }[s] || { dot: '#a3a3a3', label: s };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontFamily: 'var(--f-mono)', color: 'var(--c-text-2)' }}>
      <span style={{ width: 6, height: 6, borderRadius: 6, background: map.dot }} />
      {map.label}
    </span>
  );
};

// ───────── Leads inbox (table)
const LeadsInbox = () => (
  <AppShell active="leads" crumb={['Leads', 'Inbox']} actions={
    <>
      <Btn kind="secondary" size="sm" icon={I.download}>Export</Btn>
      <Btn kind="secondary" size="sm" iconRight={I.chevD}>Bulk actions</Btn>
      <Btn kind="primary" size="sm" icon={I.plus}>Manual lead</Btn>
    </>
  }>
    <PageHeader
      title="Leads"
      desc="Every configurator submission lands here with full specs, automatically scored, and routed to a teammate."
      tabs={[
        { label: 'Inbox', count: 23, active: true },
        { label: 'Pipeline' },
        { label: 'Won', count: 142 },
        { label: 'Lost', count: 56 },
        { label: 'Spam', count: 4 },
      ]}
    />
    <PageBody>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Input prefix={I.search} placeholder="Search by name, company, configuration…" style={{ width: 360 }} />
        <Btn kind="secondary" size="sm" icon={I.filter}>Status</Btn>
        <Btn kind="secondary" size="sm" icon={I.filter}>Configurator</Btn>
        <Btn kind="secondary" size="sm" icon={I.filter}>Value</Btn>
        <Btn kind="secondary" size="sm" icon={I.filter}>Assignee</Btn>
        <div style={{ flex: 1 }} />
        <Btn kind="ghost" size="sm" icon={I.sort}>Sort: Newest</Btn>
      </div>

      <Card pad={0} style={{ overflow: 'hidden' }}>
        {/* Table head */}
        <div style={{
          display: 'grid', gridTemplateColumns: '32px 1.4fr 1.6fr 100px 130px 140px 90px 40px',
          padding: '11px 16px', borderBottom: '1px solid var(--c-line)', background: 'var(--c-surface)',
          fontSize: 10.5, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', alignItems: 'center', gap: 8,
        }}>
          <input type="checkbox" />
          <span>Lead</span>
          <span>Configuration</span>
          <span style={{ textAlign: 'right' }}>Value</span>
          <span>Status</span>
          <span>Source</span>
          <span style={{ textAlign: 'right' }}>Received</span>
          <span />
        </div>
        {LEADS.map((l, i) => (
          <div key={l.id} style={{
            display: 'grid', gridTemplateColumns: '32px 1.4fr 1.6fr 100px 130px 140px 90px 40px',
            padding: '14px 16px', borderBottom: i < LEADS.length - 1 ? '1px solid var(--c-line)' : 'none',
            alignItems: 'center', gap: 8, fontSize: 13,
            background: i === 0 ? 'rgba(0,0,0,0.015)' : '#fff',
          }}>
            <input type="checkbox" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {l.flag === 'hot' && <span style={{ width: 5, height: 24, background: '#0a0a0a', borderRadius: 4, flexShrink: 0 }} />}
              <Avatar name={l.name} size={28} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: 'var(--c-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)' }}>{l.co} · {l.city}</div>
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--c-text)' }}>{l.cfg}</div>
              <div style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>{l.id} · 4.20 × 3.50m · Anthracite</div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'var(--f-mono)', fontWeight: 500 }}>€{l.val.toLocaleString()}</div>
            <div>{statusBadge(l.status)}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)' }}>{l.src}</div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>{l.t}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-reset" style={{ width: 24, height: 24, color: 'var(--c-text-3)', display: 'grid', placeItems: 'center', borderRadius: 4 }}>{I.more}</button>
            </div>
          </div>
        ))}
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--c-line)', fontSize: 12, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)' }}>
          <span>Showing 10 of 23 new leads · 142 total this month</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-reset" style={{ width: 24, height: 24, border: '1px solid var(--c-line-2)', borderRadius: 4, display: 'grid', placeItems: 'center' }}>{I.chevL}</button>
            <button className="btn-reset" style={{ width: 24, height: 24, border: '1px solid var(--c-line-2)', borderRadius: 4, display: 'grid', placeItems: 'center' }}>{I.chevR}</button>
          </div>
        </div>
      </Card>
    </PageBody>
  </AppShell>
);

// ───────── Pipeline (Kanban)
const LeadsPipeline = () => {
  const cols = [
    { id: 'new',       label: 'New',         count: 6,  total: '€34.4K' },
    { id: 'contacted', label: 'Contacted',   count: 4,  total: '€26.8K' },
    { id: 'qualified', label: 'Qualified',   count: 5,  total: '€41.2K' },
    { id: 'quoted',    label: 'Quoted',      count: 4,  total: '€54.6K' },
    { id: 'won',       label: 'Won',         count: 3,  total: '€18.2K' },
  ];
  return (
    <AppShell active="leads" crumb={['Leads', 'Pipeline']} actions={
      <>
        <Btn kind="secondary" size="sm" icon={I.filter}>Filters</Btn>
        <Btn kind="secondary" size="sm" iconRight={I.chevD}>Pergola Classic</Btn>
        <Btn kind="primary" size="sm" icon={I.plus}>Add card</Btn>
      </>
    }>
      <PageHeader
        title="Pipeline"
        desc="Drag cards across stages. Forma auto-syncs status changes to your CRM."
        tabs={[
          { label: 'Inbox', count: 23 },
          { label: 'Pipeline', active: true },
          { label: 'Won', count: 142 },
          { label: 'Lost', count: 56 },
        ]}
      />
      <div style={{ padding: '16px 32px', display: 'flex', gap: 14, overflowX: 'auto' }}>
        {cols.map((col, ci) => (
          <div key={col.id} style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 6, background: ['#0a0a0a','#525252','#737373','#171717','#0a0a0a'][ci] }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{col.label}</span>
                <span style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>{col.count}</span>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)' }}>{col.total}</span>
            </div>
            <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)', padding: 8, minHeight: 600, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LEADS.filter(l => l.status === col.id).map(l => (
                <div key={l.id} style={{ background: '#fff', border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'grab' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{l.cfg}</div>
                    {l.flag === 'hot' && <Badge kind="new" size="sm">Hot</Badge>}
                  </div>
                  <div style={{ fontSize: 11.5, fontFamily: 'var(--f-mono)', color: 'var(--c-text-3)' }}>{l.id} · 4.20 × 3.50m</div>
                  <div style={{ height: 1, background: 'var(--c-line)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={l.name} size={20} />
                      <span style={{ fontSize: 11.5, color: 'var(--c-text-2)' }}>{l.name.split(' ')[0]}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 500 }}>€{l.val.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>
                    <span>{l.t}</span>
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{I.mail} {I.phone}</span>
                  </div>
                </div>
              ))}
              <button className="btn-reset" style={{ padding: 10, fontSize: 12, color: 'var(--c-muted)', border: '1px dashed var(--c-line-3)', borderRadius: 'var(--r-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {I.plus} Add lead
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
};

// ───────── Lead detail
const LeadDetail = () => (
  <AppShell active="leads" search={false}
    crumb={['Leads', 'L-2841', 'Lara Bregar']}
    actions={
      <>
        <Btn kind="ghost" size="sm" icon={I.chevL}>Prev</Btn>
        <Btn kind="ghost" size="sm" iconRight={I.chevR}>Next</Btn>
        <span style={{ width: 1, height: 20, background: 'var(--c-line)' }} />
        <Btn kind="secondary" size="sm" icon={I.download}>Download PDF</Btn>
        <Btn kind="secondary" size="sm" icon={I.mail}>Reply</Btn>
        <Btn kind="primary" size="sm" iconRight={I.chevD}>Mark as quoted</Btn>
      </>
    }
  >
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: '100%' }}>
      {/* LEFT — body */}
      <div style={{ padding: '28px 32px', borderRight: '1px solid var(--c-line)' }}>
        {/* Title block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <Avatar name="Lara Bregar" size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em' }}>Lara Bregar</h1>
              <Badge kind="new" size="sm">Hot</Badge>
              {statusBadge('new')}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)', marginTop: 4 }}>
              L-2841 · Ljubljana · received 2 min ago via sunpergola.si/garden
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quote</div>
            <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.025em', fontFamily: 'var(--f-mono)' }}>€4,820</div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 8, margin: '24px 0 28px' }}>
          <Btn kind="primary" size="sm" icon={I.mail}>Send quote</Btn>
          <Btn kind="secondary" size="sm" icon={I.phone}>Schedule call</Btn>
          <Btn kind="secondary" size="sm" icon={I.calendar || I.clock}>Add to calendar</Btn>
          <Btn kind="secondary" size="sm" icon={I.users}>Assign</Btn>
          <Btn kind="secondary" size="sm" icon={I.copy}>Duplicate</Btn>
        </div>

        {/* Config summary */}
        <Card pad={24} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Configuration</div>
              <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 500 }}>Pergola Classic · Anthracite</h3>
            </div>
            <Btn kind="ghost" size="sm" icon={I.eye}>Open in configurator</Btn>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 24 }}>
            <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-2)', padding: 20, display: 'grid', placeItems: 'center' }}>
              <PergolaSVG width={320} height={220} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                ['Model',     'Pergola Classic'],
                ['Width',     '4.20 m'],
                ['Depth',     '3.50 m'],
                ['Height',    '2.40 m'],
                ['Area',      '14.70 m²'],
                ['Roof',      'Manual louvre'],
                ['Sides',     '3-sided · drop-blinds'],
                ['Color',     'Anthracite RAL 7016'],
                ['Mounting',  'Free-standing'],
                ['Add-ons',   'LED strip · Heater ×2'],
                ['Install',   'Yes · €420'],
                ['Delivery',  'SI — Ljubljana area'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px dashed var(--c-line)', fontSize: 13 }}>
                  <span style={{ color: 'var(--c-text-3)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--f-mono)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Pricing breakdown */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--c-line)' }}>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Pricing breakdown</div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 12.5 }}>
              {[
                ['Base · 4.20 × 3.50 × €320/m²', '+€4,704'],
                ['Manual louvre roof',           '+€0'],
                ['Drop-blind sides ×3',          '+€420'],
                ['Anthracite finish',            '+€0'],
                ['LED strip',                    '+€140'],
                ['Heater × 2',                   '+€420'],
                ['Install · standard',           '+€420'],
                ['Promo — First-week buyer',     '−€444'],
                ['VAT (22%, included)',          '€870'],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--c-line)', color: 'var(--c-text-2)' }}>
                  <span>{k}</span><span>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 500, color: 'var(--c-ink)', fontSize: 14 }}>
                <span>Total · incl. VAT</span><span>€4,820</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Message + timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <Card pad={20}>
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--c-line)', marginBottom: 16 }}>
              {['Conversation', 'Notes (2)', 'Files (3)'].map((t, i) => (
                <button key={t} className="btn-reset" style={{
                  padding: '10px 12px', fontSize: 13, fontWeight: 500,
                  color: i === 0 ? 'var(--c-ink)' : 'var(--c-text-3)',
                  borderBottom: i === 0 ? '1.5px solid #0a0a0a' : '1.5px solid transparent', marginBottom: -1,
                }}>{t}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Avatar name="Lara Bregar" size={32} />
                <div style={{ flex: 1, background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 'var(--r-3)', padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-text-3)', marginBottom: 6 }}>
                    <span style={{ fontWeight: 500, color: 'var(--c-ink)' }}>Lara Bregar</span>
                    <span style={{ fontFamily: 'var(--f-mono)' }}>via configurator · 2 min ago</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--c-text)' }}>
                    Hi! I'm renovating our backyard and need a pergola for the patio. I'd like the louvre roof and drop blinds because of wind. We're in Ljubljana, free-standing on existing concrete. Hoping to install before June. What lead times are we looking at?
                  </p>
                </div>
              </div>

              {/* Reply box */}
              <div style={{ border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-3)', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', background: 'var(--c-surface)', borderBottom: '1px solid var(--c-line)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--c-text-3)' }}>To: <span style={{ color: 'var(--c-text)' }}>lara.bregar@gmail.com</span></span>
                  <span style={{ color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>Template: Pergola — Initial reply ▾</span>
                </div>
                <div style={{ padding: 14, fontSize: 13.5, color: 'var(--c-text-2)', lineHeight: 1.55, minHeight: 110 }}>
                  Hi Lara,<br/><br/>Thanks for your configuration. For the Pergola Classic at 4.20 × 3.50m in anthracite with the louvre roof and drop blinds, our standard lead time is 5–7 weeks…
                </div>
                <div style={{ padding: '10px 12px', borderTop: '1px solid var(--c-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                  <div style={{ display: 'flex', gap: 4, color: 'var(--c-text-3)' }}>
                    <button className="btn-reset" style={{ width: 24, height: 24, display: 'grid', placeItems: 'center' }}>📎</button>
                    <button className="btn-reset" style={{ width: 24, height: 24, display: 'grid', placeItems: 'center' }}>{I.download}</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn kind="ghost" size="sm">Save draft</Btn>
                    <Btn kind="primary" size="sm" iconRight={I.arrR}>Send reply</Btn>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card pad={20}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 11, top: 14, bottom: 14, width: 1, background: 'var(--c-line)' }} />
              {[
                ['Lead created via configurator', '2 min ago', I.inbox],
                ['Scored Hot — value €4,820, < 30d intent', '2 min ago', I.bolt],
                ['Auto-assigned to Aleš K.', '2 min ago', I.users],
                ['Email autoresponder sent', '2 min ago', I.mail],
                ['Pipedrive deal created — #4188', '1 min ago', I.link],
              ].map(([t, when, ico], i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', position: 'relative' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 22, background: '#fff', border: '1px solid var(--c-line-2)', display: 'grid', placeItems: 'center', color: 'var(--c-text-2)', zIndex: 1 }}>{ico}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5 }}>{t}</div>
                    <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>{when}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* RIGHT — details */}
      <aside style={{ background: 'var(--c-surface)', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card pad={18}>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Contact</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{I.mail}<a style={{ color: 'var(--c-text)' }}>lara.bregar@gmail.com</a></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{I.phone}<span style={{ fontFamily: 'var(--f-mono)' }}>+386 41 218 462</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{I.globe}<span>Ljubljana, SI · 1000</span></div>
          </div>
        </Card>

        <Card pad={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score</span>
            <Donut value={87} size={44} stroke={5} label="87"/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12 }}>
            {[
              ['Quote value > €4K', '+30'],
              ['Reached final step',  '+25'],
              ['Replied within 5min', '+20'],
              ['Branded search source','+12'],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--c-text-2)' }}>
                <span>{k}</span><span style={{ fontFamily: 'var(--f-mono)' }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card pad={18}>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Owner</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="Aleš K." size={28} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Aleš Kovač</div>
              <div style={{ fontSize: 11.5, color: 'var(--c-text-3)' }}>Reassign…</div>
            </div>
          </div>
        </Card>

        <Card pad={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tags</span>
            <button className="btn-reset" style={{ fontSize: 12, color: 'var(--c-text-3)' }}>+ Add</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {['Ljubljana', 'Residential', '< 30d', 'Spring install'].map(t => (
              <span key={t} style={{ padding: '3px 8px', border: '1px solid var(--c-line-2)', borderRadius: 'var(--r-pill)', fontSize: 11, fontFamily: 'var(--f-mono)', color: 'var(--c-text-2)' }}>{t}</span>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  </AppShell>
);

Object.assign(window, { LeadsInbox, LeadsPipeline, LeadDetail, statusBadge, LEADS });
