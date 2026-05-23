import {
  Html, Head, Preview, Body, Container, Section, Text, Heading,
  Hr, Button, Row, Column, Font,
} from '@react-email/components';
import * as React from 'react';

interface BreakdownItem {
  label: string;
  amount: number;
  kind: string;
}

interface ConfigField {
  label: string;
  value: string;
}

interface LeadOwnerNotifyProps {
  assigneeName: string;
  leadRef: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  configuratorName: string;
  totalCents: number;
  currency: string;
  score: number;
  hot: boolean;
  configFields: ConfigField[];
  breakdown: BreakdownItem[];
  leadUrl: string;
  workspaceName: string;
}

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function LeadOwnerNotify({
  assigneeName,
  leadRef,
  buyerName,
  buyerEmail,
  buyerPhone,
  configuratorName,
  totalCents,
  currency,
  score,
  hot,
  configFields,
  breakdown,
  leadUrl,
  workspaceName,
}: LeadOwnerNotifyProps) {
  const previewText = `${hot ? '🔥 HOT ' : ''}New lead: ${buyerName} — ${configuratorName} — ${formatAmount(totalCents, currency)}`;

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{ url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', format: 'woff2' }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Banner */}
          <Section style={{ ...styles.banner, backgroundColor: hot ? '#0a0a0a' : '#1a1a1a' }}>
            <Row>
              <Column>
                <Text style={styles.banner_label}>New lead · {configuratorName}</Text>
                <Heading style={styles.banner_amount}>{formatAmount(totalCents, currency)}</Heading>
              </Column>
              <Column style={{ textAlign: 'right' as const }}>
                {hot && <Text style={styles.hot_badge}>HOT</Text>}
                <Text style={styles.score_badge}>Score: {score}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={styles.main}>
            <Text style={styles.greeting}>Hi {assigneeName},</Text>
            <Text style={styles.body_text}>
              You have a new lead <strong>{leadRef}</strong> from <strong>{buyerName}</strong>.
            </Text>

            {/* Buyer info */}
            <Heading as="h2" style={styles.section_label}>Contact</Heading>
            <Row style={styles.info_row}>
              <Column style={styles.info_key}>Name</Column>
              <Column style={styles.info_val}>{buyerName}</Column>
            </Row>
            <Row style={styles.info_row}>
              <Column style={styles.info_key}>Email</Column>
              <Column style={styles.info_val}>
                <a href={`mailto:${buyerEmail}`} style={{ color: '#0a0a0a' }}>{buyerEmail}</a>
              </Column>
            </Row>
            {buyerPhone && (
              <Row style={styles.info_row}>
                <Column style={styles.info_key}>Phone</Column>
                <Column style={styles.info_val}>{buyerPhone}</Column>
              </Row>
            )}

            <Hr style={styles.hr} />

            {/* Config summary */}
            <Heading as="h2" style={styles.section_label}>Configuration</Heading>
            {configFields.slice(0, 8).map((f, i) => (
              <Row key={i} style={styles.info_row}>
                <Column style={styles.info_key}>{f.label}</Column>
                <Column style={styles.info_val}>{f.value}</Column>
              </Row>
            ))}

            <Hr style={styles.hr} />

            {/* Price breakdown */}
            <Heading as="h2" style={styles.section_label}>Price breakdown</Heading>
            {breakdown.map((item, i) => (
              <Row key={i} style={styles.breakdown_row}>
                <Column style={styles.breakdown_label}>{item.label}</Column>
                <Column style={styles.breakdown_amount}>
                  {item.kind === 'discount' ? '−' : ''}
                  {formatAmount(Math.abs(item.amount), currency)}
                </Column>
              </Row>
            ))}
            <Hr style={{ ...styles.hr, margin: '8px 0' }} />
            <Row>
              <Column style={{ ...styles.breakdown_label, fontWeight: '700' }}>Total</Column>
              <Column style={{ ...styles.breakdown_amount, fontWeight: '700' }}>
                {formatAmount(totalCents, currency)}
              </Column>
            </Row>

            <Hr style={styles.hr} />

            <Button href={leadUrl} style={styles.cta_button}>
              View lead in Forma →
            </Button>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footer_text}>
              {workspaceName} · Sent by Forma lead notifications.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

LeadOwnerNotify.PreviewProps = {
  assigneeName: 'Marko Zupančič',
  leadRef: 'FORM-2026-L42',
  buyerName: 'Lara Bregar',
  buyerEmail: 'lara@example.com',
  buyerPhone: '+386 41 123 456',
  configuratorName: 'Pergola Classic',
  totalCents: 590968,
  currency: 'EUR',
  score: 55,
  hot: false,
  configFields: [
    { label: 'Width', value: '4.2 m' },
    { label: 'Depth', value: '3.5 m' },
    { label: 'Colour', value: 'Anthracite' },
    { label: 'LED lighting', value: 'Yes' },
  ],
  breakdown: [
    { label: 'Base · €320/m²', amount: 470400, kind: 'base' },
    { label: 'LED strip lighting', amount: 14000, kind: 'add' },
    { label: 'VAT (22%)', amount: 106568, kind: 'vat' },
  ],
  leadUrl: 'https://app.forma.studio/leads/lead_01HXYZ',
  workspaceName: 'Sun Pergola',
} satisfies LeadOwnerNotifyProps;

export default LeadOwnerNotify;

// ── Styles ────────────────────────────────────────────────────
const styles = {
  body: { backgroundColor: '#f5f5f5', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: '40px 0' },
  container: { backgroundColor: '#ffffff', borderRadius: 8, maxWidth: 560, margin: '0 auto', overflow: 'hidden' },
  banner: { padding: '24px 32px' },
  banner_label: { fontSize: 11, color: '#aaaaaa', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 4px' },
  banner_amount: { fontSize: 32, fontWeight: '700', color: '#ffffff', margin: 0, letterSpacing: '-0.03em' },
  hot_badge: { display: 'inline-block', backgroundColor: '#ef4444', color: '#fff', fontSize: 10, fontWeight: '700', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.08em', margin: '0 0 4px' },
  score_badge: { fontSize: 11, color: '#aaaaaa', fontFamily: 'monospace', margin: 0 },
  main: { padding: '28px 32px' },
  greeting: { fontSize: 15, color: '#0a0a0a', margin: '0 0 8px', fontWeight: '500' },
  body_text: { fontSize: 14, lineHeight: '1.6', color: '#525252', margin: '0 0 20px' },
  section_label: { fontSize: 11, fontWeight: '600', color: '#a3a3a3', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 10px' },
  info_row: { marginBottom: 4 },
  info_key: { fontSize: 13, color: '#a3a3a3', width: 80 },
  info_val: { fontSize: 13, color: '#0a0a0a' },
  hr: { borderColor: '#ececec', margin: '16px 0' },
  breakdown_row: { marginBottom: 4 },
  breakdown_label: { fontSize: 13, color: '#525252' },
  breakdown_amount: { fontSize: 13, color: '#0a0a0a', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' },
  cta_button: { display: 'inline-block', backgroundColor: '#0a0a0a', color: '#ffffff', padding: '11px 22px', borderRadius: 6, fontSize: 14, fontWeight: '500', textDecoration: 'none', marginTop: 4 },
  footer: { padding: '16px 32px', borderTop: '1px solid #ececec', backgroundColor: '#fafafa' },
  footer_text: { fontSize: 12, color: '#a3a3a3', margin: 0 },
};
