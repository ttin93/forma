import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { configurators } from '@forma/db';
import { eq } from 'drizzle-orm';
import { createLead } from '@forma/services';
import { inngest } from '@/lib/inngest';

const CORS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  city: z.string().optional(),
  consent: z.boolean().optional(),
});

const bodySchema = z.object({
  versionId: z.string().min(1),
  state: z.record(z.string(), z.unknown()),
  contact: contactSchema.optional(),
  sessionId: z.string().optional(),
  honeypot: z.string().optional(),
});

function extractContact(state: Record<string, unknown>) {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const name = str(state.name ?? state.full_name ?? state.first_name ?? state.ime ?? state.naziv);
  const email = str(state.email ?? state['e-mail'] ?? state.email_address);
  const phone = str(state.phone ?? state.phone_number ?? state.telefon ?? state.tel);
  const city = str(state.city ?? state.mesto ?? state.town);
  return { name: name || 'Unknown', email, phone: phone || undefined, city: city || undefined };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400, headers: CORS });
  }

  const { honeypot, contact: explicitContact, ...data } = parsed.data;
  const contact = explicitContact ?? extractContact(data.state);
  if (!contact.email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400, headers: CORS });
  }
  if (honeypot && honeypot.trim().length > 0) {
    return NextResponse.json({ ref: 'OK', total: 0, currency: 'EUR' }, { headers: CORS });
  }

  const [cfg] = await db
    .select({ id: configurators.id, workspaceId: configurators.workspaceId, status: configurators.status })
    .from(configurators)
    .where(eq(configurators.id, id))
    .limit(1);

  if (!cfg || cfg.status !== 'live') {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS });
  }

  const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? 'unknown';

  let leadId: string;
  let leadRef: string;
  let totalCents: bigint;
  let currency: string;

  try {
    ({ leadId, leadRef, totalCents, currency } = await createLead(
      { db, workspaceId: cfg.workspaceId },
      {
        configuratorId: id,
        versionId: data.versionId,
        state: data.state,
        contact,
        meta: {
          host: origin,
          path: req.headers.get('referer') ?? '/',
          referrer: req.headers.get('referer') ?? undefined,
          userAgent: req.headers.get('user-agent') ?? undefined,
          ipCountry: req.headers.get('x-vercel-ip-country') ?? undefined,
        },
        sessionId: data.sessionId,
      },
    ));
  } catch (err) {
    console.error({ err, configuratorId: id }, 'createLead failed');
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: CORS });
  }

  // Background job failure must not block the response — lead is already persisted
  inngest.send({
    name: 'lead/submitted',
    data: { leadId, workspaceId: cfg.workspaceId, leadRef },
  }).catch(err => console.error({ err, leadId }, 'inngest.send failed'));

  return NextResponse.json(
    { ref: leadRef, total: Number(totalCents), currency },
    { status: 201, headers: CORS },
  );
}
