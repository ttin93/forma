/* Dashboard & Analytics screens */

const PageBody = ({ children }) => (
  <div style={{ padding: 32 }}>{children}</div>
);

// ───────── Dashboard
const Dashboard = () => (
  <AppShell active="dash" crumb={['Dashboard', 'Overview']} actions={
    <>
      <Btn kind="secondary" size="sm" icon={I.download}>Export</Btn>
      <Btn kind="primary" size="sm" icon={I.plus}>New configurator</Btn>
    </>
  }>
    <PageHeader
      eyebrow="Workspace · SunPergola"
      title={<span>Good afternoon, Aleš. <span style={{ color: 'var(--c-muted)' }}>Here's where you stand this week.</span></span>}
      actions={
        <div style={{ display: 'flex', gap: 6, border: '1px solid var(--c-line-2)', padding: 2, borderRadius: 'var(--r-2)' }}>
          {['7d', '30d', '90d', 'YTD'].map((t, i) => (
            <button key={t} className="btn-reset" style={{
              padding: '4px 10px', fontSize: 12, borderRadius: 4,
              background: i === 1 ? '#0a0a0a' : 'transparent',
              color: i === 1 ? '#fff' : 'var(--c-text-2)', fontWeight: 500,
            }}>{t}</button>
          ))}
        </div>
      }
    />
    <PageBody>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <Stat label="New leads" value="284" delta="12.4%" sub="vs. 252 last period" sparkData={[8,11,9,14,12,16,18,15,22,19,24,28,26,32]} />
        <Stat label="Configurations started" value="1,892" delta="8.1%" sub="68% conv. to submit" sparkData={[80,82,79,90,95,103,98,110,118,124,131,140,148,155]} />
        <Stat label="Avg. quote value" value="€4,820" delta="3.2%" sub="median €4,180" sparkData={[42,45,43,48,47,49,52,51,54,56,55,58,60,62]} />
        <Stat label="Pipeline created" value="€1.36M" delta="22.0%" sub="284 configured quotes" sparkData={[60,72,68,84,90,96,108,124,132,140,158,170,182,196]} />
      </div>

      {/* Funnel + activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: 16, marginBottom: 24 }}>
        <Card pad={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Configurator funnel</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>All configurators · last 30 days</div>
            </div>
            <Btn kind="ghost" size="sm" iconRight={I.chevD}>All configurators</Btn>
          </div>
          {/* Funnel bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['Visited embed',     '12,418', 100, ''],
              ['Started config',     '4,206',  33.9, '−66%'],
              ['Reached pricing',    '2,012',  16.2, '−52%'],
              ['Submitted lead',     '1,284',  10.3, '−36%'],
              ['Replied to email',   '   612',   4.9, '−52%'],
              ['Converted to deal',  '   284',   2.3, '−54%'],
            ].map(([label, value, pct, drop]) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--c-text-2)' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--f-mono)' }}>
                    <span style={{ color: 'var(--c-text)' }}>{value}</span>
                    <span style={{ color: 'var(--c-muted)', marginLeft: 12 }}>{pct.toFixed(1)}%</span>
                    {drop && <span style={{ color: 'var(--c-muted)', marginLeft: 12 }}>{drop}</span>}
                  </span>
                </div>
                <div style={{ height: 22, background: 'var(--c-surface)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#0a0a0a' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card pad={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Recent activity</div>
            <a style={{ fontSize: 12, color: 'var(--c-text-2)', borderBottom: '1px solid currentColor' }}>View all</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { who: 'Lara Bregar', what: 'submitted', detail: 'Pergola Classic · 4.2×3.5m · Anthracite', t: '2 min ago', icon: I.inbox },
              { who: 'System', what: 'paid', detail: 'Invoice INV-2026-118 · €119.00', t: '14 min ago', icon: I.credit },
              { who: 'Marko Z.', what: 'edited', detail: 'Pricing rule — “Reinforced post when W>5m”', t: '38 min ago', icon: I.edit },
              { who: 'Jure Petek', what: 'submitted', detail: 'Bioclimatic L · 5.8×4.0m · with sensors', t: '1 h ago', icon: I.inbox },
              { who: 'Webhook', what: 'failed', detail: 'CRM sync — Pipedrive · 408 timeout', t: '2 h ago', icon: I.bolt },
              { who: 'Tina H.', what: 'published', detail: 'Carport configurator → v3.1 live', t: '4 h ago', icon: I.layers },
              { who: 'Anja Š.', what: 'invited', detail: 'milos@sunpergola.si as Editor', t: '5 h ago', icon: I.users },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderTop: i ? '1px solid var(--c-line)' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: 'var(--r-2)', background: 'var(--c-surface)', display: 'grid', placeItems: 'center', color: 'var(--c-text-2)', flexShrink: 0 }}>{a.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5 }}>
                    <span style={{ fontWeight: 500 }}>{a.who}</span>
                    <span style={{ color: 'var(--c-text-3)' }}> {a.what} </span>
                    <span>{a.detail}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>{a.t}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Configurators leaderboard + chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <Card pad={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Top configurators</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>By submitted leads · last 30d</div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: 'var(--c-muted)', textAlign: 'left', fontFamily: 'var(--f-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <th style={{ fontWeight: 400, padding: '0 0 10px' }}>Configurator</th>
                <th style={{ fontWeight: 400, padding: '0 0 10px', textAlign: 'right' }}>Views</th>
                <th style={{ fontWeight: 400, padding: '0 0 10px', textAlign: 'right' }}>Leads</th>
                <th style={{ fontWeight: 400, padding: '0 0 10px', textAlign: 'right' }}>Conv.</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Pergola Classic',   '4,218',  '128',  '3.0%'],
                ['Pergola Bioclimatic','3,884',  '92',   '2.4%'],
                ['Carport Lite',      '2,012',  '38',   '1.9%'],
                ['Custom Garage',     '1,442',  '17',   '1.2%'],
                ['Sliding Doors v2',    '862',   '9',   '1.0%'],
              ].map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--c-line)' }}>
                  <td style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 18, fontSize: 10.5, color: 'var(--c-muted)', fontFamily: 'var(--f-mono)' }}>0{i+1}</span>
                    <span>{r[0]}</span>
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--f-mono)', color: 'var(--c-text-2)' }}>{r[1]}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--f-mono)' }}>{r[2]}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--f-mono)', color: i === 0 ? 'var(--c-text)' : 'var(--c-text-3)' }}>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card pad={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Leads over time</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Submitted vs. converted · 30 days</div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--c-text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 2, background: '#0a0a0a' }} /> Submitted</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, borderTop: '1.5px dashed #737373' }} /> Converted</span>
            </div>
          </div>
          <LineChart
            height={220}
            labels={['1','5','10','15','20','25','30']}
            series={[
              { data: [4,5,8,7,9,12,10,11,14,16,18,15,17,22,24,20,26,28,30,28,32,34,30,36,38,33,40,42,45,48], color: '#0a0a0a' },
              { data: [1,1,2,2,3,4,3,4,5,5,7,6,7,9,9,8,10,11,12,11,13,14,12,15,16,14,17,18,19,21], color: '#737373', dashed: true },
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 18, fontSize: 12 }}>
            {[['This month','€1.36M'],['Forecast','€1.92M'],['Last month','€1.11M']].map(([l,v]) => (
              <div key={l} style={{ borderLeft: '2px solid var(--c-line)', paddingLeft: 10 }}>
                <div style={{ color: 'var(--c-text-3)' }}>{l}</div>
                <div style={{ fontFamily: 'var(--f-mono)', fontWeight: 500, fontSize: 16 }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card pad={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Set up tasks</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>4 of 6 complete · 70% setup</div>
          </div>
          <Donut value={70} size={48} stroke={6} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { t: 'Connect a domain', d: 'Embed configurators on custom.', done: true },
            { t: 'Import price sheet', d: 'CSV import or paste from Sheets.', done: true },
            { t: 'Invite teammates', d: '2 of 3 seats used.', done: true },
            { t: 'Connect CRM', d: 'Pipedrive, HubSpot, Salesforce.', done: true },
            { t: 'Set up branded emails', d: 'SPF/DKIM verification.', done: false, active: true },
            { t: 'Publish first configurator', d: 'Live with one snippet.', done: false },
          ].map(t => (
            <div key={t.t} style={{ padding: 14, border: t.active ? '1.5px solid #0a0a0a' : '1px solid var(--c-line)', borderRadius: 'var(--r-2)', background: t.done ? 'var(--c-surface)' : '#fff', opacity: t.done ? 0.7 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ width: 16, height: 16, borderRadius: 16, border: t.done ? 'none' : '1px solid var(--c-line-3)', background: t.done ? '#0a0a0a' : 'transparent', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10 }}>{t.done && '✓'}</span>
                <span style={{ fontSize: 13, fontWeight: 500, textDecoration: t.done ? 'line-through' : 'none' }}>{t.t}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginLeft: 26 }}>{t.d}</div>
            </div>
          ))}
        </div>
      </Card>
    </PageBody>
  </AppShell>
);

// ───────── Analytics
const Analytics = () => (
  <AppShell active="analytics" crumb={['Analytics']} actions={
    <>
      <Btn kind="secondary" size="sm" icon={I.filter}>Filters · 2</Btn>
      <Btn kind="secondary" size="sm" icon={I.download}>Export CSV</Btn>
    </>
  }>
    <PageHeader
      title="Analytics"
      desc="Where buyers land, where they fall off, and which configurations actually sell. Updated every 60 seconds."
      tabs={[
        { label: 'Overview', active: true },
        { label: 'Funnel', count: 6 },
        { label: 'Configurations' },
        { label: 'Drop-offs' },
        { label: 'Sources' },
        { label: 'A/B tests', count: 2 },
      ]}
    />
    <PageBody>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <Stat label="Sessions" value="12.4K" delta="9.8%" sparkData={[40,46,44,50,55,53,60,64,68,72,70,76,82,88]} />
        <Stat label="Submission rate" value="10.3%" delta="1.2pp" sparkData={[7,7.5,8,7.8,8.2,8.6,9,9.3,9.5,9.8,10,10.1,10.2,10.3]} />
        <Stat label="Avg. session time" value="4m 38s" delta="22s" sparkData={[260,265,270,272,268,275,280,278,275,272,270,275,278,278]} />
        <Stat label="Mobile share" value="64%" deltaKind="neg" delta="3pp" sparkData={[55,57,58,58,60,61,61,62,63,63,64,64,64,64]} />
      </div>

      {/* Two big charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16, marginBottom: 24 }}>
        <Card pad={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Sessions & submissions</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Hourly · last 7 days</div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--c-text-2)' }}><span style={{ width: 12, height: 2, background: '#0a0a0a' }} />Sessions</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--c-text-2)' }}><span style={{ width: 12, height: 2, background: '#a3a3a3' }} />Submissions ×10</span>
            </div>
          </div>
          <LineChart
            height={260}
            labels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
            series={[
              { data: [12,15,22,28,34,40,42,48,54,62,68,72,78,82,86,80,72,64,58,52,46,40,36,30, 38,42,55,68,78,90], color: '#0a0a0a' },
              { data: [1,2,3,4,5,5,6,7,8,10,12,12,13,15,15,14,13,11,10,8,7,6,5,4,5,6,8,11,14,17], color: '#a3a3a3' },
            ]}
          />
        </Card>

        <Card pad={20}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Geography</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['🇸🇮 Slovenia',     '42%', 5304],
              ['🇮🇹 Italy',         '18%', 2243],
              ['🇦🇹 Austria',       '14%', 1742],
              ['🇩🇪 Germany',       '11%', 1366],
              ['🇭🇷 Croatia',        '8%',  988],
              ['🇭🇺 Hungary',        '5%',  618],
              ['🌐 Other',           '2%',  248],
            ].map(([flag, pct, n]) => (
              <div key={flag}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span>{flag}</span>
                  <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-text-3)' }}>{n.toLocaleString()} · {pct}</span>
                </div>
                <div style={{ height: 4, background: 'var(--c-surface)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: pct, height: '100%', background: '#0a0a0a' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Configuration heatmap & top configs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
        <Card pad={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Configurations heatmap</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-3)' }}>Pergola Classic · width × depth</div>
            </div>
          </div>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', gap: 2, fontSize: 10, fontFamily: 'var(--f-mono)', color: 'var(--c-muted)' }}>
              <div />
              {['3.0','3.5','4.0','4.5','5.0','5.5','6.0'].map(c => <div key={c} style={{ textAlign: 'center' }}>{c}</div>)}
              {[
                ['2.5', [3,4,6,4,3,1,0]],
                ['3.0', [4,9,18,14,8,3,1]],
                ['3.5', [3,12,28,32,18,7,2]],
                ['4.0', [2,7,22,38,22,12,5]],
                ['4.5', [1,3,9,14,11,5,2]],
                ['5.0', [0,1,3,5,4,2,1]],
              ].map(([row, vs]) => (
                <React.Fragment key={row}>
                  <div style={{ paddingTop: 2 }}>{row}</div>
                  {vs.map((v, i) => (
                    <div key={i} style={{ aspectRatio: '1', background: `rgba(10,10,10,${Math.min(0.95, v / 40)})`, color: v > 16 ? '#fff' : 'var(--c-text-2)', display: 'grid', placeItems: 'center', fontSize: 10, borderRadius: 3 }}>
                      {v || ''}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--c-text-3)' }}>
              Most popular: <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--c-ink)' }}>4.0 × 4.0m</span> in Anthracite. Bioclimatic roof on 62% of large pergolas (W≥5m).
            </div>
          </div>
        </Card>

        <Card pad={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Top configurations submitted</div>
            <Btn kind="ghost" size="sm" iconRight={I.chevD}>This month</Btn>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: 'var(--c-muted)', textAlign: 'left', fontFamily: 'var(--f-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <th style={{ fontWeight: 400, padding: '0 0 10px' }}>Configuration</th>
                <th style={{ fontWeight: 400, padding: '0 0 10px', textAlign: 'right' }}>Times</th>
                <th style={{ fontWeight: 400, padding: '0 0 10px', textAlign: 'right' }}>Avg. value</th>
                <th style={{ fontWeight: 400, padding: '0 0 10px', textAlign: 'right' }}>Submit rate</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Bioclimatic L · 4×4 · Anthracite + LED',           '38', '€6,420', '14.2%'],
                ['Classic · 4×3.5 · Anthracite',                     '32', '€4,180', '12.8%'],
                ['Classic · 3.5×3 · White',                          '28', '€3,640', '11.9%'],
                ['Bioclimatic XL · 5×4 · with side blinds',          '24', '€8,920', '9.4%'],
                ['Classic · 4.5×4 · Walnut wood-look',               '22', '€5,180', '10.2%'],
                ['Carport Lite · 6×3 · Steel grey',                  '18', '€3,260', '6.8%'],
                ['Classic · 3×3 · Anthracite · standalone',          '17', '€2,990', '13.4%'],
                ['Bioclimatic · 4×4 · with rain sensor + heaters',   '14', '€7,640', '8.1%'],
              ].map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--c-line)' }}>
                  <td style={{ padding: '10px 0' }}>{r[0]}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--f-mono)' }}>{r[1]}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--f-mono)' }}>{r[2]}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--f-mono)', color: 'var(--c-text-3)' }}>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </PageBody>
  </AppShell>
);

Object.assign(window, { Dashboard, Analytics, PageBody });
