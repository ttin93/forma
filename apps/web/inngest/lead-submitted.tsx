import * as React from 'react';
import { inngest } from '../lib/inngest';
import { db } from '../lib/db';
import {
  leads, configuratorVersions, workspaces,
  users, memberships, webhooks, webhookDeliveries,
} from '@forma/db';
import { LeadBuyerAck, LeadOwnerNotify } from '@forma/email';
import { Resend } from 'resend';
import { eq, and } from 'drizzle-orm';
import type { ConfiguratorSchema } from '@forma/types';

const FROM = process.env.RESEND_FROM ?? 'Forma <noreply@forma.studio>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.forma.studio';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured');
  return new Resend(key);
}

export const onLeadSubmitted = inngest.createFunction(
  { id: 'on-lead-submitted', name: 'On lead submitted', triggers: [{ event: 'lead/submitted' }] },
  async ({ event, step }) => {
    const { leadId, workspaceId, leadRef } = event.data as {
      leadId: string;
      workspaceId: string;
      leadRef: string;
    };

    // ── 1. Load lead ─────────────────────────────────────────────────
    const leadData = await step.run('load-lead', async () => {
      const [row] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
      if (!row) throw new Error(`Lead not found: ${leadId}`);
      return {
        versionId: row.versionId,
        totalCents: Number(row.totalCents),
        currency: row.currency,
        score: row.score ?? 0,
        hot: row.hot ?? false,
        assigneeId: row.assigneeId,
        pricingBreakdown: row.pricingBreakdown as Array<{ label: string; amount: number; kind: string }>,
        configState: row.configState as Record<string, unknown>,
        contact: row.contact as { name: string; email: string; phone?: string },
      };
    });

    // ── 2. Load schema + workspace in parallel ────────────────────────
    const [schema, workspace] = await Promise.all([
      step.run('load-schema', async () => {
        const [row] = await db
          .select({ schema: configuratorVersions.schema })
          .from(configuratorVersions)
          .where(eq(configuratorVersions.id, leadData.versionId))
          .limit(1);
        return (row?.schema ?? null) as ConfiguratorSchema | null;
      }),
      step.run('load-workspace', async () => {
        const [row] = await db
          .select({
            name: workspaces.name,
            brandPrimary: workspaces.brandPrimary,
            brandLogoUrl: workspaces.brandLogoUrl,
          })
          .from(workspaces)
          .where(eq(workspaces.id, workspaceId))
          .limit(1);
        return row ?? null;
      }),
    ]);

    // ── 3. Buyer acknowledgement ──────────────────────────────────────
    await step.run('send-buyer-ack', async () => {
      await getResend().emails.send({
        from: FROM,
        to: leadData.contact.email,
        subject: `Your ${schema?.name ?? 'enquiry'} — ${leadRef}`,
        react: (
          <LeadBuyerAck
            buyerName={leadData.contact.name}
            leadRef={leadRef}
            configuratorName={schema?.name ?? ''}
            totalCents={leadData.totalCents}
            currency={leadData.currency}
            breakdown={leadData.pricingBreakdown}
            workspaceName={workspace?.name ?? ''}
            primaryColor={workspace?.brandPrimary ?? '#0a0a0a'}
            logoUrl={workspace?.brandLogoUrl ?? undefined}
          />
        ),
      });
    });

    // ── 4. Owner notification ─────────────────────────────────────────
    await step.run('send-owner-notify', async () => {
      let toEmail: string | null = null;
      let assigneeName = 'Team';

      if (leadData.assigneeId) {
        const [u] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, leadData.assigneeId))
          .limit(1);
        toEmail = u?.email ?? null;
        assigneeName = u?.name ?? 'Team';
      } else {
        const [owner] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .innerJoin(memberships, eq(memberships.userId, users.id))
          .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.role, 'owner')))
          .limit(1);
        toEmail = owner?.email ?? null;
        assigneeName = owner?.name ?? 'Team';
      }

      if (!toEmail) return;

      const configFields: Array<{ label: string; value: string }> = [];
      if (schema) {
        for (const s of schema.steps) {
          for (const field of s.fields) {
            if (field.type === 'email' || field.type === 'phone') continue;
            const val = leadData.configState[field.id];
            if (val === undefined || val === null || val === '') continue;
            const str = Array.isArray(val)
              ? val.join(', ')
              : typeof val === 'boolean'
                ? (val ? 'Yes' : 'No')
                : String(val);
            configFields.push({ label: field.label, value: str });
          }
        }
      }

      await getResend().emails.send({
        from: FROM,
        to: toEmail,
        subject: `${leadData.hot ? '🔥 HOT ' : ''}New lead — ${leadData.contact.name}`,
        react: (
          <LeadOwnerNotify
            assigneeName={assigneeName}
            leadRef={leadRef}
            buyerName={leadData.contact.name}
            buyerEmail={leadData.contact.email}
            buyerPhone={leadData.contact.phone}
            configuratorName={schema?.name ?? ''}
            totalCents={leadData.totalCents}
            currency={leadData.currency}
            score={leadData.score}
            hot={leadData.hot}
            configFields={configFields}
            breakdown={leadData.pricingBreakdown}
            leadUrl={`${APP_URL}/leads/${leadId}`}
            workspaceName={workspace?.name ?? ''}
          />
        ),
      });
    });

    // ── 5. Webhook fanout ─────────────────────────────────────────────
    await step.run('dispatch-webhooks', async () => {
      const allWebhooks = await db
        .select()
        .from(webhooks)
        .where(and(eq(webhooks.workspaceId, workspaceId), eq(webhooks.enabled, true)));

      const triggered = allWebhooks.filter(wh =>
        (wh.events as string[]).includes('lead.created'),
      );
      if (triggered.length === 0) return;

      const payload = JSON.stringify({
        event: 'lead.created',
        leadId,
        leadRef,
        workspaceId,
        timestamp: new Date().toISOString(),
        data: {
          contact: leadData.contact,
          score: leadData.score,
          hot: leadData.hot,
          totalCents: leadData.totalCents,
          currency: leadData.currency,
        },
      });

      await Promise.all(
        triggered.map(async (wh) => {
          const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(wh.secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign'],
          );
          const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
          const sig = `sha256=${Array.from(new Uint8Array(sigBuf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')}`;

          let statusCode: number | null = null;
          let responseBody: string | null = null;

          try {
            const res = await fetch(wh.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Forma-Signature': sig,
                'X-Forma-Event': 'lead.created',
              },
              body: payload,
              signal: AbortSignal.timeout(10_000),
            });
            statusCode = res.status;
            responseBody = await res.text().catch(() => null);
          } catch (err) {
            responseBody = err instanceof Error ? err.message : 'network error';
          }

          const deliveryId = `del_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
          await db.insert(webhookDeliveries).values({
            id: deliveryId,
            webhookId: wh.id,
            workspaceId,
            event: 'lead.created',
            payload: JSON.parse(payload) as Record<string, unknown>,
            statusCode,
            responseBody: responseBody?.slice(0, 2000) ?? null,
            deliveredAt: statusCode !== null && statusCode < 300 ? new Date() : null,
          });
        }),
      );
    });
  },
);
