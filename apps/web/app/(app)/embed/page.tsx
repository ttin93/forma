import { PageHeader } from '@/components/AppShell';
import { Card, Badge, Btn } from '@/components/ui';

const integrations = [
  { name: 'Pipedrive', status: 'connected', desc: 'CRM sync for every lead' },
  { name: 'Slack', status: 'connected', desc: 'Lead notifications in #sales' },
  { name: 'HubSpot', status: 'available', desc: 'Sync leads as contacts + deals' },
  { name: 'Salesforce', status: 'available', desc: 'Enterprise CRM connector' },
  { name: 'Zapier', status: 'available', desc: '5,000+ app automations' },
  { name: 'Mailchimp', status: 'available', desc: 'Add buyers to email lists' },
  { name: 'SendGrid', status: 'available', desc: 'Custom transactional email' },
  { name: 'Make', status: 'available', desc: 'Visual workflow automation' },
  { name: 'Gmail', status: 'available', desc: 'Send quotes from your inbox' },
  { name: 'Google Sheets', status: 'available', desc: 'Live export of all leads' },
  { name: 'ActiveCampaign', status: 'available', desc: 'Marketing automation' },
  { name: 'Notion', status: 'available', desc: 'Log leads to a Notion DB' },
];

export default function EmbedPage() {
  const snippet = `<script
  src="https://cdn.forma.studio/embed.js"
  data-config="pergola-classic"
  data-workspace="sunpergola"
  async>
</script>`;

  return (
    <div data-screen-label="Embed & API">
      <PageHeader title="Embed & API" desc="Manage how your configurators appear on external sites." />

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Embed snippet */}
        <Card pad={24}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Embed snippet</div>
          <p style={{ fontSize: 13, color: 'var(--color-text-3)', margin: '0 0 16px' }}>Paste this inside the <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--color-surface)', padding: '1px 5px', borderRadius: 3 }}>&lt;body&gt;</code> of your website page where the configurator should appear.</p>
          <div style={{ background: '#0a0a0a', borderRadius: 'var(--radius-2)', padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: '#e3e3e3', lineHeight: 1.65, overflow: 'auto', marginBottom: 12 }}>
            <pre style={{ margin: 0 }}>{snippet}</pre>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm">Copy snippet</Btn>
            <Btn variant="ghost" size="sm">View docs →</Btn>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Domain allowlist */}
          <Card pad={20}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Allowed domains</div>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: '0 0 16px' }}>Restrict which domains can load your embed. Leave empty to allow all (not recommended).</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {['sunpergola.si', 'www.sunpergola.si', 'demo.sunpergola.si'].map(domain => (
                <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)' }}>
                  <Badge kind="live" size="sm">verified</Badge>
                  <span style={{ flex: 1, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{domain}</span>
                  <button style={{ all: 'unset', fontSize: 13, color: 'var(--color-muted)', cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>
            <Btn variant="secondary" size="sm">+ Add domain</Btn>
          </Card>

          {/* API keys */}
          <Card pad={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>API keys</div>
              <Btn variant="secondary" size="sm">+ New key</Btn>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: '0 0 16px' }}>Use API keys to access leads, configurators, and analytics from your own systems.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { name: 'Production', key: 'fk_live_a1b2c3...', used: '2h ago', scopes: 'leads:read' },
                { name: 'CRM sync', key: 'fk_live_d4e5f6...', used: '1d ago', scopes: 'leads:read,write' },
              ].map(k => (
                <div key={k.name} style={{ padding: '10px 12px', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{k.name}</span>
                    <Btn variant="ghost" size="sm">Revoke</Btn>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-3)' }}>{k.key}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-muted)', marginTop: 4 }}>Last used {k.used} · {k.scopes}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Webhooks */}
        <Card pad={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Webhooks</div>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: '4px 0 0' }}>Push lead events to your systems in real time with signed HMAC payloads.</p>
            </div>
            <Btn variant="secondary" size="sm">+ Add webhook</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { url: 'https://api.sunpergola.si/forma-webhook', events: ['lead.created', 'lead.updated'], status: 'active', lastDelivery: 'success · 2h ago' },
              { url: 'https://hooks.pipedrive.com/services/abc123', events: ['lead.created'], status: 'active', lastDelivery: 'success · 2h ago' },
            ].map((wh, i) => (
              <div key={i} style={{ padding: '12px 16px', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <Badge kind="live" size="sm">active</Badge>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wh.url}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 3 }}>{wh.events.join(', ')} · {wh.lastDelivery}</div>
                </div>
                <Btn variant="ghost" size="sm">Edit</Btn>
              </div>
            ))}
          </div>
        </Card>

        {/* Integrations grid */}
        <Card pad={20}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Integrations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {integrations.map(int => (
              <div key={int.name} style={{ padding: '14px 16px', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 28, height: 28, background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius-1)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600 }}>
                    {int.name.slice(0, 2).toUpperCase()}
                  </div>
                  {int.status === 'connected' && <Badge kind="live" size="sm">on</Badge>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{int.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-text-3)', marginTop: 2 }}>{int.desc}</div>
                </div>
                <Btn variant={int.status === 'connected' ? 'ghost' : 'secondary'} size="sm">
                  {int.status === 'connected' ? 'Configure' : 'Connect'}
                </Btn>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
