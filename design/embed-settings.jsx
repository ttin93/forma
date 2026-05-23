/* Embed & API · Customers · Settings */

// ───────── Embed & API
const EmbedPage = () => (
  <AppShell active="embed" crumb={['Embed & API']} actions={
    <>
      <Btn kind="secondary" size="sm" icon={I.eye}>Preview live</Btn>
      <Btn kind="primary" size="sm" icon={I.bolt}>Test webhook</Btn>
    </>
  }>
    <PageHeader
      title="Embed & API"
      desc="Drop one snippet on your site. Forma renders inside an iframe, inherits your site's fonts and colors, and posts submissions to your inbox, CRM and webhooks."
      tabs={[
        { label: 'Embed', active: true },
        { label: 'Webhooks', count: 3 },
        { label: 'API keys', count: 2 },
        { label: 'CRM', count: 1 },
        { label: 'Email', count: 4 },
      ]}
    />
    <PageBody>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <Card pad={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Universal snippet</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Works on Shopify, WordPress, Webflow, Wix, plain HTML.</div>
            </div>
            <Btn kind="secondary" size="sm" icon={I.copy}>Copy</Btn>
          </div>
          <div style={{ background: '#0a0a0a', color: '#e3e3e3', borderRadius: 'var(--r-2)', padding: 16, fontFamily: 'var(--f-mono)', fontSize: 12.5, lineHeight: 1.6, overflow: 'auto' }}>
{`<script async
  src="https://cdn.forma.studio/embed.js"
  data-config="pgl-cl-r4QkLm"
  data-host="sunpergola.si"></script>

<div id="forma-pergola-classic"></div>`}
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['HTML', 'Shopify', 'WordPress', 'Webflow', 'Wix', 'React', 'Vue', 'Next.js'].map((t, i) => (
              <button key={t} className="btn-reset" style={{
                padding: '5px 10px', fontSize: 12, borderRadius: 'var(--r-2)',
                border: '1px solid var(--c-line-2)',
                background: i === 0 ? '#0a0a0a' : '#fff', color: i === 0 ? '#fff' : 'var(--c-text-2)', fontWeight: 500,
              }}>{t}</button>
            ))}
          </div>
        </Card>

        <Card pad={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Domains</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Restrict where this configurator can render.</div>
            </div>
            <Btn kind="secondary" size="sm" icon={I.plus}>Add domain</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              ['sunpergola.si',         'Primary',          true],
              ['www.sunpergola.si',     'Alias',            true],
              ['staging.sunpergola.si', 'Staging',          true],
              ['partners.alpenwerk.at', 'Reseller · co-brand', true],
            ].map(([h, l, ok], i) => (
              <div key={h} style={{ padding: '12px 0', borderTop: i ? '1px solid var(--c-line)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--f-mono)' }}>{h}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--c-muted)' }}>{l}</div>
                </div>
                <Badge kind={ok ? 'live' : 'warn'} size="sm">{ok ? 'Verified' : 'Pending'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card pad={20} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Webhooks</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Real-time HTTP POST to your services on every event.</div>
          </div>
          <Btn kind="secondary" size="sm" icon={I.plus}>New webhook</Btn>
        </div>
        <div style={{ border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 0.8fr 0.6fr 36px', padding: '10px 14px', background: 'var(--c-surface)', fontSize: 10.5, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)' }}>
            <span>Endpoint</span><span>Events</span><span>Last delivery</span><span>Status</span><span/>
          </div>
          {[
            ['https://hooks.zapier.com/hooks/catch/14082/0aB3xF',  '5 events', 'a few seconds ago', 'ok'],
            ['https://crm.alpenwerk.at/api/forma',                 'lead.created', '8 min ago',     'ok'],
            ['https://api.pipedrive.com/v1/.../webhooks',          '3 events', '14 min ago',         'retry'],
          ].map(([ep, ev, ld, s], i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 0.8fr 0.6fr 36px', padding: '12px 14px', borderTop: '1px solid var(--c-line)', fontSize: 12.5, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-text)' }}>{ep}</span>
              <span style={{ color: 'var(--c-text-3)' }}>{ev}</span>
              <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-text-3)' }}>{ld}</span>
              <span>{s === 'ok' ? <Badge kind="live" size="sm">200 OK</Badge> : <Badge kind="warn" size="sm">Retrying</Badge>}</span>
              <button className="btn-reset" style={{ width: 24, height: 24, color: 'var(--c-text-3)' }}>{I.more}</button>
            </div>
          ))}
        </div>
      </Card>

      {/* Integrations grid */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Integrations</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Connect lead routing, CRM, calendar, and accounting.</div>
        </div>
        <Btn kind="ghost" size="sm">Browse all (38) →</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          ['Pipedrive',  'CRM',         'connected'],
          ['HubSpot',    'CRM',         ''],
          ['Salesforce', 'CRM',         ''],
          ['Zapier',     'Workflow',    'connected'],
          ['Make',       'Workflow',    ''],
          ['Slack',      'Notifications','connected'],
          ['Gmail',      'Email',       'connected'],
          ['Outlook',    'Email',       ''],
          ['Mailchimp',  'Marketing',   ''],
          ['Stripe',     'Payments',    'connected'],
          ['QuickBooks', 'Accounting',  ''],
          ['Google Cal', 'Scheduling',  ''],
        ].map(([n, k, st]) => (
          <Card key={n} pad={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--r-2)', background: '#fafafa', border: '1px solid var(--c-line)', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-mono)', fontWeight: 500, fontSize: 11 }}>{n.slice(0,2).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{n}</div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>{k}</div>
              </div>
            </div>
            {st ? <Badge kind="live" size="sm">● Connected</Badge> : <Btn kind="secondary" size="sm" full>Connect</Btn>}
          </Card>
        ))}
      </div>
    </PageBody>
  </AppShell>
);

// ───────── Customers (end customers who configured)
const Customers = () => (
  <AppShell active="cust" crumb={['Customers']} actions={
    <>
      <Btn kind="secondary" size="sm" icon={I.upload}>Import CSV</Btn>
      <Btn kind="primary" size="sm" icon={I.plus}>Add customer</Btn>
    </>
  }>
    <PageHeader
      title="Customers"
      desc="Everyone who has configured something. Forma deduplicates by email and tracks lifetime configurations and revenue."
      tabs={[
        { label: 'All', count: '1,284', active: true },
        { label: 'Buyers', count: 142 },
        { label: 'Returning', count: 38 },
        { label: 'Subscribed', count: 612 },
      ]}
    />
    <PageBody>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <Stat label="Total customers" value="1,284" delta="14.0%" sub="last 30 days" />
        <Stat label="LTV (avg)" value="€5,420" delta="3.4%" sub="incl. add-ons" />
        <Stat label="Repeat buyer rate" value="6.2%" delta="0.8pp" sub="142 of 2,290" />
        <Stat label="Newsletter opt-in" value="48%" delta="2.1pp" sub="GDPR-compliant" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Input prefix={I.search} placeholder="Search customers…" style={{ width: 320 }} />
        <Btn kind="secondary" size="sm" icon={I.filter}>Has bought</Btn>
        <Btn kind="secondary" size="sm" icon={I.filter}>Country</Btn>
        <div style={{ flex: 1 }} />
        <Btn kind="ghost" size="sm" icon={I.sort}>LTV ↓</Btn>
      </div>

      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1.4fr 1.1fr 90px 100px 110px 110px 110px 40px', padding: '11px 16px', borderBottom: '1px solid var(--c-line)', background: 'var(--c-surface)', fontSize: 10.5, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)', gap: 8 }}>
          <input type="checkbox" />
          <span>Customer</span><span>Company / city</span>
          <span style={{ textAlign: 'right' }}>Configs</span>
          <span style={{ textAlign: 'right' }}>Bought</span>
          <span style={{ textAlign: 'right' }}>LTV</span>
          <span>First seen</span>
          <span>Last activity</span>
          <span/>
        </div>
        {[
          ['Boris Šuštar',     'Šuštar Holiday Homes · Bled',  4, 3, 18420, 'Mar 2024',  '2 h ago'],
          ['Marko Hribernik',  'Hribernik Gradnje · Kranj',    3, 2, 12640, 'Jan 2024',  '14 min'],
          ['Tim Vrhovnik',     'private · Celje',              2, 1,  6420, 'Aug 2024',  '6 h ago'],
          ['Nina Korošec',     'NK Apartments · Portorož',     6, 1,  6520, 'Nov 2023',  '8 h ago'],
          ['Saša Tomič',       'private · Novo mesto',         1, 0,  4180, 'May 2025',  '4 h ago'],
          ['Petra Hočevar',    'private · Velenje',            2, 0,  7220, 'Apr 2025',  'yesterday'],
          ['Lara Bregar',      'private · Ljubljana',          1, 0,  4820, 'Today',     '2 min'],
          ['Mihael Žagar',     'private · Domžale',            1, 0,  4640, 'Yesterday', 'yesterday'],
        ].map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1.4fr 1.1fr 90px 100px 110px 110px 110px 40px', padding: '14px 16px', borderTop: i ? '1px solid var(--c-line)' : 'none', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={r[0]} size={28} />
              <div>
                <div style={{ fontWeight: 500 }}>{r[0]}</div>
                <div style={{ fontSize: 11.5, color: 'var(--c-text-3)' }}>{['lara.bregar@gmail.com','boris@sustar.si','marko@hribernik.si','tim.vrhovnik@gmail.com','nina@nkapartments.si','sasa.tomic@gmail.com','petra.h@protonmail.com','mihael.z@siol.net'][i]}</div>
              </div>
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--c-text-2)' }}>{r[1]}</span>
            <span style={{ textAlign: 'right', fontFamily: 'var(--f-mono)' }}>{r[2]}</span>
            <span style={{ textAlign: 'right', fontFamily: 'var(--f-mono)', color: r[3] ? 'var(--c-text)' : 'var(--c-muted)' }}>{r[3]}</span>
            <span style={{ textAlign: 'right', fontFamily: 'var(--f-mono)', fontWeight: 500 }}>€{r[4].toLocaleString()}</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--f-mono)', color: 'var(--c-text-3)' }}>{r[5]}</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--f-mono)', color: 'var(--c-text-3)' }}>{r[6]}</span>
            <button className="btn-reset" style={{ width: 24, height: 24, color: 'var(--c-text-3)' }}>{I.more}</button>
          </div>
        ))}
      </Card>
    </PageBody>
  </AppShell>
);

// ───────── Settings — Billing (one of multiple settings pages, the most content-rich)
const SettingsBilling = () => (
  <AppShell active="billing" crumb={['Settings', 'Billing']}>
    <PageHeader
      title="Settings"
      tabs={[
        { label: 'Workspace' },
        { label: 'Branding' },
        { label: 'Team', count: 3 },
        { label: 'Billing', active: true },
        { label: 'Notifications' },
        { label: 'API & Webhooks' },
        { label: 'Security' },
        { label: 'Data & GDPR' },
      ]}
    />
    <PageBody>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32 }}>
        {/* Side nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            ['Plan & usage', true],
            ['Payment method', false],
            ['Invoices', false],
            ['Billing details', false],
            ['Tax & VAT', false],
            ['Cancel plan', false],
          ].map(([t, a]) => (
            <a key={t} style={{ padding: '7px 10px', fontSize: 13, borderRadius: 'var(--r-2)', color: a ? 'var(--c-ink)' : 'var(--c-text-2)', background: a ? 'var(--c-surface-2)' : 'transparent', fontWeight: a ? 500 : 400 }}>{t}</a>
          ))}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Plan card */}
          <Card pad={24}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current plan</div>
                <h2 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '6px 0 0' }}>Growth</h2>
                <div style={{ fontSize: 13, color: 'var(--c-text-3)', marginTop: 4 }}>€119 / month · billed monthly · next invoice <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-text)' }}>Jun 4, 2026</span></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn kind="secondary" size="sm">Switch to annual −20%</Btn>
                <Btn kind="primary" size="sm" iconRight={I.arrR}>Upgrade to Scale</Btn>
              </div>
            </div>
            <div style={{ height: 1, background: 'var(--c-line)', margin: '20px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
              {[
                ['Leads', 364, 500, 'this month', '136 remaining'],
                ['Configurators', 4, 4, 'used', 'Max reached'],
                ['Team seats', 3, 3, 'used', 'Max reached'],
              ].map(([l, u, m, sub, hint]) => (
                <div key={l}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>{l}</span>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: 13 }}>
                      <span style={{ fontWeight: 500 }}>{u}</span>
                      <span style={{ color: 'var(--c-muted)' }}> / {m}</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--c-surface)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${(u / m) * 100}%`, height: '100%', background: u / m > 0.8 ? '#0a0a0a' : '#525252' }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', marginTop: 6 }}>{sub} · {hint}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Payment method */}
          <Card pad={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Payment method</div>
              <Btn kind="ghost" size="sm">Update</Btn>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)' }}>
              <div style={{ width: 38, height: 26, border: '1px solid var(--c-line-3)', borderRadius: 4, display: 'grid', placeItems: 'center', fontFamily: 'var(--f-mono)', fontWeight: 600, fontSize: 9, color: 'var(--c-text-2)' }}>VISA</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 13 }}>•••• •••• •••• 4218</div>
                <div style={{ fontSize: 11.5, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)' }}>Exp. 11/2027 · Aleš Kovač</div>
              </div>
              <Badge kind="live" size="sm">Default</Badge>
            </div>
          </Card>

          {/* Invoices */}
          <Card pad={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Recent invoices</div>
              <Btn kind="ghost" size="sm">View all</Btn>
            </div>
            <div style={{ border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 130px 100px 120px 40px', padding: '10px 14px', background: 'var(--c-surface)', fontSize: 10.5, fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-muted)' }}>
                <span>Invoice</span><span>Period</span><span>Issued</span><span>Status</span><span style={{ textAlign: 'right' }}>Amount</span><span/>
              </div>
              {[
                ['INV-2026-118', 'May 4 — Jun 4, 2026',  'May 4', 'paid',  119.00],
                ['INV-2026-097', 'Apr 4 — May 4, 2026',  'Apr 4', 'paid',  119.00],
                ['INV-2026-074', 'Mar 4 — Apr 4, 2026',  'Mar 4', 'paid',  119.00],
                ['INV-2026-051', 'Feb 4 — Mar 4, 2026',  'Feb 4', 'paid',  119.00],
                ['INV-2026-028', 'Jan 4 — Feb 4, 2026',  'Jan 4', 'paid',  119.00],
                ['INV-2025-301', 'Dec 4 — Jan 4, 2026',  'Dec 4', 'paid',  149.00],
              ].map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 130px 100px 120px 40px', padding: '12px 14px', borderTop: '1px solid var(--c-line)', fontSize: 13, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--f-mono)' }}>{r[0]}</span>
                  <span style={{ color: 'var(--c-text-2)' }}>{r[1]}</span>
                  <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-text-3)' }}>{r[2]}</span>
                  <Badge kind="live" size="sm">{r[3]}</Badge>
                  <span style={{ textAlign: 'right', fontFamily: 'var(--f-mono)' }}>€{r[4].toFixed(2)}</span>
                  <button className="btn-reset" style={{ width: 24, height: 24, color: 'var(--c-text-3)' }}>{I.download}</button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageBody>
  </AppShell>
);

// ───────── Settings — Team
const SettingsTeam = () => (
  <AppShell active="team" crumb={['Settings', 'Team']}>
    <PageHeader
      title="Settings"
      tabs={[
        { label: 'Workspace' },
        { label: 'Branding' },
        { label: 'Team', count: 3, active: true },
        { label: 'Billing' },
        { label: 'Notifications' },
        { label: 'API & Webhooks' },
        { label: 'Security' },
        { label: 'Data & GDPR' },
      ]}
    />
    <PageBody>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32 }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {['Members', 'Roles & permissions', 'Single sign-on (SSO)', 'Lead routing rules', 'Workspaces', 'Activity log'].map((t, i) => (
            <a key={t} style={{ padding: '7px 10px', fontSize: 13, borderRadius: 'var(--r-2)', color: i === 0 ? 'var(--c-ink)' : 'var(--c-text-2)', background: i === 0 ? 'var(--c-surface-2)' : 'transparent', fontWeight: i === 0 ? 500 : 400 }}>{t}</a>
          ))}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card pad={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Members</div>
                <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>3 of 3 seats used · contact owner to add more</div>
              </div>
              <Btn kind="primary" size="sm" icon={I.plus}>Invite</Btn>
            </div>
            <div style={{ border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)', overflow: 'hidden' }}>
              {[
                { name: 'Aleš Kovač',    email: 'ales@sunpergola.si',     role: 'Owner',  last: 'Active now',     two: true },
                { name: 'Tina Hribar',   email: 'tina@sunpergola.si',     role: 'Admin',  last: '2h ago',          two: true },
                { name: 'Marko Zajc',    email: 'marko@sunpergola.si',    role: 'Editor', last: 'yesterday',       two: false },
                { name: 'Anja Šega',     email: 'anja@sunpergola.si',     role: 'Sales',  last: 'Invited · 2d',    two: false, invited: true },
              ].map((m, i) => (
                <div key={m.email} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 120px 140px 40px', padding: '14px 16px', borderTop: i ? '1px solid var(--c-line)' : 'none', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={m.name} size={32} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name} {m.invited && <span style={{ fontSize: 10.5, fontFamily: 'var(--f-mono)', color: 'var(--c-muted)', marginLeft: 6 }}>PENDING</span>}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--c-text-3)' }}>{m.email}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>
                    {m.two ? <Badge kind="live" size="sm">2FA on</Badge> : <Badge kind="off" size="sm">2FA off</Badge>}
                  </div>
                  <span style={{ fontSize: 12.5, fontFamily: 'var(--f-mono)', color: 'var(--c-text-2)' }}>{m.role}</span>
                  <span style={{ fontSize: 12, color: 'var(--c-text-3)', fontFamily: 'var(--f-mono)' }}>{m.last}</span>
                  <button className="btn-reset" style={{ width: 24, height: 24, color: 'var(--c-text-3)' }}>{I.more}</button>
                </div>
              ))}
            </div>
          </Card>

          <Card pad={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Lead routing</div>
                <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Who gets which leads, automatically.</div>
              </div>
              <Btn kind="secondary" size="sm" icon={I.plus}>Add rule</Btn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Configurator = Pergola Classic', '→ Aleš · round-robin'],
                ['Value ≥ €8,000',                 '→ Tina (priority)'],
                ['City matches Bled / Bohinj',     '→ Marko'],
                ['Source contains "alpenwerk"',    '→ Reseller pool'],
                ['Otherwise',                       '→ Round-robin all'],
              ].map(([a, b], i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: 10, background: 'var(--c-surface)', border: '1px solid var(--c-line)', borderRadius: 'var(--r-2)', fontFamily: 'var(--f-mono)', fontSize: 12 }}>
                  <span style={{ color: 'var(--c-text-3)', minWidth: 24 }}>{String(i+1).padStart(2,'0')}</span>
                  <span style={{ flex: 1, color: 'var(--c-text)' }}>{a}</span>
                  <span style={{ color: 'var(--c-text-2)' }}>{b}</span>
                  <button className="btn-reset" style={{ color: 'var(--c-text-3)' }}>{I.more}</button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageBody>
  </AppShell>
);

Object.assign(window, { EmbedPage, Customers, SettingsBilling, SettingsTeam });
