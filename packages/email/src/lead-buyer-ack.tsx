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

interface LeadBuyerAckProps {
  buyerName: string;
  leadRef: string;
  configuratorName: string;
  totalCents: number;
  currency: string;
  breakdown: BreakdownItem[];
  workspaceName: string;
  logoUrl?: string;
  primaryColor?: string;
  replyEmail?: string;
}

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function LeadBuyerAck({
  buyerName,
  leadRef,
  configuratorName,
  totalCents,
  currency,
  breakdown,
  workspaceName,
  logoUrl,
  primaryColor = '#0a0a0a',
  replyEmail,
}: LeadBuyerAckProps) {
  const previewText = `Your ${configuratorName} enquiry (${leadRef}) — we'll be in touch shortly.`;

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
          {/* Header */}
          <Section style={styles.header}>
            {logoUrl ? (
              <img src={logoUrl} alt={workspaceName} width={120} style={{ marginBottom: 8 }} />
            ) : (
              <Text style={{ ...styles.brandName, color: primaryColor }}>{workspaceName}</Text>
            )}
          </Section>

          {/* Main */}
          <Section style={styles.main}>
            <Heading style={styles.h1}>Thank you, {buyerName}!</Heading>
            <Text style={styles.body_text}>
              We've received your {configuratorName} enquiry and will prepare a personalised quote for you shortly.
            </Text>
            <Text style={{ ...styles.ref_badge }}>
              Your reference: <strong>{leadRef}</strong>
            </Text>

            <Hr style={styles.hr} />

            {/* Price breakdown */}
            <Heading as="h2" style={styles.h2}>Price summary</Heading>
            {breakdown
              .filter(b => b.kind !== 'vat')
              .map((item, i) => (
                <Row key={i} style={styles.breakdown_row}>
                  <Column style={styles.breakdown_label}>{item.label}</Column>
                  <Column style={styles.breakdown_amount}>
                    {item.kind === 'discount' ? '−' : '+'}{formatAmount(Math.abs(item.amount), currency)}
                  </Column>
                </Row>
              ))}

            {breakdown.some(b => b.kind === 'vat') && (
              <>
                <Hr style={{ ...styles.hr, margin: '8px 0' }} />
                {breakdown.filter(b => b.kind === 'vat').map((item, i) => (
                  <Row key={i} style={styles.breakdown_row}>
                    <Column style={styles.breakdown_label}>{item.label}</Column>
                    <Column style={styles.breakdown_amount}>{formatAmount(item.amount, currency)}</Column>
                  </Row>
                ))}
              </>
            )}

            <Hr style={styles.hr} />
            <Row style={{ marginTop: 4 }}>
              <Column style={{ ...styles.breakdown_label, fontWeight: '700', fontSize: 16 }}>Total</Column>
              <Column style={{ ...styles.breakdown_amount, fontWeight: '700', fontSize: 16, color: primaryColor }}>
                {formatAmount(totalCents, currency)}
              </Column>
            </Row>

            <Hr style={styles.hr} />

            <Text style={styles.body_text}>
              Our team will review your configuration and get back to you within 1 business day.
            </Text>

            {replyEmail && (
              <Button href={`mailto:${replyEmail}?subject=RE: ${configuratorName} — ${leadRef}`} style={{ ...styles.button, backgroundColor: primaryColor }}>
                Reply to this enquiry
              </Button>
            )}
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footer_text}>
              {workspaceName} · This is an automated confirmation from your enquiry submission.
            </Text>
            <Text style={styles.footer_text}>
              If you have any questions, reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

LeadBuyerAck.PreviewProps = {
  buyerName: 'Lara Bregar',
  leadRef: 'FORM-2026-L42',
  configuratorName: 'Pergola Classic',
  totalCents: 590968,
  currency: 'EUR',
  breakdown: [
    { label: 'Base · €320/m²', amount: 470400, kind: 'base' },
    { label: 'LED strip lighting', amount: 14000, kind: 'add' },
    { label: 'VAT (22%)', amount: 106568, kind: 'vat' },
  ],
  workspaceName: 'Sun Pergola',
  primaryColor: '#0a0a0a',
} satisfies LeadBuyerAckProps;

export default LeadBuyerAck;

// ── Styles ───────────────────────────────────────────────────
const styles = {
  body: { backgroundColor: '#f5f5f5', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: '40px 0' },
  container: { backgroundColor: '#ffffff', borderRadius: 8, maxWidth: 560, margin: '0 auto', overflow: 'hidden' },
  header: { padding: '28px 40px 20px', borderBottom: '1px solid #ececec' },
  brandName: { fontSize: 18, fontWeight: '700', margin: 0, letterSpacing: '-0.02em' },
  main: { padding: '32px 40px' },
  h1: { fontSize: 24, fontWeight: '700', margin: '0 0 12px', letterSpacing: '-0.02em', color: '#0a0a0a' },
  h2: { fontSize: 14, fontWeight: '600', margin: '24px 0 12px', color: '#525252', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  body_text: { fontSize: 14, lineHeight: '1.6', color: '#525252', margin: '0 0 16px' },
  ref_badge: { display: 'inline-block', fontSize: 13, color: '#0a0a0a', backgroundColor: '#f5f5f5', padding: '6px 12px', borderRadius: 4, margin: '4px 0 16px', fontFamily: 'monospace' },
  hr: { borderColor: '#ececec', margin: '20px 0' },
  breakdown_row: { marginBottom: 6 },
  breakdown_label: { fontSize: 13, color: '#525252', flex: 1 },
  breakdown_amount: { fontSize: 13, color: '#0a0a0a', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' },
  button: { display: 'inline-block', padding: '10px 20px', borderRadius: 6, color: '#ffffff', fontSize: 14, fontWeight: '500', textDecoration: 'none', marginTop: 8 },
  footer: { padding: '20px 40px', borderTop: '1px solid #ececec', backgroundColor: '#fafafa' },
  footer_text: { fontSize: 12, color: '#a3a3a3', margin: '0 0 4px', lineHeight: '1.5' },
};
